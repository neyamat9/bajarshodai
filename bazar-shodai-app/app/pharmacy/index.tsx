import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/ui/Icon';
import { Radius } from '@/constants/layout';
import {
  fetchMedicinesApi,
  fetchMedicineFacetsApi,
  MedicineQueryParams,
} from '@/features/pharmacy/api/pharmacyApi';
import { useHomeCategories } from '@/features/home/api/useHomeData';
import { MedicineInfoSheet } from '@/features/pharmacy/components/MedicineInfoSheet';
import {
  MedicineFilterModal,
  MedicineFiltersState,
} from '@/components/medicine/MedicineFilterModal';
import { MedicineListItem, MedicineItemData } from '@/components/medicine/MedicineListItem';
import { MedicineMetaData } from '@/features/pharmacy/types';
import { useCartStore } from '@/store/useCartStore';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';
import { assetUrl } from '@/utils/format';

type FilterType = 'ALL' | 'OTC' | 'PRESCRIPTION';

export default function PharmacyCatalogScreen() {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const cartItems = useCartStore((s) => s.items);
  const cartItemCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));

  const [activeType, setActiveType] = useState<FilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<MedicineFiltersState>({});
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<{
    name: string;
    slug?: string;
    price: number;
    meta: MedicineMetaData;
  } | null>(null);

  // 1. Fetch Categories for Dosage Form subcategories
  const { data: rawCategories = [] } = useHomeCategories();
  const medicineCategory = useMemo(() => {
    return Array.isArray(rawCategories)
      ? rawCategories.find(
          (c) =>
            c.slug === 'medicine' ||
            c.slug.includes('medicine') ||
            c.name.toLowerCase().includes('medicine') ||
            c.nameBn?.includes('ওষুধ'),
        )
      : null;
  }, [rawCategories]);

  const subCategories = useMemo(() => {
    return (
      medicineCategory?.children ||
      (medicineCategory as any)?.subCategories ||
      []
    );
  }, [medicineCategory]);

  // 2. Fetch Facets (Pharma Companies, Generic Molecules, Price Range)
  const { data: facetsData } = useQuery({
    queryKey: ['medicine-facets'],
    queryFn: fetchMedicineFacetsApi,
    staleTime: 1000 * 60 * 10,
  });

  const brands = facetsData?.brands || [];
  const generics = facetsData?.generics || [];

  // 3. Fetch Medicines with active filters
  const queryParams: MedicineQueryParams = useMemo(() => {
    return {
      type: activeType,
      search: searchQuery.trim() || undefined,
      subCategory: filters.subCategory,
      brand: filters.brand,
      generic: filters.generic,
      inStock: filters.inStockOnly ? true : undefined,
      sortBy: filters.sortBy || 'popular',
    };
  }, [activeType, searchQuery, filters]);

  const {
    data: apiMedicines = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['pharmacy-medicines', queryParams],
    queryFn: () => fetchMedicinesApi(queryParams),
    staleTime: 1000 * 60 * 2,
  });

  const medicinesList: MedicineItemData[] = useMemo(() => {
    return apiMedicines.map((m: any) => {
      const rawImage =
        m.image || m.imageUrl || m.images?.[0]?.url || m.primaryImage?.url;
      const isUntracked = m.trackStock === false;
      const inStock =
        m.inStock !== false &&
        (isUntracked || m.stock === undefined || Number(m.stock) > 0);

      return {
        id: m.id,
        name: m.name,
        nameBn: m.nameBn ?? undefined,
        slug: m.slug,
        price: Number(m.sellingPrice ?? m.price ?? 0),
        originalPrice: m.regularPrice ? Number(m.regularPrice) : undefined,
        genericName:
          m.medicineMeta?.genericName || m.brand?.name || 'General Medicine',
        dosageForm: m.medicineMeta?.dosageForm || 'Tablet',
        strength: m.medicineMeta?.strength || '',
        manufacturer:
          m.medicineMeta?.manufacturer || m.brand?.name || 'Licensed Pharma',
        isPrescriptionRequired: Boolean(m.medicineMeta?.isPrescriptionRequired),
        unit: m.unit?.shortLabelBn || m.unit?.shortLabel || 'pack',
        stock: m.stock ? Number(m.stock) : undefined,
        trackStock: m.trackStock,
        inStock,
        imageUrl: assetUrl(rawImage),
      };
    });
  }, [apiMedicines]);

  const activeFilterCount = [
    filters.subCategory,
    filters.brand,
    filters.generic,
    filters.inStockOnly ? 'stock' : undefined,
  ].filter(Boolean).length;

  const handleAddToCart = (item: MedicineItemData) => {
    if (item.isPrescriptionRequired) {
      toast.warning('Prescription Required', 'Please upload a prescription for this medicine');
      router.push('/prescription/upload');
      return;
    }

    addItem(
      {
        id: item.id,
        productId: item.id,
        name: item.nameBn || item.name,
        price: item.price,
        unit: item.unit,
        imageUrl: item.imageUrl,
      },
      1,
    );
    toast.success('Cart', `${item.nameBn || item.name} ব্যাগে যোগ করা হয়েছে`);
  };

  const handleOpenInfo = (item: MedicineItemData) => {
    haptics.light();
    setSelectedMedicine({
      name: item.nameBn || item.name,
      slug: item.slug,
      price: item.price,
      meta: {
        genericName: item.genericName || 'General',
        dosageForm: item.dosageForm || 'Tablet',
        strength: item.strength || '',
        manufacturer: item.manufacturer || 'Licensed Pharma',
        isPrescriptionRequired: item.isPrescriptionRequired,
      },
    });
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* ── Top Header ────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Icon name="ArrowLeft" size={22} color="#0b6234" />
        </TouchableOpacity>

        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>Online Pharmacy</Text>
          <Text style={styles.headerSubtitle}>ঔষধ ও ফার্মেসী সেবা</Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(tabs)/cart')}
          style={styles.cartBtn}
          accessibilityRole="button"
          accessibilityLabel="Cart"
        >
          <Icon name="ShoppingBag" size={22} color="#0b6234" />
          {cartItemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {cartItemCount > 99 ? '99+' : cartItemCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={medicinesList}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              void refetch();
            }}
            colors={['#0b6234']}
            tintColor="#0b6234"
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {/* ── Upload Prescription Hero Banner ───────────────────── */}
            <View style={styles.rxHeroCard}>
              <View style={styles.rxHeroContent}>
                <View style={styles.rxPill}>
                  <Icon name="Shield" size={13} color="#0b6234" />
                  <Text style={styles.rxPillText}>রেজিস্টার্ড ফার্মাসিস্ট দ্বারা ভেরিফাইড</Text>
                </View>

                <Text style={styles.rxHeroTitle}>ডাক্তারের প্রেসক্রিপশন আছে?</Text>
                <Text style={styles.rxHeroSubtitle}>
                  প্রেসক্রিপশনের ছবি তুলে পাঠান, আমাদের ফার্মাসিস্ট সঠিক ওষুধ আপনার দরজায় পৌঁছে দেবে।
                </Text>

                <TouchableOpacity
                  onPress={() => router.push('/prescription/upload')}
                  style={styles.rxUploadBtn}
                  activeOpacity={0.8}
                >
                  <Icon name="Camera" size={15} color="#0b6234" />
                  <Text style={styles.rxUploadBtnText}>প্রেসক্রিপশন আপলোড করুন</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Dedicated Medicine Search Bar ─────────────────────── */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Icon name="Search" size={18} color="#0b6234" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="ওষুধের নাম (Napa) বা জেনেরিক (Paracetamol) খুঁজুন..."
                  placeholderTextColor="#94a3b8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                    <Icon name="X" size={16} color="#64748b" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* ── Filter Controls Row ───────────────────────────────── */}
            <View style={styles.controlsRow}>
              {/* Filter Button */}
              <TouchableOpacity
                onPress={() => setFilterModalVisible(true)}
                style={[
                  styles.filterBtn,
                  activeFilterCount > 0 && styles.filterBtnActive,
                ]}
                activeOpacity={0.8}
              >
                <Icon
                  name="Sliders"
                  size={14}
                  color={activeFilterCount > 0 ? '#ffffff' : '#0b6234'}
                />
                <Text
                  style={[
                    styles.filterBtnText,
                    activeFilterCount > 0 && styles.filterBtnTextActive,
                  ]}
                >
                  ফিল্টার {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
                </Text>
              </TouchableOpacity>

              {/* Type Toggle Pills */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.typeScroll}
              >
                {(
                  [
                    { id: 'ALL', label: 'সব ওষুধ' },
                    { id: 'OTC', label: 'ওটিসি (প্রেসক্রিপশন ছাড়া)' },
                    { id: 'PRESCRIPTION', label: 'প্রেসক্রিপশন আবশ্যক (Rx)' },
                  ] as { id: FilterType; label: string }[]
                ).map((t) => {
                  const isSelected = activeType === t.id;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      onPress={() => {
                        haptics.selection();
                        setActiveType(t.id);
                      }}
                      style={[
                        styles.typePill,
                        isSelected && styles.typePillActive,
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.typePillText,
                          isSelected && styles.typePillTextActive,
                        ]}
                      >
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* ── Active Filter Tags (if any selected) ──────────────── */}
            {activeFilterCount > 0 && (
              <View style={styles.activeTagsRow}>
                {filters.subCategory && (
                  <View style={styles.activeTag}>
                    <Text style={styles.activeTagText}>
                      ধরন: {filters.subCategory}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        setFilters((prev) => ({ ...prev, subCategory: undefined }))
                      }
                    >
                      <Icon name="X" size={12} color="#0b6234" />
                    </TouchableOpacity>
                  </View>
                )}
                {filters.brand && (
                  <View style={styles.activeTag}>
                    <Text style={styles.activeTagText}>কোম্পানি: {filters.brand}</Text>
                    <TouchableOpacity
                      onPress={() =>
                        setFilters((prev) => ({ ...prev, brand: undefined }))
                      }
                    >
                      <Icon name="X" size={12} color="#0b6234" />
                    </TouchableOpacity>
                  </View>
                )}
                {filters.generic && (
                  <View style={styles.activeTag}>
                    <Text style={styles.activeTagText}>জেনেরিক: {filters.generic}</Text>
                    <TouchableOpacity
                      onPress={() =>
                        setFilters((prev) => ({ ...prev, generic: undefined }))
                      }
                    >
                      <Icon name="X" size={12} color="#0b6234" />
                    </TouchableOpacity>
                  </View>
                )}
                <TouchableOpacity
                  onPress={() => setFilters({})}
                  style={styles.clearAllBtn}
                >
                  <Text style={styles.clearAllText}>মুছে ফেলুন</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const cartItem = cartItems.find((i) => i.productId === item.id);
          return (
            <MedicineListItem
              product={item}
              quantityInCart={cartItem?.quantity}
              onPress={() => handleOpenInfo(item)}
              onAddToCart={() => handleAddToCart(item)}
              onQuantityChange={(newQty) => {
                if (!cartItem) return;
                if (newQty <= 0) {
                  removeItem(cartItem.id);
                } else {
                  updateQuantity(cartItem.id, newQty);
                }
              }}
            />
          );
        }}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator color="#0b6234" size="large" />
              <Text style={styles.emptyText}>ওষুধের তালিকা লোড হচ্ছে...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="Search" size={38} color="#94a3b8" />
              <Text style={styles.emptyTitle}>কোনো ওষুধ পাওয়া যায়নি</Text>
              <Text style={styles.emptyText}>
                বানান যাচাই করুন অথবা অন্য কোনো জেনেরিক বা কোম্পানির নামে খুঁজুন।
              </Text>
              {(searchQuery.length > 0 || activeFilterCount > 0) && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setFilters({});
                    setActiveType('ALL');
                  }}
                  style={styles.resetFiltersBtn}
                >
                  <Text style={styles.resetFiltersBtnText}>সব ফিল্টার রিসেট করুন</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }
      />

      {/* ── Medicine Clinical Detail Bottom Sheet ──────────────────── */}
      {selectedMedicine && (
        <MedicineInfoSheet
          visible={Boolean(selectedMedicine)}
          medicineName={selectedMedicine.name}
          slug={selectedMedicine.slug}
          meta={selectedMedicine.meta}
          price={selectedMedicine.price}
          onClose={() => setSelectedMedicine(null)}
          onViewFullDetails={(slug) => router.push(`/product/${slug}`)}
          onAddToCart={() => {
            addItem(
              {
                id: selectedMedicine.name,
                productId: selectedMedicine.name,
                name: selectedMedicine.name,
                price: selectedMedicine.price,
              },
              1,
            );
            toast.success('Cart', `${selectedMedicine.name} ব্যাগে যোগ করা হয়েছে`);
          }}
          onUploadPrescription={() => router.push('/prescription/upload')}
        />
      )}

      {/* ── Faceted Medicine Filter Modal ──────────────────────────── */}
      <MedicineFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filters={filters}
        onApply={(newFilters) => setFilters(newFilters)}
        onReset={() => setFilters({})}
        brands={brands}
        generics={generics}
        subCategories={subCategories}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    backgroundColor: '#f1f5f9',
  },
  headerTitleCol: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#0b6234',
    fontWeight: '600',
  },
  cartBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    backgroundColor: '#f1f5f9',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#dc2626',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  listContent: {
    paddingBottom: 40,
  },
  listHeader: {
    paddingBottom: 8,
  },
  rxHeroCard: {
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 10,
    backgroundColor: '#0b6234',
    borderRadius: Radius.brand,
    padding: 14,
  },
  rxHeroContent: {
    gap: 6,
  },
  rxPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    gap: 5,
    marginBottom: 4,
  },
  rxPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0b6234',
  },
  rxHeroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  rxHeroSubtitle: {
    fontSize: 11.5,
    color: '#dcfce7',
    lineHeight: 16,
    marginBottom: 6,
  },
  rxUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.brand,
    gap: 6,
  },
  rxUploadBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0b6234',
  },
  searchContainer: {
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#a7f3d0',
    borderRadius: Radius.brand,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    shadowColor: '#0b6234',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#0f172a',
    padding: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
    marginBottom: 8,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.brand,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 5,
  },
  filterBtnActive: {
    backgroundColor: '#0b6234',
    borderColor: '#0b6234',
  },
  filterBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0b6234',
  },
  filterBtnTextActive: {
    color: '#ffffff',
  },
  typeScroll: {
    gap: 6,
    paddingRight: 14,
  },
  typePill: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: Radius.brand,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  typePillActive: {
    backgroundColor: '#0b6234',
    borderColor: '#0b6234',
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  typePillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  activeTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    gap: 6,
    alignItems: 'center',
    marginBottom: 6,
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.brand,
    gap: 4,
  },
  activeTagText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#0b6234',
  },
  clearAllBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  clearAllText: {
    fontSize: 10.5,
    color: '#dc2626',
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#334155',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  resetFiltersBtn: {
    marginTop: 14,
    backgroundColor: '#0b6234',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.brand,
  },
  resetFiltersBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});

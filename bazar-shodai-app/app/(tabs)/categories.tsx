import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/ui/Icon';
import { AppImage } from '@/components/ui/AppImage';
import { ProductGridCard, ProductGridItem } from '@/components/product/ProductGridCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useHomeCategories } from '@/features/home/api/useHomeData';
import { fetchProductsApi } from '@/features/products/api/productsApi';
import { useCartStore } from '@/store/useCartStore';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';
import { assetUrl } from '@/utils/format';

type SortOption = 'popular' | 'newest' | 'price_asc' | 'price_desc';

const SORT_OPTIONS: { id: SortOption; label: string; icon: string }[] = [
  { id: 'popular', label: 'জনপ্রিয়', icon: 'Flame' },
  { id: 'newest', label: 'নতুন', icon: 'Sparkles' },
  { id: 'price_asc', label: 'কম দাম', icon: 'ArrowDown' },
  { id: 'price_desc', label: 'বেশি দাম', icon: 'ArrowUp' },
];

export default function ShopScreen() {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const cartItems = useCartStore((s) => s.items);

  const { data: rawCategories = [], isLoading: categoriesLoading } = useHomeCategories();
  const categories = useMemo(
    () => (Array.isArray(rawCategories) ? rawCategories : []),
    [rawCategories],
  );

  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [selectedSubCategorySlug, setSelectedSubCategorySlug] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [onlyOnSale, setOnlyOnSale] = useState(false);

  const activeCategory = selectedCategorySlug
    ? categories.find((c) => c.slug === selectedCategorySlug)
    : null;

  const subCategories =
    activeCategory?.children || (activeCategory as any)?.subCategories || [];

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: [
      'shop-products',
      selectedCategorySlug,
      selectedSubCategorySlug,
      sortBy,
      onlyInStock,
      onlyOnSale,
    ],
    queryFn: () =>
      fetchProductsApi({
        category: selectedCategorySlug ?? undefined,
        subCategory: selectedSubCategorySlug ?? undefined,
        sortBy,
        inStock: onlyInStock ? true : undefined,
        limit: 50,
      }),
    staleTime: 1000 * 60 * 2,
  });

  const products = useMemo(() => {
    const rawProducts =
      (productsData as any)?.data ?? (Array.isArray(productsData) ? productsData : []);
    let list = Array.isArray(rawProducts) ? [...rawProducts] : [];
    if (onlyOnSale) {
      list = list.filter((p: any) => {
        const price = Number(p.sellingPrice ?? p.price ?? 0);
        const regular = Number(p.regularPrice ?? 0);
        return (p.discountPercent && p.discountPercent > 0) || regular > price;
      });
    }
    return list;
  }, [productsData, onlyOnSale]);

  const handleSelectCategory = (slug: string | null) => {
    haptics.selection();
    setSelectedCategorySlug(slug);
    setSelectedSubCategorySlug(null);
  };

  const handleSelectSubCategory = (slug: string | null) => {
    haptics.selection();
    setSelectedSubCategorySlug(slug);
  };

  const handleToggleSort = (opt: SortOption) => {
    haptics.selection();
    setSortBy(opt);
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      {/* ── Top Header ────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Shop • শপ</Text>
          <Text style={styles.headerSubtitle}>
            {activeCategory ? (activeCategory.nameBn || activeCategory.name) : 'All Products • সব পণ্য'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/search')}
          style={styles.searchBtn}
          accessibilityRole="button"
          accessibilityLabel="Search products"
        >
          <Icon name="Search" size={18} color="#0b6234" />
        </TouchableOpacity>
      </View>

      {/* ── Thin Top Category Bar ──────────────────────────────────── */}
      <View style={styles.categoryBarWrapper}>
        {categoriesLoading ? (
          <ActivityIndicator size="small" color="#0b6234" style={{ paddingVertical: 8 }} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryBarContent}>
            {/* "All" Chip */}
            <TouchableOpacity
              onPress={() => handleSelectCategory(null)}
              style={[
                styles.categoryChip,
                selectedCategorySlug === null ? styles.categoryChipActive : null,
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategorySlug === null ? styles.categoryChipTextActive : null,
                ]}
              >
                সব পণ্য
              </Text>
            </TouchableOpacity>

            {/* Individual Category Chips */}
            {categories.map((cat) => {
              const isSelected = selectedCategorySlug === cat.slug;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => handleSelectCategory(cat.slug)}
                  style={[styles.categoryChip, isSelected ? styles.categoryChipActive : null]}
                  activeOpacity={0.7}
                >
                  {cat.image || cat.icon ? (
                    <View style={styles.chipIconSlot}>
                      <AppImage
                        source={cat.image || cat.icon}
                        aspectRatio={1}
                        borderRadius={10}
                      />
                    </View>
                  ) : null}
                  <Text
                    style={[
                      styles.categoryChipText,
                      isSelected ? styles.categoryChipTextActive : null,
                    ]}
                  >
                    {cat.nameBn || cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* ── Subcategory Thin Bar (shown when category has children) ──── */}
      {subCategories.length > 0 && (
        <View style={styles.subCategoryBarWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subCategoryBarContent}>
            <TouchableOpacity
              onPress={() => handleSelectSubCategory(null)}
              style={[
                styles.subCategoryChip,
                selectedSubCategorySlug === null ? styles.subCategoryChipActive : null,
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.subCategoryChipText,
                  selectedSubCategorySlug === null ? styles.subCategoryChipTextActive : null,
                ]}
              >
                সব {activeCategory?.nameBn || activeCategory?.name}
              </Text>
            </TouchableOpacity>

            {subCategories.map((sub: any) => {
              const isSelected = selectedSubCategorySlug === sub.slug;
              return (
                <TouchableOpacity
                  key={sub.id || sub.slug}
                  onPress={() => handleSelectSubCategory(sub.slug)}
                  style={[styles.subCategoryChip, isSelected ? styles.subCategoryChipActive : null]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.subCategoryChipText,
                      isSelected ? styles.subCategoryChipTextActive : null,
                    ]}
                  >
                    {sub.nameBn || sub.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* ── Secondary Filter & Sort Bar ────────────────────────────── */}
      <View style={styles.filterSortBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterSortContent}>
          {/* Sort Options */}
          {SORT_OPTIONS.map((opt) => {
            const isSelected = sortBy === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                onPress={() => handleToggleSort(opt.id)}
                style={[styles.filterPill, isSelected ? styles.filterPillActive : null]}
                activeOpacity={0.7}
              >
                <Icon
                  name={opt.icon as any}
                  size={12}
                  color={isSelected ? '#0b6234' : '#6b7280'}
                />
                <Text style={[styles.filterPillText, isSelected ? styles.filterPillTextActive : null]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          <View style={styles.divider} />

          {/* On Sale Filter */}
          <TouchableOpacity
            onPress={() => {
              haptics.selection();
              setOnlyOnSale(!onlyOnSale);
            }}
            style={[styles.filterPill, onlyOnSale ? styles.filterPillActiveRed : null]}
            activeOpacity={0.7}
          >
            <Icon name="Tag" size={12} color={onlyOnSale ? '#dc2626' : '#6b7280'} />
            <Text
              style={[
                styles.filterPillText,
                onlyOnSale ? { color: '#dc2626', fontWeight: '700' } : null,
              ]}
            >
              অফার
            </Text>
          </TouchableOpacity>

          {/* In Stock Filter */}
          <TouchableOpacity
            onPress={() => {
              haptics.selection();
              setOnlyInStock(!onlyInStock);
            }}
            style={[styles.filterPill, onlyInStock ? styles.filterPillActive : null]}
            activeOpacity={0.7}
          >
            <Icon name="CheckCircle" size={12} color={onlyInStock ? '#0b6234' : '#6b7280'} />
            <Text style={[styles.filterPillText, onlyInStock ? styles.filterPillTextActive : null]}>
              স্টকে আছে
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ── Full Width 2-Column Product Grid ────────────────────────── */}
      {productsLoading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color="#0b6234" />
          <Text style={styles.loaderText}>পণ্য লোড হচ্ছে...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const cartItem = cartItems.find((i) => i.productId === item.id);
            const rawImage =
              item.image ||
              item.imageUrl ||
              item.images?.[0]?.url ||
              item.primaryImage?.url;

            const price = Number(item.price ?? item.sellingPrice ?? 0);
            const regularPrice = item.regularPrice ? Number(item.regularPrice) : undefined;
            const discount =
              item.discountPercent ??
              (regularPrice && regularPrice > price
                ? Math.round(((regularPrice - price) / regularPrice) * 100)
                : undefined);

            const isUntracked = item.trackStock === false;
            const inStock =
              item.inStock !== false &&
              (isUntracked || item.stock === undefined || Number(item.stock) > 0);

            const gridItem: ProductGridItem = {
              id: item.id,
              name: item.name,
              banglaName: item.nameBn ?? undefined,
              slug: item.slug,
              price,
              originalPrice: regularPrice,
              imageUrl: assetUrl(rawImage),
              unit: item.unit?.shortLabelBn || item.unit?.shortLabel || 'kg',
              packSize: item.packSize ?? undefined,
              stock: item.stock ? Number(item.stock) : undefined,
              trackStock: isUntracked,
              inStock,
              discountPercent: discount,
              badge: item.isHot ? 'HOT' : item.isNew ? 'NEW' : undefined,
            };

            return (
              <View style={styles.gridCol}>
                <ProductGridCard
                  product={gridItem}
                  quantityInCart={cartItem?.quantity}
                  onPress={() => router.push(`/product/${item.slug}`)}
                  onAddToCart={() => {
                    addItem(
                      {
                        id: item.id,
                        productId: item.id,
                        name: gridItem.banglaName || gridItem.name,
                        price: gridItem.price,
                        unit: gridItem.unit,
                        imageUrl: gridItem.imageUrl,
                      },
                      item.unit?.minQty ? Number(item.unit.minQty) : 1,
                    );
                    toast.success('Cart', `${gridItem.banglaName || gridItem.name} added`);
                  }}
                  onQuantityChange={(newQty) => {
                    if (!cartItem) return;
                    if (newQty <= 0) {
                      removeItem(cartItem.id);
                    } else {
                      updateQuantity(cartItem.id, newQty);
                    }
                  }}
                />
              </View>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              title="কোন পণ্য পাওয়া যায়নি"
              description="আপনার বাছাই করা ফিল্টারে বর্তমানে কোনো পণ্য নেই।"
              actionLabel="সব পণ্য দেখুন"
              onAction={() => {
                setSelectedCategorySlug(null);
                setSelectedSubCategorySlug(null);
                setOnlyOnSale(false);
                setOnlyInStock(false);
              }}
            />
          }
        />
      )}
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  searchBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  categoryBarWrapper: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  categoryBarContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: '#0b6234',
    borderColor: '#0b6234',
  },
  chipIconSlot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    overflow: 'hidden',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  categoryChipTextActive: {
    color: '#ffffff',
  },
  subCategoryBarWrapper: {
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  subCategoryBarContent: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  subCategoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  subCategoryChipActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  subCategoryChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#475569',
  },
  subCategoryChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  filterSortBar: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterSortContent: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    alignItems: 'center',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  filterPillActive: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  filterPillActiveRed: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
  },
  filterPillTextActive: {
    color: '#0b6234',
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 4,
  },
  gridContent: {
    padding: 10,
    paddingBottom: 32,
  },
  gridRow: {
    gap: 10,
    marginBottom: 10,
  },
  gridCol: {
    flex: 1,
  },
  loaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loaderText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
});

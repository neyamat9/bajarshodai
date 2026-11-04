import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { Price } from '@/components/ui/Price';
import { Button } from '@/components/ui/Button';
import { Radius } from '@/constants/layout';
import { fetchMedicinesApi } from '@/features/pharmacy/api/pharmacyApi';
import { MedicineInfoSheet } from '@/features/pharmacy/components/MedicineInfoSheet';
import { MedicineMetaData } from '@/features/pharmacy/types';
import { useCartStore } from '@/store/useCartStore';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';

type FilterType = 'ALL' | 'OTC' | 'PRESCRIPTION';

interface MockMedicine {
  id: string;
  name: string;
  nameBn?: string;
  genericName: string;
  dosageForm: string;
  strength: string;
  manufacturer: string;
  price: number;
  isPrescriptionRequired: boolean;
  unit: string;
}

const FALLBACK_MEDICINES: MockMedicine[] = [
  {
    id: 'med-1',
    name: 'Napa Extra',
    nameBn: 'নাপা এক্সট্রা',
    genericName: 'Paracetamol + Caffeine',
    dosageForm: 'Tablet',
    strength: '500mg + 65mg',
    manufacturer: 'Beximco Pharmaceuticals Ltd.',
    price: 35,
    isPrescriptionRequired: false,
    unit: 'strip (10 pcs)',
  },
  {
    id: 'med-2',
    name: 'Seclo 20',
    nameBn: 'সেকলো ২০',
    genericName: 'Omeprazole',
    dosageForm: 'Capsule',
    strength: '20mg',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    price: 70,
    isPrescriptionRequired: false,
    unit: 'strip (10 pcs)',
  },
  {
    id: 'med-3',
    name: 'Azithromycin 500',
    nameBn: 'অ্যাজিথ্রোমাইসিন ৫০০',
    genericName: 'Azithromycin',
    dosageForm: 'Tablet',
    strength: '500mg',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    price: 180,
    isPrescriptionRequired: true,
    unit: 'strip (6 pcs)',
  },
  {
    id: 'med-4',
    name: 'Fexo 120',
    nameBn: 'ফেক্সো ১২০',
    genericName: 'Fexofenadine Hydrochloride',
    dosageForm: 'Tablet',
    strength: '120mg',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    price: 90,
    isPrescriptionRequired: false,
    unit: 'strip (10 pcs)',
  },
  {
    id: 'med-5',
    name: 'Montene 10',
    nameBn: 'মন্টিন ১০',
    genericName: 'Montelukast Sodium',
    dosageForm: 'Tablet',
    strength: '10mg',
    manufacturer: 'Incepta Pharmaceuticals Ltd.',
    price: 160,
    isPrescriptionRequired: true,
    unit: 'strip (10 pcs)',
  },
  {
    id: 'med-6',
    name: 'Ceevit',
    nameBn: 'সিভিট',
    genericName: 'Ascorbic Acid (Vitamin C)',
    dosageForm: 'Chewable Tablet',
    strength: '250mg',
    manufacturer: 'Square Pharmaceuticals Ltd.',
    price: 25,
    isPrescriptionRequired: false,
    unit: 'strip (10 pcs)',
  },
];

export default function PharmacyCatalogScreen() {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState<{
    name: string;
    price: number;
    meta: MedicineMetaData;
  } | null>(null);

  const {
    data: apiMedicines = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['pharmacy-medicines', activeFilter, searchQuery],
    queryFn: () => fetchMedicinesApi(activeFilter, searchQuery),
    staleTime: 1000 * 60 * 5,
  });

  // Combine API results with fallback if empty
  const medicinesList = React.useMemo(() => {
    if (apiMedicines.length > 0) {
      return apiMedicines.map((m: any) => ({
        id: m.id,
        name: m.name,
        nameBn: m.nameBn,
        genericName: m.medicineMeta?.genericName || 'General Medicine',
        dosageForm: m.medicineMeta?.dosageForm || 'Unit',
        strength: m.medicineMeta?.strength || '',
        manufacturer: m.medicineMeta?.manufacturer || m.brand?.name || 'Licensed Pharma',
        price: m.price,
        isPrescriptionRequired: Boolean(m.medicineMeta?.isPrescriptionRequired),
        unit: m.unit?.shortLabel || 'pack',
      }));
    }

    return FALLBACK_MEDICINES.filter((item) => {
      if (activeFilter === 'OTC' && item.isPrescriptionRequired) return false;
      if (activeFilter === 'PRESCRIPTION' && !item.isPrescriptionRequired) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.genericName.toLowerCase().includes(q) ||
          (item.nameBn && item.nameBn.includes(q))
        );
      }
      return true;
    });
  }, [apiMedicines, activeFilter, searchQuery]);

  const handleAddToCart = (item: (typeof medicinesList)[0]) => {
    if (item.isPrescriptionRequired) {
      toast.warning('Prescription Required', 'Please upload a prescription for this medicine');
      router.push('/prescription/upload');
      return;
    }

    addItem(
      {
        id: item.id,
        productId: item.id,
        name: item.name,
        price: item.price,
        unit: item.unit,
      },
      1,
    );
    toast.success('Added to Bag', `${item.name} added to cart`);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Top Header */}
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
          <Text style={styles.headerSubtitle}>ঔষধ ও প্রেসক্রিপশন সেবা</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/cart')}
          style={styles.cartBtn}
          accessibilityRole="button"
          accessibilityLabel="Go to cart"
        >
          <Icon name="ShoppingBag" size={22} color="#0b6234" />
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
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {/* Upload Prescription Hero Banner */}
            <View style={styles.rxHeroCard}>
              <View style={styles.rxHeroTextCol}>
                <View style={styles.rxPill}>
                  <Icon name="Shield" size={12} color="#0b6234" />
                  <Text style={styles.rxPillText}>Registered Pharmacist Verified</Text>
                </View>
                <Text style={styles.rxHeroTitle}>Have a Doctor&apos;s Prescription?</Text>
                <Text style={styles.rxHeroSubtitle}>
                  Snap a photo and get genuine medicines delivered safely to your doorstep.
                </Text>
                <Button
                  title="Upload Prescription"
                  variant="primary"
                  size="sm"
                  onPress={() => router.push('/prescription/upload')}
                  leftIcon={<Icon name="Camera" size={14} color="#ffffff" />}
                />
              </View>
            </View>

            {/* Search Input */}
            <View style={styles.searchBox}>
              <Icon name="Search" size={18} color="#9ca3af" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search medicine by brand or generic name..."
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Icon name="X" size={16} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Pills */}
            <View style={styles.filterPillsRow}>
              {(['ALL', 'OTC', 'PRESCRIPTION'] as FilterType[]).map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => {
                    haptics.selection();
                    setActiveFilter(f);
                  }}
                  style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      activeFilter === f && styles.filterPillTextActive,
                    ]}
                  >
                    {f === 'ALL' && 'All Medicines'}
                    {f === 'OTC' && 'OTC (No Rx)'}
                    {f === 'PRESCRIPTION' && 'Prescription Only (Rx)'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.medicineCard}>
            <View style={styles.cardMain}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.medName}>{item.name}</Text>
                  {item.nameBn && <Text style={styles.medNameBn}>{item.nameBn}</Text>}
                </View>
                {item.isPrescriptionRequired ? (
                  <Badge label="Rx REQUIRED" variant="tomato" size="sm" />
                ) : (
                  <Badge label="OTC" variant="fresh" size="sm" />
                )}
              </View>

              <Text style={styles.medGeneric}>
                {item.genericName} • {item.strength}
              </Text>
              <Text style={styles.medPharma}>{item.manufacturer}</Text>

              <View style={styles.cardFooter}>
                <Price amount={item.price} unit={item.unit} size="md" />

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    onPress={() => {
                      haptics.light();
                      setSelectedMedicine({
                        name: item.name,
                        price: item.price,
                        meta: {
                          genericName: item.genericName,
                          dosageForm: item.dosageForm,
                          strength: item.strength,
                          manufacturer: item.manufacturer,
                          isPrescriptionRequired: item.isPrescriptionRequired,
                        },
                      });
                    }}
                    style={styles.infoBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Medicine info"
                  >
                    <Icon name="Info" size={16} color="#0b6234" />
                    <Text style={styles.infoBtnText}>Details</Text>
                  </TouchableOpacity>

                  <Button
                    title={item.isPrescriptionRequired ? 'Upload Rx' : 'Add to Bag'}
                    variant={item.isPrescriptionRequired ? 'outline' : 'primary'}
                    size="sm"
                    onPress={() => handleAddToCart(item)}
                    leftIcon={
                      <Icon
                        name={item.isPrescriptionRequired ? 'FileText' : 'ShoppingBag'}
                        size={14}
                        color={item.isPrescriptionRequired ? '#0b6234' : '#ffffff'}
                      />
                    }
                  />
                </View>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator color="#0b6234" size="small" />
              <Text style={styles.emptyText}>Loading medicine catalog...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="Search" size={32} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No medicines found</Text>
              <Text style={styles.emptyText}>Try searching by generic name or dosage.</Text>
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Medicine Info Bottom Sheet */}
      {selectedMedicine && (
        <MedicineInfoSheet
          visible={Boolean(selectedMedicine)}
          medicineName={selectedMedicine.name}
          meta={selectedMedicine.meta}
          price={selectedMedicine.price}
          onClose={() => setSelectedMedicine(null)}
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
            toast.success('Added to Bag', `${selectedMedicine.name} added`);
          }}
          onUploadPrescription={() => router.push('/prescription/upload')}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backBtn: {
    padding: 6,
  },
  headerTitleCol: {
    flex: 1,
    marginHorizontal: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#0b6234',
    fontWeight: '600',
  },
  cartBtn: {
    padding: 6,
  },
  listContent: {
    paddingBottom: 40,
  },
  listHeader: {
    padding: 16,
    gap: 12,
  },
  rxHeroCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    padding: 16,
  },
  rxHeroTextCol: {
    gap: 8,
  },
  rxPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  rxPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0b6234',
  },
  rxHeroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#064e3b',
  },
  rxHeroSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: '#047857',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterPillActive: {
    backgroundColor: '#0b6234',
    borderColor: '#0b6234',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
  },
  filterPillTextActive: {
    color: '#ffffff',
  },
  medicineCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
  },
  cardMain: {
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  medName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  medNameBn: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 1,
  },
  medGeneric: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0b6234',
    marginTop: 2,
  },
  medPharma: {
    fontSize: 11,
    color: '#9ca3af',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    backgroundColor: '#f0fdf4',
  },
  infoBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0b6234',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  emptyText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

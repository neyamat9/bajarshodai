import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { Radius } from '@/constants/layout';
import { haptics } from '@/services/haptics';

export interface MedicineFiltersState {
  subCategory?: string;
  brand?: string;
  generic?: string;
  inStockOnly?: boolean;
  sortBy?: string;
}

export interface MedicineFilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: MedicineFiltersState;
  onApply: (filters: MedicineFiltersState) => void;
  onReset: () => void;
  brands: { id: string; name: string; slug: string; count: number }[];
  generics: { name: string; count: number }[];
  subCategories: { id: string; name: string; nameBn?: string; slug: string }[];
}

export function MedicineFilterModal({
  visible,
  onClose,
  filters: initialFilters,
  onApply,
  onReset,
  brands,
  generics,
  subCategories,
}: MedicineFilterModalProps) {
  const { height } = useWindowDimensions();

  const [prevVisible, setPrevVisible] = useState(visible);
  const [draft, setDraft] = useState<MedicineFiltersState>(initialFilters);
  const [brandSearch, setBrandSearch] = useState('');
  const [genericSearch, setGenericSearch] = useState('');

  // Synchronize draft when opening (React 19 render adjustment pattern)
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setDraft(initialFilters);
      setBrandSearch('');
      setGenericSearch('');
    }
  }

  const filteredBrands = React.useMemo(() => {
    if (!brandSearch.trim()) return brands;
    const lower = brandSearch.toLowerCase();
    return brands.filter((b) => b.name.toLowerCase().includes(lower));
  }, [brands, brandSearch]);

  const filteredGenerics = React.useMemo(() => {
    if (!genericSearch.trim()) return generics;
    const lower = genericSearch.toLowerCase();
    return generics.filter((g) => g.name.toLowerCase().includes(lower));
  }, [generics, genericSearch]);

  const activeCount = [
    draft.subCategory,
    draft.brand,
    draft.generic,
    draft.inStockOnly ? 'stock' : undefined,
    draft.sortBy && draft.sortBy !== 'popular' ? draft.sortBy : undefined,
  ].filter(Boolean).length;

  const handleApply = () => {
    haptics.selection();
    onApply(draft);
    onClose();
  };

  const handleReset = () => {
    haptics.light();
    setDraft({});
    onReset();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.backdropTouch}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.sheetContainer, { maxHeight: height * 0.88 }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Icon name="Sliders" size={18} color="#0b6234" />
              <Text style={styles.headerTitle}>Medicine Filters / ফিল্টার</Text>
              {activeCount > 0 && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>{activeCount}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="X" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* ── 1. Dosage Forms (Subcategories) ─────────────────── */}
            {subCategories.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dosage Form / ওষুধের ধরন</Text>
                <View style={styles.chipGrid}>
                  <TouchableOpacity
                    onPress={() => {
                      haptics.selection();
                      setDraft((prev) => ({ ...prev, subCategory: undefined }));
                    }}
                    style={[
                      styles.filterChip,
                      !draft.subCategory && styles.filterChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        !draft.subCategory && styles.chipTextActive,
                      ]}
                    >
                      সব ধরন (All)
                    </Text>
                  </TouchableOpacity>

                  {subCategories.map((sub) => {
                    const isSelected = draft.subCategory === sub.slug;
                    return (
                      <TouchableOpacity
                        key={sub.slug}
                        onPress={() => {
                          haptics.selection();
                          setDraft((prev) => ({
                            ...prev,
                            subCategory: isSelected ? undefined : sub.slug,
                          }));
                        }}
                        style={[
                          styles.filterChip,
                          isSelected && styles.filterChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            isSelected && styles.chipTextActive,
                          ]}
                        >
                          {sub.nameBn || sub.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ── 2. Pharmaceutical Brand / Manufacturer ───────────── */}
            {brands.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Pharmaceutical Company / প্রস্তুতকারক কোম্পানি
                </Text>
                <View style={styles.searchBox}>
                  <Icon name="Search" size={14} color="#94a3b8" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search pharma companies (e.g. Square, Beximco)..."
                    placeholderTextColor="#94a3b8"
                    value={brandSearch}
                    onChangeText={setBrandSearch}
                  />
                  {brandSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setBrandSearch('')}>
                      <Icon name="X" size={14} color="#94a3b8" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.listContainer}>
                  {filteredBrands.slice(0, 15).map((b) => {
                    const isSelected = draft.brand === b.slug;
                    return (
                      <TouchableOpacity
                        key={b.slug}
                        onPress={() => {
                          haptics.selection();
                          setDraft((prev) => ({
                            ...prev,
                            brand: isSelected ? undefined : b.slug,
                          }));
                        }}
                        style={[
                          styles.listItemRow,
                          isSelected && styles.listItemRowActive,
                        ]}
                      >
                        <View style={styles.checkSlot}>
                          {isSelected && <Icon name="Check" size={14} color="#0b6234" />}
                        </View>
                        <Text
                          style={[
                            styles.listItemLabel,
                            isSelected && styles.listItemLabelActive,
                          ]}
                          numberOfLines={1}
                        >
                          {b.name}
                        </Text>
                        <View style={styles.countPill}>
                          <Text style={styles.countPillText}>{b.count}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ── 3. Generic Name / Molecule ──────────────────────── */}
            {generics.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Generic Name / জেনেরিক উপাদান
                </Text>
                <View style={styles.searchBox}>
                  <Icon name="Search" size={14} color="#94a3b8" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search molecules (e.g. Paracetamol, Omeprazole)..."
                    placeholderTextColor="#94a3b8"
                    value={genericSearch}
                    onChangeText={setGenericSearch}
                  />
                  {genericSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setGenericSearch('')}>
                      <Icon name="X" size={14} color="#94a3b8" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.listContainer}>
                  {filteredGenerics.slice(0, 20).map((g) => {
                    const isSelected = draft.generic === g.name;
                    return (
                      <TouchableOpacity
                        key={g.name}
                        onPress={() => {
                          haptics.selection();
                          setDraft((prev) => ({
                            ...prev,
                            generic: isSelected ? undefined : g.name,
                          }));
                        }}
                        style={[
                          styles.listItemRow,
                          isSelected && styles.listItemRowActive,
                        ]}
                      >
                        <View style={styles.checkSlot}>
                          {isSelected && <Icon name="Check" size={14} color="#0b6234" />}
                        </View>
                        <Text
                          style={[
                            styles.listItemLabel,
                            isSelected && styles.listItemLabelActive,
                          ]}
                          numberOfLines={1}
                        >
                          {g.name}
                        </Text>
                        <View style={styles.countPill}>
                          <Text style={styles.countPillText}>{g.count}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ── 4. In Stock Toggle ─────────────────────────────── */}
            <View style={styles.section}>
              <TouchableOpacity
                onPress={() => {
                  haptics.selection();
                  setDraft((prev) => ({
                    ...prev,
                    inStockOnly: !prev.inStockOnly,
                  }));
                }}
                style={styles.toggleRow}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>In Stock Only / শুধুমাত্র স্টকে আছে</Text>
                  <Text style={styles.toggleSub}>Hide out-of-stock medicines</Text>
                </View>
                <View
                  style={[
                    styles.toggleSwitch,
                    draft.inStockOnly && styles.toggleSwitchActive,
                  ]}
                >
                  <View
                    style={[
                      styles.toggleKnob,
                      draft.inStockOnly && styles.toggleKnobActive,
                    ]}
                  />
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <SafeAreaView edges={['bottom']} style={styles.footer}>
            <TouchableOpacity
              onPress={handleReset}
              style={styles.resetBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.resetBtnText}>Clear All / রিসেট</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleApply}
              style={styles.applyBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.applyBtnText}>
                Apply Filters {activeCount > 0 ? `(${activeCount})` : ''}
              </Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  activeBadge: {
    backgroundColor: '#0b6234',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  activeBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.brand,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#0b6234',
    borderColor: '#0b6234',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: Radius.brand,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#0f172a',
    padding: 0,
  },
  listContainer: {
    maxHeight: 180,
    backgroundColor: '#ffffff',
    borderRadius: Radius.brand,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  listItemRowActive: {
    backgroundColor: '#f0fdf4',
  },
  checkSlot: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItemLabel: {
    flex: 1,
    fontSize: 12.5,
    color: '#334155',
    fontWeight: '500',
  },
  listItemLabelActive: {
    color: '#0b6234',
    fontWeight: '700',
  },
  countPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  countPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: Radius.brand,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  toggleSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#cbd5e1',
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: '#0b6234',
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 12,
    backgroundColor: '#ffffff',
  },
  resetBtn: {
    flex: 1,
    height: 44,
    borderRadius: Radius.brand,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  applyBtn: {
    flex: 2,
    height: 44,
    borderRadius: Radius.brand,
    backgroundColor: '#0b6234',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
});

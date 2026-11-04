import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Switch,
  StyleSheet,
} from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Radius } from '@/constants/layout';
import { haptics } from '@/services/haptics';

export interface FilterState {
  inStockOnly: boolean;
  minPrice?: number;
  maxPrice?: number;
  selectedBrand?: string;
}

export interface FilterBottomSheetProps {
  visible: boolean;
  initialFilters: FilterState;
  onApplyFilters: (filters: FilterState) => void;
  onClose: () => void;
}

const COMMON_BRANDS = ['Teer', 'Radhuni', 'Fresh', 'Pran', 'Aarong', 'Rupchanda'];

export function FilterBottomSheet({
  visible,
  initialFilters,
  onApplyFilters,
  onClose,
}: FilterBottomSheetProps) {
  const [inStockOnly, setInStockOnly] = useState(initialFilters.inStockOnly);
  const [minPrice, setMinPrice] = useState(initialFilters.minPrice?.toString() ?? '');
  const [maxPrice, setMaxPrice] = useState(initialFilters.maxPrice?.toString() ?? '');
  const [selectedBrand, setSelectedBrand] = useState(initialFilters.selectedBrand ?? '');

  const handleApply = () => {
    haptics.selection();
    onApplyFilters({
      inStockOnly,
      minPrice: minPrice.trim() ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice.trim() ? parseFloat(maxPrice) : undefined,
      selectedBrand: selectedBrand.trim() ? selectedBrand : undefined,
    });
    onClose();
  };

  const handleReset = () => {
    haptics.light();
    setInStockOnly(false);
    setMinPrice('');
    setMaxPrice('');
    setSelectedBrand('');
    onApplyFilters({ inStockOnly: false });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.sheet} className="bg-card border-t border-border">
          {/* Header */}
          <View className="flex-row items-center justify-between p-4 border-b border-border">
            <Text className="text-base font-bold text-foreground">Filter Products</Text>
            <TouchableOpacity onPress={handleReset}>
              <Text className="text-xs font-semibold text-brand-deep dark:text-brand-fresh">
                Reset
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} contentContainerStyle={{ padding: 16 }}>
            {/* In-Stock Toggle */}
            <View className="flex-row items-center justify-between py-3 border-b border-border mb-4">
              <View>
                <Text className="text-sm font-semibold text-foreground">
                  In Stock Only
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Hide currently unavailable items
                </Text>
              </View>
              <Switch
                value={inStockOnly}
                onValueChange={setInStockOnly}
                trackColor={{ false: '#cbd5e1', true: '#45a22c' }}
                thumbColor="#ffffff"
              />
            </View>

            {/* Price Range */}
            <View className="mb-5">
              <Text className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                Price Range (৳ BDT)
              </Text>
              <View className="flex-row items-center gap-3">
                <TextInput
                  value={minPrice}
                  onChangeText={setMinPrice}
                  placeholder="Min (e.g. 50)"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  className="flex-1 p-2.5 rounded-brand border border-border bg-background text-sm text-foreground"
                />
                <Text className="text-sm text-muted-foreground">to</Text>
                <TextInput
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                  placeholder="Max (e.g. 500)"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  className="flex-1 p-2.5 rounded-brand border border-border bg-background text-sm text-foreground"
                />
              </View>
            </View>

            {/* Brand Filter */}
            <View className="mb-6">
              <Text className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                Popular Brands
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {COMMON_BRANDS.map((brand) => {
                  const isSelected = selectedBrand === brand;
                  return (
                    <TouchableOpacity
                      key={brand}
                      onPress={() => {
                        haptics.selection();
                        setSelectedBrand(isSelected ? '' : brand);
                      }}
                      className={`px-3 py-1.5 rounded-full border ${
                        isSelected
                          ? 'bg-brand-fresh border-brand-fresh'
                          : 'bg-background border-border'
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          isSelected ? 'text-white' : 'text-foreground'
                        }`}
                      >
                        {brand}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <Button
              title="Apply Filters"
              variant="primary"
              size="lg"
              onPress={handleApply}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Radius.brand * 2,
    borderTopRightRadius: Radius.brand * 2,
    maxHeight: '80%',
  },
  scrollArea: {
    maxHeight: 450,
  },
});


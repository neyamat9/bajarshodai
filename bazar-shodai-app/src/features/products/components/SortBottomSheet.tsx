import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { Radius } from '@/constants/layout';
import { haptics } from '@/services/haptics';

export type SortOptionValue = 'popular' | 'price_asc' | 'price_desc' | 'rating' | 'newest';

export interface SortOptionItem {
  label: string;
  value: SortOptionValue;
}

const SORT_OPTIONS: SortOptionItem[] = [
  { label: 'Popular & Best Selling', value: 'popular' },
  { label: 'Price: Low to High (৳ → ৳৳৳)', value: 'price_asc' },
  { label: 'Price: High to Low (৳৳৳ → ৳)', value: 'price_desc' },
  { label: 'Customer Rating (★ Highest)', value: 'rating' },
  { label: 'New Arrivals', value: 'newest' },
];

export interface SortBottomSheetProps {
  visible: boolean;
  activeSort: SortOptionValue;
  onSelectSort: (value: SortOptionValue) => void;
  onClose: () => void;
}

export function SortBottomSheet({
  visible,
  activeSort,
  onSelectSort,
  onClose,
}: SortBottomSheetProps) {
  const handleSelect = (val: SortOptionValue) => {
    haptics.selection();
    onSelectSort(val);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity activeOpacity={1} onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={styles.sheet} className="bg-card border-t border-border">
          {/* Header */}
          <View className="flex-row items-center justify-between p-4 border-b border-border">
            <Text className="text-base font-bold text-foreground">Sort Products By</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Icon name="X" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Options */}
          <View className="py-2">
            {SORT_OPTIONS.map((opt) => {
              const isSelected = activeSort === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => handleSelect(opt.value)}
                  activeOpacity={0.7}
                  className={`flex-row items-center justify-between px-4 py-3.5 ${
                    isSelected ? 'bg-brand-fresh/10' : ''
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      isSelected
                        ? 'font-bold text-brand-deep dark:text-brand-fresh'
                        : 'text-foreground'
                    }`}
                  >
                    {opt.label}
                  </Text>
                  {isSelected && <Icon name="Check" size={18} color="#0b6234" />}
                </TouchableOpacity>
              );
            })}
          </View>
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
    paddingBottom: 24,
  },
});

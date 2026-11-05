import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { HomeBrandData } from '../types';
import { Radius } from '@/constants/layout';
import { haptics } from '@/services/haptics';
import { toast } from '@/store/useToastStore';

export interface BrandShowcaseSectionProps {
  brands: HomeBrandData[];
  onSelectBrand?: (brand: HomeBrandData) => void;
  className?: string;
}

export function BrandShowcaseSection({
  brands,
  onSelectBrand,
  className = '',
}: BrandShowcaseSectionProps) {
  const [selectedBrandSlug, setSelectedBrandSlug] = useState<string | null>(null);
  const displayBrands = Array.isArray(brands) ? brands : [];

  if (displayBrands.length === 0) {
    return null;
  }

  const handleBrandPress = (brand: HomeBrandData) => {
    haptics.selection();
    const newSlug = selectedBrandSlug === brand.slug ? null : brand.slug;
    setSelectedBrandSlug(newSlug);

    if (onSelectBrand) {
      onSelectBrand(brand);
    } else {
      toast.info('Brand Filter', `Showing products from ${brand.name}`);
    }
  };

  return (
    <View className={`px-4 mb-6 ${className}`}>
      {/* Section Header */}
      <View className="mb-3">
        <Text className="text-base font-bold text-foreground">ব্র্যান্ড কর্নার</Text>
        <Text className="text-[11px] text-muted-foreground">
          Trusted consumer brands & authentic packaged groceries
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2.5">
          {displayBrands.map((b) => {
            const isSelected = selectedBrandSlug === b.slug;
            return (
              <TouchableOpacity
                key={b.slug}
                onPress={() => handleBrandPress(b)}
                activeOpacity={0.7}
                style={[styles.brandPill, isSelected && styles.brandPillActive]}
                className={`border ${
                  isSelected ? 'bg-brand-fresh border-brand-fresh' : 'bg-card border-border'
                }`}
              >
                <Text
                  style={[styles.brandText, isSelected ? styles.brandTextActive : null]}
                  className={isSelected ? 'text-white' : 'text-foreground'}
                >
                  {b.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  brandPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandPillActive: {
    backgroundColor: '#0b6234',
  },
  brandText: {
    fontSize: 12,
    fontWeight: '600',
  },
  brandTextActive: {
    color: '#ffffff',
  },
});

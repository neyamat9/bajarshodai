import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AppImage } from '@/components/ui/AppImage';
import { Radius, Shadows } from '@/constants/layout';
import { haptics } from '@/services/haptics';

export interface CategoryItem {
  id: string;
  name: string;
  banglaName?: string;
  slug: string;
  iconUrl?: string;
  productCount?: number;
}

export interface CategoryTileProps {
  category: CategoryItem;
  onPress: () => void;
  className?: string;
}

export function CategoryTile({ category, onPress, className = '' }: CategoryTileProps) {
  const handlePress = () => {
    haptics.light();
    onPress();
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Browse category ${category.name}`}
      activeOpacity={0.8}
      onPress={handlePress}
      style={[styles.container, Shadows.sm]}
      className={`items-center justify-center bg-card border border-border p-3 ${className}`}
    >
      <View style={styles.imageSlot}>
        <AppImage source={category.iconUrl} aspectRatio={1} borderRadius={24} />
      </View>
      <Text numberOfLines={1} className="text-xs font-bold text-foreground mt-2 text-center">
        {category.banglaName || category.name}
      </Text>
      {category.productCount !== undefined && (
        <Text className="text-[10px] text-muted-foreground mt-0.5">
          {category.productCount} items
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 88,
    borderRadius: Radius.brand,
  },
  imageSlot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#edf3e8',
  },
});

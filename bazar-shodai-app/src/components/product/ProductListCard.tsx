import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AppImage } from '@/components/ui/AppImage';
import { Price } from '@/components/ui/Price';
import { QuantityStepper } from './QuantityStepper';
import { Icon } from '@/components/ui/Icon';
import { Radius, Shadows } from '@/constants/layout';
import { ProductGridItem } from './ProductGridCard';

export interface ProductListCardProps {
  product: ProductGridItem;
  quantity: number;
  onQuantityChange: (newQuantity: number) => void;
  onRemove?: () => void;
  className?: string;
}

export function ProductListCard({
  product,
  quantity,
  onQuantityChange,
  onRemove,
  className = '',
}: ProductListCardProps) {
  return (
    <View
      style={[styles.container, Shadows.sm]}
      className={`bg-card border border-border p-3 flex-row items-center justify-between ${className}`}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnailSlot}>
        <AppImage source={product.imageUrl} aspectRatio={1} borderRadius={Radius.brand} />
      </View>

      {/* Info */}
      <View className="flex-1 ml-3 mr-2">
        <Text numberOfLines={1} className="text-sm font-semibold text-foreground mb-1">
          {product.banglaName || product.name}
        </Text>
        <Price amount={product.price} unit={product.unit} size="sm" />
      </View>

      {/* Stepper & Delete */}
      <View className="items-end gap-1.5">
        <QuantityStepper quantity={quantity} onQuantityChange={onQuantityChange} size="sm" />
        {onRemove && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Remove item"
            onPress={onRemove}
            style={styles.removeButton}
          >
            <Icon name="Trash2" size={14} color="#d92d20" />
            <Text className="text-[11px] text-destructive ml-1">Remove</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.brand,
    width: '100%',
  },
  thumbnailSlot: {
    width: 60,
    height: 60,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 2,
  },
});

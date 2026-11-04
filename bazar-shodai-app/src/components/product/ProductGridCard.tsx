import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AppImage } from '@/components/ui/AppImage';
import { Price } from '@/components/ui/Price';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { QuantityStepper } from './QuantityStepper';
import { Radius, Shadows } from '@/constants/layout';

export interface ProductGridItem {
  id: string;
  name: string;
  banglaName?: string;
  slug: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  unit: string;
  stock?: number;
  badge?: string;
}

export interface ProductGridCardProps {
  product: ProductGridItem;
  quantityInCart?: number;
  onPress?: () => void;
  onAddToCart?: () => void;
  onQuantityChange?: (quantity: number) => void;
  className?: string;
}

export function ProductGridCard({
  product,
  quantityInCart = 0,
  onPress,
  onAddToCart,
  onQuantityChange,
  className = '',
}: ProductGridCardProps) {
  const isOutOfStock = product.stock !== undefined && product.stock <= 0;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, Shadows.sm]}
      className={`bg-card border border-border ${className}`}
    >
      {/* Product Image & Badges */}
      <View style={styles.imageWrapper}>
        <AppImage source={product.imageUrl} aspectRatio={1} borderRadius={Radius.brand} />
        {product.badge && (
          <View style={styles.badgeSlot}>
            <Badge label={product.badge} variant="carrot" size="sm" />
          </View>
        )}
      </View>

      {/* Product Details */}
      <View style={styles.infoWrapper}>
        <Text numberOfLines={2} className="text-sm font-semibold text-foreground mb-1 leading-snug">
          {product.banglaName || product.name}
        </Text>

        <Price
          amount={product.price}
          originalAmount={product.originalPrice}
          unit={product.unit}
          size="sm"
          className="mb-3"
        />

        {/* Action Button or Stepper */}
        {isOutOfStock ? (
          <Badge label="Out of Stock" variant="tomato" size="sm" />
        ) : quantityInCart > 0 && onQuantityChange ? (
          <QuantityStepper
            quantity={quantityInCart}
            onQuantityChange={onQuantityChange}
            size="sm"
            unit={product.unit}
          />
        ) : (
          <Button
            title="Add to Cart"
            variant="secondary"
            size="sm"
            onPress={onAddToCart}
            className="w-full"
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.brand,
    overflow: 'hidden',
    width: '100%',
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    padding: 8,
  },
  badgeSlot: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  infoWrapper: {
    paddingHorizontal: 10,
    paddingBottom: 12,
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Price } from '@/components/ui/Price';
import { QuantityStepper } from '@/components/product/QuantityStepper';

export interface ProductStickyBottomBarProps {
  unitPrice: number;
  quantity: number;
  unit?: string;
  step?: number;
  minQty?: number;
  inStock?: boolean;
  onQuantityChange: (qty: number) => void;
  onAddToCart: () => void;
  onNotifyBackInStock?: () => void;
}

export function ProductStickyBottomBar({
  unitPrice,
  quantity,
  unit = 'kg',
  step = 1,
  minQty = 1,
  inStock = true,
  onQuantityChange,
  onAddToCart,
  onNotifyBackInStock,
}: ProductStickyBottomBarProps) {
  const insets = useSafeAreaInsets();
  const totalPrice = unitPrice * quantity;

  return (
    <View
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}
      className="bg-card border-t border-border"
    >
      <View style={styles.content}>
        {inStock ? (
          <>
            <View style={styles.left}>
              <Text className="text-[11px] text-muted-foreground uppercase font-semibold">
                Total Price
              </Text>
              <Price amount={totalPrice} size="lg" />
            </View>

            <View style={styles.stepperWrap}>
              <QuantityStepper
                quantity={quantity}
                onQuantityChange={onQuantityChange}
                unit={unit}
                step={step}
                min={minQty}
                size="sm"
              />
            </View>

            <Button
              title="Add to Bag"
              variant="primary"
              size="md"
              onPress={onAddToCart}
              className="flex-1 ml-2"
            />
          </>
        ) : (
          <View className="flex-row items-center justify-between w-full">
            <View>
              <Text className="text-sm font-bold text-destructive">Currently Out of Stock</Text>
              <Text className="text-[11px] text-muted-foreground">Get an alert when available</Text>
            </View>
            <Button title="Notify Me" variant="outline" size="md" onPress={onNotifyBackInStock} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
    paddingHorizontal: 16,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  left: {
    marginRight: 8,
  },
  stepperWrap: {
    marginRight: 4,
  },
});

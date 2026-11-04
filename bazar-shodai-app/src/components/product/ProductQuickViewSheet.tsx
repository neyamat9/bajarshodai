import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import GorhomBottomSheet from '@gorhom/bottom-sheet';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { AppImage } from '@/components/ui/AppImage';
import { Price } from '@/components/ui/Price';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { QuantityStepper } from './QuantityStepper';
import { ProductGridItem } from './ProductGridCard';
import { Radius } from '@/constants/layout';

export interface ProductQuickViewSheetProps {
  product: ProductGridItem | null;
  visible: boolean;
  onClose: () => void;
  onAddToCart?: (quantity: number) => void;
  onViewFullDetails?: (slug: string) => void;
}

export function ProductQuickViewSheet({
  product,
  visible,
  onClose,
  onAddToCart,
  onViewFullDetails,
}: ProductQuickViewSheetProps) {
  const sheetRef = useRef<GorhomBottomSheet>(null);
  const [quantity, setQuantity] = React.useState(1);
  const [prevProduct, setPrevProduct] = React.useState(product);

  if (product !== prevProduct) {
    setPrevProduct(product);
    setQuantity(1);
  }

  useEffect(() => {
    if (visible && product) {
      sheetRef.current?.snapToIndex(0);
    } else {
      sheetRef.current?.close();
    }
  }, [visible, product]);

  if (!product) return null;

  return (
    <BottomSheet ref={sheetRef} snapPoints={['60%', '85%']} onClose={onClose}>
      <View style={styles.container}>
        {/* Top Product Image */}
        <View style={styles.imageSlot}>
          <AppImage source={product.imageUrl} aspectRatio={1.5} borderRadius={Radius.brand} />
        </View>

        {/* Title & Badges */}
        <View className="mb-2">
          {product.badge && (
            <Badge label={product.badge} variant="carrot" size="sm" className="mb-2" />
          )}
          <Text className="text-xl font-bold text-foreground">
            {product.banglaName || product.name}
          </Text>
          {product.banglaName && (
            <Text className="text-xs text-muted-foreground mt-0.5">{product.name}</Text>
          )}
        </View>

        {/* Pricing */}
        <Price
          amount={product.price}
          originalAmount={product.originalPrice}
          unit={product.unit}
          size="lg"
          className="mb-4"
        />

        {/* Quantity Controls */}
        <View className="flex-row items-center justify-between py-3 border-y border-border mb-4">
          <Text className="text-sm font-semibold text-foreground">Quantity:</Text>
          <QuantityStepper
            quantity={quantity}
            onQuantityChange={setQuantity}
            size="md"
            unit={product.unit}
          />
        </View>

        {/* Action Buttons */}
        <View className="gap-2.5">
          <Button
            title={`Add ${quantity} to Cart`}
            variant="secondary"
            size="lg"
            onPress={() => {
              onAddToCart?.(quantity);
              onClose();
            }}
          />

          {onViewFullDetails && (
            <Button
              title="View Full Details"
              variant="outline"
              size="md"
              onPress={() => {
                onClose();
                onViewFullDetails(product.slug);
              }}
            />
          )}
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  imageSlot: {
    width: '100%',
    marginBottom: 12,
  },
});

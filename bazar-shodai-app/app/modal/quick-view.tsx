import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Price } from '@/components/ui/Price';
import { AppImage } from '@/components/ui/AppImage';
import { QuantityStepper } from '@/components/product/QuantityStepper';
import { useCartStore } from '@/store/useCartStore';
import { toast } from '@/store/useToastStore';
import { Radius } from '@/constants/layout';

export default function QuickViewModal() {
  const router = useRouter();
  const { slug, name, price, imageUrl, unit } = useLocalSearchParams<{
    slug?: string;
    name?: string;
    price?: string;
    imageUrl?: string;
    unit?: string;
  }>();

  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  const productName = name || (slug ? String(slug).replace(/-/g, ' ') : 'Fresh Grocery');
  const numericPrice = price ? parseFloat(price) : 120;
  const unitLabel = unit || 'kg';

  const handleAddToCart = () => {
    addItem(
      {
        productId: slug || 'quick-item',
        id: slug || 'quick-item',
        name: productName,
        price: numericPrice,
        unit: unitLabel,
        imageUrl: imageUrl ? String(imageUrl) : undefined,
      },
      quantity,
    );
    toast.success('Added to Cart', `${quantity}x ${productName} added`);
    router.back();
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border bg-card">
        <Text className="text-base font-bold text-foreground">Quick View</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-1"
          accessibilityRole="button"
          accessibilityLabel="Close quick view"
        >
          <Icon name="X" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {imageUrl ? (
          <View className="mb-4 overflow-hidden rounded-brand">
            <AppImage source={String(imageUrl)} aspectRatio={1.4} borderRadius={Radius.brand} />
          </View>
        ) : null}

        <Text className="text-xl font-bold text-foreground capitalize mb-1">{productName}</Text>
        <View className="flex-row items-baseline gap-2 mb-4">
          <Price amount={numericPrice} unit={unitLabel} size="lg" />
        </View>

        <View className="flex-row items-center justify-between py-3 border-y border-border mb-6">
          <Text className="text-sm font-semibold text-foreground">Quantity:</Text>
          <QuantityStepper quantity={quantity} onQuantityChange={setQuantity} unit={unitLabel} />
        </View>

        <Button
          title={`Add to Cart • ৳${(numericPrice * quantity).toFixed(0)}`}
          variant="primary"
          size="lg"
          onPress={handleAddToCart}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

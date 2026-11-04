import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { Price } from '@/components/ui/Price';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StarRating } from '@/components/ui/StarRating';
import { QuantityStepper } from '@/components/product/QuantityStepper';
import { useCartStore } from '@/store/useCartStore';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';

export default function ProductDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  const title = slug ? String(slug).replace(/-/g, ' ') : 'Fresh Grocery';
  const unitPrice = 120;

  const handleAddToCart = () => {
    addItem(
      {
        id: slug || 'p-detail',
        productId: slug || 'p-detail',
        name: title,
        price: unitPrice,
        unit: 'kg',
      },
      quantity,
    );
    toast.success('Added to Bag', `${quantity}kg ${title} added to cart`);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      {/* Top Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border bg-card">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-1"
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Icon name="ArrowLeft" size={22} color="#0b6234" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-foreground capitalize" numberOfLines={1}>
          {title}
        </Text>
        <TouchableOpacity
          onPress={() => {
            haptics.light();
            toast.info('Wishlist', 'Saved to wishlist');
          }}
          className="p-1"
          accessibilityRole="button"
          accessibilityLabel="Save to wishlist"
        >
          <Icon name="Heart" size={22} color="#64748b" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Badges */}
        <View className="flex-row gap-2 mb-3">
          <Badge label="100% ORGANIC" variant="fresh" size="sm" />
          <Badge label="IN STOCK" variant="neutral" size="sm" />
        </View>

        <Text className="text-2xl font-bold text-foreground capitalize mb-2">{title}</Text>

        <View className="flex-row items-center gap-3 mb-4">
          <StarRating rating={4.8} size={16} count={34} />
        </View>

        <View className="mb-6">
          <Price amount={unitPrice} originalAmount={150} unit="kg" size="lg" />
        </View>

        <View className="p-4 rounded-brand bg-card border border-border mb-6">
          <Text className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">
            Product Description
          </Text>
          <Text className="text-xs text-muted-foreground leading-relaxed">
            Sourced freshly from local farmers in Shahrasti and delivered in peak condition with
            strict organic quality checks. Cleaned and hygienically packed.
          </Text>
        </View>

        {/* Quantity Stepper Row */}
        <View className="flex-row items-center justify-between py-3 border-y border-border mb-6">
          <Text className="text-sm font-semibold text-foreground">Select Quantity:</Text>
          <QuantityStepper
            quantity={quantity}
            onQuantityChange={setQuantity}
            unit="kg"
            step={0.5}
            min={0.5}
          />
        </View>

        <Button
          title={`Add ${quantity}kg to Bag • ৳${(unitPrice * quantity).toFixed(0)}`}
          variant="primary"
          size="lg"
          onPress={handleAddToCart}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

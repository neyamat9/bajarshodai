import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCartStore } from '@/store/useCartStore';
import { ProductListCard } from '@/components/product/ProductListCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Price } from '@/components/ui/Price';
import { toast } from '@/store/useToastStore';

export default function CartScreen() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, totalPrice } = useCartStore();

  const subtotal = totalPrice();
  const deliveryFee = subtotal > 500 ? 0 : 30;
  const grandTotal = subtotal + (subtotal > 0 ? deliveryFee : 0);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 py-3 border-b border-border bg-card">
        <Text className="text-xl font-bold text-foreground">Shopping Cart ({items.length})</Text>
      </View>

      {/* Cart Items List */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.productId}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        renderItem={({ item }) => (
          <ProductListCard
            product={{
              id: item.productId,
              name: item.name,
              price: item.price,
              unit: item.unit ?? 'kg',
              imageUrl: item.imageUrl,
              slug: item.productId,
            }}
            quantity={item.quantity}
            onQuantityChange={(qty) => updateQuantity(item.productId, qty)}
            onRemove={() => {
              removeItem(item.productId);
              toast.info('Item Removed', `${item.name} removed from your bag`);
            }}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="Your Cart is Empty"
            description="Looks like you haven't added anything to your cart yet. Explore our fresh grocery selection!"
            actionLabel="Start Shopping"
            onAction={() => router.push('/')}
          />
        }
      />

      {/* Checkout Summary Footer */}
      {items.length > 0 && (
        <View className="p-4 bg-card border-t border-border">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs text-muted-foreground">Subtotal</Text>
            <Price amount={subtotal} size="sm" />
          </View>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs text-muted-foreground">Delivery Charge</Text>
            {deliveryFee === 0 ? (
              <Text className="text-xs font-semibold text-brand-fresh">FREE</Text>
            ) : (
              <Price amount={deliveryFee} size="sm" />
            )}
          </View>
          <View className="flex-row items-center justify-between pt-2 border-t border-border mb-4">
            <Text className="text-sm font-bold text-foreground">Total Payable</Text>
            <Price amount={grandTotal} size="lg" />
          </View>

          <Button
            title="Proceed to Checkout"
            variant="primary"
            size="lg"
            onPress={() => {
              toast.success('Order Process', 'Proceeding to delivery address selection');
              router.push('/modal/address-picker');
            }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

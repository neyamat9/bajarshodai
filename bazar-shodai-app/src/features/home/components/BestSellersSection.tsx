import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ProductGridCard, ProductGridItem } from '@/components/product/ProductGridCard';
import { ProductCardData } from '../types';
import { useCartStore } from '@/store/useCartStore';
import { toast } from '@/store/useToastStore';

export interface BestSellersSectionProps {
  products: ProductCardData[];
  className?: string;
}

export function BestSellersSection({ products, className = '' }: BestSellersSectionProps) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const cartItems = useCartStore((s) => s.items);

  const displayProducts = Array.isArray(products) ? products : [];

  if (displayProducts.length === 0) {
    return null;
  }

  return (
    <View className={`px-4 mb-5 ${className}`}>
      {/* Section Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View>
          <View className="flex-row items-center gap-1.5">
            <Text className="text-base font-bold text-foreground">জনপ্রিয় পণ্য সমূহ</Text>
            <View className="px-1.5 py-0.5 rounded bg-carrot/15">
              <Text className="text-[10px] font-bold text-carrot">BEST SELLERS</Text>
            </View>
          </View>
          <Text className="text-[11px] text-muted-foreground">
            Most frequently purchased kitchen essentials
          </Text>
        </View>
      </View>

      {/* Horizontal Cards Scroll */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-3">
          {displayProducts.map((p) => {
            const cartItem = cartItems.find((i) => i.productId === p.id);
            const rawImage =
              p.image ||
              p.imageUrl ||
              (p as any).primaryImage?.url ||
              (p as any).images?.[0]?.url;

            const gridItem: ProductGridItem = {
              id: p.id,
              name: p.name,
              banglaName: p.nameBn ?? undefined,
              slug: p.slug,
              price: Number(p.price),
              originalPrice: p.regularPrice ? Number(p.regularPrice) : undefined,
              imageUrl: rawImage,
              unit: p.unit?.shortLabelBn || p.unit?.shortLabel || 'pc',
              packSize: p.packSize ?? undefined,
              stock: p.stock,
              discountPercent: p.discountPercent,
              badge: 'BEST SELLER',
            };

            return (
              <View key={p.id} style={{ width: 155 }}>
                <ProductGridCard
                  product={gridItem}
                  quantityInCart={cartItem?.quantity}
                  onPress={() => router.push(`/product/${p.slug}`)}
                  onAddToCart={() => {
                    addItem(
                      {
                        id: p.id,
                        productId: p.id,
                        name: gridItem.banglaName || gridItem.name,
                        price: gridItem.price,
                        unit: gridItem.unit,
                        imageUrl: gridItem.imageUrl,
                      },
                      p.unit?.minQty ?? 1,
                    );
                    toast.success('Cart', `${gridItem.banglaName || gridItem.name} added`);
                  }}
                  onQuantityChange={(newQty) => {
                    if (!cartItem) return;
                    if (newQty <= 0) {
                      removeItem(cartItem.id);
                    } else {
                      updateQuantity(cartItem.id, newQty);
                    }
                  }}
                />
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

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

const DEFAULT_BEST_SELLERS: ProductCardData[] = [
  {
    id: 'b1',
    name: 'Teer Fortified Soybean Oil (তীর সয়াবিন তেল)',
    nameBn: 'তীর সয়াবিন তেল ৫ লিটার',
    slug: 'teer-fortified-soybean-oil-5l',
    price: 890,
    regularPrice: 930,
    discountPercent: 4,
    unit: {
      code: 'bottle',
      shortLabel: 'bottle',
      shortLabelBn: 'বোতল',
      allowDecimal: false,
      step: 1,
      minQty: 1,
    },
    avgRating: 4.9,
    reviewCount: 112,
    isBestSeller: true,
  },
  {
    id: 'b2',
    name: 'Nazirshail Premium Rice (নাজিরশাইল চাল)',
    nameBn: 'নাজিরশাইল চাল ২৫ কেজি',
    slug: 'nazirshail-premium-rice-25kg',
    price: 1850,
    regularPrice: 1950,
    discountPercent: 5,
    unit: {
      code: 'sack',
      shortLabel: 'sack',
      shortLabelBn: 'বস্তা',
      allowDecimal: false,
      step: 1,
      minQty: 1,
    },
    avgRating: 4.8,
    reviewCount: 94,
    isBestSeller: true,
  },
  {
    id: 'b3',
    name: 'Farm Fresh Brown Eggs (ফার্মের লাল ডিম)',
    nameBn: 'ফার্মের লাল ডিম ১ ডজন',
    slug: 'farm-fresh-brown-eggs-12pc',
    price: 155,
    regularPrice: 165,
    discountPercent: 6,
    unit: {
      code: 'dz',
      shortLabel: 'dz',
      shortLabelBn: 'ডজন',
      allowDecimal: false,
      step: 1,
      minQty: 1,
    },
    avgRating: 4.9,
    reviewCount: 78,
    isBestSeller: true,
  },
  {
    id: 'b4',
    name: 'Radhuni Pure Mustard Oil (রাধুনী সরিষার তেল)',
    nameBn: 'রাধুনী খাঁটি সরিষার তেল ১ লিটার',
    slug: 'radhuni-pure-mustard-oil-1l',
    price: 340,
    regularPrice: 360,
    discountPercent: 5,
    unit: {
      code: 'bottle',
      shortLabel: 'bottle',
      shortLabelBn: 'বোতল',
      allowDecimal: false,
      step: 1,
      minQty: 1,
    },
    avgRating: 4.8,
    reviewCount: 65,
    isBestSeller: true,
  },
];

export function BestSellersSection({ products, className = '' }: BestSellersSectionProps) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);

  const displayProducts = products.length > 0 ? products : DEFAULT_BEST_SELLERS;

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
            const gridItem: ProductGridItem = {
              id: p.id,
              name: p.nameBn || p.name,
              banglaName: p.nameBn ?? undefined,
              slug: p.slug,
              price: p.price,
              originalPrice: p.regularPrice,
              imageUrl: p.imageUrl || p.primaryImage?.url,
              unit: p.unit?.shortLabel || 'pc',
              stock: p.stock,
              badge: 'BEST SELLER',
            };

            return (
              <View key={p.id} style={{ width: 165 }}>
                <ProductGridCard
                  product={gridItem}
                  quantityInCart={cartItem?.quantity}
                  onPress={() => router.push(`/product/${p.slug}`)}
                  onAddToCart={() => {
                    addItem(
                      {
                        id: p.id,
                        productId: p.id,
                        name: gridItem.name,
                        price: p.price,
                        unit: gridItem.unit,
                        imageUrl: gridItem.imageUrl,
                      },
                      p.unit?.minQty ?? 1,
                    );
                    toast.success('Cart', `${gridItem.name} added to cart`);
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

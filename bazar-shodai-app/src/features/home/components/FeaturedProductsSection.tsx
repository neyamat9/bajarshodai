import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ProductGridCard, ProductGridItem } from '@/components/product/ProductGridCard';
import { ProductCardData } from '../types';
import { useCartStore } from '@/store/useCartStore';
import { toast } from '@/store/useToastStore';

export interface FeaturedProductsSectionProps {
  products: ProductCardData[];
  className?: string;
}

const DEFAULT_FEATURED: ProductCardData[] = [
  {
    id: 'f1',
    name: 'Fresh Deshi Tomato (দেশি টমেটো)',
    nameBn: 'দেশি টমেটো',
    slug: 'fresh-deshi-tomato',
    price: 60,
    regularPrice: 80,
    discountPercent: 25,
    unit: {
      code: 'kg',
      shortLabel: 'kg',
      shortLabelBn: 'কেজি',
      allowDecimal: true,
      step: 0.5,
      minQty: 0.5,
    },
    avgRating: 4.8,
    reviewCount: 38,
    isHot: true,
  },
  {
    id: 'f2',
    name: 'River Hilsha Fish (মেঘনার তাজা ইলিশ)',
    nameBn: 'চাঁদপুরের তাজা ইলিশ',
    slug: 'river-hilsha-fish',
    price: 1450,
    regularPrice: 1600,
    discountPercent: 10,
    unit: {
      code: 'kg',
      shortLabel: 'kg',
      shortLabelBn: 'কেজি',
      allowDecimal: false,
      step: 1,
      minQty: 1,
    },
    avgRating: 4.9,
    reviewCount: 52,
    isFeatured: true,
  },
  {
    id: 'f3',
    name: 'Fresh Deshi Cucumbers (শসা)',
    nameBn: 'দেশি শসা',
    slug: 'fresh-deshi-cucumbers',
    price: 45,
    regularPrice: 55,
    discountPercent: 18,
    unit: {
      code: 'kg',
      shortLabel: 'kg',
      shortLabelBn: 'কেজি',
      allowDecimal: true,
      step: 0.5,
      minQty: 0.5,
    },
    avgRating: 4.6,
    reviewCount: 19,
  },
  {
    id: 'f4',
    name: 'Halal Beef Curry Cut (দেশি গরুর মাংস)',
    nameBn: 'দেশি গরুর মাংস',
    slug: 'halal-beef-curry-cut',
    price: 780,
    regularPrice: 820,
    discountPercent: 5,
    unit: {
      code: 'kg',
      shortLabel: 'kg',
      shortLabelBn: 'কেজি',
      allowDecimal: true,
      step: 0.5,
      minQty: 1,
    },
    avgRating: 4.9,
    reviewCount: 84,
    isHot: true,
  },
];

export function FeaturedProductsSection({
  products,
  className = '',
}: FeaturedProductsSectionProps) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);

  const displayProducts = products.length > 0 ? products : DEFAULT_FEATURED;

  return (
    <View className={`px-4 mb-5 ${className}`}>
      {/* Section Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View>
          <View className="flex-row items-center gap-1.5">
            <Text className="text-base font-bold text-foreground">আজকের তাজা বাজার</Text>
            <View className="px-1.5 py-0.5 rounded bg-brand-fresh/15">
              <Text className="text-[10px] font-bold text-brand-fresh">DAILY FRESH</Text>
            </View>
          </View>
          <Text className="text-[11px] text-muted-foreground">
            Fresh harvest directly from Shahrasti growers
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
              unit: p.unit?.shortLabel || 'kg',
              stock: p.stock,
              badge:
                p.discountPercent && p.discountPercent > 0
                  ? `${p.discountPercent}% OFF`
                  : undefined,
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
                    toast.success('Cart', `${gridItem.name} added to your basket`);
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

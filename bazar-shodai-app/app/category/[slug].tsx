import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { ProductGridCard } from '@/components/product/ProductGridCard';
import { toast } from '@/store/useToastStore';
import { useCartStore } from '@/store/useCartStore';

const SAMPLE_CATEGORY_PRODUCTS = [
  {
    id: 'p1',
    name: 'Fresh Deshi Tomato',
    slug: 'fresh-deshi-tomato',
    price: 60,
    originalPrice: 80,
    unit: 'kg',
    rating: 4.8,
    reviewCount: 42,
    badgeText: 'HOT',
  },
  {
    id: 'p2',
    name: 'Green Pointed Gourd (Potol)',
    slug: 'green-pointed-gourd-potol',
    price: 50,
    unit: 'kg',
    rating: 4.6,
    reviewCount: 18,
  },
  {
    id: 'p3',
    name: 'Red Deshi Carrots',
    slug: 'red-deshi-carrots',
    price: 75,
    originalPrice: 90,
    unit: 'kg',
    rating: 4.9,
    reviewCount: 30,
  },
  {
    id: 'p4',
    name: 'Fresh Bottle Gourd (Lau)',
    slug: 'fresh-bottle-gourd-lau',
    price: 65,
    unit: 'pc',
    rating: 4.7,
    reviewCount: 22,
  },
];

export default function CategoryDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const addItem = useCartStore((s) => s.addItem);

  const categoryName = slug ? String(slug).replace(/-/g, ' ') : 'Category';

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border bg-card">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-1"
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Icon name="ArrowLeft" size={22} color="#0b6234" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-foreground capitalize">{categoryName}</Text>
        <View className="w-8" />
      </View>

      {/* Grid */}
      <FlatList
        data={SAMPLE_CATEGORY_PRODUCTS}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ padding: 12 }}
        columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
        renderItem={({ item }) => (
          <View style={{ flex: 1 }}>
            <ProductGridCard
              product={item}
              onPress={() => router.push(`/product/${item.slug}`)}
              onAddToCart={() => {
                addItem(
                  {
                    id: item.id,
                    productId: item.id,
                    name: item.name,
                    price: item.price,
                    unit: item.unit,
                  },
                  1,
                );
                toast.success('Cart', `Added 1 ${item.unit} to your bag`);
              }}
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

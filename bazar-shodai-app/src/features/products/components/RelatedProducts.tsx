import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ProductGridCard, ProductGridItem } from '@/components/product/ProductGridCard';
import { useCartStore } from '@/store/useCartStore';
import { toast } from '@/store/useToastStore';

export interface RelatedProductsProps {
  products?: ProductGridItem[];
  title?: string;
}

export function RelatedProducts({
  products = [],
  title = 'Frequently Bought Together',
}: RelatedProductsProps) {
  const router = useRouter();
  const { items, addItem, updateQuantity, removeItem } = useCartStore();

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>ক্রেতারা আরও যা কিনছেন</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {products.map((item) => {
          const cartItem = items.find((ci) => ci.productId === item.id);
          const quantityInCart = cartItem ? cartItem.quantity : 0;

          return (
            <View key={item.id} style={styles.cardWrapper}>
              <ProductGridCard
                product={item}
                quantityInCart={quantityInCart}
                onPress={() => router.push(`/product/${item.slug}` as any)}
                onAddToCart={() => {
                  addItem(
                    {
                      id: item.id,
                      productId: item.id,
                      name: item.name,
                      price: item.price,
                      originalPrice: item.originalPrice,
                      imageUrl: item.imageUrl,
                      unit: item.unit,
                      stock: item.stock,
                    },
                    1,
                  );
                  toast.success('Added to Bag', `${item.name} added`);
                }}
                onQuantityChange={(newQty) => {
                  if (newQty <= 0) {
                    removeItem(item.id);
                  } else {
                    updateQuantity(item.id, newQty);
                  }
                }}
              />
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
  },
  headerRow: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  cardWrapper: {
    width: 160,
  },
});

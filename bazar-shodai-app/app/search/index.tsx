import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { SearchBar } from '@/components/ui/SearchBar';
import { ProductGridCard } from '@/components/product/ProductGridCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCartStore } from '@/store/useCartStore';
import { toast } from '@/store/useToastStore';

const SEARCHABLE_ITEMS = [
  { id: 's1', name: 'Deshi Potato (Alu)', slug: 'deshi-potato-alu', price: 35, unit: 'kg' },
  { id: 's2', name: 'Fresh Deshi Tomato', slug: 'fresh-deshi-tomato', price: 60, unit: 'kg' },
  { id: 's3', name: 'Red Deshi Carrots', slug: 'red-deshi-carrots', price: 75, unit: 'kg' },
  { id: 's4', name: 'Green Chili (Kacha Morich)', slug: 'green-chili', price: 110, unit: 'kg' },
  {
    id: 's5',
    name: 'River Hilsha Fish (Ilish)',
    slug: 'river-hilsha-fish',
    price: 1450,
    unit: 'kg',
  },
  { id: 's6', name: 'Rui Fish Whole', slug: 'rui-fish-whole', price: 420, unit: 'kg' },
  { id: 's7', name: 'Deshi Beef Curry Cut', slug: 'deshi-beef-curry-cut', price: 780, unit: 'kg' },
];

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const addItem = useCartStore((s) => s.addItem);

  const results = query.trim()
    ? SEARCHABLE_ITEMS.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      {/* Search Header */}
      <View className="flex-row items-center gap-2 px-4 py-3 border-b border-border bg-card">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-1"
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Icon name="ArrowLeft" size={22} color="#0b6234" />
        </TouchableOpacity>
        <View className="flex-1">
          <SearchBar
            value={query}
            onChangeQuery={setQuery}
            placeholder="Search groceries, fish, beef..."
          />
        </View>
      </View>

      {/* Results / Empty */}
      {query.trim().length === 0 ? (
        <View className="p-6 items-center justify-center flex-1">
          <Icon name="Search" size={40} color="#94a3b8" />
          <Text className="text-base font-semibold text-foreground mt-3 mb-1">
            Search Bazar Shodai
          </Text>
          <Text className="text-xs text-muted-foreground text-center">
            Find fresh vegetables, river fish, halal beef, spices, and groceries in Shahrasti.
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
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
                  toast.success('Cart', `${item.name} added`);
                }}
              />
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              title="No Products Found"
              description={`We couldn't find any results for "${query}". Try checking your spelling or use general keywords.`}
              actionLabel="Clear Search"
              onAction={() => setQuery('')}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

import React, { useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SearchBar } from '@/components/ui/SearchBar';
import { CategoryTile } from '@/components/category/CategoryTile';
import { EmptyState } from '@/components/ui/EmptyState';

const ALL_CATEGORIES = [
  { id: '1', name: 'Fresh Vegetables', slug: 'vegetables', productCount: 48 },
  { id: '2', name: 'River & Sea Fish', slug: 'fish', productCount: 26 },
  { id: '3', name: 'Fresh Halal Meat', slug: 'meat', productCount: 19 },
  { id: '4', name: 'Seasonal Fruits', slug: 'fruits', productCount: 34 },
  { id: '5', name: 'Dairy & Farm Eggs', slug: 'dairy', productCount: 16 },
  { id: '6', name: 'Cooking Oil & Ghee', slug: 'oil', productCount: 22 },
  { id: '7', name: 'Spices & Masala', slug: 'spices', productCount: 45 },
  { id: '8', name: 'Rice & Grains', slug: 'grains', productCount: 30 },
  { id: '9', name: 'Bakery & Snacks', slug: 'bakery', productCount: 28 },
  { id: '10', name: 'Beverages & Tea', slug: 'beverages', productCount: 18 },
];

export default function CategoriesScreen() {
  const router = useRouter();
  const [filterQuery, setFilterQuery] = useState('');

  const filteredCategories = ALL_CATEGORIES.filter((cat) =>
    cat.name.toLowerCase().includes(filterQuery.toLowerCase()),
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 pt-2 pb-3 border-b border-border bg-card">
        <Text className="text-xl font-bold text-foreground mb-3">All Categories</Text>
        <SearchBar
          value={filterQuery}
          onChangeQuery={setFilterQuery}
          placeholder="Filter categories..."
        />
      </View>

      {/* Grid */}
      <FlatList
        data={filteredCategories}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={{ padding: 16, gap: 16 }}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        renderItem={({ item }) => (
          <CategoryTile category={item} onPress={() => router.push(`/category/${item.slug}`)} />
        )}
        ListEmptyComponent={
          <EmptyState
            title="No Categories Found"
            description={`No category matching "${filterQuery}". Try searching another name.`}
            actionLabel="Reset Search"
            onAction={() => setFilterQuery('')}
          />
        }
      />
    </SafeAreaView>
  );
}

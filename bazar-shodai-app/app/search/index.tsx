import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { SearchBar } from '@/components/ui/SearchBar';
import { ProductGridCard, ProductGridItem } from '@/components/product/ProductGridCard';
import { NoProductsFound } from '@/features/products/components/NoProductsFound';
import { useSearchSuggestions } from '@/features/search/api/useSearch';
import {
  getLocalRecentSearches,
  recordSearchHistory,
  removeLocalSearchQuery,
  clearAllSearchHistory,
} from '@/features/search/api/searchHistory';
import { useCartStore } from '@/store/useCartStore';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';

export default function SearchScreen() {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);

  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => getLocalRecentSearches());

  const { data: suggestions, isLoading } = useSearchSuggestions(query);

  const handleSearchSubmit = (searchTerm: string) => {
    const term = searchTerm.trim();
    if (!term) return;

    recordSearchHistory(term);
    setRecentSearches(getLocalRecentSearches());
  };

  const handleSelectRecent = (term: string) => {
    haptics.selection();
    setQuery(term);
    handleSearchSubmit(term);
  };

  const handleRemoveRecent = (term: string) => {
    haptics.light();
    const updated = removeLocalSearchQuery(term);
    setRecentSearches(updated);
  };

  const handleClearHistory = () => {
    haptics.light();
    clearAllSearchHistory();
    setRecentSearches([]);
  };

  const products = suggestions?.products ?? [];

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
            onChangeQuery={(val) => setQuery(val)}
            onSubmit={handleSearchSubmit}
            placeholder="Search groceries, fish, beef, vegetables..."
          />
        </View>
      </View>

      {/* Query is Empty: Show Recent Searches */}
      {query.trim().length < 2 ? (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {recentSearches.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Recent Searches
                </Text>
                <TouchableOpacity onPress={handleClearHistory} activeOpacity={0.7}>
                  <Text className="text-xs text-brand-deep dark:text-brand-fresh font-semibold">
                    Clear All
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row flex-wrap gap-2">
                {recentSearches.map((term) => (
                  <View
                    key={term}
                    className="flex-row items-center bg-card border border-border rounded-full pl-3 pr-2 py-1.5"
                  >
                    <TouchableOpacity onPress={() => handleSelectRecent(term)}>
                      <Text className="text-xs font-medium text-foreground mr-1.5">{term}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleRemoveRecent(term)} className="p-0.5">
                      <Icon name="X" size={12} color="#94a3b8" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Quick Popular Keywords */}
          <View>
            <Text className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
              Popular in Shahrasti
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {[
                'দেশি টমেটো',
                'চাঁদপুরের ইলিশ',
                'গরুর মাংস',
                'সয়াবিন তেল',
                'ফার্মের ডিম',
                'কাঁচা মরিচ',
                'নাজিরশাইল চাল',
              ].map((tag) => (
                <TouchableOpacity
                  key={tag}
                  onPress={() => {
                    haptics.selection();
                    setQuery(tag);
                    handleSearchSubmit(tag);
                  }}
                  className="px-3 py-1.5 rounded-full bg-brand-fresh/10 border border-brand-fresh/20"
                >
                  <Text className="text-xs font-medium text-brand-deep dark:text-brand-fresh">
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0b6234" />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
          columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
          renderItem={({ item }) => {
            const cartItem = cartItems.find((i) => i.productId === item.id);
            const gridItem: ProductGridItem = {
              id: item.id,
              name: item.nameBn || item.name,
              banglaName: item.nameBn ?? undefined,
              slug: item.slug,
              price: item.price,
              originalPrice: item.regularPrice,
              imageUrl: item.imageUrl || item.primaryImage?.url,
              unit: item.unit?.shortLabel || 'kg',
              stock: item.stock,
              badge:
                item.discountPercent && item.discountPercent > 0
                  ? `${item.discountPercent}% OFF`
                  : undefined,
            };

            return (
              <View style={{ flex: 1 }}>
                <ProductGridCard
                  product={gridItem}
                  quantityInCart={cartItem?.quantity}
                  onPress={() => router.push(`/product/${item.slug}`)}
                  onAddToCart={() => {
                    addItem(
                      {
                        id: item.id,
                        productId: item.id,
                        name: gridItem.name,
                        price: item.price,
                        unit: gridItem.unit,
                        imageUrl: gridItem.imageUrl,
                      },
                      item.unit?.minQty ?? 1,
                    );
                    haptics.selection();
                    toast.success('Cart', `${gridItem.name} added`);
                  }}
                />
              </View>
            );
          }}
          ListEmptyComponent={
            <NoProductsFound
              message={`No items matching "${query}".`}
              onResetFilters={() => setQuery('')}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/ui/Icon';
import { SearchBar } from '@/components/ui/SearchBar';
import { ProductGridCard, ProductGridItem } from '@/components/product/ProductGridCard';
import { MedicineListItem, MedicineItemData } from '@/components/medicine/MedicineListItem';
import { NoProductsFound } from '@/features/products/components/NoProductsFound';
import { fetchProductsApi } from '@/features/products/api/productsApi';
import { useDebouncedValue } from '@/features/search/api/useSearch';
import {
  getLocalRecentSearches,
  recordSearchHistory,
  removeLocalSearchQuery,
  clearAllSearchHistory,
} from '@/features/search/api/searchHistory';
import { useCartStore } from '@/store/useCartStore';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';

function assetUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  const baseUrl = 'https://bazar-shodai-api.onrender.com';
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

export default function SearchScreen() {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const cartItems = useCartStore((s) => s.items);

  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => getLocalRecentSearches());

  const debouncedQuery = useDebouncedValue(query.trim(), 150);

  const { data: searchResult, isLoading } = useQuery({
    queryKey: ['search-products', debouncedQuery],
    queryFn: () => fetchProductsApi({ search: debouncedQuery, limit: 40 }),
    enabled: debouncedQuery.length >= 2,
    staleTime: 1000 * 60 * 2,
  });

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

  const products = useMemo(() => {
    const raw = (searchResult as any)?.data ?? (Array.isArray(searchResult) ? searchResult : []);
    return Array.isArray(raw) ? raw : [];
  }, [searchResult]);

  const isMedicineOnly = useMemo(() => {
    return (
      products.length > 0 &&
      products.every(
        (p: any) =>
          p.category?.slug === 'medicine' ||
          Boolean(p.medicineMeta) ||
          Boolean(p.dosageForm) ||
          (p as any).type === 'MEDICINE',
      )
    );
  }, [products]);

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      {/* Search Header */}
      <View className="flex-row items-center gap-2 px-4 py-3 border-b border-border bg-card">
        <TouchableOpacity
          onPress={() => router.back()}
          delayPressIn={0}
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
            placeholder="Search groceries, fish, beef, medicines..."
          />
        </View>
      </View>

      {/* Query is Empty: Show Recent Searches & Quick Pills */}
      {query.trim().length < 2 ? (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {recentSearches.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Recent Searches
                </Text>
                <TouchableOpacity onPress={handleClearHistory} delayPressIn={0} activeOpacity={0.7}>
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
                    <TouchableOpacity onPress={() => handleSelectRecent(term)} delayPressIn={0}>
                      <Text className="text-xs font-medium text-foreground mr-1.5">{term}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleRemoveRecent(term)}
                      delayPressIn={0}
                      className="p-0.5"
                    >
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
                'Napa',
                'সয়াবিন তেল',
                'ফার্মের ডিম',
                'কাঁচা মরিচ',
                'নাজিরশাইল চাল',
              ].map((tag) => (
                <TouchableOpacity
                  key={tag}
                  delayPressIn={0}
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
      ) : isMedicineOnly ? (
        /* Medicine Single-Column List View */
        <FlatList
          key="med-search-list"
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={1}
          contentContainerStyle={{ paddingVertical: 8, paddingHorizontal: 12, paddingBottom: 32 }}
          renderItem={({ item }) => {
            const cartItem = cartItems.find((i) => i.productId === item.id);
            const rawImage =
              item.image ||
              item.imageUrl ||
              item.images?.[0]?.url ||
              item.primaryImage?.url;

            const price = Number(item.price ?? item.sellingPrice ?? 0);
            const regularPrice = item.regularPrice ? Number(item.regularPrice) : undefined;
            const isUntracked = item.trackStock === false;
            const inStock =
              item.inStock !== false &&
              (isUntracked || item.stock === undefined || Number(item.stock) > 0);

            const medData: MedicineItemData = {
              id: item.id,
              name: item.name,
              nameBn: item.nameBn ?? undefined,
              slug: item.slug,
              price,
              originalPrice: regularPrice,
              genericName:
                item.medicineMeta?.genericName || (item as any).genericName || undefined,
              dosageForm:
                item.medicineMeta?.dosageForm || (item as any).dosageForm || 'Tablet',
              strength: item.medicineMeta?.strength || (item as any).strength || undefined,
              manufacturer:
                item.medicineMeta?.manufacturer ||
                item.brand?.name ||
                (item as any).manufacturer ||
                undefined,
              isPrescriptionRequired: Boolean(
                item.medicineMeta?.isPrescriptionRequired ?? (item as any).isPrescriptionRequired,
              ),
              unit: item.unit?.shortLabelBn || item.unit?.shortLabel || 'pack',
              stock: item.stock ? Number(item.stock) : undefined,
              trackStock: item.trackStock,
              inStock,
              imageUrl: assetUrl(rawImage),
            };

            return (
              <MedicineListItem
                product={medData}
                quantityInCart={cartItem?.quantity}
                onPress={() => router.push(`/product/${item.slug}`)}
                onAddToCart={() => {
                  addItem(
                    {
                      id: item.id,
                      productId: item.id,
                      name: medData.nameBn || medData.name,
                      price: medData.price,
                      unit: medData.unit,
                      imageUrl: medData.imageUrl,
                    },
                    1,
                  );
                  toast.success('Cart', `${medData.nameBn || medData.name} যোগ করা হয়েছে`);
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
            );
          }}
          ListEmptyComponent={
            <NoProductsFound
              message={`No medicine matching "${query}".`}
              onResetFilters={() => setQuery('')}
            />
          }
        />
      ) : (
        /* Standard Products 2-Column Grid */
        <FlatList
          key="product-search-grid"
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
          columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
          renderItem={({ item }) => {
            const cartItem = cartItems.find((i) => i.productId === item.id);
            const rawImage =
              item.image ||
              item.imageUrl ||
              item.images?.[0]?.url ||
              item.primaryImage?.url;

            const price = Number(item.price ?? item.sellingPrice ?? 0);
            const regularPrice = item.regularPrice ? Number(item.regularPrice) : undefined;
            const isUntracked = item.trackStock === false;
            const inStock =
              item.inStock !== false &&
              (isUntracked || item.stock === undefined || Number(item.stock) > 0);

            const discount =
              item.discountPercent ??
              (regularPrice && regularPrice > price
                ? Math.round(((regularPrice - price) / regularPrice) * 100)
                : 0);

            const gridItem: ProductGridItem = {
              id: item.id,
              name: item.nameBn || item.name,
              banglaName: item.nameBn ?? undefined,
              slug: item.slug,
              price,
              originalPrice: regularPrice,
              imageUrl: assetUrl(rawImage),
              unit: item.unit?.shortLabelBn || item.unit?.shortLabel || 'kg',
              stock: item.stock ? Number(item.stock) : undefined,
              trackStock: item.trackStock,
              inStock,
              discountPercent: discount > 0 ? discount : undefined,
              badge: discount > 0 ? `-${discount}%` : undefined,
            };

            return (
              <View style={styles.gridItemWrapper}>
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
                        price: gridItem.price,
                        unit: gridItem.unit,
                        imageUrl: gridItem.imageUrl,
                      },
                      item.unit?.minQty ?? 1,
                    );
                    toast.success('Cart', `${gridItem.name} যোগ করা হয়েছে`);
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

const styles = StyleSheet.create({
  gridItemWrapper: {
    flex: 1,
  },
});

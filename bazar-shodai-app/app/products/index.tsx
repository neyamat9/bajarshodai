import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { ProductGridCard, ProductGridItem } from '@/components/product/ProductGridCard';
import { SortBottomSheet, SortOptionValue } from '@/features/products/components/SortBottomSheet';
import { FilterBottomSheet, FilterState } from '@/features/products/components/FilterBottomSheet';
import { NoProductsFound } from '@/features/products/components/NoProductsFound';
import { useInfiniteProducts } from '@/features/products/hooks/useInfiniteProducts';
import { useCartStore } from '@/store/useCartStore';
import { useQuickViewStore } from '@/store/useQuickViewStore';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';

export default function ProductListingScreen() {
  const router = useRouter();
  const openQuickView = useQuickViewStore((s) => s.openQuickView);
  const searchParams = useLocalSearchParams<{
    category?: string;
    brand?: string;
    search?: string;
    title?: string;
  }>();

  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);

  const [sortBy, setSortBy] = useState<SortOptionValue>('popular');
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    inStockOnly: false,
    selectedBrand: searchParams.brand,
  });

  const queryParams = useMemo(
    () => ({
      category: searchParams.category,
      brand: filters.selectedBrand,
      search: searchParams.search,
      inStock: filters.inStockOnly ? true : undefined,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      sortBy,
    }),
    [searchParams, filters, sortBy],
  );

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteProducts(queryParams);

  const allProducts = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data]);

  const totalCount = data?.pages[0]?.total ?? allProducts.length;
  const pageTitle =
    searchParams.title || (searchParams.category ? `${searchParams.category}` : 'All Groceries');

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

        <View className="flex-1 mx-3">
          <Text className="text-base font-bold text-foreground capitalize" numberOfLines={1}>
            {pageTitle}
          </Text>
          <Text className="text-[11px] text-muted-foreground">{totalCount} products available</Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/search')}
          className="p-2 rounded-full bg-muted/40 mr-1"
        >
          <Icon name="Search" size={18} color="#0b6234" />
        </TouchableOpacity>
      </View>

      {/* Sort & Filter Action Bar */}
      <View style={styles.filterBar} className="bg-card border-b border-border">
        <TouchableOpacity
          onPress={() => setShowSortSheet(true)}
          style={styles.actionBtn}
          activeOpacity={0.7}
        >
          <Icon name="ArrowUpDown" size={14} color="#0b6234" />
          <Text className="text-xs font-semibold text-foreground ml-1.5">Sort</Text>
        </TouchableOpacity>

        <View style={styles.divider} className="bg-border" />

        <TouchableOpacity
          onPress={() => setShowFilterSheet(true)}
          style={styles.actionBtn}
          activeOpacity={0.7}
        >
          <Icon name="SlidersHorizontal" size={14} color="#0b6234" />
          <Text className="text-xs font-semibold text-foreground ml-1.5">Filter</Text>
          {(filters.inStockOnly || filters.selectedBrand || filters.minPrice) && (
            <View style={styles.activeDot} className="bg-brand-fresh" />
          )}
        </TouchableOpacity>
      </View>

      {/* Product Grid */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0b6234" />
        </View>
      ) : (
        <FlatList
          data={allProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
          columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
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
                  onPress={() => openQuickView(gridItem as any)}
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
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color="#0b6234" />
              </View>
            ) : undefined
          }
          ListEmptyComponent={
            <NoProductsFound
              onResetFilters={() => {
                setFilters({ inStockOnly: false });
                setSortBy('popular');
              }}
            />
          }
        />
      )}

      {/* Sort Sheet */}
      <SortBottomSheet
        visible={showSortSheet}
        activeSort={sortBy}
        onSelectSort={setSortBy}
        onClose={() => setShowSortSheet(false)}
      />

      {/* Filter Sheet */}
      <FilterBottomSheet
        visible={showFilterSheet}
        initialFilters={filters}
        onApplyFilters={setFilters}
        onClose={() => setShowFilterSheet(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
  },
  divider: {
    width: 1,
    height: 24,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 4,
  },
});

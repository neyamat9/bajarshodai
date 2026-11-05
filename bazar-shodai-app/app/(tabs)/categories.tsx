import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/ui/Icon';
import { ProductGridCard, ProductGridItem } from '@/components/product/ProductGridCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useHomeCategories } from '@/features/home/api/useHomeData';
import { fetchProductsApi } from '@/features/products/api/productsApi';
import { useCartStore } from '@/store/useCartStore';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';

export default function CategoriesScreen() {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const cartItems = useCartStore((s) => s.items);

  const { data: rawCategories = [], isLoading: categoriesLoading } = useHomeCategories();
  const categories = useMemo(
    () => (Array.isArray(rawCategories) ? rawCategories : []),
    [rawCategories],
  );

  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [selectedSubCategorySlug, setSelectedSubCategorySlug] = useState<string | null>(null);

  const activeCategory =
    (selectedCategorySlug ? categories.find((c) => c.slug === selectedCategorySlug) : null) ||
    categories[0];

  const currentCategorySlug = activeCategory?.slug || '';

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['category-products', currentCategorySlug, selectedSubCategorySlug],
    queryFn: () =>
      fetchProductsApi({
        category: currentCategorySlug,
        subCategory: selectedSubCategorySlug ?? undefined,
        limit: 40,
      }),
    enabled: Boolean(currentCategorySlug),
  });

  const products = (productsData as any)?.data ?? (Array.isArray(productsData) ? productsData : []);

  const subCategories =
    activeCategory?.children || (activeCategory as any)?.subCategories || [];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border bg-card">
        <Text className="text-xl font-bold text-foreground">
          {activeCategory?.nameBn || activeCategory?.name || 'Categories'}
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/search')}
          className="p-2 rounded-full bg-muted/40"
          accessibilityRole="button"
          accessibilityLabel="Search"
        >
          <Icon name="Search" size={18} color="#0b6234" />
        </TouchableOpacity>
      </View>

      {/* Main 2-Column Split Layout */}
      <View style={styles.splitLayout}>
        {/* Left Category Rail */}
        <View style={styles.leftRail} className="bg-muted/20 border-r border-border">
          {categoriesLoading ? (
            <ActivityIndicator style={{ marginTop: 24 }} color="#0b6234" />
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {categories.map((cat) => {
                const isSelected = activeCategory?.slug === cat.slug;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => {
                      haptics.selection();
                      setSelectedCategorySlug(cat.slug);
                      setSelectedSubCategorySlug(null);
                    }}
                    style={[styles.railItem, isSelected ? styles.railItemActive : null]}
                    className={isSelected ? 'bg-card' : ''}
                  >
                    {isSelected && <View style={styles.activeBorder} />}
                    <Text
                      style={[styles.railText, isSelected ? styles.railTextActive : null]}
                      className={
                        isSelected
                          ? 'font-bold text-brand-deep dark:text-brand-fresh'
                          : 'text-muted-foreground'
                      }
                      numberOfLines={2}
                    >
                      {cat.nameBn || cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Right Products Pane */}
        <View style={styles.rightPane}>
          {/* Subcategories Chips if available */}
          {subCategories.length > 0 && (
            <View className="py-2 px-3 border-b border-border bg-card">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => setSelectedSubCategorySlug(null)}
                    className={`px-3 py-1 rounded-full border ${
                      selectedSubCategorySlug === null
                        ? 'bg-brand-fresh border-brand-fresh'
                        : 'bg-background border-border'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        selectedSubCategorySlug === null ? 'text-white' : 'text-foreground'
                      }`}
                    >
                      সব
                    </Text>
                  </TouchableOpacity>
                  {subCategories.map((sub: any) => {
                    const isSubSelected = selectedSubCategorySlug === sub.slug;
                    return (
                      <TouchableOpacity
                        key={sub.id || sub.slug}
                        onPress={() => {
                          haptics.selection();
                          setSelectedSubCategorySlug(sub.slug);
                        }}
                        className={`px-3 py-1 rounded-full border ${
                          isSubSelected
                            ? 'bg-brand-fresh border-brand-fresh'
                            : 'bg-background border-border'
                        }`}
                      >
                        <Text
                          className={`text-xs font-semibold ${
                            isSubSelected ? 'text-white' : 'text-foreground'
                          }`}
                        >
                          {sub.nameBn || sub.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Products Grid */}
          {productsLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#0b6234" />
            </View>
          ) : (
            <FlatList
              data={products}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={{ padding: 8, paddingBottom: 24 }}
              columnWrapperStyle={{ gap: 8, marginBottom: 8 }}
              renderItem={({ item }) => {
                const cartItem = cartItems.find((i) => i.productId === item.id);
                const rawImage =
                  item.image ||
                  item.imageUrl ||
                  item.images?.[0]?.url ||
                  item.primaryImage?.url;

                const price = Number(item.price ?? item.sellingPrice ?? 0);
                const regularPrice = item.regularPrice ? Number(item.regularPrice) : undefined;
                const discount =
                  item.discountPercent ??
                  (regularPrice && regularPrice > price
                    ? Math.round(((regularPrice - price) / regularPrice) * 100)
                    : undefined);

                const gridItem: ProductGridItem = {
                  id: item.id,
                  name: item.name,
                  banglaName: item.nameBn ?? undefined,
                  slug: item.slug,
                  price,
                  originalPrice: regularPrice,
                  imageUrl: rawImage,
                  unit: item.unit?.shortLabelBn || item.unit?.shortLabel || 'kg',
                  packSize: item.packSize ?? undefined,
                  stock: item.stock ? Number(item.stock) : undefined,
                  discountPercent: discount,
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
                            name: gridItem.banglaName || gridItem.name,
                            price: gridItem.price,
                            unit: gridItem.unit,
                            imageUrl: gridItem.imageUrl,
                          },
                          item.unit?.minQty ? Number(item.unit.minQty) : 1,
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
              }}
              ListEmptyComponent={
                <EmptyState
                  title="কোন পণ্য পাওয়া যায়নি"
                  description="এই ক্যাটাগরিতে বর্তমানে কোনো পণ্য পাওয়া যায়নি।"
                  actionLabel="সব ক্যাটাগরি দেখুন"
                  onAction={() => setSelectedSubCategorySlug(null)}
                />
              }
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  splitLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  leftRail: {
    width: 90,
  },
  railItem: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  railItemActive: {
    borderRightWidth: 0,
  },
  activeBorder: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3.5,
    backgroundColor: '#0b6234',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  railText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
  railTextActive: {
    fontWeight: '700',
  },
  rightPane: {
    flex: 1,
  },
});

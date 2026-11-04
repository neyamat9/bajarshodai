import React from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { AppHeader } from '@/components/navigation/AppHeader';
import { BannerCarousel } from '@/components/home/BannerCarousel';
import { CategoryTile } from '@/components/category/CategoryTile';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { toast } from '@/store/useToastStore';
import { useRootDoubleTapToExit } from '@/hooks/useHardwareBack';
import { api } from '@/api/client';
import { ENV } from '@/config/env';

const SAMPLE_BANNERS = [
  {
    id: 'b1',
    imageUrl:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
    title: 'Fresh Daily Groceries',
    subtitle: '100% Organic & Freshly Picked in Shahrasti',
    deeplink: 'bazarshodai://category/vegetables',
  },
  {
    id: 'b2',
    imageUrl:
      'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=800&q=80',
    title: 'Farm Fresh Vegetables',
    subtitle: 'Directly from local growers to your doorstep',
    deeplink: 'bazarshodai://category/organic',
  },
  {
    id: 'b3',
    imageUrl:
      'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fit=crop&w=800&q=80',
    title: 'River Fresh Fish',
    subtitle: 'Hilsha, Rui, Katla fresh cut daily',
    deeplink: 'bazarshodai://category/fish',
  },
];

const QUICK_CATEGORIES = [
  { id: 'c1', name: 'Vegetables', slug: 'vegetables', count: 48 },
  { id: 'c2', name: 'Fresh Fish', slug: 'fish', count: 24 },
  { id: 'c3', name: 'Halal Meat', slug: 'meat', count: 18 },
  { id: 'c4', name: 'Fresh Fruits', slug: 'fruits', count: 32 },
  { id: 'c5', name: 'Dairy & Eggs', slug: 'dairy', count: 15 },
  { id: 'c6', name: 'Spices & Oil', slug: 'spices', count: 42 },
];

export default function HomeScreen() {
  // Intercept back button on root screen: double tap within 2s exits app
  useRootDoubleTapToExit(true);

  const {
    data: pingData,
    isLoading: pingLoading,
    isError: pingError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['api-ping'],
    queryFn: () => api.ping(),
  });

  return (
    <SafeAreaView edges={['left', 'right']} className="flex-1 bg-background">
      <AppHeader />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetch();
              toast.info('Refreshed', 'Feed updated with latest live status');
            }}
          />
        }
      >
        {/* Promotional Banner Carousel */}
        <View className="mt-3 mb-4">
          <BannerCarousel banners={SAMPLE_BANNERS} />
        </View>

        {/* Categories Bar */}
        <View className="px-4 mb-5">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-bold text-foreground">Shop by Category</Text>
            <Text className="text-xs font-semibold text-brand-deep dark:text-brand-fresh">
              See All
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-3">
              {QUICK_CATEGORIES.map((cat) => (
                <CategoryTile
                  key={cat.id}
                  category={{
                    id: cat.id,
                    name: cat.name,
                    slug: cat.slug,
                    productCount: cat.count,
                  }}
                  onPress={() => {
                    toast.info('Category Selected', `Viewing ${cat.slug} catalog`);
                  }}
                />
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Live Backend Gateway Status */}
        <View className="px-4 mb-4">
          <Card className="w-full">
            <CardHeader className="flex-row items-center justify-between mb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Backend API Gateway
              </CardTitle>
              <Badge
                label={pingLoading ? 'CONNECTING' : pingError ? 'OFFLINE' : 'ONLINE'}
                variant={pingLoading ? 'neutral' : pingError ? 'tomato' : 'fresh'}
                size="sm"
              />
            </CardHeader>
            <Text className="text-xs font-medium text-brand-fresh mb-2" numberOfLines={1}>
              {ENV.API_BASE_URL}
            </Text>
            <View className="flex-row items-center justify-between pt-2 border-t border-border">
              <Text className="text-xs text-muted-foreground">Gateway status:</Text>
              <Text className="text-xs font-semibold text-foreground">
                {pingLoading
                  ? 'Verifying...'
                  : pingError
                    ? 'Fallback offline mode'
                    : `Active (${pingData?.message ?? 'Healthy'})`}
              </Text>
            </View>
          </Card>
        </View>

        {/* Express Delivery Banner */}
        <View className="px-4">
          <View className="p-4 rounded-brand bg-brand-fresh/10 border border-brand-fresh/20 flex-row items-center justify-between">
            <View className="flex-1 mr-3">
              <Text className="text-sm font-bold text-brand-deep dark:text-brand-fresh mb-0.5">
                ⚡ 30-Minute Express Delivery
              </Text>
              <Text className="text-xs text-muted-foreground leading-relaxed">
                Free home delivery across Shahrasti municipal area for orders over ৳500.
              </Text>
            </View>
            <Button
              title="Order Now"
              size="sm"
              variant="primary"
              onPress={() => toast.success('Cart', 'Explore fresh items today!')}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

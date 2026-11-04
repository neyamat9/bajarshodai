import React from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeHeader } from '@/features/home/components/HomeHeader';
import { QuickJumpBar } from '@/features/home/components/QuickJumpBar';
import { HeroSliderSection } from '@/features/home/components/HeroSliderSection';
import { CategoryGridSection } from '@/features/home/components/CategoryGridSection';
import { FeaturedProductsSection } from '@/features/home/components/FeaturedProductsSection';
import { BestSellersSection } from '@/features/home/components/BestSellersSection';
import { BrandShowcaseSection } from '@/features/home/components/BrandShowcaseSection';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';
import { useRootDoubleTapToExit } from '@/hooks/useHardwareBack';
import { useHomeData } from '@/features/home/api/useHomeData';

function HomeSkeleton() {
  return (
    <View className="p-4">
      {/* Hero Banner Skeleton */}
      <Skeleton height={170} borderRadius={8} className="mb-6" />

      {/* Categories Row Skeleton */}
      <View className="flex-row gap-3 mb-6">
        <Skeleton width={80} height={80} borderRadius={40} />
        <Skeleton width={80} height={80} borderRadius={40} />
        <Skeleton width={80} height={80} borderRadius={40} />
        <Skeleton width={80} height={80} borderRadius={40} />
      </View>

      {/* Featured Header Skeleton */}
      <Skeleton width={180} height={20} className="mb-4" />

      {/* Products Row Skeleton */}
      <View className="flex-row gap-3 mb-6">
        <Skeleton width={160} height={220} borderRadius={8} />
        <Skeleton width={160} height={220} borderRadius={8} />
      </View>
    </View>
  );
}

export default function HomeScreen() {
  // Double-tap back exit protection on root tab
  useRootDoubleTapToExit(true);

  const {
    banners,
    categories,
    featured,
    bestSellers,
    brands,
    isLoading,
    isRefetching,
    refetchAll,
  } = useHomeData();

  const handleRefresh = async () => {
    haptics.light();
    await refetchAll();
    haptics.success();
    toast.info('Refreshed', 'Feed updated with live products and prices');
  };

  return (
    <SafeAreaView edges={['left', 'right']} className="flex-1 bg-background">
      {/* Sticky Top Header */}
      <HomeHeader />

      {/* Quick Jump Pill Bar */}
      <QuickJumpBar />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />}
      >
        {isLoading && !isRefetching ? (
          <HomeSkeleton />
        ) : (
          <>
            {/* Hero Carousel */}
            <HeroSliderSection banners={banners} />

            {/* Shop by Category */}
            <CategoryGridSection categories={categories} />

            {/* Featured Products (আজকের তাজা বাজার) */}
            <FeaturedProductsSection products={featured} />

            {/* Express Delivery Guarantee Banner */}
            <View className="px-4 mb-5">
              <View className="p-4 rounded-brand bg-brand-fresh/10 border border-brand-fresh/25 flex-row items-center justify-between">
                <View className="flex-1 mr-3">
                  <Text className="text-sm font-bold text-brand-deep dark:text-brand-fresh mb-0.5">
                    ⚡ ৩০-৬০ মিনিট এক্সপ্রেস ডেলিভারি
                  </Text>
                  <Text className="text-xs text-muted-foreground leading-relaxed">
                    শাহরাস্তি সদরের যে কোনো প্রান্তে দ্রুত তাজা বাজার পৌঁছে যাবে আপনার ঠিকানায়।
                  </Text>
                </View>
                <Button
                  title="অর্ডার করুন"
                  size="sm"
                  variant="primary"
                  onPress={() => toast.success('Cart', 'Explore fresh items today!')}
                />
              </View>
            </View>

            {/* Best Sellers (জনপ্রিয় পণ্য সমূহ) */}
            <BestSellersSection products={bestSellers} />

            {/* Brand Showcase (ব্র্যান্ড কর্নার) */}
            <BrandShowcaseSection brands={brands} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

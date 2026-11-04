import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { HomeFeedData, BannerItemData, HomeCategoryData } from '../types';

export async function getHomeFeedApi(): Promise<HomeFeedData> {
  return api.get<HomeFeedData>('/customer/home');
}

export async function getHomeBannersApi(position?: string): Promise<BannerItemData[]> {
  const query = position ? `?position=${encodeURIComponent(position)}` : '';
  return api.get<BannerItemData[]>(`/customer/banners${query}`);
}

export async function getHomeCategoriesApi(): Promise<HomeCategoryData[]> {
  return api.get<HomeCategoryData[]>('/customer/categories');
}

export function useHomeFeed() {
  return useQuery({
    queryKey: ['home-feed'],
    queryFn: getHomeFeedApi,
    staleTime: 1000 * 60 * 3, // 3 minutes cache
  });
}

export function useHomeBanners(position?: string) {
  return useQuery({
    queryKey: ['home-banners', position ?? 'all'],
    queryFn: () => getHomeBannersApi(position),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

export function useHomeCategories() {
  return useQuery({
    queryKey: ['home-categories'],
    queryFn: getHomeCategoriesApi,
    staleTime: 1000 * 60 * 10, // 10 minutes cache
  });
}

/**
 * High-performance aggregated hook running queries in parallel
 */
export function useHomeData() {
  const feedQuery = useHomeFeed();
  const bannersQuery = useHomeBanners('HERO_MAIN');
  const categoriesQuery = useHomeCategories();

  const isLoading = feedQuery.isLoading || bannersQuery.isLoading || categoriesQuery.isLoading;
  const isRefetching =
    feedQuery.isRefetching || bannersQuery.isRefetching || categoriesQuery.isRefetching;
  const isError = feedQuery.isError && bannersQuery.isError;

  const refetchAll = async () => {
    await Promise.allSettled([
      feedQuery.refetch(),
      bannersQuery.refetch(),
      categoriesQuery.refetch(),
    ]);
  };

  return {
    feed: feedQuery.data,
    banners: bannersQuery.data ?? [],
    categories: categoriesQuery.data ?? feedQuery.data?.categories ?? [],
    brands: feedQuery.data?.brands ?? [],
    featured: feedQuery.data?.featured ?? [],
    bestSellers: Array.isArray(feedQuery.data?.bestSellers)
      ? feedQuery.data.bestSellers
      : (feedQuery.data?.bestSellers?.data ?? []),
    newArrivals: Array.isArray(feedQuery.data?.newArrivals)
      ? feedQuery.data.newArrivals
      : (feedQuery.data?.newArrivals?.data ?? []),
    onSale: Array.isArray(feedQuery.data?.onSale)
      ? feedQuery.data.onSale
      : (feedQuery.data?.onSale?.data ?? []),
    isLoading,
    isRefetching,
    isError,
    refetchAll,
  };
}

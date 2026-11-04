import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchProductsApi, ProductsQueryParams } from '../api/productsApi';

export function useInfiniteProducts(baseParams: Omit<ProductsQueryParams, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: ['products-infinite', baseParams],
    queryFn: ({ pageParam = 1 }) => fetchProductsApi({ ...baseParams, page: pageParam, limit: 16 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    staleTime: 1000 * 60 * 3, // 3 minutes
  });
}

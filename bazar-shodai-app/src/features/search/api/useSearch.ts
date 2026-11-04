import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { ProductCardData, HomeCategoryData, HomeBrandData } from '@/features/home/types';

export interface SearchSuggestionsResult {
  products: ProductCardData[];
  categories: HomeCategoryData[];
  brands: HomeBrandData[];
}

export async function fetchSearchSuggestions(query: string): Promise<SearchSuggestionsResult> {
  const term = query.trim();
  if (!term) {
    return { products: [], categories: [], brands: [] };
  }
  return api.get<SearchSuggestionsResult>(
    `/customer/products/suggestions?q=${encodeURIComponent(term)}&limit=8`,
  );
}

export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebounced(value);
    }, delayMs);
    return () => clearTimeout(handler);
  }, [value, delayMs]);

  return debounced;
}

export function useSearchSuggestions(query: string) {
  const debouncedQuery = useDebouncedValue(query, 300);

  return useQuery({
    queryKey: ['search-suggestions', debouncedQuery],
    queryFn: () => fetchSearchSuggestions(debouncedQuery),
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}


import { api } from '@/api/client';
import { ProductCardData } from '@/features/home/types';

export interface ProductsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  subCategory?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: 'popular' | 'price_asc' | 'price_desc' | 'rating' | 'newest' | string;
  excludeMedicine?: boolean;
}

export interface ProductsResponse {
  data: ProductCardData[];
  total: number;
  page: number;
  totalPages: number;
}

export interface FilterFacetsResponse {
  categories: { id: string; name: string; slug: string; count: number }[];
  brands: { id: string; name: string; slug: string; count: number }[];
  priceRange: { min: number; max: number };
  inStockCount: number;
  outOfStockCount: number;
}

export async function fetchProductsApi(
  params: ProductsQueryParams = {},
): Promise<ProductsResponse> {
  const queryParts: string[] = [];

  if (params.page) queryParts.push(`page=${params.page}`);
  if (params.limit) queryParts.push(`limit=${params.limit}`);
  if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
  if (params.category) queryParts.push(`category=${encodeURIComponent(params.category)}`);
  if (params.subCategory) queryParts.push(`subCategory=${encodeURIComponent(params.subCategory)}`);
  if (params.brand) queryParts.push(`brand=${encodeURIComponent(params.brand)}`);
  if (params.minPrice !== undefined) queryParts.push(`minPrice=${params.minPrice}`);
  if (params.maxPrice !== undefined) queryParts.push(`maxPrice=${params.maxPrice}`);
  if (params.inStock !== undefined) queryParts.push(`inStock=${params.inStock}`);
  if (params.sortBy) queryParts.push(`sortBy=${encodeURIComponent(params.sortBy)}`);
  if (params.excludeMedicine) queryParts.push('excludeMedicine=true');

  const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const result = await api.get<ProductsResponse | ProductCardData[]>(`/customer/products${qs}`);

  if (Array.isArray(result)) {
    return {
      data: result,
      total: result.length,
      page: params.page ?? 1,
      totalPages: 1,
    };
  }

  return result;
}

export async function fetchProductFiltersApi(categorySlug?: string): Promise<FilterFacetsResponse> {
  const query = categorySlug ? `?category=${encodeURIComponent(categorySlug)}` : '';
  return api.get<FilterFacetsResponse>(`/customer/products/filters${query}`);
}

export async function fetchProductDetailApi(slug: string): Promise<ProductCardData> {
  return api.get<ProductCardData>(`/customer/products/${encodeURIComponent(slug)}`);
}

export async function fetchRelatedProductsApi(slug: string): Promise<ProductCardData[]> {
  return api.get<ProductCardData[]>(`/customer/products/${encodeURIComponent(slug)}/related`);
}

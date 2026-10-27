import { memo } from '../api/memo';
import { api, type Paged, type PageMeta } from '../api/client';
import { mapProduct } from '../api/mappers';
import type { Product, ProductFilters } from '../types/index';
import { clientLocale, pick, type Locale } from '../locale';

export type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'popular' | 'rating' | 'name';

export interface ProductQuery {
  category?: string;
  subCategory?: string;
  search?: string;
  brand?: string[];
  generic?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  onSale?: boolean;
  rating?: number;
  tag?: string[];
  spec?: string[]; // "RAM:8GB|12GB"
  sortBy?: SortOption;
  excludeMedicine?: boolean;
  page?: number;
  limit?: number;
}

function qs(q: Record<string, unknown>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === null || v === '' || v === false) continue;
    if (Array.isArray(v)) v.forEach((x) => p.append(k, String(x)));
    else p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ProductPage {
  products: Product[];
  meta: PageMeta;
}

export async function listProducts(q: ProductQuery = {}, locale: Locale = clientLocale()): Promise<ProductPage> {
  const res = await api.get<Paged<any>>(`/customer/products${qs({ limit: 24, ...q })}`);
  return { products: res.data.map((p) => mapProduct(p, locale)), meta: res.meta };
}

export interface FacetBrand {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  count: number;
}
export interface ProductFacets {
  total: number;
  price: { min: number; max: number };
  brands: FacetBrand[];
  generics?: { name: string; count: number }[];
  specs: { name: string; param: string; values: { value: string; count: number }[] }[];
  ratings: { minRating: number; count: number }[];
  tags: { tag: string; count: number }[];
}
export async function getProductFacets(scope: { category?: string; subCategory?: string; search?: string; excludeMedicine?: boolean } = {}): Promise<ProductFacets> {
  const f = await api.get<any>(`/customer/products/filters${qs(scope)}`);
  return {
    total: f.total ?? 0,
    price: { min: Number(f.price?.min ?? 0), max: Number(f.price?.max ?? 0) },
    brands: f.brands ?? [],
    generics: f.generics ?? [],
    specs: f.specs ?? [],
    ratings: f.ratings ?? [],
    tags: f.tags ?? [],
  };
}

// Pages that only need "all products" style lists.
export async function getProducts(filters?: ProductFilters, locale: Locale = clientLocale()): Promise<Product[]> {
  const sort: Record<string, SortOption> = { 'price-asc': 'price-asc', 'price-desc': 'price-desc', newest: 'newest', popular: 'popular' };
  const { products } = await listProducts({
    brand: filters?.brands,
    minPrice: filters?.minPrice,
    maxPrice: filters?.maxPrice,
    inStock: filters?.inStockOnly,
    sortBy: filters?.sortBy ? sort[filters.sortBy] : undefined,
    limit: 100,
  }, locale);
  return products;
}

export async function getProductBySlug(slug: string, locale: Locale = clientLocale()): Promise<Product | null> {
  try {
    return mapProduct(await api.get<any>(`/customer/products/${encodeURIComponent(slug)}`, { revalidate: 300 }), locale);
  } catch (e) {
    if ((e as { status?: number }).status === 404) return null;
    throw e;
  }
}

// raw detail incl. reviews/questions the API sends with it
export async function getProductDetailRaw(slug: string): Promise<any | null> {
  try {
    return await api.get<any>(`/customer/products/${encodeURIComponent(slug)}`);
  } catch (e) {
    if ((e as { status?: number }).status === 404) return null;
    throw e;
  }
}

export async function getRelatedProducts(slug: string, limit = 6, locale: Locale = clientLocale()): Promise<Product[]> {
  const rows = await api.get<any[]>(`/customer/products/${encodeURIComponent(slug)}/related${qs({ limit })}`, { revalidate: 300 }).catch(() => []);
  return rows.map((p) => mapProduct(p, locale));
}

export async function getFeaturedProducts(limit = 8, locale: Locale = clientLocale()): Promise<Product[]> {
  const rows = await api.get<any[]>(`/customer/products/featured${qs({ limit })}`);
  return rows.map((p) => mapProduct(p, locale));
}

export interface SuggestionResult {
  products: Product[];
  categories: { name: string; slug: string; image: string | null }[];
  subCategories: { name: string; slug: string; parentCategory?: { name: string; slug: string } }[];
  brands: { name: string; slug: string; logo: string | null }[];
}
export async function getSuggestions(q: string, limit = 6, locale: Locale = clientLocale()): Promise<SuggestionResult> {
  // the same words typed again within 5 minutes are answered from memory
  const r = await memo(`suggest:${limit}:${q.trim().toLowerCase()}`, 5 * 60_000, () => api.get<any>(`/customer/products/suggestions${qs({ q, limit })}`, { revalidate: 0 }));
  return {
    products: (r.products ?? []).map((p: any) => mapProduct(p, locale)),
    categories: (r.categories ?? []).map((c: any) => ({ ...c, name: pick(locale, c.name, c.nameBn) })),
    subCategories: (r.subCategories ?? []).map((c: any) => ({ ...c, name: pick(locale, c.name, c.nameBn) })),
    brands: r.brands ?? [],
  };
}

export async function searchProducts(query: string, locale: Locale = clientLocale()): Promise<Product[]> {
  if (!query.trim()) return [];
  return (await getSuggestions(query, 8, locale)).products;
}

export async function getProductsByCategory(category: string, filters?: ProductFilters, locale: Locale = clientLocale()): Promise<Product[]> {
  return (await listProducts({ category, brand: filters?.brands, limit: 100 }, locale)).products;
}
export async function getProductsByBrand(brand: string, locale: Locale = clientLocale()): Promise<Product[]> {
  return (await listProducts({ brand: [brand], limit: 100 }, locale)).products;
}

export interface HomeData {
  featured: Product[];
  newArrivals: Product[];
  bestSellers: Product[];
  onSale: Product[];
}
export async function getHomeData(locale: Locale = clientLocale()): Promise<HomeData> {
  const h = await api.get<any>('/customer/home', { revalidate: 300 });
  const m = (list: any[] | undefined) => (list ?? []).map((p) => mapProduct(p, locale));
  return {
    featured: m(h.featured),
    newArrivals: m(h.newArrivals),
    bestSellers: m(h.bestSellers),
    onSale: m(h.onSale),
  };
}

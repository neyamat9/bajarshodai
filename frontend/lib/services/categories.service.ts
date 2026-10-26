import { api } from '../api/client';
import { mapCategory } from '../api/mappers';
import type { Category } from '../types/index';
import { clientLocale, type Locale } from '../locale';

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function getCategories(locale: Locale = clientLocale()): Promise<Category[]> {
  try {
    const rows = await api.get<any[]>('/customer/categories', { revalidate: 300 });
    return rows.map((c) => mapCategory(c, locale));
  } catch {
    return []; // the menu must never break a page
  }
}

export async function getCategoryBySlug(slug: string, locale: Locale = clientLocale()): Promise<Category | null> {
  try {
    return mapCategory(await api.get<any>(`/customer/categories/${encodeURIComponent(slug)}`, { revalidate: 300 }), locale);
  } catch (e) {
    if ((e as { status?: number }).status === 404) return null;
    throw e;
  }
}

/** Categories that actually have products — what menus and the home page should show. */
export async function getShopCategories(locale: Locale = clientLocale()): Promise<Category[]> {
  const all = await getCategories(locale);
  const stocked = all.filter((c) => c.productCount > 0 || c.slug === 'medicine');
  const list = stocked.length > 0 ? stocked : all;
  return [...list].sort((a, b) => {
    if (a.slug === 'medicine') return -1;
    if (b.slug === 'medicine') return 1;
    return 0;
  });
}

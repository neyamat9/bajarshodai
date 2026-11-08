"use client";

import NoIndexWhenFiltered from "@/components/seo/NoIndexWhenFiltered";
import { errorMessage } from "@/lib/api/client";
import { listProducts, type ProductPage, type ProductQuery, type SortOption } from "@/lib/services/products.service";
import type { Brand, Category, Product } from "@/lib/types";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import EmptyState from "./EmptyState";
import { useLocale, useTranslations } from "next-intl";
import { formatMoney } from "@/lib/format";
import type { Locale } from "@/lib/locale";
import type { ActiveFilter } from "./FilterChips";
import FilterChips from "./FilterChips";
import type { FilterState } from "./FilterSidebar";
import FilterSidebar from "./FilterSidebar";
import ProductCard from "./ProductCard";
import MedicineListItem from "@/components/medicine/MedicineListItem";
import MedicineDetailModal from "@/components/medicine/MedicineDetailModal";
import MedicineSearchBar from "@/components/medicine/MedicineSearchBar";
import SortBar from "./SortBar";
import { flattenSubs } from "@/lib/utils/categories";
import { recalculateScrollBounds } from "@/components/motion/scroll-top";
import { useRouter } from "@/i18n/navigation";

interface ProductGridProps {
  /** Optional page header / title rendered at the top of the main column */
  header?: React.ReactNode;
  /** First page, fetched on the server */
  initial: ProductPage;
  categories: Category[];
  /** Brands that have products in this view (with counts) */
  brands: Brand[];
  /** Generic pharmaceutical molecules (with counts) */
  generics?: { name: string; count: number }[];
  /** price range of this view */
  priceRange: { min: number; max: number };
  /** If set, the category filter is locked to this slug (category page) */
  lockedCategory?: string;
  /** If set, the brand filter is locked to this slug (brand page) */
  lockedBrand?: string;
  /** sub-category slug inside a category page */
  subCategory?: string;
  /** search words (search page) */
  search?: string;
  /** options from the link that brought the visitor here */
  start?: { sortBy?: SortOption; onSale?: boolean; inStock?: boolean; category?: string; brand?: string; sub?: string; generic?: string };
  /** When true, strictly excludes medicine products and facets */
  excludeMedicine?: boolean;
}

const PAGE_SIZE = 24;

export default function ProductGrid({
  header,
  initial,
  categories,
  brands,
  generics,
  priceRange,
  lockedCategory,
  lockedBrand,
  subCategory,
  search,
  start,
  excludeMedicine,
}: ProductGridProps) {
  const t = useTranslations("Product");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const isMedicine = lockedCategory === "medicine";
  const [selectedMedicine, setSelectedMedicine] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">(isMedicine ? "list" : "grid");
  const [searchQuery, setSearchQuery] = useState(search ?? "");

  const handleCategoryClick = useCallback(
    (cat: Category) => {
      if (cat.slug === lockedCategory) {
        // User unchecks the locked category on a category page -> go to all products
        router.push("/products");
      } else {
        // User clicked a different category -> navigate to that category's page
        router.push(`/category/${cat.slug}`);
      }
    },
    [lockedCategory, router],
  );

  // Keep search state in sync if parent search prop changes
  useEffect(() => {
    setSearchQuery(search ?? "");
  }, [search]);

  // Synchronize browser URL query param on medicine / category search
  useEffect(() => {
    if (typeof window === "undefined" || !isMedicine) return;
    const url = new URL(window.location.href);
    const trimmed = searchQuery.trim();
    if (trimmed) {
      url.searchParams.set("q", trimmed);
    } else {
      url.searchParams.delete("q");
      url.searchParams.delete("search");
    }
    window.history.replaceState(null, "", url.toString());
  }, [searchQuery, isMedicine]);
  const priceMin = Math.floor(priceRange.min);
  const priceMax = Math.ceil(priceRange.max);
  const base: FilterState = {
    categories: lockedCategory ? [lockedCategory] : start?.category ? [start.category] : [],
    subCategories: start?.sub ? [start.sub] : [],
    brands: lockedBrand ? [lockedBrand] : start?.brand ? [start.brand] : [],
    generics: start?.generic ? [start.generic] : [],
    minPrice: priceMin,
    maxPrice: priceMax,
    inStockOnly: !!start?.inStock,
  };
  const [filters, setFilters] = useState<FilterState>(base);
  const [sortBy, setSortBy] = useState<SortOption>(start?.sortBy ?? "popular");
  const [onSale, setOnSale] = useState(!!start?.onSale);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>(initial.products);
  const [meta, setMeta] = useState(initial.meta);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const first = useRef(true);
  const reqId = useRef(0);
  const prevCount = useRef(initial.products.length);

  // slugs of the sub-categories that belong to a category
  const subsOf = useCallback(
    (catSlug: string) => {
      const owned = new Set(flattenSubs(categories.find((c) => c.slug === catSlug)?.subCategories ?? []).map((x) => x.slug));
      return filters.subCategories.filter((x) => owned.has(x));
    },
    [categories, filters.subCategories],
  );

  const effectiveSearch = searchQuery.trim();
  const query = useMemo<ProductQuery>(
    () => ({
      search: effectiveSearch || undefined,
      category: lockedCategory ?? (filters.categories.length > 0 ? filters.categories.join(",") : undefined),
      subCategory:
        filters.subCategories.length > 0
          ? (filters.categories.length === 1 ? subsOf(filters.categories[0]).join(",") || undefined : filters.subCategories.join(","))
          : subCategory,
      brand: filters.brands.length ? filters.brands : undefined,
      generic: filters.generics.length ? filters.generics : undefined,
      minPrice: filters.minPrice > priceMin ? filters.minPrice : undefined,
      maxPrice: filters.maxPrice < priceMax ? filters.maxPrice : undefined,
      inStock: filters.inStockOnly || undefined,
      onSale: onSale || undefined,
      sortBy,
      limit: PAGE_SIZE,
      excludeMedicine: excludeMedicine || undefined,
    }),
    [filters, sortBy, onSale, effectiveSearch, lockedCategory, subCategory, priceMin, priceMax, subsOf, excludeMedicine],
  );

  // Synchronously after DOM commits the updated products list:
  // ensure Lenis and ScrollTrigger recalculate bounds and clamp scroll smoothly
  useLayoutEffect(() => {
    if (first.current) {
      prevCount.current = products.length;
      return;
    }

    prevCount.current = products.length;
    recalculateScrollBounds();

    const raf1 = requestAnimationFrame(() => {
      recalculateScrollBounds();
      const raf2 = requestAnimationFrame(() => {
        recalculateScrollBounds();
      });
      return () => cancelAnimationFrame(raf2);
    });

    const timer = setTimeout(() => {
      recalculateScrollBounds();
    }, 100);

    return () => {
      cancelAnimationFrame(raf1);
      clearTimeout(timer);
    };
  }, [products, meta.page]);


  // New filters / sort → fetch page 1 again
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const id = ++reqId.current;
    setLoading(true);
    setError(null);

    const t = setTimeout(async () => {
      try {
        // several categories on a non-category page: fetch each and merge
        const cats = !lockedCategory && filters.categories.length > 1 ? filters.categories : [undefined];
        const pages = await Promise.all(cats.map((c) => listProducts({ ...query, category: c ?? query.category, ...(c ? { subCategory: subsOf(c).join(",") || undefined } : {}), page: 1 })));
        if (id !== reqId.current) return;
        const merged = cats.length > 1 ? sortLocal(dedupe(pages.flatMap((p) => p.products)), sortBy) : pages[0].products;
        setProducts(merged);
        setMeta(cats.length > 1 ? { ...pages[0].meta, total: merged.length, totalPages: 1, page: 1 } : pages[0].meta);
      } catch (e) {
        if (id === reqId.current) setError(errorMessage(e));
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    }, 150);
    return () => clearTimeout(t);
  }, [query, filters.categories, lockedCategory, sortBy, subsOf]);

  async function loadMore() {
    if (loadingMore) return;
    setError(null);
    setLoadingMore(true);
    try {
      const next = await listProducts({ ...query, page: meta.page + 1 });
      setProducts((prev) => dedupe([...prev, ...next.products]));
      setMeta(next.meta);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoadingMore(false);
    }
  }

  // keep the observer pointed at the latest loadMore (it closes over the current page and filters)
  const sentinel = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;
  const canLoadMore = meta.page < meta.totalPages && !loading && !loadingMore && !error;
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !canLoadMore) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void loadMoreRef.current();
      },
      { rootMargin: "700px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [canLoadMore, products.length]);

  // Build active filter chips
  const activeFilters = useMemo<ActiveFilter[]>(() => {
    const chips: ActiveFilter[] = [];

    filters.categories
      .filter((slug) => !lockedCategory || slug !== lockedCategory)
      .forEach((slug) => {
        const cat = categories.find((c) => c.slug === slug);
        if (cat) chips.push({ key: `category:${slug}`, label: cat.name });
      });

    filters.subCategories.forEach((slug) => {
      const sub = categories.flatMap((c) => c.subCategories).find((x) => x.slug === slug);
      if (sub) chips.push({ key: `sub:${slug}`, label: sub.name });
    });

    filters.brands
      .filter((slug) => !lockedBrand || slug !== lockedBrand)
      .forEach((slug) => {
        const brand = brands.find((b) => b.slug === slug);
        if (brand) chips.push({ key: `brand:${slug}`, label: brand.name });
      });

    filters.generics.forEach((gen) => {
      chips.push({ key: `generic:${gen}`, label: gen });
    });

    if (searchQuery.trim()) {
      chips.push({
        key: "search",
        label: `${locale === "bn" ? "অনুসন্ধান" : "Search"}: "${searchQuery.trim()}"`,
      });
    }

    if (filters.inStockOnly) chips.push({ key: "inStock", label: t("filters.inStock") });
    if (onSale) chips.push({ key: "onSale", label: t("filters.onSale") });

    if (filters.minPrice > priceMin || filters.maxPrice < priceMax) {
      chips.push({
        key: "price",
        label: `${formatMoney(filters.minPrice, locale)} – ${formatMoney(filters.maxPrice, locale)}`,
      });
    }

    return chips;
  }, [filters, onSale, categories, brands, lockedCategory, lockedBrand, priceMin, priceMax, searchQuery, t, locale]);

  const handleRemoveFilter = useCallback(
    (key: string) => {
      if (key.startsWith("category:")) {
        const slug = key.replace("category:", "");
        if (lockedCategory && slug === lockedCategory) {
          router.push("/products");
          return;
        }
        setFilters((prev) => {
          const owned = new Set(categories.find((c) => c.slug === slug)?.subCategories.map((x) => x.slug));
          return { ...prev, categories: prev.categories.filter((c) => c !== slug), subCategories: prev.subCategories.filter((x) => !owned.has(x)) };
        });
      } else if (key.startsWith("sub:")) {
        const slug = key.replace("sub:", "");
        setFilters((prev) => ({ ...prev, subCategories: prev.subCategories.filter((x) => x !== slug) }));
      } else if (key.startsWith("brand:")) {
        const slug = key.replace("brand:", "");
        setFilters((prev) => ({ ...prev, brands: prev.brands.filter((b) => b !== slug) }));
      } else if (key.startsWith("generic:")) {
        const gen = key.replace("generic:", "");
        setFilters((prev) => ({ ...prev, generics: prev.generics.filter((g) => g !== gen) }));
      } else if (key === "search") {
        setSearchQuery("");
      } else if (key === "inStock") {
        setFilters((prev) => ({ ...prev, inStockOnly: false }));
      } else if (key === "onSale") {
        setOnSale(false);
      } else if (key === "price") {
        setFilters((prev) => ({ ...prev, minPrice: priceMin, maxPrice: priceMax }));
      }
    },
    [priceMin, priceMax, categories, lockedCategory, router],
  );

  function handleClearAll() {
    if (lockedCategory) {
      const hasOtherFilters =
        filters.subCategories.length > 0 ||
        filters.brands.length > 0 ||
        filters.generics.length > 0 ||
        filters.inStockOnly ||
        onSale ||
        searchQuery.trim().length > 0 ||
        filters.minPrice > priceMin ||
        filters.maxPrice < priceMax;

      if (!hasOtherFilters) {
        router.push("/products");
        return;
      }
    }
    setFilters({ ...base, inStockOnly: false });
    setOnSale(false);
    setSearchQuery("");
  }

  const hasActiveFilters = activeFilters.length > 0;

  return (
    <div className="block lg:flex lg:items-start lg:gap-6 w-full min-w-0 min-h-[calc(100vh-var(--sticky-top,8rem)-2rem)]">
      {/* Inject noindex when filters are active to prevent crawling of filtered URLs */}
      <NoIndexWhenFiltered noIndex={hasActiveFilters} />

      {/* ── Sidebar ─────────────────────────────────── */}
      <FilterSidebar
        categories={categories}
        brands={brands}
        generics={generics}
        filters={filters}
        onFiltersChange={setFilters}
        onCategoryClick={lockedCategory ? handleCategoryClick : undefined}
        excludeMedicine={excludeMedicine}
        priceMin={priceMin}
        priceMax={priceMax}
        activeCount={activeFilters.length}
        onReset={handleClearAll}
        mobileOpen={mobileFiltersOpen}
        onMobileClose={() => setMobileFiltersOpen(false)}
      />

      {/* ── Main content ────────────────────────────── */}
      <div className="flex-1 w-full min-w-0">
        {header}

        {/* Dedicated Search bar for Medicine */}
        {isMedicine && (
          <MedicineSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            loading={loading}
            totalResults={meta.total}
          />
        )}

        {/* Sort bar with viewMode toggle */}
        <SortBar
          resultCount={meta.total}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onOpenFilters={() => setMobileFiltersOpen(true)}
          activeCount={activeFilters.length}
          inStockOnly={filters.inStockOnly}
          onInStockChange={(inStockOnly) => setFilters((prev) => ({ ...prev, inStockOnly }))}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="mb-4">
            <FilterChips
              filters={activeFilters}
              onRemove={handleRemoveFilter}
              onClearAll={handleClearAll}
            />
          </div>
        )}

        {/* Product list / grid */}
        {error && (
          <p role="alert" className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}
        <div className="transition-opacity duration-200" style={{ opacity: loading ? 0.45 : 1 }} aria-busy={loading}>
          {products.length === 0 && !loading ? (
            <EmptyState hasFilters={hasActiveFilters} onClearFilters={handleClearAll} />
          ) : viewMode === "list" ? (
            <div className="flex flex-col gap-2.5 w-full min-w-0">
              {products.map((product) =>
                product.medicineMeta ? (
                  <MedicineListItem
                    key={product.id}
                    product={product}
                    onOpenDetail={setSelectedMedicine}
                  />
                ) : (
                  <ProductCard key={product.id} product={product} />
                ),
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4">
              {products.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  animationDelay={Math.min(idx * 40, 400)}
                  onMedicineClick={
                    isMedicine || product.medicineMeta
                      ? setSelectedMedicine
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Infinite scroll: the next page loads as this marker nears the screen */}
        {meta.page < meta.totalPages && (
          <div ref={sentinel} className="mt-10 flex min-h-12 flex-col items-center justify-center gap-3">
            {error ? (
              <button
                type="button"
                onClick={loadMore}
                className="rounded border border-brand-fresh/40 bg-brand-fresh/10 px-8 py-3 text-xs font-black uppercase tracking-widest text-accent-text transition hover:bg-brand-fresh hover:text-on-fresh"
              >
                Couldn&apos;t load more — try again
              </button>
            ) : (
              <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground" role="status" aria-live="polite">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-fresh border-t-transparent" aria-hidden="true" />
                Loading more products…
              </div>
            )}
          </div>
        )}
        {meta.page >= meta.totalPages && products.length > 12 && (
          <p className="mt-10 text-center text-sm font-medium text-muted-foreground">You&apos;ve seen all {meta.total} products</p>
        )}
      </div>

      {/* Medicine Details Modal */}
      {selectedMedicine && (
        <MedicineDetailModal
          product={selectedMedicine}
          onClose={() => setSelectedMedicine(null)}
          onSelectGeneric={(gen) => {
            setFilters((prev) => ({
              ...prev,
              generics: prev.generics.includes(gen)
                ? prev.generics
                : [...prev.generics, gen],
            }));
          }}
        />
      )}
    </div>
  );
}

function dedupe(list: Product[]): Product[] {
  const seen = new Set<string>();
  return list.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
}

function sortLocal(list: Product[], sort: SortOption): Product[] {
  const l = [...list];
  if (sort === "price-asc") l.sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") l.sort((a, b) => b.price - a.price);
  else if (sort === "newest") l.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  else l.sort((a, b) => b.soldLast24h - a.soldLast24h);
  return l;
}

import ProductGrid from "@/components/product/ProductGrid";
import { ListingSkeleton } from "@/components/skeletons/PageSkeletons";
import SkeletonGrid from "@/components/product/SkeletonGrid";
import type { Locale } from "@/lib/locale";
import { getShopCategories } from "@/lib/services/categories.service";
import { getProductFacets, listProducts, type SortOption } from "@/lib/services/products.service";
import { facetBrands } from "@/lib/utils/facets";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Pages" });
  return { title: t("allProductsMeta"), description: t("allProductsDesc") };
}

const SORTS: SortOption[] = ["popular", "newest", "price-asc", "price-desc", "rating", "name"];

type Search = { sortBy?: string; onSale?: string; inStock?: string; category?: string; brand?: string; sub?: string };

// The outer page only reads the URL; the data-heavy part sits behind a Suspense boundary keyed by the
// filters, so choosing another category/brand shows the skeleton at once instead of keeping the old page.
export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Search>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  return (
    <Suspense key={`${locale}|${JSON.stringify(sp)}`} fallback={<ListingSkeleton />}>
      <ProductsContent sp={sp} locale={locale as Locale} />
    </Suspense>
  );
}

async function ProductsContent({ sp, locale }: { sp: Search; locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "Pages" });
  const sortBy = SORTS.includes(sp.sortBy as SortOption) ? (sp.sortBy as SortOption) : undefined;
  const start = { sortBy, onSale: sp.onSale === "true", inStock: sp.inStock === "true", category: sp.category || undefined, brand: sp.brand || undefined, sub: sp.sub || undefined };

  const [initial, categories, facets] = await Promise.all([
    listProducts({ sortBy: sortBy ?? "popular", onSale: start.onSale || undefined, inStock: start.inStock || undefined, category: start.category, subCategory: start.sub, brand: start.brand ? [start.brand] : undefined }, locale),
    getShopCategories(locale),
    getProductFacets({ category: start.category }),
  ]);

  const catName = categories.find((c) => c.slug === start.category)?.name;
  const brandName = facets.brands.find((b) => b.slug === start.brand)?.name;
  const subName = categories.flatMap((c) => c.subCategories).find((x) => x.slug === start.sub)?.name;
  const heading = subName
    ? { lead: "", accent: subName }
    : brandName
    ? { lead: "", accent: brandName }
    : catName
      ? { lead: "", accent: catName }
      : { lead: t("allProductsLead"), accent: t("allProductsAccent") };

  return (
    <div className="bg-background">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 pt-4 pb-8">
        <Suspense fallback={<SkeletonGrid count={12} />}>
          <ProductGrid
            key={`${start.category ?? ""}|${start.sub ?? ""}|${start.brand ?? ""}`}
            header={
              <h1 className="mb-4 font-outfit text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
                {heading.lead} <span className="text-accent-text">{heading.accent}</span>
              </h1>
            }
            initial={initial}
            categories={categories}
            brands={facetBrands(facets)}
            priceRange={facets.price}
            start={start}
          />
        </Suspense>
      </div>
    </div>
  );
}

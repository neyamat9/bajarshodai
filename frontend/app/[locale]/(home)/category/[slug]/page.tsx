import ProductGrid from "@/components/product/ProductGrid";
import { ListingSkeleton } from "@/components/skeletons/PageSkeletons";
import SkeletonGrid from "@/components/product/SkeletonGrid";
import type { Locale } from "@/lib/locale";
import { getCategories } from "@/lib/services/categories.service";
import { getProductFacets, listProducts } from "@/lib/services/products.service";
import { facetBrands } from "@/lib/utils/facets";
import { findSub, trailOf } from "@/lib/utils/categories";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

interface CategoryPageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ sub?: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "Pages" });
  const categories = await getCategories(locale as Locale);
  const category = categories.find((c) => c.slug === slug);

  if (!category) {
    return { title: t("categoryNotFound") };
  }

  return {
    title: category.name,
    description: t("categoryDesc", { name: category.name, description: category.description }),
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const { sub } = await searchParams;
  return (
    <Suspense key={`${locale}|${slug}|${sub ?? ""}`} fallback={<ListingSkeleton />}>
      <CategoryContent slug={slug} sub={sub} locale={locale as Locale} />
    </Suspense>
  );
}

async function CategoryContent({ slug, sub, locale }: { slug: string; sub?: string; locale: Locale }) {
  const categories = await getCategories(locale);

  const category = categories.find((c) => c.slug === slug);

  if (!category) {
    notFound();
  }

  const subSlug = sub ? findSub(category.subCategories, sub)?.slug : undefined;
  const trail = trailOf(category, subSlug);
  const here = trail[trail.length - 1];
  const [initial, facets] = await Promise.all([
    listProducts({ category: slug, subCategory: subSlug, sortBy: "popular" }, locale),
    getProductFacets({ category: slug, subCategory: subSlug }),
  ]);

  return (
    <div className="bg-background">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 pt-4 pb-8">
        {/* Grid with filters — category is locked */}
        <Suspense fallback={<SkeletonGrid count={12} />}>
          <ProductGrid
            key={subSlug ?? "all"}
            header={
              <div className="mb-4">
                <h1 className="font-outfit text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">{here.name}</h1>
                {!subSlug && category.description && <p className="mt-1 max-w-xl text-sm text-muted-foreground">{category.description}</p>}
              </div>
            }
            initial={initial}
            categories={categories}
            brands={facetBrands(facets)}
            priceRange={facets.price}
            lockedCategory={slug}
            subCategory={subSlug}
          />
        </Suspense>
      </div>
    </div>
  );
}

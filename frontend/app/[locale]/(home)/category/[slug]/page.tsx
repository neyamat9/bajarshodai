import { Link } from "@/i18n/navigation";
import ProductGrid from "@/components/product/ProductGrid";
import { ListingSkeleton } from "@/components/skeletons/PageSkeletons";
import SkeletonGrid from "@/components/product/SkeletonGrid";
import type { Locale } from "@/lib/locale";
import { getCategories } from "@/lib/services/categories.service";
import { getProductFacets, listProducts } from "@/lib/services/products.service";
import { facetBrands } from "@/lib/utils/facets";
import { categoryHref, findSub, trailOf } from "@/lib/utils/categories";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronRight } from "lucide-react";

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
  const t = await getTranslations({ locale, namespace: "Pages" });
  const tn = await getTranslations({ locale, namespace: "Nav" });
  const categories = await getCategories(locale);

  const category = categories.find((c) => c.slug === slug);

  if (!category) {
    notFound();
  }

  const subSlug = sub ? findSub(category.subCategories, sub)?.slug : undefined;
  const trail = trailOf(category, subSlug);
  const here = trail[trail.length - 1];
  // quick links: the next level down, or (on the last level) the categories beside this one
  const quick = here.children.length > 0 ? here.children : (trail[trail.length - 2]?.children ?? []);
  const quickParent = here.children.length > 0 ? here : trail[trail.length - 2];
  const [initial, facets] = await Promise.all([
    listProducts({ category: slug, subCategory: subSlug, sortBy: "popular" }, locale),
    getProductFacets({ category: slug, subCategory: subSlug }),
  ]);

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 pt-6 pb-20">

        {/* Breadcrumb */}
        <nav aria-label={tn("breadcrumb")} className="mb-3 flex flex-wrap items-center gap-1 text-xs font-medium text-muted-foreground">
          <Link href="/" className="hover:text-accent-text">{tn("home")}</Link>
          {trail.map((item, i) => (
            <span key={item.slug} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3 opacity-60 rtl:rotate-180" aria-hidden="true" />
              {i === trail.length - 1 ? (
                <span aria-current="page" className="text-foreground">{item.name}</span>
              ) : (
                <Link href={categoryHref(category.slug, item.slug)} className="hover:text-accent-text">{item.name}</Link>
              )}
            </span>
          ))}
        </nav>

        {/* Page header */}
        <div className="mb-5">
          <h1 className="font-outfit text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">{here.name}</h1>
          {!subSlug && category.description && <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">{category.description}</p>}
        </div>

        {/* Subcategory quick-links */}
        {quick.length > 0 && quickParent && (
          <div className="flex flex-wrap gap-2 mb-5">
            <Link
              href={categoryHref(category.slug, quickParent.slug)}
              className={`px-3 py-1.5 border rounded text-[11px] font-bold transition-all ${quickParent.slug === here.slug ? "bg-brand-fresh border-brand-fresh text-foreground" : "bg-muted border-border text-muted-foreground hover:border-brand-fresh hover:bg-accent hover:text-foreground dark:hover:bg-secondary dark:hover:text-white"}`}
            >
              {t("categoryAll")}
            </Link>
            {quick.map((s) => (
              <Link
                key={s.slug}
                href={categoryHref(category.slug, s.slug)}
                className={`px-3 py-1.5 border rounded text-[11px] font-bold transition-all ${subSlug === s.slug ? "bg-brand-fresh border-brand-fresh text-foreground" : "bg-muted border-border text-muted-foreground hover:border-brand-fresh hover:bg-accent hover:text-foreground dark:hover:bg-secondary dark:hover:text-white"}`}
              >
                {s.name}
              </Link>
            ))}
          </div>
        )}

        {/* Grid with filters — category is locked */}
        <Suspense fallback={<SkeletonGrid count={12} />}>
          <ProductGrid
            key={subSlug ?? "all"}
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

import ProductDetailClient from "@/components/product/ProductDetailClient";
import { getQuestions, getReviews } from "@/lib/services/reviews.service";
import { getProductBySlug as fetchProduct, getRelatedProducts } from "@/lib/services/products.service";
import { getSiteSettings } from "@/lib/services/site.service";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { categoryHref } from "@/lib/utils/categories";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/locale";

// the title/description and the page itself both need the product: fetch it once per request
const getProductBySlug = cache(fetchProduct);

export const revalidate = 300;

// no pages are built ahead of time; each one is built on its first visit and then kept (and refreshed every 5 minutes)
export function generateStaticParams() {
  return [];
}

interface ProductPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "Pages" });
  const product = await getProductBySlug(slug, locale as Locale);

  if (!product) {
    return {
      title: t("productNotFound"),
    };
  }

  const primaryImage =
    product.images.find((img) => img.isPrimary) ?? product.images[0];

  return {
    title: product.name,
    description: product.shortDescription || product.description.replace(/<[^>]*>/g, "").slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.shortDescription || product.description.replace(/<[^>]*>/g, "").slice(0, 160),
      images: primaryImage
        ? [
            {
              url: primaryImage.url,
              width: 800,
              height: 800,
              alt: primaryImage.alt,
            },
          ]
        : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.shortDescription || product.description.replace(/<[^>]*>/g, "").slice(0, 160),
      images: primaryImage ? [primaryImage.url] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { locale: rawLocale, slug } = await params;
  setRequestLocale(rawLocale);
  const locale = rawLocale as Locale;

  // related products and store settings only need the slug: fetch them alongside the product itself
  const relatedPromise = getRelatedProducts(slug, 8, locale);
  const settingsPromise = getSiteSettings();
  const product = await getProductBySlug(slug, locale);

  if (!product) {
    notFound();
  }

  const [relatedProducts, reviewPage, questions, settings] = await Promise.all([
    relatedPromise,
    getReviews(product.id, 1, 10).catch(() => ({ reviews: [], total: 0, averageRating: 0, breakdown: {}, totalPages: 1 })),
    getQuestions(product.id).catch(() => []),
    settingsPromise,
  ]);
  const paymentMethods = settings.payment.methods as string[];
  const tn = await getTranslations({ locale, namespace: "Nav" });
  const top = product.categoryPath[0]?.slug;

  return (
    <>
      {/* Home › Fish › Freshwater fish › Rui, Katla & Mrigel */}
      {top && (
        <nav aria-label={tn("breadcrumb")} className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-1 px-4 pt-4 text-xs font-medium text-muted-foreground md:px-8">
          <Link href="/" className="hover:text-accent-text">{tn("home")}</Link>
          {product.categoryPath.map((c) => (
            <span key={c.slug} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3 opacity-60" aria-hidden="true" />
              <Link href={categoryHref(top, c.slug)} className="hover:text-accent-text">{c.name}</Link>
            </span>
          ))}
        </nav>
      )}
      <ProductDetailClient
        product={product}
        relatedProducts={relatedProducts}
        reviews={reviewPage.reviews}
        reviewStats={{ average: reviewPage.averageRating, total: reviewPage.total, breakdown: reviewPage.breakdown }}
        questions={questions}
        paymentMethods={paymentMethods}
      />
    </>
  );
}

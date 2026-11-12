"use client";

import ImageGallery from "@/components/product/ImageGallery";
import ProductSummary from "@/components/product/ProductSummary";
import ProductTabs, { type ReviewStats } from "@/components/product/ProductTabs";
import RecentlyViewed from "@/components/product/RecentlyViewed";
import RelatedProductsCarousel from "@/components/product/RelatedProductsCarousel";
import RelatedSideList from "@/components/product/RelatedSideList";
import StickyATCBar from "@/components/product/StickyATCBar";
import RevealGroup from "@/components/motion/RevealGroup";
import { useLocale, useTranslations } from "next-intl";
import { formatMoney } from "@/lib/format";
import type { Locale } from "@/lib/locale";
import { useRecentlyViewed } from "@/lib/hooks/use-recently-viewed";
import { getProductBySlug } from "@/lib/services/products.service";
import type { Product, ProductVariant, Question, Review } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
  reviews: Review[];
  reviewStats: ReviewStats;
  questions: Question[];
  paymentMethods?: string[];
}


export default function ProductDetailClient({ product: initial, relatedProducts, reviews, reviewStats, questions, paymentMethods }: ProductDetailClientProps) {
  const t = useTranslations("Product");
  const locale = useLocale() as Locale;
  const money = (n: number) => formatMoney(n, locale);
  const { addToRecentlyViewed } = useRecentlyViewed();
  const atcButtonRef = useRef<HTMLButtonElement>(null);
  const [variant, setVariant] = useState<ProductVariant | null>(null);

  // The page may come from a cache (instant!), so right after it opens we quietly ask the API for the live price and stock
  // and update those numbers if they moved. Fast and accurate.
  type Live = Pick<Product, "id" | "price" | "originalPrice" | "discount" | "stock" | "variants">;
  const [live, setLive] = useState<Live | null>(null);
  const product: Product = live && live.id === initial.id ? { ...initial, ...live } : initial;
  useEffect(() => {
    let alive = true;
    getProductBySlug(initial.slug)
      .then((p) => {
        if (!alive || !p) return;
        const moved = p.price !== initial.price || p.originalPrice !== initial.originalPrice || p.stock !== initial.stock || JSON.stringify(p.variants.map((v) => [v.id, v.price, v.stock])) !== JSON.stringify(initial.variants.map((v) => [v.id, v.price, v.stock]));
        if (moved) setLive({ id: p.id, price: p.price, originalPrice: p.originalPrice, discount: p.discount, stock: p.stock, variants: p.variants });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [initial]);
  const currentPrice = variant?.price ?? product.price;

  // Track this product as recently viewed
  useEffect(() => {
    addToRecentlyViewed(product);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  function handleVariantChange(v: ProductVariant | null) {
    setVariant(v);
  }

  const save = product.originalPrice && product.originalPrice > product.price ? product.originalPrice - product.price : 0;
  const stockLabel = product.trackStock === false ? t("summary.freshDaily") : product.stock > 0 ? t("summary.inStock") : t("summary.outOfStock");

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-[1440px] px-4 py-6 md:px-8 md:py-8">
          <RevealGroup className="flex flex-col gap-5">
            {/* ── Full-width product card ── */}
            <section data-reveal="up" className="rounded border border-border bg-card p-4 sm:p-6">
              <div className="grid gap-6 md:grid-cols-[minmax(0,460px)_minmax(0,1fr)] md:gap-8 lg:gap-12">
                <div className="relative min-w-0">
                  <ImageGallery product={product} saveBadge={save > 0 ? `Save: ${money(save)}` : null} />
                </div>
                <ProductSummary product={product} atcRef={atcButtonRef} onVariantChange={handleVariantChange} paymentMethods={paymentMethods} />
              </div>
            </section>

            {/* ── Details (stacked sections) beside the related-products list ── */}
            <div className="grid items-start gap-5 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]">
              <aside
                className="no-scrollbar hidden lg:sticky lg:block lg:max-h-[calc(100vh-var(--sticky-top,8rem)-1rem)] lg:overflow-y-auto lg:transition-[top] lg:duration-[600ms] lg:ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ top: "var(--sticky-top, 8rem)" }}
                data-lenis-prevent
              >
                <RelatedSideList products={relatedProducts} />
              </aside>

              <div className="flex min-w-0 flex-col gap-5">
                <section data-reveal="up" className="rounded border border-border bg-card">
                  <ProductTabs product={product} reviews={reviews} reviewStats={reviewStats} questions={questions} />
                </section>

                <section data-reveal="up" className="rounded border border-border bg-card p-5 sm:p-6">
                  <h2 className="font-outfit text-base font-bold leading-snug text-foreground sm:text-lg">
                    {t("detail.heading", { name: product.name })}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {t("detail.priceText", { name: product.name, price: money(product.price) })}
                    {save > 0 ? t("detail.regularPrice", { price: money(product.originalPrice!) }) : ""}
                    {t("detail.stockNow", { stock: stockLabel })}
                    {t("detail.footer")}
                  </p>
                </section>
              </div>

            </div>
          </RevealGroup>

          {/* On phones/tablets the related list sits below instead of beside */}
          {relatedProducts.length > 0 && (
            <div className="mt-10 lg:hidden">
              <RelatedProductsCarousel products={relatedProducts} title={t("detail.related")} />
            </div>
          )}

          <div className="mt-12 pb-12 sm:pb-16">
            <RecentlyViewed currentProductId={product.id} />
          </div>
        </div>
      </div>

      <StickyATCBar product={product} currentPrice={currentPrice} variant={variant} atcButtonRef={atcButtonRef} />
    </>
  );
}

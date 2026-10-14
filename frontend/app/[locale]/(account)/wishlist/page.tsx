"use client";

import { Link } from "@/i18n/navigation";
import { btnGhost, EmptyState, PageHeading } from "@/components/account/ui";
import ProductCard from "@/components/product/ProductCard";
import { useWishlist } from "@/lib/hooks/use-wishlist";
import { getProductBySlug } from "@/lib/services/products.service";
import type { Product, WishlistItem } from "@/lib/types";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/lib/locale";

/** The few things a saved item knows, shaped like a product, so the card can still be drawn if the full product can't be loaded. */
function basicProduct(i: WishlistItem): Product {
  return {
    id: i.productId,
    slug: i.slug,
    name: i.name,
    shortDescription: "",
    description: "",
    brand: "",
    brandName: "",
    category: "",
    categoryName: "",
    categoryPath: [],
    productCode: "",
    unit: null,
    packSize: "",
    isWeighed: false,
    price: i.price,
    originalPrice: i.originalPrice,
    discount: i.originalPrice ? Math.round(((i.originalPrice - i.price) / i.originalPrice) * 100) : undefined,
    stock: i.stock,
    images: [{ id: "img-0", url: i.imageUrl, alt: i.name, isPrimary: true }],
    variants: [],
    specs: [],
    pinnedSpecs: [],
    badges: [],
    soldLast24h: 0,
    purchasePoints: 0,
    priceHistory: [],
    isFeatured: false,
    createdAt: i.addedAt,
  };
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded border border-border bg-card" aria-hidden="true">
      <div className="aspect-square w-full animate-pulse bg-secondary" />
      <div className="space-y-2.5 p-3 sm:p-4">
        <div className="h-3 w-1/3 animate-pulse rounded bg-secondary" />
        <div className="h-4 w-full animate-pulse rounded bg-secondary" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-secondary" />
        <div className="h-6 w-24 animate-pulse rounded bg-secondary" />
        <div className="h-10 w-full animate-pulse rounded bg-secondary" />
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const t = useTranslations("Wishlist");
  const locale = useLocale() as Locale;
  const { items } = useWishlist();

  // the same product cards as everywhere else need the full product (brand, rating, options…), so load them by slug
  const [full, setFull] = useState<Record<string, Product | null>>({});
  const missing = items.filter((i) => full[i.slug] === undefined);
  const missingKey = missing.map((i) => i.slug).join(",");

  useEffect(() => {
    if (!missingKey) return;
    let alive = true;
    const slugs = missingKey.split(",");
    Promise.all(slugs.map((s) => getProductBySlug(s, locale).catch(() => null))).then((rows) => {
      if (alive) setFull((f) => ({ ...f, ...Object.fromEntries(slugs.map((s, i) => [s, rows[i]])) }));
    });
    return () => {
      alive = false;
    };
  }, [missingKey, locale]);

  return (
    <>
      <PageHeading
        title={t("titleLead")}
        accent={t("titleAccent")}
        subtitle={items.length === 0 ? t("empty") : t("saved", { count: items.length })}
        actions={
          items.length > 0 ? (
            <Link href="/products" className={`${btnGhost} h-10`}>
              {t("keepBrowsing")}
            </Link>
          ) : undefined
        }
      />
      {items.length === 0 ? (
        <EmptyState icon={Heart} title={t("emptyTitle")} text={t("emptyText")} action={{ href: "/products", label: t("discover") }} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
          {items.map((item) => {
            const p = full[item.slug];
            if (p === undefined) return <CardSkeleton key={item.productId} />;
            return <ProductCard key={item.productId} product={p ?? basicProduct(item)} entrance={false} />;
          })}
        </div>
      )}
    </>
  );
}

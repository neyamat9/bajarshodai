"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { useCartActions } from "@/lib/hooks/use-cart";
import { useQuickAdd } from "@/lib/hooks/use-quick-add";
import { getProductBySlug } from "@/lib/services/products.service";
import { playClick } from "@/lib/sound";
import { useInView } from "@/lib/hooks/use-in-view";
import { useWishlist } from "@/lib/hooks/use-wishlist";
import type { Product, ProductVariant } from "@/lib/types";
import { Flame, Heart, Loader2, ShoppingCart, Star, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import { formatMoney, formatNumber } from "@/lib/format";
import type { Locale } from "@/lib/locale";

interface ProductCardProps {
  product: Product;
  /** Stagger delay in ms for entrance animation (0, 50, 100, …) */
  animationDelay?: number;
  /** Optional ranking shown as a corner tag, e.g. 1 → "#1" (best sellers) */
  rank?: number;
  /** Show "N sold today" social-proof line */
  showSold?: boolean;
  /** Play the built-in fade-in on scroll. Turn off inside a RevealGroup. */
  entrance?: boolean;
}

const BADGE_STYLES: Record<string, string> = {
  NEW: "bg-primary text-primary-foreground",
  HOT: "bg-brand-fresh text-on-fresh",
  "BEST SELLER": "bg-brand-fresh text-on-fresh",
  "LIMITED STOCK": "bg-destructive text-white",
};

export default function ProductCard({
  product,
  animationDelay = 0,
  rank,
  showSold = false,
  entrance = true,
}: ProductCardProps) {
  const t = useTranslations("Product");
  const locale = useLocale() as Locale;
  const formatBDT = (n: number) => formatMoney(n, locale);
  const quickAdd = useQuickAdd();
  const { addToCart } = useCartActions();
  // option picker for products with colours / sizes (so the customer never leaves the card)
  const [picker, setPicker] = useState<{ loading: boolean; variants: ProductVariant[] } | null>(null);
  const { addToVault, removeFromVault, isInVault } = useWishlist();
  const router = useRouter();
  // start loading the product page as soon as the pointer is over the card, so the click opens it at once
  const prefetched = useRef(false);
  function warm() {
    if (prefetched.current) return;
    prefetched.current = true;
    router.prefetch(`/products/${product.slug}`);
  }

  const { ref, inView } = useInView({ threshold: 0.08 });
  const [isAnimating, setIsAnimating] = useState(false);

  const primaryImage = product.images.find((img) => img.isPrimary) ?? product.images[0];
  const hoverImage = product.images.find((img) => img !== primaryImage);
  const inVault = isInVault(product.id);

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    playClick();
    if (!product.hasVariants) {
      void quickAdd({ id: product.id, slug: product.slug, name: product.name, price: product.price, stock: product.stock, imageUrl: primaryImage?.url ?? "" });
      return;
    }
    // has options: show them right here instead of leaving the page
    setPicker({ loading: true, variants: [] });
    try {
      const full = await getProductBySlug(product.slug);
      const variants = full?.variants ?? [];
      if (variants.length === 0) {
        setPicker(null);
        void quickAdd({ id: product.id, slug: product.slug, name: product.name, price: product.price, stock: product.stock, imageUrl: primaryImage?.url ?? "" });
      } else {
        setPicker({ loading: false, variants });
      }
    } catch {
      setPicker(null);
      toast.error(t("card.optionsFailed"));
    }
  }

  async function addVariant(v: ProductVariant) {
    if (v.stock <= 0) return;
    playClick();
    setPicker(null);
    const res = await addToCart({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: v.price,
      variantId: v.id,
      variantLabel: v.label,
      quantity: 1,
      imageUrl: primaryImage?.url ?? "",
      stock: v.stock,
    });
    if (res.ok) toast.success(t("card.added", { name: product.name }), { description: `${v.label} · ${formatBDT(v.price)}`, duration: 2500 });
    else toast.error(res.error ?? t("card.couldNotAdd"));
  }

  function handleToggleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    if (inVault) {
      removeFromVault(product.id);
      toast.info(t("card.removedWish"));
    } else {
      addToVault({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        imageUrl: primaryImage?.url ?? "",
        stock: product.stock,
      });
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 400);
      toast.success(t("card.addedWish"), { duration: 2000 });
    }
  }

  const badge = product.badges.find((b) => b !== "HOT");
  const extra = product as Product & { avgRating?: number; reviewCount?: number };
  const rating = extra.avgRating ?? 0;
  const reviewCount = extra.reviewCount ?? 0;
  const outOfStock = product.stock <= 0;

  return (
    <article
      ref={ref as React.RefObject<HTMLElement>}
      data-reveal="card"
      onPointerEnter={warm}
      onTouchStart={warm}
      onFocus={warm}
      className="group relative flex h-full flex-col overflow-hidden rounded border border-border bg-card transition-[border-color,box-shadow] duration-300 hover:border-brand-fresh hover:shadow-[0_16px_36px_-12px_rgba(11,98,52,0.28)]"
      style={
        entrance
          ? {
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(20px)",
              transition: `opacity 400ms ease-out ${animationDelay}ms, transform 400ms ease-out ${animationDelay}ms, border-color 300ms, box-shadow 300ms`,
            }
          : undefined
      }
    >
      {/* ── Image ───────────────────────────────────── */}
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <Link href={`/products/${product.slug}`} tabIndex={-1} aria-hidden="true" className="relative block h-full w-full">
          {primaryImage && (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                hoverImage ? "group-hover:-translate-x-full group-hover:delay-1000" : "group-hover:scale-105"
              } ${outOfStock ? "opacity-60 grayscale" : ""}`}
            />
          )}
          {/* a second photo slides in from the right — only after the cursor has rested on the card for 1s */}
          {hoverImage && (
            <Image
              src={hoverImage.url}
              alt={hoverImage.alt}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`translate-x-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0 group-hover:delay-1000 ${
                outOfStock ? "opacity-60 grayscale" : ""
              }`}
            />
          )}
        </Link>

        {/* Out of stock: a diagonal "STOCK OUT" band across the photo */}
        {outOfStock && (
          <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center overflow-hidden" aria-hidden="true">
            <div className="absolute inset-0 bg-brand-deep/25" />
            <span className="w-[160%] -rotate-[24deg] border-y-2 border-card/80 bg-destructive py-2 text-center font-outfit text-lg font-black uppercase tracking-[0.35em] text-white shadow-lg">
              {t("card.stockOut")}
            </span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5">
          {rank !== undefined && (
            <span className="rounded bg-primary px-2 py-1 font-outfit text-xs font-extrabold leading-none text-primary-foreground">
              #{formatNumber(rank, locale, 0)}
            </span>
          )}
          {badge && !outOfStock && (
            <span
              className={`rounded px-2 py-1 text-[10px] font-bold uppercase leading-none tracking-wide ${BADGE_STYLES[badge] ?? "bg-secondary text-foreground"}`}
            >
              {t(`badges.${badge.replace(" ", "_")}`)}
            </span>
          )}
          {product.discount && product.discount > 0 ? (
            <span className="rounded bg-card px-2 py-1 text-[10px] font-bold leading-none text-destructive shadow-sm">
              -{formatNumber(product.discount, locale, 0)}%
            </span>
          ) : null}
        </div>

        {/* Wishlist */}
        <button
          type="button"
          onClick={handleToggleWishlist}
          aria-label={inVault ? t("card.wishRemove", { name: product.name }) : t("card.wishAdd", { name: product.name })}
          className={`absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded bg-card/90 shadow-sm backdrop-blur transition-colors hover:text-destructive ${
            inVault ? "text-destructive" : "text-muted-foreground"
          }`}
        >
          <Heart
            className={`h-4 w-4 ${isAnimating ? "animate-heartbeat" : ""}`}
            fill={inVault ? "currentColor" : "none"}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* ── Info ────────────────────────────────────── */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {product.brandName}
        </p>

        <Link href={`/products/${product.slug}`}>
          <h3 className="mb-2 line-clamp-2 min-h-[2.5rem] font-outfit text-sm sm:min-h-[2.75rem] sm:text-[15px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary dark:group-hover:text-accent-text">
            {product.name}
          </h3>
        </Link>

        {/* Rating + review count */}
        <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs" aria-label={reviewCount > 0 ? t("card.rated", { rating: formatNumber(rating, locale, 1), count: formatNumber(reviewCount, locale, 0) }) : t("card.noReviews")}>
          <span className="flex" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${n <= Math.round(rating) ? "fill-brand-fresh text-brand-fresh" : "fill-transparent text-muted-foreground/40"}`}
              />
            ))}
          </span>
          {reviewCount > 0 ? (
            <span className="whitespace-nowrap font-medium text-muted-foreground">
              <span className="font-bold text-foreground">{formatNumber(rating, locale, 1)}</span> ({formatNumber(reviewCount, locale, 0)})
            </span>
          ) : (
            <span className="text-muted-foreground">{t("card.noReviews")}</span>
          )}
        </div>

        <div className="mb-3 flex items-center gap-3 text-[11px] font-medium text-muted-foreground">
          {showSold && product.soldLast24h > 0 && !outOfStock && (
            <span className="flex items-center gap-1 text-accent-text">
              <Flame className="h-3 w-3" aria-hidden="true" />
              {t("card.soldToday", { count: formatNumber(product.soldLast24h, locale, 0) })}
            </span>
          )}
          {outOfStock && <span className="font-semibold text-destructive">{t("card.unavailable")}</span>}
          {!showSold && !outOfStock && product.pinnedSpecs.length > 0 && (
            <span className="truncate">
              {product.pinnedSpecs[0].label}: {product.pinnedSpecs[0].value}
            </span>
          )}
        </div>

        {/* Price row */}
        <div className="mt-auto flex items-end justify-between gap-2 border-t border-border pt-3">
          <div className="flex flex-col">
            <span className="font-outfit text-base font-bold leading-none text-primary dark:text-foreground min-[380px]:text-lg sm:text-xl">
              {formatBDT(product.price)}
            </span>
            {product.originalPrice && (
              <span className="mt-1 text-xs font-medium text-muted-foreground line-through">
                {formatBDT(product.originalPrice)}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={outOfStock}
            aria-label={outOfStock ? t("card.outOfStockNamed", { name: product.name }) : t("card.addNamed", { name: product.name })}
            title={outOfStock ? t("card.stockOut") : t("card.addToCart")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground transition-all sm:h-10 sm:w-10 hover:bg-brand-fresh hover:text-on-fresh active:scale-90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-60 disabled:hover:bg-muted disabled:hover:text-muted-foreground"
          >
            <ShoppingCart className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
        </div>
      </div>
      {/* Option picker — slides up over the card */}
      {picker && (
        <div
          className="absolute inset-x-0 bottom-0 z-30 animate-fade-slide-up border-t border-border bg-card/98 p-3 shadow-[0_-16px_30px_-12px_rgba(11,98,52,0.35)] backdrop-blur sm:p-4"
          role="dialog"
          aria-label={t("card.chooseOptionFor", { name: product.name })}
          onKeyDown={(e) => e.key === "Escape" && setPicker(null)}
        >
          <div className="mb-2.5 flex items-center justify-between">
            <p className="font-outfit text-sm font-bold text-foreground">{t("card.chooseOption")}</p>
            <button
              type="button"
              onClick={() => setPicker(null)}
              aria-label={t("card.closeOptions")}
              className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {picker.loading ? (
            <div className="flex items-center justify-center py-4 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" aria-label={t("card.loadingOptions")} />
            </div>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {picker.variants.map((v) => (
                <li key={v.id}>
                  <button
                    type="button"
                    disabled={v.stock <= 0}
                    onClick={() => void addVariant(v)}
                    className="flex items-center gap-2 rounded border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-brand-fresh hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through disabled:hover:border-input disabled:hover:bg-background"
                  >
                    {v.colorHex && <span className="h-3.5 w-3.5 rounded border border-border" style={{ backgroundColor: v.colorHex }} aria-hidden="true" />}
                    {v.label}
                    {v.price !== product.price && <span className="text-accent-text">{formatBDT(v.price)}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </article>
  );
}

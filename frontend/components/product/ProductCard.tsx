"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { useCart, useCartActions } from "@/lib/hooks/use-cart";
import { useQuickAdd } from "@/lib/hooks/use-quick-add";
import { getProductBySlug } from "@/lib/services/products.service";
import { playClick } from "@/lib/sound";
import { useInView } from "@/lib/hooks/use-in-view";
import { useWishlist } from "@/lib/hooks/use-wishlist";
import type { Product, ProductVariant } from "@/lib/types";
import { Heart, Loader2, Minus, Plus, ShoppingCart, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import { formatMoney, formatNumber, formatQuantity } from "@/lib/format";
import type { Locale } from "@/lib/locale";
import { startQty, stepDown, stepUp } from "@/lib/quantity";

interface ProductCardProps {
  product: Product;
  /** Stagger delay in ms for entrance animation (0, 50, 100, …) */
  animationDelay?: number;
  /** Play the built-in fade-in on scroll. Turn off inside a RevealGroup. */
  entrance?: boolean;
  /** Optional callback when medicine card is clicked (opens modal instead of full page) */
  onMedicineClick?: (product: Product) => void;
}

const BADGE_STYLES: Record<string, string> = {
  NEW: "bg-primary text-primary-foreground",
  HOT: "bg-brand-fresh text-on-fresh",
  "BEST SELLER": "bg-brand-fresh text-on-fresh",
  "LIMITED STOCK": "bg-destructive text-white",
};

/**
 * A small product card: photo, name, the unit it is sold in, the price and one button.
 * After the first tap the button becomes a − quantity + stepper that follows the unit (0.5 kg steps for fish,
 * whole pieces for soap); stepping below the minimum takes it out of the cart again.
 */
export default function ProductCard({
  product,
  animationDelay = 0,
  entrance = true,
  onMedicineClick,
}: ProductCardProps) {
  const t = useTranslations("Product");
  const locale = useLocale() as Locale;
  const formatBDT = (n: number) => formatMoney(n, locale);
  const quickAdd = useQuickAdd();
  const { addToCart } = useCartActions();
  const { cart, updateQuantity, removeFromCart } = useCart();
  // option picker for products with colours / sizes (so the customer never leaves the card)
  const [picker, setPicker] = useState<{ loading: boolean; variants: ProductVariant[] } | null>(null);
  const { addToVault, removeFromVault, isInVault } = useWishlist();
  const router = useRouter();
  // start loading the product page as soon as the pointer is over the card, so the click opens it at once
  const prefetched = useRef(false);
  function warm() {
    if (onMedicineClick || prefetched.current) return;
    prefetched.current = true;
    router.prefetch(`/products/${product.slug}`);
  }

  const { ref, inView } = useInView({ threshold: 0.08 });
  const [isAnimating, setIsAnimating] = useState(false);

  const primaryImage = product.images.find((img) => img.isPrimary) ?? product.images[0];
  const inVault = isInVault(product.id);
  const unit = product.unit;
  const isUntracked = product.trackStock === false;
  const outOfStock = !isUntracked && (product.stock <= (unit?.minQty ?? 0) - 1e-9 || product.stock <= 0);
  const badge = product.badges.find((b) => b !== "HOT");
  // the cart line of this product (products with options are added from the picker, so they have no stepper here)
  const line = product.hasVariants ? undefined : cart.items.find((i) => i.productId === product.id && !i.variantId);

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    playClick();
    const base = { id: product.id, slug: product.slug, name: product.name, price: product.price, stock: isUntracked ? 9999 : product.stock, imageUrl: primaryImage?.url ?? "", unit };
    if (!product.hasVariants) {
      void quickAdd(base, startQty(unit));
      return;
    }
    // has options: show them right here instead of leaving the page
    setPicker({ loading: true, variants: [] });
    try {
      const full = await getProductBySlug(product.slug, locale);
      const variants = full?.variants ?? [];
      if (variants.length === 0) {
        setPicker(null);
        void quickAdd(base, startQty(unit));
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
      quantity: startQty(unit),
      imageUrl: primaryImage?.url ?? "",
      stock: v.stock,
      unit,
    });
    if (res.ok) toast.success(t("card.added", { name: product.name }), { description: `${v.label} · ${formatBDT(v.price)}`, duration: 2000 });
    else toast.error(res.error ?? t("card.couldNotAdd"));
  }

  async function more(e: React.MouseEvent) {
    e.preventDefault();
    if (!line) return;
    const maxStock = isUntracked ? 9999 : line.stock;
    const next = stepUp(line.quantity, unit, maxStock);
    if (next === null) {
      toast.info(t("card.onlyStock", { count: formatQuantity(maxStock, locale) }), { id: `stock-${product.id}` });
      return;
    }
    playClick();
    const r = await updateQuantity(line.id, next);
    if (!r.ok) toast.error(r.error ?? t("card.couldNotAdd"));
  }

  async function fewer(e: React.MouseEvent) {
    e.preventDefault();
    if (!line) return;
    playClick();
    const next = stepDown(line.quantity, unit);
    const r = next === null ? await removeFromCart(line.id) : await updateQuantity(line.id, next);
    if (!r.ok) toast.error(r.error ?? t("card.couldNotAdd"));
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

  // what the price is "per": a pack ("500 g") or one unit ("1 kg")
  const sizeText = product.packSize || (unit ? `${formatQuantity(1, locale)} ${unit.label}` : "");

  return (
    <article
      ref={ref as React.RefObject<HTMLElement>}
      data-reveal="card"
      onPointerEnter={warm}
      onTouchStart={warm}
      onFocus={warm}
      className="group relative flex h-full flex-col overflow-hidden rounded border border-border bg-card transition-[border-color,box-shadow] duration-300 hover:border-brand-fresh hover:shadow-[0_12px_28px_-12px_rgba(11,98,52,0.28)]"
      style={
        entrance
          ? {
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(16px)",
              transition: `opacity 400ms ease-out ${animationDelay}ms, transform 400ms ease-out ${animationDelay}ms, border-color 300ms, box-shadow 300ms`,
            }
          : undefined
      }
    >
      {/* ── Image ───────────────────────────────────── */}
      <div className="relative aspect-square overflow-hidden bg-secondary">
        {onMedicineClick ? (
          <button
            type="button"
            onClick={() => onMedicineClick(product)}
            tabIndex={-1}
            aria-hidden="true"
            className="relative block h-full w-full cursor-pointer text-left"
          >
            {primaryImage && (
              <Image
                src={primaryImage.url}
                alt={primaryImage.alt}
                fill
                sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 17vw"
                className={`object-cover transition-transform duration-500 group-hover:scale-105 ${outOfStock ? "opacity-60 grayscale" : ""}`}
              />
            )}
          </button>
        ) : (
          <Link href={`/products/${product.slug}`} tabIndex={-1} aria-hidden="true" className="relative block h-full w-full">
            {primaryImage && (
              <Image
                src={primaryImage.url}
                alt={primaryImage.alt}
                fill
                sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 17vw"
                className={`object-cover transition-transform duration-500 group-hover:scale-105 ${outOfStock ? "opacity-60 grayscale" : ""}`}
              />
            )}
          </Link>
        )}

        {outOfStock && (
          <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center bg-brand-deep/30" aria-hidden="true">
            <span className="rounded bg-destructive px-3 py-1 text-xs font-extrabold text-white shadow">{t("card.stockOut")}</span>
          </div>
        )}

        {/* Badges: the discount first, then one of new / best seller / limited */}
        <div className="absolute left-2 top-2 z-10 flex flex-col items-start gap-1">
          {product.discount && product.discount > 0 ? (
            <span className="rounded bg-destructive px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm">
              -{formatNumber(product.discount, locale, 0)}%
            </span>
          ) : null}
          {badge && !outOfStock && (
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold leading-none ${BADGE_STYLES[badge] ?? "bg-secondary text-foreground"}`}>
              {t(`badges.${badge.replace(" ", "_")}`)}
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          type="button"
          onClick={handleToggleWishlist}
          aria-label={inVault ? t("card.wishRemove", { name: product.name }) : t("card.wishAdd", { name: product.name })}
          className={`absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded bg-card/90 shadow-sm backdrop-blur transition-colors hover:text-destructive ${
            inVault ? "text-destructive" : "text-muted-foreground"
          }`}
        >
          <Heart className={`h-3.5 w-3.5 ${isAnimating ? "animate-heartbeat" : ""}`} fill={inVault ? "currentColor" : "none"} aria-hidden="true" />
        </button>

        {/* Price (bottom-left inside image) */}
        <div className="pointer-events-none absolute bottom-2 left-2 z-10 flex flex-col items-start">
          <div className="flex items-baseline gap-1 rounded bg-card/90 px-2 py-0.5 shadow-sm backdrop-blur">
            <span className="font-outfit text-sm font-extrabold leading-none text-primary dark:text-foreground sm:text-base">
              {formatBDT(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-[10px] font-medium text-muted-foreground line-through">
                {formatBDT(product.originalPrice)}
              </span>
            )}
          </div>
        </div>

        {/* Cart button / Stepper (bottom-right inside image) */}
        <div className="absolute bottom-2 right-2 z-10">
          {line ? (
            <div
              className="flex shrink-0 items-center overflow-hidden rounded border border-primary bg-primary text-primary-foreground shadow-sm"
              role="group"
              aria-label={t("card.qtyOf", { name: product.name })}
            >
              <button
                type="button"
                onClick={fewer}
                aria-label={t("card.decrease")}
                className="flex h-7 w-6 items-center justify-center transition-colors hover:bg-brand-fresh hover:text-on-fresh active:scale-90"
              >
                <Minus className="h-3 w-3" aria-hidden="true" />
              </button>
              <span
                className="min-w-[1.8rem] px-0.5 text-center text-[11px] font-bold leading-tight tabular-nums"
                aria-live="polite"
              >
                {formatQuantity(line.quantity, locale)}
              </span>
              <button
                type="button"
                onClick={more}
                aria-label={t("card.increase")}
                className="flex h-7 w-6 items-center justify-center transition-colors hover:bg-brand-fresh hover:text-on-fresh active:scale-90"
              >
                <Plus className="h-3 w-3" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={outOfStock}
              aria-label={outOfStock ? t("card.outOfStockNamed", { name: product.name }) : t("card.addNamed", { name: product.name })}
              title={outOfStock ? t("card.stockOut") : t("card.addToCart")}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground shadow-sm transition-all hover:bg-brand-fresh hover:text-on-fresh active:scale-90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-60 disabled:hover:bg-muted disabled:hover:text-muted-foreground"
            >
              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* ── Info (under image) ────────────────────────── */}
      <div className="flex flex-1 flex-col p-2.5 sm:p-3">
        {product.medicineMeta && (
          <div className="mb-1 flex items-center justify-between gap-1">
            <span className="inline-flex items-center rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
              {product.medicineMeta.dosageForm} {product.medicineMeta.strength ? `· ${product.medicineMeta.strength}` : ""}
            </span>
            {product.medicineMeta.type === "PRESCRIPTION" && (
              <span className="rounded bg-indigo-500/10 px-1 py-0.5 text-[9px] font-bold text-indigo-700 dark:text-indigo-400">
                Rx
              </span>
            )}
          </div>
        )}
        {onMedicineClick ? (
          <button
            type="button"
            onClick={() => onMedicineClick(product)}
            className="text-left w-full"
          >
            <h3 className="line-clamp-2 min-h-[2.4rem] font-outfit text-[13px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary dark:group-hover:text-accent-text sm:text-sm">
              {product.name}
              {sizeText ? ` - ${sizeText}` : ""}
            </h3>
          </button>
        ) : (
          <Link href={`/products/${product.slug}`}>
            <h3 className="line-clamp-2 min-h-[2.4rem] font-outfit text-[13px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary dark:group-hover:text-accent-text sm:text-sm">
              {product.name}
              {sizeText ? ` - ${sizeText}` : ""}
            </h3>
          </Link>
        )}
        {product.medicineMeta && (
          <div className="mt-1 flex flex-col text-[11px] text-muted-foreground leading-tight">
            <span className="truncate font-medium text-foreground/80 italic">
              {product.medicineMeta.genericName}
            </span>
            <span className="truncate text-[10px]">
              {product.medicineMeta.manufacturer}
            </span>
          </div>
        )}
      </div>

      {/* Option picker — slides up over the card */}
      {picker && (
        <div
          className="absolute inset-x-0 bottom-0 z-30 animate-fade-slide-up border-t border-border bg-card/98 p-3 shadow-[0_-16px_30px_-12px_rgba(11,98,52,0.35)] backdrop-blur"
          role="dialog"
          aria-label={t("card.chooseOptionFor", { name: product.name })}
          onKeyDown={(e) => e.key === "Escape" && setPicker(null)}
        >
          <div className="mb-2 flex items-center justify-between">
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
            <div className="flex items-center justify-center py-3 text-muted-foreground">
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
                    className="flex items-center gap-2 rounded border border-input bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-brand-fresh hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through disabled:hover:border-input disabled:hover:bg-background"
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

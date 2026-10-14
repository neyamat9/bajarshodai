"use client";

import { Link } from "@/i18n/navigation";
import BackInStockForm from "@/components/product/BackInStockForm";
import { useCart } from "@/lib/hooks/use-cart";
import { useWishlist } from "@/lib/hooks/use-wishlist";
import { playClick } from "@/lib/sound";
import type { Product, ProductVariant } from "@/lib/types";
import { Heart, Info, Loader2, MessageSquare, Minus, Plus, ShoppingCart, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import { formatMoney, formatNumber } from "@/lib/format";
import type { Locale } from "@/lib/locale";

interface ProductSummaryProps {
  product: Product;
  /** Ref forwarded to the Add to Cart button — used by StickyATCBar's IntersectionObserver */
  atcRef?: React.RefObject<HTMLButtonElement | null>;
  onVariantChange?: (variant: ProductVariant | null) => void;
  /** Payment methods the shop accepts (from store settings) */
  paymentMethods?: string[];
}


const chip = "inline-flex items-center gap-1 rounded border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground";

export default function ProductSummary({ product, atcRef, onVariantChange, paymentMethods = ["Cash on Delivery"] }: ProductSummaryProps) {
  const t = useTranslations("Product");
  const locale = useLocale() as Locale;
  const money = (n: number) => formatMoney(n, locale);
  const { addToCart } = useCart();
  const { addToVault, removeFromVault, isInVault } = useWishlist();

  const extra = product as Product & { avgRating?: number; reviewCount?: number };
  const rating = extra.avgRating ?? 0;
  const reviewCount = extra.reviewCount ?? 0;

  const [variant, setVariant] = useState<ProductVariant | null>(product.variants[0] ?? null);
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [panel, setPanel] = useState<"payment" | "disclaimer" | null>(null);

  const price = variant?.price ?? product.price;
  const oldPrice = variant?.originalPrice ?? product.originalPrice;
  const stock = variant?.stock ?? product.stock;
  const hasDiscount = !!oldPrice && oldPrice > price;
  const image = product.images.find((i) => i.isPrimary) ?? product.images[0];
  const inVault = isInVault(product.id);

  useEffect(() => {
    onVariantChange?.(variant);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pick(v: ProductVariant) {
    setVariant(v);
    setQuantity(1);
    onVariantChange?.(v);
  }

  async function add() {
    playClick();
    setBusy(true);
    const res = await addToCart({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price,
      variantId: variant?.id,
      variantLabel: variant?.label,
      quantity,
      imageUrl: image?.url ?? "/placeholder.svg",
      stock,
    });
    if (res.ok) toast.success(t("card.added", { name: product.name }), { description: t("summary.addedDesc", { qty: formatNumber(quantity, locale, 0), price: money(price) }), duration: 2500 });
    else toast.error(res.error ?? t("card.couldNotAdd"));
    setBusy(false);
  }

  function toggleWish() {
    if (inVault) {
      removeFromVault(product.id);
      toast.info(t("card.removedWish"));
    } else {
      addToVault({ productId: product.id, slug: product.slug, name: product.name, price: product.price, originalPrice: product.originalPrice, imageUrl: image?.url ?? "", stock: product.stock });
      toast.success(t("card.addedWish"), { duration: 2000 });
    }
  }


  const colors = product.variants.filter((v) => v.type === "color");
  const others = product.variants.filter((v) => v.type !== "color");
  const stockText = stock <= 0 ? t("summary.outOfStock") : stock < 5 ? t("summary.onlyLeft", { count: formatNumber(stock, locale, 0) }) : t("summary.inStock");
  const stockTone = stock <= 0 ? "text-destructive" : stock < 5 ? "text-accent-text" : "text-emerald-600 dark:text-emerald-400";
  const bullets = product.pinnedSpecs.slice(0, 5).map((s) => `${s.label}: ${s.value}`);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <h1 className="font-outfit text-xl font-extrabold leading-snug text-foreground sm:text-2xl">{product.name}</h1>

      {/* rating + helper chips */}
      <div className="flex flex-wrap items-center gap-2.5 text-sm">
        <span className="flex" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} className={`h-[18px] w-[18px] ${n <= Math.round(rating) ? "fill-brand-fresh text-brand-fresh" : "fill-transparent text-muted-foreground/40"}`} />
          ))}
        </span>
        <span className="font-medium text-muted-foreground">
          {reviewCount > 0 ? (
            <>
              <b className="text-foreground">{formatNumber(rating, locale, 1)}</b> · {t("summary.reviews", { count: formatNumber(reviewCount, locale, 0) })}
            </>
          ) : (
            t("summary.noReviews")
          )}
        </span>
        <button
          type="button"
          onClick={() => setPanel(panel === "disclaimer" ? null : "disclaimer")}
          className="inline-flex items-center gap-1.5 rounded border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/15 dark:border-brand-fresh/40 dark:text-brand-fresh"
        >
          <Info className="h-3.5 w-3.5" aria-hidden="true" />
          {t("summary.disclaimer")}
        </button>
        <Link
          href="/contact"
          className="inline-flex items-center gap-1.5 rounded border border-emerald-600/30 bg-emerald-600/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-600/15 dark:text-emerald-400"
        >
          <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
          {t("summary.suggestion")}
        </Link>
      </div>
      {panel === "disclaimer" && (
        <p className="rounded border border-border bg-background px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          {t("summary.disclaimerText")}
        </p>
      )}

      {/* facts */}
      <div className="flex flex-wrap gap-2">
        <span className={chip}>
          {t("summary.stock")} : <b className={stockTone}>{stockText}</b>
        </span>
        {product.productCode && (
          <span className={chip}>
            {t("summary.pid")} : <b className="text-foreground">{variant?.sku || product.productCode}</b>
          </span>
        )}
        {product.brandName && (
          <span className={chip}>
            {t("summary.brand")} :{" "}
            {product.brand ? (
              <Link href={`/brand/${product.brand}`} className="font-bold text-foreground hover:text-accent-text">
                {product.brandName}
              </Link>
            ) : (
              <b className="text-foreground">{product.brandName}</b>
            )}
          </span>
        )}
      </div>

      {/* key features */}
      {(bullets.length > 0 || product.shortDescription) && (
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground marker:text-brand-fresh">
          {bullets.length > 0 ? bullets.map((b) => <li key={b}>{b}</li>) : <li>{product.shortDescription}</li>}
        </ul>
      )}

      {/* options */}
      {colors.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold text-muted-foreground">
            {t("summary.color")}: <span className="text-foreground">{variant?.type === "color" ? variant.label.replace(/^Color:\s*/i, "") : ""}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => pick(v)}
                aria-label={t("summary.select", { label: v.label })}
                aria-pressed={variant?.id === v.id}
                title={v.label}
                className={`h-9 w-9 rounded border-2 transition-all ${variant?.id === v.id ? "border-brand-fresh ring-2 ring-brand-fresh/30" : "border-border hover:border-input"}`}
                style={{ backgroundColor: v.colorHex ?? "#888" }}
              />
            ))}
          </div>
        </div>
      )}
      {others.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold text-muted-foreground">{others[0].type === "storage" ? t("summary.storage") : others[0].type === "ram" ? "RAM" : t("summary.size")}</p>
          <div className="flex flex-wrap gap-2">
            {others.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => pick(v)}
                aria-pressed={variant?.id === v.id}
                className={`rounded border px-3.5 py-2 text-sm font-semibold transition-colors ${
                  variant?.id === v.id ? "border-brand-fresh bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:border-brand-fresh"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* price */}
      <div className="grid gap-3">
        <div className="rounded border border-border bg-background p-4">
          <p className="text-sm font-semibold text-foreground">{hasDiscount ? t("summary.discountPrice") : t("summary.price")}</p>
          <p className="mt-2 flex flex-wrap items-baseline gap-2">
            <span className="font-outfit text-2xl font-extrabold text-destructive">{money(price)}</span>
            {hasDiscount && <span className="text-sm text-muted-foreground line-through">{money(oldPrice!)}</span>}
          </p>
          <button
            type="button"
            onClick={() => setPanel(panel === "payment" ? null : "payment")}
            aria-expanded={panel === "payment"}
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline dark:text-brand-fresh"
          >
            <Plus className={`h-3.5 w-3.5 transition-transform ${panel === "payment" ? "rotate-45" : ""}`} aria-hidden="true" />
            {t("summary.paymentMethods")}
          </button>
          {panel === "payment" && (
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {paymentMethods.map((m) => (
                <li key={m} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-brand-fresh" aria-hidden="true" />
                  {t.has(`pay.${m.toUpperCase().replace(/ /g, "_")}`) ? t(`pay.${m.toUpperCase().replace(/ /g, "_")}`) : m}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* actions */}
      <div className="flex flex-wrap items-stretch gap-2.5">
        <div className="flex items-center rounded border border-input bg-background">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label={t("summary.decrease")}
            className="flex h-11 w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-10 select-none border-x border-input text-center text-sm font-bold leading-[2.75rem] text-foreground">{formatNumber(quantity, locale, 0)}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(99, stock, q + 1))}
            disabled={quantity >= 99 || quantity >= stock}
            aria-label={t("summary.increase")}
            className="flex h-11 w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <button
          ref={atcRef}
          type="button"
          onClick={add}
          disabled={busy || stock <= 0}
          aria-label={t("card.addNamed", { name: product.name })}
          className="flex h-11 min-w-[160px] flex-1 items-center justify-center gap-2 rounded bg-primary px-5 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
          {stock <= 0 ? t("summary.outOfStock") : t("summary.addToCart")}
        </button>

        <button
          type="button"
          onClick={toggleWish}
          aria-pressed={inVault}
          className={`flex h-11 items-center gap-2 rounded border px-4 text-sm font-semibold transition-colors ${
            inVault ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-border bg-secondary text-foreground hover:border-brand-fresh"
          }`}
        >
          <Heart className="h-4 w-4" fill={inVault ? "currentColor" : "none"} />
          {t("summary.wishlist")}
        </button>
      </div>

      {stock <= 0 && <BackInStockForm productId={product.id} variantId={variant?.id} />}
    </div>
  );
}

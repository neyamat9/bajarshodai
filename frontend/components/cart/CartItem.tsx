"use client";

import { Link } from "@/i18n/navigation";
import { useCart } from "@/lib/hooks/use-cart";
import type { CartItem as CartItemType } from "@/lib/types";
import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import { formatMoney, formatQuantity } from "@/lib/format";
import { stepDown, stepUp } from "@/lib/quantity";
import type { Locale } from "@/lib/locale";

interface CartItemProps {
  item: CartItemType;
  /**
   * "compact" (default) — used in the CartSidebar (narrow panel)
   * "full"              — used on the full /cart page (wider layout)
   */
  variant?: "compact" | "full";
}

/**
 * A single cart line item.
 *
 * Entrance: slides in from above + fades in
 * Exit:     slides out to the right + fades before the item is removed from state
 *
 * Supports two visual variants:
 *  - compact: used in the CartSidebar (narrow panel)
 *  - full: used on the /cart page (wider layout with column alignment)
 */
export default function CartItem({ item, variant = "compact" }: CartItemProps) {
  const t = useTranslations("Cart");
  const locale = useLocale() as Locale;
  const { updateQuantity, removeFromCart } = useCart();

  // Controls the CSS exit animation before actual removal
  const [isRemoving, setIsRemoving] = useState(false);
  // Controls the entrance animation — fires once on mount
  const [hasEntered, setHasEntered] = useState(false);
  const removeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Trigger entrance animation on next tick so the initial hidden state renders first
    const id = requestAnimationFrame(() => setHasEntered(true));
    return () => {
      cancelAnimationFrame(id);
      if (removeTimerRef.current) clearTimeout(removeTimerRef.current);
    };
  }, []);

  function handleRemove() {
    setIsRemoving(true);
    // Wait for the slide-out animation (300ms) before removing from state
    removeTimerRef.current = setTimeout(async () => {
      const r = await removeFromCart(item.id);
      if (r.ok) toast.success(t("removed", { name: item.name }));
      else {
        setIsRemoving(false);
        toast.error(r.error ?? t("removeFailed"));
      }
    }, 300);
  }

  async function change(q: number) {
    const r = await updateQuantity(item.id, q);
    if (!r.ok) toast.error(r.error ?? t("qtyFailed"));
  }

  // the buttons follow the unit: 0.5 kg steps for fish, whole pieces for soap
  const lessQty = stepDown(item.quantity, item.unit);
  const moreQty = stepUp(item.quantity, item.unit, Math.min(item.stock, 99));

  function handleDecrement() {
    if (lessQty === null) return;
    void change(lessQty);
  }

  function handleIncrement() {
    if (moreQty === null) {
      toast.info(t("onlyStock", { count: formatQuantity(item.stock, locale) }));
      return;
    }
    void change(moreQty);
  }

  const formattedPrice = formatMoney(item.price, locale);
  const formattedTotal = formatMoney(item.price * item.quantity, locale);

  const animationClasses = [
    hasEntered && !isRemoving
      ? "opacity-100 translate-y-0"
      : isRemoving
      ? "opacity-0 translate-x-8"
      : "opacity-0 -translate-y-3",
    "duration-300 ease-out",
  ]
    .filter(Boolean)
    .join(" ");

  /* ── Compact variant (CartSidebar) ── */
  if (variant === "compact") {
    return (
      <div
        className={`group flex gap-3.5 rounded border border-border bg-background p-3 shadow-sm transition-all hover:border-brand-fresh/60 hover:shadow-md ${animationClasses}`}
        aria-label={t("itemAria", { name: item.name })}
      >
        {/* Product image */}
        <Link href={`/products/${item.slug}`} className="relative h-[84px] w-[84px] flex-shrink-0 overflow-hidden rounded bg-secondary">
          <Image src={item.imageUrl} alt={item.name} fill sizes="84px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
        </Link>

        {/* Details */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-2 font-outfit text-sm font-semibold leading-snug text-foreground">{item.name}</p>
            <button
              onClick={handleRemove}
              aria-label={t("removeAria", { name: item.name })}
              className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          {item.variantLabel && <p className="mt-0.5 text-xs text-muted-foreground">{item.variantLabel}</p>}

          <div className="mt-auto flex items-end justify-between pt-2">
            {/* Stepper */}
            <div className="flex items-center overflow-hidden rounded border border-input bg-card">
              <button
                onClick={handleDecrement}
                disabled={lessQty === null}
                aria-label={t("decrease")}
                className="flex h-8 w-8 items-center justify-center text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-12 select-none px-1 text-center text-sm font-bold leading-tight text-foreground">
                {formatQuantity(item.quantity, locale)}
                {item.unit?.label && <span className="block text-[10px] font-medium text-muted-foreground">{item.unit.label}</span>}
              </span>
              <button
                onClick={handleIncrement}
                disabled={moreQty === null}
                aria-label={t("increase")}
                className="flex h-8 w-8 items-center justify-center text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Price */}
            <div className="text-right leading-tight">
              <p className="font-outfit text-base font-extrabold text-primary dark:text-accent-text">{formattedTotal}</p>
              <p className="text-[11px] text-muted-foreground">{item.unit?.label ? t("perUnit", { price: formattedPrice, unit: item.unit.label }) : item.quantity > 1 ? t("each", { price: formattedPrice }) : null}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Full variant (/cart page) ── */
  return (
    <div
      className={`flex flex-col sm:grid sm:grid-cols-[1fr_auto_auto_auto] sm:gap-4 items-start sm:items-center p-4 rounded bg-muted border border-border transition-all ${animationClasses}`}
      aria-label={t("itemAria", { name: item.name })}
    >
      {/* Product info */}
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <div className="relative w-20 h-20 flex-shrink-0 rounded overflow-hidden bg-secondary">
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="80px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm md:text-base font-semibold text-foreground leading-snug line-clamp-2 font-outfit">
            {item.name}
          </p>
          {item.variantLabel && (
            <p className="text-xs text-muted-foreground/70 mt-0.5">{item.variantLabel}</p>
          )}
          {/* Mobile: show price inline */}
          <p className="text-sm font-semibold text-accent-text mt-1 sm:hidden">
            {formattedTotal}
          </p>
        </div>
      </div>

      {/* Quantity stepper */}
      <div className="flex items-center gap-1 bg-secondary rounded overflow-hidden mt-3 sm:mt-0 w-28">
        <button
          onClick={handleDecrement}
          disabled={lessQty === null}
          aria-label={t("decrease")}
          className="w-9 h-9 flex items-center justify-center text-foreground/80 hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg leading-none"
        >
          −
        </button>
        <span className="flex-1 text-center text-sm font-semibold text-foreground select-none">
          {formatQuantity(item.quantity, locale)}
          {item.unit?.label && <span className="ml-1 text-[11px] font-medium text-muted-foreground">{item.unit.label}</span>}
        </span>
        <button
          onClick={handleIncrement}
          disabled={moreQty === null}
          aria-label={t("increase")}
          className="w-9 h-9 flex items-center justify-center text-foreground/80 hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg leading-none"
        >
          +
        </button>
      </div>

      {/* Unit price — hidden on mobile */}
      <div className="hidden sm:block text-right w-24">
        <span className="text-sm text-muted-foreground">{formattedPrice}</span>
      </div>

      {/* Line total + remove */}
      <div className="hidden sm:flex flex-col items-end gap-1 w-24">
        <span className="text-base font-bold text-foreground">{formattedTotal}</span>
        <button
          onClick={handleRemove}
          aria-label={t("removeAria", { name: item.name })}
          className="text-xs text-muted-foreground/70 hover:text-red-400 transition-colors"
        >
          {t("remove")}
        </button>
      </div>

      {/* Mobile remove button */}
      <button
        onClick={handleRemove}
        aria-label={t("removeAria", { name: item.name })}
        className="sm:hidden text-xs text-muted-foreground/70 hover:text-red-400 transition-colors mt-2 self-end"
      >
        {t("remove")}
      </button>
    </div>
  );
}

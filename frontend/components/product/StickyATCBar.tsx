"use client";

import { useCartActions } from "@/lib/hooks/use-cart";
import WhatsAppOrderButton from "@/components/product/WhatsAppOrderButton";
import MessengerOrderButton from "@/components/product/MessengerOrderButton";
import type { Product, ProductVariant } from "@/lib/types";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import { formatMoney, formatQuantity } from "@/lib/format";
import type { Locale } from "@/lib/locale";
import { startQty } from "@/lib/quantity";
import { playClick } from "@/lib/sound";

interface StickyATCBarProps {
  product: Product;
  currentPrice: number;
  /** the option picked in the main panel */
  variant?: ProductVariant | null;
  /** Ref to the main ATC button — when it leaves the viewport, the bar slides up */
  atcButtonRef: React.RefObject<HTMLButtonElement | null>;
}

export default function StickyATCBar({
  product,
  currentPrice,
  variant,
  atcButtonRef,
}: StickyATCBarProps) {
  const t = useTranslations("Product");
  const locale = useLocale() as Locale;
  const formatBDT = (n: number) => formatMoney(n, locale);
  const { addToCart } = useCartActions();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const primaryImage =
    product.images.find((img) => img.isPrimary) ?? product.images[0];

  const unit = product.unit;
  const isUntracked = product.trackStock === false;
  const rawStock = variant?.stock ?? product.stock;
  const stock = isUntracked ? 9999 : rawStock;
  const isOutOfStock = !isUntracked && (stock <= 0 || stock <= (unit?.minQty ?? 0) - 1e-9);

  // Watch the main ATC button — show bar when it scrolls out of view
  useEffect(() => {
    const target = atcButtonRef.current;
    if (!target) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        // When the main ATC button is NOT visible → show sticky bar
        const isShown = !entry.isIntersecting;
        setVisible(isShown);
        if (typeof document !== "undefined") {
          document.documentElement.style.setProperty(
            "--sticky-bar-offset",
            isShown ? "64px" : "0px"
          );
        }
      },
      { threshold: 0, rootMargin: "0px" }
    );

    observerRef.current.observe(target);

    return () => {
      observerRef.current?.disconnect();
      if (typeof document !== "undefined") {
        document.documentElement.style.setProperty("--sticky-bar-offset", "0px");
      }
    };
  }, [atcButtonRef]);

  async function handleAddToCart() {
    if (isOutOfStock || loading) return;
    playClick();
    setLoading(true);
    const quantity = startQty(unit);
    const res = await addToCart({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: currentPrice,
      variantId: variant?.id,
      variantLabel: variant?.label,
      quantity,
      imageUrl: primaryImage?.url ?? "/placeholder.svg",
      stock,
      unit,
    });
    if (res.ok) {
      toast.success(t("card.added", { name: product.name }), {
        description: t("summary.addedDesc", {
          qty: `${formatQuantity(quantity, locale)}${unit ? ` ${unit.label}` : ""}`,
          price: formatBDT(currentPrice * quantity),
        }),
        duration: 2500,
      });
    } else {
      toast.error(res.error ?? t("card.couldNotAdd"));
    }
    setLoading(false);
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[1000] transition-transform duration-300 ease-out"
      style={{
        transform: visible ? "translateY(0)" : "translateY(100%)",
      }}
      aria-hidden={!visible}
    >
      {/* Backdrop blur bar */}
      <div className="bg-card/95 backdrop-blur-xl border-t border-border shadow-[0_-20px_60px_rgba(11,98,52,0.3)]">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 md:px-8 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3">
          {/* Product thumbnail */}
          {primaryImage && (
            <div className="relative w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-muted border border-border hidden sm:block">
              <Image
                src={primaryImage.url}
                alt={primaryImage.alt}
                fill
                className="object-contain p-1"
                sizes="40px"
              />
            </div>
          )}

          {/* Product name + price */}
          <div className="flex-1 min-w-0 pr-1">
            <p className="text-foreground font-black text-xs sm:text-sm uppercase tracking-tight truncate font-outfit">
              {product.name}
            </p>
            <p className="text-accent-text font-black text-sm sm:text-base tracking-tighter">
              {formatBDT(currentPrice)}
            </p>
          </div>

          {/* Stock indicator */}
          {!isUntracked && stock < 5 && stock > 0 && (
            <div className="hidden md:flex items-center gap-1.5 text-red-400 text-[11px] font-black uppercase tracking-widest flex-shrink-0">
              <span className="w-1.5 h-1.5 bg-red-400 rounded animate-pulse" />
              {t("card.onlyStock", { count: formatQuantity(stock, locale) })}
            </div>
          )}

          {/* WhatsApp Direct Order Button (Icon on mobile, full label on sm+) */}
          <WhatsAppOrderButton
            variant="compact"
            productName={product.name}
            productSlug={product.slug}
            productPrice={currentPrice}
            className="flex-shrink-0"
          />

          {/* Messenger Direct Order Button (Icon on mobile, full label on sm+) */}
          <MessengerOrderButton
            variant="compact"
            productName={product.name}
            productSlug={product.slug}
            productPrice={currentPrice}
            className="flex-shrink-0"
          />

          {/* Add to Cart (Icon on mobile, label on sm+) */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={loading || isOutOfStock}
            aria-label={t("card.addNamed", { name: product.name })}
            className="flex-shrink-0 h-10 w-10 sm:w-auto p-0 sm:px-5 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-tight text-sm rounded transition-all shadow-[0_4px_16px_rgba(69,162,44,0.3)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]"
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            )}
            <span className="hidden sm:inline">
              {isOutOfStock ? t("summary.outOfStock") : t("summary.addToCart")}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

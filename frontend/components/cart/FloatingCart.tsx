"use client";

import { usePathname } from "@/i18n/navigation";
import AnimatedNumber from "@/components/cart/AnimatedNumber";
import { gsap } from "@/components/motion/gsap";
import { formatMoney, formatNumber } from "@/lib/format";
import { useCart } from "@/lib/hooks/use-cart";
import type { Locale } from "@/lib/locale";
import { ShoppingBasket } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

// pages that have their own cart / checkout screen: the floating cart would only be in the way
const HIDDEN_ON = ["/cart", "/checkout", "/order-confirmation"];

/**
 * The cart that follows you: a small card on the right edge of the screen (a bar along the bottom on phones)
 * with the number of items and the total, which counts up or down whenever the cart changes.
 * Tapping it opens the cart drawer.
 */
export default function FloatingCart() {
  const t = useTranslations("Cart");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const { cartCount, cartTotal, isOpen, openCart, loading } = useCart();
  const card = useRef<HTMLButtonElement>(null);
  const bar = useRef<HTMLButtonElement>(null);
  const last = useRef({ count: cartCount, total: cartTotal });

  const visible = !loading && cartCount > 0 && !isOpen && !HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  // a small bump each time something is added
  useEffect(() => {
    const prev = last.current;
    last.current = { count: cartCount, total: cartTotal };
    if (!visible) return;
    if (cartTotal <= prev.total && cartCount <= prev.count) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const targets = [card.current, bar.current].filter(Boolean);
    gsap.fromTo(targets, { scale: 1 }, { scale: 1.08, duration: 0.14, yoyo: true, repeat: 1, ease: "power2.out", overwrite: true });
  }, [cartCount, cartTotal, visible]);

  // the "scroll to top" and live chat buttons move up out of the phone bar's way
  useEffect(() => {
    document.documentElement.toggleAttribute("data-cart-bar", visible);
    const updateOffset = () => {
      const isMobile = window.innerWidth < 768;
      if (typeof document !== "undefined") {
        document.documentElement.style.setProperty(
          "--cart-bar-offset",
          visible && isMobile ? "74px" : "0px"
        );
      }
    };
    updateOffset();
    window.addEventListener("resize", updateOffset);
    return () => {
      document.documentElement.removeAttribute("data-cart-bar");
      if (typeof document !== "undefined") {
        document.documentElement.style.setProperty("--cart-bar-offset", "0px");
      }
      window.removeEventListener("resize", updateOffset);
    };
  }, [visible]);

  if (!visible) return null;

  const items = t("floatItems", { count: formatNumber(cartCount, locale, 0) });
  const money = (n: number) => formatMoney(Math.round(n), locale);
  const label = t("floatAria", { items, total: formatMoney(cartTotal, locale) });

  return (
    <>
      {/* desktop and tablets: a card on the right, in the middle of the screen */}
      <button
        ref={card}
        type="button"
        onClick={openCart}
        aria-label={label}
        className="fixed right-0 top-1/2 z-[1400] hidden w-[92px] -translate-y-1/2 flex-col overflow-hidden rounded-l-xl border border-r-0 border-primary/30 bg-card text-center shadow-[0_14px_36px_-10px_rgba(11,98,52,0.5)] transition-transform hover:-translate-x-1 md:flex"
      >
        <span className="flex flex-col items-center gap-1 px-2 pb-2 pt-3">
          <ShoppingBasket className="h-7 w-7 text-primary dark:text-brand-fresh" aria-hidden="true" />
          <span className="text-[11px] font-bold leading-tight text-foreground">{items}</span>
        </span>
        <AnimatedNumber value={cartTotal} format={money} className="bg-brand-deep px-1 py-2 font-outfit text-[13px] font-extrabold tabular-nums text-white" />
      </button>

      {/* phones: a bar along the bottom */}
      <button
        ref={bar}
        type="button"
        onClick={openCart}
        aria-label={label}
        className="fixed inset-x-3 bottom-3 z-[1400] flex items-center justify-between gap-3 rounded-xl bg-primary px-4 py-3 text-primary-foreground shadow-[0_14px_36px_-8px_rgba(11,98,52,0.7)] md:hidden"
      >
        <span className="flex items-center gap-2.5">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
            <ShoppingBasket className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-sm font-bold">{items}</span>
        </span>
        <AnimatedNumber value={cartTotal} format={money} className="rounded-lg bg-brand-fresh px-3 py-1.5 font-outfit text-sm font-extrabold tabular-nums text-on-fresh" />
      </button>
    </>
  );
}

"use client";

import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { useCart } from "@/lib/hooks/use-cart";
import { useCartCoupon } from "@/lib/hooks/use-cart-coupon";
import { useCheckoutEntry } from "@/lib/hooks/use-checkout-entry";
import { AlertCircle, ArrowRight, Check, Loader2, Lock, ShoppingBag, Tag, Truck, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatMoney } from "@/lib/format";
import { translateApiMessage } from "@/lib/api-errors";
import type { Locale } from "@/lib/locale";
import CartItem from "./CartItem";

/**
 * Global cart drawer — slides in from the right.
 * Rendered once in the root layout; visibility is driven by CartContext.isOpen.
 */
export default function CartSidebar() {
  const t = useTranslations("Cart");
  const locale = useLocale() as Locale;
  const money = (n: number) => formatMoney(n, locale);
  const { cart, cartCount, cartTotal, isOpen, closeCart } = useCart();
  const checkout = useCheckoutEntry(closeCart);
  const { user } = useAuth();
  const panelRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  const signature = useMemo(() => cart.items.map((i) => `${i.id}:${i.quantity}`).join("|"), [cart.items]);
  const coupon = useCartCoupon({ enabled: isOpen && cart.items.length > 0, signature, userId: user?.id });
  const { applied, summary } = coupon;

  // Close on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) closeCart();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeCart]);

  // Focus the panel + lock page scroll while open (the scrollbar gutter is reserved, so no layout shift)
  useEffect(() => {
    if (isOpen) {
      panelRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // a coupon that was applied should clear the typing box
  useEffect(() => {
    if (applied) setInput("");
  }, [applied]);

  const subtotal = summary?.subtotal ?? cartTotal;
  const discount = applied ? summary?.discountAmount ?? applied.discount : 0;
  const freeShipLine = applied && applied.shippingDiscount > 0;
  const total = Math.max(0, subtotal - discount);

  const ship = summary?.shipping;
  const threshold = ship?.freeShippingThreshold ?? null;
  const toFree = threshold ? Math.max(0, threshold - subtotal + discount) : null;
  const progress = threshold ? Math.min(100, (Math.max(0, subtotal - discount) / threshold) * 100) : 0;

  async function onApply(e: React.FormEvent) {
    e.preventDefault();
    await coupon.apply(input);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        data-lenis-prevent
        onClick={closeCart}
        className={[
          "fixed inset-0 z-[2100] bg-brand-deep/60 backdrop-blur-sm transition-opacity duration-500",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      />

      {/* Drawer */}
      <aside
        ref={panelRef}
        tabIndex={-1}
        data-lenis-prevent
        role="dialog"
        aria-modal="true"
        aria-label={t("cartAria")}
        className={[
          "fixed right-0 top-0 z-[2110] flex h-full w-full max-w-[440px] flex-col",
          "border-l border-border bg-background shadow-2xl outline-none",
          "transition-transform duration-[550ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
          isOpen ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        {/* Header */}
        <div className="relative flex flex-shrink-0 items-center justify-between overflow-hidden bg-brand-deep px-5 py-5 text-primary-foreground dark:bg-card">
          <div className="relative flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded bg-brand-fresh text-on-fresh">
              <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <h2 className="font-outfit text-xl font-bold">{t("title")}</h2>
              <p className="text-xs text-white/70">
                {cartCount === 0 ? t("nothingYet") : t("readyToShip", { count: cartCount })}
              </p>
            </div>
          </div>
          <button
            onClick={closeCart}
            aria-label={t("close")}
            className="relative flex h-9 w-9 items-center justify-center rounded border border-white/20 text-white/90 transition-colors hover:bg-white/10"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        {cart.items.length === 0 ? (
          /* ── Empty state ── */
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 text-center">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded bg-secondary">
                <ShoppingBag className="h-10 w-10 text-brand-fresh" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <span className="absolute -right-2 -top-2 h-4 w-4 bg-brand-fresh" aria-hidden="true" />
              <span className="absolute -bottom-2 -left-2 h-3 w-3 bg-primary/40" aria-hidden="true" />
            </div>
            <div>
              <p className="font-outfit text-xl font-bold text-foreground">{t("emptyTitle")}</p>
              <p className="mt-1.5 text-sm text-muted-foreground">{t("emptyDrawer")}</p>
            </div>
            <Link
              href="/products"
              onClick={closeCart}
              className="group inline-flex items-center gap-2 rounded bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t("startShopping")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <>
            {/* Free-shipping progress */}
            {threshold ? (
              <div className="flex-shrink-0 border-b border-border bg-card px-5 py-3.5">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Truck className="h-4 w-4 text-accent-text" aria-hidden="true" />
                  {toFree && toFree > 0 ? (
                    <span>
                      {t.rich("addForFree", { amount: money(toFree), b: (c) => <b className="text-accent-text">{c}</b> })}
                    </span>
                  ) : (
                    <span className="text-emerald-700 dark:text-emerald-400">{t("freeUnlocked")}</span>
                  )}
                </div>
                <div className="h-1.5 overflow-hidden rounded bg-secondary" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full rounded bg-brand-fresh transition-[width] duration-700 ease-out" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : null}

            {/* ── Item list ── */}
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {cart.items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>

            {/* ── Footer ── */}
            <div className="flex-shrink-0 space-y-4 border-t border-border bg-card px-5 pb-5 pt-4 shadow-[0_-12px_30px_-18px_rgba(11,98,52,0.35)]">
              {/* Coupon */}
              {applied ? (
                <div className="flex items-center gap-3 rounded border border-emerald-600/40 bg-emerald-600/10 px-3 py-2.5" role="status">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-emerald-600 text-white">
                    <Check className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate text-sm font-bold text-foreground">
                      {t("couponApplied", { code: applied.code })}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {freeShipLine ? t("freeDelivery") : discount > 0 ? t("youSave", { amount: money(discount) }) : applied.description ?? t("couponActive")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={coupon.remove}
                    aria-label={t("removeCoupon", { code: applied.code })}
                    className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={onApply} noValidate>
                  <label htmlFor="drawer-coupon" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <Tag className="h-3.5 w-3.5 text-accent-text" aria-hidden="true" />
                    {t("haveCoupon")}
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="drawer-coupon"
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value.toUpperCase().replace(/\s+/g, ""));
                        if (coupon.error) coupon.clearError();
                      }}
                      maxLength={40}
                      autoComplete="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                      placeholder={t("enterCode")}
                      aria-invalid={!!coupon.error}
                      aria-describedby={coupon.error ? "drawer-coupon-msg" : undefined}
                      disabled={coupon.busy}
                      className={`h-11 min-w-0 flex-1 rounded border bg-background px-3 font-mono text-sm font-semibold uppercase tracking-wider text-foreground placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground focus:outline-none focus:ring-4 disabled:opacity-60 ${
                        coupon.error ? "border-destructive focus:ring-destructive/15" : "border-input focus:border-brand-fresh focus:ring-brand-fresh/15"
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={coupon.busy || input.length === 0}
                      className="inline-flex h-11 min-w-[88px] items-center justify-center gap-2 rounded bg-primary px-4 text-sm font-bold text-primary-foreground transition-all hover:bg-brand-fresh hover:text-on-fresh active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-primary disabled:hover:text-primary-foreground"
                    >
                      {coupon.busy ? <Loader2 className="h-4 w-4 animate-spin" aria-label={t("checking")} /> : t("apply")}
                    </button>
                  </div>
                  <div aria-live="polite" className="min-h-0">
                    {coupon.error && (
                      <p id="drawer-coupon-msg" className="mt-2 flex items-start gap-1.5 text-xs font-medium text-destructive">
                        <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        {translateApiMessage(coupon.error, locale)}
                      </p>
                    )}
                  </div>
                </form>
              )}
              {coupon.offline && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground" role="status">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {t("offline")}
                </p>
              )}

              {/* Totals */}
              <dl className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">{t("subtotal")}</dt>
                  <dd className="font-semibold text-foreground">{money(subtotal)}</dd>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
                    <dt>{t("couponDiscount")}</dt>
                    <dd className="font-semibold">−{money(discount)}</dd>
                  </div>
                )}
                <div className="flex items-end justify-between border-t border-dashed border-border pt-3">
                  <dt className="font-outfit text-base font-bold text-foreground">{t("total")}</dt>
                  <dd className="text-right leading-none">
                    {discount > 0 && <span className="mb-1 block text-xs text-muted-foreground line-through">{money(subtotal)}</span>}
                    <span className="font-outfit text-2xl font-extrabold text-primary dark:text-accent-text">{money(total)}</span>
                  </dd>
                </div>
              </dl>

              {/* CTAs */}
              <button
                type="button"
                onClick={checkout.go}
                disabled={checkout.state === "loading" || checkout.checking}
                className="group flex w-full items-center justify-center gap-2 rounded bg-brand-fresh py-3.5 text-sm font-extrabold text-on-fresh shadow-[0_10px_24px_-10px_rgba(69,162,44,0.9)] transition-all hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 disabled:cursor-wait disabled:opacity-80 disabled:hover:translate-y-0"
              >
                {checkout.state === "loading" || checkout.checking ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Lock className="h-4 w-4" aria-hidden="true" />}
                {checkout.checking ? t("checkingAddresses") : checkout.state === "signed-out" ? t("loginToCheckout") : t("proceed")}
                {!checkout.checking && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />}
              </button>
              {checkout.state === "signed-out" && <p className="-mt-1 text-center text-xs text-muted-foreground">{t("signInHint")}</p>}
              <div className="flex items-center justify-between text-sm">
                <Link href="/cart" onClick={closeCart} className="font-semibold text-primary hover:underline dark:text-accent-text">
                  {t("viewFull")}
                </Link>
                <Link href="/products" onClick={closeCart} className="text-muted-foreground transition-colors hover:text-foreground">
                  {t("continueShopping")}
                </Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

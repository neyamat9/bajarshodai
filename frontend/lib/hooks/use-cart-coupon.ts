"use client";

import { APIError, errorMessage } from "@/lib/api/client";
import {
  COUPON_EVENT,
  COUPON_PATTERN,
  clearStoredCoupon,
  getStoredCoupon,
  normalizeCoupon,
  storeCoupon,
} from "@/lib/coupon-store";
import { applyCoupon, getCheckoutSummary, type CheckoutSummary } from "@/lib/services/checkout.service";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { translateApiMessage } from "@/lib/api-errors";
import type { Locale } from "@/lib/locale";

type CouponInfo = NonNullable<CheckoutSummary["coupon"]> & { message?: string };

interface Options {
  /** Only talk to the server while this is true (e.g. the drawer is open) */
  enabled: boolean;
  /** Changes whenever the cart contents change → re-validate */
  signature: string;
  /** Changes when the customer logs in/out → re-validate */
  userId?: string;
}

/**
 * Coupon logic for the cart drawer.
 *
 *  - the server is the only judge: codes are validated against the real cart
 *    (minimum order, expiry, usage limits, first-order rules…)
 *  - responses that arrive out of order are ignored
 *  - a coupon the server rejects is removed; a network hiccup keeps it and says so
 *  - the code is shared with the checkout page through localStorage
 */
export function useCartCoupon({ enabled, signature, userId }: Options) {
  const t = useTranslations("Cart");
  const locale = useLocale() as Locale;
  const [code, setCode] = useState("");
  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const seq = useRef(0);
  const inflightApply = useRef(false);

  // pick up the stored code, and follow changes made on other pages/tabs
  useEffect(() => {
    setCode(getStoredCoupon());
    const sync = () => setCode(getStoredCoupon());
    window.addEventListener(COUPON_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(COUPON_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // keep the totals fresh (with or without a coupon) while the drawer is open
  const refresh = useCallback(
    async (activeCode: string) => {
      const mine = ++seq.current;
      setBusy(true);
      try {
        const s = await getCheckoutSummary({ couponCode: activeCode || undefined });
        if (mine !== seq.current) return;
        setOffline(false);
        setSummary(s);
        const c = s.coupon as CouponInfo | null;
        if (activeCode && !(c && c.applied)) {
          // the coupon no longer works for this cart
          clearStoredCoupon();
          setError(c?.message ? translateApiMessage(c.message, locale) : t("couponGone", { code: activeCode }));
        } else {
          setError(null);
        }
      } catch (e) {
        if (mine !== seq.current) return;
        if (e instanceof APIError && e.status >= 400 && e.status < 500 && e.status !== 401 && e.status !== 429 && activeCode) {
          clearStoredCoupon();
          setError(errorMessage(e));
        } else {
          setOffline(true); // keep the code, we just couldn't check it
        }
      } finally {
        if (mine === seq.current) setBusy(false);
      }
    },
    [t, locale],
  );

  useEffect(() => {
    if (!enabled || !signature) return;
    const t = setTimeout(() => void refresh(code), 300);
    return () => clearTimeout(t);
  }, [enabled, signature, userId, code, refresh]);

  const apply = useCallback(
    async (raw: string): Promise<boolean> => {
      if (inflightApply.current) return false;
      const next = normalizeCoupon(raw);
      if (!next) {
        setError(t("couponNeeded"));
        return false;
      }
      if (!COUPON_PATTERN.test(next)) {
        setError(t("couponChars"));
        return false;
      }
      if (next === code && summary?.coupon?.applied) {
        setError(t("couponAlready", { code: next }));
        return false;
      }
      inflightApply.current = true;
      const mine = ++seq.current;
      setBusy(true);
      setError(null);
      try {
        const s = await applyCoupon(next);
        if (mine !== seq.current) return false;
        setSummary(s);
        setOffline(false);
        storeCoupon(next);
        return true;
      } catch (e) {
        if (mine === seq.current) {
          setError(e instanceof APIError ? e.message : translateApiMessage("Could not reach the server. Check your connection and try again.", locale));
        }
        return false;
      } finally {
        inflightApply.current = false;
        if (mine === seq.current) setBusy(false);
      }
    },
    [code, summary?.coupon?.applied, t, locale],
  );

  const remove = useCallback(() => {
    seq.current++;
    clearStoredCoupon();
    setError(null);
    setSummary((s) => (s ? { ...s, coupon: null, discountAmount: 0, total: s.total + s.discountAmount } : s));
    void refresh("");
  }, [refresh]);

  const applied = summary?.coupon?.applied ? (summary.coupon as CouponInfo) : null;

  return { code, summary, applied, busy, error, offline, apply, remove, clearError: () => setError(null) };
}

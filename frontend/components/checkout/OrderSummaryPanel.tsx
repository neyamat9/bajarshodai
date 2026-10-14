"use client";

import { errorMessage } from "@/lib/api/client";
import type { CheckoutSummary } from "@/lib/services/checkout.service";
import Image from "next/image";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatMoney, formatQuantity, formatNumber } from "@/lib/format";
import type { Locale } from "@/lib/locale";

interface Props {
  summary: CheckoutSummary | null;
  loading: boolean;
  /** coupon code currently applied (or typed) */
  couponCode: string;
  onApplyCoupon: (code: string) => Promise<void>;
  onRemoveCoupon: () => void;
}


/** Right column: items, coupon, shipping and the total — all worked out by the server. */
export default function OrderSummaryPanel({ summary, loading, couponCode, onApplyCoupon, onRemoveCoupon }: Props) {
  const t = useTranslations("Checkout");
  const locale = useLocale() as Locale;
  const money = (n: number) => formatMoney(n, locale);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function apply(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await onApplyCoupon(code.trim().toUpperCase());
      setCode("");
    } catch (e2) {
      setErr(errorMessage(e2));
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="rounded bg-muted border border-border overflow-hidden" aria-busy={loading}>
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-black uppercase tracking-widest text-foreground/80">{t("summary")}</h2>
      </div>

      <div className="divide-y divide-border max-h-[320px] overflow-y-auto">
        {(summary?.items ?? []).map((i) => (
          <div key={i.cartItemId} className="flex items-center gap-3 px-5 py-3">
            <div className="relative w-12 h-12 rounded overflow-hidden bg-secondary shrink-0">
              <Image src={i.image ?? "/placeholder.svg"} alt={i.name} fill sizes="48px" className="object-cover" unoptimized />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground line-clamp-1">{i.name}</p>
              {i.variantName && <p className="text-xs text-muted-foreground/70">{i.variantName}</p>}
              <p className="text-xs text-muted-foreground">{money(i.unitPrice)} × {formatQuantity(i.quantity, locale)}</p>
              {i.issue && <p className="text-xs text-red-400">{i.issue}</p>}
            </div>
            <span className="text-sm font-semibold text-foreground">{money(i.lineTotal)}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-border p-5 space-y-3">
        {summary?.coupon?.applied ? (
          <div className="flex items-center justify-between rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs">
            <span className="text-emerald-300">
              {t.rich("couponApplied", { code: summary.coupon.code, desc: summary.coupon.description ? ` — ${summary.coupon.description}` : "", b: (c) => <b>{c}</b> })}
            </span>
            <button type="button" onClick={onRemoveCoupon} className="font-bold text-foreground/80 hover:text-foreground">{t("removeCoupon")}</button>
          </div>
        ) : (
          <form onSubmit={apply} className="flex gap-2">
            <label htmlFor="coupon" className="sr-only">{t("couponLabel")}</label>
            <input id="coupon" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder={t("couponPh")} className="h-10 min-w-0 flex-1 rounded border border-border bg-muted px-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-brand-fresh focus:outline-none" />
            <button type="submit" disabled={busy || !code.trim()} className="h-10 rounded bg-secondary px-4 text-xs font-black uppercase tracking-wide text-foreground hover:bg-secondary disabled:opacity-50">
              {busy ? "…" : t("apply")}
            </button>
          </form>
        )}
        {err && <p role="alert" className="text-xs text-red-400">{err}</p>}
        {couponCode && !summary?.coupon?.applied && !err && loading === false && <p className="text-xs text-amber-300">{t("couponFail", { code: couponCode })}</p>}

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground"><dt>{t("subtotal")}</dt><dd className="text-foreground">{money(summary?.subtotal ?? 0)}</dd></div>
          {!!summary?.discountAmount && <div className="flex justify-between text-emerald-300"><dt>{t("discount")}</dt><dd>− {money(summary.discountAmount)}</dd></div>}
          <div className="flex justify-between text-muted-foreground">
            <dt>
              {t("shipping")}{" "}
              {summary?.shipping.distanceKm != null ? <span className="text-muted-foreground/70">({t("km", { km: formatNumber(summary.shipping.distanceKm, locale, 1) })}{summary.shipping.estimated ? `, ${t("estimated")}` : ""})</span> : null}
            </dt>
            <dd className="text-foreground">
              {!summary || !summary.shipping.available ? <span className="text-muted-foreground/70">{t("shippingPending")}</span> : summary.shippingCost === 0 ? <span className="text-emerald-300">{t("free")}</span> : money(summary.shippingCost)}
            </dd>
          </div>
          {summary && summary.shipping.available && summary.shippingCost > 0 && summary.shipping.amountForFreeDelivery ? (
            <p className="text-xs text-accent-text">{t("addForFree", { amount: money(summary.shipping.amountForFreeDelivery) })}</p>
          ) : null}
          {summary && !summary.minOrderOk ? <p className="text-xs font-medium text-amber-300">{t("minOrder", { amount: money(summary.minOrderAmount) })}</p> : null}
          <div className="flex justify-between border-t border-border pt-3 text-base font-bold">
            <dt className="text-foreground">{t("total")}</dt>
            <dd className="font-outfit text-xl font-black text-accent-text">{money(summary?.total ?? 0)}</dd>
          </div>
        </dl>
        {summary?.shipping.durationSec ? <p className="text-xs text-muted-foreground/70">{t("eta", { min: formatNumber(Math.max(1, Math.round(summary.shipping.durationSec / 60)), locale, 0) })}</p> : null}
      </div>
    </aside>
  );
}

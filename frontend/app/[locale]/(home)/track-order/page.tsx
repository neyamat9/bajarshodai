"use client";

import { errorMessage } from "@/lib/api/client";
import { useAuth } from "@/lib/hooks/use-auth";
import { claimOrders, trackOrder, type TrackedOrder } from "@/lib/services/orders.service";
import { statusLabel } from "@/lib/api/mappers";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { formatDateTime, formatMoney, formatQuantity, latinDigits } from "@/lib/format";
import { useStatusLabel } from "@/components/orders/labels";

const fmt = (n: string | number) => formatMoney(Number(n));
const input = "w-full rounded border border-border bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-brand-fresh";

function Tracker() {
  const t = useTranslations("Track");
  const statusText = useStatusLabel();
  const params = useSearchParams();
  const { user } = useAuth();
  const [number, setNumber] = useState(params.get("n") ?? "");
  const [phone, setPhone] = useState(params.get("p") ?? "");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookup(n = number, p = phone) {
    setBusy(true);
    setError(null);
    setOrder(null);
    try {
      setOrder(await trackOrder(n.trim(), latinDigits(p).trim()));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const n = params.get("n");
    const p = params.get("p");
    if (n && p) void lookup(n, p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function claim() {
    try {
      const r = await claimOrders([{ orderNumber: number.trim(), phone: latinDigits(phone).trim() }]);
      toast.success(r.claimed ? t("claimed") : t("alreadyClaimed"));
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-8">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-accent-text">{t("eyebrow")}</p>
        <h1 className="font-outfit text-4xl font-black tracking-tight text-foreground">{t.rich("title", { accent: (c) => <span className="text-accent-text">{c}</span> })}</h1>
        <p className="mt-2 text-sm text-muted-foreground/70">{t("lead")}</p>

        <form onSubmit={(e) => { e.preventDefault(); void lookup(); }} className="mt-8 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <div>
            <label htmlFor="n" className="sr-only">{t("number")}</label>
            <input id="n" required value={number} onChange={(e) => setNumber(e.target.value)} placeholder={t("numberPh")} className={input} />
          </div>
          <div>
            <label htmlFor="p" className="sr-only">{t("phone")}</label>
            <input id="p" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("phonePh")} className={input} />
          </div>
          <button type="submit" disabled={busy} className="rounded bg-brand-fresh px-6 py-3 text-xs font-black uppercase tracking-widest text-foreground hover:bg-brand-fresh/90 disabled:opacity-60">{busy ? t("looking") : t("track")}</button>
        </form>

        {error && <p role="alert" className="mt-6 rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

        {order && (
          <div className="mt-8 space-y-5 rounded border border-border bg-muted p-6 text-foreground">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-sm text-accent-text">{order.orderNumber}</p>
                <p className="text-xs text-muted-foreground/70">{t("placed", { date: formatDateTime(order.placedAt) })}</p>
              </div>
              <span className="rounded bg-secondary px-4 py-1.5 text-xs font-black uppercase tracking-wider">{statusText(statusLabel(order.status))}</span>
            </div>

            <ol className="space-y-3 border-l border-border pl-5">
              {order.timeline.map((step, i) => (
                <li key={i} className="relative text-sm">
                  <span className="absolute -left-[25px] top-1.5 size-2.5 rounded bg-brand-fresh" />
                  <b>{statusText(statusLabel(step.status))}</b>
                  {step.note && <span className="text-muted-foreground"> — {step.note}</span>}
                  <p className="text-xs text-muted-foreground/70">{formatDateTime(step.at)}</p>
                </li>
              ))}
            </ol>

            {(order.courierName || order.trackingNumber) && (
              <p className="text-sm text-foreground/80">
                {t("courier")}: <b>{order.courierName ?? "—"}</b> {order.trackingNumber && <>· {t("trackingNo")} <span className="font-mono">{order.trackingNumber}</span></>}{" "}
                {order.trackingUrl && <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-accent-text underline">{t("open")}</a>}
              </p>
            )}

            <ul className="divide-y divide-border text-sm">
              {order.items.map((i, k) => (
                <li key={k} className="flex justify-between py-2"><span>{i.productName}{i.variantName ? ` (${i.variantName})` : ""} × {formatQuantity(Number(i.quantity))}</span><span>{fmt(i.total)}</span></li>
              ))}
            </ul>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground"><dt>{t("subtotal")}</dt><dd>{fmt(order.subtotal)}</dd></div>
              {Number(order.discountAmount) > 0 && <div className="flex justify-between text-emerald-300"><dt>{t("discount")}</dt><dd>− {fmt(order.discountAmount)}</dd></div>}
              <div className="flex justify-between text-muted-foreground"><dt>{t("shipping")}</dt><dd>{fmt(order.shippingCost)}</dd></div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold"><dt>{t("total")}</dt><dd className="text-accent-text">{fmt(order.total)}</dd></div>
              {Number(order.dueAmount) > 0 && <div className="flex justify-between text-foreground/80"><dt>{t("toPay")}</dt><dd>{fmt(order.dueAmount)}</dd></div>}
            </dl>
            {order.deliverTo && <p className="text-xs text-muted-foreground/70">{t("deliveringTo", { name: order.deliverTo.name, city: order.deliverTo.city ? `, ${order.deliverTo.city}` : "" })}</p>}
            {user && <button type="button" onClick={claim} className="rounded border border-border px-4 py-2 text-xs font-black uppercase tracking-widest text-foreground/80 hover:text-foreground">{t("claim")}</button>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={null}>
      <Tracker />
    </Suspense>
  );
}

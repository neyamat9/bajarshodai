"use client";

import { Link } from "@/i18n/navigation";
import RequireLogin from "@/components/account/RequireLogin";
import { btnGhost, btnPrimary, card, formatBDT, formatDate, formatDateTime, formatDeliveryWindow, Skeleton, StepProgress } from "@/components/account/ui";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { errorMessage } from "@/lib/api/client";
import { useCart } from "@/lib/hooks/use-cart";
import { cancelOrder, getOrderById, openInvoice, reorder } from "@/lib/services/orders.service";
import { MOBILE_METHODS, type Order } from "@/lib/types";
import { ArrowLeft, Banknote, Bike, Calendar, CheckCircle2, Clock, StickyNote, ExternalLink, FileText, Headset, MapPin, PackageSearch, Phone, RotateCcw, RotateCw, Smartphone, Truck, XCircle } from "lucide-react";
import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { isFinished, isOffTrack } from "@/lib/api/mappers";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/lib/locale";
import { formatNumber, formatQuantity } from "@/lib/format";
import { usePaymentLabel } from "@/components/orders/labels";

function Row({ label, value, strong, tone }: { label: string; value: React.ReactNode; strong?: boolean; tone?: string }) {
  return (
    <div className={`flex items-center justify-between gap-3 text-sm ${strong ? "font-black text-foreground" : "text-muted-foreground"} ${tone ?? ""}`}>
      <span>{label}</span>
      <span className={strong ? "text-lg text-accent-text" : "font-semibold text-foreground"}>{value}</span>
    </div>
  );
}

/** Shown once, right after the order was placed (?placed=1). */
function PlacedBanner({ order }: { order: Order }) {
  const t = useTranslations("Orders");
  const payText = usePaymentLabel();
  const mobile = MOBILE_METHODS.includes(order.paymentMethod);
  return (
    <div role="status" className="animate-fade-slide-up relative overflow-hidden rounded border border-emerald-500/40 bg-emerald-500/10 p-5 sm:p-6">
      <span className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rotate-12 bg-brand-fresh/20" aria-hidden="true" />
      <div className="relative flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
          <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-outfit text-xl font-black text-foreground">{t("thanks")}</h2>
          <p className="mt-1 text-sm text-foreground/85">
            {t.rich("thanksText", { number: order.orderNumber, b: (c) => <b className="font-mono">{c}</b> })}{" "}
            {mobile ? t("thanksMobile", { method: payText(order.paymentMethod) }) : t("thanksCod")}
          </p>
        </div>
      </div>
    </div>
  );
}

function PlacedBannerGate({ order }: { order: Order }) {
  return useSearchParams().get("placed") === "1" ? <PlacedBanner order={order} /> : null;
}

function Detail() {
  const t = useTranslations("Orders");
  const tc = useTranslations("Checkout");
  const locale = useLocale() as Locale;
  const payText = usePaymentLabel();
  const { id } = useParams<{ id: string }>();
  const { refreshCart, openCart } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [busy, setBusy] = useState<"cancel" | "again" | "invoice" | null>(null);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    getOrderById(id)
      .then((o) => {
        if (!alive) return;
        if (o) {
          setOrder(o);
          setState("ok");
        } else setState("missing");
      })
      .catch(() => alive && setState("missing"));
    return () => {
      alive = false;
    };
  }, [id]);

  async function cancel() {
    if (!order?.canCancel) return;
    setBusy("cancel");
    try {
      setOrder(await cancelOrder(order.id));
      setConfirmCancel(false);
      toast.success(t("cancelled"));
    } catch (e) {
      toast.error(errorMessage(e, t("cancelFailed")));
    } finally {
      setBusy(null);
    }
  }

  async function buyAgain() {
    if (!order) return;
    setBusy("again");
    try {
      await reorder(order.id);
      await refreshCart();
      toast.success(t("addedToCart"));
      openCart();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function invoice() {
    if (!order) return;
    setBusy("invoice");
    try {
      await openInvoice(order.id);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  if (state === "loading") {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-36" />
        <div className="grid gap-5 lg:grid-cols-3">
          <Skeleton className="h-72 lg:col-span-2" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  if (state === "missing" || !order) {
    return (
      <div className={`${card} flex flex-col items-center px-6 py-16 text-center`}>
        <PackageSearch className="h-12 w-12 text-muted-foreground/60" aria-hidden="true" />
        <h1 className="mt-4 font-outfit text-2xl font-black text-foreground">{t("notFound")}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{t("notFoundText")}</p>
        <Link href="/orders" className={`${btnPrimary} mt-6`}>
          {t("backToOrders")}
        </Link>
      </div>
    );
  }

  const addr = order.shippingAddress;
  const cod = order.paymentMethod === "Cash on Delivery";

  return (
    <div className="space-y-5">
      <Link href="/orders" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition-colors hover:text-accent-text">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t("allOrders")}
      </Link>

      <Suspense fallback={null}>
        <PlacedBannerGate order={order} />
      </Suspense>

      {/* summary header */}
      <div className={`${card} overflow-hidden`}>
        <div className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
          <div className="min-w-0">
            <p className="text-xs font-bold text-muted-foreground">{t("order")}</p>
            <h1 className="break-all font-mono text-xl font-black text-primary dark:text-foreground sm:text-2xl">{order.orderNumber}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                {t("placed", { date: formatDate(order.placedAt) })}
              </span>
              {!isFinished(order.status) && (
                <span className="inline-flex items-center gap-1.5">
                  <Truck className="h-4 w-4" aria-hidden="true" />
                  {t.rich("arrivesBy", { date: formatDeliveryWindow(order.estimatedDelivery, order.deliverySlot), b: (c) => <b className="text-foreground">{c}</b> })}
                </span>
              )}
            </p>
          </div>
          <StatusBadge status={order.status} className="px-3 py-1.5 text-xs" />
        </div>

        <div className="border-t border-border bg-secondary/40 px-5 py-6 sm:px-8">
          <StepProgress order={order} timestamps />
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-border p-4 sm:px-6">
          <button type="button" onClick={invoice} disabled={busy === "invoice"} className={`${btnGhost} h-10`}>
            <FileText className="h-4 w-4" aria-hidden="true" />
            {t("invoice")}
          </button>
          <button type="button" onClick={buyAgain} disabled={busy === "again"} className={`${btnGhost} h-10`}>
            <RotateCw className={`h-4 w-4 ${busy === "again" ? "animate-spin" : ""}`} aria-hidden="true" />
            {t("buyAgain")}
          </button>
          {order.canCancel &&
            (confirmCancel ? (
              <span className="ml-auto flex flex-wrap items-center gap-2 rounded border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm">
                <span className="font-semibold text-red-700 dark:text-red-300">{t("cancelAsk")}</span>
                <button type="button" onClick={cancel} disabled={busy === "cancel"} className="rounded bg-red-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60">
                  {busy === "cancel" ? t("cancelling") : t("cancelYes")}
                </button>
                <button type="button" onClick={() => setConfirmCancel(false)} className="rounded px-3 py-1.5 text-xs font-bold text-foreground hover:bg-secondary">
                  {t("keepOrder")}
                </button>
              </span>
            ) : (
              <button type="button" onClick={() => setConfirmCancel(true)} className="ml-auto inline-flex h-10 items-center gap-2 rounded border border-red-500/40 px-4 text-sm font-bold text-red-700 transition-colors hover:bg-red-500/10 dark:text-red-300">
                <XCircle className="h-4 w-4" aria-hidden="true" />
                {t("cancelOrder")}
              </button>
            ))}
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* items + totals */}
        <div className={`${card} p-5 sm:p-6`}>
          <h2 className="mb-4 font-outfit text-lg font-black text-foreground">
            {t("items")} <span className="text-sm font-semibold text-muted-foreground">({formatQuantity(order.items.reduce((s, i) => s + i.quantity, 0))})</span>
          </h2>
          <ul className="divide-y divide-border">
            {order.items.map((it, i) => (
              <li key={`${it.productId}-${it.variantLabel ?? "d"}-${i}`} className="flex items-center gap-4 py-3.5 first:pt-0">
                <Link href={`/products/${it.slug}`} className="relative h-18 w-18 shrink-0 overflow-hidden rounded border border-border bg-secondary">
                  <Image src={it.imageUrl} alt={it.name} fill sizes="72px" className="object-cover" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/products/${it.slug}`} className="line-clamp-2 text-sm font-bold text-foreground transition-colors hover:text-accent-text">
                    {it.name}
                  </Link>
                  {it.variantLabel && <p className="mt-0.5 text-xs text-muted-foreground">{it.variantLabel}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatBDT(it.price)} × {formatQuantity(it.quantity)}
                  </p>
                </div>
                <p className="text-sm font-black text-foreground">{formatBDT(it.price * it.quantity)}</p>
              </li>
            ))}
          </ul>

          <div className="mt-2 space-y-2.5 border-t border-border pt-4">
            <Row label={t("subtotal")} value={formatBDT(order.subtotal)} />
            {!!order.discountAmount && <Row label={`${t("discount")}${order.couponCode ? ` (${order.couponCode})` : ""}`} value={`− ${formatBDT(order.discountAmount)}`} tone="text-emerald-700 dark:text-emerald-300" />}
            <Row label={t("shipping")} value={order.shippingCost ? formatBDT(order.shippingCost) : t("free")} />
            <div className="border-t border-border pt-3">
              <Row label={t("total")} value={formatBDT(order.total)} strong />
            </div>
            {!!order.paidAmount && <Row label={t("paid")} value={formatBDT(order.paidAmount)} />}
            {!!order.dueAmount && !isOffTrack(order.status) && <Row label={cod ? t("toPayDelivery") : t("stillToPay")} value={formatBDT(order.dueAmount)} />}
          </div>
        </div>

        {/* side panels */}
        <div className="space-y-5">
          {order.rider && (
            <div className={`${card} p-5`}>
              <h2 className="mb-2 flex items-center gap-2 font-outfit text-base font-black text-foreground">
                <Bike className="h-4 w-4 text-accent-text" aria-hidden="true" />
                {t("riderTitle")}
              </h2>
              <p className="text-sm font-bold text-foreground">{order.rider.name}</p>
              <p className="text-xs text-muted-foreground">{order.rider.status === "ON_THE_WAY" ? t("riderOnTheWay") : t("riderHasIt")}</p>
              <a href={`tel:${order.rider.phone}`} className="mt-3 inline-flex items-center gap-2 rounded bg-brand-fresh px-4 py-2 text-sm font-bold text-on-fresh">
                <Phone className="h-4 w-4" aria-hidden="true" /> {t("callRider")}
              </a>
            </div>
          )}
          <div className={`${card} p-5`}>
            <h2 className="mb-3 flex items-center gap-2 font-outfit text-base font-black text-foreground">
              <MapPin className="h-4 w-4 text-accent-text" aria-hidden="true" />
              {t("deliveryAddress")}
            </h2>
            <address className="space-y-0.5 text-sm not-italic leading-relaxed text-foreground/85">
              <p className="font-bold text-foreground">{addr.fullName}</p>
              <p>{addr.address}</p>
              {order.deliveryLandmark && <p className="text-muted-foreground">{tc("landmarkLine", { landmark: order.deliveryLandmark })}</p>}
              {(addr.city || addr.postalCode) && (
                <p>
                  {addr.city}
                  {addr.postalCode ? `, ${addr.postalCode}` : ""}
                </p>
              )}
              {order.deliveryPlaceName && <p className="text-muted-foreground">{order.deliveryPlaceName}</p>}
              {order.deliveryDistanceKm != null && <p className="text-xs text-muted-foreground">{tc("distanceLine", { km: formatNumber(order.deliveryDistanceKm, locale, 1) })}</p>}
              <p className="text-muted-foreground">{addr.phone}</p>
            </address>
            {order.deliverySlot && (
              <p className="mt-3 flex items-center gap-2 rounded border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground/85">
                <Clock className="h-3.5 w-3.5 shrink-0 text-accent-text" aria-hidden="true" />
                <span>{order.deliverySlot}</span>
              </p>
            )}
            {order.deliveryNote && (
              <p className="mt-3 flex items-start gap-2 rounded border border-border bg-background px-3 py-2 text-xs text-foreground/85">
                <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-text" aria-hidden="true" />
                <span>
                  {t.rich("yourNote", { note: order.deliveryNote, b: (c) => <b>{c}</b> })}
                </span>
              </p>
            )}
          </div>

          <div className={`${card} p-5`}>
            <h2 className="mb-3 font-outfit text-base font-black text-foreground">{t("payment")}</h2>
            <div className="flex items-center gap-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded ${cod ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-brand-fresh/15 text-accent-text"}`}>
                {cod ? <Banknote className="h-5 w-5" aria-hidden="true" /> : <Smartphone className="h-5 w-5" aria-hidden="true" />}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">{payText(order.paymentMethod)}</p>
                <p className={`text-xs font-semibold ${order.paymentStatus === "PAID" ? "text-emerald-700 dark:text-emerald-300" : order.paymentStatus === "FAILED" ? "text-red-700 dark:text-red-300" : "text-muted-foreground"}`}>
                  {order.paymentStatus === "PAID"
                    ? t("payVerified")
                    : order.paymentStatus === "FAILED"
                      ? t("payFailed")
                      : order.paymentStatus === "PENDING" && !cod
                        ? t("payWaiting")
                        : order.paymentStatus === "PENDING"
                          ? t("payOnDelivery")
                          : (order.paymentStatus ?? "").replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
                </p>
              </div>
            </div>
            {!cod && (order.bkashTransactionId || order.bkashSenderNumber) && (
              <dl className="mt-3 space-y-1.5 rounded border border-border bg-background p-3 text-xs">
                {order.bkashTransactionId && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{t("trxId")}</dt>
                    <dd className="font-mono font-bold text-foreground">{order.bkashTransactionId}</dd>
                  </div>
                )}
                {order.bkashSenderNumber && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{t("sentFrom")}</dt>
                    <dd className="font-semibold text-foreground">{order.bkashSenderNumber}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{t("amount")}</dt>
                  <dd className="font-bold text-foreground">{formatBDT(order.total)}</dd>
                </div>
              </dl>
            )}
            {order.paymentVerifiedAt && <p className="mt-2 text-[11px] text-muted-foreground">{t("checkedOn", { date: formatDateTime(order.paymentVerifiedAt) })}</p>}
          </div>

          {(order.courierName || order.trackingNumber) && (
            <div className={`${card} p-5`}>
              <h2 className="mb-3 flex items-center gap-2 font-outfit text-base font-black text-foreground">
                <Truck className="h-4 w-4 text-accent-text" aria-hidden="true" />
                {t("courier")}
              </h2>
              <p className="text-sm font-semibold text-foreground">{order.courierName ?? t("courierDefault")}</p>
              {order.trackingNumber && <p className="mt-0.5 font-mono text-xs text-muted-foreground">{t("tracking", { number: order.trackingNumber })}</p>}
              {order.trackingUrl && (
                <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-accent-text hover:underline">
                  {t("trackOnSite")} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              )}
            </div>
          )}

          <div className={`${card} p-5`}>
            <h2 className="mb-1 font-outfit text-base font-black text-foreground">{t("needHelp")}</h2>
            <p className="mb-4 text-sm text-muted-foreground">{t("needHelpText")}</p>
            <div className="flex flex-col gap-2">
              <Link href={`/account/support/new?order=${order.id}`} className={`${btnGhost} h-10 justify-start`}>
                <Headset className="h-4 w-4" aria-hidden="true" />
                {t("contactSupport")}
              </Link>
              {order.status === "Delivered" && (
                <Link href={`/account/returns/new?order=${order.id}`} className={`${btnGhost} h-10 justify-start`}>
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  {t("returnItem")}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <RequireLogin>
      <Detail />
    </RequireLogin>
  );
}

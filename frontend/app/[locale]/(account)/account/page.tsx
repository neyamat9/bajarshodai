"use client";

import { Link } from "@/i18n/navigation";
import RequireLogin from "@/components/account/RequireLogin";
import { btnOrange, card, formatBDT, formatDate, Skeleton, StepProgress } from "@/components/account/ui";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { useAuth } from "@/lib/hooks/use-auth";
import { useWishlist } from "@/lib/hooks/use-wishlist";
import { getOrders } from "@/lib/services/orders.service";
import type { Order } from "@/lib/types";
import { ArrowRight, Clock, Heart, MapPin, Package, RotateCcw, ShoppingBag, Truck, Wallet } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { isFinished, isOffTrack } from "@/lib/api/mappers";
import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";

function Thumbs({ order, max = 3 }: { order: Order; max?: number }) {
  const shown = order.items.slice(0, max);
  const more = order.items.length - shown.length;
  return (
    <div className="flex -space-x-2">
      {shown.map((it, i) => (
        <span key={`${it.productId}-${i}`} className="relative h-11 w-11 shrink-0 overflow-hidden rounded border-2 border-card bg-secondary">
          <Image src={it.imageUrl} alt="" fill sizes="44px" className="object-cover" />
        </span>
      ))}
      {more > 0 && <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded border-2 border-card bg-secondary text-xs font-black text-foreground">+{more}</span>}
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Package; label: string; value: React.ReactNode; tone: string }) {
  return (
    <div className={`${card} flex items-center gap-3.5 p-4`}>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded ${tone}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="truncate font-outfit text-2xl font-black leading-none text-foreground">{value}</p>
        <p className="mt-1 truncate text-xs font-medium text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function Overview() {
  const t = useTranslations("Account");
  const { user } = useAuth();
  const { vaultCount } = useWishlist();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    let alive = true;
    getOrders()
      .then((o) => alive && setOrders([...o].sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime())))
      .catch(() => alive && setOrders([]));
    return () => {
      alive = false;
    };
  }, []);

  const first = (user?.name ?? "").split(" ")[0] || t("friend");
  const active = orders?.filter((o) => !isFinished(o.status)) ?? [];
  const spent = orders?.filter((o) => !isOffTrack(o.status)).reduce((s, o) => s + o.total, 0) ?? 0;
  const tracking = active[0];

  return (
    <div className="space-y-6">
      {/* welcome */}
      <div className="relative overflow-hidden rounded bg-linear-to-br from-primary via-brand-deep-light to-brand-deep-light px-6 py-7 text-white sm:px-8 sm:py-9">
        <span className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rotate-12 bg-brand-fresh/25" aria-hidden="true" />
        <span className="pointer-events-none absolute right-28 top-12 hidden h-4 w-4 bg-brand-fresh sm:block" aria-hidden="true" />
        <span className="pointer-events-none absolute bottom-5 right-10 hidden h-6 w-6 rotate-12 bg-brand-fresh/40 sm:block" aria-hidden="true" />
        <p className="relative text-sm font-semibold text-white/75">{t("welcomeBack")}</p>
        <h1 className="relative mt-1 font-outfit text-3xl font-black tracking-tight sm:text-4xl">
          {t.rich("hi", { name: first, accent: (c) => <span className="text-brand-fresh">{c}</span> })}
        </h1>
        <p className="relative mt-2 max-w-md text-sm text-white/80">
          {orders === null
            ? t("loadingAccount")
            : active.length > 0
              ? t("ordersOnTheWay", { count: active.length })
              : t("allDelivered")}
        </p>
        <div className="relative mt-5 flex flex-wrap gap-3">
          <Link href="/products" className={btnOrange}>
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            {t("keepShopping")}
          </Link>
          <Link href="/orders" className="inline-flex h-11 items-center gap-2 rounded border border-white/30 px-5 text-sm font-bold text-white transition-colors hover:bg-white/10">
            {t("myOrders")}
          </Link>
        </div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {orders === null ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[4.6rem]" />)
        ) : (
          <>
            <Stat icon={Package} label={t("statOrders")} value={formatNumber(orders.length, undefined, 0)} tone="bg-primary/10 text-primary dark:text-brand-fresh" />
            <Stat icon={Truck} label={t("statProgress")} value={formatNumber(active.length, undefined, 0)} tone="bg-brand-fresh/15 text-accent-text" />
            <Stat icon={Heart} label={t("statWishlist")} value={formatNumber(vaultCount, undefined, 0)} tone="bg-rose-500/10 text-rose-600 dark:text-rose-300" />
            <Stat icon={Wallet} label={t("statSpent")} value={formatBDT(spent)} tone="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" />
          </>
        )}
      </div>

      {/* live order tracker */}
      {tracking && (
        <div className={`${card} p-5 sm:p-6`}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-bold text-accent-text">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {t("trackLatest")}
              </p>
              <p className="mt-1 font-mono text-sm font-bold text-foreground">{tracking.orderNumber}</p>
            </div>
            <div className="flex items-center gap-3">
              <Thumbs order={tracking} />
              <StatusBadge status={tracking.status} />
            </div>
          </div>
          <StepProgress order={tracking} />
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-sm">
            <span className="text-muted-foreground">
              {t.rich("estDelivery", { date: formatDate(tracking.estimatedDelivery), b: (c) => <b className="text-foreground">{c}</b> })}
            </span>
            <Link href={`/orders/${tracking.id}`} className="inline-flex items-center gap-1.5 font-bold text-accent-text hover:underline">
              {t("orderDetails")} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}

      {/* recent orders */}
      <div className={`${card} p-5 sm:p-6`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-outfit text-lg font-black text-foreground">{t("recentOrders")}</h2>
          <Link href="/orders" className="inline-flex items-center gap-1 text-sm font-bold text-accent-text hover:underline">
            {t("viewAll")} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        {orders === null ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-18" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Package className="h-10 w-10 text-muted-foreground/60" aria-hidden="true" />
            <p className="mt-3 text-sm text-muted-foreground">{t("noOrders")}</p>
            <Link href="/products" className="mt-4 text-sm font-bold text-accent-text hover:underline">
              {t("startShopping")}
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {orders.slice(0, 3).map((o) => (
              <li key={o.id}>
                <Link href={`/orders/${o.id}`} className="group flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                  <Thumbs order={o} max={2} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-sm font-bold text-foreground group-hover:text-accent-text">{o.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(o.placedAt)} · {t("itemsCount", { count: o.items.reduce((s, i) => s + i.quantity, 0) })}
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <StatusBadge status={o.status} />
                  </div>
                  <p className="text-sm font-black text-foreground">{formatBDT(o.total)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* shortcuts */}
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3 sm:gap-4">
        {[
          { href: "/account/settings#addresses", icon: MapPin, title: t("shortAddresses"), text: t("shortAddressesText") },
          { href: "/wishlist", icon: Heart, title: t("shortWishlist"), text: t("shortWishlistText") },
          { href: "/account/returns", icon: RotateCcw, title: t("shortReturns"), text: t("shortReturnsText") },
        ].map((s) => (
          <Link key={s.href} href={s.href} className={`${card} group p-4 transition-colors hover:border-brand-fresh`}>
            <span className="flex h-10 w-10 items-center justify-center rounded bg-primary/10 text-primary transition-colors group-hover:bg-brand-fresh group-hover:text-on-fresh dark:text-brand-fresh">
              <s.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-3 text-sm font-bold text-foreground">{s.title}</p>
            <p className="text-xs text-muted-foreground">{s.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <RequireLogin>
      <Overview />
    </RequireLogin>
  );
}

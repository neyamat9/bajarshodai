"use client";

import LocationPicker from "@/components/location/LocationPicker";
import { Link } from "@/i18n/navigation";
import { errorMessage } from "@/lib/api/client";
import { formatMoney, formatNumber } from "@/lib/format";
import type { Locale } from "@/lib/locale";
import { getLocationLink, submitLocationLink, type LocationLinkInfo } from "@/lib/services/delivery.service";
import type { DeliveryQuote, PickedLocation } from "@/lib/types";
import { CheckCircle2, Clock, Loader2, MapPinOff, Phone } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface Props {
  /** the link the shop sent: without one this is the public "check my delivery charge" page */
  token?: string;
}

/**
 * The page behind "share your location": a mobile-first screen with one big button.
 * Through a link from the shop (/l/<token>) the place is sent to the shop; without a link (/share-location)
 * it only shows the distance and the delivery charge.
 */
export default function ShareLocationPage({ token }: Props) {
  const t = useTranslations("ShareLocation");
  const tc = useTranslations("Checkout");
  const locale = useLocale() as Locale;
  const [info, setInfo] = useState<LocationLinkInfo | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "missing">(token ? "loading" : "ok");
  const [location, setLocation] = useState<PickedLocation | null>(null);
  const [quote, setQuote] = useState<DeliveryQuote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ placeName: string | null; quote: DeliveryQuote } | null>(null);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    getLocationLink(token)
      .then((i) => {
        if (!alive) return;
        setInfo(i);
        setState("ok");
      })
      .catch(() => alive && setState("missing"));
    return () => {
      alive = false;
    };
  }, [token]);

  async function send() {
    if (!token || !location || sending) return;
    setSending(true);
    setError(null);
    try {
      const r = await submitLocationLink(token, location);
      setDone({ placeName: (locale === "bn" ? r.placeNameBn : r.placeName) ?? location.placeName ?? null, quote: r.quote });
    } catch (e) {
      setError(errorMessage(e, t("failed")));
    } finally {
      setSending(false);
    }
  }

  const accent = (c: React.ReactNode) => <span className="text-accent-text">{c}</span>;
  const canSend = !!location && !!quote?.available && !quoting;

  const shell = (children: React.ReactNode) => (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-xl px-4 py-8 md:py-12">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-accent-text">{t("eyebrow")}</p>
        {children}
      </div>
    </div>
  );

  if (state === "loading") {
    return shell(
      <p className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> {t("loading")}
      </p>,
    );
  }
  if (state === "missing") {
    return shell(
      <div className="rounded border border-border bg-card p-8 text-center">
        <MapPinOff className="mx-auto h-10 w-10 text-muted-foreground/60" aria-hidden="true" />
        <h1 className="mt-3 font-outfit text-2xl font-black text-foreground">{t("notFound")}</h1>
        <Link href="/" className="mt-4 inline-block font-bold text-accent-text hover:underline">{t("shopOrder")}</Link>
      </div>,
    );
  }

  const status = done ? "SHARED" : info?.status;
  if (status === "EXPIRED") {
    return shell(
      <div className="rounded border border-amber-500/30 bg-amber-500/10 p-8 text-center">
        <Clock className="mx-auto h-10 w-10 text-amber-600" aria-hidden="true" />
        <h1 className="mt-3 font-outfit text-xl font-black text-foreground">{t("expired")}</h1>
        {info?.shop.hotline && (
          <a href={`tel:${info.shop.hotline.replace(/[^\d+]/g, "")}`} className="mt-4 inline-flex items-center gap-2 font-bold text-accent-text">
            <Phone className="h-4 w-4" aria-hidden="true" /> {t("callUs", { phone: info.shop.hotline })}
          </a>
        )}
      </div>,
    );
  }
  if (status === "SHARED") {
    const sh = info?.shared;
    const place = done ? done.placeName : sh ? (locale === "bn" ? sh.placeNameBn ?? sh.placeName : sh.placeName ?? sh.placeNameBn) : null;
    const km = done ? done.quote.distanceKm : info?.shared?.distanceKm ?? null;
    const fee = done ? done.quote.cost : info?.shared?.deliveryFee ?? null;
    return shell(
      <div className="rounded border border-emerald-500/30 bg-emerald-500/10 p-6 sm:p-8">
        <CheckCircle2 className="h-10 w-10 text-emerald-600" aria-hidden="true" />
        <h1 className="mt-3 font-outfit text-2xl font-black text-foreground">{done ? t("doneTitle") : t("used")}</h1>
        {done && <p className="mt-1 text-sm text-foreground/80">{t("doneText")}</p>}
        <dl className="mt-5 space-y-2 text-sm">
          {place && <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{t("place")}</dt><dd className="text-right font-semibold text-foreground">{place}</dd></div>}
          {km !== null && <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{t("distance")}</dt><dd className="font-semibold text-foreground">{tc("km", { km: formatNumber(km, locale, 1) })}</dd></div>}
          {fee !== null && <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{t("charge")}</dt><dd className="font-semibold text-foreground">{formatMoney(fee, locale)}</dd></div>}
        </dl>
      </div>,
    );
  }

  return shell(
    <>
      <h1 className="font-outfit text-3xl font-black tracking-tight text-foreground">{t.rich(token ? "title" : "checkTitle", { accent })}</h1>
      <p className="mt-2 mb-6 text-sm text-muted-foreground">{info?.name ? t("leadNamed", { name: info.name }) : t("lead")}</p>

      <LocationPicker value={location} onChange={setLocation} onQuote={(q, loading) => { setQuote(q); setQuoting(loading); }} />

      {token && (
        <div className="mt-5 space-y-2">
          {error && <p role="alert" className="rounded border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive">{error}</p>}
          <button
            type="button"
            onClick={() => void send()}
            disabled={!canSend || sending}
            className="flex w-full items-center justify-center gap-2 rounded bg-brand-fresh py-4 text-base font-black text-on-fresh shadow-[0_8px_24px_rgba(69,162,44,0.3)] transition-all hover:bg-brand-fresh/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
            {sending ? t("sending") : t("send")}
          </button>
        </div>
      )}

      {info?.shop.hotline && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {info.shop.name} ·{" "}
          <a href={`tel:${info.shop.hotline.replace(/[^\d+]/g, "")}`} className="font-bold text-accent-text">{info.shop.hotline}</a>
        </p>
      )}
    </>,
  );
}

"use client";

import MapView from "@/components/map/MapView";
import { DEFAULT_CENTER } from "@/components/map/types";
import { formatMoney, formatNumber } from "@/lib/format";
import { useGeolocation } from "@/lib/hooks/use-geolocation";
import type { Locale } from "@/lib/locale";
import { forgetSavedLocation, getDeliveryConfig, getPlaceName, getSavedLocation, quoteDelivery, searchPlaces, shareLocation, type FoundPlace } from "@/lib/services/delivery.service";
import { getSiteSettings, type DeliveryConfig, type MapsConfig } from "@/lib/services/site.service";
import type { DeliveryQuote, GeoPoint, PickedLocation } from "@/lib/types";
import { AlertTriangle, Crosshair, Loader2, MapPin, Navigation, Search, Store, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  value: PickedLocation | null;
  onChange: (loc: PickedLocation | null) => void;
  /** the order total so far: it decides whether delivery is free */
  subtotal?: number;
  /** the distance and charge for the chosen place (null while there is none) */
  onQuote?: (quote: DeliveryQuote | null, loading: boolean) => void;
  className?: string;
  addressText?: string;
}

const key5 = (p: GeoPoint) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`;

/**
 * Where should we deliver? One big "share my current location" button, a search box as a fallback, and a map with a pin the
 * customer can drag onto their door. Shows the place name and the delivery charge for the chosen point at once.
 * Nothing is tracked in the background: the phone is asked once, when the button is pressed.
 */
export default function LocationPicker({ value, onChange, subtotal = 0, onQuote, className = "", addressText }: Props) {
  const t = useTranslations("Location");
  const locale = useLocale() as Locale;
  const geo = useGeolocation();
  const [delivery, setDelivery] = useState<DeliveryConfig | null>(null);
  const [maps, setMaps] = useState<MapsConfig | null>(null);
  const [quote, setQuote] = useState<DeliveryQuote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [saved, setSaved] = useState<PickedLocation | null>(null);
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<FoundPlace[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [fitKey, setFitKey] = useState("start");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchSeq = useRef(0);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setFound(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // the rules of delivery (fresh: the shop can move its pin), the map to draw, and a place the customer shared before
  useEffect(() => {
    let alive = true;
    void getDeliveryConfig().then((d) => alive && setDelivery(d)).catch(() => undefined);
    void getSiteSettings().then((s) => alive && setMaps(s.maps));
    void getSavedLocation(subtotal, locale).then((r) => alive && setSaved(r.location)).catch(() => undefined);
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // the distance, the charge and the place name for the chosen point (a moment after the pin stops moving)
  const valueKey = value ? key5(value) : null;
  const needsName = Boolean(maps?.dynamicPlaceNames && value && !value.placeName);
  useEffect(() => {
    if (!value) {
      setQuote(null);
      setQuoting(false);
      onQuote?.(null, false);
      return;
    }
    let alive = true;
    setQuoting(true);
    onQuote?.(null, true);
    const timer = setTimeout(async () => {
      const [q, name] = await Promise.all([quoteDelivery(value, subtotal).catch(() => null), needsName ? getPlaceName(value, locale) : Promise.resolve(null)]);
      if (!alive) return;
      setQuote(q);
      setQuoting(false);
      onQuote?.(q, false);
      if (needsName && name) onChange({ ...value, placeName: name });
    }, 450);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
    // the point and the subtotal are what matter here, not the callbacks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueKey, needsName, subtotal]);

  const origin = delivery?.origin ? { lat: delivery.origin.lat, lng: delivery.origin.lng } : null;
  const shopName = delivery?.origin ? (locale === "bn" ? delivery.origin.labelBn : delivery.origin.label).split(",")[0] : "";

  const shareMyLocation = useCallback(async () => {
    const fix = await geo.locate();
    if (!fix) return;
    const picked: PickedLocation = { lat: fix.lat, lng: fix.lng, accuracyM: fix.accuracyM, source: "GPS" };
    onChange(picked);
    setFitKey(key5(picked));
    // the press is the consent: the place is saved for the next order
    void shareLocation(picked, subtotal, locale)
      .then((r) => {
        setSaved(r.location);
        if (maps?.dynamicPlaceNames && r.location.placeName) {
          onChange({ ...picked, placeName: r.location.placeName });
        }
      })
      .catch(() => undefined);
  }, [geo, onChange, subtotal, locale, maps?.dynamicPlaceNames]);

  function movePin(p: GeoPoint) {
    onChange({ lat: p.lat, lng: p.lng, accuracyM: null, source: "PIN", landmark: value?.landmark ?? null });
  }

  function onSearch(text: string) {
    setQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (text.trim().length < 2) {
      setFound(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const seq = ++searchSeq.current;
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await searchPlaces(text.trim(), locale);
        if (seq === searchSeq.current) setFound(res);
      } catch {
        if (seq === searchSeq.current) setFound([]);
      } finally {
        if (seq === searchSeq.current) setSearching(false);
      }
    }, 350);
  }

  function choose(p: FoundPlace) {
    setFound(null);
    setQuery("");
    const picked: PickedLocation = {
      lat: p.lat,
      lng: p.lng,
      accuracyM: null,
      source: "SEARCH",
      placeName: maps?.dynamicPlaceNames ? p.name.split(",").slice(0, 3).join(",").trim() : undefined,
    };
    onChange(picked);
    setFitKey(key5(picked));
  }

  function useSaved() {
    if (!saved) return;
    onChange(saved);
    setFitKey(key5(saved));
  }

  async function forget() {
    await forgetSavedLocation().catch(() => undefined);
    setSaved(null);
  }

  const money = (n: number) => formatMoney(n, locale);
  const km = (n: number) => formatNumber(n, locale, 1);
  const blocked = delivery && (!delivery.enabled || !delivery.originSet);

  return (
    <div className={`space-y-3 ${className}`}>
      {blocked && (
        <p role="alert" className="flex items-start gap-2 rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-800 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {delivery && !delivery.enabled ? t("disabled") : t("notSetUp")}
        </p>
      )}

      {/* 1. the big button */}
      <button
        type="button"
        onClick={() => void shareMyLocation()}
        disabled={geo.loading || !!blocked}
        className="flex w-full items-center justify-center gap-2.5 rounded bg-primary px-5 py-3.5 text-base font-bold text-primary-foreground shadow-[0_10px_24px_-12px_rgba(11,98,52,0.8)] transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
      >
        {geo.loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Crosshair className="h-5 w-5" aria-hidden="true" />}
        {geo.loading ? (geo.fix ? t("improving", { m: formatNumber(geo.fix.accuracyM, locale, 0) }) : t("finding")) : value?.source === "GPS" ? t("shareAgain") : t("share")}
      </button>
      {geo.error && (
        <p role="alert" className="flex items-start gap-2 rounded border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {t(`geoError.${geo.error}`)}
        </p>
      )}
      {!value && <p className="text-xs text-muted-foreground">{t("consent")}</p>}

      {/* a place shared before */}
      {saved && !value && (
        <div className="flex flex-wrap items-center gap-2 rounded border border-border bg-card px-3 py-2.5 text-sm">
          <Navigation className="h-4 w-4 shrink-0 text-accent-text" aria-hidden="true" />
          <button type="button" onClick={useSaved} className="min-w-0 flex-1 truncate text-left font-semibold text-foreground hover:text-accent-text">
            {t("useSaved")}
            {maps?.dynamicPlaceNames && saved.placeName ? <span className="font-normal text-muted-foreground"> · {saved.placeName}</span> : null}
          </button>
          <button type="button" onClick={() => void forget()} className="text-xs font-semibold text-muted-foreground hover:text-destructive">
            {t("forget")}
          </button>
        </div>
      )}

      {/* 2. search, when the button is not an option and enabled in settings */}
      {maps?.enableMapSearch !== false && (
        <div ref={searchContainerRef} className="relative z-50">
          <label htmlFor="place-search" className="sr-only">
            {t("searchAria")}
          </label>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            id="place-search"
            value={query}
            onChange={(e) => onSearch(e.target.value)}
            onFocus={() => {
              if (query.trim().length >= 2 && !found) {
                onSearch(query);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setFound(null);
              }
            }}
            placeholder={t("searchPh")}
            autoComplete="off"
            disabled={!!blocked}
            className="h-11 w-full rounded border-2 border-input bg-background pl-10 pr-12 text-sm outline-none transition-all placeholder:text-muted-foreground/80 focus:border-brand-fresh focus:ring-4 focus:ring-brand-fresh/20 disabled:opacity-60"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searching && <Loader2 className="h-4 w-4 animate-spin text-brand-fresh" aria-hidden="true" />}
            {query && !searching && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setFound(null);
                }}
                aria-label={t("clearSearch")}
                className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-secondary"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
          {found && (
            <ul
              className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-64 w-full overflow-auto rounded-lg border border-border bg-popover text-popover-foreground shadow-2xl ring-1 ring-black/10 dark:ring-white/10"
              role="listbox"
            >
              {found.length === 0 ? (
                <li className="px-4 py-3.5 text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground">{t("noResults")}</p>
                  <p className="mt-1 text-xs">
                    {locale === "bn"
                      ? "কাছের থানা বা বাজার (যেমন: শাহরাস্তি, মেহের, কালীবাড়ী) লিখে খুঁজুন অথবা নিচের ম্যাপে পিনটি টেনে আপনার ঠিকানায় বসান।"
                      : "Try searching for your Upazila or Market (e.g. Shahrasti, Meher, Kalibari), or drag the pin on the map to your address."}
                  </p>
                </li>
              ) : (
                found.map((p) => (
                  <li key={`${p.lat},${p.lng}`} role="option" aria-selected={false}>
                    <button
                      type="button"
                      onClick={() => choose(p)}
                      className="flex w-full items-start gap-2.5 px-4 py-3 text-left text-sm hover:bg-accent/80 transition-colors border-b last:border-b-0 border-border/50"
                    >
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-fresh" aria-hidden="true" />
                      <span className="font-medium leading-snug">{p.name}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      )}

      {/* 3. the map */}
      {maps && (
        <div className="relative z-0 isolate overflow-hidden rounded border border-border">
          <MapView
            config={maps}
            center={origin ?? DEFAULT_CENTER}
            zoom={value ? 17 : 14}
            marker={value}
            draggable={!blocked}
            onMarkerChange={movePin}
            accuracyM={value?.accuracyM}
            origin={origin}
            originLabel={shopName}
            radiusKm={delivery?.serviceRadiusKm}
            fitKey={fitKey}
            className="h-72 w-full md:h-80"
            ariaLabel={t("mapLabel")}
          />
        </div>
      )}
      <p className="text-xs text-muted-foreground">{value ? t("dragHint") : t("tapHint")}</p>

      {/* 4. what we found */}
      {value && (
        <div className="space-y-2.5 rounded border border-border bg-card p-4">
          <p className="flex items-start gap-2 text-sm font-bold text-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent-text" aria-hidden="true" />
            <span>
              {addressText
                ? addressText
                : maps?.dynamicPlaceNames && value.placeName
                  ? value.placeName
                  : locale === "bn"
                    ? "ম্যাপে পিন চিহ্নিত করা হয়েছে"
                    : "Pin placed on map"}
            </span>
          </p>

          {quoting && !quote ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t("calculating")}
            </p>
          ) : quote?.available ? (
            <div className="space-y-1 text-sm">
              <p className="flex items-center gap-2 text-muted-foreground">
                <Store className="h-4 w-4 shrink-0" aria-hidden="true" />
                {t("distance", { km: km(quote.distanceKm ?? 0), shop: shopName })}
                {quote.estimated && <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">{t("estimatedTag")}</span>}
              </p>
              <p className="flex items-baseline justify-between gap-3 border-t border-dashed border-border pt-2">
                <span className="font-semibold text-foreground">{t("deliveryCharge")}</span>
                <span className="font-outfit text-xl font-extrabold text-primary dark:text-accent-text">{quote.isFree ? t("free") : money(quote.cost)}</span>
              </p>
              {quote.isFree && quote.calculatedFee !== null && quote.calculatedFee > 0 && <p className="text-xs text-emerald-700 dark:text-emerald-400">{t("freeBecause")}</p>}
              {!quote.isFree && quote.amountForFreeDelivery ? <p className="text-xs text-accent-text">{t("addForFree", { amount: money(quote.amountForFreeDelivery) })}</p> : null}
              {quote.estimated && <p className="text-xs text-muted-foreground">{t("estimatedNote")}</p>}
            </div>
          ) : quote?.block === "OUT_OF_AREA" ? (
            <p role="alert" className="flex items-start gap-2 text-sm font-semibold text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {t("outOfArea", { km: km(quote.straightKm ?? 0), radius: formatNumber(quote.radiusKm, locale, 0), shop: shopName })}
            </p>
          ) : null}

          <button type="button" onClick={() => onChange(null)} className="text-xs font-bold text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
            {t("chooseAnother")}
          </button>
        </div>
      )}
    </div>
  );
}

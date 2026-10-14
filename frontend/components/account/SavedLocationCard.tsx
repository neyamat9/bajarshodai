"use client";

import { btnPrimary, card } from "@/components/account/ui";
import { Link } from "@/i18n/navigation";
import { errorMessage } from "@/lib/api/client";
import { formatMoney, formatNumber } from "@/lib/format";
import type { Locale } from "@/lib/locale";
import { forgetSavedLocation, getSavedLocation } from "@/lib/services/delivery.service";
import type { DeliveryQuote, PickedLocation } from "@/lib/types";
import { MapPin, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

/** The place the customer last shared. It can be seen and deleted here: it is never tracked in the background. */
export default function SavedLocationCard() {
  const t = useTranslations("Account2");
  const locale = useLocale() as Locale;
  const [loaded, setLoaded] = useState(false);
  const [place, setPlace] = useState<PickedLocation | null>(null);
  const [quote, setQuote] = useState<DeliveryQuote | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    getSavedLocation(0, locale)
      .then((r) => {
        if (!alive) return;
        setPlace(r.location);
        setQuote(r.quote);
      })
      .catch(() => undefined)
      .finally(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, [locale]);

  async function forget() {
    setBusy(true);
    try {
      await forgetSavedLocation();
      setPlace(null);
      setQuote(null);
      toast.success(t("forgotten"));
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`${card} p-5 sm:p-6`}>
      <h2 className="font-outfit text-lg font-black text-foreground">{t("savedTitle")}</h2>
      <p className="mb-4 text-sm text-muted-foreground">{t("savedText")}</p>
      {!loaded ? (
        <div className="h-16 animate-pulse rounded bg-secondary" aria-busy="true" />
      ) : place ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded border border-border bg-background p-3.5">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-accent-text" aria-hidden="true" />
            <div className="min-w-0 text-sm">
              <p className="font-semibold text-foreground">{place.placeName ?? `${place.lat.toFixed(4)}, ${place.lng.toFixed(4)}`}</p>
              {quote?.available && quote.distanceKm !== null && (
                <p className="text-muted-foreground">
                  {formatNumber(quote.distanceKm, locale, 1)} km · {formatMoney(quote.cost, locale)}
                </p>
              )}
            </div>
          </div>
          <button type="button" onClick={() => void forget()} disabled={busy} className="inline-flex items-center gap-2 rounded border border-destructive/40 px-4 py-2.5 text-sm font-bold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60">
            <Trash2 className="h-4 w-4" aria-hidden="true" /> {t("forget")}
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted-foreground">{t("none")}</p>
          <Link href="/share-location" className={`${btnPrimary} px-4 py-2.5 text-sm`}>{t("shareNow")}</Link>
        </div>
      )}
    </section>
  );
}

import { lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/Field";
import { api } from "@/api/client";
import { settingsApi } from "@/api/system";
import { dateTime, money } from "@/lib/format";
import type { ShippingQuote } from "@/api/orders";
import { tr } from "@/i18n";

const AdminMap = lazy(() => import("@/components/map/AdminMap"));

interface Last { id: string; lat: number; lng: number; accuracyM: number | null; placeName: string | null; source: string; capturedAt: string; quote: ShippingQuote }

/** The last place this customer chose to share (never tracked in the background), with the distance and charge for it. */
export function LastLocationCard({ userId }: { userId: string }) {
  const q = useQuery({ queryKey: ["customer", userId, "last-location"], queryFn: () => api.get<Last | null>(`/admin/location-requests/customer/${userId}`).then((r) => r.data) });
  const settings = useQuery({ queryKey: ["settings"], queryFn: settingsApi.get, staleTime: 5 * 60_000 });
  const l = q.data;
  const d = settings.data?.delivery;
  const origin = d && d.originLat !== null && d.originLng !== null ? { lat: d.originLat, lng: d.originLng } : null;
  return (
    <Section title={tr("Last shared location")}>
      {q.isLoading ? (
        <div className="h-24 animate-pulse rounded bg-muted" />
      ) : !l ? (
        <p className="text-[13px] text-muted-foreground">{tr("Not shared yet. Ask for it from an order page (“Request location”).")}</p>
      ) : (
        <div className="space-y-2">
          <div className="overflow-hidden rounded-md border border-border">
            <Suspense fallback={<div className="h-40 animate-pulse bg-muted" />}>
              <AdminMap className="h-40 w-full" tileUrl={settings.data?.maps.osmTileUrl ?? "https://tile.openstreetmap.org/{z}/{x}/{y}.png"} center={l} marker={l} origin={origin} accuracyM={l.accuracyM} fitKey={l.id} ariaLabel="Last shared location" />
            </Suspense>
          </div>
          <p className="text-[13px] font-medium">{l.placeName ?? `${l.lat.toFixed(5)}, ${l.lng.toFixed(5)}`}</p>
          <p className="text-xs text-muted-foreground">
            {l.quote.distanceKm !== null ? `${l.quote.distanceKm} km` : ""}{l.quote.available ? ` · delivery ${money(l.quote.cost)}` : l.quote.block === "OUT_OF_AREA" ? " · outside the delivery area" : ""} · {dateTime(l.capturedAt)}
          </p>
          <Button size="xs" variant="outline" asChild><a href={`https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lng}`} target="_blank" rel="noopener noreferrer"><Navigation />{" "}{tr("Navigate")}</a></Button>
        </div>
      )}
    </Section>
  );
}

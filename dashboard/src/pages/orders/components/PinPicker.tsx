import { lazy, Suspense, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Copy, Link2, MapPin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/api/client";
import { ordersApi } from "@/api/orders";
import { settingsApi } from "@/api/system";
import { DEFAULT_CENTER, type GeoPoint } from "@/components/map/types";
import { tr } from "@/i18n";

const AdminMap = lazy(() => import("@/components/map/AdminMap"));

const waNumber = (p: string) => {
  const d = p.replace(/[^\d]/g, "");
  return d.startsWith("88") ? d : `88${d.replace(/^0*/, "0")}`;
};

/**
 * The delivery pin of a phone order: click the map, or send the customer a link and take the place they share.
 * Reads the place name for the pin so the rider sees words as well as a dot.
 */
export function PinPicker({ value, onChange, placeName, onPlaceName, phone, name }: {
  value: GeoPoint | null;
  onChange: (p: GeoPoint | null) => void;
  placeName: string;
  onPlaceName: (n: string) => void;
  phone: string;
  name: string;
}) {
  const settings = useQuery({ queryKey: ["settings"], queryFn: settingsApi.get, staleTime: 5 * 60_000 });
  const d = settings.data?.delivery;
  const origin = d && d.originLat !== null && d.originLng !== null ? { lat: d.originLat, lng: d.originLng } : null;
  const [satellite, setSatellite] = useState(false);
  const [link, setLink] = useState<{ id: string; url: string } | null>(null);
  const [making, setMaking] = useState(false);

  // a readable name for the pin
  useEffect(() => {
    if (!value) return;
    let alive = true;
    const t = setTimeout(() => {
      api
        .get<{ name: string | null }>("/customer/shipping/place", { params: { lat: value.lat, lng: value.lng, lang: "en" } })
        .then((r) => alive && r.data.name && onPlaceName(r.data.name))
        .catch(() => undefined);
    }, 500);
    return () => {
      alive = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.lat, value?.lng]);

  // wait for the customer to share through the link
  const phoneOk = /^(\+?88)?01[3-9]\d{8}$/.test(phone.replace(/[\s-]/g, ""));
  const shared = useQuery({
    queryKey: ["pin-link", link?.id],
    queryFn: async () => (await api.get<{ status: string; lat: number | null; lng: number | null; placeName: string | null }>(`/admin/location-requests/${link!.id}`)).data,
    enabled: !!link,
    refetchInterval: (q) => (q.state.data?.status === "SHARED" ? false : 4000),
  });
  const got = shared.data?.status === "SHARED" && shared.data.lat !== null ? shared.data : null;
  useEffect(() => {
    if (got && got.lat !== null && got.lng !== null) {
      onChange({ lat: got.lat, lng: got.lng });
      if (got.placeName) onPlaceName(got.placeName);
      toast.success(tr("The customer shared their location"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [got?.lat, got?.lng]);

  const makeLink = async () => {
    setMaking(true);
    try {
      const r = await ordersApi.requestLocation({ phone: phoneOk ? phone.replace(/[\s-]/g, "") : undefined, name: name.trim() || undefined });
      setLink({ id: r.id, url: r.url });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tr("Could not make the link"));
    } finally {
      setMaking(false);
    }
  };
  const text = link ? `আসসালামু আলাইকুম${name.trim() ? `, ${name.trim()}` : ""}। আপনার ডেলিভারির জায়গাটি এই লিংকে একটি বাটন চেপে পাঠিয়ে দিন: ${link.url}` : "";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><MapPin className="size-3.5" /> Delivery pin {value ? <Check className="size-3.5 text-success" /> : null}</span>
        <button type="button" onClick={() => setSatellite((s) => !s)} className="cursor-pointer text-[11px] font-medium text-primary hover:underline dark:text-fresh-400">{satellite ? tr("Street map") : tr("Satellite")}</button>
      </div>
      <div className="overflow-hidden rounded-md border border-border">
        <Suspense fallback={<div className="h-52 animate-pulse bg-muted" />}>
          <AdminMap
            className="h-52 w-full"
            tileUrl={settings.data?.maps.osmTileUrl ?? "https://tile.openstreetmap.org/{z}/{x}/{y}.png"}
            center={value ?? origin ?? DEFAULT_CENTER}
            zoom={value ? 15 : 13}
            marker={value}
            origin={origin}
            originLabel="Kalibari Bazar"
            radiusKm={d?.serviceRadiusKm ?? null}
            draggable
            onMarkerChange={(p) => onChange(p)}
            satellite={satellite}
            fitKey={value ? `${value.lat.toFixed(4)}-${value.lng.toFixed(4)}` : "none"}
            ariaLabel="Click the map to place the delivery pin"
          />
        </Suspense>
      </div>
      <p className="text-[11px] text-muted-foreground">{value ? placeName || "Drag the pin to adjust it." : tr("Click the map where the customer lives, or send them a link.")}</p>
      <Input value={placeName} onChange={(e) => onPlaceName(e.target.value)} placeholder={tr("Place name (filled in from the map)")} aria-label={tr("Place name")} className="h-8 text-[13px]" />

      <div className="rounded border border-dashed border-border p-2">
        {!link ? (
          <Button type="button" size="xs" variant="outline" loading={making} onClick={() => void makeLink()}><Link2 />{" "}{tr("Ask the customer to share their location")}</Button>
        ) : (
          <div className="space-y-1.5">
            <p className="text-[11px] text-muted-foreground">{got ? tr("Shared. The pin was set from it.") : tr("Waiting for the customer to open the link…")}</p>
            <div className="flex flex-wrap gap-1.5">
              <Button type="button" size="xs" variant="outline" onClick={() => navigator.clipboard.writeText(text).then(() => toast.success(tr("Message copied")), () => toast.error(tr("Copy failed")))}><Copy />{" "}{tr("Copy message")}</Button>
              {phoneOk && <Button type="button" size="xs" variant="outline" asChild><a href={`https://wa.me/${waNumber(phone)}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer"><MessageCircle />{" "}{tr("WhatsApp")}</a></Button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Copy, Link2, Loader2, MapPin, MessageCircle, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/api/client";
import { ordersApi } from "@/api/orders";
import { settingsApi } from "@/api/system";
import { DEFAULT_CENTER, type GeoPoint } from "@/components/map/types";
import { searchLocalShahrastiPlaces } from "@/components/map/shahrastiPlaces";
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
  const googleKey = settings.data?.maps.googleBrowserKey;
  const origin = d && d.originLat !== null && d.originLng !== null ? { lat: d.originLat, lng: d.originLng } : null;
  const [provider, setProvider] = useState<"google" | "osm">("google");
  const [satellite, setSatellite] = useState(false);
  const [link, setLink] = useState<{ id: string; url: string } | null>(null);
  const [making, setMaking] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ name: string; lat: number; lng: number }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Debounced search for places / villages
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    let alive = true;
    const timer = setTimeout(async () => {
      setSearching(true);
      setShowDropdown(true);

      const combined: { name: string; lat: number; lng: number }[] = [];
      const seen = new Set<string>();

      // 1. Check local curated Shahrasti places first (instant & free)
      const localMatches = searchLocalShahrastiPlaces(q);
      for (const item of localMatches) {
        seen.add(item.name.toLowerCase());
        combined.push(item);
      }

      // 2. Client-side Google Geocoder if available in browser
      if (typeof window !== "undefined" && (window as unknown as { google?: { maps?: { Geocoder?: new () => any } } }).google?.maps?.Geocoder) {
        try {
          const GeocoderClass = (window as unknown as { google: { maps: { Geocoder: new () => any } } }).google.maps.Geocoder;
          const geocoder = new GeocoderClass();
          const gQuery = q.toLowerCase().includes("shahrasti") || q.includes("শাহরাস্তি") ? q : `${q}, Shahrasti, Chandpur`;
          
          await new Promise<void>((resolve) => {
            geocoder.geocode(
              {
                address: gQuery,
                componentRestrictions: { country: "BD" },
              },
              (results: any[], status: string) => {
                if (status === "OK" && results?.length) {
                  for (const r of results.slice(0, 4)) {
                    const addr = r.formatted_address;
                    if (!seen.has(addr.toLowerCase())) {
                      seen.add(addr.toLowerCase());
                      combined.push({
                        name: addr,
                        lat: r.geometry.location.lat(),
                        lng: r.geometry.location.lng(),
                      });
                    }
                  }
                }
                resolve();
              }
            );
          });
        } catch {
          /* ignore geocoder errors */
        }
      }

      // 3. Fallback / supplementary backend search
      if (combined.length < 3) {
        try {
          const res = await api.get<{ results: { name: string; lat: number; lng: number }[] }>("/customer/shipping/search", {
            params: { q, lang: "bn", near: origin ? `${origin.lat},${origin.lng}` : undefined },
          });
          for (const item of res.data?.results ?? []) {
            if (!seen.has(item.name.toLowerCase())) {
              seen.add(item.name.toLowerCase());
              combined.push(item);
            }
          }
        } catch {
          /* ignore backend search errors */
        }
      }

      if (alive) {
        setSearchResults(combined);
        setSearching(false);
      }
    }, 280);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <MapPin className="size-3.5" /> Delivery pin {value ? <Check className="size-3.5 text-success" /> : null}
        </span>
        <div className="flex items-center gap-2">
          {googleKey && (
            <div className="flex items-center rounded border border-border bg-secondary/40 p-0.5 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setProvider("google")}
                className={`cursor-pointer rounded px-1.5 py-0.5 transition-colors ${
                  provider === "google"
                    ? "bg-card text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Google Map
              </button>
              <button
                type="button"
                onClick={() => setProvider("osm")}
                className={`cursor-pointer rounded px-1.5 py-0.5 transition-colors ${
                  provider === "osm"
                    ? "bg-card text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                OSM
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setSatellite((s) => !s)}
            className="cursor-pointer text-[11px] font-medium text-primary hover:underline dark:text-fresh-400"
          >
            {satellite ? tr("Street map") : tr("Satellite")}
          </button>
        </div>
      </div>

      {/* Quick Search Bar */}
      <div ref={searchBoxRef} className="relative">
        <div className="relative flex items-center">
          {searching ? (
            <Loader2 className="absolute left-2.5 size-3.5 text-muted-foreground animate-spin pointer-events-none" />
          ) : (
            <Search className="absolute left-2.5 size-3.5 text-muted-foreground pointer-events-none" />
          )}
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchQuery.trim().length >= 2) setShowDropdown(true);
            }}
            placeholder={tr("Search village / area / road in Shahrasti...")}
            className="h-7.5 pl-8 pr-7 text-xs bg-card"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
                setShowDropdown(false);
              }}
              className="absolute right-2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {showDropdown && searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-48 overflow-y-auto rounded-md border border-border bg-popover shadow-md py-1">
            {searchResults.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onChange({ lat: item.lat, lng: item.lng });
                  onPlaceName(item.name);
                  setShowDropdown(false);
                  setSearchQuery("");
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-foreground hover:bg-muted"
              >
                <MapPin className="size-3 text-primary shrink-0" />
                <span className="truncate">{item.name}</span>
              </button>
            ))}
          </div>
        )}

        {showDropdown && searchQuery.trim().length >= 2 && !searching && searchResults.length === 0 && (
          <div className="absolute left-0 right-0 top-full z-30 mt-1 rounded-md border border-border bg-popover shadow-md py-2.5 px-3 text-center text-xs text-muted-foreground">
            {tr("No match found in Shahrasti. Click on the map directly to drop pin.")}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-md border border-border">
        <Suspense fallback={<div className="h-56 animate-pulse bg-muted" />}>
          <AdminMap
            className="h-56 w-full"
            googleBrowserKey={googleKey}
            provider={provider}
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

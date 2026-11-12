import { lazy, Suspense, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Clock, Copy, Crosshair, Globe, MapPin, MessageCircle, Navigation, Pencil, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea } from "@/components/ui/input";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, KeyValue, Section } from "@/components/shared/Field";
import { ordersApi, type OrderDetail } from "@/api/orders";
import { settingsApi } from "@/api/system";
import { errorMessage } from "@/api/client";
import { useAct } from "@/hooks/useAct";
import { money } from "@/lib/format";
import { DEFAULT_CENTER } from "@/components/map/types";
import { tr } from "@/i18n";

const AdminMap = lazy(() => import("@/components/map/AdminMap"));

const minutes = (s: number) => (s < 90 ? tr("about 1 min") : tr("about {{n}} min", { n: Math.round(s / 60) }));
const digits = (p: string) => p.replace(/[^\d]/g, "");
/** "01712345678" → "8801712345678" for wa.me links */
const waNumber = (p: string) => (digits(p).startsWith("88") ? digits(p) : `88${digits(p).replace(/^0*/, "0")}`);

function OverrideFeeDialog({ order, onClose }: { order: OrderDetail; onClose: () => void }) {
  const [fee, setFee] = useState(order.deliveryFeeOverride ?? order.shippingCost);
  const [reason, setReason] = useState(order.deliveryFeeOverrideReason ?? "");
  const [err, setErr] = useState<string | null>(null);
  const save = useAct((body: { fee: number | null; reason?: string }) => ordersApi.overrideFee(order.id, body), {
    success: tr("Delivery charge updated"),
    invalidate: [["order", order.id], ["orders"]],
    onSuccess: onClose,
  });
  const submit = () => {
    const n = Number(fee);
    if (fee === "" || !Number.isFinite(n) || n < 0) return setErr(tr("Enter the delivery charge in taka"));
    if (!reason.trim()) return setErr(tr("Say why: it goes in the activity log"));
    setErr(null);
    save.mutate({ fee: n, reason: reason.trim() });
  };
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{tr("Change the delivery charge")}</DialogTitle>
          <DialogDescription>{order.deliveryFee ? `${tr("The distance gives {{fee}}.", { fee: money(order.deliveryFee) })} ` : ""}{tr("The order total is updated at once.")}</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-3">
          {err && <p className="rounded bg-red-50 px-3 py-2 text-xs font-medium text-destructive dark:bg-red-500/10">{err}</p>}
          <Field label={tr("Delivery charge ৳")} required><Input type="number" min={0} value={fee} onChange={(e) => setFee(e.target.value)} autoFocus /></Field>
          <Field label={tr("Reason")} required><Textarea rows={2} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={tr("e.g. regular customer, road is closed, agreed on phone")} /></Field>
        </DialogBody>
        <DialogFooter>
          {order.deliveryFeeOverride !== null && (
            <Button variant="outline" className="mr-auto" loading={save.isPending} onClick={() => save.mutate({ fee: null })}>{tr("Back to the distance charge")}</Button>
          )}
          <Button variant="outline" onClick={onClose}>{tr("Cancel")}</Button>
          <Button loading={save.isPending} onClick={submit}>{tr("Save charge")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RequestLocationDialog({ order, phone, name, onClose }: { order: OrderDetail; phone: string | null; name: string | null; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const make = useAct(() => ordersApi.requestLocation({ phone: phone ?? undefined, name: name ?? undefined, orderId: order.id }).then((r) => setUrl(r.url)), { invalidate: [["order-locations", order.id]] });
  const text = url ? `আসসালামু আলাইকুম${name ? `, ${name}` : ""}। আপনার ডেলিভারির জায়গাটি এই লিংকে একটি বাটন চেপে পাঠিয়ে দিন: ${url}` : "";
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{tr("Ask the customer for their location")}</DialogTitle>
          <DialogDescription>{tr("Send them a link. They press one button and the place reaches this order page. The link works for 24 hours, once.")}</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-3">
          {!url ? (
            <Button loading={make.isPending} onClick={() => make.mutate()}><Send />{" "}{tr("Make the link")}</Button>
          ) : (
            <>
              <Field label={tr("Link")}><Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} /></Field>
              <Field label={tr("Message (Bangla)")}><Textarea readOnly rows={3} value={text} /></Field>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => navigator.clipboard.writeText(text).then(() => toast.success(tr("Message copied")), () => toast.error(tr("Copy failed: select the text and copy it")))}><Copy />{" "}{tr("Copy message")}</Button>
                {phone && <Button variant="outline" asChild><a href={`https://wa.me/${waNumber(phone)}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer"><MessageCircle />{" "}{tr("Send on WhatsApp")}</a></Button>}
              </div>
            </>
          )}
        </DialogBody>
        <DialogFooter><Button variant="outline" onClick={onClose}>{tr("Close")}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SetDeliveryTimeDialog({ order, onClose }: { order: OrderDetail; onClose: () => void }) {
  const initialDate = order.estimatedDelivery ? new Date(order.estimatedDelivery) : new Date(Date.now() + 90 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const defaultDateStr = `${initialDate.getFullYear()}-${pad(initialDate.getMonth() + 1)}-${pad(initialDate.getDate())}`;
  const defaultTimeStr = `${pad(initialDate.getHours())}:${pad(initialDate.getMinutes())}`;

  const [date, setDate] = useState(defaultDateStr);
  const [time, setTime] = useState(defaultTimeStr);
  const [slot, setSlot] = useState(order.deliverySlot ?? "");
  const [notify, setNotify] = useState(false);

  const save = useAct(
    (body: { estimatedDelivery?: string | null; deliverySlot?: string | null; notifyCustomer?: boolean }) =>
      ordersApi.updateDeliveryTime(order.id, body),
    {
      success: tr("Delivery time updated"),
      invalidate: [["order", order.id], ["orders"]],
      onSuccess: onClose,
    }
  );

  const applyPreset = (minutesFromNow: number, slotText: string) => {
    const target = new Date(Date.now() + minutesFromNow * 60 * 1000);
    setDate(`${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}`);
    setTime(`${pad(target.getHours())}:${pad(target.getMinutes())}`);
    setSlot(slotText);
  };

  const submit = () => {
    let iso: string | null = null;
    if (date && time) {
      iso = new Date(`${date}T${time}`).toISOString();
    }
    save.mutate({
      estimatedDelivery: iso,
      deliverySlot: slot.trim() || null,
      notifyCustomer: notify,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{tr("Set delivery date & time")}</DialogTitle>
          <DialogDescription>{tr("Specify when the customer can expect their delivery.")}</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            <Button size="xs" variant="outline" type="button" onClick={() => applyPreset(60, "Within 1 hour")}>
              {tr("Within 1 hr")}
            </Button>
            <Button size="xs" variant="outline" type="button" onClick={() => applyPreset(90, "Within 1-2 hours")}>
              {tr("Within 1-2 hrs")}
            </Button>
            <Button size="xs" variant="outline" type="button" onClick={() => applyPreset(120, "Within 2 hours")}>
              {tr("Within 2 hrs")}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label={tr("Delivery date")} required>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label={tr("Delivery hour / time")} required>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </Field>
          </div>
          <Field label={tr("Delivery slot or window (optional)")} hint={tr("e.g. 04:00 PM - 06:00 PM or বিকাল ৩:০০ - ৫:০০")}>
            <Input value={slot} onChange={(e) => setSlot(e.target.value)} placeholder="e.g. 04:00 PM - 06:00 PM" />
          </Field>
          <label className="flex cursor-pointer items-center gap-2 pt-1 text-xs">
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="rounded" />
            <span>{tr("Send notification to customer")}</span>
          </label>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{tr("Cancel")}</Button>
          <Button loading={save.isPending} onClick={submit}>{tr("Save delivery time")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Where the order goes: a map with the shop, the delivery pin and the road between them,
 * the distance, the delivery charge (with the by-hand override), and one-tap navigation / call / WhatsApp.
 */
export function DeliveryCard({ order, locked, phone, name, onEditAddress }: { order: OrderDetail; locked: boolean; phone: string | null; name: string | null; onEditAddress: () => void }) {
  const [dlg, setDlg] = useState<null | "fee" | "request" | "deliveryTime">(null);
  const [moving, setMoving] = useState(false);
  const [draft, setDraft] = useState<{ lat: number; lng: number } | null>(null);

  const a = order.shippingAddress;
  const lat = order.deliveryLat ?? a?.latitude ?? null;
  const lng = order.deliveryLng ?? a?.longitude ?? null;
  const pin = useMemo(() => (lat !== null && lng !== null ? { lat, lng } : null), [lat, lng]);

  const settings = useQuery({ queryKey: ["settings"], queryFn: settingsApi.get });
  const route = useQuery({ queryKey: ["order-route", order.id, lat, lng], queryFn: () => ordersApi.route(order.id), enabled: !!pin, staleTime: 5 * 60_000 });
  const shared = useQuery({ queryKey: ["order-locations", order.id], queryFn: () => ordersApi.locationRequests(order.id), refetchInterval: 30_000 });

  const sharedPlace = useMemo(() => {
    const r = shared.data?.find((x) => x.status === "SHARED" && x.lat !== null && x.lng !== null);
    if (!r) return null;
    // only worth offering when it is not the pin the order already has
    const same = pin && Math.abs(pin.lat - r.lat!) < 0.00005 && Math.abs(pin.lng - r.lng!) < 0.00005;
    return same ? null : r;
  }, [shared.data, pin]);

  const setPin = useAct((p: { latitude: number; longitude: number; placeName?: string }) => ordersApi.setPin(order.id, { ...p, recalculateShipping: true }), {
    success: tr("Delivery pin saved, distance and charge updated"),
    invalidate: [["order", order.id], ["orders"], ["order-route", order.id]],
    onSuccess: () => {
      setMoving(false);
      setDraft(null);
    },
  });

  const km = order.deliveryDistanceKm !== null ? Number(order.deliveryDistanceKm) : null;
  const overridden = order.deliveryFeeOverride !== null;
  const origin = route.data?.available ? route.data.origin ?? null : settings.data?.delivery.originLat != null ? { lat: settings.data.delivery.originLat, lng: settings.data.delivery.originLng! } : null;
  const shown = draft ?? pin;
  const phoneDigits = phone ? digits(phone) : "";

  return (
    <Section
      title={tr("Delivery")}
      actions={
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-muted-foreground" />
          {!locked && <Button variant="ghost" size="icon-xs" aria-label={tr("Edit address")} onClick={onEditAddress}><Pencil /></Button>}
        </div>
      }
    >
      {order.deliveryFeePending && (
        <div className="mb-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-amber-800 dark:text-amber-200">
              ⚠️ {tr("Pending Delivery Fee (Manual Confirmation Required)")}
            </span>
            {!locked && (
              <Button size="xs" variant="default" className="bg-amber-600 hover:bg-amber-700 text-white font-bold" onClick={() => setDlg("fee")}>
                {tr("Set Delivery Fee")}
              </Button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {tr("This order was placed without a map pin. Once you set the fee, customer will be notified via app, browser push & email.")}
          </p>
        </div>
      )}

      {order.isAbroadOrder && (
        <div className="mb-3 rounded-md border border-sky-500/30 bg-sky-500/10 p-2.5 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sky-800 dark:text-sky-200 flex items-center gap-1.5">
              <Globe className="size-3.5" />
              <span>{tr("Overseas Buyer (প্রবাসী)")}</span>
            </span>
            {order.senderCountry && (
              <Badge variant="outline" className="font-bold border-sky-500/40 text-sky-800 dark:text-sky-200">
                {order.senderCountry}
              </Badge>
            )}
          </div>
          {order.senderContactNumber && (
            <div className="flex items-center justify-between pt-1 border-t border-sky-500/20">
              <span className="text-muted-foreground">
                {order.senderContactMethod || "WhatsApp"}: <b className="text-foreground font-mono">{order.senderContactNumber}</b>
              </span>
              <a
                href={`https://wa.me/${digits(order.senderContactNumber)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition-colors"
              >
                <MessageCircle className="size-3" />
                {tr("WhatsApp")}
              </a>
            </div>
          )}
        </div>
      )}

      {order.locationToken && (
        <div className="mb-3 rounded border border-border bg-muted/40 p-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-muted-foreground">{tr("Family Location Share Link:")}</span>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => {
                const url = `https://bazarshodai.com/l/${order.locationToken}`;
                navigator.clipboard.writeText(url);
                toast.success(tr("Link copied to clipboard"));
              }}
            >
              <Copy className="size-3 mr-1" />
              {tr("Copy Link")}
            </Button>
          </div>
          <p className="font-mono text-[11px] text-foreground truncate mt-0.5 select-all">
            https://bazarshodai.com/l/{order.locationToken}
          </p>
        </div>
      )}
      {a ? (
        <address className="mb-3 text-[13px] not-italic leading-relaxed">
          <p className="font-semibold">{a.fullName}</p>
          <p>{a.phone}</p>
          <p>{a.line1}</p>
          {(order.deliveryLandmark ?? a.landmark) && <p className="text-muted-foreground">{tr("Landmark:")} {order.deliveryLandmark ?? a.landmark}</p>}
          {(order.deliveryPlaceName ?? a.placeName) && <p className="text-muted-foreground">{order.deliveryPlaceName ?? a.placeName}</p>}
        </address>
      ) : (
        <p className="mb-3 text-[13px] text-muted-foreground">{order.source === "ADMIN" ? "Walk-in sale: handed over at the counter, no delivery." : tr("No address.")}</p>
      )}

      {a && (
        <>
          {shown ? (
            <div className="overflow-hidden rounded-md border border-border">
              <Suspense fallback={<div className="h-64 animate-pulse bg-muted" />}>
                <AdminMap
                  className="h-64 w-full"
                  googleBrowserKey={settings.data?.maps.googleBrowserKey}
                  tileUrl={settings.data?.maps.osmTileUrl ?? "https://tile.openstreetmap.org/{z}/{x}/{y}.png"}
                  center={shown ?? DEFAULT_CENTER}
                  marker={shown}
                  origin={origin}
                  originLabel="Kalibari Bazar"
                  route={route.data?.available && !moving ? route.data.path ?? null : null}
                  draggable={moving}
                  onMarkerChange={setDraft}
                  fitKey={`${order.id}-${lat}-${lng}-${route.data?.available ? "r" : "n"}`}
                  ariaLabel="Delivery pin of this order"
                />
              </Suspense>
            </div>
          ) : (
            <p className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-[13px] text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
              {tr("This order has no map pin yet. Ask the customer to share their location, or click “Place pin”.")}
            </p>
          )}

          {moving && (
            <div className="mt-2 flex flex-wrap items-center gap-2 rounded bg-muted px-3 py-2 text-[13px]">
              <span className="text-muted-foreground">{tr("Click the map or drag the pin, then save.")}</span>
              <Button size="xs" loading={setPin.isPending} disabled={!draft} onClick={() => draft && setPin.mutate({ latitude: draft.lat, longitude: draft.lng })}>{tr("Save pin")}</Button>
              <Button size="xs" variant="outline" onClick={() => { setMoving(false); setDraft(null); }}>{tr("Cancel")}</Button>
            </div>
          )}

          {sharedPlace && !moving && !locked && (
            <div className="mt-2 rounded border border-fresh-200 bg-fresh-50 px-3 py-2 text-[13px] dark:border-fresh-500/30 dark:bg-fresh-500/10">
              <p className="font-semibold">{tr("The customer shared a place")}</p>
              <p className="text-muted-foreground">{sharedPlace.placeName ?? `${sharedPlace.lat?.toFixed(5)}, ${sharedPlace.lng?.toFixed(5)}`}{sharedPlace.distanceKm !== null ? ` · ${sharedPlace.distanceKm} km` : ""}</p>
              <Button size="xs" className="mt-1.5" loading={setPin.isPending} onClick={() => setPin.mutate({ latitude: sharedPlace.lat!, longitude: sharedPlace.lng!, placeName: sharedPlace.placeName ?? undefined })}>{tr("Use this place")}</Button>
            </div>
          )}

          <dl className="mt-3">
            <KeyValue label={tr("Distance (Charged)")}>
              {km !== null ? `${km} km` : "—"}
              {order.distanceEstimated && <Badge className="ml-2" variant="warning">{tr("estimate")}</Badge>}
            </KeyValue>
            {order.deliveryDirectDistanceKm != null && (
              <KeyValue label={tr("Direct distance (Kalibari)")}>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">{Number(order.deliveryDirectDistanceKm)} km</span>
              </KeyValue>
            )}
            {order.deliveryRoadDistanceKm != null && (
              <KeyValue label={tr("Road distance")}>
                <span>{Number(order.deliveryRoadDistanceKm)} km</span>
                {order.distanceEstimated && <Badge className="ml-2" variant="warning">{tr("estimate")}</Badge>}
              </KeyValue>
            )}
            {order.deliveryDurationSec ? <KeyValue label={tr("Ride")}>{minutes(order.deliveryDurationSec)}</KeyValue> : null}
            <KeyValue label={tr("Delivery charge")}>
              {money(order.shippingCost)}
              {overridden && <Badge className="ml-2" variant="neutral">{tr("set by hand")}</Badge>}
            </KeyValue>
            {overridden && order.deliveryFee !== null && <KeyValue label={tr("Distance charge")}>{money(order.deliveryFee)}</KeyValue>}
            {overridden && order.deliveryFeeOverrideReason && <p className="mt-1 text-xs text-muted-foreground">Reason: {order.deliveryFeeOverrideReason}</p>}
            {order.estimatedDelivery && (
              <KeyValue label={tr("Estimated delivery")}>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {new Date(order.estimatedDelivery).toLocaleString([], {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </KeyValue>
            )}
            {order.deliverySlot && <KeyValue label={tr("Time slot")}>{order.deliverySlot}</KeyValue>}
          </dl>
          {order.distanceEstimated && <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">{tr("No road route was found, so the distance is the straight line × a factor. Check the pin, or add a routing key in Settings → Maps.")}</p>}

          <div className="mt-3 flex flex-wrap gap-2">
            {pin && <Button size="xs" variant="outline" asChild><a href={`https://www.google.com/maps/dir/?api=1&destination=${pin.lat},${pin.lng}`} target="_blank" rel="noopener noreferrer"><Navigation />{" "}{tr("Navigate")}</a></Button>}
            {phoneDigits && <Button size="xs" variant="outline" asChild><a href={`tel:${phoneDigits}`}><Phone />{" "}{tr("Call")}</a></Button>}
            {phoneDigits && <Button size="xs" variant="outline" asChild><a href={`https://wa.me/${waNumber(phoneDigits)}`} target="_blank" rel="noopener noreferrer"><MessageCircle />{" "}{tr("WhatsApp")}</a></Button>}
            {!locked && !moving && <Button size="xs" variant="outline" onClick={() => { setMoving(true); setDraft(pin ?? (origin ? { lat: origin.lat, lng: origin.lng } : DEFAULT_CENTER)); }}><Crosshair /> {pin ? tr("Move pin") : tr("Place pin")}</Button>}
            {!locked && <Button size="xs" variant="outline" onClick={() => setDlg("deliveryTime")}><Clock />{" "}{tr("Set delivery time")}</Button>}
            {!locked && <Button size="xs" variant="outline" onClick={() => setDlg("request")}><Send />{" "}{tr("Request location")}</Button>}
            {!locked && <Button size="xs" variant="outline" onClick={() => setDlg("fee")}><Pencil />{" "}{tr("Change charge")}</Button>}
          </div>
          {setPin.isError && <p className="mt-2 text-xs text-destructive">{errorMessage(setPin.error)}</p>}
        </>
      )}

      {dlg === "fee" && <OverrideFeeDialog order={order} onClose={() => setDlg(null)} />}
      {dlg === "request" && <RequestLocationDialog order={order} phone={phone} name={name} onClose={() => setDlg(null)} />}
      {dlg === "deliveryTime" && <SetDeliveryTimeDialog order={order} onClose={() => setDlg(null)} />}
    </Section>
  );
}

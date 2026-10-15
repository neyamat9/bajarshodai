import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Field } from "@/components/shared/Field";
import { ordersApi, type OrderDetail } from "@/api/orders";
import { useAct } from "@/hooks/useAct";
import { tr } from "@/i18n";

/** The words of the address. The map pin is changed on the order page itself (Move pin), because the charge follows the pin. */
export function EditAddressDialog({ order, open, onOpenChange }: { order: OrderDetail; open: boolean; onOpenChange: (o: boolean) => void }) {
  const a = order.shippingAddress;
  const [form, setForm] = useState({ fullName: a?.fullName ?? "", phone: a?.phone ?? "", address: a?.line1 ?? "", landmark: order.deliveryLandmark ?? a?.landmark ?? "", city: a?.city ?? "" });
  const [err, setErr] = useState<string | null>(null);
  const save = useAct(
    () =>
      ordersApi.address(order.id, {
        fullName: form.fullName.trim(),
        phone: form.phone.replace(/[\s-]/g, ""),
        address: form.address.trim(),
        city: form.city.trim() || undefined,
        landmark: form.landmark.trim() || undefined,
        // keep the pin: the address text alone must not move it
        ...(order.deliveryLat != null && order.deliveryLng != null ? { latitude: order.deliveryLat, longitude: order.deliveryLng, placeName: order.deliveryPlaceName ?? undefined } : {}),
      }),
    { success: tr("Address updated"), invalidate: [["order", order.id], ["orders"]], onSuccess: () => onOpenChange(false) },
  );
  const submit = () => {
    if (!form.fullName.trim() || !form.address.trim()) return setErr(tr("Name and address are required"));
    if (!/^(\+?88)?01[3-9]\d{8}$/.test(form.phone.replace(/[\s-]/g, ""))) return setErr(tr("Enter a valid Bangladesh mobile number"));
    if (!form.city.trim()) return setErr(tr("Enter the area or town"));
    setErr(null);
    save.mutate();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{tr("Delivery address")}</DialogTitle>
          <DialogDescription>{tr("Can be changed until the order is handed to the rider. To change the map pin use “Move pin” on the order page.")}</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-3">
          {err && <p className="rounded bg-red-50 px-3 py-2 text-xs font-medium text-destructive dark:bg-red-500/10">{err}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={tr("Full name")} required><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>
            <Field label={tr("Phone")} required><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01XXXXXXXXX" /></Field>
          </div>
          <Field label={tr("House, lane and area")} required><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder={tr("House 3, lane beside the mosque, Kalibari")} /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={tr("Landmark")}><Input value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} placeholder={tr("green gate, next to the school field")} /></Field>
            <Field label={tr("Area / town")} required><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder={tr("Shahrasti")} /></Field>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tr("Cancel")}</Button>
          <Button loading={save.isPending} onClick={submit}>{tr("Save address")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

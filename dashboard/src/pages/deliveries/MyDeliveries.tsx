import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Banknote, Bike, CheckCircle2, Clock, MapPin, MessageCircle, Navigation, Package, Phone, ThumbsDown, Truck, XCircle } from "lucide-react";
import { deliveriesApi, failReasonLabel, FAIL_REASONS, type MyDelivery } from "@/api/deliveries";
import { errorMessage } from "@/api/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState, ErrorState } from "@/components/shared/EmptyState";
import { Field } from "@/components/shared/Field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAct } from "@/hooks/useAct";
import { dateTime, money, num, timeAgo } from "@/lib/format";
import { tr } from "@/i18n";

const digits = (p: string) => p.replace(/[^\d]/g, "");
const wa = (p: string) => (digits(p).startsWith("88") ? digits(p) : `88${digits(p).replace(/^0*/, "0")}`);
const qty = (n: number) => (Number.isInteger(n) ? String(n) : String(Number(n.toFixed(3))));

const STATUS: Record<string, { label: string; variant: "neutral" | "info" | "fresh" | "success" | "danger" | "warning" }> = {
  ASSIGNED: { label: tr("New: accept it"), variant: "warning" },
  ACCEPTED: { label: tr("Accepted"), variant: "info" },
  PICKED_UP: { label: tr("Picked up"), variant: "info" },
  ON_THE_WAY: { label: tr("On the way"), variant: "fresh" },
  DELIVERED: { label: tr("Delivered"), variant: "success" },
  FAILED: { label: tr("Not delivered"), variant: "danger" },
};

function DeliveredDialog({ d, onClose }: { d: MyDelivery; onClose: () => void }) {
  const cod = d.cashToCollect > 0;
  const [cash, setCash] = useState(String(d.cashToCollect));
  const [note, setNote] = useState("");
  const run = useAct(() => deliveriesApi.delivered(d.id, { cashCollected: cod ? Number(cash) : undefined, note: note || undefined }), {
    success: tr("Delivered. Well done!"),
    invalidate: [["my-deliveries"]],
    onSuccess: onClose,
  });
  const diff = cod && Number(cash) !== d.cashToCollect;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Delivered to {d.order.customerName}?</DialogTitle>
          <DialogDescription>{d.order.orderNumber}</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-3">
          {cod ? (
            <Field label={tr("Cash you took from the customer ৳")} hint={tr("The order says {{amount}}", { amount: money(d.cashToCollect) })}>
              <Input type="number" inputMode="decimal" min={0} value={cash} onChange={(e) => setCash(e.target.value)} className="h-12 text-xl font-bold" />
            </Field>
          ) : (
            <p className="rounded bg-emerald-50 px-3 py-2 text-[13px] font-medium text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">{tr("Already paid: no cash to take.")}</p>
          )}
          {diff && <p className="rounded bg-amber-50 px-3 py-2 text-[13px] text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">{tr("This is not the amount on the order. Say why below, so the shop understands.")}</p>}
          <Field label={tr("Note (optional)")}><Textarea rows={2} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{tr("Not yet")}</Button>
          <Button size="lg" loading={run.isPending} disabled={cod && (cash === "" || Number(cash) < 0)} onClick={() => run.mutate()}><CheckCircle2 />{" "}{tr("Yes, delivered")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FailedDialog({ d, onClose }: { d: MyDelivery; onClose: () => void }) {
  const [reason, setReason] = useState<string>(FAIL_REASONS[0].value);
  const [note, setNote] = useState("");
  const run = useAct(() => deliveriesApi.failed(d.id, { reason, note: note || undefined }), {
    success: tr("Saved. The shop will decide what to do."),
    invalidate: [["my-deliveries"]],
    onSuccess: onClose,
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Could not deliver {d.order.orderNumber}</DialogTitle>
          <DialogDescription>{tr("The order goes on hold and the shop is told.")}</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-3">
          <Field label={tr("Why?")} required>
            <Select value={reason} onChange={(e) => setReason(e.target.value)} className="h-11">
              {FAIL_REASONS.map((r) => <option key={r.value} value={r.value}>{tr(r.label)}</option>)}
            </Select>
          </Field>
          <Field label={tr("Note")} hint={reason === "OTHER" ? tr("Please say what happened") : tr("Optional")}><Textarea rows={2} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{tr("Back")}</Button>
          <Button variant="destructive" loading={run.isPending} disabled={reason === "OTHER" && !note.trim()} onClick={() => run.mutate()}><XCircle />{" "}{tr("Could not deliver")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeliveryCard({ d, onDelivered, onFailed }: { d: MyDelivery; onDelivered: () => void; onFailed: () => void }) {
  const o = d.order;
  const st = STATUS[d.status] ?? { label: d.status, variant: "neutral" as const };
  const step = useAct((s: "accept" | "picked-up" | "on-the-way") => deliveriesApi.step(d.id, s), { invalidate: [["my-deliveries"]] });
  const active = d.status !== "DELIVERED" && d.status !== "FAILED";
  const busy = step.isPending;
  return (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
        <div>
          <p className="font-heading text-base font-bold">{o.orderNumber}</p>
          <p className="text-xs text-muted-foreground">{d.attempts > 1 ? `${tr("Attempt {{n}}", { n: num(d.attempts) })} · ` : ""}{tr("given {{when}}", { when: timeAgo(d.assignedAt) })}</p>
        </div>
        <Badge variant={st.variant}>{tr(st.label)}</Badge>
      </div>

      <div className="space-y-3 px-4 py-3 text-[14px]">
        {d.note && <p className="rounded bg-amber-50 px-3 py-2 text-[13px] text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">{tr("From the shop:")} {d.note}</p>}

        <div>
          <p className="text-[15px] font-semibold">{o.customerName}</p>
          <p className="mt-0.5 flex items-start gap-1.5 text-muted-foreground"><MapPin className="mt-0.5 size-4 shrink-0" /><span>{[o.address, o.landmark && `(${o.landmark})`, o.placeName].filter(Boolean).join(" · ") || "No address"}{o.distanceKm !== null ? ` · ${o.distanceKm} km` : ""}</span></p>
          {o.slot && <p className="mt-0.5 flex items-center gap-1.5 text-muted-foreground"><Clock className="size-4" /> {o.slot}</p>}
        </div>

        {active && (
          <div className="grid grid-cols-3 gap-2">
            {o.lat !== null && o.lng !== null ? (
              <Button asChild className="h-11 bg-sky-600 text-white hover:bg-sky-700"><a href={`https://www.google.com/maps/dir/?api=1&destination=${o.lat},${o.lng}`} target="_blank" rel="noopener noreferrer"><Navigation />{" "}{tr("Map")}</a></Button>
            ) : <Button disabled className="h-11"><Navigation />{" "}{tr("Map")}</Button>}
            {o.phone ? <Button asChild variant="outline" className="h-11"><a href={`tel:${digits(o.phone)}`}><Phone />{" "}{tr("Call")}</a></Button> : <Button disabled variant="outline" className="h-11"><Phone />{" "}{tr("Call")}</Button>}
            {o.phone ? <Button asChild variant="outline" className="h-11"><a href={`https://wa.me/${wa(o.phone)}`} target="_blank" rel="noopener noreferrer"><MessageCircle />{" "}{tr("WhatsApp")}</a></Button> : <Button disabled variant="outline" className="h-11"><MessageCircle />{" "}{tr("Chat")}</Button>}
          </div>
        )}

        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Package className="size-3.5" /> {tr("{{n}} items", { n: num(o.items.length) })}</p>
          <ul className="divide-y divide-border rounded border border-border text-[13px]">
            {o.items.map((i) => <li key={i.id} className="flex justify-between gap-3 px-3 py-1.5"><span className="min-w-0 truncate">{i.name}</span><b className="shrink-0">{qty(i.quantity)} {i.unit ?? ""}</b></li>)}
          </ul>
          {(o.customerNote || o.deliveryNote) && <p className="mt-1.5 text-xs text-muted-foreground">Note: {[o.customerNote, o.deliveryNote].filter(Boolean).join(" · ")}</p>}
        </div>

        {d.cashToCollect > 0 ? (
          <div className="flex items-center justify-between rounded border-2 border-amber-400 bg-amber-50 px-4 py-2.5 dark:bg-amber-500/10">
            <span className="flex items-center gap-2 font-semibold"><Banknote className="size-5" />{" "}{tr("Take cash")}</span>
            <span className="font-heading text-2xl font-bold">{money(d.cashToCollect)}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded bg-emerald-50 px-4 py-2 text-[13px] font-medium text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"><CheckCircle2 className="size-4" />{" "}{tr("Already paid: no cash to take")}</div>
        )}

        {d.status === "DELIVERED" && <p className="text-[13px] text-muted-foreground">Delivered {dateTime(d.deliveredAt)}{d.cashCollected ? ` · you took ${money(d.cashCollected)}${d.cashHandedOverAt ? ", received by the shop" : ", give it to the shop"}` : ""}</p>}
        {d.status === "FAILED" && <p className="text-[13px] text-destructive">{failReasonLabel(d.failedReason)} · {dateTime(d.failedAt)}</p>}
      </div>

      {active && (
        <div className="space-y-2 border-t border-border bg-muted/30 px-4 py-3">
          {d.status === "ASSIGNED" && <Button size="lg" className="h-12 w-full text-base" loading={busy} onClick={() => step.mutate("accept")}><CheckCircle2 />{" "}{tr("Accept this delivery")}</Button>}
          {(d.status === "ASSIGNED" || d.status === "ACCEPTED") && <Button size="lg" variant="outline" className="h-12 w-full text-base" loading={busy} onClick={() => step.mutate("picked-up")}><Package />{" "}{tr("I picked it up")}</Button>}
          {d.status !== "ON_THE_WAY" && d.status !== "ASSIGNED" && <Button size="lg" className="h-12 w-full text-base" loading={busy} onClick={() => step.mutate("on-the-way")}><Truck />{" "}{tr("I am on the way")}</Button>}
          {d.status === "ON_THE_WAY" && <Button size="lg" variant="brand" className="h-12 w-full text-base" onClick={onDelivered}><CheckCircle2 />{" "}{tr("Delivered")}</Button>}
          <div className="grid grid-cols-2 gap-2">
            {d.status !== "ON_THE_WAY" && <Button variant="outline" className="h-10" onClick={onDelivered}><CheckCircle2 />{" "}{tr("Delivered")}</Button>}
            <Button variant="ghost" className={`h-10 text-destructive ${d.status === "ON_THE_WAY" ? "col-span-2" : ""}`} onClick={onFailed}><ThumbsDown />{" "}{tr("Could not deliver")}</Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function List({ scope }: { scope: "active" | "done" }) {
  const q = useQuery({ queryKey: ["my-deliveries", scope], queryFn: () => deliveriesApi.mine(scope), refetchInterval: 20_000 });
  const [dlg, setDlg] = useState<{ kind: "ok" | "fail"; d: MyDelivery } | null>(null);
  if (q.isError) return <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />;
  if (q.isLoading) return <div className="space-y-3">{[0, 1].map((i) => <div key={i} className="h-72 animate-pulse rounded border border-border bg-muted" />)}</div>;
  const rows = q.data ?? [];
  if (rows.length === 0) {
    return <EmptyState title={scope === "active" ? tr("Nothing to deliver right now") : tr("Nothing finished in the last 7 days")} description={scope === "active" ? tr("When the shop gives you an order it appears here.") : undefined} icon={<Bike />} />;
  }
  return (
    <>
      <div className="mx-auto grid max-w-3xl gap-3 lg:max-w-none lg:grid-cols-2">
        {rows.map((d) => <DeliveryCard key={d.id} d={d} onDelivered={() => setDlg({ kind: "ok", d })} onFailed={() => setDlg({ kind: "fail", d })} />)}
      </div>
      {dlg?.kind === "ok" && <DeliveredDialog d={dlg.d} onClose={() => setDlg(null)} />}
      {dlg?.kind === "fail" && <FailedDialog d={dlg.d} onClose={() => setDlg(null)} />}
    </>
  );
}

export default function MyDeliveries() {
  const sum = useQuery({ queryKey: ["my-deliveries", "summary"], queryFn: deliveriesApi.mySummary, refetchInterval: 20_000 });
  const s = sum.data;
  return (
    <div>
      <PageHeader title={tr("My deliveries")} description={tr("What the shop gave you. Do each step as you go: the customer is told.")} />
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          [tr("To do"), s ? num(s.active) : "–", "text-foreground"],
          [tr("Delivered today"), s ? num(s.deliveredToday) : "–", "text-emerald-600"],
          [tr("Not delivered today"), s ? num(s.failedToday) : "–", "text-destructive"],
          [tr("Cash with me"), money(s?.cashInHand ?? 0), "text-amber-600"],
        ].map(([k, v, c]) => (
          <div key={k} className="rounded border border-border bg-card px-3 py-2.5"><p className="text-[11px] text-muted-foreground">{k}</p><p className={`font-heading text-xl font-bold ${c}`}>{v}</p></div>
        ))}
      </div>
      {s && s.cashInHand > 0 && <p className="mb-4 rounded bg-amber-50 px-3 py-2 text-[13px] text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">You are holding {money(s.cashInHand)} from deliveries. Give it to the shop and ask them to mark it received.</p>}
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">{tr("To do")}</TabsTrigger>
          <TabsTrigger value="done">{tr("Done (7 days)")}</TabsTrigger>
        </TabsList>
        <TabsContent value="active"><List scope="active" /></TabsContent>
        <TabsContent value="done"><List scope="done" /></TabsContent>
      </Tabs>
    </div>
  );
}

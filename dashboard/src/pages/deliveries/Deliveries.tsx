import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Banknote, Bike, Clock, MapPin, Navigation, Phone, Truck, UserCheck, Users, X } from "lucide-react";
import { deliveriesApi, failReasonLabel, type Board, type BoardCard, type CashGroup, type Stats } from "@/api/deliveries";
import { errorMessage } from "@/api/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { EmptyState, ErrorState } from "@/components/shared/EmptyState";
import { Field } from "@/components/shared/Field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox, Input, Select } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAct } from "@/hooks/useAct";
import { useUrlState } from "@/hooks/useUrlState";
import { useAuth } from "@/store/auth";
import { can, canDeliver } from "@/lib/access";
import { dateTime, isoDay, money, timeAgo } from "@/lib/format";
import { AssignDialog } from "./AssignDialog";

const digits = (p: string) => p.replace(/[^\d]/g, "");

function OrderCard({ c, selectable, selected, onSelect, onAssign, onTakeBack }: { c: BoardCard; selectable?: boolean; selected?: boolean; onSelect?: () => void; onAssign?: () => void; onTakeBack?: () => void }) {
  const o = c.order;
  const d = c.delivery;
  const cod = o.paymentMethod === "CASH_ON_DELIVERY";
  return (
    <Card className="p-3 text-[13px]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          {selectable && <Checkbox checked={!!selected} onChange={onSelect} aria-label={`Select ${o.orderNumber}`} className="mt-0.5" />}
          <div className="min-w-0">
            <Link to={`/orders/${o.id}`} className="whitespace-nowrap font-semibold hover:text-primary dark:hover:text-fresh-400">{o.orderNumber}</Link>
            <p className="truncate text-muted-foreground">{o.customerName}</p>
          </div>
        </div>
        <p className="shrink-0 font-semibold">{money(o.total)}</p>
      </div>
      <div className="mt-1">{cod && o.due > 0 ? <Badge variant="orange">Take cash {money(o.due)}</Badge> : <Badge variant="success">Paid</Badge>}</div>
      <div className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
        {(o.address || o.landmark) && <p className="flex items-start gap-1"><MapPin className="mt-0.5 size-3 shrink-0" /><span className="line-clamp-2">{[o.address, o.landmark].filter(Boolean).join(" · ")}{o.distanceKm !== null ? ` · ${o.distanceKm} km` : ""}</span></p>}
        {o.slot && <p className="flex items-center gap-1"><Clock className="size-3" /> {o.slot}</p>}
        {d && <p className="flex items-center gap-1"><Bike className="size-3" /> <b className="text-foreground">{d.assignee.name}</b>{d.attempts > 1 ? ` · attempt ${d.attempts}` : ""}</p>}
        {d?.status === "FAILED" && <p className="text-destructive">{failReasonLabel(d.failedReason)} · {timeAgo(d.failedAt)}</p>}
        {d?.status === "DELIVERED" && <p>{dateTime(d.deliveredAt)}{d.cashCollected ? ` · cash ${money(d.cashCollected)}${d.cashHandedOverAt ? " received" : " with rider"}` : ""}</p>}
        {d && d.status !== "DELIVERED" && d.status !== "FAILED" && <p>{d.status === "ASSIGNED" ? "Not accepted yet" : d.status === "ACCEPTED" ? "Accepted" : d.status === "PICKED_UP" ? "Picked up" : "On the way"} · {timeAgo(d.onTheWayAt ?? d.pickedUpAt ?? d.assignedAt)}</p>}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {onAssign && <Button size="xs" onClick={onAssign}><UserCheck /> {d ? "Move to…" : "Give to rider"}</Button>}
        {onTakeBack && <Button size="xs" variant="outline" onClick={onTakeBack}><X /> Take back</Button>}
        {o.phone && <Button size="xs" variant="outline" asChild><a href={`tel:${digits(o.phone)}`}><Phone /> Call</a></Button>}
        {o.lat !== null && o.lng !== null && <Button size="xs" variant="outline" asChild><a href={`https://www.google.com/maps/dir/?api=1&destination=${o.lat},${o.lng}`} target="_blank" rel="noopener noreferrer"><Navigation /> Map</a></Button>}
      </div>
    </Card>
  );
}

function Column({ title, tone, cards, render }: { title: string; tone: string; cards: BoardCard[]; render: (c: BoardCard) => React.ReactNode }) {
  return (
    <section className="flex w-[18rem] shrink-0 flex-col rounded border border-border bg-muted/30" aria-label={title}>
      <header className="flex items-center justify-between border-b border-border px-3 py-2">
        <h2 className="text-[13px] font-semibold">{title}</h2>
        <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${tone}`}>{cards.length}</span>
      </header>
      <div className="max-h-[70vh] flex-1 space-y-2 overflow-y-auto p-2">
        {cards.length === 0 ? <p className="px-1 py-6 text-center text-xs text-muted-foreground">Nothing here</p> : cards.map(render)}
      </div>
    </section>
  );
}

function BoardTab({ date, assigneeId }: { date: string; assigneeId: string }) {
  const me = useAuth((s) => s.user);
  const q = useQuery({ queryKey: ["deliveries", "board", date, assigneeId], queryFn: () => deliveriesApi.board({ date: date || undefined, assigneeId: assigneeId || undefined }), refetchInterval: 20_000 });
  const riders = useQuery({ queryKey: ["deliveries", "riders"], queryFn: deliveriesApi.riders, refetchInterval: 60_000 });
  const [picked, setPicked] = useState<string[]>([]);
  const [assign, setAssign] = useState<{ ids: string[]; current?: string } | null>(null);
  const takeBack = useAct((id: string) => deliveriesApi.unassign(id), { success: "Taken back", invalidate: [["deliveries"]] });
  const mayAssign = can(me, "delivery.manage", "orders.assign");

  const cols: Board["columns"] | undefined = q.data?.columns;
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  if (q.isError) return <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />;
  if (q.isLoading || !cols) return <div className="flex gap-3 overflow-hidden">{[0, 1, 2, 3].map((i) => <div key={i} className="h-72 w-72 shrink-0 animate-pulse rounded border border-border bg-muted" />)}</div>;

  return (
    <div>
      {picked.length > 0 && mayAssign && (
        <div className="sticky top-0 z-10 mb-3 flex flex-wrap items-center gap-2 rounded border border-primary/40 bg-card px-3 py-2 shadow-sm">
          <span className="text-[13px] font-medium">{picked.length} selected</span>
          <Button size="xs" onClick={() => setAssign({ ids: picked })}><UserCheck /> Give to rider</Button>
          <Button size="xs" variant="ghost" onClick={() => setPicked([])}>Clear</Button>
        </div>
      )}
      <div className="custom-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
        <Column title="Waiting for a rider" tone="bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300" cards={cols.unassigned} render={(c) => <OrderCard key={c.order.id} c={c} selectable={mayAssign} selected={picked.includes(c.order.id)} onSelect={() => toggle(c.order.id)} onAssign={mayAssign ? () => setAssign({ ids: [c.order.id] }) : undefined} />} />
        <Column title="Given to a rider" tone="bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300" cards={cols.assigned} render={(c) => <OrderCard key={c.order.id} c={c} onAssign={mayAssign ? () => setAssign({ ids: [c.order.id], current: c.delivery?.assignee.id }) : undefined} onTakeBack={mayAssign && c.delivery ? () => takeBack.mutate(c.delivery!.id) : undefined} />} />
        <Column title="On the way" tone="bg-fresh-100 text-fresh-800 dark:bg-fresh-500/15 dark:text-fresh-300" cards={cols.onTheWay} render={(c) => <OrderCard key={c.order.id} c={c} onAssign={mayAssign ? () => setAssign({ ids: [c.order.id], current: c.delivery?.assignee.id }) : undefined} />} />
        <Column title={`Delivered ${date === isoDay(new Date()) || !date ? "today" : date}`} tone="bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300" cards={cols.delivered} render={(c) => <OrderCard key={c.order.id} c={c} />} />
        <Column title="Failed: needs a decision" tone="bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300" cards={cols.failed} render={(c) => <OrderCard key={c.order.id} c={c} selectable={mayAssign} selected={picked.includes(c.order.id)} onSelect={() => toggle(c.order.id)} onAssign={mayAssign ? () => setAssign({ ids: [c.order.id] }) : undefined} />} />
      </div>
      {assign && <AssignDialog orderIds={assign.ids} current={assign.current} riders={riders.data ?? []} onClose={() => { setAssign(null); setPicked([]); }} />}
    </div>
  );
}

function CashTab() {
  const q = useQuery({ queryKey: ["deliveries", "cash"], queryFn: deliveriesApi.cash });
  const [confirm, setConfirm] = useState<CashGroup | null>(null);
  const hand = useAct((g: CashGroup) => deliveriesApi.handOver(g.items.map((i) => i.id)), {
    success: (r) => `Received ${money(r.total)} from ${confirm?.rider.name ?? "the rider"}`,
    invalidate: [["deliveries"]],
    onSuccess: () => setConfirm(null),
  });
  if (q.isError) return <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />;
  if (q.isLoading) return <div className="h-32 animate-pulse rounded border border-border bg-muted" />;
  const groups = q.data ?? [];
  if (groups.length === 0) return <EmptyState title="No cash with riders" description="Cash taken on delivery shows here until you receive it from the rider." icon={<Banknote />} />;
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {groups.map((g) => (
        <Card key={g.rider.id} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div><p className="font-semibold">{g.rider.name}</p><p className="text-xs text-muted-foreground">{g.rider.phone} · {g.items.length} deliveries</p></div>
            <div className="text-right"><p className="font-heading text-xl font-bold">{money(g.total)}</p><p className="text-[11px] text-muted-foreground">with the rider</p></div>
          </div>
          <ul className="mt-3 max-h-48 divide-y divide-border overflow-y-auto text-[13px]">
            {g.items.map((i) => (
              <li key={i.id} className="flex justify-between py-1.5"><span>{i.orderNumber}<span className="ml-2 text-xs text-muted-foreground">{timeAgo(i.deliveredAt)}</span></span><span className={i.cash !== i.due ? "font-semibold text-amber-600" : ""}>{money(i.cash)}{i.cash !== i.due ? ` (due ${money(i.due)})` : ""}</span></li>
            ))}
          </ul>
          <Button className="mt-3" onClick={() => setConfirm(g)}><Banknote /> I received {money(g.total)}</Button>
        </Card>
      ))}
      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent size="sm">
          <DialogHeader><DialogTitle>Received {confirm && money(confirm.total)} from {confirm?.rider.name}?</DialogTitle><DialogDescription>Count the cash first. This marks {confirm?.items.length} deliveries as settled and is written to the activity log.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setConfirm(null)}>Not yet</Button><Button loading={hand.isPending} onClick={() => confirm && hand.mutate(confirm)}>Yes, received</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const mins = (m: number | null) => (m === null ? "—" : m < 90 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`);

function StatsTab({ from, to }: { from: string; to: string }) {
  const q = useQuery({ queryKey: ["deliveries", "stats", from, to], queryFn: () => deliveriesApi.stats({ from: from || undefined, to: to || undefined }) });
  const s: Stats | undefined = q.data;
  const max = useMemo(() => Math.max(1, ...(s?.series.map((x) => x.delivered) ?? [1])), [s]);
  if (q.isError) return <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard loading={q.isLoading} label="Deliveries done" value={s?.totals.deliveries ?? 0} hint="all time" icon={<Truck size={18} />} tone="fresh" />
        <StatCard loading={q.isLoading} label="Different customers" value={s?.totals.uniqueCustomers ?? 0} hint="delivered to, all time" icon={<Users size={18} />} tone="forest" />
        <StatCard loading={q.isLoading} label="With riders now" value={s?.now.withRiders ?? 0} hint={`${s?.now.waitingForDelivery ?? 0} orders waiting to be delivered`} icon={<Bike size={18} />} tone="sky" />
        <StatCard loading={q.isLoading} label="Cash with riders" value={money(s?.now.cashWithRiders ?? 0)} hint={`${money(s?.now.cashToCollect ?? 0)} still to collect`} icon={<Banknote size={18} />} tone="red" />
      </div>
      {s && (
        <>
          <Card className="p-4">
            <p className="mb-3 text-[13px] font-semibold">{s.from} to {s.to}</p>
            <div className="grid grid-cols-2 gap-3 text-[13px] sm:grid-cols-3 lg:grid-cols-6">
              {[
                ["Delivered", String(s.range.delivered)],
                ["Failed", String(s.range.failed)],
                ["Success", s.range.successRatePct === null ? "—" : `${s.range.successRatePct}%`],
                ["Customers", String(s.range.uniqueCustomers)],
                ["Came back", s.range.repeatCustomerPct === null ? "—" : `${s.range.repeatCustomerPct}%`],
                ["Order to door", mins(s.range.avgMinutesFromOrder)],
              ].map(([k, v]) => <div key={k}><p className="text-xs text-muted-foreground">{k}</p><p className="text-lg font-semibold">{v}</p></div>)}
            </div>
          </Card>
          <Card className="p-4">
            <p className="mb-3 text-[13px] font-semibold">Deliveries per day</p>
            <div className="flex h-28 items-end gap-[3px]" role="img" aria-label="Deliveries per day">
              {s.series.map((d) => <div key={d.date} title={`${d.date}: ${d.delivered}`} className="flex-1 rounded-t bg-fresh-500/80" style={{ height: `${Math.max(d.delivered ? 6 : 1, (d.delivered / max) * 100)}%` }} />)}
            </div>
          </Card>
          <Card className="p-4">
            <p className="mb-2 text-[13px] font-semibold">Riders</p>
            {s.riders.length === 0 ? <p className="text-[13px] text-muted-foreground">No deliveries in this period.</p> : (
              <table className="w-full text-[13px]">
                <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-1 font-medium">Rider</th><th className="py-1 text-right font-medium">Delivered</th><th className="py-1 text-right font-medium">Failed</th><th className="py-1 text-right font-medium">Average time</th></tr></thead>
                <tbody>{s.riders.map((r, i) => <tr key={r.id} className="border-t border-border"><td className="py-1.5 font-medium">{i === 0 && "🏆 "}{r.name}</td><td className="text-right">{r.delivered}</td><td className="text-right">{r.failed}</td><td className="text-right">{mins(r.avgMinutes)}</td></tr>)}</tbody>
              </table>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

export default function Deliveries() {
  const me = useAuth((s) => s.user);
  const [f, set] = useUrlState({ tab: "board", date: "", rider: "", from: "", to: "" });
  const riders = useQuery({ queryKey: ["deliveries", "riders"], queryFn: deliveriesApi.riders, enabled: f.tab === "board" });
  const manage = can(me, "delivery.manage");
  const tab = !manage && f.tab !== "board" ? "board" : f.tab;
  return (
    <div>
      <PageHeader
        title="Deliveries"
        description="Give orders to riders and follow them to the door."
        actions={canDeliver(me) ? <Button variant="outline" asChild><Link to="/my-deliveries"><Bike /> My deliveries</Link></Button> : undefined}
      />
      <Tabs value={tab} onValueChange={(t) => set({ tab: t })}>
        <TabsList>
          <TabsTrigger value="board">Board</TabsTrigger>
          {manage && <TabsTrigger value="cash">Cash from riders</TabsTrigger>}
          {manage && <TabsTrigger value="stats">Statistics</TabsTrigger>}
        </TabsList>
        <TabsContent value="board">
          <div className="mb-3 flex flex-wrap items-end gap-2">
            <Field label="Delivered on"><Input type="date" value={f.date} max={isoDay(new Date())} onChange={(e) => set({ date: e.target.value })} className="w-40" /></Field>
            <Field label="Rider">
              <Select value={f.rider} onChange={(e) => set({ rider: e.target.value })} className="w-48">
                <option value="">Everyone</option>
                {(riders.data ?? []).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </Select>
            </Field>
          </div>
          <BoardTab date={f.date} assigneeId={f.rider} />
        </TabsContent>
        {manage && <TabsContent value="cash"><CashTab /></TabsContent>}
        {manage && (
          <TabsContent value="stats">
            <div className="mb-3 flex flex-wrap items-end gap-2">
              <Field label="From"><Input type="date" value={f.from} onChange={(e) => set({ from: e.target.value })} className="w-40" /></Field>
              <Field label="To"><Input type="date" value={f.to} onChange={(e) => set({ to: e.target.value })} className="w-40" /></Field>
              <p className="pb-2 text-xs text-muted-foreground">Default: the last 30 days</p>
            </div>
            <StatsTab from={f.from} to={f.to} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

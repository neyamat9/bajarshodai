import { useState } from "react";
import { Link, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Copy, KeyRound, Mail, Phone, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { customersApi, type CustomerRow } from "@/api/users";
import { assetUrl, errorMessage } from "@/api/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Field, Section } from "@/components/shared/Field";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ErrorState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, Textarea } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAct } from "@/hooks/useAct";
import { LastLocationCard } from "./LastLocationCard";
import { dateOnly, dateTime, initials, money, num, titleCase } from "@/lib/format";
import { DetailPageSkeleton } from "@/components/shared/skeletons";
import { tr } from "@/i18n";

function List<T>({ q, empty, render }: { q: { isLoading: boolean; isError: boolean; error: unknown; data?: T[] }; empty: string; render: (x: T) => React.ReactNode }) {
  if (q.isLoading) return <p className="py-6 text-center text-[13px] text-muted-foreground">{tr("Loading…")}</p>;
  if (q.isError) return <p className="py-6 text-center text-[13px] text-destructive">{errorMessage(q.error)}</p>;
  if (!q.data?.length) return <p className="py-6 text-center text-[13px] text-muted-foreground">{empty}</p>;
  return <ul className="divide-y divide-border">{q.data.map((x, i) => <li key={i} className="py-2.5 text-[13px]">{render(x)}</li>)}</ul>;
}

function Notes({ id }: { id: string }) {
  const q = useQuery({ queryKey: ["customer", id, "notes"], queryFn: () => customersApi.notes(id) });
  const [text, setText] = useState("");
  const [del, setDel] = useState<string | null>(null);
  const add = useAct(() => customersApi.addNote(id, text.trim()), { success: tr("Note added"), invalidate: [["customer", id, "notes"], ["customer", id]], onSuccess: () => setText("") });
  const rm = useAct((nid: string) => customersApi.removeNote(id, nid), { invalidate: [["customer", id, "notes"], ["customer", id]], onSuccess: () => setDel(null) });
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Textarea rows={2} value={text} maxLength={2000} onChange={(e) => setText(e.target.value)} placeholder={tr("A private note about this customer (only you can see it)…")} />
        <Button size="sm" disabled={!text.trim()} loading={add.isPending} onClick={() => add.mutate()}>{tr("Add note")}</Button>
      </div>
      <List q={q} empty="No notes yet." render={(n) => (
        <div className="flex items-start justify-between gap-3">
          <div><p className="whitespace-pre-wrap">{n.note}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{n.admin?.name ?? tr("Admin")} · {dateTime(n.createdAt)}</p></div>
          <Button size="icon-xs" variant="ghost" aria-label={tr("Delete note")} onClick={() => setDel(n.id)}><Trash2 className="text-destructive" /></Button>
        </div>
      )} />
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} title={tr("Delete this note?")} confirmLabel={tr("Delete")} destructive loading={rm.isPending} onConfirm={() => del && rm.mutate(del)} />
    </div>
  );
}

export default function CustomerDetail() {
  const { id = "" } = useParams();
  const q = useQuery({ queryKey: ["customer", id], queryFn: () => customersApi.get(id) });
  const [page, setPage] = useState(1);
  const orders = useQuery({ queryKey: ["customer", id, "orders", page], queryFn: () => customersApi.orders(id, page) });
  const addresses = useQuery({ queryKey: ["customer", id, "addresses"], queryFn: () => customersApi.addresses(id) });
  const tickets = useQuery({ queryKey: ["customer", id, "tickets"], queryFn: () => customersApi.tickets(id) });
  const reviews = useQuery({ queryKey: ["customer", id, "reviews"], queryFn: () => customersApi.reviews(id) });
  const coupons = useQuery({ queryKey: ["customer", id, "coupons"], queryFn: () => customersApi.coupons(id) });
  const [pending, setPending] = useState<CustomerRow["status"] | null>(null);
  const [askReset, setAskReset] = useState(false);
  const [tempPw, setTempPw] = useState<string | null>(null);
  const [askBlacklist, setAskBlacklist] = useState(false);
  const [blacklistReason, setBlacklistReason] = useState("");
  const reset = useAct(() => customersApi.resetPassword(id), { onSuccess: (r) => { setAskReset(false); setTempPw(r.temporaryPassword); } });
  const status = useAct((s: CustomerRow["status"]) => customersApi.setStatus(id, s), { success: tr("Account status updated"), invalidate: [["customer", id], ["customers"]], onSuccess: () => setPending(null) });
  const blacklistAct = useAct((isBlacklisted: boolean) => customersApi.updateBlacklist(id, isBlacklisted, blacklistReason.trim() || undefined), {
    success: tr("Blacklist updated"),
    invalidate: [["customer", id], ["customers"]],
    onSuccess: () => { setAskBlacklist(false); setBlacklistReason(""); },
  });

  if (q.isLoading) return <DetailPageSkeleton />;
  if (q.isError || !q.data) return <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />;
  const c = q.data;
  const s = c.stats;

  return (
    <div>
      <PageHeader
        back={{ to: "/customers", label: tr("Customers") }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <Avatar className="size-10">{c.avatarUrl && <AvatarImage src={assetUrl(c.avatarUrl)} />}<AvatarFallback>{initials(c.name)}</AvatarFallback></Avatar>
            {c.name}
            <StatusBadge status={c.status} />
            {c.isBlacklisted && <Badge variant="danger">{tr("COD Blacklisted")}</Badge>}
          </span>
        }
        description={`${tr("Joined {{date}}", { date: dateOnly(c.createdAt) })} · ${tr("{{n}} logins", { n: num(c.loginCount) })}${c.lastLoginAt ? ` · ${tr("last seen {{when}}", { when: dateTime(c.lastLoginAt) })}` : ""}${c.blacklistReason ? ` · COD blacklist: ${c.blacklistReason}` : ""}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {c.role === "USER" && (
              <Button size="sm" variant="outline" onClick={() => setAskReset(true)}><KeyRound />{" "}{tr("Set temporary password")}</Button>
            )}
            {c.isBlacklisted ? (
              <Button size="sm" variant="outline" loading={blacklistAct.isPending} onClick={() => blacklistAct.mutate(false)}>
                {tr("Remove COD Blacklist")}
              </Button>
            ) : (
              <Button size="sm" variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => setAskBlacklist(true)}>
                <ShieldAlert className="size-4" />{" "}{tr("Blacklist COD")}
              </Button>
            )}
            <Select value={c.status} onChange={(e) => setPending(e.target.value as CustomerRow["status"])} className="w-auto" aria-label={tr("Account status")}>
              <option value="ACTIVE">{tr("Active")}</option><option value="SUSPENDED">{tr("Suspended")}</option><option value="BANNED">{tr("Banned")}</option>
            </Select>
          </div>
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={tr("Lifetime value")} value={money(s.lifetimeValue)} tone="green" hint={`${s.orders} orders`} />
        <StatCard label={tr("Average order")} value={money(s.averageOrderValue)} />
        <StatCard label={tr("Last order")} value={s.lastOrderAt ? dateOnly(s.lastOrderAt) : "—"} hint={s.firstOrderAt ? tr("First: {{date}}", { date: dateOnly(s.firstOrderAt) }) : undefined} tone="fresh" />
        <StatCard label={tr("Support")} value={tr("{{n}} open", { n: num(s.openTickets) })} hint={tr("{{t}} tickets · {{r}} returns · {{v}} reviews", { t: num(s.tickets), r: num(s.returns), v: num(s.reviews) })} tone="sky" />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-3 [&>*]:min-w-0">
        <div className="lg:col-span-2">
          <Tabs defaultValue="orders">
            <TabsList className="mb-3">
              <TabsTrigger value="orders">Orders ({s.orders})</TabsTrigger>
              <TabsTrigger value="addresses">{tr("Addresses")}</TabsTrigger>
              <TabsTrigger value="tickets">Tickets ({s.tickets})</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({s.reviews})</TabsTrigger>
              <TabsTrigger value="coupons">Coupons ({s.couponUses})</TabsTrigger>
              <TabsTrigger value="notes">Notes ({s.notes})</TabsTrigger>
            </TabsList>
            <TabsContent value="orders"><Section title={tr("Orders")}>
              <List q={{ ...orders, data: orders.data?.data }} empty="No orders yet." render={(o) => (
                <Link to={`/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 hover:text-primary">
                  <div className="min-w-0"><p className="font-semibold">{o.orderNumber}</p><p className="text-[11px] text-muted-foreground">{dateTime(o.placedAt)}</p></div>
                  <div className="flex flex-wrap items-center gap-2 max-sm:w-full"><StatusBadge status={o.status} /><StatusBadge status={o.paymentStatus} /><b className="ml-auto w-20 text-right">{money(o.total)}</b></div>
                </Link>
              )} />
              {orders.data && orders.data.meta.totalPages > 1 && (
                <div className="mt-3 flex justify-end gap-2"><Button size="xs" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>{tr("Previous")}</Button><Button size="xs" variant="outline" disabled={page >= orders.data.meta.totalPages} onClick={() => setPage(page + 1)}>{tr("Next")}</Button></div>
              )}
            </Section></TabsContent>
            <TabsContent value="addresses"><Section title={tr("Saved addresses")}><List q={addresses} empty="No saved addresses." render={(a) => (
              <div><p className="font-medium">{a.fullName} · {a.phone} {a.isDefault && <Badge variant="brand">{tr("Default")}</Badge>}</p><p className="text-muted-foreground">{[a.line1, a.landmark, a.placeName ?? [a.upazila, a.district].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}</p></div>
            )} /></Section></TabsContent>
            <TabsContent value="tickets"><Section title={tr("Support tickets")}><List q={{ ...tickets, data: tickets.data?.data }} empty="No tickets." render={(t) => (
              <Link to={`/support/${t.id}`} className="flex items-center justify-between gap-3 hover:text-primary"><div><p className="font-medium">{t.ticketNumber} · {t.subject}</p><p className="text-[11px] text-muted-foreground">{titleCase(t.category)} · {dateTime(t.createdAt)}</p></div><StatusBadge status={t.status} /></Link>
            )} /></Section></TabsContent>
            <TabsContent value="reviews"><Section title={tr("Reviews")}><List q={{ ...reviews, data: reviews.data?.data }} empty="No reviews." render={(r) => (
              <div><p className="font-medium">{"★".repeat(r.rating)}<span className="text-muted-foreground">{"★".repeat(5 - r.rating)}</span> · {r.product.name} <StatusBadge status={r.status} /></p><p className="text-muted-foreground">{r.title ? `${r.title} — ` : ""}{r.comment}</p></div>
            )} /></Section></TabsContent>
            <TabsContent value="coupons"><Section title={tr("Coupons used")}><List q={{ ...coupons, data: coupons.data?.data }} empty="No coupons used." render={(u) => (
              <div className="flex justify-between"><span><b>{u.coupon.code}</b> · {dateTime(u.usedAt)}</span><span>− {money(u.discountAmount)}</span></div>
            )} /></Section></TabsContent>
            <TabsContent value="notes"><Section title={tr("Private notes")}><Notes id={id} /></Section></TabsContent>
          </Tabs>
        </div>
        <div className="space-y-4">
          <Section title={tr("Contact")}>
            <p className="flex items-center gap-2 text-[13px]"><Phone className="size-4 text-muted-foreground" />{c.phone ?? "—"} {c.phoneVerified && <Badge variant="success">{tr("Verified")}</Badge>}</p>
            <p className="mt-2 flex items-center gap-2 text-[13px]"><Mail className="size-4 text-muted-foreground" />{c.email ?? tr("No email")} {c.email && c.emailVerified && <Badge variant="success">{tr("Verified")}</Badge>}</p>
            <p className="mt-2 text-xs text-muted-foreground">{c.newsletter ? tr("Subscribed to the newsletter") : tr("Not on the newsletter")}</p>
          </Section>
          <LastLocationCard userId={id} />
          <Section title={tr("Orders by status")}>
            <ul className="space-y-1">{Object.entries(s.ordersByStatus).map(([k, v]) => <li key={k} className="flex items-center justify-between text-[13px]"><StatusBadge status={k} /><b>{v}</b></li>)}{!Object.keys(s.ordersByStatus).length && <li className="text-[13px] text-muted-foreground">{tr("None")}</li>}</ul>
          </Section>
        </div>
      </div>
      <ConfirmDialog
        open={askReset}
        onOpenChange={setAskReset}
        title={tr("Set a temporary password?")}
        description={tr("The customer is signed out everywhere and their old password stops working. You will see the new password once. Tell it to them by phone, and ask them to change it after signing in.")}
        confirmLabel={tr("Set temporary password")}
        loading={reset.isPending}
        onConfirm={() => reset.mutate()}
      />
      <Dialog open={!!tempPw} onOpenChange={(o) => !o && setTempPw(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{tr("Temporary password")}</DialogTitle><DialogDescription>Shown only now. Give it to {c.name} (phone {c.phone}).</DialogDescription></DialogHeader>
          <DialogBody>
            <div className="flex items-center justify-between gap-3 rounded border border-border bg-muted px-4 py-3">
              <span className="font-mono text-xl font-bold tracking-widest">{tempPw}</span>
              <Button size="sm" variant="outline" onClick={() => { void navigator.clipboard.writeText(tempPw ?? ""); toast.success(tr("Copied")); }}><Copy />{" "}{tr("Copy")}</Button>
            </div>
          </DialogBody>
          <DialogFooter><Button onClick={() => setTempPw(null)}>{tr("Done")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!pending}
        onOpenChange={(o) => !o && setPending(null)}
        title={`Set account to ${pending?.toLowerCase()}?`}
        description={pending === "ACTIVE" ? tr("They can sign in and order again.") : tr("They will be signed out and cannot sign in or order.")}
        confirmLabel={tr("Confirm")}
        destructive={pending !== "ACTIVE"}
        loading={status.isPending}
        onConfirm={() => pending && status.mutate(pending)}
      />
      <Dialog open={askBlacklist} onOpenChange={setAskBlacklist}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tr("Blacklist Customer from COD?")}</DialogTitle>
            <DialogDescription>
              {tr("This customer will be prevented from placing Cash on Delivery orders. Mobile banking payment will still be accepted.")}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-3">
            <Field label={tr("Reason (optional)")}>
              <Textarea
                rows={2}
                value={blacklistReason}
                onChange={(e) => setBlacklistReason(e.target.value)}
                placeholder={tr("e.g. Repeated delivery refusal or fake order")}
              />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAskBlacklist(false)}>{tr("Cancel")}</Button>
            <Button variant="destructive" loading={blacklistAct.isPending} onClick={() => blacklistAct.mutate(true)}>
              {tr("Confirm Blacklist")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

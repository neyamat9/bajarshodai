import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { PlusCircle, X } from "lucide-react";
import { ORDER_STATUSES, ordersApi, type OrderStatus, type OrderSummary } from "@/api/orders";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { DateInput, FilterBar, FilterSelect, SearchInput } from "@/components/shared/FilterBar";
import { OrderStatCards } from "./OrderStatCards";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAct } from "@/hooks/useAct";
import { patchListRows } from "@/hooks/useInfiniteList";
import { QuickStatus, type QuickOption } from "@/components/shared/QuickStatus";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { errorMessage } from "@/api/client";
import { useInfiniteList } from "@/hooks/useInfiniteList";
import { useUrlState } from "@/hooks/useUrlState";
import { dateTime, money, num, orderStatusLabel, titleCase } from "@/lib/format";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, Textarea } from "@/components/ui/input";
import { Field } from "@/components/shared/Field";
import { toast } from "sonner";
import { BulkBar } from "@/components/shared/BulkBar";
import { SavedViews } from "@/components/shared/SavedViews";
import { tr } from "@/i18n";

const LOCKED: OrderStatus[] = ["DELIVERED", "CANCELLED", "RETURNED", "REFUNDED"];
/** the usual path first, then side exits; the server still checks every move */
const STATUS_OPTIONS: QuickOption<OrderStatus>[] = [
  { value: "CONFIRMED", label: tr("Confirm") },
  { value: "PROCESSING", label: tr("Processing") },
  { value: "SHIPPED", label: tr("Shipped") },
  { value: "IN_TRANSIT", label: tr("In transit") },
  { value: "OUT_FOR_DELIVERY", label: tr("Out for delivery") },
  { value: "DELIVERED", label: tr("Delivered"), confirm: tr("Mark this order as delivered?") },
  { value: "ON_HOLD", label: tr("Put on hold") },
  { value: "CANCELLED", label: tr("Cancel order"), destructive: true },
];
const PAY_OPTIONS: QuickOption<string>[] = [
  { value: "PAID", label: tr("Mark as paid"), confirm: "Mark this payment as received?" },
  { value: "FAILED", label: tr("Payment failed"), destructive: true },
];

const ORDER_VIEWS = [
  { name: "Needs confirming", query: "status=PENDING" },
  { name: "Payment to verify", query: "paymentStatus=PENDING&paymentMethod=BKASH" },
  { name: "Ready to ship", query: "status=PROCESSING" },
  { name: "On the way", query: "status=SHIPPED" },
  { name: "Phone & walk-in orders", query: "source=ADMIN" },
];

const DEFAULTS = { search: "", status: "", stage: "", toVerify: "", paymentStatus: "", paymentMethod: "", source: "", from: "", to: "", sortBy: "newest", page: "1" };

export default function OrdersList() {
  const navigate = useNavigate();
  const [f, setF] = useUrlState(DEFAULTS);
  const debounced = f.search; // SearchInput waits for a pause in typing before it changes the URL
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>("CONFIRMED");
  const [bulkNote, setBulkNote] = useState("");

  const params = { ...f, search: debounced };
  const q = useInfiniteList(["orders", "list", params], (page) => ordersApi.list({ ...params, page, limit: 20 }));

  const qc = useQueryClient();
  // change one order from the list: the row updates at once and rolls back if the server refuses
  const quick = useMutation({
    mutationFn: (v: { id: string; status?: OrderStatus; pay?: "PAID" | "FAILED" }) => (v.pay ? ordersApi.verifyPayment(v.id, v.pay) : ordersApi.setStatus(v.id, v.status!)),
    onMutate: (v) => ({ undo: patchListRows(qc, ["orders"], v.id, v.pay ? { paymentStatus: v.pay } : { status: v.status }) }),
    onError: (e, _v, ctx) => {
      ctx?.undo();
      toast.error(errorMessage(e));
    },
    onSuccess: (_d, v) => {
      toast.success(v.pay ? (v.pay === "PAID" ? tr("Payment marked as paid") : tr("Payment marked as failed")) : tr("Order status updated"));
      void qc.invalidateQueries({ queryKey: ["dashboard-home"] });
      void qc.invalidateQueries({ queryKey: ["attention-summary"] });
    },
  });

  const bulk = useAct((status?: OrderStatus) => ordersApi.bulkStatus(selected, status ?? bulkStatus, status ? undefined : bulkNote), {
    invalidate: [["orders"], ["dashboard-home"]],
    onSuccess: (r) => {
      if (r.failed) toast.warning(tr("{{updated}} updated, {{failed}} failed: {{why}}", { updated: r.updated, failed: r.failed, why: r.results.filter((x) => !x.ok).map((x) => x.error).slice(0, 2).join("; ") }));
      else toast.success(`${r.updated} orders updated`);
      setSelected([]);
      setBulkOpen(false);
      setBulkNote("");
    },
  });

  const exportParams = { status: f.status, stage: f.stage, toVerify: f.toVerify, paymentStatus: f.paymentStatus, paymentMethod: f.paymentMethod, source: f.source, from: f.from, to: f.to, search: debounced };
  const filtered = !!(f.search || f.status || f.stage || f.toVerify || f.paymentStatus || f.paymentMethod || f.source || f.from || f.to);

  const columns: Column<OrderSummary>[] = [
    {
      key: "order",
      header: tr("Order"), sk: "lines2",
      mobile: "title",
      cell: (o) => (
        <div>
          <p className="font-semibold">{o.orderNumber}</p>
          <p className="text-[11px] text-muted-foreground">{dateTime(o.placedAt)}</p>
        </div>
      ),
    },
    {
      key: "customer",
      header: tr("Customer"), sk: "lines2",
      cell: (o) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{o.shippingAddress?.fullName ?? o.user?.name ?? o.guestName ?? tr("Guest")}</p>
          <p className="text-[11px] text-muted-foreground">{o.shippingAddress?.phone ?? o.user?.phone ?? o.guestPhone ?? ""}{!o.user && (o.shippingAddress ? ` · ${tr("guest")}` : tr("walk-in"))}</p>
        </div>
      ),
    },
    {
      key: "items",
      header: tr("Items"), sk: "lines2",
      cell: (o) => (
        <div className="max-w-[220px]">
          <p className="truncate">{o.items[0]?.productName}{o.items.length > 1 && <span className="text-muted-foreground"> +{o.items.length - 1} more</span>}</p>
          <p className="text-[11px] text-muted-foreground">{tr("{{n}} items", { n: num(o.items.length) })}</p>
        </div>
      ),
    },
    {
      key: "payment",
      header: tr("Payment"), sk: "badge2",
      mobile: "end",
      cell: (o) => (
        <div className="flex flex-wrap items-center gap-1 md:flex-col md:items-start">
          <StatusBadge status={o.paymentMethod} />
          <QuickStatus
            current={o.paymentStatus as string}
            options={PAY_OPTIONS}
            title={tr("Payment")}
            locked={(o.paymentStatus !== "PENDING" && o.paymentStatus !== "FAILED") || ["CANCELLED", "RETURNED", "REFUNDED"].includes(o.status)}
            pending={quick.isPending && quick.variables?.id === o.id && !!quick.variables.pay}
            onPick={(v) => quick.mutate({ id: o.id, pay: v as "PAID" | "FAILED" })}
          />
        </div>
      ),
    },
    {
      key: "status",
      header: tr("Status"), sk: "badge",
      mobile: "badge",
      cell: (o) => (
        <QuickStatus
          current={o.status}
          options={STATUS_OPTIONS}
          locked={LOCKED.includes(o.status)}
          pending={quick.isPending && quick.variables?.id === o.id && !!quick.variables.status}
          onPick={(status) => quick.mutate({ id: o.id, status })}
        />
      ),
    },
    { key: "total", header: tr("Total"), align: "right", sk: "num", mobile: "end", cell: (o) => <span className="font-semibold">{money(o.total)}</span> },
  ];

  return (
    <div>
      <PageHeader
        title={tr("Orders")}
        description={tr("Every order from the website and from phone sales.")}
        actions={
          <>
            <SavedViews storageKey="orders" builtIns={ORDER_VIEWS} />
            <DownloadButton path="/admin/orders/export" params={exportParams} filename="orders.csv" />
            <Button asChild variant="brand" size="sm">
              <Link to="/orders/new">
                <PlusCircle />{" "}{tr("Create order")}
              </Link>
            </Button>
          </>
        }
      />
      <OrderStatCards filters={{ ...params, page: undefined }} stage={f.stage} toVerify={f.toVerify} onPick={(c) => setF({ stage: c.stage, toVerify: c.toVerify, status: "" })} />
      <DataTable
        infinite={q}
        columns={columns}
        onRowClick={(o) => navigate(`/orders/${o.id}`)}
        selectable
        selected={selected}
        onSelect={setSelected}
        empty={{ title: filtered ? tr("No orders match these filters") : "No orders yet", description: filtered ? tr("Try clearing a filter.") : tr("Orders will appear here as soon as customers check out.") }}
        toolbar={
          <>
            <FilterBar>
              <SearchInput value={f.search} onChange={(v) => setF({ search: v })} placeholder={tr("Order #, customer, phone, product name…")} />
              <FilterSelect value={f.status} onChange={(v) => setF({ status: v, stage: "", toVerify: "" })} all={tr("All statuses")} options={ORDER_STATUSES.map((s) => ({ value: s, label: orderStatusLabel(s) }))} />
              <FilterSelect value={f.paymentStatus} onChange={(v) => setF({ paymentStatus: v })} all={tr("Any payment")} options={["PENDING", "PAID", "FAILED", "PARTIALLY_REFUNDED", "REFUNDED"].map((s) => ({ value: s, label: titleCase(s) }))} />
              <FilterSelect value={f.paymentMethod} onChange={(v) => setF({ paymentMethod: v })} all={tr("Any method")} options={[{ value: "CASH_ON_DELIVERY", label: tr("Cash on delivery") }, { value: "BKASH", label: "bKash" }, { value: "NAGAD", label: tr("Nagad") }, { value: "ROCKET", label: tr("Rocket") }]} />
              <FilterSelect value={f.source} onChange={(v) => setF({ source: v })} all={tr("All sources")} options={[{ value: "WEB", label: tr("Website") }, { value: "ADMIN", label: tr("Phone orders") }]} />
              <FilterSelect value={f.sortBy} onChange={(v) => setF({ sortBy: v })} all={null} options={[{ value: "newest", label: tr("Newest first") }, { value: "oldest", label: tr("Oldest first") }, { value: "total-desc", label: tr("Highest total") }, { value: "total-asc", label: tr("Lowest total") }]} />
              <DateInput label={tr("From")} value={f.from} onChange={(v) => setF({ from: v })} />
              <DateInput label={tr("To")} value={f.to} onChange={(v) => setF({ to: v })} />
            </FilterBar>
            <FilterBar className="empty:hidden">
              {filtered && (
                <Button size="sm" variant="ghost" onClick={() => { setF({ search: "", status: "", stage: "", toVerify: "", paymentStatus: "", paymentMethod: "", source: "", from: "", to: "" }); }}>
                  <X />{" "}{tr("Clear filters")}
                </Button>
              )}
            </FilterBar>
          </>
        }
      />

      <BulkBar count={selected.length} onClear={() => setSelected([])} noun={selected.length === 1 ? "order" : "orders"}>
        <Button size="sm" variant="brand" onClick={() => { setBulkStatus("CONFIRMED"); bulk.mutate("CONFIRMED"); }} loading={bulk.isPending}>{tr("Confirm")}</Button>
        <Button size="sm" variant="secondary" onClick={() => { setBulkStatus("SHIPPED"); bulk.mutate("SHIPPED"); }} loading={bulk.isPending}>{tr("Mark shipped")}</Button>
        <Button size="sm" variant="secondary" onClick={() => setBulkOpen(true)}>{tr("Change status…")}</Button>
      </BulkBar>

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Change status of {selected.length} orders</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-3">
            <Field label={tr("New status")}>
              <Select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value as OrderStatus)}>
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{orderStatusLabel(s)}</option>)}
              </Select>
            </Field>
            <Field label={tr("Note (shown to the customer)")} hint="Each order is checked on its own; orders that can't make this move are reported.">
              <Textarea value={bulkNote} onChange={(e) => setBulkNote(e.target.value)} maxLength={500} />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)}>{tr("Cancel")}</Button>
            <Button loading={bulk.isPending} onClick={() => bulk.mutate(undefined)}>{tr("Apply")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

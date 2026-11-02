import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Boxes, PackageX, Pill, SlidersHorizontal, Upload, Wallet } from "lucide-react";
import { inventoryApi, type BulkStockResult, type InventoryItem } from "@/api/inventory";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { FilterBar, FilterSelect, SearchInput, DateInput } from "@/components/shared/FilterBar";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Field } from "@/components/shared/Field";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAct } from "@/hooks/useAct";
import { useInfiniteList } from "@/hooks/useInfiniteList";
import { useUrlState } from "@/hooks/useUrlState";
import { dateTime, money, num, titleCase } from "@/lib/format";
import { Link } from "react-router";
import { tr } from "@/i18n";

function AdjustDialog({ item, onClose }: { item: InventoryItem; onClose: () => void }) {
  const [mode, setMode] = useState<"ADD" | "REMOVE" | "SET">("ADD");
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("RESTOCK");
  const [note, setNote] = useState("");
  const save = useAct(() => inventoryApi.adjust({ productId: item.productId, variantId: item.variantId ?? undefined, mode, quantity: Number(qty), reason, note: note || undefined }), {
    success: tr("Stock updated"),
    invalidate: [["inventory"], ["products"], ["product", item.productId]],
    onSuccess: onClose,
  });
  const after = mode === "ADD" ? item.stock + Number(qty || 0) : mode === "REMOVE" ? item.stock - Number(qty || 0) : Number(qty || 0);
  const bad = !/^\d+$/.test(qty) || (mode !== "SET" && Number(qty) < 1) || after < 0;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{tr("Adjust stock")}</DialogTitle>
          <DialogDescription>{item.productName}{item.variantName ? ` — ${item.variantName}` : ""} · now {item.stock}</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-3">
          <Field label={tr("What happened?")}>
            <Select value={mode} onChange={(e) => { const m = e.target.value as typeof mode; setMode(m); setReason(m === "ADD" ? "RESTOCK" : m === "REMOVE" ? "DAMAGED" : "ADJUSTMENT"); }}>
              <option value="ADD">{tr("Received stock (add)")}</option>
              <option value="REMOVE">{tr("Took stock out (remove)")}</option>
              <option value="SET">{tr("Stock count (set exact number)")}</option>
            </Select>
          </Field>
          <Field label={mode === "SET" ? tr("Counted quantity") : tr("Units")} error={after < 0 ? tr("Cannot go below zero") : undefined}>
            <Input type="number" min={0} value={qty} onChange={(e) => setQty(e.target.value)} autoFocus />
          </Field>
          <Field label={tr("Reason")}>
            <Select value={reason} onChange={(e) => setReason(e.target.value)}>
              {["RESTOCK", "ADJUSTMENT", "DAMAGED", "TRANSFER"].map((r) => <option key={r} value={r}>{titleCase(r)}</option>)}
            </Select>
          </Field>
          <Field label={tr("Note")}><Input value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} /></Field>
          {qty !== "" && !bad && <p className="text-xs text-muted-foreground">{tr("Stock will go from")}{" "}<b>{item.stock}</b>{" "}{tr("to")}{" "}<b>{after}</b>.</p>}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{tr("Cancel")}</Button>
          <Button loading={save.isPending} disabled={bad} onClick={() => save.mutate()}>{tr("Update stock")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BulkDialog({ onClose }: { onClose: () => void }) {
  const file = useRef<HTMLInputElement>(null);
  const [f, setF] = useState<File | null>(null);
  const [mode, setMode] = useState<"set" | "add">("set");
  const [res, setRes] = useState<BulkStockResult | null>(null);
  const run = useAct((dry: boolean) => inventoryApi.bulk(f!, mode, dry), {
    invalidate: [["inventory"], ["products"]],
    onSuccess: (r) => {
      setRes(r);
      if (!r.dryRun) toast.success(`${r.updated} updated${r.errors ? `, ${r.errors} skipped` : ""}`);
    },
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{tr("Update stock from a CSV")}</DialogTitle>
          <DialogDescription>{tr("Columns:")}{" "}<code>{tr("sku")}</code> (variant SKU or product code), <code>{tr("stock")}</code>, optional <code>{tr("note")}</code>. Check first, then apply.</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <input ref={file} type="file" accept=".csv,text/csv" hidden onChange={(e) => { setF(e.target.files?.[0] ?? null); setRes(null); }} />
            <Button variant="outline" size="sm" onClick={() => file.current?.click()}><Upload /> {f ? f.name : tr("Choose CSV file")}</Button>
            <Select value={mode} onChange={(e) => { setMode(e.target.value as "set" | "add"); setRes(null); }} className="w-auto">
              <option value="set">{tr("File holds the new stock")}</option>
              <option value="add">{tr("File holds units received (add)")}</option>
            </Select>
          </div>
          {res && (
            <div className="rounded border border-border">
              <p className="border-b border-border bg-muted/50 px-3 py-2 text-[13px] font-medium">
                {res.dryRun ? tr("Check result (nothing changed yet): ") : tr("Done: ")}{res.updated} to update · {res.unchanged} unchanged · {res.errors} with problems
              </p>
              <ul className="max-h-64 divide-y divide-border overflow-y-auto text-[13px]">
                {res.results.map((r) => (
                  <li key={r.line} className="flex items-center justify-between gap-3 px-3 py-1.5">
                    <span>Line {r.line} · <b>{r.sku}</b></span>
                    {r.status === "error" ? <span className="text-destructive">{r.error}</span> : <span className="text-muted-foreground">{r.before} → {r.after}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{tr("Close")}</Button>
          <Button variant="outline" disabled={!f} loading={run.isPending && run.variables === true} onClick={() => run.mutate(true)}>{tr("Check file")}</Button>
          <Button disabled={!f || !res || !!res.dryRun === false || res.updated === 0} loading={run.isPending && run.variables === false} onClick={() => run.mutate(false)}>{tr("Apply changes")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const D = { search: "", state: "", tab: "general", reason: "", from: "", to: "", page: "1" };

export default function Inventory() {
  const [f, setF] = useUrlState(D);
  const search = f.search; // SearchInput waits for a pause in typing before it changes the URL
  const [adj, setAdj] = useState<InventoryItem | null>(null);
  const [bulk, setBulk] = useState(false);

  const currentTab = f.tab === "medicine" ? "medicine" : f.tab === "logs" ? "logs" : "general";
  const scope: "general" | "medicine" = currentTab === "medicine" ? "medicine" : "general";

  const sum = useQuery({
    queryKey: ["inventory", "summary", scope],
    queryFn: () => inventoryApi.summary(scope),
  });
  const items = useInfiniteList(
    ["inventory", "items", scope, search, f.state],
    (page) => inventoryApi.items({ search, state: f.state || undefined, scope, page, limit: 20 }),
    { enabled: currentTab !== "logs" },
  );
  const logs = useInfiniteList(
    ["inventory", "logs", f.reason, f.from, f.to],
    (page) => inventoryApi.logs({ reason: f.reason, from: f.from, to: f.to ? `${f.to}T23:59:59` : undefined, page, limit: 20 }),
    { enabled: currentTab === "logs" },
  );
  const s = sum.data;

  const generalCols: Column<InventoryItem>[] = [
    {
      key: "item",
      header: tr("Item"),
      sk: "lines2",
      cell: (i) => (
        <div className="max-w-[320px]">
          <div className="flex items-center gap-1.5">
            <Link to={`/products/${i.productId}/edit`} target="_blank" rel="noopener noreferrer" className="block truncate font-medium hover:text-primary">
              {i.productName}
            </Link>
            {!i.trackStock && (
              <span className="inline-flex items-center rounded bg-emerald-100 px-1 py-0 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                {tr("Fresh")}
              </span>
            )}
          </div>
          <p className="truncate text-[11px] text-muted-foreground">{[i.variantName, i.sku].filter(Boolean).join(" · ") || "—"}</p>
        </div>
      ),
    },
    { key: "status", header: tr("Status"), sk: "badge", cell: (i) => <StatusBadge status={i.status} /> },
    {
      key: "stock",
      header: tr("In stock"),
      align: "right",
      sk: "num",
      cell: (i) => (!i.trackStock ? <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{tr("Daily Fresh")}</span> : <b>{i.stock}</b>),
    },
    {
      key: "state",
      header: tr("Level"),
      sk: "badge",
      cell: (i) =>
        !i.trackStock ? (
          <StatusBadge status="in" label={tr("Available")} />
        ) : (
          <StatusBadge
            status={i.state}
            label={i.state === "in" ? tr("In stock") : i.state === "low" ? tr("Low (≤{{n}})", { n: num(i.threshold) }) : tr("Out")}
          />
        ),
    },
    {
      key: "cost",
      header: tr("Value (cost)"),
      align: "right",
      sk: "num",
      cell: (i) => (!i.trackStock ? <span className="text-muted-foreground">—</span> : money(Number(i.cost) * i.stock)),
    },
    {
      key: "act",
      header: "",
      align: "right",
      sk: "btn",
      cell: (i) =>
        !i.trackStock ? (
          <span className="text-[11px] text-muted-foreground">{tr("Not counted")}</span>
        ) : (
          <Button size="xs" variant="outline" onClick={() => setAdj(i)}>
            <SlidersHorizontal /> {tr("Adjust")}
          </Button>
        ),
    },
  ];

  const medicineCols: Column<InventoryItem>[] = [
    {
      key: "item",
      header: tr("Medicine"),
      sk: "lines2",
      cell: (i) => (
        <div className="max-w-[340px]">
          <div className="flex items-center gap-1.5">
            <Link to={`/products/${i.productId}/edit`} target="_blank" rel="noopener noreferrer" className="block truncate font-medium hover:text-primary">
              {i.productName}
            </Link>
            <span className="inline-flex items-center rounded bg-blue-100 px-1 py-0 text-[10px] font-semibold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
              {tr("Medicine")}
            </span>
          </div>
          <p className="truncate text-[11px] text-muted-foreground">{[i.variantName, i.sku].filter(Boolean).join(" · ") || "—"}</p>
        </div>
      ),
    },
    { key: "status", header: tr("Status"), sk: "badge", cell: (i) => <StatusBadge status={i.status} /> },
    {
      key: "stock",
      header: tr("In stock"),
      align: "right",
      sk: "badge",
      cell: () => (
        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          {tr("Unlimited")}
        </span>
      ),
    },
    {
      key: "state",
      header: tr("Level"),
      sk: "badge",
      cell: () => <StatusBadge status="in" label={tr("Available")} />,
    },
    { key: "cost", header: tr("Cost price"), align: "right", sk: "num", cell: (i) => money(i.cost) },
    { key: "retail", header: tr("Retail (MRP)"), align: "right", sk: "num", cell: (i) => money(i.retail) },
    {
      key: "act",
      header: "",
      align: "right",
      sk: "none",
      cell: () => <span className="text-[11px] text-muted-foreground">{tr("Not counted")}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title={tr("Inventory")}
        description={tr("Stock levels, adjustments and the full movement history.")}
        actions={
          <>
            <DownloadButton path="/admin/inventory/export" params={{ search, state: f.state, scope }} filename={`inventory-${scope}.csv`} />
            {currentTab === "general" && (
              <Button variant="outline" size="sm" onClick={() => setBulk(true)}>
                <Upload />{" "}{tr("Bulk update")}
              </Button>
            )}
          </>
        }
      />

      {currentTab === "medicine" ? (
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
          <StatCard hintSk label={tr("Medicine items")} value={s ? num(s.skuCount) : "—"} hint={tr("Catalog total")} icon={<Pill className="size-4" />} loading={sum.isLoading} />
          <StatCard label={tr("Stock count policy")} value={tr("Unlimited")} hint={tr("Stock count is not tracked for medicines")} icon={<Wallet className="size-4" />} tone="green" loading={sum.isLoading} />
          <StatCard label={tr("Catalog status")} value={tr("Available")} hint={tr("Always in-stock for customer orders")} icon={<Boxes className="size-4" />} tone="fresh" loading={sum.isLoading} />
        </div>
      ) : (
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard hintSk label={tr("Units on hand")} value={s ? num(s.unitsOnHand) : "—"} hint={s ? tr("{{n}} items tracked", { n: num(s.skuCount) }) : undefined} icon={<Boxes className="size-4" />} loading={sum.isLoading} />
          <StatCard hintSk label={tr("Stock value (cost)")} value={s ? money(s.stockValueAtCost) : "—"} hint={s ? tr("{{amount}} at retail", { amount: money(s.stockValueAtRetail) }) : undefined} icon={<Wallet className="size-4" />} tone="green" loading={sum.isLoading} />
          <StatCard label={tr("Low stock")} value={s?.lowStock ?? "—"} icon={<AlertTriangle className="size-4" />} tone="fresh" loading={sum.isLoading} onClick={() => setF({ tab: "general", state: "low" })} />
          <StatCard label={tr("Out of stock")} value={s?.outOfStock ?? "—"} icon={<PackageX className="size-4" />} tone="red" loading={sum.isLoading} onClick={() => setF({ tab: "general", state: "out" })} />
        </div>
      )}

      <Tabs value={currentTab} onValueChange={(t) => setF({ tab: t, state: "", page: "1" })}>
        <TabsList className="mb-3">
          <TabsTrigger value="general" className="gap-1.5">
            <Boxes className="size-3.5" />
            {tr("General Products")}
          </TabsTrigger>
          <TabsTrigger value="medicine" className="gap-1.5">
            <Pill className="size-3.5" />
            {tr("Medicine")}
          </TabsTrigger>
          <TabsTrigger value="logs">
            {tr("Movement history")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <DataTable
            infinite={items}
            columns={generalCols}
            rowKey={(i) => `${i.productId}-${i.variantId ?? ""}`}
            empty={{ title: tr("Nothing here"), description: tr("No products match the filters.") }}
            toolbar={
              <FilterBar>
                <SearchInput value={f.search} onChange={(v) => setF({ search: v })} placeholder={tr("Product, variant, SKU…")} />
                <FilterSelect value={f.state} onChange={(v) => setF({ state: v })} all={tr("All levels")} options={[{ value: "low", label: tr("Low stock") }, { value: "out", label: tr("Out of stock") }]} />
              </FilterBar>
            }
          />
        </TabsContent>

        <TabsContent value="medicine">
          <DataTable
            infinite={items}
            columns={medicineCols}
            rowKey={(i) => `${i.productId}-${i.variantId ?? ""}`}
            empty={{ title: tr("No medicines found"), description: tr("Try searching by generic or brand name.") }}
            toolbar={
              <FilterBar>
                <SearchInput value={f.search} onChange={(v) => setF({ search: v })} placeholder={tr("Medicine name, generic, SKU…")} />
              </FilterBar>
            }
          />
        </TabsContent>

        <TabsContent value="logs">
          <DataTable
            infinite={logs}
            columns={[
              { key: "when", header: tr("When"), cell: (l) => <span className="text-[13px]">{dateTime(l.createdAt)}</span> },
              { key: "item", header: tr("Item"), sk: "lines2", cell: (l) => <div className="max-w-[260px] truncate"><span className="font-medium">{l.product.name}</span>{l.variant && <span className="text-muted-foreground"> — {l.variant.name}</span>}</div> },
              { key: "reason", header: tr("Reason"), cell: (l) => <StatusBadge status={l.reason} /> },
              { key: "change", header: tr("Change"), align: "right", cell: (l) => <b className={l.change > 0 ? "text-emerald-600" : l.change < 0 ? "text-destructive" : ""}>{l.change > 0 ? `+${l.change}` : l.change}</b> },
              { key: "qty", header: tr("Stock"), align: "right", cell: (l) => `${l.quantityBefore} → ${l.quantityAfter}` },
              { key: "ref", header: tr("Reference / note"), cell: (l) => <span className="text-xs text-muted-foreground">{[l.reference, l.note].filter(Boolean).join(" · ") || "—"}</span> },
              { key: "by", header: tr("By"), cell: (l) => <span className="text-xs">{l.admin?.name ?? tr("System")}</span> },
            ] as Column<(typeof logs.rows)[number]>[]}
            empty={{ title: tr("No stock movements") }}
            toolbar={
              <FilterBar>
                <FilterSelect value={f.reason} onChange={(v) => setF({ reason: v })} all={tr("All reasons")} options={["RESTOCK", "SALE", "RETURN", "ADJUSTMENT", "DAMAGED", "TRANSFER"].map((r) => ({ value: r, label: titleCase(r) }))} />
                <DateInput label={tr("From")} value={f.from} onChange={(v) => setF({ from: v })} />
                <DateInput label={tr("To")} value={f.to} onChange={(v) => setF({ to: v })} />
              </FilterBar>
            }
          />
        </TabsContent>
      </Tabs>
      {adj && <AdjustDialog item={adj} onClose={() => setAdj(null)} />}
      {bulk && <BulkDialog onClose={() => setBulk(false)} />}
    </div>
  );
}

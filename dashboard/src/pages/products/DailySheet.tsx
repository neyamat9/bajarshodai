import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { buildCategoryTree, categoriesApi, flattenCategoryTree } from "@/api/catalog";
import { productsApi, type ProductRow } from "@/api/products";
import { errorMessage } from "@/api/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox, Input } from "@/components/ui/input";
import { FilterBar, FilterSelect, SearchInput } from "@/components/shared/FilterBar";
import { EmptyState, ErrorState } from "@/components/shared/EmptyState";
import { Thumb } from "@/components/shared/Thumb";
import { ListPageSkeleton } from "@/components/shared/skeletons";
import { useUrlState } from "@/hooks/useUrlState";
import { useAct } from "@/hooks/useAct";
import { money, num } from "@/lib/format";
import { tr } from "@/i18n";

interface Edit {
  price?: string;
  stock?: string;
  active?: boolean;
}

const DEFAULTS = { search: "", categoryId: "" };
const TEXT = tr("Fish and vegetable prices change every day. Type the new price or stock, then save all the changes at once.");

/** The daily sheet: one table to update the price, the stock and the on/off state of many products in one go. */
export default function DailySheet() {
  const qc = useQueryClient();
  const [f, setF] = useUrlState(DEFAULTS);
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const cats = useQuery({ queryKey: ["categories"], queryFn: categoriesApi.list });
  const q = useQuery({
    queryKey: ["daily-sheet", f.search, f.categoryId],
    queryFn: () => productsApi.list({ search: f.search, categoryId: f.categoryId, sortBy: "name", limit: 100 }),
  });

  const rows = useMemo(() => q.data?.data ?? [], [q.data]);
  const patch = (id: string, e: Edit) => setEdits((cur) => ({ ...cur, [id]: { ...cur[id], ...e } }));

  // only the rows that really differ from what is saved
  const changes = useMemo(() => {
    const out: { id: string; sellingPrice?: number; stock?: number; status?: "ACTIVE" | "INACTIVE" }[] = [];
    for (const p of rows) {
      const e = edits[p.id];
      if (!e) continue;
      const row: (typeof out)[number] = { id: p.id };
      if (e.price !== undefined && e.price !== "" && Number(e.price) !== Number(p.sellingPrice)) row.sellingPrice = Number(e.price);
      if (e.stock !== undefined && e.stock !== "" && Number(e.stock) !== Number(p.stock)) row.stock = Number(e.stock);
      if (e.active !== undefined && e.active !== (p.status === "ACTIVE")) row.status = e.active ? "ACTIVE" : "INACTIVE";
      if (Object.keys(row).length > 1) out.push(row);
    }
    return out;
  }, [rows, edits]);

  const save = useAct(() => productsApi.dailySheet(changes), {
    invalidate: [["daily-sheet"], ["products"], ["inventory"]],
    onSuccess: (r) => {
      const failed = r.results.filter((x) => !x.ok);
      if (failed.length) toast.error(`${failed.length} not saved: ${failed.slice(0, 3).map((x) => `${x.name ?? "product"} (${x.error})`).join("; ")}`);
      else toast.success(`${r.saved} product${r.saved === 1 ? "" : "s"} updated`);
      // keep the edits of the rows that failed, drop the rest
      setEdits((cur) => Object.fromEntries(Object.entries(cur).filter(([id]) => failed.some((x) => x.id === id))));
      void qc.invalidateQueries({ queryKey: ["daily-sheet"] });
    },
  });

  const unitLabel = (p: ProductRow) => p.unit?.shortLabel ?? "";

  return (
    <div>
      <PageHeader
        title={tr("Daily prices & stock")}
        description={TEXT}
        actions={
          <Button variant="brand" size="sm" disabled={changes.length === 0} loading={save.isPending} onClick={() => save.mutate()}>
            <Save /> {changes.length > 0 ? tr("Save {{n}} changes", { n: num(changes.length) }) : tr("Save changes")}
          </Button>
        }
      />
      <Card>
        <FilterBar>
          <SearchInput value={f.search} onChange={(v) => setF({ search: v })} placeholder={tr("Search by name…")} />
          <FilterSelect
            value={f.categoryId}
            onChange={(v) => setF({ categoryId: v })}
            all={tr("All categories")}
            options={flattenCategoryTree(buildCategoryTree(cats.data ?? [])).map((o) => ({ value: o.node.id, label: `${"— ".repeat(o.depth)}${o.node.name}` }))}
          />
        </FilterBar>

        {q.isLoading ? (
          <ListPageSkeleton cols={5} />
        ) : q.isError ? (
          <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState title={tr("No products found")} description={tr("Change the search or the category.")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2 font-medium">{tr("Product")}</th>
                  <th className="px-3 py-2 font-medium">{tr("Price now")}</th>
                  <th className="px-3 py-2 font-medium">{tr("New price ৳")}</th>
                  <th className="px-3 py-2 font-medium">{tr("Stock now")}</th>
                  <th className="px-3 py-2 font-medium">{tr("New stock")}</th>
                  <th className="px-3 py-2 font-medium">{tr("On the shop")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const e = edits[p.id] ?? {};
                  const hasVariants = p._count.variants > 0;
                  const dirty = changes.some((c) => c.id === p.id);
                  return (
                    <tr key={p.id} className={`border-b border-border last:border-0 ${dirty ? "bg-amber-50/60 dark:bg-amber-500/5" : ""}`}>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-3">
                          <Thumb src={p.mainImage} alt={p.name} className="size-9" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate font-medium">{p.nameBn || p.name}</p>
                              {!p.trackStock && (
                                <span className="inline-flex items-center rounded-full bg-emerald-100 px-1.5 py-0 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                  {tr("Fresh")}
                                </span>
                              )}
                            </div>
                            <p className="truncate text-[11px] text-muted-foreground">{p.nameBn ? `${p.name} · ` : ""}{p.categoryName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 tabular-nums">{money(p.sellingPrice)}{unitLabel(p) && <span className="text-[11px] text-muted-foreground"> / {unitLabel(p)}</span>}</td>
                      <td className="px-3 py-2">
                        <Input className="h-8 w-28" type="number" min={0} step="0.01" value={e.price ?? ""} placeholder={String(Number(p.sellingPrice))} onChange={(ev) => patch(p.id, { price: ev.target.value })} aria-label={`New price of ${p.name}`} />
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {!p.trackStock ? (
                          <span className="text-[12px] font-medium text-emerald-600 dark:text-emerald-400">{tr("Fresh bazaar")}</span>
                        ) : (
                          <>
                            {Number(p.stock)}{unitLabel(p) && <span className="text-[11px] text-muted-foreground"> {unitLabel(p)}</span>}
                            {p.stockState === "low" && <Badge variant="warning" className="ml-1">{tr("low")}</Badge>}
                            {p.stockState === "out" && <Badge variant="danger" className="ml-1">{tr("out")}</Badge>}
                          </>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {!p.trackStock ? (
                          <span className="text-[11px] text-muted-foreground italic">{tr("No count needed")}</span>
                        ) : hasVariants ? (
                          <span className="text-[11px] text-muted-foreground">{tr("Has variants: set stock on each")}</span>
                        ) : (
                          <Input className="h-8 w-28" type="number" min={0} step="0.001" value={e.stock ?? ""} placeholder={String(Number(p.stock))} onChange={(ev) => patch(p.id, { stock: ev.target.value })} aria-label={`New stock of ${p.name}`} />
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <label className="flex cursor-pointer items-center gap-2">
                          <Checkbox checked={e.active ?? p.status === "ACTIVE"} onChange={(ev) => patch(p.id, { active: ev.target.checked })} aria-label={tr("Show {{name}} on the shop", { name: p.name })} />
                          <span className="text-[11px] text-muted-foreground">{(e.active ?? p.status === "ACTIVE") ? tr("Live") : tr("Hidden")}</span>
                        </label>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {rows.length === 100 && <p className="mt-2 text-xs text-muted-foreground">{tr("Showing the first 100: use the search or a category to narrow the list.")}</p>}
    </div>
  );
}

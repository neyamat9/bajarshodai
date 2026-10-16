import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Boxes, CheckCircle2, EyeOff, PackageX, Package, Percent, Trophy } from "lucide-react";
import { productsApi } from "@/api/products";
import { StatCard } from "@/components/shared/StatCard";
import { money, num } from "@/lib/format";
import { openInNewTab } from "@/lib/utils";
import { tr } from "@/i18n";

export interface ProductCardFilter {
  status: string;
  visibility: string;
  stock: string;
  onDiscount: string;
}
const none: ProductCardFilter = { status: "", visibility: "", stock: "", onDiscount: "" };

/** The cards above the products list (whole catalogue). Clicking one filters the list to it; clicking it again clears it. */
export function ProductStatCards({ current, onPick }: { current: ProductCardFilter; onPick: (f: ProductCardFilter) => void }) {
  const q = useQuery({ queryKey: ["products", "stats"], queryFn: productsApi.stats, placeholderData: (p) => p });
  const s = q.data;
  const loading = q.isLoading;
  const only = (key: keyof ProductCardFilter, value: string) => current[key] === value && Object.entries(current).every(([k, v]) => (k === key ? true : !v));
  const pick = (key: keyof ProductCardFilter, value: string) => () => onPick(only(key, value) ? none : { ...none, [key]: value });
  const isAll = Object.values(current).every((v) => !v);

  return (
    <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard hintSk label={tr("Total products")} value={s ? num(s.total) : ""} hint={s ? tr("{{live}} live · {{hidden}} hidden", { live: num(s.active), hidden: num(s.hidden) }) : undefined} icon={<Boxes size={18} />} loading={loading} active={isAll} onClick={() => onPick(none)} />
      <StatCard hintSk label={tr("Live on the shop")} tone="green" value={s ? num(s.active) : ""} hint={s ? tr("active products") : undefined} icon={<CheckCircle2 size={18} />} loading={loading} active={only("status", "ACTIVE")} onClick={pick("status", "ACTIVE")} />
      <StatCard hintSk label={tr("Draft / hidden")} tone="fresh" value={s ? num(s.hidden) : ""} hint={s ? tr("draft + inactive") : undefined} icon={<EyeOff size={18} />} loading={loading} active={only("visibility", "hidden")} onClick={pick("visibility", "hidden")} />
      <StatCard hintSk label={tr("Low stock")} tone="fresh" value={s ? num(s.lowStock) : ""} hint={s ? tr("at or below the alert level") : undefined} icon={<AlertTriangle size={18} />} loading={loading} active={only("stock", "low")} onClick={pick("stock", "low")} />
      <StatCard hintSk label={tr("Out of stock")} tone="red" value={s ? num(s.outOfStock) : ""} hint={s ? tr("can't be bought") : undefined} icon={<PackageX size={18} />} loading={loading} active={only("stock", "out")} onClick={pick("stock", "out")} />
      <StatCard hintSk label={tr("Stock value")} tone="sky" value={s ? money(s.stockValueAtCost) : ""} hint={s ? tr("{{amount}} at retail", { amount: money(s.stockValueAtRetail) }) : undefined} icon={<Package size={18} />} loading={loading} />
      <StatCard
        hintSk
        label={tr("Best seller (30 days)")}
        tone="green"
        value={s ? (s.bestSeller ? tr("{{n}} sold", { n: num(s.bestSeller.units) }) : "—") : ""}
        hint={s ? (s.bestSeller?.name ?? tr("no sales yet")) : undefined}
        icon={<Trophy size={18} />}
        loading={loading}
        onClick={s?.bestSeller ? () => openInNewTab(`/products/${s.bestSeller!.id}/edit`) : undefined}
      />
      <StatCard hintSk label={tr("On discount now")} value={s?.onDiscount.toLocaleString() ?? ""} hint={s ? "live promo price" : undefined} icon={<Percent size={18} />} loading={loading} active={only("onDiscount", "true")} onClick={pick("onDiscount", "true")} />
    </div>
  );
}

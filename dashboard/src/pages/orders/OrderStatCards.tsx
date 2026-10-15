import { useQuery } from "@tanstack/react-query";
import { Ban, Banknote, CheckCircle2, Clock, Package, ShoppingBag, Truck, Wallet } from "lucide-react";
import { ordersApi, type OrderFilters } from "@/api/orders";
import { StatCard } from "@/components/shared/StatCard";
import { money, num } from "@/lib/format";
import { tr } from "@/i18n";

export interface OrderCardFilter {
  stage: string;
  toVerify: string;
}

const pct = (n: number, of: number) => (of ? `${Math.round((n / of) * 100)}% of all orders` : "—");

/**
 * The cards above the orders list. Numbers follow the page's search, date, source and payment filters (not the status);
 * clicking a card filters the list to it, clicking it again clears it.
 */
export function OrderStatCards({ filters, stage, toVerify, onPick }: { filters: OrderFilters; stage: string; toVerify: string; onPick: (f: OrderCardFilter) => void }) {
  const { page: _p, limit: _l, sortBy: _s, status: _st, stage: _sg, toVerify: _tv, ...base } = filters;
  void [_p, _l, _s, _st, _sg, _tv];
  const q = useQuery({ queryKey: ["orders", "stats", base], queryFn: () => ordersApi.stats(base), placeholderData: (p) => p });
  const s = q.data;
  const loading = q.isLoading;
  const none: OrderCardFilter = { stage: "", toVerify: "" };
  const toggle = (next: OrderCardFilter, on: boolean) => () => onPick(on ? none : next);
  const isAll = !stage && !toVerify && !filters.status;

  return (
    <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard hintSk label={tr("Total orders")} value={num(s?.total)} hint={s ? tr("{{n}} today", { n: num(s.today) }) : undefined} icon={<ShoppingBag size={18} />} loading={loading} active={isAll} onClick={() => onPick(none)} />
      <StatCard hintSk label={tr("To confirm")} tone="fresh" value={num(s?.pending)} hint={s ? (s.onHold ? tr("+{{n}} on hold", { n: num(s.onHold) }) : tr("waiting for you")) : undefined} icon={<Clock size={18} />} loading={loading} active={stage === "pending"} onClick={toggle({ stage: "pending", toVerify: "" }, stage === "pending")} />
      <StatCard hintSk label={tr("To ship")} tone="sky" value={s?.toShip.toLocaleString() ?? ""} hint={s ? "confirmed + processing" : undefined} icon={<Package size={18} />} loading={loading} active={stage === "toShip"} onClick={toggle({ stage: "toShip", toVerify: "" }, stage === "toShip")} />
      <StatCard hintSk label={tr("In delivery")} value={s?.inDelivery.toLocaleString() ?? ""} hint={s ? "shipped, on the way" : undefined} icon={<Truck size={18} />} loading={loading} active={stage === "inDelivery"} onClick={toggle({ stage: "inDelivery", toVerify: "" }, stage === "inDelivery")} />
      <StatCard hintSk label={tr("Delivered")} tone="green" value={s?.delivered.toLocaleString() ?? ""} hint={s ? pct(s.delivered, s.total) : undefined} icon={<CheckCircle2 size={18} />} loading={loading} active={stage === "delivered"} onClick={toggle({ stage: "delivered", toVerify: "" }, stage === "delivered")} />
      <StatCard hintSk label={tr("Payment to verify")} tone="fresh" value={s?.paymentToVerify.toLocaleString() ?? ""} hint={s ? "bKash · Nagad · Rocket" : undefined} icon={<Wallet size={18} />} loading={loading} active={toVerify === "true"} onClick={toggle({ stage: "", toVerify: "true" }, toVerify === "true")} />
      <StatCard hintSk label={tr("Revenue")} tone="fresh" value={s ? money(s.revenue) : ""} hint={s ? tr("{{n}} today", { n: money(s.revenueToday) }) : undefined} icon={<Banknote size={18} />} loading={loading} />
      <StatCard hintSk label={tr("Cancelled / returned")} tone="red" value={s?.ended.toLocaleString() ?? ""} hint={s ? pct(s.ended, s.total) : undefined} icon={<Ban size={18} />} loading={loading} active={stage === "ended"} onClick={toggle({ stage: "ended", toVerify: "" }, stage === "ended")} />
    </div>
  );
}

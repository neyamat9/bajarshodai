import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bike, Phone, UserCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Section } from "@/components/shared/Field";
import { deliveriesApi, failReasonLabel } from "@/api/deliveries";
import type { OrderDetail } from "@/api/orders";
import { useAct } from "@/hooks/useAct";
import { useAuth } from "@/store/auth";
import { can } from "@/lib/access";
import { dateTime, money, num } from "@/lib/format";
import { AssignDialog } from "@/pages/deliveries/AssignDialog";
import { tr } from "@/i18n";

const LABEL: Record<string, { text: string; variant: "neutral" | "info" | "fresh" | "success" | "danger" | "warning" }> = {
  ASSIGNED: { text: tr("Given, not accepted yet"), variant: "warning" },
  ACCEPTED: { text: tr("Accepted"), variant: "info" },
  PICKED_UP: { text: tr("Picked up"), variant: "info" },
  ON_THE_WAY: { text: tr("On the way"), variant: "fresh" },
  DELIVERED: { text: tr("Delivered"), variant: "success" },
  FAILED: { text: tr("Not delivered"), variant: "danger" },
  CANCELLED: { text: tr("Taken back"), variant: "neutral" },
};

/** Who is delivering this order, how far they got, and the button to give it to someone (or take it back). */
export function RiderCard({ order, locked }: { order: OrderDetail; locked: boolean }) {
  const me = useAuth((s) => s.user);
  const mayAssign = can(me, "delivery.manage", "orders.assign");
  const [open, setOpen] = useState(false);
  const d = order.delivery;
  const riders = useQuery({ queryKey: ["deliveries", "riders"], queryFn: deliveriesApi.riders, enabled: open });
  const takeBack = useAct(() => deliveriesApi.unassign(d!.id), { success: tr("Taken back"), invalidate: [["order", order.id], ["orders"], ["deliveries"]] });

  // a walk-in sale has nothing to deliver
  if (!order.shippingAddress) return null;

  const st = d ? LABEL[d.status] : null;
  const live = d && ["ASSIGNED", "ACCEPTED", "PICKED_UP", "ON_THE_WAY"].includes(d.status);
  const canGive = mayAssign && !locked && order.status !== "PENDING" && !(d && d.status === "DELIVERED");

  return (
    <Section title={tr("Rider")} actions={<Bike className="size-4 text-muted-foreground" />}>
      {!d || d.status === "CANCELLED" ? (
        <p className="text-[13px] text-muted-foreground">{d ? tr("Taken back from the rider.") : tr("Not given to a rider yet.")}</p>
      ) : (
        <div className="space-y-2 text-[13px]">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold">{d.assignee.name}{d.assignee.staffTitle ? <span className="font-normal text-muted-foreground"> · {d.assignee.staffTitle}</span> : null}</p>
            {st && <Badge variant={st.variant}>{tr(st.text)}</Badge>}
          </div>
          {d.assignee.phone && <a href={`tel:${d.assignee.phone}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline dark:text-fresh-400"><Phone className="size-3" /> {d.assignee.phone}</a>}
          {d.attempts > 1 && <p className="text-xs text-muted-foreground">{tr("Attempt {{n}}", { n: num(d.attempts) })}</p>}
          {d.status === "FAILED" && <p className="text-destructive">{failReasonLabel(d.failedReason)}: give it to a rider again or contact the customer.</p>}
          {d.cashCollected !== null && Number(d.cashCollected) > 0 && (
            <p className="text-xs text-muted-foreground">Cash taken {money(d.cashCollected)} · {d.cashHandedOverAt ? `received by the shop ${dateTime(d.cashHandedOverAt)}` : "still with the rider"}</p>
          )}
          <ol className="relative mt-1 space-y-2 border-l border-border pl-4">
            {d.events.map((e) => (
              <li key={e.id} className="relative">
                <span className="absolute -left-[21px] top-1 size-2 rounded-full bg-fresh-500 ring-4 ring-card" />
                <p className="text-xs">{e.note ?? tr(LABEL[e.status]?.text ?? "")}</p>
                <p className="text-[11px] text-muted-foreground">{e.actorName ? `${e.actorName} · ` : ""}{dateTime(e.createdAt)}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {(canGive || (mayAssign && live)) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {canGive && <Button size="xs" onClick={() => setOpen(true)}><UserCheck /> {live ? tr("Move to another rider") : d?.status === "FAILED" ? tr("Give again") : tr("Give to a rider")}</Button>}
          {mayAssign && live && <Button size="xs" variant="outline" loading={takeBack.isPending} onClick={() => takeBack.mutate()}><X />{" "}{tr("Take back")}</Button>}
        </div>
      )}
      {mayAssign && order.status === "PENDING" && <p className="mt-2 text-xs text-muted-foreground">{tr("Confirm the order first, then give it to a rider.")}</p>}
      {open && <AssignDialog orderIds={[order.id]} riders={riders.data ?? []} current={live ? d?.assignee.id : undefined} onClose={() => setOpen(false)} />}
    </Section>
  );
}

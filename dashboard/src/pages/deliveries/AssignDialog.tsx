import { useState } from "react";
import { toast } from "sonner";
import { UserCheck } from "lucide-react";
import { deliveriesApi, type Rider } from "@/api/deliveries";
import { Field } from "@/components/shared/Field";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAct } from "@/hooks/useAct";
import { useAuth } from "@/store/auth";

/** Pick who gets the orders. Riders show what they are carrying, so the work can be shared out. */
export function AssignDialog({ orderIds, riders, onClose, current }: { orderIds: string[]; riders: Rider[]; onClose: () => void; current?: string }) {
  const me = useAuth((s) => s.user);
  const [rider, setRider] = useState(current && current !== "" ? "" : (riders.find((r) => r.id === me?.id)?.id ?? ""));
  const [note, setNote] = useState("");
  const run = useAct(() => deliveriesApi.assign(orderIds, rider, note), {
    invalidate: [["deliveries"], ["order"], ["orders"]],
    onSuccess: (r) => {
      if (r.failed) toast.error(r.results.filter((x) => !x.ok).map((x) => x.error).join(". "));
      if (r.assigned) toast.success(`${r.assigned} ${r.assigned === 1 ? "order" : "orders"} given to ${riders.find((x) => x.id === rider)?.name ?? "the rider"}`);
      onClose();
    },
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Give {orderIds.length === 1 ? "this order" : `${orderIds.length} orders`} to a rider</DialogTitle>
          <DialogDescription>The rider sees it on their phone under My deliveries.</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-3">
          {riders.length === 0 ? (
            <p className="rounded bg-amber-50 px-3 py-2 text-[13px] text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">Nobody can deliver yet. Open Staff and switch on “Can deliver” for the riders (or for yourself).</p>
          ) : (
            <div className="space-y-1.5" role="radiogroup" aria-label="Rider">
              {riders.map((r) => (
                <label key={r.id} className={`flex cursor-pointer items-center justify-between gap-3 rounded border px-3 py-2 text-[13px] ${rider === r.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}>
                  <span className="flex items-center gap-2">
                    <input type="radio" name="rider" checked={rider === r.id} onChange={() => setRider(r.id)} className="accent-[var(--color-brand)]" />
                    <span><b>{r.name}</b>{r.id === me?.id && " (me)"}<span className="block text-xs text-muted-foreground">{r.staffTitle ?? "Rider"} · {r.phone}</span></span>
                  </span>
                  <span className="text-right text-xs text-muted-foreground">{r.active} on now<br />{r.deliveredToday} done today</span>
                </label>
              ))}
            </div>
          )}
          <Field label="Note for the rider (optional)"><Textarea rows={2} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. keep the fish cold, call before arriving" /></Field>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!rider} loading={run.isPending} onClick={() => run.mutate()}><UserCheck /> Give to rider</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


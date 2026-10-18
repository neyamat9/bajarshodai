import { useState } from "react";
import { Scale, Minus, Plus, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, Textarea } from "@/components/ui/input";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/shared/Field";
import { Thumb } from "@/components/shared/Thumb";
import { ordersApi, type OrderDetail } from "@/api/orders";
import { useAct } from "@/hooks/useAct";
import { money } from "@/lib/format";
import { tr, lang } from "@/i18n";

interface Props {
  order: OrderDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PackerWeightDialog({ order, open, onOpenChange }: Props) {
  // Line items state with scale weights
  const [weights, setWeights] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const item of order.items) {
      const current = item.finalQty != null ? item.finalQty : item.quantity;
      initial[item.id] = String(current);
    }
    return initial;
  });

  const [note, setNote] = useState("");
  const [markPacked, setMarkPacked] = useState(
    order.status === "PENDING" || order.status === "CONFIRMED"
  );

  const save = useAct(
    () => {
      const itemsPayload = order.items.map((item) => {
        const val = parseFloat(weights[item.id] || "0");
        return {
          itemId: item.id,
          finalQty: Math.max(0.01, isNaN(val) ? item.quantity : val),
        };
      });

      return ordersApi.updateWeights(order.id, {
        items: itemsPayload,
        note: note.trim() || undefined,
        markPacked,
      });
    },
    {
      success: tr("Weights saved and order updated"),
      invalidate: [["order", order.id], ["orders"]],
      onSuccess: () => {
        onOpenChange(false);
      },
    }
  );

  // Calculate live totals
  let newSubtotal = 0;
  for (const item of order.items) {
    const qty = parseFloat(weights[item.id] || "0");
    const safeQty = isNaN(qty) || qty <= 0 ? item.quantity : qty;
    newSubtotal += safeQty * Number(item.price);
  }

  const oldSubtotal = Number(order.subtotal);
  const diff = newSubtotal - oldSubtotal;
  const oldTotal = Number(order.total);
  const newTotal = Math.max(0, oldTotal + diff);
  const currentPaid = Number(order.paidAmount);
  const newDue = Math.max(0, newTotal - currentPaid);

  const updateWeight = (itemId: string, val: string) => {
    setWeights((prev) => ({ ...prev, [itemId]: val }));
  };

  const adjustWeight = (itemId: string, step: number, allowDecimal: boolean) => {
    const current = parseFloat(weights[itemId] || "0");
    const safe = isNaN(current) ? 0 : current;
    let next = safe + step;
    if (next < (allowDecimal ? 0.05 : 1)) {
      next = allowDecimal ? 0.05 : 1;
    }
    if (allowDecimal) {
      next = Math.round(next * 100) / 100;
    } else {
      next = Math.round(next);
    }
    setWeights((prev) => ({ ...prev, [itemId]: String(next) }));
  };

  const resetToOrdered = (itemId: string, orderedQty: number) => {
    setWeights((prev) => ({ ...prev, [itemId]: String(orderedQty) }));
  };

  const isBn = lang() === "bn";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-fresh-100 text-fresh-700 dark:bg-fresh-900/40 dark:text-fresh-300">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>{tr("Packer Scale & Final Weights")}</DialogTitle>
              <DialogDescription>
                {tr("Enter scale-measured weights for items. Order total and due balance will update automatically.")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          <div className="divide-y divide-border rounded-lg border border-border">
            {order.items.map((item) => {
              const isWeighed = !!item.product?.isWeighed;
              const unit = item.product?.unit;
              const unitLabel = isBn
                ? (unit?.shortLabelBn || unit?.shortLabel || (isWeighed ? "কেজি" : "পিস"))
                : (unit?.shortLabel || (isWeighed ? "kg" : "pcs"));
              const allowDecimal = unit?.allowDecimal ?? isWeighed;
              const step = unit?.defaultStep ?? (allowDecimal ? 0.1 : 1);
              const currentWeightVal = parseFloat(weights[item.id] || "0");
              const currentLineTotal = (isNaN(currentWeightVal) ? 0 : currentWeightVal) * Number(item.price);
              const originalQty = item.orderedQty ?? item.quantity;
              const originalLineTotal = Number(item.total);
              const lineDiff = currentLineTotal - originalLineTotal;

              return (
                <div key={item.id} className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isWeighed ? "bg-fresh-50/40 dark:bg-fresh-950/20" : ""}`}>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Thumb src={item.productImage} alt={item.productName} className="size-12 shrink-0 rounded-md" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-medium leading-snug">{item.productName}</span>
                        {isWeighed ? (
                          <Badge variant="fresh" className="text-[10px] gap-1 px-1.5 py-0">
                            <Scale className="h-3 w-3" />
                            {tr("Weighed")}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.variantName ? `${item.variantName} · ` : ""}
                        {tr("Ordered")}: <strong className="text-foreground">{originalQty} {unitLabel}</strong>
                        {" · "}
                        {money(item.price)} / {unitLabel}
                      </p>
                    </div>
                  </div>

                  {/* Scale Input and Line Total */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          className="h-8 w-7 px-0"
                          onClick={() => adjustWeight(item.id, -step, allowDecimal)}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <div className="relative">
                          <Input
                            type="number"
                            step={allowDecimal ? "0.01" : "1"}
                            min="0.01"
                            value={weights[item.id] ?? ""}
                            onChange={(e) => updateWeight(item.id, e.target.value)}
                            className="h-8 w-24 text-center font-bold text-sm px-2 pr-7"
                          />
                          <span className="absolute right-2 top-2 text-[11px] font-medium text-muted-foreground pointer-events-none">
                            {unitLabel}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          className="h-8 w-7 px-0"
                          onClick={() => adjustWeight(item.id, step, allowDecimal)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          title={tr("Reset to ordered quantity")}
                          className="h-8 w-7 px-0 text-muted-foreground hover:text-foreground"
                          onClick={() => resetToOrdered(item.id, originalQty)}
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1 text-xs">
                        <span className="font-semibold">{money(currentLineTotal)}</span>
                        {Math.abs(lineDiff) > 0.01 && (
                          <span className={`text-[11px] font-medium ${lineDiff > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                            ({lineDiff > 0 ? `+${money(lineDiff)}` : `-${money(Math.abs(lineDiff))}`})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Totals Summary Banner */}
          <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2 text-sm">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>{tr("Previous total")}: {money(oldTotal)}</span>
              <span>{tr("Difference")}: <strong className={diff > 0 ? "text-amber-600 dark:text-amber-400" : diff < 0 ? "text-emerald-600 dark:text-emerald-400" : ""}>{diff > 0 ? `+${money(diff)}` : diff < 0 ? `-${money(Math.abs(diff))}` : "৳0"}</strong></span>
            </div>
            <div className="flex justify-between items-center font-medium border-t border-border pt-1.5">
              <span>{tr("New Order Total")}:</span>
              <span className="text-base font-bold text-foreground">{money(newTotal)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">{tr("Paid amount")}: {money(currentPaid)}</span>
              <span>{tr("New Due Amount")}: <strong className={newDue > 0 ? "text-destructive font-semibold" : "text-emerald-600"}>{money(newDue)}</strong></span>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <Field label={tr("Packer note (optional)")} hint={tr("Logged in order history")}>
              <Textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={tr("e.g. Fish weighed on scale 1, exact weights recorded")}
                maxLength={500}
              />
            </Field>

            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <Checkbox
                checked={markPacked}
                onChange={(e) => setMarkPacked(e.target.checked)}
              />
              <span>{tr("Advance order status to Processing / Packed")}</span>
            </label>
          </div>
        </DialogBody>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tr("Cancel")}
          </Button>
          <Button variant="brand" loading={save.isPending} onClick={() => save.mutate()}>
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            {tr("Save Weights & Recalculate")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

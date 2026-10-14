import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { slugify, unitsApi, type Unit } from "@/api/catalog";
import { errorMessage } from "@/api/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox, Input } from "@/components/ui/input";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/shared/Field";
import { SortableList } from "@/components/shared/Sortable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState, ErrorState } from "@/components/shared/EmptyState";
import { useAct } from "@/hooks/useAct";
import { CardListSkeleton } from "@/components/shared/skeletons";

const TEXT = "How products are sold: kg, piece, packet… Add any unit you need. Drag to change the order in the product form.";

function UnitDialog({ unit, onClose }: { unit: Unit | null; onClose: () => void }) {
  const [f, setF] = useState({
    code: unit?.code ?? "",
    name: unit?.name ?? "",
    nameBn: unit?.nameBn ?? "",
    shortLabel: unit?.shortLabel ?? "",
    shortLabelBn: unit?.shortLabelBn ?? "",
    allowDecimal: unit?.allowDecimal ?? false,
    defaultStep: String(unit?.defaultStep ?? 1),
    defaultMinQty: String(unit?.defaultMinQty ?? 1),
    isActive: unit?.isActive ?? true,
  });
  const [codeTouched, setCodeTouched] = useState(!!unit);
  const [err, setErr] = useState<string | null>(null);
  const save = useAct(
    () => {
      const b = {
        name: f.name.trim(), nameBn: f.nameBn.trim(), shortLabel: f.shortLabel.trim(), shortLabelBn: f.shortLabelBn.trim(),
        allowDecimal: f.allowDecimal, defaultStep: Number(f.defaultStep), defaultMinQty: Number(f.defaultMinQty), isActive: f.isActive,
      };
      return unit ? unitsApi.update(unit.id, b) : unitsApi.create({ ...b, code: f.code.trim() });
    },
    { success: "Unit saved", invalidate: [["units"]], onSuccess: onClose },
  );
  const submit = () => {
    if (!unit && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(f.code)) return setErr("Code: lowercase English letters, numbers and dashes");
    if (!f.name.trim() || !f.nameBn.trim()) return setErr("Give the unit a name in English and in Bangla");
    if (!f.shortLabel.trim() || !f.shortLabelBn.trim()) return setErr("Give the short label (shown on product cards) in both languages");
    const step = Number(f.defaultStep);
    const min = Number(f.defaultMinQty);
    if (!(step > 0) || !(min > 0)) return setErr("Step and minimum must be above zero");
    if (!f.allowDecimal && (!Number.isInteger(step) || !Number.isInteger(min))) return setErr("A unit sold in whole numbers needs a whole-number step and minimum");
    setErr(null);
    save.mutate();
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="md">
        <DialogHeader><DialogTitle>{unit ? "Edit unit" : "New unit"}</DialogTitle></DialogHeader>
        <DialogBody className="space-y-3">
          {err && <p className="rounded bg-red-50 px-3 py-2 text-xs font-medium text-destructive dark:bg-red-500/10">{err}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name (English)" required><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value, code: codeTouched ? f.code : slugify(e.target.value) })} placeholder="Bottle" /></Field>
            <Field label="Name (Bangla)" required><Input value={f.nameBn} onChange={(e) => setF({ ...f, nameBn: e.target.value })} placeholder="বোতল" /></Field>
            <Field label="Short label (English)" required hint="Shown next to the price, e.g. kg"><Input value={f.shortLabel} onChange={(e) => setF({ ...f, shortLabel: e.target.value })} placeholder="btl" /></Field>
            <Field label="Short label (Bangla)" required><Input value={f.shortLabelBn} onChange={(e) => setF({ ...f, shortLabelBn: e.target.value })} placeholder="বোতল" /></Field>
          </div>
          <Field label="Code" hint={unit ? "The code cannot be changed" : "English letters, numbers and dashes. It cannot be changed later."}>
            <Input value={f.code} disabled={!!unit} onChange={(e) => { setCodeTouched(true); setF({ ...f, code: e.target.value }); }} />
          </Field>
          <label className="flex cursor-pointer items-center gap-2 text-[13px]">
            <Checkbox checked={f.allowDecimal} onChange={(e) => setF({ ...f, allowDecimal: e.target.checked })} />
            Can be sold in parts (0.5 kg). Off = whole numbers only (1, 2, 3).
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Step of the + / − buttons" hint="e.g. 0.5 for kg, 1 for pieces"><Input type="number" min={0} step="0.001" value={f.defaultStep} onChange={(e) => setF({ ...f, defaultStep: e.target.value })} /></Field>
            <Field label="Smallest quantity" hint="A product can use its own step and minimum instead"><Input type="number" min={0} step="0.001" value={f.defaultMinQty} onChange={(e) => setF({ ...f, defaultMinQty: e.target.value })} /></Field>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-[13px]">
            <Checkbox checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} />
            Active (switch off to hide it from new products; old products and orders keep working)
          </label>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button loading={save.isPending} onClick={submit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Units() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["units"], queryFn: unitsApi.list });
  const [edit, setEdit] = useState<Unit | "new" | null>(null);
  const [del, setDel] = useState<Unit | null>(null);

  const reorder = async (ids: string[]) => {
    const prev = qc.getQueryData<Unit[]>(["units"]);
    if (prev) qc.setQueryData<Unit[]>(["units"], ids.map((id) => prev.find((u) => u.id === id)!));
    try {
      await unitsApi.reorder(ids);
    } catch (e) {
      toast.error(errorMessage(e));
      qc.setQueryData(["units"], prev);
    }
  };
  const toggle = useAct((u: Unit) => unitsApi.update(u.id, { isActive: !u.isActive }), { success: (_d, u) => (u.isActive ? "Unit switched off" : "Unit switched on"), invalidate: [["units"]] });
  const remove = useAct(() => unitsApi.remove(del!.id), { success: "Unit deleted", invalidate: [["units"]], onSuccess: () => setDel(null) });

  if (q.isLoading) return <CardListSkeleton title="Units" text={TEXT} action="New unit" />;
  if (q.isError) return <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />;
  const units = q.data ?? [];

  return (
    <div>
      <PageHeader title="Units" description={TEXT} actions={<Button variant="brand" size="sm" onClick={() => setEdit("new")}><Plus /> New unit</Button>} />
      {units.length === 0 ? <Card><EmptyState title="No units yet" description="Add kg, piece, packet… so products can be sold by weight or count." /></Card> : (
        <SortableList items={units} onReorder={(ids) => void reorder(ids)}>
          {(u) => (
            <div className="flex flex-wrap items-center gap-3 py-2 pr-3">
              <div className="min-w-0 flex-1">
                <p className="break-words text-[13px] font-semibold">
                  {u.name} <span className="font-normal text-muted-foreground">· {u.nameBn}</span>
                  {!u.isActive && <Badge variant="neutral" className="ml-2">Off</Badge>}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Shown as “{u.shortLabel}” / “{u.shortLabelBn}” · code {u.code} · {u.allowDecimal ? `parts allowed, step ${u.defaultStep}` : "whole numbers"}, minimum {u.defaultMinQty} · {u.productCount} product{u.productCount === 1 ? "" : "s"}
                </p>
              </div>
              <Button size="xs" variant="outline" loading={toggle.isPending && toggle.variables?.id === u.id} onClick={() => toggle.mutate(u)}>{u.isActive ? "Switch off" : "Switch on"}</Button>
              <Button size="icon-sm" variant="ghost" aria-label="Edit" onClick={() => setEdit(u)}><Pencil /></Button>
              <Button size="icon-sm" variant="ghost" aria-label="Delete" disabled={u.productCount > 0} title={u.productCount > 0 ? "In use: switch it off instead" : "Delete"} onClick={() => setDel(u)}><Trash2 className="text-destructive" /></Button>
            </div>
          )}
        </SortableList>
      )}
      {edit && <UnitDialog unit={edit === "new" ? null : edit} onClose={() => setEdit(null)} />}
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} title={`Delete "${del?.name}"?`} description="Only a unit that no product uses can be deleted." confirmLabel="Delete" destructive loading={remove.isPending} onConfirm={() => remove.mutate()} />
    </div>
  );
}

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { buildCategoryTree, categoriesApi, flattenCategoryTree, slugify, type Category, type CategoryNode } from "@/api/catalog";
import { errorMessage } from "@/api/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/input";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/shared/Field";
import { ImageField } from "@/components/shared/ImageField";
import { SortableList } from "@/components/shared/Sortable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Thumb } from "@/components/shared/Thumb";
import { ErrorState, EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { useAct } from "@/hooks/useAct";
import { CardListSkeleton } from "@/components/shared/skeletons";
import { tr } from "@/i18n";
import { num } from "@/lib/format";

const TEXT = tr("Categories can go several levels deep (Fish › Freshwater fish › Rui). Drag to change the order shown on the website.");

/** `item` = editing it; `parentId` = adding a new one under that category. */
type Edit = { item: CategoryNode | null; parentId?: string };

function EditDialog({ edit, tree, onClose }: { edit: Edit; tree: CategoryNode[]; onClose: () => void }) {
  const it = edit.item;
  const [f, setF] = useState({
    name: it?.name ?? "", nameBn: it?.nameBn ?? "", slug: it?.slug ?? "",
    description: it?.description ?? "", descriptionBn: it?.descriptionBn ?? "", image: it?.image ?? (null as string | null),
    isHomepage: it?.isHomepage ?? false, status: it?.status ?? "ACTIVE",
    parentCategoryId: it ? (it.parentCategoryId ?? "") : (edit.parentId ?? ""),
    metaTitle: it?.metaTitle ?? "", metaDescription: it?.metaDescription ?? "",
  });
  const [touched, setTouched] = useState(!!it);
  const [err, setErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // a category cannot move under itself or anything below it
  const options = useMemo(() => {
    const blocked = new Set<string>();
    if (it) {
      const walk = (n: CategoryNode) => { blocked.add(n.id); n.children.forEach(walk); };
      walk(it);
    }
    return flattenCategoryTree(tree).filter((o) => !blocked.has(o.node.id));
  }, [tree, it]);

  const save = useAct(
    () => {
      const b = {
        name: f.name.trim(), nameBn: f.nameBn.trim() || undefined, slug: f.slug.trim(),
        description: f.description.trim() || undefined, descriptionBn: f.descriptionBn.trim() || undefined,
        image: f.image ?? undefined, isHomepage: f.isHomepage, status: f.status,
        // null = move to the top level
        parentCategoryId: f.parentCategoryId || (it ? null : undefined),
        metaTitle: f.metaTitle || undefined, metaDescription: f.metaDescription || undefined,
      };
      return it ? categoriesApi.update(it.id, b) : categoriesApi.create(b);
    },
    { success: tr("Saved"), invalidate: [["categories"]], onSuccess: onClose },
  );
  const submit = () => {
    if (uploading) return;
    if (!f.name.trim()) return setErr(tr("Name (English) is required: it makes the web address"));
    if (!f.nameBn.trim()) return setErr(tr("Add the Bangla name: the shop shows it by default"));
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(f.slug)) return setErr(tr("Slug: lowercase English letters, numbers and dashes"));
    setErr(null);
    save.mutate();
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="md">
        <DialogHeader><DialogTitle>{it ? tr("Edit category") : f.parentCategoryId ? tr("New sub-category") : tr("New category")}</DialogTitle></DialogHeader>
        <DialogBody className="space-y-3">
          {err && <p className="rounded bg-red-50 px-3 py-2 text-xs font-medium text-destructive dark:bg-red-500/10">{err}</p>}
          <Field label={tr("Sits under")} hint={tr("Leave on “Top level” for a main category")}>
            <Select value={f.parentCategoryId} onChange={(e) => setF({ ...f, parentCategoryId: e.target.value })}>
              <option value="">{tr("Top level")}</option>
              {options.map((o) => <option key={o.node.id} value={o.node.id}>{`${"— ".repeat(o.depth)}${o.node.name}`}</option>)}
            </Select>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={tr("Name (Bangla)")} required><Input value={f.nameBn} onChange={(e) => setF({ ...f, nameBn: e.target.value })} placeholder="মিঠা পানির মাছ" /></Field>
            <Field label={tr("Name (English)")} required hint={tr("Makes the web address")}><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value, slug: touched ? f.slug : slugify(e.target.value) })} placeholder={tr("Freshwater fish")} /></Field>
          </div>
          <Field label={tr("URL slug")} required hint={tr("The same in both languages")}><Input value={f.slug} onChange={(e) => { setTouched(true); setF({ ...f, slug: e.target.value }); }} /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={tr("Description (Bangla)")}><Textarea rows={2} value={f.descriptionBn} onChange={(e) => setF({ ...f, descriptionBn: e.target.value })} /></Field>
            <Field label={tr("Description (English)")}><Textarea rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
          </div>
          <ImageField label={tr("Image (shown on the home page tile)")} folder="categories" value={f.image} onChange={(image) => setF({ ...f, image })} onBusyChange={setUploading} />
          {!f.parentCategoryId && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={tr("Meta title")}><Input value={f.metaTitle} onChange={(e) => setF({ ...f, metaTitle: e.target.value })} /></Field>
              <Field label={tr("Meta description")}><Input value={f.metaDescription} onChange={(e) => setF({ ...f, metaDescription: e.target.value })} /></Field>
            </div>
          )}
          <div className="flex items-center gap-6">
            <Field label={tr("Status")} className="w-40">
              <Select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as "ACTIVE" | "INACTIVE" })}><option value="ACTIVE">{tr("Active")}</option><option value="INACTIVE">{tr("Inactive")}</option></Select>
            </Field>
            <label className="mt-5 flex cursor-pointer items-center gap-2 text-[13px]"><Checkbox checked={f.isHomepage} onChange={(e) => setF({ ...f, isHomepage: e.target.checked })} />{tr("Show on the home page")}</label>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{tr("Cancel")}</Button>
          <Button loading={save.isPending} disabled={uploading} onClick={submit}>{uploading ? tr("Uploading…") : tr("Save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface BranchProps {
  nodes: CategoryNode[];
  parentId?: string;
  depth: number;
  open: Record<string, boolean>;
  onToggle: (id: string) => void;
  onReorder: (ids: string[], parentId?: string) => void;
  onEdit: (e: Edit) => void;
  onDelete: (n: CategoryNode) => void;
}

/** One level of the tree: its categories can be dragged to a new order; each opens to show its own children. */
function Branch({ nodes, parentId, depth, open, onToggle, onReorder, onEdit, onDelete }: BranchProps) {
  return (
    <SortableList items={nodes} onReorder={(ids) => onReorder(ids, parentId)}>
      {(c) => (
        <div>
          <div className="flex items-center gap-3 py-2 pr-3">
            <button className="cursor-pointer text-muted-foreground" onClick={() => onToggle(c.id)} aria-label={tr("Show or hide what is inside")}>
              {open[c.id] ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            </button>
            <Thumb src={c.image} className={depth === 0 ? "size-10" : "size-8"} />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 break-words text-[13px] font-semibold">
                {c.nameBn ? `${c.nameBn} · ` : ""}{c.name} {c.isHomepage && <Badge variant="fresh" className="ml-1">{tr("Home")}</Badge>}
              </p>
              <p className="text-[11px] text-muted-foreground">/{c.slug} · {tr("{{a}} sub-categories · {{b}} products directly in it", { a: num(c._count.childCategories), b: num(c._count.products) })}</p>
            </div>
            <span className={c.status === "ACTIVE" ? "max-sm:hidden" : ""}><StatusBadge status={c.status} /></span>
            <Button size="icon-sm" variant="ghost" aria-label={tr("Add a sub-category")} title={tr("Add a sub-category")} onClick={() => onEdit({ item: null, parentId: c.id })}><Plus /></Button>
            <Button size="icon-sm" variant="ghost" aria-label={tr("Edit")} onClick={() => onEdit({ item: c })}><Pencil /></Button>
            <Button size="icon-sm" variant="ghost" aria-label={tr("Delete")} onClick={() => onDelete(c)}><Trash2 className="text-destructive" /></Button>
          </div>
          {open[c.id] && (
            <div className="border-t border-border bg-muted/30 p-3 pl-8">
              {c.children.length > 0 ? (
                <Branch nodes={c.children} parentId={c.id} depth={depth + 1} open={open} onToggle={onToggle} onReorder={onReorder} onEdit={onEdit} onDelete={onDelete} />
              ) : (
                <p className="text-xs text-muted-foreground">{tr("No sub-categories yet.")}</p>
              )}
              <Button size="xs" variant="outline" className="mt-2" onClick={() => onEdit({ item: null, parentId: c.id })}><Plus />{" "}{tr("Add sub-category")}</Button>
            </div>
          )}
        </div>
      )}
    </SortableList>
  );
}

export default function Categories() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["categories"], queryFn: categoriesApi.list });
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [edit, setEdit] = useState<Edit | null>(null);
  const [del, setDel] = useState<CategoryNode | null>(null);
  const tree = useMemo(() => buildCategoryTree(q.data ?? []), [q.data]);

  const reorder = async (ids: string[], parentId?: string) => {
    const prev = qc.getQueryData<Category[]>(["categories"]);
    if (prev) {
      // show the new order at once: the positions of these siblings are re-numbered in the cache
      const pos = new Map(ids.map((id, i) => [id, i]));
      qc.setQueryData<Category[]>(["categories"], prev.map((c) => (pos.has(c.id) ? { ...c, displayOrder: pos.get(c.id)! } : c)).sort((a, b) => a.displayOrder - b.displayOrder));
    }
    try {
      await categoriesApi.reorder(ids, parentId);
    } catch (e) {
      toast.error(errorMessage(e));
      qc.setQueryData(["categories"], prev);
    }
  };
  const remove = useAct(() => categoriesApi.remove(del!.id), { success: tr("Deleted"), invalidate: [["categories"]], onSuccess: () => setDel(null) });

  if (q.isLoading) return <CardListSkeleton title={tr("Categories")} text={TEXT} action={tr("New category")} />;
  if (q.isError) return <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />;

  return (
    <div>
      <PageHeader title={tr("Categories")} description={TEXT} actions={<Button variant="brand" size="sm" onClick={() => setEdit({ item: null })}><Plus />{" "}{tr("New category")}</Button>} />
      {tree.length === 0 ? <Card><EmptyState title={tr("No categories yet")} description={tr("Create one to start adding products.")} /></Card> : (
        <Branch nodes={tree} depth={0} open={open} onToggle={(id) => setOpen((o) => ({ ...o, [id]: !o[id] }))} onReorder={(ids, parentId) => void reorder(ids, parentId)} onEdit={setEdit} onDelete={setDel} />
      )}
      {edit && <EditDialog edit={edit} tree={tree} onClose={() => setEdit(null)} />}
      <ConfirmDialog
        open={!!del}
        onOpenChange={(o) => !o && setDel(null)}
        title={`Delete "${del?.name}"?`}
        description={tr("A category that still has sub-categories or products cannot be deleted: move those first, or set the category to inactive.")}
        confirmLabel={tr("Delete")}
        destructive
        loading={remove.isPending}
        onConfirm={() => remove.mutate()}
      />
    </div>
  );
}

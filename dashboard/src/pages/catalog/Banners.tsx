import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, LayoutTemplate, Pencil, Plus, Trash2 } from "lucide-react";
import { BANNER_LINKS, BANNER_POSITIONS, bannersApi, type Banner, type BannerPosition } from "@/api/catalog";
import { settingsApi, type HeroLayoutMode } from "@/api/system";
import { assetUrl, errorMessage } from "@/api/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Select, Switch } from "@/components/ui/input";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/shared/Field";
import { ImageField } from "@/components/shared/ImageField";
import { SortableList } from "@/components/shared/Sortable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState, ErrorState } from "@/components/shared/EmptyState";
import { useAct } from "@/hooks/useAct";
import { dateOnly, fromLocalInput, titleCase, toLocalInput } from "@/lib/format";
import { CardListSkeleton } from "@/components/shared/skeletons";
import { tr } from "@/i18n";

const SIZE_HINT: Record<BannerPosition, string> = {
  HERO_MAIN: "Big slider on top, about 1200×400", HERO_SIDE: "Beside the slider", HERO_BOTTOM: "Under the slider", CATEGORY_TOP: "Top of category pages",
  CATEGORY_BANNER: "Inside category pages", PROMO_BAR: "Thin strip on top of the site", POPUP: "Pop-up when the site opens", SIDEBAR: "Sidebar banner",
};

function BannerDialog({ banner, defaultPosition, onClose }: { banner: Banner | null; defaultPosition: BannerPosition; onClose: () => void }) {
  const [f, setF] = useState({
    title: banner?.title ?? "", subtitle: banner?.subtitle ?? "", imageUrl: banner?.imageUrl ?? null as string | null, mobileImageUrl: banner?.mobileImageUrl ?? null as string | null,
    linkType: banner?.linkType ?? "CUSTOM", linkUrl: banner?.linkUrl ?? "", linkResourceId: banner?.linkResourceId ?? "",
    position: banner?.position ?? defaultPosition, isActive: banner?.isActive ?? true,
    startDate: toLocalInput(banner?.startDate), endDate: toLocalInput(banner?.endDate), bgColor: banner?.bgColor ?? "", textColor: banner?.textColor ?? "",
  });
  const [err, setErr] = useState<string | null>(null);
  const save = useAct(
    () => {
      const b = {
        title: f.title, subtitle: f.subtitle, imageUrl: f.imageUrl ?? "", mobileImageUrl: f.mobileImageUrl ?? "", linkType: f.linkType, linkUrl: f.linkUrl, linkResourceId: f.linkResourceId,
        position: f.position, isActive: f.isActive, startDate: fromLocalInput(f.startDate), endDate: fromLocalInput(f.endDate), bgColor: f.bgColor, textColor: f.textColor,
      };
      return banner ? bannersApi.update(banner.id, b) : bannersApi.create(b);
    },
    { success: tr("Banner saved"), invalidate: [["banners"]], onSuccess: onClose },
  );
  const submit = () => {
    if (!f.imageUrl) return setErr(tr("Add the banner image"));
    if (f.startDate && f.endDate && new Date(f.endDate) <= new Date(f.startDate)) return setErr(tr("The end must be after the start"));
    setErr(null);
    save.mutate();
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="lg">
        <DialogHeader><DialogTitle>{banner ? tr("Edit banner") : tr("New banner")}</DialogTitle></DialogHeader>
        <DialogBody className="space-y-3">
          {err && <p className="rounded bg-red-50 px-3 py-2 text-xs font-medium text-destructive dark:bg-red-500/10">{err}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <ImageField label={tr("Image *")} folder="banners" value={f.imageUrl} onChange={(imageUrl) => setF({ ...f, imageUrl })} />
            <ImageField label={tr("Mobile image (optional)")} folder="banners" value={f.mobileImageUrl} onChange={(mobileImageUrl) => setF({ ...f, mobileImageUrl })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={tr("Title")}><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
            <Field label={tr("Subtitle")}><Input value={f.subtitle} onChange={(e) => setF({ ...f, subtitle: e.target.value })} /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label={tr("Where it shows")} hint={SIZE_HINT[f.position]}>
              <Select value={f.position} onChange={(e) => setF({ ...f, position: e.target.value as BannerPosition })}>{BANNER_POSITIONS.map((p) => <option key={p} value={p}>{titleCase(p)}</option>)}</Select>
            </Field>
            <Field label={tr("Link to")}>
              <Select value={f.linkType} onChange={(e) => setF({ ...f, linkType: e.target.value as typeof f.linkType })}>{BANNER_LINKS.map((p) => <option key={p} value={p}>{titleCase(p)}</option>)}</Select>
            </Field>
            {f.linkType === "CUSTOM" ? (
              <Field label={tr("Link address")}><Input value={f.linkUrl} onChange={(e) => setF({ ...f, linkUrl: e.target.value })} placeholder="/shop or https://…" /></Field>
            ) : (
              <Field label={`${titleCase(f.linkType)} ID`}><Input value={f.linkResourceId} onChange={(e) => setF({ ...f, linkResourceId: e.target.value })} /></Field>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={tr("Show from")} hint={tr("Empty = right away")}><Input type="datetime-local" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} /></Field>
            <Field label={tr("Show until")} hint={tr("Empty = no end")}><Input type="datetime-local" value={f.endDate} onChange={(e) => setF({ ...f, endDate: e.target.value })} /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label={tr("Background colour")}><Input value={f.bgColor} onChange={(e) => setF({ ...f, bgColor: e.target.value })} placeholder="#0b6234" /></Field>
            <Field label={tr("Text colour")}><Input value={f.textColor} onChange={(e) => setF({ ...f, textColor: e.target.value })} placeholder="#ffffff" /></Field>
            <label className="mt-6 flex cursor-pointer items-center gap-2 text-[13px]"><Switch checked={f.isActive} onCheckedChange={(isActive) => setF({ ...f, isActive })} />{tr("Active")}</label>
          </div>
        </DialogBody>
        <DialogFooter><Button variant="outline" onClick={onClose}>{tr("Cancel")}</Button><Button loading={save.isPending} onClick={submit}>{tr("Save")}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HeroSettingsCard() {
  const { data: settings, isLoading } = useQuery({ queryKey: ["settings"], queryFn: settingsApi.get });
  const hero = settings?.site?.hero;

  const [layout, setLayout] = useState<HeroLayoutMode>("SLIDER_AND_SIDE");
  const [maxSlides, setMaxSlides] = useState<number>(5);
  const [intervalSec, setIntervalSec] = useState<number>(6);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (hero) {
      setLayout(hero.layout ?? "SLIDER_AND_SIDE");
      setMaxSlides(hero.maxSlides ?? 5);
      setIntervalSec(hero.autoplayIntervalSec ?? 6);
      setDirty(false);
    }
  }, [hero]);

  const save = useAct(
    async () => {
      if (!settings?.site) return;
      await settingsApi.save("site", {
        ...settings.site,
        hero: {
          layout,
          maxSlides: Math.max(1, Math.min(15, Number(maxSlides) || 5)),
          autoplayIntervalSec: Math.max(2, Math.min(30, Number(intervalSec) || 6)),
        },
      });
    },
    {
      success: tr("Hero settings saved"),
      invalidate: [["settings"]],
      onSuccess: () => setDirty(false),
    },
  );

  if (isLoading) return null;

  return (
    <Card className="mb-6 border-border p-4 sm:p-5">
      <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <LayoutTemplate className="h-4 w-4 text-brand-leaf" />
            {tr("Hero Section Controls")}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {tr("Control how the public hero section looks: toggle full-width slider or slider with side cards, and set slide count.")}
          </p>
        </div>
        <Button
          size="sm"
          variant="brand"
          loading={save.isPending}
          disabled={!dirty || save.isPending}
          onClick={() => save.mutate()}
        >
          <Check className="mr-1.5 h-3.5 w-3.5" />
          {dirty ? tr("Save Changes") : tr("Saved")}
        </Button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <div className="space-y-2 lg:col-span-7">
          <label className="text-xs font-semibold uppercase tracking-wide text-foreground">
            {tr("Display Layout")}
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                setLayout("SLIDER_AND_SIDE");
                setDirty(true);
              }}
              className={`cursor-pointer rounded-md border p-3 text-left transition-all ${
                layout === "SLIDER_AND_SIDE"
                  ? "border-brand-leaf bg-brand-leaf/5 ring-1 ring-brand-leaf"
                  : "border-border bg-background hover:border-border/80"
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">
                  {tr("Slider + 2 Side Cards")}
                </span>
                {layout === "SLIDER_AND_SIDE" && (
                  <span className="h-2 w-2 rounded-full bg-brand-leaf" />
                )}
              </div>
              <p className="text-[11px] leading-normal text-muted-foreground">
                {tr("Main slider on left + 2 promo banners on right (HERO_SIDE).")}
              </p>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                setLayout("SLIDER_ONLY");
                setDirty(true);
              }}
              className={`cursor-pointer rounded-md border p-3 text-left transition-all ${
                layout === "SLIDER_ONLY"
                  ? "border-brand-leaf bg-brand-leaf/5 ring-1 ring-brand-leaf"
                  : "border-border bg-background hover:border-border/80"
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">
                  {tr("Full-Width Slider Only")}
                </span>
                {layout === "SLIDER_ONLY" && (
                  <span className="h-2 w-2 rounded-full bg-brand-leaf" />
                )}
              </div>
              <p className="text-[11px] leading-normal text-muted-foreground">
                {tr("Slider expands 100% full width. Side banners are hidden.")}
              </p>
            </div>
          </div>
        </div>

        <div className="grid items-start gap-3 sm:grid-cols-2 lg:col-span-5">
          <Field
            label={tr("Max Slides")}
            hint={tr("Max active slides to rotate")}
          >
            <Input
              type="number"
              min={1}
              max={15}
              value={maxSlides}
              onChange={(e) => {
                setMaxSlides(Number(e.target.value));
                setDirty(true);
              }}
            />
          </Field>

          <Field
            label={tr("Slide Interval (sec)")}
            hint={tr("Seconds per slide")}
          >
            <Input
              type="number"
              min={2}
              max={30}
              value={intervalSec}
              onChange={(e) => {
                setIntervalSec(Number(e.target.value));
                setDirty(true);
              }}
            />
          </Field>
        </div>
      </div>
    </Card>
  );
}

export default function Banners() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["banners"], queryFn: bannersApi.list });
  const [edit, setEdit] = useState<{ banner: Banner | null; position: BannerPosition } | null>(null);
  const [del, setDel] = useState<Banner | null>(null);
  const toggle = useAct((b: Banner) => bannersApi.update(b.id, { isActive: !b.isActive }), { invalidate: [["banners"]] });
  const remove = useAct(() => bannersApi.remove(del!.id), { success: tr("Banner deleted"), invalidate: [["banners"]], onSuccess: () => setDel(null) });

  const reorder = async (position: BannerPosition, ids: string[]) => {
    const prev = qc.getQueryData<Banner[]>(["banners"]);
    if (prev) {
      const others = prev.filter((b) => b.position !== position);
      qc.setQueryData<Banner[]>(["banners"], [...others, ...ids.map((id) => prev.find((b) => b.id === id)!)]);
    }
    try { await bannersApi.reorder(position, ids); } catch (e) { toast.error(errorMessage(e)); qc.setQueryData(["banners"], prev); }
  };

  if (q.isLoading) return <CardListSkeleton title={tr("Banners")} text={tr("Home page sliders and promotions. Drag inside a group to change the order.")} action={tr("New banner")} />;
  if (q.isError) return <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />;
  const all = q.data ?? [];
  const positions = BANNER_POSITIONS.filter((p) => all.some((b) => b.position === p));

  return (
    <div>
      <PageHeader title={tr("Banners")} description={tr("Home page sliders and promotions. Drag inside a group to change the order.")} actions={<Button variant="brand" size="sm" onClick={() => setEdit({ banner: null, position: "HERO_MAIN" })}><Plus />{" "}{tr("New banner")}</Button>} />
      <HeroSettingsCard />
      {all.length === 0 ? <Card><EmptyState title={tr("No banners yet")} description={tr("Add a banner to show on the home page.")} /></Card> : (
        <div className="space-y-6">
          {positions.map((pos) => {
            const list = all.filter((b) => b.position === pos).sort((a, b) => a.displayOrder - b.displayOrder);
            return (
              <section key={pos}>
                <div className="mb-2 flex items-center justify-between">
                  <div><h2 className="text-sm font-semibold">{titleCase(pos)}</h2><p className="text-xs text-muted-foreground">{SIZE_HINT[pos]}</p></div>
                  <Button size="xs" variant="outline" onClick={() => setEdit({ banner: null, position: pos })}><Plus />{" "}{tr("Add")}</Button>
                </div>
                <SortableList items={list} onReorder={(ids) => void reorder(pos, ids)}>
                  {(b) => (
                    <div className="flex items-center gap-3 py-2 pr-3">
                      <img src={assetUrl(b.imageUrl)} alt="" className="h-14 w-28 shrink-0 rounded object-cover bg-muted" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold">{b.title || "(no title)"}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{b.linkUrl || b.linkResourceId || "No link"}{(b.startDate || b.endDate) && ` · ${b.startDate ? dateOnly(b.startDate) : "…"} → ${b.endDate ? dateOnly(b.endDate) : "…"}`}</p>
                      </div>
                      {b.endDate && new Date(b.endDate) < new Date() && <Badge variant="neutral">{tr("Expired")}</Badge>}
                      <Switch checked={b.isActive} onCheckedChange={() => toggle.mutate(b)} aria-label={tr("Active")} />
                      <Button size="icon-sm" variant="ghost" aria-label={tr("Edit")} onClick={() => setEdit({ banner: b, position: b.position })}><Pencil /></Button>
                      <Button size="icon-sm" variant="ghost" aria-label={tr("Delete")} onClick={() => setDel(b)}><Trash2 className="text-destructive" /></Button>
                    </div>
                  )}
                </SortableList>
              </section>
            );
          })}
        </div>
      )}
      {edit && <BannerDialog banner={edit.banner} defaultPosition={edit.position} onClose={() => setEdit(null)} />}
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} title={tr("Delete this banner?")} confirmLabel={tr("Delete")} destructive loading={remove.isPending} onConfirm={() => remove.mutate()} />
    </div>
  );
}

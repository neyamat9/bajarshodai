import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { Field, Section } from "@/components/shared/Field";
import { UploadProgressBar } from "@/components/shared/UploadProgressBar";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ErrorState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { brandsApi, buildCategoryTree, categoriesApi, flattenCategoryTree, slugify, unitsApi } from "@/api/catalog";
import { productsApi, type ProductDetail, type ProductInput, type ProductStatus } from "@/api/products";
import { errorMessage } from "@/api/client";
import { useAct } from "@/hooks/useAct";
import { fromLocalInput, money, num as fmtNum, toLocalInput, titleCase } from "@/lib/format";
import { VariantsEditor } from "./components/VariantsEditor";
import { draftError, fromVariant, toInput, type VariantDraft } from "./components/variantDraft";
import { PhotosEditor } from "./components/PhotosEditor";
import { MedExAutoFill } from "./components/MedExAutoFill";
import type { MedicineMeta, MedExMedicineDetail } from "@/api/medicine";
import { ProductEditorSkeleton } from "@/components/shared/pageSkeletons";
import { tr } from "@/i18n";

interface Form {
  name: string; nameBn: string; slug: string; productCode: string; barcode: string; status: ProductStatus;
  categoryId: string; brandId: string;
  unitId: string; packSize: string; sellStep: string; minQty: string; maxQty: string; isWeighed: boolean;
  shortDescription: string; shortDescriptionBn: string; description: string; descriptionBn: string;
  buyingPrice: string; regularPrice: string; sellingPrice: string;
  discountPrice: string; discountStart: string; discountEnd: string; discountLabel: string;
  trackStock: boolean; stock: string; lowStockThreshold: string; freeShipping: boolean;
  weight: string; length: string; width: string; height: string;
  isFeatured: boolean; isNew: boolean; isHot: boolean; isBestSeller: boolean; isLimitedStock: boolean;
  metaTitle: string; metaDescription: string; metaKeywords: string;
  tags: string;
  attrs: { name: string; value: string }[];
  medicineMeta?: Partial<MedicineMeta> | null;
}

const blank: Form = {
  name: "", nameBn: "", slug: "", productCode: "", barcode: "", status: "ACTIVE", categoryId: "", brandId: "",
  unitId: "", packSize: "", sellStep: "", minQty: "", maxQty: "", isWeighed: false,
  shortDescription: "", shortDescriptionBn: "", description: "", descriptionBn: "", buyingPrice: "", regularPrice: "", sellingPrice: "",
  discountPrice: "", discountStart: "", discountEnd: "", discountLabel: "", trackStock: true, stock: "0", lowStockThreshold: "5", freeShipping: false,
  weight: "", length: "", width: "", height: "", isFeatured: false, isNew: false, isHot: false, isBestSeller: false, isLimitedStock: false,
  metaTitle: "", metaDescription: "", metaKeywords: "", tags: "", attrs: [],
  medicineMeta: null,
};
const n = (v?: string | number | null) => (v === null || v === undefined ? "" : String(Number(v)));
const toForm = (p: ProductDetail): Form => ({
  name: p.name, nameBn: p.nameBn ?? "", slug: p.slug, productCode: p.productCode ?? "", barcode: p.barcode ?? "", status: p.status,
  categoryId: p.categoryId, brandId: p.brandId ?? "",
  unitId: p.unitId ?? "", packSize: p.packSize ?? "", sellStep: p.sellStep ? n(p.sellStep) : "", minQty: p.minQty ? n(p.minQty) : "", maxQty: p.maxQty ? n(p.maxQty) : "", isWeighed: p.isWeighed,
  shortDescription: p.shortDescription ?? "", shortDescriptionBn: p.shortDescriptionBn ?? "", description: p.description, descriptionBn: p.descriptionBn ?? "",
  buyingPrice: n(p.buyingPrice), regularPrice: n(p.regularPrice), sellingPrice: n(p.priceBeforeDiscount ?? p.sellingPrice),
  discountPrice: p.discountPrice ? n(p.discountPrice) : "", discountStart: toLocalInput(p.discountStart), discountEnd: toLocalInput(p.discountEnd), discountLabel: p.discountLabel ?? "",
  trackStock: p.trackStock ?? true, stock: String(p.stock), lowStockThreshold: String(p.lowStockThreshold), freeShipping: p.freeShipping,
  weight: n(p.weight), length: n(p.length), width: n(p.width), height: n(p.height),
  isFeatured: p.isFeatured, isNew: p.isNew, isHot: p.isHot, isBestSeller: p.isBestSeller, isLimitedStock: p.isLimitedStock,
  metaTitle: p.metaTitle ?? "", metaDescription: p.metaDescription ?? "", metaKeywords: p.metaKeywords ?? "",
  tags: p.tags.join(", "),
  attrs: p.attributes.map((a) => ({ name: a.name, value: a.value })),
  medicineMeta: p.medicineMeta ?? null,
});
const num = (v: string) => (v.trim() === "" ? undefined : Number(v));

export default function ProductEditor() {
  const { id } = useParams();
  const q = useQuery({ queryKey: ["product", id], queryFn: () => productsApi.get(id!), enabled: !!id });
  if (id && q.isLoading) return <ProductEditorSkeleton />;
  if (id && (q.isError || !q.data)) return <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />;
  return <ProductForm key={id ?? "new"} id={id} p={q.data} />;
}

function ProductForm({ id, p }: { id?: string; p?: ProductDetail }) {
  const nav = useNavigate();
  const isNew = !id;
  const [f, setF] = useState<Form>(() => (p ? toForm(p) : blank));
  const [slugTouched, setSlugTouched] = useState(!!p);
  const [variants, setVariants] = useState<VariantDraft[]>(() => (p ? p.variants.map(fromVariant) : []));
  const [staged, setStaged] = useState<File[]>([]);
  const [stagedProgress, setStagedProgress] = useState<number | null>(null);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [tab, setTab] = useState("basics");
  const [delOpen, setDelOpen] = useState(false);
  const cats = useQuery({ queryKey: ["categories"], queryFn: categoriesApi.list });
  const brands = useQuery({ queryKey: ["brands"], queryFn: brandsApi.list });
  const units = useQuery({ queryKey: ["units"], queryFn: unitsApi.list });

  // when variants are added / removed on the server, show the server's list
  const sig = p ? p.variants.map((v) => v.id).join(",") : "";
  const [seenSig, setSeenSig] = useState(sig);
  if (sig !== seenSig) {
    setSeenSig(sig);
    setVariants((cur) => [...p!.variants.map((v) => fromVariant(v)), ...cur.filter((d) => !d.id)]);
  }

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));
  // every category of the tree as "Fish › Freshwater fish › Rui": the product sits in the one you pick
  const catOptions = useMemo(() => flattenCategoryTree(buildCategoryTree(cats.data ?? [])), [cats.data]);
  // active units, plus the one this product already uses (even if it was switched off since)
  const unitOptions = useMemo(() => (units.data ?? []).filter((u) => u.isActive || u.id === f.unitId), [units.data, f.unitId]);
  const unit = units.data?.find((u) => u.id === f.unitId);
  const hasVariants = variants.length > 0;

  const handleSelectMedEx = (detail: MedExMedicineDetail) => {
    const fullName = `${detail.name} ${detail.strength}`.trim();
    setF((cur) => {
      const next = { ...cur };
      next.name = fullName;
      if (!slugTouched) next.slug = slugify(fullName);
      if (!next.nameBn) next.nameBn = fullName;

      const price = detail.stripPrice ?? detail.unitPrice ?? detail.boxPrice;
      if (price) {
        next.sellingPrice = String(price);
        next.regularPrice = String(price);
        if (!next.buyingPrice) {
          next.buyingPrice = (price * 0.88).toFixed(2);
        }
      }
      if (detail.packSizeInfo) {
        next.packSize = detail.packSizeInfo;
      } else if (detail.stripPrice) {
        next.packSize = "1 Strip";
      }

      // Auto-select category to Medicine if available
      const medCat = catOptions.find(
        (c) =>
          c.node.slug === "medicine" ||
          c.node.name.toLowerCase() === "medicine",
      );
      if (medCat && !cur.categoryId) {
        next.categoryId = medCat.node.id;
      }

      next.medicineMeta = {
        genericName: detail.genericName,
        genericSlug: detail.genericSlug,
        dosageForm: detail.dosageForm,
        strength: detail.strength,
        manufacturer: detail.companyName,
        type: "OTC",
        medexUrl: detail.medexUrl,
        medexId: detail.medexId,
        mrpUnit: detail.unitPrice,
        mrpStrip: detail.stripPrice,
        mrpBox: detail.boxPrice,
        packSizeInfo: detail.packSizeInfo,
      };
      next.trackStock = false;

      return next;
    });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = "English name is required (it makes the web address)";
    if (!f.nameBn.trim()) e.nameBn = "Add the Bangla name: the shop shows it by default";
    if (f.unitId) {
      const step = f.sellStep === "" ? (unit ? Number(unit.defaultStep) : 1) : Number(f.sellStep);
      const min = f.minQty === "" ? (step || (unit ? Number(unit.defaultMinQty) : 1)) : Number(f.minQty);
      const max = f.maxQty === "" ? null : Number(f.maxQty);
      if (unit && !unit.allowDecimal && ((step !== undefined && !Number.isInteger(step)) || (min !== undefined && !Number.isInteger(min)) || (max !== null && !Number.isInteger(max)))) e.sale = tr("\"{{unit}}\" is sold in whole numbers: use whole numbers", { unit: unit.name });
      if ((f.sellStep !== "" && !(Number(f.sellStep) > 0)) || (f.minQty !== "" && !(Number(f.minQty) > 0)) || (f.maxQty !== "" && !(Number(f.maxQty) > 0))) e.sale = "Step, minimum and maximum must be above zero";
      if (step > 0 && min > 0) {
        if (min < step) {
          e.sale = tr("Smallest quantity ({{min}}) cannot be less than the step ({{step}})", { min, step });
        } else if (Math.abs(min / step - Math.round(min / step)) > 1e-9) {
          e.sale = tr("Smallest quantity ({{min}}) must be a multiple of the step ({{step}})", { min, step });
        }
      }
      if (max !== null && step > 0) {
        if (max < min) {
          e.sale = tr("Maximum quantity ({{max}}) cannot be less than the smallest quantity ({{min}})", { max, min });
        } else if (Math.abs(max / step - Math.round(max / step)) > 1e-9) {
          e.sale = tr("Maximum quantity ({{max}}) must be a multiple of the step ({{step}})", { max, step });
        }
      }
    } else if (f.sellStep !== "" || f.minQty !== "" || f.maxQty !== "") e.sale = "Choose a unit first";
    if (f.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(f.slug)) e.slug = "Lowercase letters, numbers and single dashes";
    if (!f.categoryId) e.categoryId = "Choose a category";

    if (f.buyingPrice === "" || Number(f.buyingPrice) < 0) e.buyingPrice = "Enter the cost price";
    if (!(Number(f.regularPrice) > 0)) e.regularPrice = "Enter the regular (MRP) price";
    if (!(Number(f.sellingPrice) > 0)) e.sellingPrice = "Enter the selling price";
    if (f.discountPrice !== "") {
      if (Number(f.discountPrice) >= Number(f.sellingPrice)) e.discountPrice = "Must be lower than the selling price";
      if (f.discountStart && f.discountEnd && new Date(f.discountEnd) <= new Date(f.discountStart)) e.discountEnd = "Must be after the start";
    }
    for (const d of variants) { const m = draftError(d); if (m) { e.variants = `Variant ${d.sku || d.name || "(new)"}: ${m}`; break; } }
    const skus = variants.map((d) => d.sku.trim().toLowerCase());
    if (new Set(skus).size !== skus.length) e.variants = "Two variants share the same SKU";
    setErrs(e);
    if (Object.keys(e).length) {
      toast.error(tr("Please fix the highlighted fields"));
      setTab(e.variants ? "variants" : e.buyingPrice || e.regularPrice || e.sellingPrice || e.discountPrice || e.discountEnd ? "pricing" : "basics");
    }
    return Object.keys(e).length === 0;
  };

  const build = (): ProductInput => {
    const clearOr = (v: string) => (v.trim() === "" ? null : v);
    return {
      name: f.name.trim(), nameBn: f.nameBn.trim(), slug: f.slug || undefined, productCode: f.productCode.trim() || undefined, barcode: f.barcode.trim() || undefined,
      description: f.description, shortDescription: f.shortDescription || undefined,
      descriptionBn: f.descriptionBn, shortDescriptionBn: f.shortDescriptionBn,
      unitId: f.unitId || undefined, packSize: f.packSize.trim(), isWeighed: f.isWeighed,
      ...(f.unitId ? { sellStep: f.sellStep === "" ? null : Number(f.sellStep), minQty: f.minQty === "" ? (f.sellStep !== "" ? Number(f.sellStep) : null) : Number(f.minQty), maxQty: f.maxQty === "" ? null : Number(f.maxQty) } : {}),
      status: f.status, categoryId: f.categoryId, brandId: f.brandId || undefined,
      buyingPrice: Number(f.buyingPrice), regularPrice: Number(f.regularPrice), sellingPrice: Number(f.sellingPrice),
      discountPrice: f.discountPrice === "" ? null : Number(f.discountPrice),
      discountStart: f.discountPrice === "" ? null : fromLocalInput(f.discountStart),
      discountEnd: f.discountPrice === "" ? null : fromLocalInput(f.discountEnd),
      discountLabel: clearOr(f.discountLabel),
      trackStock: f.trackStock,
      ...(hasVariants ? {} : { stock: f.trackStock ? Number(f.stock || 0) : 0 }),
      lowStockThreshold: f.trackStock ? Number(f.lowStockThreshold || 0) : 0, freeShipping: f.freeShipping,
      weight: num(f.weight), length: num(f.length), width: num(f.width), height: num(f.height),
      isFeatured: f.isFeatured, isNew: f.isNew, isHot: f.isHot, isBestSeller: f.isBestSeller, isLimitedStock: f.isLimitedStock,
      metaTitle: f.metaTitle || undefined, metaDescription: f.metaDescription || undefined, metaKeywords: f.metaKeywords || undefined,
      tags: f.tags.split(",").map((s) => s.trim()).filter(Boolean),
      attributes: f.attrs.filter((a) => a.name.trim() && a.value.trim()),
      medicineMeta: f.medicineMeta,
    };
  };

  const save = useAct(
    async () => {
      if (!validate()) throw new Error("Validation");
      if (isNew) {
        const p = await productsApi.create({ ...build(), ...(hasVariants ? { variants: variants.map(toInput) } : {}) });
        if (staged.length) {
          setStagedProgress(0);
          await productsApi
            .uploadImages(p.id, staged, undefined, (pct) => setStagedProgress(pct))
            .catch((e) => toast.warning(`Product saved, but photos failed: ${errorMessage(e)}`));
          setStagedProgress(null);
        }
        return p;
      }
      return productsApi.update(id!, build());
    },
    {
      success: isNew ? tr("Product created") : "Product saved",
      invalidate: [["products"], ["product", id], ["inventory"], ["featured-products"]],
      onSuccess: (p) => { if (isNew) nav(`/products/${p.id}/edit`, { replace: true }); },
      silentError: (e) => e instanceof Error && e.message === "Validation",
    },
  );
  const dup = useAct(() => productsApi.duplicate(id!), { success: tr("Copy created as a draft"), invalidate: [["products"]], onSuccess: (p) => nav(`/products/${p.id}/edit`) });
  const del = useAct(() => productsApi.remove(id!), { success: tr("Product removed"), invalidate: [["products"]], onSuccess: () => nav("/products") });

  const margin = Number(f.sellingPrice) > 0 && f.buyingPrice !== "" ? ((Number(f.sellingPrice) - Number(f.buyingPrice)) / Number(f.sellingPrice)) * 100 : null;

  return (
    <div>
      <PageHeader
        back={{ to: "/products", label: tr("Products") }}
        title={<span className="flex items-center gap-2">{isNew ? tr("Add product") : f.name || "Edit product"}{p && <StatusBadge status={p.status} />}</span>}
        description={p ? `${p._count.orderItems} sold orders · ${p._count.reviews} reviews · ${p._count.questions} questions` : tr("Fill in the details, then add photos and variants.")}
        actions={
          <>
            {!isNew && <Button variant="outline" size="sm" loading={dup.isPending} onClick={() => dup.mutate()}><Copy />{" "}{tr("Duplicate")}</Button>}
            {!isNew && <Button variant="outline" size="sm" onClick={() => setDelOpen(true)}><Trash2 className="text-destructive" />{" "}{tr("Delete")}</Button>}
            <Button variant="brand" size="sm" loading={save.isPending} onClick={() => save.mutate()}>{isNew ? tr("Create product") : tr("Save changes")}</Button>
          </>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="basics">{tr("Basics")}</TabsTrigger>
          <TabsTrigger value="pricing">{tr("Pricing")}</TabsTrigger>
          <TabsTrigger value="inventory">{tr("Inventory & shipping")}</TabsTrigger>
          <TabsTrigger value="photos">{tr("Photos")}{p ? ` (${fmtNum(p.images.length)})` : staged.length ? ` (${fmtNum(staged.length)})` : ""}</TabsTrigger>
          <TabsTrigger value="variants">{tr("Variants")}{variants.length ? ` (${fmtNum(variants.length)})` : ""}</TabsTrigger>
          <TabsTrigger value="details">{tr("Details & tags")}</TabsTrigger>
          <TabsTrigger value="seo">{tr("SEO")}</TabsTrigger>
        </TabsList>

        <TabsContent value="basics" className="space-y-4">
          <MedExAutoFill
            showSearch={isNew}
            medicineMeta={f.medicineMeta}
            onSelectMedicine={handleSelectMedEx}
            onChangeMeta={(meta) => set("medicineMeta", meta)}
          />

          <Section title={tr("General")}>
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={tr("Product name (Bangla)")} required error={errs.nameBn}>
                  <Input value={f.nameBn} maxLength={200} onChange={(e) => set("nameBn", e.target.value)} placeholder="রুই মাছ" />
                </Field>
                <Field label={tr("Product name (English)")} required error={errs.name} hint={tr("Makes the web address")}>
                  <Input value={f.name} maxLength={200} onChange={(e) => { set("name", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} placeholder={tr("Rui fish")} />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label={tr("URL slug")} error={errs.slug} hint={tr("Auto-made from the name")}><Input value={f.slug} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }} /></Field>
                <Field label={tr("Product code / SKU")}><Input value={f.productCode} onChange={(e) => set("productCode", e.target.value)} /></Field>
                <Field label={tr("Barcode")}><Input value={f.barcode} onChange={(e) => set("barcode", e.target.value)} /></Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label={tr("Category")} required error={errs.categoryId} hint={tr("Pick the most exact one")}>
                  <Select value={f.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                    <option value="">{tr("Choose…")}</option>
                    {catOptions.map((o) => <option key={o.node.id} value={o.node.id}>{o.path}</option>)}
                  </Select>
                </Field>
                <Field label={tr("Brand (optional)")}>
                  <Select value={f.brandId} onChange={(e) => set("brandId", e.target.value)}>
                    <option value="">{tr("No brand")}</option>
                    {brands.data?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </Select>
                </Field>
                <Field label={tr("Status")} hint={tr("Draft / inactive are hidden from the shop")}>
                  <Select value={f.status} onChange={(e) => set("status", e.target.value as ProductStatus)}>
                    {["ACTIVE", "DRAFT", "INACTIVE", "OUT_OF_STOCK", "DISCONTINUED"].map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
                  </Select>
                </Field>
              </div>
            </div>
          </Section>
          <Section title={tr("How it is sold")} description={tr("The unit shows on the product card (৳380 / kg). The + and − buttons move by the step.")}>
            {errs.sale && <p className="mb-3 rounded bg-red-50 px-3 py-2 text-xs font-medium text-destructive dark:bg-red-500/10">{errs.sale}</p>}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Field label={tr("Unit")} hint={<Link to="/units" className="underline">{tr("Manage units")}</Link>}>
                <Select value={f.unitId} onChange={(e) => set("unitId", e.target.value)}>
                  <option value="">{tr("None (whole pieces)")}</option>
                  {unitOptions.map((u) => <option key={u.id} value={u.id}>{u.name} · {u.nameBn}{u.isActive ? "" : " (off)"}</option>)}
                </Select>
              </Field>
              <Field label={tr("Pack size")} hint={tr("Optional, e.g. 500 g")}><Input value={f.packSize} maxLength={40} onChange={(e) => set("packSize", e.target.value)} /></Field>
              <Field label={tr("Step")} hint={unit ? `Empty = unit step (${unit.defaultStep})` : tr("Choose a unit first")}><Input type="number" min={0} step="0.001" value={f.sellStep} disabled={!f.unitId} onChange={(e) => set("sellStep", e.target.value)} placeholder={unit ? String(unit.defaultStep) : ""} /></Field>
              <Field
                label={tr("Smallest quantity")}
                hint={
                  unit
                    ? f.sellStep !== ""
                      ? tr("Empty = step ({{step}})", { step: f.sellStep })
                      : `Empty = unit minimum (${unit.defaultMinQty})`
                    : tr("Choose a unit first")
                }
              >
                <Input
                  type="number"
                  min={0}
                  step="0.001"
                  value={f.minQty}
                  disabled={!f.unitId}
                  onChange={(e) => set("minQty", e.target.value)}
                  placeholder={f.sellStep !== "" ? f.sellStep : unit ? String(unit.defaultMinQty) : ""}
                />
              </Field>
              <Field
                label={tr("Maximum order")}
                hint={unit ? tr("Empty = no limit") : tr("Choose a unit first")}
              >
                <Input
                  type="number"
                  min={0}
                  step="0.001"
                  value={f.maxQty}
                  disabled={!f.unitId}
                  onChange={(e) => set("maxQty", e.target.value)}
                  placeholder={tr("No limit")}
                />
              </Field>
            </div>
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-[13px]"><Checkbox checked={f.isWeighed} onChange={(e) => set("isWeighed", e.target.checked)} />{tr("Weighed when packed: the final weight (and bill) can differ a little from what was ordered")}</label>
          </Section>
          <Section title={tr("Description")}>
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={tr("Short description (Bangla)")} hint={tr("One or two lines, shown near the price")}><Textarea rows={2} maxLength={1000} value={f.shortDescriptionBn} onChange={(e) => set("shortDescriptionBn", e.target.value)} /></Field>
                <Field label={tr("Short description (English)")}><Textarea rows={2} maxLength={1000} value={f.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} /></Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={tr("Full description (Bangla)")}><Textarea rows={6} value={f.descriptionBn} onChange={(e) => set("descriptionBn", e.target.value)} /></Field>
                <Field label={tr("Full description (English)")} error={errs.description}><Textarea rows={6} value={f.description} onChange={(e) => set("description", e.target.value)} /></Field>
              </div>
            </div>
          </Section>
          <Section title={tr("Badges & shop sections")} description={tr("Where the product is highlighted on the website.")}>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {([["isFeatured", tr("Featured")], ["isNew", tr("New arrival")], ["isHot", tr("Hot")], ["isBestSeller", tr("Best seller")], ["isLimitedStock", tr("Limited stock")]] as const).map(([k, label]) => (
                <label key={k} className="flex cursor-pointer items-center gap-2 text-[13px]"><Checkbox checked={f[k]} onChange={(e) => set(k, e.target.checked)} />{label}</label>
              ))}
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <Section title={tr("Prices (৳)")}>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label={tr("Cost price (what you pay)")} required error={errs.buyingPrice}><Input type="number" min={0} step="0.01" value={f.buyingPrice} onChange={(e) => set("buyingPrice", e.target.value)} /></Field>
              <Field label={tr("Regular price (MRP)")} required error={errs.regularPrice} hint={tr("The crossed-out 'was' price")}><Input type="number" min={0} step="0.01" value={f.regularPrice} onChange={(e) => set("regularPrice", e.target.value)} /></Field>
              <Field label={tr("Selling price")} required error={errs.sellingPrice}><Input type="number" min={0} step="0.01" value={f.sellingPrice} onChange={(e) => set("sellingPrice", e.target.value)} /></Field>
            </div>
            {margin !== null && <p className="mt-3 text-xs text-muted-foreground">{tr("Margin at the selling price:")}{" "}<b className={margin < 0 ? "text-destructive" : "text-foreground"}>{margin.toFixed(1)}%</b> · profit {money(Number(f.sellingPrice) - Number(f.buyingPrice))} per unit</p>}
          </Section>
          <Section title={tr("Scheduled discount")} description={tr("The promo price switches on and off by itself between the two dates. Leave the price empty for no discount.")}>
            <div className="grid gap-3 sm:grid-cols-4">
              <Field label={tr("Promo price ৳")} error={errs.discountPrice}><Input type="number" min={0} step="0.01" value={f.discountPrice} onChange={(e) => set("discountPrice", e.target.value)} /></Field>
              <Field label={tr("Starts")} hint={tr("Empty = now")}><Input type="datetime-local" value={f.discountStart} onChange={(e) => set("discountStart", e.target.value)} disabled={f.discountPrice === ""} /></Field>
              <Field label={tr("Ends")} error={errs.discountEnd} hint={tr("Empty = until removed")}><Input type="datetime-local" value={f.discountEnd} onChange={(e) => set("discountEnd", e.target.value)} disabled={f.discountPrice === ""} /></Field>
              <Field label={tr("Label")}><Input value={f.discountLabel} maxLength={60} onChange={(e) => set("discountLabel", e.target.value)} placeholder={tr("Eid offer")} disabled={f.discountPrice === ""} /></Field>
            </div>
            {p?.isDiscounted && <p className="mt-3 text-xs font-medium text-emerald-700 dark:text-emerald-400">Discount is live now: customers pay {money(p.sellingPrice)}.</p>}
          </Section>
          {p && p.priceHistory.length > 0 && (
            <Section title={tr("Price history")}>
              <ul className="space-y-1 text-[13px]">
                {p.priceHistory.slice(0, 8).map((h) => <li key={h.id} className="flex justify-between"><span className="text-muted-foreground">{new Date(h.recordedAt).toLocaleString()}</span><b>{money(h.price)}</b></li>)}
              </ul>
            </Section>
          )}
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Section title={tr("Stock")}>
            <div className="space-y-4">
              {f.medicineMeta ? (
                <div className="rounded-md border border-emerald-500/20 bg-emerald-50/50 p-3 text-xs text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300">
                  <span className="font-semibold">{tr("Medicine stock:")}</span>{" "}
                  {tr("Stock count is not tracked for medicines. All medicines have unlimited stock while Active.")}
                </div>
              ) : (
                <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-border bg-muted/20 p-3 text-[13px]">
                  <Checkbox checked={f.trackStock} onChange={(e) => set("trackStock", e.target.checked)} className="mt-0.5" />
                  <div className="min-w-0">
                    <span className="font-semibold text-foreground">{tr("Track inventory count")}</span>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {f.trackStock
                        ? tr("Quantity is strictly counted and decremented on orders.")
                        : tr("Daily Fresh / Bazaar items: Stock count is skipped. Product availability is managed daily on the shop.")}
                    </p>
                  </div>
                </label>
              )}

              {f.trackStock && !f.medicineMeta ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label={tr("Quantity in stock")} hint={hasVariants ? tr("Total of the variants — change each variant's stock instead") : isNew ? tr("Opening stock") : tr("Use Inventory → Adjust to change stock with a record")}>
                    <Input type="number" min={0} step="0.001" value={hasVariants ? String(variants.reduce((s, v) => s + Number(v.stock || 0), 0)) : f.stock} onChange={(e) => set("stock", e.target.value)} disabled={hasVariants || !isNew} />
                  </Field>
                  <Field label={tr("Low-stock alert at")} hint={tr("You get a bell alert when stock drops to this")}><Input type="number" min={0} value={f.lowStockThreshold} onChange={(e) => set("lowStockThreshold", e.target.value)} /></Field>
                </div>
              ) : !f.medicineMeta ? (
                <div className="rounded-md border border-emerald-500/20 bg-emerald-50/50 p-3 text-xs text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300">
                  {tr("Daily fresh item: Numerical stock is not required. The product is always in-stock while status is Live/Active.")}
                </div>
              ) : null}
            </div>
          </Section>
          <Section title={tr("Shipping")}>
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center gap-2 text-[13px]"><Checkbox checked={f.freeShipping} onChange={(e) => set("freeShipping", e.target.checked)} />{tr("Free shipping for this product")}</label>
              <div className="grid gap-3 sm:grid-cols-4">
                <Field label={tr("Weight (kg)")}><Input type="number" min={0} step="0.01" value={f.weight} onChange={(e) => set("weight", e.target.value)} /></Field>
                <Field label={tr("Length (cm)")}><Input type="number" min={0} value={f.length} onChange={(e) => set("length", e.target.value)} /></Field>
                <Field label={tr("Width (cm)")}><Input type="number" min={0} value={f.width} onChange={(e) => set("width", e.target.value)} /></Field>
                <Field label={tr("Height (cm)")}><Input type="number" min={0} value={f.height} onChange={(e) => set("height", e.target.value)} /></Field>
              </div>
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="photos">
          <Section title={tr("Photos")}><PhotosEditor productId={id} images={p?.images} staged={staged} onStage={setStaged} stagedProgress={stagedProgress} /></Section>
        </TabsContent>

        <TabsContent value="variants">
          <Section title={tr("Variants")}>
            {errs.variants && <p className="mb-3 rounded bg-red-50 px-3 py-2 text-xs font-medium text-destructive dark:bg-red-500/10">{errs.variants}</p>}
            <VariantsEditor productId={id} value={variants} onChange={setVariants} saved={p?.variants} />
          </Section>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Section title={tr("Filter attributes")} description={tr("Used by the shop's filters and shown as product details, e.g. Origin = Local, Type = Organic.")}>
            <div className="space-y-2">
              {f.attrs.map((a, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={a.name} placeholder={tr("Name")} onChange={(e) => set("attrs", f.attrs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                  <Input value={a.value} placeholder={tr("Value")} onChange={(e) => set("attrs", f.attrs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                  <Button size="icon-sm" variant="ghost" aria-label={tr("Remove")} onClick={() => set("attrs", f.attrs.filter((_, j) => j !== i))}><Trash2 /></Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => set("attrs", [...f.attrs, { name: "", value: "" }])}><Plus />{" "}{tr("Add attribute")}</Button>
            </div>
          </Section>
          <Section title={tr("Tags")}>
            <Field label={tr("Tags")} hint={tr("Separate with commas")}><Input value={f.tags} onChange={(e) => set("tags", e.target.value)} placeholder={tr("organic, fresh, local")} /></Field>
          </Section>
        </TabsContent>

        <TabsContent value="seo">
          <Section title={tr("Search engines")} description={tr("Shown in Google results. Leave empty to use the product name and description.")}>
            <div className="space-y-3">
              <Field label={tr("Meta title")} hint={`${f.metaTitle.length}/70`}><Input value={f.metaTitle} maxLength={70} onChange={(e) => set("metaTitle", e.target.value)} /></Field>
              <Field label={tr("Meta description")} hint={`${f.metaDescription.length}/160`}><Textarea rows={3} maxLength={160} value={f.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} /></Field>
              <Field label={tr("Keywords")}><Input value={f.metaKeywords} onChange={(e) => set("metaKeywords", e.target.value)} /></Field>
              <div className="rounded border border-border p-3">
                <p className="text-[13px] font-medium text-blue-700 dark:text-blue-400">{f.metaTitle || f.name || "Product title"}</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">bazarshodai.com/products/{f.slug || "product-slug"}</p>
                <p className="text-xs text-muted-foreground">{f.metaDescription || f.shortDescription || "Description appears here."}</p>
              </div>
            </div>
          </Section>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
        <Button variant="outline" onClick={() => nav("/products")}>{tr("Back to list")}</Button>
        <Button variant="brand" loading={save.isPending} onClick={() => save.mutate()}>{isNew ? tr("Create product") : tr("Save changes")}</Button>
      </div>

      <ConfirmDialog open={delOpen} onOpenChange={setDelOpen} title={`Delete "${f.name}"?`} description={p && p._count.orderItems > 0 ? tr("It has been ordered before, so it is hidden instead of erased. Order history stays intact.") : tr("This cannot be undone.")} confirmLabel={tr("Delete")} destructive loading={del.isPending} onConfirm={() => del.mutate()} />

      {stagedProgress !== null && (
        <div className="fixed bottom-6 right-6 z-50 w-80 shadow-2xl">
          <UploadProgressBar
            progress={stagedProgress}
            label={tr("Uploading {{count}} photos…", { count: staged.length })}
            processingLabel={tr("Saving & optimizing photos…")}
          />
        </div>
      )}
    </div>
  );
}

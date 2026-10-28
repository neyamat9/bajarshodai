import { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  ExternalLink,
  Pill,
  ShieldAlert,
  Sparkles,
  Percent,
  SlidersHorizontal,
  ArrowRight,
  Info,
} from "lucide-react";
import { medicineApi, type MedicineListResponse } from "@/api/medicine";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { EmptyState, ErrorState } from "@/components/shared/EmptyState";
import { useAct } from "@/hooks/useAct";
import { tr } from "@/i18n";

export default function MedicineSync() {
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("");
  const [generic, setGeneric] = useState("");
  const [dosageForm, setDosageForm] = useState("");
  const [type, setType] = useState("");
  const [syncStatus, setSyncStatus] = useState("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery<MedicineListResponse>({
    queryKey: ["medicines", search, brand, generic, dosageForm, type, syncStatus, page],
    queryFn: () =>
      medicineApi.list({
        search: search || undefined,
        brand: brand || undefined,
        generic: generic || undefined,
        dosageForm: dosageForm || undefined,
        type: type || undefined,
        syncStatus: syncStatus || undefined,
        page,
        limit: 25,
      }),
  });

  const audit = useAct(() => medicineApi.auditDrift(), {
    success: tr("Market price audit completed"),
    invalidate: [["medicines"]],
    onSuccess: (res: any) => {
      toast.info(
        `Audited ${res.totalAudited} medicines. Found ${res.driftedCount} price revisions.`,
      );
    },
  });

  const acceptAll = useAct(() => medicineApi.acceptAllDrifts(), {
    success: tr("All price revisions applied to catalog"),
    invalidate: [["medicines"], ["products"]],
    onSuccess: (res: any) => {
      toast.success(`Updated ${res.updatedCount} medicine prices.`);
    },
  });

  const syncSingle = useAct((id: string) => medicineApi.syncPrice(id), {
    success: tr("Medicine price synced with MedEx"),
    invalidate: [["medicines"], ["products"]],
    onSuccess: (res: any) => {
      if (res.detectedDrift) {
        toast.warning(
          `Market price drift detected: ৳ ${res.marketPrice} vs Current ৳ ${res.sellingPrice}`,
        );
      } else {
        toast.success("Price is up-to-date with MedEx.");
      }
    },
  });

  const applyDrift = useAct((id: string) => medicineApi.acceptDrift(id), {
    success: tr("Applied MedEx price revision"),
    invalidate: [["medicines"], ["products"]],
  });

  // ── Global Discount Settings & Actions ─────────────────────────
  const { data: discountData } = useQuery({
    queryKey: ["medicine-discount-settings"],
    queryFn: () => medicineApi.getDiscountSettings(),
  });

  const activeGlobalPercent = discountData?.globalDiscountPercent ?? 0;
  const [globalPercentInput, setGlobalPercentInput] = useState<number | null>(null);
  const currentTargetPercent = globalPercentInput !== null ? globalPercentInput : activeGlobalPercent;

  const saveGlobalDiscount = useAct(
    (percent: number) => medicineApi.setGlobalDiscount(percent),
    {
      success: tr("Global medicine discount applied successfully"),
      invalidate: [["medicines"], ["products"], ["medicine-discount-settings"]],
      onSuccess: (res: any) => {
        toast.success(
          `Updated ${res.updatedMedicinesCount} medicines to ${res.globalDiscountPercent}% discount.`,
        );
        setGlobalPercentInput(null);
      },
    },
  );

  // ── Single Medicine Pricing Modal & Handlers ───────────────────
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [singleDiscountMode, setSingleDiscountMode] = useState<
    "GLOBAL" | "PERCENT" | "FIXED" | "NONE"
  >("GLOBAL");
  const [singleCustomValue, setSingleCustomValue] = useState<string>("");

  function openPricingModal(product: any) {
    setSelectedProduct(product);
    const meta = product.medicineMeta;
    setSingleDiscountMode((meta?.discountMode as any) || "GLOBAL");
    setSingleCustomValue(
      meta?.discountValue !== null && meta?.discountValue !== undefined
        ? String(meta.discountValue)
        : "",
    );
  }

  const saveSinglePricing = useAct(
    () => {
      if (!selectedProduct) return Promise.resolve();
      const val = parseFloat(singleCustomValue);
      return medicineApi.setSinglePricing(selectedProduct.id, {
        discountMode: singleDiscountMode,
        discountValue: !isNaN(val) ? val : undefined,
      });
    },
    {
      success: tr("Medicine pricing updated successfully"),
      invalidate: [["medicines"], ["products"], ["medicine-discount-settings"]],
      onSuccess: () => {
        setSelectedProduct(null);
      },
    },
  );

  const stats = data?.stats ?? {
    totalMedicines: 0,
    syncedMedicines: 0,
    driftCount: 0,
    prescriptionCount: 0,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={tr("Medicine Hub & Price Sync")}
        description={tr(
          "Factual pharmaceutical catalog, MedEx live sync, and market MRP drift audit",
        )}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              loading={audit.isPending}
              onClick={() => audit.mutate()}
              className="gap-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
            >
              <RefreshCw className="h-4 w-4" />
              {tr("Audit MedEx Prices")}
            </Button>
            {stats.driftCount > 0 && (
              <Button
                loading={acceptAll.isPending}
                onClick={() => acceptAll.mutate()}
                className="gap-2 bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500"
              >
                <Sparkles className="h-4 w-4" />
                {tr("Accept All Revisions")} ({stats.driftCount})
              </Button>
            )}
            <Link to="/products/new">
              <Button className="gap-2">
                <Pill className="h-4 w-4" />
                {tr("Add Medicine")}
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="flex items-center gap-3 p-4 border-l-4 border-l-blue-500">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Pill className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              {tr("Total Medicines")}
            </p>
            <p className="text-xl font-bold tracking-tight">
              {stats.totalMedicines}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-3 p-4 border-l-4 border-l-emerald-500">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              {tr("Synced & Verified")}
            </p>
            <p className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {stats.syncedMedicines}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-3 p-4 border-l-4 border-l-amber-500">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              {tr("Price Drift Detected")}
            </p>
            <p className="text-xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
              {stats.driftCount}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-3 p-4 border-l-4 border-l-indigo-500">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              {tr("Prescription Required")}
            </p>
            <p className="text-xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
              {stats.prescriptionCount}
            </p>
          </div>
        </Card>
      </div>

      {/* ── Sitewide Medicine Discount Controller ─────────────────────── */}
      <Card className="p-4 sm:p-5 border-emerald-500/30 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Percent className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base text-foreground">
                  {tr("Sitewide Medicine Discount")}
                </h3>
                {activeGlobalPercent > 0 ? (
                  <Badge className="bg-emerald-600 text-white font-bold text-xs">
                    {activeGlobalPercent}% {tr("Active")}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground text-xs">
                    {tr("Disabled (0%)")}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {tr(
                  "Configure default percentage discount off official MedEx MRP across all medicines inheriting global rules.",
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:self-center">
            <span className="text-xs text-muted-foreground font-medium">
              {tr("Presets:")}
            </span>
            {[0, 5, 7, 10, 12].map((pct) => (
              <Button
                key={pct}
                size="sm"
                variant={currentTargetPercent === pct ? "default" : "outline"}
                className={`h-7 px-2.5 text-xs font-semibold ${
                  currentTargetPercent === pct
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "border-border hover:border-emerald-500/40"
                }`}
                onClick={() => setGlobalPercentInput(pct)}
              >
                {pct === 0 ? tr("Off") : `${pct}%`}
              </Button>
            ))}
            <div className="flex items-center gap-1.5 ml-1">
              <Input
                type="number"
                min={0}
                max={100}
                className="h-7 w-16 text-center text-xs font-mono font-bold"
                value={currentTargetPercent}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setGlobalPercentInput(isNaN(val) ? 0 : Math.max(0, Math.min(100, val)));
                }}
              />
              <span className="text-xs font-bold text-muted-foreground">%</span>
            </div>

            <Button
              size="sm"
              loading={saveGlobalDiscount.isPending}
              disabled={currentTargetPercent === activeGlobalPercent}
              className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white ml-2 text-xs"
              onClick={() => saveGlobalDiscount.mutate(currentTargetPercent)}
            >
              <Sparkles className="size-3.5" />
              {tr("Apply to All Medicines")}
            </Button>
          </div>
        </div>

        {/* Live Simulation & Coverage Metrics */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-emerald-500/15 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Info className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              {currentTargetPercent > 0
                ? tr("Preview: Napa 500mg Strip MRP ৳ 8.00 → Sale Price ৳ ") +
                  (8 * (1 - currentTargetPercent / 100)).toFixed(2) +
                  ` (${currentTargetPercent}% OFF)`
                : tr("Preview: Napa 500mg Strip will sell at full MRP ৳ 8.00 (No Discount)")}
            </span>
          </div>

          {discountData?.stats && (
            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              <span className="inline-flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                <strong>{discountData.stats.globalCount}</strong> {tr("Global")}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-purple-500" />
                <strong>{discountData.stats.customCount}</strong> {tr("Custom Overrides")}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-muted-foreground" />
                <strong>{discountData.stats.noneCount}</strong> {tr("Full MRP")}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Filter and Search Bar */}
      <Card className="p-3.5 space-y-3">
        <div className="grid gap-2.5 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={tr("Search by medicine name...")}
              className="pl-9"
            />
          </div>

          <div className="relative">
            <Input
              value={brand}
              onChange={(e) => {
                setBrand(e.target.value);
                setPage(1);
              }}
              placeholder={tr("Filter by brand / company (e.g. Square)...")}
            />
          </div>

          <div className="relative">
            <Input
              value={generic}
              onChange={(e) => {
                setGeneric(e.target.value);
                setPage(1);
              }}
              placeholder={tr("Filter by generic name (e.g. Paracetamol)...")}
            />
          </div>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-4 items-center">
          <Select
            value={dosageForm}
            onChange={(e) => {
              setDosageForm(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{tr("All Dosage Forms")}</option>
            <option value="Tablet">Tablet</option>
            <option value="Capsule">Capsule</option>
            <option value="Syrup">Syrup</option>
            <option value="Suspension">Suspension</option>
            <option value="Drop">Drop</option>
            <option value="Ointment">Ointment / Cream</option>
            <option value="Injection">Injection</option>
          </Select>

          <Select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{tr("All Types (OTC & Rx)")}</option>
            <option value="OTC">OTC (Over the Counter)</option>
            <option value="PRESCRIPTION">Rx (Prescription Only)</option>
          </Select>

          <Select
            value={syncStatus}
            onChange={(e) => {
              setSyncStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">{tr("All Statuses")}</option>
            <option value="SYNCED">{tr("Synced")}</option>
            <option value="DRIFT_DETECTED">{tr("Drift Detected")}</option>
            <option value="FAILED">{tr("Sync Failed")}</option>
          </Select>

          {(search || brand || generic || dosageForm || type || syncStatus !== "ALL") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setBrand("");
                setGeneric("");
                setDosageForm("");
                setType("");
                setSyncStatus("ALL");
                setPage(1);
              }}
              className="w-full text-xs"
            >
              {tr("Clear All Filters")}
            </Button>
          )}
        </div>
      </Card>

      {/* Data Table */}
      {isLoading ? (
        <Card className="p-8 text-center text-muted-foreground">
          <RefreshCw className="mx-auto h-6 w-6 animate-spin mb-2" />
          <p>{tr("Loading medicine catalog...")}</p>
        </Card>
      ) : isError ? (
        <ErrorState message="Could not load medicines" onRetry={() => refetch()} />
      ) : !data?.items.length ? (
        <EmptyState
          icon={<Pill className="size-6" />}
          title={tr("No medicines found")}
          description={tr(
            "Add medicines in Product Editor or use 1-click MedEx lookup to populate the catalog.",
          )}
          action={
            <Link to="/products/new">
              <Button>{tr("Create Medicine")}</Button>
            </Link>
          }
        />
      ) : (
        <Card className="overflow-hidden border">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">{tr("Medicine / Brand")}</th>
                  <th className="px-4 py-3">{tr("Generic & Manufacturer")}</th>
                  <th className="px-4 py-3">{tr("Type")}</th>
                  <th className="px-4 py-3 text-right">{tr("Our Price")}</th>
                  <th className="px-4 py-3 text-center">{tr("Pricing Rule")}</th>
                  <th className="px-4 py-3 text-right">{tr("MedEx Live MRP")}</th>
                  <th className="px-4 py-3 text-center">{tr("Sync Status")}</th>
                  <th className="px-4 py-3 text-right">{tr("Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.items.map((prod) => {
                  const meta = prod.medicineMeta;
                  const currentPrice = Number(prod.sellingPrice);
                  const mrp = Number(
                    meta?.mrpStrip ?? meta?.mrpUnit ?? meta?.mrpBox ?? currentPrice,
                  );
                  const hasDrift = meta?.syncStatus === "DRIFT_DETECTED";
                  const isPrescription = meta?.type === "PRESCRIPTION";

                  return (
                    <tr
                      key={prod.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {/* Brand & Strength */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 font-medium">
                            <span className="text-foreground">{prod.name}</span>
                            {meta?.dosageForm && (
                              <Badge
                                variant="outline"
                                className="text-[10px] py-0 px-1 font-normal bg-muted/50"
                              >
                                {meta.dosageForm}
                              </Badge>
                            )}
                          </div>
                          {prod.nameBn && (
                            <span className="text-xs text-muted-foreground">
                              {prod.nameBn}
                            </span>
                          )}
                          {meta?.strength && (
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {meta.strength}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Generic & Company */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5 max-w-[220px]">
                          <span className="font-medium text-xs text-foreground truncate">
                            {meta?.genericName || "—"}
                          </span>
                          <span className="text-[11px] text-muted-foreground truncate">
                            {meta?.manufacturer || "—"}
                          </span>
                        </div>
                      </td>

                      {/* Rx / OTC Badge */}
                      <td className="px-4 py-3">
                        {isPrescription ? (
                          <Badge className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20 text-[11px]">
                            Rx Prescription
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[11px]">
                            OTC
                          </Badge>
                        )}
                      </td>

                      {/* Our Price */}
                      <td className="px-4 py-3 text-right font-medium">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-foreground">
                            ৳ {currentPrice.toFixed(2)}
                          </span>
                          {currentPrice < mrp && (
                            <span className="text-[10px] text-muted-foreground line-through">
                              ৳ {mrp.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Pricing Rule */}
                      <td className="px-4 py-3 text-center">
                        {meta?.discountMode === "PERCENT" ? (
                          <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20 text-[10px] font-semibold">
                            {meta.discountValue}% Custom
                          </Badge>
                        ) : meta?.discountMode === "FIXED" ? (
                          <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 text-[10px] font-semibold">
                            Fixed ৳{meta.discountValue}
                          </Badge>
                        ) : meta?.discountMode === "NONE" ? (
                          <Badge variant="outline" className="text-muted-foreground text-[10px]">
                            Full MRP (0%)
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-semibold"
                          >
                            {activeGlobalPercent > 0
                              ? `${activeGlobalPercent}% Global`
                              : "Global (0%)"}
                          </Badge>
                        )}
                      </td>

                      {/* MedEx MRP */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end">
                          <span
                            className={`font-semibold ${
                              hasDrift
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-foreground"
                            }`}
                          >
                            ৳ {mrp.toFixed(2)}
                          </span>
                          {meta?.packSizeInfo && (
                            <span className="text-[10px] text-muted-foreground">
                              {meta.packSizeInfo}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Sync Status Badge */}
                      <td className="px-4 py-3 text-center">
                        {hasDrift ? (
                          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[11px] animate-pulse">
                            Drift Detected
                          </Badge>
                        ) : meta?.syncStatus === "FAILED" ? (
                          <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[11px]">
                            Sync Failed
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px]">
                            Verified
                          </Badge>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasDrift && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                              loading={applyDrift.isPending}
                              onClick={() => applyDrift.mutate(prod.id)}
                            >
                              Apply ৳{mrp}
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            title={tr("Sync with MedEx")}
                            loading={syncSingle.isPending}
                            onClick={() => syncSingle.mutate(prod.id)}
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>

                          {meta?.medexUrl && (
                            <a
                              href={meta.medexUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                              title={tr("View on MedEx")}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs gap-1 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                            title={tr("Configure Pricing & Discount")}
                            onClick={() => openPricingModal(prod)}
                          >
                            <Percent className="size-3" />
                            <span>{tr("Discount")}</span>
                          </Button>

                          <Link
                            to={`/products/${prod.id}/edit`}
                            className="inline-flex h-7 px-2 items-center justify-center rounded-md text-xs font-medium text-primary hover:bg-primary/10"
                          >
                            {tr("Edit")}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
              <span>
                {tr("Page")} {data.meta.page} {tr("of")} {data.meta.totalPages} (
                {data.meta.total} {tr("medicines")})
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  {tr("Previous")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= data.meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {tr("Next")}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ── Single Medicine Pricing Dialog ────────────────────────────── */}
      <Dialog
        open={!!selectedProduct}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
      >
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Percent className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span>{tr("Medicine Pricing & Discount")}</span>
            </DialogTitle>
            <DialogDescription>
              {selectedProduct?.name} ({selectedProduct?.medicineMeta?.dosageForm}) •{" "}
              {selectedProduct?.medicineMeta?.manufacturer}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            {/* Base MRP Context Box */}
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40 text-xs">
              <div>
                <span className="font-semibold text-muted-foreground block">
                  {tr("Official DGDA / MedEx MRP:")}
                </span>
                <span className="text-base font-bold font-outfit text-foreground">
                  ৳{" "}
                  {Number(
                    selectedProduct?.medicineMeta?.mrpStrip ??
                      (selectedProduct?.medicineMeta?.mrpUnit
                        ? Number(selectedProduct.medicineMeta.mrpUnit) * 10
                        : selectedProduct?.sellingPrice ?? 0),
                  ).toFixed(2)}
                </span>
                {selectedProduct?.medicineMeta?.packSizeInfo && (
                  <span className="text-[11px] text-muted-foreground ml-1.5">
                    ({selectedProduct.medicineMeta.packSizeInfo})
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-muted-foreground block font-medium">
                  {tr("Current Selling Price:")}
                </span>
                <span className="text-base font-bold font-outfit text-emerald-600 dark:text-emerald-400">
                  ৳ {Number(selectedProduct?.sellingPrice ?? 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Radio Mode Selection */}
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-foreground">
                {tr("Select Pricing Rule:")}
              </label>

              {/* Option 1: Inherit Global */}
              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  singleDiscountMode === "GLOBAL"
                    ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <input
                  type="radio"
                  name="pricingMode"
                  value="GLOBAL"
                  checked={singleDiscountMode === "GLOBAL"}
                  onChange={() => setSingleDiscountMode("GLOBAL")}
                  className="mt-0.5 text-emerald-600"
                />
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">
                      {tr("Inherit Sitewide Category Discount")}
                    </span>
                    <Badge variant="outline" className="text-emerald-600">
                      {activeGlobalPercent}% {tr("Global")}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-0.5">
                    {activeGlobalPercent > 0
                      ? tr(
                          "Follows the store's global medicine discount. Automatically adapts when sitewide discount changes.",
                        )
                      : tr(
                          "Global discount is currently 0%. Medicine will sell at full MRP.",
                        )}
                  </p>
                </div>
              </label>

              {/* Option 2: Custom Percentage */}
              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  singleDiscountMode === "PERCENT"
                    ? "border-purple-500 bg-purple-500/5 dark:bg-purple-500/10"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <input
                  type="radio"
                  name="pricingMode"
                  value="PERCENT"
                  checked={singleDiscountMode === "PERCENT"}
                  onChange={() => setSingleDiscountMode("PERCENT")}
                  className="mt-0.5 text-purple-600"
                />
                <div className="flex-1 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">
                      {tr("Custom Percentage Discount")}
                    </span>
                    <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-300">
                      {tr("Priority Override")}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">
                    {tr(
                      "Specify a custom percentage discount off MRP for this specific medicine only.",
                    )}
                  </p>
                  {singleDiscountMode === "PERCENT" && (
                    <div className="flex items-center gap-2 pt-1">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="e.g. 12"
                        className="h-8 w-24 font-mono font-bold"
                        value={singleCustomValue}
                        onChange={(e) => setSingleCustomValue(e.target.value)}
                        autoFocus
                      />
                      <span className="font-bold text-foreground">% OFF</span>
                    </div>
                  )}
                </div>
              </label>

              {/* Option 3: Custom Fixed Price */}
              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  singleDiscountMode === "FIXED"
                    ? "border-blue-500 bg-blue-500/5 dark:bg-blue-500/10"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <input
                  type="radio"
                  name="pricingMode"
                  value="FIXED"
                  checked={singleDiscountMode === "FIXED"}
                  onChange={() => setSingleDiscountMode("FIXED")}
                  className="mt-0.5 text-blue-600"
                />
                <div className="flex-1 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">
                      {tr("Custom Fixed Selling Price")}
                    </span>
                    <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-300">
                      {tr("Fixed ৳")}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">
                    {tr(
                      "Set an exact promotional selling price regardless of MRP calculation.",
                    )}
                  </p>
                  {singleDiscountMode === "FIXED" && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="font-bold text-foreground">৳</span>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder="e.g. 7.00"
                        className="h-8 w-28 font-mono font-bold"
                        value={singleCustomValue}
                        onChange={(e) => setSingleCustomValue(e.target.value)}
                        autoFocus
                      />
                    </div>
                  )}
                </div>
              </label>

              {/* Option 4: No Discount */}
              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  singleDiscountMode === "NONE"
                    ? "border-amber-500 bg-amber-500/5 dark:bg-amber-500/10"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <input
                  type="radio"
                  name="pricingMode"
                  value="NONE"
                  checked={singleDiscountMode === "NONE"}
                  onChange={() => setSingleDiscountMode("NONE")}
                  className="mt-0.5 text-amber-600"
                />
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">
                      {tr("No Discount (Full MRP)")}
                    </span>
                    <Badge variant="outline" className="text-amber-600">
                      0%
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-0.5">
                    {tr(
                      "Explicitly exempt this medicine from any discounts. Always sells at official full MRP.",
                    )}
                  </p>
                </div>
              </label>
            </div>

            {/* Calculated Result Preview */}
            {selectedProduct && (
              <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-foreground block">
                    {tr("Effective Customer Price:")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {singleDiscountMode === "GLOBAL"
                      ? `${activeGlobalPercent}% Sitewide Discount`
                      : singleDiscountMode === "PERCENT"
                        ? `${parseFloat(singleCustomValue) || 0}% Custom Discount`
                        : singleDiscountMode === "FIXED"
                          ? `Fixed ৳ ${parseFloat(singleCustomValue) || 0}`
                          : "Full Retail Price"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black font-outfit text-primary block">
                    ৳{" "}
                    {(() => {
                      const base = Number(
                        selectedProduct.medicineMeta?.mrpStrip ??
                          (selectedProduct.medicineMeta?.mrpUnit
                            ? Number(selectedProduct.medicineMeta.mrpUnit) * 10
                            : selectedProduct.sellingPrice ?? 0),
                      );
                      if (singleDiscountMode === "GLOBAL") {
                        return activeGlobalPercent > 0
                          ? (base * (1 - activeGlobalPercent / 100)).toFixed(2)
                          : base.toFixed(2);
                      }
                      if (singleDiscountMode === "PERCENT") {
                        const p = parseFloat(singleCustomValue) || 0;
                        return (base * (1 - p / 100)).toFixed(2);
                      }
                      if (singleDiscountMode === "FIXED") {
                        return (parseFloat(singleCustomValue) || 0).toFixed(2);
                      }
                      return base.toFixed(2);
                    })()}
                  </span>
                </div>
              </div>
            )}
          </DialogBody>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedProduct(null)}
            >
              {tr("Cancel")}
            </Button>
            <Button
              size="sm"
              loading={saveSinglePricing.isPending}
              onClick={() => saveSinglePricing.mutate()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {tr("Save Pricing Rule")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

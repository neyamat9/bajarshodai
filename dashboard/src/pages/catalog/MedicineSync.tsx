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
} from "lucide-react";
import { medicineApi, type MedicineListResponse } from "@/api/medicine";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
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
                        ৳ {currentPrice.toFixed(2)}
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
    </div>
  );
}

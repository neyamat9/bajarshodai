import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Pill,
  Sparkles,
  Search,
  ExternalLink,
  RefreshCw,
  X,
  CheckCircle2,
} from "lucide-react";
import {
  medicineApi,
  type MedExSearchResult,
  type MedExMedicineDetail,
  type MedicineMeta,
} from "@/api/medicine";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { tr } from "@/i18n";

interface MedExAutoFillProps {
  medicineMeta?: Partial<MedicineMeta> | null;
  onSelectMedicine: (detail: MedExMedicineDetail) => void;
  onChangeMeta: (meta: Partial<MedicineMeta> | null) => void;
}

export function MedExAutoFill({
  medicineMeta,
  onSelectMedicine,
  onChangeMeta,
}: MedExAutoFillProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MedExSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await medicineApi.lookup(query.trim());
        setResults(data);
        setIsOpen(true);
      } catch (err) {
        // Silently fail lookup errors
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const handlePick = async (res: MedExSearchResult) => {
    setIsLoadingDetail(true);
    setIsOpen(false);
    try {
      const detail = await medicineApi.detail(res.url);
      onSelectMedicine(detail);
      setQuery("");
      toast.success(
        tr("Loaded {{name}} with live MedEx data", { name: detail.name }),
      );
    } catch (err) {
      toast.error(tr("Could not load medicine details from MedEx"));
    } finally {
      setIsLoadingDetail(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Search & Auto-Fill Input */}
      <div
        ref={containerRef}
        className="relative rounded-xl border border-blue-500/20 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-cyan-500/5 p-3.5 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <Pill className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold tracking-tight text-foreground flex items-center gap-1.5">
                <span>{tr("1-Click Auto-Fill from MedEx BD")}</span>
                <Sparkles className="h-3 w-3 text-amber-500" />
              </h4>
              <p className="text-[11px] text-muted-foreground">
                {tr(
                  "Type any brand name (e.g. Napa Extra, Seclo, Maxpro) to instantly import factual details & live MRP",
                )}
              </p>
            </div>
          </div>

          {isLoadingDetail && (
            <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>{tr("Fetching pharmaceutical data...")}</span>
            </div>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setIsOpen(true)}
            placeholder={tr("Search brand name (e.g. Napa, Seclo, Alatrol, Sergel)...")}
            className="pl-9 bg-background/90"
          />
          {isSearching && (
            <RefreshCw className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Live Suggestions Dropdown */}
        {isOpen && results.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border bg-popover p-1.5 shadow-xl">
            <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground">
              {tr("Matching Medicines on MedEx BD")}
            </div>
            {results.map((res) => (
              <button
                key={res.medexId}
                type="button"
                onClick={() => handlePick(res)}
                className="w-full text-left flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-xs hover:bg-muted/60 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant="outline" className="text-[10px] px-1 py-0 font-normal">
                    {res.dosageForm}
                  </Badge>
                  <span className="font-semibold text-foreground truncate">
                    {res.name}
                  </span>
                  <span className="text-muted-foreground font-mono text-[11px]">
                    {res.strength}
                  </span>
                </div>
                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium shrink-0">
                  {tr("Select & Import")} →
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Active Medicine Meta Panel */}
      {medicineMeta && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/40 p-3.5 dark:bg-emerald-950/20">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/20 pb-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold text-foreground">
                {tr("Linked Pharmaceutical Metadata")}
              </span>
              <Badge
                className={
                  medicineMeta.type === "PRESCRIPTION"
                    ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20 text-[10px]"
                    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px]"
                }
              >
                {medicineMeta.type === "PRESCRIPTION"
                  ? tr("Rx Prescription")
                  : tr("OTC")}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              {medicineMeta.medexUrl && (
                <a
                  href={medicineMeta.medexUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline dark:text-blue-400"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>{tr("MedEx Page")}</span>
                </a>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChangeMeta(null)}
                className="h-6 px-1.5 text-[11px] text-destructive hover:bg-destructive/10"
              >
                <X className="h-3 w-3 mr-1" />
                {tr("Remove Medicine Data")}
              </Button>
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-4 text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px]">
                {tr("Generic Name")}
              </span>
              <span className="font-semibold text-foreground">
                {medicineMeta.genericName || "—"}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px]">
                {tr("Manufacturer")}
              </span>
              <span className="font-semibold text-foreground">
                {medicineMeta.manufacturer || "—"}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px]">
                {tr("Dosage & Strength")}
              </span>
              <span className="font-semibold text-foreground">
                {medicineMeta.dosageForm} · {medicineMeta.strength}
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px]">
                {tr("Dispensing Requirement")}
              </span>
              <div className="mt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onChangeMeta({
                      ...medicineMeta,
                      type:
                        medicineMeta.type === "PRESCRIPTION"
                          ? "OTC"
                          : "PRESCRIPTION",
                    })
                  }
                  className={`rounded px-2 py-0.5 text-[11px] font-medium border transition-colors ${
                    medicineMeta.type === "PRESCRIPTION"
                      ? "border-indigo-400 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                      : "border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  }`}
                >
                  {medicineMeta.type === "PRESCRIPTION"
                    ? tr("Require Rx Upload")
                    : tr("Over the Counter")}
                </button>
              </div>
            </div>
          </div>

          {/* Pricing breakdown from MedEx */}
          {(medicineMeta.mrpStrip ||
            medicineMeta.mrpUnit ||
            medicineMeta.mrpBox) && (
            <div className="mt-2.5 flex flex-wrap items-center gap-3 border-t border-emerald-500/10 pt-2 text-[11px] text-muted-foreground">
              <span className="font-medium text-foreground">
                {tr("MedEx Verified MRP:")}
              </span>
              {medicineMeta.mrpUnit && (
                <span>
                  {tr("Unit:")}{" "}
                  <strong className="text-foreground">
                    ৳ {Number(medicineMeta.mrpUnit).toFixed(2)}
                  </strong>
                </span>
              )}
              {medicineMeta.mrpStrip && (
                <span>
                  {tr("Strip:")}{" "}
                  <strong className="text-foreground">
                    ৳ {Number(medicineMeta.mrpStrip).toFixed(2)}
                  </strong>
                </span>
              )}
              {medicineMeta.mrpBox && (
                <span>
                  {tr("Box:")}{" "}
                  <strong className="text-foreground">
                    ৳ {Number(medicineMeta.mrpBox).toFixed(2)}
                  </strong>
                </span>
              )}
              {medicineMeta.packSizeInfo && (
                <span className="italic">({medicineMeta.packSizeInfo})</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowDownUp, Check, ChevronDown, LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import type { Locale } from "@/lib/locale";

type SortOption = "popular" | "newest" | "price-asc" | "price-desc" | "rating" | "name";

interface SortBarProps {
  resultCount: number;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  inStockOnly?: boolean;
  onInStockChange?: (val: boolean) => void;
  onOpenFilters?: () => void;
  /** How many filters are switched on (shown on the mobile Filters button) */
  activeCount?: number;
  viewMode?: "list" | "grid";
  onViewModeChange?: (mode: "list" | "grid") => void;
}

const SORT_VALUES: SortOption[] = ["popular", "newest", "price-asc", "price-desc", "rating"];

export default function SortBar({
  resultCount,
  sortBy,
  onSortChange,
  inStockOnly = false,
  onInStockChange,
  onOpenFilters,
  activeCount = 0,
  viewMode,
  onViewModeChange,
}: SortBarProps) {
  const t = useTranslations("Product");
  const locale = useLocale() as Locale;
  const SORT_OPTIONS = SORT_VALUES.map((value) => ({ value, label: t(`sort.${value}`) }));
  const current = SORT_OPTIONS.find((o) => o.value === sortBy) ?? SORT_OPTIONS[0];

  return (
    <div
      className="sticky z-20 mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 rounded-xl border border-border bg-card/95 p-2 sm:px-4 sm:py-2.5 shadow-sm backdrop-blur-md transition-[top] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] w-full min-w-0"
      style={{ top: "var(--sticky-top, 8rem)" }}
    >
      {/* Top row on mobile / Left side on desktop: Filter button + Result Count */}
      <div className="flex items-center justify-between sm:justify-start gap-2.5 min-w-0">
        {onOpenFilters && (
          <button
            type="button"
            onClick={onOpenFilters}
            className="flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-lg bg-primary px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90 lg:hidden"
            aria-label={t("filters.open")}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
            <span>{t("filters.title")}</span>
            {activeCount > 0 && (
              <span className="rounded bg-brand-fresh px-1.5 py-0.5 text-[10px] leading-none text-on-fresh">
                {formatNumber(activeCount, locale, 0)}
              </span>
            )}
          </button>
        )}
        <p className="truncate text-xs sm:text-sm font-medium text-muted-foreground">
          {t("listing.found", { count: formatNumber(resultCount, locale, 0) })}
        </p>
      </div>

      {/* Bottom row on mobile / Right side on desktop: In-Stock, Sort & View Mode */}
      <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2.5 min-w-0 w-full sm:w-auto">
        {onInStockChange && (
          <button
            type="button"
            role="switch"
            aria-checked={inStockOnly}
            onClick={() => onInStockChange(!inStockOnly)}
            className={`group flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-lg border px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-semibold transition-all ${
              inStockOnly
                ? "border-brand-fresh bg-brand-fresh/10 text-accent-text"
                : "border-border bg-background text-muted-foreground hover:border-brand-fresh/60 hover:text-foreground"
            }`}
          >
            <span
              className={`h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full transition-colors ${
                inStockOnly ? "bg-brand-fresh shadow-[0_0_8px_rgba(69,162,44,0.6)]" : "bg-muted-foreground/40"
              }`}
              aria-hidden="true"
            />
            {/* Short label on mobile to ensure zero overflow */}
            <span className="sm:hidden">{locale === "bn" ? "স্টক" : "In Stock"}</span>
            <span className="hidden sm:inline">{t("filters.inStockOnly")}</span>
          </button>
        )}

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={t("sort.aria", { label: current.label })}
                className="group flex items-center gap-1.5 sm:gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-semibold text-foreground transition-colors hover:border-brand-fresh focus-visible:border-brand-fresh focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-fresh/30 data-[state=open]:border-brand-fresh"
              >
                <ArrowDownUp className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                <span className="hidden text-muted-foreground sm:inline">{t("sort.by")}</span>
                <span className="truncate max-w-[70px] xs:max-w-[85px] sm:max-w-none">{current.label}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="z-[1100] min-w-56 rounded border border-border bg-popover p-1.5 shadow-xl">
              <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
                {SORT_OPTIONS.map((opt) => (
                  <DropdownMenuRadioItem
                    key={opt.value}
                    value={opt.value}
                    className="cursor-pointer rounded px-3 py-2.5 pl-3 text-sm font-medium text-foreground focus:bg-accent focus:text-foreground data-[state=checked]:bg-accent data-[state=checked]:font-bold [&>span:first-child]:hidden"
                  >
                    <span className="flex w-full items-center justify-between gap-3">
                      {opt.label}
                      {opt.value === sortBy && <Check className="h-4 w-4 text-brand-fresh" strokeWidth={3} aria-hidden="true" />}
                    </span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {onViewModeChange && viewMode && (
            <div className="flex items-center gap-0.5 rounded-lg border border-border bg-background p-0.5 sm:p-1">
              <button
                type="button"
                onClick={() => onViewModeChange("list")}
                className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded transition-colors ${
                  viewMode === "list"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="List View"
                aria-label="List View"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
              viewMode === "grid"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Grid View"
            aria-label="Grid View"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      )}
      </div>
    </div>
  </div>
);
}

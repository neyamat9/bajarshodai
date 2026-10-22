"use client";

import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowDownUp, Check, ChevronDown, SlidersHorizontal } from "lucide-react";
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
}: SortBarProps) {
  const t = useTranslations("Product");
  const locale = useLocale() as Locale;
  const SORT_OPTIONS = SORT_VALUES.map((value) => ({ value, label: t(`sort.${value}`) }));
  const current = SORT_OPTIONS.find((o) => o.value === sortBy) ?? SORT_OPTIONS[0];

  return (
    <div
      className="sticky z-20 mb-4 flex flex-wrap items-center justify-between gap-2.5 rounded border border-border bg-card/95 px-3 py-2.5 shadow-sm backdrop-blur-md transition-[top] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] sm:flex-nowrap sm:gap-3 sm:px-4"
      style={{ top: "var(--sticky-top, 8rem)" }}
    >
      <div className="flex min-w-0 items-center gap-3">
        {onOpenFilters && (
          <button
            type="button"
            onClick={onOpenFilters}
            className="flex shrink-0 items-center gap-2 rounded bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90 lg:hidden"
            aria-label={t("filters.open")}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            {t("filters.title")}
            {activeCount > 0 && <span className="rounded bg-brand-fresh px-1.5 py-0.5 text-[10px] leading-none text-on-fresh">{formatNumber(activeCount, locale, 0)}</span>}
          </button>
        )}
        <p className="truncate text-sm font-medium text-muted-foreground">
          {t("listing.found", { count: formatNumber(resultCount, locale, 0) })}
        </p>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5">
        {onInStockChange && (
          <button
            type="button"
            role="switch"
            aria-checked={inStockOnly}
            onClick={() => onInStockChange(!inStockOnly)}
            className={`group flex shrink-0 items-center gap-2 rounded border px-3 py-2 text-xs sm:text-sm font-semibold transition-all ${
              inStockOnly
                ? "border-brand-fresh bg-brand-fresh/10 text-accent-text"
                : "border-border bg-background text-muted-foreground hover:border-brand-fresh/60 hover:text-foreground"
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                inStockOnly ? "bg-brand-fresh shadow-[0_0_8px_rgba(69,162,44,0.6)]" : "bg-muted-foreground/40"
              }`}
              aria-hidden="true"
            />
            <span>{t("filters.inStockOnly")}</span>
          </button>
        )}

        <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={t("sort.aria", { label: current.label })}
            className="group flex shrink-0 items-center gap-2 rounded border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:border-brand-fresh focus-visible:border-brand-fresh focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-fresh/30 data-[state=open]:border-brand-fresh"
          >
            <ArrowDownUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="hidden text-muted-foreground sm:inline">{t("sort.by")}</span>
            <span>{current.label}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" aria-hidden="true" />
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
    </div>
  </div>
);
}

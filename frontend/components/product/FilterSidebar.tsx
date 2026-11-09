"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatMoney, formatNumber } from "@/lib/format";
import type { Locale } from "@/lib/locale";
import { useDebouncedSearch } from "@/lib/hooks/use-debounced-search";
import type { Brand, Category } from "@/lib/types";
import { Check, ChevronDown, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import { flattenSubs } from "@/lib/utils/categories";
import { Fragment, useEffect, useMemo, useState } from "react";

export interface FilterState {
  categories: string[];
  /** sub-category slugs ticked under their categories */
  subCategories: string[];
  brands: string[];
  generics: string[];
  minPrice: number;
  maxPrice: number;
  inStockOnly: boolean;
}

interface FilterSidebarProps {
  categories: Category[];
  brands: Brand[];
  generics?: { name: string; count: number }[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onCategoryClick?: (category: Category) => void;
  excludeMedicine?: boolean;
  /** Absolute price bounds from the product set */
  priceMin?: number;
  priceMax?: number;
  /** How many filters are switched on (shown as a badge) */
  activeCount?: number;
  /** Clears every filter */
  onReset?: () => void;
  /** Mobile: controlled open state */
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const DEFAULT_PRICE_MIN = 0;
const DEFAULT_PRICE_MAX = 500000;

export default function FilterSidebar({
  categories,
  brands,
  generics,
  filters,
  onFiltersChange,
  onCategoryClick,
  excludeMedicine = false,
  priceMin = DEFAULT_PRICE_MIN,
  priceMax = DEFAULT_PRICE_MAX,
  activeCount = 0,
  onReset,
  mobileOpen = false,
  onMobileClose,
}: FilterSidebarProps) {
  const t = useTranslations("Product");
  const locale = useLocale() as Locale;
  const money = (n: number) => formatMoney(n, locale);

  const visibleCategories = useMemo(() => {
    return excludeMedicine ? categories.filter((c) => c.slug !== "medicine") : categories;
  }, [categories, excludeMedicine]);

  // Local price state for the dual-handle slider (avoids re-filtering on every drag)
  const [localMin, setLocalMin] = useState(filters.minPrice ?? priceMin);
  const [localMax, setLocalMax] = useState(filters.maxPrice ?? priceMax);
  const { input: brandInput, setInput: setBrandInput, query: brandQuery } = useDebouncedSearch(250);
  const { input: genericInput, setInput: setGenericInput, query: genericQuery } = useDebouncedSearch(250);

  // Sync local price when external filters reset
  useEffect(() => {
    setLocalMin(filters.minPrice ?? priceMin);
    setLocalMax(filters.maxPrice ?? priceMax);
  }, [filters.minPrice, filters.maxPrice, priceMin, priceMax]);

  function commitPrice(min = localMin, max = localMax) {
    onFiltersChange({ ...filters, minPrice: min, maxPrice: max });
  }

  const toggle = (key: "categories" | "brands", slug: string) =>
    onFiltersChange({ ...filters, [key]: filters[key].includes(slug) ? filters[key].filter((x) => x !== slug) : [...filters[key], slug] });

  // ticking a category reveals its sub-categories; unticking it also drops the sub-categories chosen under it
  function toggleCategory(cat: Category) {
    if (onCategoryClick) {
      onCategoryClick(cat);
      return;
    }
    const on = filters.categories.includes(cat.slug);
    const owned = new Set(flattenSubs(cat.subCategories).map((x) => x.slug));
    onFiltersChange({
      ...filters,
      categories: on ? filters.categories.filter((x) => x !== cat.slug) : [...filters.categories, cat.slug],
      subCategories: on ? filters.subCategories.filter((x) => !owned.has(x)) : filters.subCategories,
    });
  }

  // ticking a sub-category also ticks its parent category
  function toggleSub(cat: Category, subSlug: string) {
    const on = filters.subCategories.includes(subSlug);
    onFiltersChange({
      ...filters,
      categories: filters.categories.includes(cat.slug) ? filters.categories : [...filters.categories, cat.slug],
      subCategories: on ? filters.subCategories.filter((x) => x !== subSlug) : [...filters.subCategories, subSlug],
    });
  }

  const shownBrands = useMemo(() => {
    const q = brandQuery.toLowerCase();
    return q ? brands.filter((b) => b.name.toLowerCase().includes(q)) : brands;
  }, [brands, brandQuery]);

  const shownGenerics = useMemo(() => {
    const q = genericQuery.toLowerCase();
    return q ? (generics || []).filter((g) => g.name.toLowerCase().includes(q)) : (generics || []);
  }, [generics, genericQuery]);

  const content = (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-card px-5 py-4">
        <h2 className="flex items-center gap-2.5 font-outfit text-base font-extrabold text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground">
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          </span>
          {t("filters.title")}
          {activeCount > 0 && (
            <span className="rounded bg-brand-fresh px-1.5 py-0.5 text-[11px] font-bold leading-none text-on-fresh" aria-label={t("filters.activeCount", { count: activeCount })}>
              {formatNumber(activeCount, locale, 0)}
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          {onReset && activeCount > 0 && (
            <button type="button" onClick={onReset} className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-accent-text">
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              {t("filters.reset")}
            </button>
          )}
          {onMobileClose && (
            <button
              type="button"
              onClick={onMobileClose}
              className="flex h-8 w-8 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:text-foreground lg:hidden"
              aria-label={t("filters.close")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>


      {/* Price */}
      <Section title={t("filters.priceRange")}>
        <div className="px-1 pb-1 pt-2">
          <DualRangeSlider
            min={priceMin}
            max={priceMax}
            valueMin={localMin}
            valueMax={localMax}
            onChangeMin={setLocalMin}
            onChangeMax={setLocalMax}
            onCommit={() => commitPrice()}
            minLabel={t("filters.minAria")}
            maxLabel={t("filters.maxAria")}
          />
        </div>
        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="rounded border border-border bg-background px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("filters.min")}</p>
            <p className="font-outfit text-sm font-bold text-foreground">{money(localMin)}</p>
          </div>
          <span className="h-px w-3 bg-border" aria-hidden="true" />
          <div className="rounded border border-border bg-background px-3 py-2 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("filters.max")}</p>
            <p className="font-outfit text-sm font-bold text-foreground">{money(localMax)}</p>
          </div>
        </div>
      </Section>

      {/* Category / Subcategories */}
      {(() => {
        const isSingleLocked = visibleCategories.length === 1 && filters.categories.includes(visibleCategories[0].slug);
        const singleSubs = isSingleLocked ? flattenSubs(visibleCategories[0].subCategories) : [];
        if (isSingleLocked && singleSubs.length === 0) return null;

        if (isSingleLocked) {
          return (
            <Section
              title={locale === "bn" ? "উপ-ক্যাটাগরি" : "Subcategory"}
              count={filters.subCategories.length}
            >
              <ul className="no-scrollbar -mx-1 max-h-80 space-y-0.5 overflow-y-auto px-1" data-lenis-prevent>
                {singleSubs.map((sub) => (
                  <Option
                    key={sub.slug}
                    small
                    id={`sub-${sub.slug}`}
                    label={`${"– ".repeat(sub.depth)}${sub.name}`}
                    checked={filters.subCategories.includes(sub.slug)}
                    onChange={() => toggleSub(visibleCategories[0], sub.slug)}
                  />
                ))}
              </ul>
            </Section>
          );
        }

        if (visibleCategories.length === 0) return null;

        return (
          <Section title={t("filters.category")} count={filters.categories.length + filters.subCategories.length}>
            <ul className="no-scrollbar -mx-1 max-h-80 space-y-0.5 overflow-y-auto px-1" data-lenis-prevent>
              {visibleCategories.map((cat) => {
                const checked = filters.categories.includes(cat.slug);
                const allSubs = flattenSubs(cat.subCategories);
                const picked = allSubs.filter((x) => filters.subCategories.includes(x.slug)).length;
                return (
                  <Fragment key={cat.slug}>
                    <Option id={`cat-${cat.slug}`} label={cat.name} count={cat.productCount} checked={checked} hint={picked > 0 ? t("filters.selected", { count: formatNumber(picked, locale, 0) }) : undefined} onChange={() => toggleCategory(cat)} />
                    {checked && allSubs.length > 0 && (
                      <li>
                        <ul className="ml-[17px] space-y-0.5 border-l border-border pl-2.5" aria-label={t("filters.subCategories", { name: cat.name })}>
                          {allSubs.map((sub) => (
                            <Option key={sub.slug} small id={`sub-${sub.slug}`} label={`${"– ".repeat(sub.depth)}${sub.name}`} checked={filters.subCategories.includes(sub.slug)} onChange={() => toggleSub(cat, sub.slug)} />
                          ))}
                        </ul>
                      </li>
                    )}
                  </Fragment>
                );
              })}
            </ul>
          </Section>
        );
      })()}

      {/* Brand */}
      <Section title={t("filters.brand")} count={filters.brands.length}>
        {brands.length > 6 && (
          <div className="relative mb-2.5">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              value={brandInput}
              onChange={(e) => setBrandInput(e.target.value)}
              type="search"
              placeholder={t("filters.searchBrands")}
              aria-label={t("filters.searchBrands")}
              className="h-9 w-full rounded border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-fresh focus:outline-none focus:ring-2 focus:ring-brand-fresh/20"
            />
          </div>
        )}
        <ul className="no-scrollbar -mx-1 max-h-64 space-y-0.5 overflow-y-auto px-1" data-lenis-prevent>
          {shownBrands.map((b) => (
            <Option key={b.slug} id={`brand-${b.slug}`} label={b.name} logo={b.logoUrl} count={b.productCount} checked={filters.brands.includes(b.slug)} onChange={() => toggle("brands", b.slug)} />
          ))}
          {shownBrands.length === 0 && <li className="px-2 py-3 text-center text-xs text-muted-foreground">{t("filters.noBrands")}</li>}
        </ul>
      </Section>

      {/* ── Generic Name (জেনেরিক নাম) ─────────────── */}
      {generics && generics.length > 0 && (
        <Section
          title={locale === "bn" ? "জেনেরিক নাম" : "Generic Name"}
          count={filters.generics.length}
        >
          {generics.length > 6 && (
            <div className="relative mb-2.5">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                type="search"
                value={genericInput}
                onChange={(e) => setGenericInput(e.target.value)}
                placeholder={locale === "bn" ? "জেনেরিক খুঁজুন..." : "Search generic..."}
                aria-label="Search generic names"
                className="h-9 w-full rounded border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-fresh focus:outline-none focus:ring-2 focus:ring-brand-fresh/20"
              />
            </div>
          )}
          <ul className="no-scrollbar -mx-1 max-h-64 space-y-0.5 overflow-y-auto px-1" data-lenis-prevent>
            {shownGenerics.map((g) => (
              <Option
                key={g.name}
                id={`gen-${g.name}`}
                label={g.name}
                count={g.count}
                checked={filters.generics.includes(g.name)}
                onChange={() => {
                  const on = filters.generics.includes(g.name);
                  onFiltersChange({
                    ...filters,
                    generics: on
                      ? filters.generics.filter((x) => x !== g.name)
                      : [...filters.generics, g.name],
                  });
                }}
              />
            ))}
            {shownGenerics.length === 0 && (
              <li className="px-2 py-3 text-center text-xs text-muted-foreground">
                {locale === "bn" ? "কোনো জেনেরিক মেলেনি" : "No generic found"}
              </li>
            )}
          </ul>
        </Section>
      )}
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────── */}
      <aside
        className="sticky hidden w-72 flex-shrink-0 self-start z-20 transition-[top] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] lg:block"
        style={{
          top: "var(--sticky-top, 8rem)",
          maxHeight: "calc(100vh - var(--sticky-top, 8rem) - 1rem)",
        }}
      >
        <div
          data-lenis-prevent
          style={{ maxHeight: "calc(100vh - var(--sticky-top, 8rem) - 1rem)" }}
          className="no-scrollbar max-h-[calc(100vh-var(--sticky-top,8rem)-1rem)] overflow-y-auto overscroll-contain rounded border border-border bg-card shadow-sm"
        >
          {content}
        </div>
      </aside>

      {/* ── Mobile bottom drawer ─────────────────────── */}
      <div
        className={`fixed inset-0 z-[2100] bg-brand-deep/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0 invisible"}`}
        onClick={onMobileClose}
        aria-hidden="true"
      />
      <div
        className={`fixed inset-x-0 bottom-0 z-[2110] flex max-h-[88dvh] flex-col rounded-t border-t border-border bg-card transition-transform duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden ${
          mobileOpen ? "translate-y-0 pointer-events-auto" : "translate-y-full pointer-events-none invisible hidden"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={t("filters.dialog")}
        aria-hidden={!mobileOpen}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded bg-secondary" />
        <div data-lenis-prevent className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
          {content}
        </div>
        <div className="shrink-0 border-t border-border p-4">
          <button
            type="button"
            onClick={onMobileClose}
            className="w-full rounded bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.99]"
          >
            {t("filters.showResults")}
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Sub-components ──────────────────────────────────── */

function Section({ title, count = 0, children }: { title: string; count?: number; children: React.ReactNode }) {
  const locale = useLocale() as Locale;
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-border last:border-b-0">
      <button type="button" onClick={() => setOpen((v) => !v)} className="group flex w-full items-center justify-between px-5 py-4" aria-expanded={open}>
        <span className="flex items-center gap-2 text-sm font-bold text-foreground">
          {title}
          {count > 0 && <span className="rounded bg-brand-fresh/20 px-1.5 py-0.5 text-[10px] font-bold leading-none text-accent-text">{formatNumber(count, locale, 0)}</span>}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:text-foreground ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="px-5 pb-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Option({ id, label, checked, onChange, count, logo, small, hint }: { id: string; label: string; checked: boolean; onChange: () => void; count?: number; logo?: string; small?: boolean; hint?: string }) {
  const locale = useLocale() as Locale;
  return (
    <li>
      <label
        htmlFor={id}
        className={`group flex cursor-pointer items-center gap-3 rounded px-2 ${small ? "py-1.5" : "py-2"} transition-colors ${checked ? "bg-accent" : "hover:bg-secondary/70"}`}
      >
        <input type="checkbox" id={id} checked={checked} onChange={onChange} className="peer sr-only" />
        <span
          className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-brand-fresh/50 ${
            checked ? "border-brand-fresh bg-brand-fresh text-on-fresh" : "border-input bg-background group-hover:border-brand-fresh"
          }`}
          aria-hidden="true"
        >
          {checked && <Check className="h-3 w-3" strokeWidth={3.5} />}
        </span>
        {logo && (
          <span className="flex h-6 w-9 shrink-0 items-center justify-center rounded bg-white p-0.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt="" className="max-h-full max-w-full object-contain" loading="lazy" draggable={false} />
          </span>
        )}
        <span className={`min-w-0 flex-1 truncate ${small ? "text-[13px]" : "text-sm"} ${checked ? "font-semibold text-foreground" : "font-medium text-muted-foreground group-hover:text-foreground"}`}>{label}</span>
        {hint && <span className="shrink-0 text-[10px] font-semibold text-accent-text">{hint}</span>}
        {count !== undefined && (
          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold ${checked ? "bg-brand-fresh/25 text-accent-text" : "bg-secondary text-muted-foreground"}`}>{formatNumber(count, locale, 0)}</span>
        )}
      </label>
    </li>
  );
}

/**
 * Dual-handle range slider built from two overlapping <input type="range"> elements.
 * The lower handle controls the minimum price; the upper handle controls the maximum.
 */
function DualRangeSlider({
  min,
  max,
  valueMin,
  valueMax,
  onChangeMin,
  onChangeMax,
  onCommit,
  minLabel,
  maxLabel,
}: {
  minLabel: string;
  maxLabel: string;
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChangeMin: (v: number) => void;
  onChangeMax: (v: number) => void;
  onCommit: () => void;
}) {
  const range = max - min || 1;
  const step = range <= 500 ? 1 : range <= 5000 ? 5 : range <= 50000 ? 50 : 1000;
  const leftPct = ((valueMin - min) / range) * 100;
  const rightPct = ((valueMax - min) / range) * 100;

  return (
    <div className="relative flex h-6 items-center">
      <div className="absolute left-0 right-0 h-1.5 rounded bg-secondary" />
      <div className="absolute h-1.5 rounded bg-brand-fresh" style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }} />

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={valueMin}
        onChange={(e) => onChangeMin(Math.min(Number(e.target.value), valueMax - step))}
        onMouseUp={onCommit}
        onTouchEnd={onCommit}
        onKeyUp={onCommit}
        className="range-thumb-fresh pointer-events-none absolute h-1.5 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:pointer-events-auto"
        aria-label={minLabel}
        style={{ zIndex: valueMin > max - step ? 5 : 3 }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={valueMax}
        onChange={(e) => onChangeMax(Math.max(Number(e.target.value), valueMin + step))}
        onMouseUp={onCommit}
        onTouchEnd={onCommit}
        onKeyUp={onCommit}
        className="range-thumb-fresh pointer-events-none absolute h-1.5 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:pointer-events-auto"
        aria-label={maxLabel}
        style={{ zIndex: 4 }}
      />
    </div>
  );
}

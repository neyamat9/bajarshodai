"use client";

import { useLocale } from "next-intl";
import type { Locale } from "@/lib/locale";
import { Search, X, Loader2, Pill, Dna, Sparkles, Building2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatNumber } from "@/lib/format";

interface MedicineSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  loading?: boolean;
  totalResults?: number;
}

const POPULAR_SEARCHES = [
  { label: "Napa", type: "brand", icon: Pill },
  { label: "Paracetamol", type: "generic", icon: Dna },
  { label: "Seclo", type: "brand", icon: Pill },
  { label: "Omeprazole", type: "generic", icon: Dna },
  { label: "Sergel", type: "brand", icon: Pill },
  { label: "Esomeprazole", type: "generic", icon: Dna },
  { label: "Ciprofloxacin", type: "generic", icon: Dna },
  { label: "Azithromycin", type: "generic", icon: Dna },
  { label: "Monas", type: "brand", icon: Pill },
  { label: "Fexo", type: "brand", icon: Pill },
  { label: "Ace", type: "brand", icon: Pill },
  { label: "Square", type: "company", icon: Building2 },
  { label: "Beximco", type: "company", icon: Building2 },
  { label: "Incepta", type: "company", icon: Building2 },
];

export default function MedicineSearchBar({
  value,
  onChange,
  loading = false,
  totalResults,
}: MedicineSearchBarProps) {
  const locale = useLocale() as Locale;
  const isBn = locale === "bn";
  const [localInput, setLocalInput] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal input when parent value is cleared externally (e.g., via filter chips)
  useEffect(() => {
    setLocalInput(value);
  }, [value]);

  // Debounced propagation to parent
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localInput !== value) {
        onChange(localInput);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [localInput, value, onChange]);

  const handleClear = () => {
    setLocalInput("");
    onChange("");
    inputRef.current?.focus();
  };

  const handleQuickTagClick = (tag: string) => {
    if (localInput.toLowerCase() === tag.toLowerCase()) {
      handleClear();
    } else {
      setLocalInput(tag);
      onChange(tag);
    }
  };

  const hasSearch = localInput.trim().length > 0;

  return (
    <div className="mb-4 space-y-2.5">
      {/* ── Main Search Input Bar ──────────────────────────────── */}
      <div className="relative rounded-2xl border border-emerald-500/30 bg-card/95 p-1.5 shadow-sm backdrop-blur-md transition-all focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10">
        <div className="flex items-center gap-2 px-3 py-1">
          {/* Leading Icon */}
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            {loading ? (
              <Loader2 className="size-4.5 animate-spin" />
            ) : (
              <Search className="size-4.5" />
            )}
          </div>

          {/* Search Input */}
          <input
            ref={inputRef}
            type="text"
            value={localInput}
            onChange={(e) => setLocalInput(e.target.value)}
            placeholder={
              isBn
                ? "ওষুধের নাম (যেমন: Napa, Seclo) অথবা জেনেরিক নাম (যেমন: Paracetamol, Omeprazole) দিয়ে খুঁজুন..."
                : "Search by medicine brand name (e.g. Napa, Seclo) or generic (e.g. Paracetamol, Omeprazole)..."
            }
            className="w-full bg-transparent text-sm sm:text-base text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
            aria-label={isBn ? "ওষুধের নাম বা জেনেরিক খুঁজুন" : "Search medicine or generic"}
          />

          {/* Clear Button */}
          {hasSearch && (
            <button
              type="button"
              onClick={handleClear}
              className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title={isBn ? "মুছে ফেলুন" : "Clear search"}
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}

          {/* Fast Submit / Search Indicator */}
          <button
            type="button"
            onClick={() => onChange(localInput)}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold transition-all shadow-sm active:scale-95 shrink-0"
          >
            <span>{isBn ? "খুঁজুন" : "Search"}</span>
          </button>
        </div>
      </div>

      {/* ── Popular Quick Search Pills ─────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="inline-flex items-center gap-1 font-semibold text-muted-foreground shrink-0 text-[11px] pr-1">
          <Sparkles className="size-3 text-amber-500" />
          <span>{isBn ? "দ্রুত খোঁজ:" : "Quick Search:"}</span>
        </span>

        {POPULAR_SEARCHES.map(({ label, icon: Icon, type }) => {
          const isActive = localInput.toLowerCase() === label.toLowerCase();
          return (
            <button
              key={label}
              type="button"
              onClick={() => handleQuickTagClick(label)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                isActive
                  ? "bg-emerald-600 text-white shadow-xs font-bold ring-2 ring-emerald-500/30"
                  : type === "generic"
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/20"
                  : type === "company"
                  ? "bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20 border border-sky-500/20"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-border"
              }`}
            >
              <Icon className="size-3 opacity-70" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Active Search Results Banner ───────────────────────── */}
      {hasSearch && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-100">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold">
              {isBn ? "অনুসন্ধানের ফলাফল:" : "Search results for:"}
            </span>
            <span className="font-bold underline decoration-emerald-500 decoration-2">
              &ldquo;{localInput}&rdquo;
            </span>
            {totalResults !== undefined && (
              <span className="text-emerald-700 dark:text-emerald-300 font-medium ml-1">
                ({formatNumber(totalResults, locale, 0)} {isBn ? "টি ওষুধ পাওয়া গেছে" : "medicines found"})
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline inline-flex items-center gap-1"
          >
            <X className="size-3" />
            <span>{isBn ? "সব ওষুধ দেখুন" : "View all medicines"}</span>
          </button>
        </div>
      )}
    </div>
  );
}

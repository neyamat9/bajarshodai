"use client";

import { useLocale } from "next-intl";
import type { Locale } from "@/lib/locale";
import { Search, X, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatNumber } from "@/lib/format";

interface MedicineSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  loading?: boolean;
  totalResults?: number;
}

export default function MedicineSearchBar({
  value,
  onChange,
  loading = false,
  totalResults,
}: MedicineSearchBarProps) {
  const locale = useLocale() as Locale;
  const isBn = locale === "bn";
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState(value);

  // Sync internal input whenever the parent `value` changes from outside
  useEffect(() => {
    setInput(value);
  }, [value]);

  // Debounced propagate to parent when user types
  useEffect(() => {
    const trimmed = input.trim();
    if (trimmed === value.trim()) return;

    const timer = setTimeout(() => {
      onChange(trimmed);
    }, 300);

    return () => clearTimeout(timer);
  }, [input, value, onChange]);

  const handleClear = () => {
    setInput("");
    onChange("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onChange(input.trim());
    } else if (e.key === "Escape") {
      handleClear();
    }
  };

  const hasSearch = input.trim().length > 0 || value.trim().length > 0;

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
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isBn
                ? "ওষুধ বা জেনেরিক নাম দিয়ে খুঁজুন (যেমন: Napa)..."
                : "Search medicine or generic name (e.g. Napa)..."
            }
            className="w-full min-w-0 bg-transparent text-sm sm:text-base text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
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
            onClick={() => {
              onChange(input.trim());
            }}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold transition-all shadow-sm active:scale-95 shrink-0"
          >
            <span>{isBn ? "খুঁজুন" : "Search"}</span>
          </button>
        </div>
      </div>

      {/* ── Active Search Results Banner ───────────────────────── */}
      {hasSearch && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-100">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold">
              {isBn ? "অনুসন্ধানের ফলাফল:" : "Search results for:"}
            </span>
            <span className="font-bold underline decoration-emerald-500 decoration-2">
              &ldquo;{input.trim() || value.trim()}&rdquo;
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

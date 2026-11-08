"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import type { Locale } from "@/lib/locale";
import type { Product } from "@/lib/types";
import { formatMoney, formatQuantity } from "@/lib/format";
import { playClick } from "@/lib/sound";
import {
  calculateMedicinePrice,
  parseUnitsPerStrip,
  type DiscountEligibility,
  type MedicinePriceBreakdown,
} from "@/lib/services/medicine-pricing";
import {
  Dna,
  Minus,
  Package,
  Pill,
  Plus,
  ShoppingCart,
  Sparkles,
  X,
  Info,
} from "lucide-react";

interface MedicinePurchasePopoverProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (breakdown: MedicinePriceBreakdown) => Promise<void> | void;
  globalDiscountEligibility?: DiscountEligibility;
  defaultDiscountPercent?: number;
}

export default function MedicinePurchasePopover({
  product,
  isOpen,
  onClose,
  onConfirm,
  globalDiscountEligibility = "MIN_STRIP_ONLY",
  defaultDiscountPercent = 0,
}: MedicinePurchasePopoverProps) {
  const locale = useLocale() as Locale;
  const isBn = locale === "bn";
  const formatBDT = (n: number) => formatMoney(n, locale);

  const meta = product.medicineMeta;
  const unitsPerStrip = parseUnitsPerStrip(meta);

  // Default state: 1 strip, 0 loose tabs
  const [strips, setStrips] = useState(1);
  const [looseTabs, setLooseTabs] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset counters whenever the popover opens with a new product
  useEffect(() => {
    if (isOpen) {
      setStrips(1);
      setLooseTabs(0);
      setIsSubmitting(false);
    }
  }, [isOpen, product.id]);

  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Real-time calculation using bulletproof pricing engine
  const breakdown = calculateMedicinePrice({
    product,
    strips,
    looseTabs,
    globalDiscountEligibility,
    defaultDiscountPercent,
  });

  function handleStripMinus() {
    playClick();
    if (strips > 0) {
      // Don't allow 0 strips AND 0 loose tabs
      if (strips === 1 && looseTabs === 0) {
        setLooseTabs(1);
      }
      setStrips((s) => Math.max(0, s - 1));
    }
  }

  function handleStripPlus() {
    playClick();
    setStrips((s) => Math.min(50, s + 1));
  }

  function handleTabMinus() {
    playClick();
    if (looseTabs > 0) {
      setLooseTabs((t) => t - 1);
    } else if (strips > 0) {
      // Rollover downwards: take 1 strip, convert to unitsPerStrip - 1 loose tabs
      setStrips((s) => s - 1);
      setLooseTabs(unitsPerStrip - 1);
    }
  }

  function handleTabPlus() {
    playClick();
    const nextTabs = looseTabs + 1;
    if (nextTabs >= unitsPerStrip) {
      // Auto-rollover into +1 full strip!
      setStrips((s) => s + 1);
      setLooseTabs(0);
    } else {
      setLooseTabs(nextTabs);
    }
  }

  async function handleAddToCart() {
    if (breakdown.totalTabs <= 0 || isSubmitting) return;
    playClick();
    setIsSubmitting(true);
    try {
      await onConfirm(breakdown);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  const genericName = meta?.genericName || "";
  const strength = meta?.strength || "";
  const manufacturer = meta?.manufacturer || product.brandName || "";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="medicine-purchase-title"
      className="fixed inset-0 z-[2300] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-brand-deep/60 backdrop-blur-sm animate-fade-in overscroll-contain"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative flex w-full max-w-full sm:max-w-md flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl border border-border bg-card shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Swipe Handle */}
        <div className="flex sm:hidden justify-center pt-2.5 pb-1">
          <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
        </div>

        {/* ── Modal Header ── */}
        <div className="flex items-start justify-between border-b border-border px-4 py-3 sm:px-5 sm:py-3.5 bg-secondary/30">
          <div className="min-w-0 flex-1 pr-2">
            {/* Molecule & Strength Badge */}
            {genericName && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Dna className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate font-medium text-foreground/80">
                  {genericName} {strength && `· ${strength}`}
                </span>
              </div>
            )}
            <h3
              id="medicine-purchase-title"
              className="font-outfit font-bold text-base sm:text-lg text-foreground truncate"
            >
              {product.name}
            </h3>
            {manufacturer && (
              <p className="text-[11px] text-muted-foreground truncate">
                {manufacturer}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={isBn ? "বন্ধ করুন" : "Close"}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Pack Size Info Badge ── */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-1.5 font-semibold">
            <Package className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>
              {isBn
                ? `১ পাতা = ${formatQuantity(unitsPerStrip, locale)} টি ট্যাবলেট`
                : `1 Strip = ${unitsPerStrip} Tablets`}
            </span>
          </div>
          {breakdown.discountPercent > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-600 text-white">
              <Sparkles className="size-2.5" />
              <span>{breakdown.discountPercent}% {isBn ? "ছাড়" : "OFF"}</span>
            </span>
          )}
        </div>

        {/* ── Modal Body: Dual Steppers ── */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* 1. Full Strip (পাতা) Stepper */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-background/50 hover:border-emerald-500/30 transition-colors">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Package className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-bold text-sm text-foreground">
                  {isBn ? "পূর্ণ পাতা (Strip)" : "Full Strip (Pata)"}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 pl-6">
                <span className="font-outfit font-extrabold text-sm text-foreground">
                  {formatBDT(breakdown.effectiveStripPrice)}
                </span>
                {breakdown.discountApplied && breakdown.stripPrice > breakdown.effectiveStripPrice && (
                  <span className="text-[11px] text-muted-foreground line-through">
                    {formatBDT(breakdown.stripPrice)}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground">
                  / {isBn ? "পাতা" : "strip"}
                </span>
              </div>
            </div>

            {/* Stepper Buttons */}
            <div className="flex items-center rounded-lg border border-border bg-card shadow-sm h-9">
              <button
                type="button"
                onClick={handleStripMinus}
                disabled={strips === 0 && looseTabs > 0}
                aria-label={isBn ? "পাতা কমান" : "Decrease strips"}
                className="flex size-9 items-center justify-center text-foreground hover:bg-secondary disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <Minus className="size-3.5" />
              </button>
              <span className="px-3 text-sm font-extrabold min-w-8 text-center text-foreground font-outfit">
                {strips}
              </span>
              <button
                type="button"
                onClick={handleStripPlus}
                aria-label={isBn ? "পাতা বাড়ান" : "Increase strips"}
                className="flex size-9 items-center justify-center text-foreground hover:bg-secondary transition-colors"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
          </div>

          {/* 2. Loose Tablets (খুচরা ট্যাবলেট) Stepper */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-background/50 hover:border-emerald-500/30 transition-colors">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Pill className="size-4 text-sky-600 dark:text-sky-400" />
                <span className="font-bold text-sm text-foreground">
                  {isBn ? "খুচরা ট্যাবলেট" : "Loose Tablets"}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 pl-6">
                <span className="font-outfit font-extrabold text-sm text-foreground">
                  {formatBDT(breakdown.effectiveTabPrice)}
                </span>
                {breakdown.discountApplied && breakdown.tabPrice > breakdown.effectiveTabPrice && (
                  <span className="text-[11px] text-muted-foreground line-through">
                    {formatBDT(breakdown.tabPrice)}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground">
                  / {isBn ? "ট্যাবলেট" : "tablet"}
                </span>
              </div>
            </div>

            {/* Stepper Buttons */}
            <div className="flex items-center rounded-lg border border-border bg-card shadow-sm h-9">
              <button
                type="button"
                onClick={handleTabMinus}
                disabled={looseTabs === 0 && strips === 0}
                aria-label={isBn ? "ট্যাবলেট কমান" : "Decrease loose tabs"}
                className="flex size-9 items-center justify-center text-foreground hover:bg-secondary disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <Minus className="size-3.5" />
              </button>
              <span className="px-3 text-sm font-extrabold min-w-8 text-center text-foreground font-outfit">
                {looseTabs}
              </span>
              <button
                type="button"
                onClick={handleTabPlus}
                aria-label={isBn ? "ট্যাবলেট বাড়ান" : "Increase loose tabs"}
                className="flex size-9 items-center justify-center text-foreground hover:bg-secondary transition-colors"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Explanatory rollover note */}
          <p className="text-[11px] text-muted-foreground/80 flex items-center gap-1.5 px-1">
            <Info className="size-3 shrink-0 text-muted-foreground" />
            <span>
              {isBn
                ? `${formatQuantity(unitsPerStrip, locale)} টি ট্যাবলেট নিলে স্বয়ংক্রিয়ভাবে ১টি পূর্ণ পাতায় রূপান্তরিত হবে।`
                : `Selecting ${unitsPerStrip} tablets will automatically convert into 1 full strip.`}
            </span>
          </p>

          {/* ── Order Summary Card ── */}
          <div className="p-3.5 rounded-xl bg-secondary/50 border border-border space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{isBn ? "নির্বাচিত পরিমাণ:" : "Selected package:"}</span>
              <span className="font-bold text-foreground">
                {strips > 0 && `${formatQuantity(strips, locale)} ${isBn ? "পাতা" : "strip"}`}
                {strips > 0 && looseTabs > 0 && " + "}
                {looseTabs > 0 && `${formatQuantity(looseTabs, locale)} ${isBn ? "টি ট্যাবলেট" : "tabs"}`}
                {" "}({formatQuantity(breakdown.totalTabs, locale)} {isBn ? "টি মোট" : "total"})
              </span>
            </div>

            {/* Discount Notification Banner */}
            {breakdown.discountApplied ? (
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20">
                <span className="flex items-center gap-1">
                  <Sparkles className="size-3" />
                  <span>
                    {isBn
                      ? `সকল ${formatQuantity(breakdown.totalTabs, locale)}টি ট্যাবলেটে ${breakdown.discountPercent}% ছাড় প্রযোজ্য!`
                      : `${breakdown.discountPercent}% discount unlocked on all ${breakdown.totalTabs} tablets!`}
                  </span>
                </span>
                <span>{isBn ? "সাশ্রয়:" : "Saved:"} {formatBDT(breakdown.totalSavings)}</span>
              </div>
            ) : breakdown.discountPercent > 0 && strips === 0 ? (
              <div className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/20">
                {isBn
                  ? `💡 কমপক্ষে ১ পাতা নিলে পুরো অর্ডারের সকল ট্যাবলেটে ${breakdown.discountPercent}% ছাড় পাবেন!`
                  : `💡 Buy at least 1 full strip to unlock ${breakdown.discountPercent}% discount across all tablets!`}
              </div>
            ) : null}

            {/* Subtotal row */}
            <div className="flex items-baseline justify-between pt-1 border-t border-border/60">
              <span className="text-xs font-medium text-foreground">
                {isBn ? "সর্বমোট মূল্য:" : "Total Price:"}
              </span>
              <div className="flex items-baseline gap-2">
                {breakdown.totalSavings > 0 && (
                  <span className="text-xs text-muted-foreground line-through">
                    {formatBDT(breakdown.originalTotal)}
                  </span>
                )}
                <span className="font-outfit text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatBDT(breakdown.finalTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Modal Footer ── */}
        <div className="p-4 sm:p-5 pt-0">
          <button
            type="button"
            disabled={breakdown.totalTabs <= 0 || isSubmitting}
            onClick={handleAddToCart}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:pointer-events-none transition-all"
          >
            <ShoppingCart className="size-4" />
            <span>
              {isSubmitting
                ? (isBn ? "যোগ করা হচ্ছে..." : "Adding to cart...")
                : (isBn ? `কার্টে যোগ করুন (${formatBDT(breakdown.finalTotal)})` : `Add to Cart (${formatBDT(breakdown.finalTotal)})`)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}


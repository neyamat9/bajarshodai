"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { formatMoney, formatQuantity } from "@/lib/format";
import type { Locale } from "@/lib/locale";
import type { Product } from "@/lib/types";
import { useCart } from "@/lib/hooks/use-cart";
import { useQuickAdd } from "@/lib/hooks/use-quick-add";
import { useWishlist } from "@/lib/hooks/use-wishlist";
import { playClick } from "@/lib/sound";
import { startQty, stepDown, stepUp } from "@/lib/quantity";
import { PLACEHOLDER_IMAGE } from "@/lib/api/client";
import { toast } from "sonner";
import {
  Building2,
  CheckCircle2,
  Dna,
  Droplet,
  FlaskConical,
  Heart,
  Minus,
  Pill,
  Plus,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Syringe,
  X,
} from "lucide-react";

interface MedicineDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onSelectGeneric?: (generic: string) => void;
}

export default function MedicineDetailModal({
  product,
  onClose,
  onSelectGeneric,
}: MedicineDetailModalProps) {
  const t = useTranslations("Product");
  const locale = useLocale() as Locale;
  const formatBDT = (n: number) => formatMoney(n, locale);
  const quickAdd = useQuickAdd();
  const { cart, updateQuantity, removeFromCart } = useCart();
  const { addToVault, removeFromVault, isInVault } = useWishlist();

  // Close on Escape key
  useEffect(() => {
    if (!product) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [product, onClose]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Lock body and Lenis smooth scrolling when open
  useEffect(() => {
    if (!product) return;
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const originalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Pause Lenis smooth scrolling completely while modal is open
    const w = window as unknown as { __lenis?: { stop: () => void; start: () => void; scrollTo: (y: number, opts?: object) => void } };
    w.__lenis?.stop();

    // Prevent mouse wheel from scrolling the background page or chaining
    const handleWheel = (e: WheelEvent) => {
      const scrollable = scrollContainerRef.current;
      const target = e.target as HTMLElement | null;

      // If wheel is outside the scrollable body (e.g. backdrop, padding), stop scroll
      if (!scrollable || !scrollable.contains(target)) {
        e.preventDefault();
        return;
      }

      // If inside scrollable body, prevent chaining at boundary limits
      const { scrollTop, scrollHeight, clientHeight } = scrollable;
      const atTop = scrollTop <= 0 && e.deltaY < 0;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1 && e.deltaY > 0;
      if (atTop || atBottom) {
        e.preventDefault();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      w.__lenis?.start();
      window.removeEventListener("wheel", handleWheel);

      // Restore exact scroll position seamlessly
      if (w.__lenis) {
        w.__lenis.scrollTo(scrollY, { immediate: true, force: true });
      }
      window.scrollTo({ top: scrollY, left: 0, behavior: "instant" });
    };
  }, [product]);

  const [isWishAnimating, setIsWishAnimating] = useState(false);

  if (!product) return null;

  const currentProduct = product;
  const meta = currentProduct.medicineMeta;
  const dosageForm = (meta?.dosageForm || "Tablet").trim();
  const genericName = meta?.genericName || "";
  const manufacturer = meta?.manufacturer || currentProduct.brandName || "";
  const isRx = meta?.type === "PRESCRIPTION";
  const strength = meta?.strength;
  const unit = currentProduct.unit;

  const isUntracked = currentProduct.trackStock === false;
  const outOfStock =
    !isUntracked &&
    (currentProduct.stock <= (unit?.minQty ?? 0) - 1e-9 || currentProduct.stock <= 0);

  const inVault = isInVault(currentProduct.id);

  const hasRealImage =
    currentProduct.images?.[0]?.url &&
    !currentProduct.images[0].url.includes(PLACEHOLDER_IMAGE);

  // Dosage Form Icon & Palette
  const lowerDosage = dosageForm.toLowerCase();
  let FormIcon = Pill;
  let formColor = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";

  if (lowerDosage.includes("syrup") || lowerDosage.includes("suspension") || lowerDosage.includes("liquid")) {
    FormIcon = FlaskConical;
    formColor = "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20";
  } else if (lowerDosage.includes("injection") || lowerDosage.includes("infusion")) {
    FormIcon = Syringe;
    formColor = "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
  } else if (lowerDosage.includes("drop") || lowerDosage.includes("solution")) {
    FormIcon = Droplet;
    formColor = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
  } else if (lowerDosage.includes("cream") || lowerDosage.includes("ointment") || lowerDosage.includes("gel")) {
    FormIcon = Droplet;
    formColor = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
  }

  // Multi-tier prices
  const unitPrice = Number(currentProduct.price);
  const mrpUnit = meta?.mrpUnit ? Number(meta.mrpUnit) : null;
  const mrpStrip = meta?.mrpStrip ? Number(meta.mrpStrip) : null;
  const mrpBox = meta?.mrpBox ? Number(meta.mrpBox) : null;
  const originalPrice = currentProduct.originalPrice ? Number(currentProduct.originalPrice) : null;
  const isDiscounted = !!(originalPrice && originalPrice > unitPrice);
  const discountPercent = currentProduct.discount || (isDiscounted && originalPrice ? Math.round(((originalPrice - unitPrice) / originalPrice) * 100) : 0);

  const line = cart.items.find(
    (i) => i.productId === currentProduct.id && !i.variantId
  );

  function handleAddToCart() {
    if (outOfStock) return;
    playClick();
    const base = {
      id: currentProduct.id,
      slug: currentProduct.slug,
      name: currentProduct.name,
      price: currentProduct.price,
      stock: isUntracked ? 9999 : currentProduct.stock,
      imageUrl: hasRealImage ? currentProduct.images[0].url : "",
      unit,
    };
    void quickAdd(base, startQty(unit));
  }

  async function more() {
    if (outOfStock || !line) return;
    const maxStock = isUntracked ? 9999 : line.stock;
    const next = stepUp(line.quantity, unit, maxStock);
    if (next === null) {
      toast.info(t("card.onlyStock", { count: formatQuantity(maxStock, locale) }), {
        id: `stock-${currentProduct.id}`,
      });
      return;
    }
    playClick();
    const r = await updateQuantity(line.id, next);
    if (!r.ok) toast.error(r.error ?? t("card.couldNotAdd"));
  }

  async function fewer() {
    if (!line) return;
    playClick();
    const next = stepDown(line.quantity, unit);
    const r =
      next === null
        ? await removeFromCart(line.id)
        : await updateQuantity(line.id, next);
    if (!r.ok) toast.error(r.error ?? t("card.couldNotAdd"));
  }

  function handleToggleWishlist() {
    if (inVault) {
      removeFromVault(currentProduct.id);
      toast.info(t("card.removedWish"));
    } else {
      addToVault({
        productId: currentProduct.id,
        slug: currentProduct.slug,
        name: currentProduct.name,
        price: currentProduct.price,
        originalPrice: currentProduct.originalPrice,
        imageUrl: hasRealImage ? currentProduct.images[0].url : "",
        stock: currentProduct.stock,
      });
      setIsWishAnimating(true);
      setTimeout(() => setIsWishAnimating(false), 400);
      toast.success(t("card.addedWish"), { duration: 2000 });
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="medicine-modal-title"
      data-lenis-prevent
      className="fixed inset-0 z-[2200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-opacity overscroll-contain"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={scrollContainerRef}
        data-lenis-prevent
        className="relative w-full sm:max-w-xl max-h-[90vh] overflow-y-auto overscroll-contain rounded-t-2xl sm:rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="size-4" />
        </button>

        {/* ── Header: Avatar & Main Identity ─────────────────────── */}
        <div className="flex items-start gap-4 pr-8">
          <div className="shrink-0">
            {hasRealImage ? (
              <div className="relative size-16 sm:size-20 rounded-xl overflow-hidden border bg-muted">
                <Image
                  src={currentProduct.images[0].url}
                  alt={currentProduct.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div
                className={`flex flex-col items-center justify-center size-16 sm:size-20 rounded-xl border ${formColor}`}
              >
                <FormIcon className="size-7 mb-1" />
                <span className="text-[10px] font-bold tracking-tight uppercase truncate max-w-[64px] text-center">
                  {dosageForm}
                </span>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="medicine-modal-title"
                className="font-outfit font-extrabold text-lg sm:text-xl text-foreground leading-tight"
              >
                {currentProduct.name}
              </h2>
              {strength && (
                <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-muted text-muted-foreground border">
                  {strength}
                </span>
              )}
            </div>

            {currentProduct.shortDescription && (
              <p className="text-sm font-medium text-muted-foreground line-clamp-2">
                {currentProduct.shortDescription}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {isRx ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-extrabold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  <ShieldAlert className="size-3.5" />
                  <span>Rx · প্রেসক্রিপশন আবশ্যক</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="size-3.5" />
                  <span>OTC · ওভার দ্য কাউন্টার</span>
                </span>
              )}

              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-foreground/80">
                {dosageForm}
              </span>
            </div>
          </div>
        </div>

        {/* ── Key Attributes: Generic & Manufacturer ─────────────── */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 rounded-xl border border-border/80 bg-muted/30 text-xs">
          {/* Generic Name */}
          <div className="flex items-start gap-2 min-w-0">
            <Dna className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider">
                {locale === "bn" ? "জেনেরিক নাম" : "Generic Name"}
              </span>
              {onSelectGeneric && genericName ? (
                <button
                  type="button"
                  onClick={() => {
                    onSelectGeneric(genericName);
                    onClose();
                  }}
                  className="font-semibold text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-left underline decoration-dotted underline-offset-2 truncate block max-w-full"
                  title="Filter by this generic"
                >
                  {genericName}
                </button>
              ) : (
                <span className="font-semibold text-foreground truncate block">
                  {genericName || "—"}
                </span>
              )}
            </div>
          </div>

          {/* Manufacturer */}
          <div className="flex items-start gap-2 min-w-0">
            <Building2 className="size-4 shrink-0 text-sky-600 dark:text-sky-400 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider">
                {locale === "bn" ? "উৎপাদক প্রতিষ্ঠান" : "Manufacturer"}
              </span>
              <span className="font-semibold text-foreground truncate block">
                {manufacturer || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Pricing & Pack Breakdown ───────────────────────────── */}
        <div className="mt-4 p-4 rounded-xl border border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-xs font-semibold text-muted-foreground block">
                {locale === "bn" ? "বিক্রয় মূল্য" : "Selling Price"}
              </span>
              {isDiscounted && originalPrice && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-muted-foreground line-through">
                    {formatBDT(originalPrice)}
                  </span>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-600 text-white leading-none">
                    {discountPercent}% {locale === "bn" ? "ছাড়" : "OFF"}
                  </span>
                </div>
              )}
            </div>
            <div className="text-right">
              <span className="font-outfit text-2xl font-black text-emerald-700 dark:text-emerald-400">
                {formatBDT(unitPrice)}
              </span>
              <span className="text-xs text-muted-foreground font-medium ml-1">
                / {unit?.label || (locale === "bn" ? "পাতা" : "unit")}
              </span>
            </div>
          </div>

          {/* Detailed Packaging Breakdown (Piece, Strip, Box) */}
          {(mrpUnit || mrpStrip || mrpBox || meta?.packSizeInfo) && (
            <div className="pt-2 border-t border-emerald-500/15 grid grid-cols-2 gap-2 text-xs">
              {mrpUnit && (
                <div className="rounded-lg bg-background/80 border p-2">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                    {locale === "bn" ? "প্রতি পিস (ট্যাবলেট/ক্যাপসুল)" : "Per Piece (Unit)"}
                  </span>
                  <span className="font-outfit font-bold text-foreground text-sm">
                    {formatBDT(mrpUnit)}
                  </span>
                </div>
              )}
              {mrpStrip && (
                <div className="rounded-lg bg-background/80 border p-2">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                    {locale === "bn" ? "প্রতি পাতা (Strip)" : "Per Strip"}
                  </span>
                  <span className="font-outfit font-bold text-foreground text-sm">
                    {formatBDT(mrpStrip)}
                  </span>
                </div>
              )}
              {mrpBox && (
                <div className="rounded-lg bg-background/80 border p-2">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                    {locale === "bn" ? "প্রতি বক্স (Box)" : "Per Box"}
                  </span>
                  <span className="font-outfit font-bold text-foreground text-sm">
                    {formatBDT(mrpBox)}
                  </span>
                </div>
              )}
              {meta?.packSizeInfo && (
                <div className={`rounded-lg bg-background/80 border p-2 text-muted-foreground text-[11px] ${!mrpBox ? "col-span-2" : ""}`}>
                  <span className="font-bold text-foreground mr-1">
                    {locale === "bn" ? "প্যাক সাইজ:" : "Pack Size:"}
                  </span>
                  {meta.packSizeInfo}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Rx Warning (if Prescription Required) ──────────────── */}
        {isRx && (
          <div className="mt-3.5 flex items-start gap-2.5 p-3 rounded-lg border border-purple-300 dark:border-purple-800 bg-purple-50/70 dark:bg-purple-950/30 text-xs text-purple-900 dark:text-purple-200">
            <ShieldAlert className="size-4 shrink-0 mt-0.5 text-purple-600 dark:text-purple-400" />
            <p className="leading-relaxed">
              {locale === "bn"
                ? "এই ওষুধটি গ্রহণের জন্য রেজিস্টার্ড চিকিৎসকের প্রেসক্রিপশন প্রয়োজন। ডেলিভারির সময় প্রেসক্রিপশন যাচাই করা হতে পারে।"
                : "A valid prescription from a registered doctor is required to order this medicine. You can upload it during checkout."}
            </p>
          </div>
        )}

        {/* ── Action Bar: Quantity & Add to Cart ─────────────────── */}
        <div className="mt-5 flex items-center gap-3 pt-3 border-t">
          {/* Wishlist Button */}
          <button
            type="button"
            onClick={handleToggleWishlist}
            aria-label="Wishlist"
            className={`flex size-11 shrink-0 items-center justify-center rounded-xl border transition-colors ${
              inVault
                ? "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-400"
                : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            <Heart
              className={`size-5 ${
                inVault ? "fill-rose-500 text-rose-500" : ""
              } ${isWishAnimating ? "scale-125 transition-transform" : ""}`}
            />
          </button>

          {/* Stepper or Add Button */}
          {outOfStock ? (
            <div className="flex-1 py-2.5 rounded-xl bg-muted text-center text-xs font-bold text-muted-foreground border">
              {locale === "bn" ? "স্টক শেষ" : "Out of Stock"}
            </div>
          ) : line ? (
            <div className="flex-1 flex items-center justify-between h-11 px-3 rounded-xl border border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/30">
              <button
                type="button"
                onClick={fewer}
                className="size-8 rounded-lg flex items-center justify-center text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/20 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="size-4" />
              </button>
              <div className="flex flex-col items-center leading-tight">
                <span className="font-outfit font-black text-sm text-foreground">
                  {line.quantity}
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                  {formatBDT(unitPrice * line.quantity)}
                </span>
              </div>
              <button
                type="button"
                onClick={more}
                className="size-8 rounded-lg flex items-center justify-center text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/20 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex-1 flex items-center justify-center gap-2 h-11 px-4 rounded-xl font-outfit font-bold text-sm bg-brand-fresh text-on-fresh hover:bg-brand-fresh/90 transition-all shadow-sm active:scale-[0.99]"
            >
              <ShoppingCart className="size-4" />
              <span>{locale === "bn" ? "ব্যাগে যোগ করুন" : "Add to Bag"}</span>
            </button>
          )}
        </div>

        {/* ── Verified Guarantee ─────────────────────────────────── */}
        <div className="mt-3.5 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>
            {locale === "bn"
              ? "ডিজিডিএ অনুমোদিত ১০০% আসল ওষুধ · কোল্ড-চেইন সংরক্ষিত"
              : "100% Genuine DGDA Approved · Cold-chain maintained"}
          </span>
        </div>
      </div>
    </div>
  );
}

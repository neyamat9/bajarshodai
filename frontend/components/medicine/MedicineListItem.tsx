"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { useCart, useCartActions } from "@/lib/hooks/use-cart";
import { useQuickAdd } from "@/lib/hooks/use-quick-add";
import { playClick } from "@/lib/sound";
import { useWishlist } from "@/lib/hooks/use-wishlist";
import type { Product } from "@/lib/types";
import { formatMoney, formatQuantity } from "@/lib/format";
import type { Locale } from "@/lib/locale";
import { startQty, stepDown, stepUp } from "@/lib/quantity";
import { useLocale, useTranslations } from "next-intl";
import {
  Heart,
  Minus,
  Pill,
  Plus,
  ShoppingCart,
  Building2,
  Dna,
  ShieldAlert,
  ShieldCheck,
  Package,
  Droplet,
  Syringe,
  FlaskConical,
} from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { PLACEHOLDER_IMAGE } from "@/lib/api/client";
import MedicinePurchasePopover from "@/components/medicine/MedicinePurchasePopover";
import {
  isOralSolidMedicine,
  type MedicinePriceBreakdown,
} from "@/lib/services/medicine-pricing";

interface MedicineListItemProps {
  product: Product;
  onOpenDetail?: (product: Product) => void;
}

export default function MedicineListItem({ product, onOpenDetail }: MedicineListItemProps) {
  const t = useTranslations("Product");
  const locale = useLocale() as Locale;
  const formatBDT = (n: number) => formatMoney(n, locale);
  const quickAdd = useQuickAdd();
  const { addToCart } = useCartActions();
  const { cart, updateQuantity, removeFromCart } = useCart();
  const { addToVault, removeFromVault, isInVault } = useWishlist();
  const router = useRouter();
  const prefetched = useRef(false);

  function warm() {
    if (onOpenDetail || prefetched.current) return;
    prefetched.current = true;
    router.prefetch(`/products/${product.slug}`);
  }

  const [isWishAnimating, setIsWishAnimating] = useState(false);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);

  const inVault = isInVault(product.id);
  const unit = product.unit;
  const isUntracked = product.trackStock === false;
  const outOfStock =
    !isUntracked &&
    (product.stock <= (unit?.minQty ?? 0) - 1e-9 || product.stock <= 0);

  const line = cart.items.find(
    (i) => i.productId === product.id && !i.variantId
  );

  const meta = product.medicineMeta;
  const dosageForm = (meta?.dosageForm || "Tablet").trim();
  const genericName = meta?.genericName || "";
  const manufacturer = meta?.manufacturer || product.brandName || "";
  const isRx = meta?.type === "PRESCRIPTION";

  const hasRealImage =
    product.images?.[0]?.url &&
    !product.images[0].url.includes(PLACEHOLDER_IMAGE);

  // Icon and theme by dosage form
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

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    playClick();

    // Oral solid forms (Tablet / Capsule) open the custom Pata & Loose Tablet popover
    if (isOralSolidMedicine(product)) {
      setIsPurchaseOpen(true);
      return;
    }

    // Liquids, syrups, ointments add directly to cart
    const base = {
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      stock: isUntracked ? 9999 : product.stock,
      imageUrl: hasRealImage ? product.images[0].url : "",
      unit,
    };

    void quickAdd(base, startQty(unit));
  }

  async function handlePopoverConfirm(breakdown: MedicinePriceBreakdown) {
    const isBn = locale === "bn";

    // Scenario 1: Only full strips
    if (breakdown.totalStrips > 0 && breakdown.looseTabs === 0) {
      await addToCart({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: breakdown.effectiveStripPrice,
        quantity: breakdown.totalStrips,
        imageUrl: hasRealImage ? product.images[0].url : "",
        stock: isUntracked ? 9999 : product.stock,
        unit,
      });
      toast.success(
        isBn
          ? `${product.name} (${formatQuantity(breakdown.totalStrips, locale)} পাতা) কার্টে যোগ করা হয়েছে`
          : `Added ${product.name} (${breakdown.totalStrips} strips) to cart`
      );
      return;
    }

    // Scenario 2: Only loose tablets
    if (breakdown.totalStrips === 0 && breakdown.looseTabs > 0) {
      await addToCart({
        productId: product.id,
        slug: product.slug,
        name: `${product.name} (${formatQuantity(breakdown.looseTabs, locale)} ${isBn ? "টি ট্যাবলেট" : "tabs"})`,
        price: breakdown.effectiveTabPrice,
        quantity: breakdown.looseTabs,
        imageUrl: hasRealImage ? product.images[0].url : "",
        stock: isUntracked ? 9999 : product.stock,
        unit: {
          code: "piece",
          label: isBn ? "ট্যাবলেট" : "tab",
          allowDecimal: false,
          step: 1,
          minQty: 1,
        },
      });
      toast.success(
        isBn
          ? `${product.name} (${formatQuantity(breakdown.looseTabs, locale)}টি ট্যাবলেট) কার্টে যোগ করা হয়েছে`
          : `Added ${product.name} (${breakdown.looseTabs} tabs) to cart`
      );
      return;
    }

    // Scenario 3: Combination (e.g. 1 Strip + 3 Loose Tablets = 13 tabs total)
    // Add strips line
    await addToCart({
      productId: product.id,
      slug: product.slug,
      name: `${product.name} (${formatQuantity(breakdown.totalStrips, locale)} ${isBn ? "পাতা" : "strip"})`,
      price: breakdown.effectiveStripPrice,
      quantity: breakdown.totalStrips,
      imageUrl: hasRealImage ? product.images[0].url : "",
      stock: isUntracked ? 9999 : product.stock,
      unit,
    });
    // Add loose tabs line
    await addToCart({
      productId: product.id,
      slug: product.slug,
      name: `${product.name} (${formatQuantity(breakdown.looseTabs, locale)} ${isBn ? "টি ট্যাবলেট" : "tabs"})`,
      price: breakdown.effectiveTabPrice,
      quantity: breakdown.looseTabs,
      imageUrl: hasRealImage ? product.images[0].url : "",
      stock: isUntracked ? 9999 : product.stock,
      unit: {
        code: "piece",
        label: isBn ? "ট্যাবলেট" : "tab",
        allowDecimal: false,
        step: 1,
        minQty: 1,
      },
    });
    toast.success(
      isBn
        ? `${product.name} (${formatQuantity(breakdown.totalStrips, locale)} পাতা + ${formatQuantity(breakdown.looseTabs, locale)}টি ট্যাবলেট) কার্টে যোগ করা হয়েছে`
        : `Added ${product.name} (${breakdown.totalStrips} strips + ${breakdown.looseTabs} tabs) to cart`
    );
  }

  async function more(e: React.MouseEvent) {
    e.preventDefault();
    if (!line) return;
    const maxStock = isUntracked ? 9999 : line.stock;
    const next = stepUp(line.quantity, unit, maxStock);
    if (next === null) {
      toast.info(t("card.onlyStock", { count: formatQuantity(maxStock, locale) }), {
        id: `stock-${product.id}`,
      });
      return;
    }
    playClick();
    const r = await updateQuantity(line.id, next);
    if (!r.ok) toast.error(r.error ?? t("card.couldNotAdd"));
  }

  async function fewer(e: React.MouseEvent) {
    e.preventDefault();
    if (!line) return;
    playClick();
    const next = stepDown(line.quantity, unit);
    const r = next === null ? await removeFromCart(line.id) : await updateQuantity(line.id, next);
    if (!r.ok) toast.error(r.error ?? t("card.couldNotAdd"));
  }

  function handleToggleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    if (inVault) {
      removeFromVault(product.id);
      toast.info(t("card.removedWish"));
    } else {
      addToVault({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        imageUrl: hasRealImage ? product.images[0].url : "",
        stock: product.stock,
      });
      setIsWishAnimating(true);
      setTimeout(() => setIsWishAnimating(false), 400);
      toast.success(t("card.addedWish"), { duration: 2000 });
    }
  }

  const packText =
    meta?.packSizeInfo || product.packSize || (unit ? `${unit.label}` : "");

  return (
    <article
      onPointerEnter={warm}
      onTouchStart={warm}
      onFocus={warm}
      className="group relative flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-3.5 sm:p-4 rounded-xl border border-border bg-card hover:border-emerald-500/40 hover:shadow-[0_8px_20px_-8px_rgba(16,185,129,0.18)] transition-all duration-200 w-full min-w-0"
    >
      {/* ── Left Side: Dosage Form Avatar & Medicine Info ────────── */}
      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
        {/* Medical Dosage Badge / Avatar */}
        <div
          className={`shrink-0 ${onOpenDetail ? "cursor-pointer" : ""}`}
          onClick={onOpenDetail ? () => onOpenDetail(product) : undefined}
        >
          {hasRealImage ? (
            <div className="relative size-14 sm:size-16 rounded-lg overflow-hidden border bg-muted">
              <Image
                src={product.images[0].url}
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div
              className={`flex flex-col items-center justify-center size-14 sm:size-16 rounded-xl border ${formColor} transition-transform group-hover:scale-105`}
            >
              <FormIcon className="size-6 mb-0.5" />
              <span className="text-[10px] font-bold tracking-tight uppercase truncate max-w-[56px] text-center">
                {dosageForm}
              </span>
            </div>
          )}
        </div>

        {/* Medicine Main Specifications */}
        <div className="min-w-0 flex-1 space-y-1">
          {/* Brand Name & Rx Tag */}
          <div className="flex flex-wrap items-center gap-2">
            {onOpenDetail ? (
              <button
                type="button"
                onClick={() => onOpenDetail(product)}
                className="font-outfit font-bold text-base sm:text-lg text-foreground text-left group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1"
              >
                {product.name}
              </button>
            ) : (
              <Link
                href={`/products/${product.slug}`}
                className="font-outfit font-bold text-base sm:text-lg text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1"
              >
                {product.name}
              </Link>
            )}

            {/* OTC vs Rx Status */}
            {isRx ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                <ShieldAlert className="size-3" />
                <span>Rx · প্রেসক্রিপশন</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="size-3" />
                <span>OTC · অনুমোদিত</span>
              </span>
            )}
          </div>

          {/* Molecule (Generic) & Manufacturer */}
          <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 text-xs text-muted-foreground min-w-0">
            {genericName && (
              <div className="flex items-center gap-1 text-foreground/90 font-medium min-w-0">
                <Dna className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate max-w-[140px] xs:max-w-[200px] sm:max-w-[260px] md:max-w-none">{genericName}</span>
              </div>
            )}

            {manufacturer && (
              <div className="flex items-center gap-1 text-muted-foreground min-w-0">
                <Building2 className="size-3.5 text-muted-foreground/70 shrink-0" />
                <span className="truncate max-w-[120px] xs:max-w-[160px] sm:max-w-[200px] md:max-w-none">{manufacturer}</span>
              </div>
            )}
          </div>

          {/* Pack size info */}
          {packText && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground/80 min-w-0">
              <Package className="size-3 shrink-0" />
              <span className="truncate">{packText}</span>
              {meta?.mrpUnit && (
                <span className="text-muted-foreground/60 ml-1 shrink-0">
                  ({locale === "bn" ? "প্রতি পিস" : "per piece"} {formatBDT(Number(meta.mrpUnit))})
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Right Side: Price & Cart Action ────────────────────────── */}
      <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/60 w-full md:w-auto min-w-0">
        {/* Pricing */}
        <div className="text-left md:text-right">
          <div className="flex items-baseline gap-1.5 md:justify-end">
            <span className="font-outfit text-lg sm:text-xl font-extrabold text-foreground">
              {formatBDT(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <>
                <span className="text-xs text-muted-foreground line-through">
                  {formatBDT(product.originalPrice)}
                </span>
                {product.discount ? (
                  <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20 leading-none">
                    {product.discount}% {locale === "bn" ? "ছাড়" : "OFF"}
                  </span>
                ) : null}
              </>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {outOfStock ? (
              <span className="text-destructive font-bold">{t("card.stockOut")}</span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                স্টকে আছে (In Stock)
              </span>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Wishlist Button */}
          <button
            type="button"
            onClick={handleToggleWishlist}
            aria-label="Wishlist"
            className={`flex size-9 items-center justify-center rounded-lg border border-border bg-background transition-colors hover:text-destructive hover:border-destructive/30 ${
              inVault ? "text-destructive border-destructive/30" : "text-muted-foreground"
            }`}
          >
            <Heart
              className={`size-4 ${isWishAnimating ? "animate-heartbeat" : ""}`}
              fill={inVault ? "currentColor" : "none"}
            />
          </button>

          {/* Cart Button or Stepper */}
          {line ? (
            <div className="flex items-center rounded-lg border border-primary bg-primary text-primary-foreground shadow-sm h-9">
              <button
                type="button"
                onClick={fewer}
                className="flex size-9 items-center justify-center hover:bg-black/10 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="size-3.5" />
              </button>
              <span className="px-2 text-xs font-bold min-w-7 text-center">
                {line.quantity}
              </span>
              <button
                type="button"
                onClick={more}
                className="flex size-9 items-center justify-center hover:bg-black/10 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={outOfStock}
              onClick={handleAddToCart}
              aria-label={locale === "bn" ? "কার্টে যোগ করুন" : "Add to Cart"}
              title={locale === "bn" ? "কার্টে যোগ করুন" : "Add to Cart"}
              className="flex size-9 sm:w-auto sm:px-3.5 items-center justify-center sm:gap-2 rounded-lg font-medium text-xs bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-sm disabled:opacity-50 disabled:pointer-events-none transition-all"
            >
              <Plus className="size-4 sm:hidden" />
              <ShoppingCart className="hidden sm:inline size-3.5" />
              <span className="hidden sm:inline">
                {locale === "bn" ? "কার্টে যোগ করুন" : "Add to Cart"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Oral Solid Pata & Loose Tablet Purchase Popover */}
      {isOralSolidMedicine(product) && (
        <MedicinePurchasePopover
          product={product}
          isOpen={isPurchaseOpen}
          onClose={() => setIsPurchaseOpen(false)}
          onConfirm={handlePopoverConfirm}
        />
      )}
    </article>
  );
}

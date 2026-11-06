"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/lib/locale";
import type { Product, ProductVariant } from "@/lib/types";
import { formatMoney, formatNumber, formatQuantity } from "@/lib/format";
import { startQty, stepDown, stepUp } from "@/lib/quantity";
import { useCartActions } from "@/lib/hooks/use-cart";
import { useWishlist } from "@/lib/hooks/use-wishlist";
import { playClick } from "@/lib/sound";
import { toast } from "sonner";
import {
  ArrowRight,
  ChevronRight,
  Heart,
  Minus,
  Pill,
  Plus,
  ShieldCheck,
  ShoppingCart,
  X,
} from "lucide-react";

interface ProductQuickViewContextType {
  openQuickView: (product: Product) => void;
  closeQuickView: () => void;
  quickViewProduct: Product | null;
}

const ProductQuickViewContext = createContext<ProductQuickViewContextType | null>(
  null
);

export function useProductQuickView(): ProductQuickViewContextType {
  const ctx = useContext(ProductQuickViewContext);
  if (!ctx) {
    throw new Error(
      "useProductQuickView must be used within a ProductQuickViewProvider"
    );
  }
  return ctx;
}

export function ProductQuickViewProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);

  const openQuickView = useCallback((prod: Product) => {
    setProduct(prod);

    // Sync with browser history so native Back button closes the modal first!
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("preview", prod.slug);
      window.history.pushState({ preview: prod.slug }, "", url.toString());
    }
  }, []);

  const closeQuickView = useCallback(() => {
    setProduct(null);

    // If "preview" query exists in current URL, step back in history to clean it up
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.has("preview")) {
        window.history.back();
      }
    }
  }, []);

  const navigateToProduct = useCallback(
    (slug: string) => {
      setProduct(null);
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        if (url.searchParams.has("preview")) {
          url.searchParams.delete("preview");
          window.history.replaceState({}, "", url.toString());
        }
      }
      router.push(`/products/${slug}`);
    },
    [router]
  );

  // Listen for browser popstate (phone back button or browser back arrow)
  useEffect(() => {
    const handlePopState = () => {
      // When back button is pressed, dismiss the modal without page reload
      setProduct(null);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <ProductQuickViewContext.Provider
      value={{ openQuickView, closeQuickView, quickViewProduct: product }}
    >
      {children}
      {product && (
        <QuickViewModalContent
          product={product}
          onClose={closeQuickView}
          onNavigate={navigateToProduct}
        />
      )}
    </ProductQuickViewContext.Provider>
  );
}

function QuickViewModalContent({
  product,
  onClose,
  onNavigate,
}: {
  product: Product;
  onClose: () => void;
  onNavigate?: (slug: string) => void;
}) {
  const router = useRouter();
  const t = useTranslations("Product");
  const locale = useLocale() as Locale;
  const formatBDT = (n: number) => formatMoney(n, locale);
  const { addToCart } = useCartActions();
  const { addToVault, removeFromVault, isInVault } = useWishlist();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants[0] ?? null
  );
  const [isWishAnimating, setIsWishAnimating] = useState(false);
  const [busy, setBusy] = useState(false);

  const unit = product.unit;
  const isUntracked = product.trackStock === false;
  const rawStock = selectedVariant?.stock ?? product.stock;
  const stock = isUntracked ? 9999 : rawStock;
  const outOfStock = !isUntracked && (stock <= 0 || stock <= (unit?.minQty ?? 0) - 1e-9);

  const [quantity, setQuantity] = useState(startQty(unit));
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Lock body, html, and Lenis smooth scrolling while modal is visible
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyPaddingRight = document.body.style.paddingRight;

    // Compensate for scrollbar disappearance so background layout doesn't shift
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    // Pause Lenis smooth scrolling completely while modal is open
    const w = window as unknown as { __lenis?: { stop: () => void; start: () => void } };
    w.__lenis?.stop();

    // Prevent wheel scrolling on background or chaining at boundaries
    const handleWheel = (e: WheelEvent) => {
      const scrollable = scrollContainerRef.current;
      const target = e.target as HTMLElement | null;

      // If wheel is outside the scrollable body (e.g. backdrop, header, borders), stop scroll
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
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.paddingRight = originalBodyPaddingRight;
      w.__lenis?.start();
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Pricing calculations
  const price = selectedVariant?.price ?? product.price;
  const originalPrice = selectedVariant?.originalPrice ?? product.originalPrice;
  const hasDiscount = !!originalPrice && originalPrice > price;
  const saveAmount = hasDiscount ? originalPrice - price : 0;

  const images = product.images.length > 0 ? product.images : [
    { id: "def", url: "/placeholder.svg", alt: product.name, isPrimary: true }
  ];
  const activeImage = images[activeImageIndex] ?? images[0];

  const inVault = isInVault(product.id);

  // Stepper handlers
  function handleQuantityMinus() {
    playClick();
    const next = stepDown(quantity, unit);
    if (next !== null) setQuantity(next);
  }

  function handleQuantityPlus() {
    playClick();
    const maxStock = isUntracked ? 9999 : stock;
    const next = stepUp(quantity, unit, maxStock);
    if (next !== null) {
      setQuantity(next);
    } else {
      toast.info(t("card.onlyStock", { count: formatQuantity(maxStock, locale) }));
    }
  }

  async function handleAddToCart() {
    if (outOfStock) return;
    playClick();
    setBusy(true);

    const res = await addToCart({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price,
      variantId: selectedVariant?.id,
      variantLabel: selectedVariant?.label,
      quantity,
      imageUrl: activeImage.url,
      stock,
      unit,
    });

    setBusy(false);
    if (res.ok) {
      toast.success(t("card.added", { name: product.name }), {
        description: `${formatQuantity(quantity, locale)}${unit ? ` ${unit.label}` : ""} · ${formatBDT(price * quantity)}`,
        duration: 2500,
      });
    } else {
      toast.error(res.error ?? t("card.couldNotAdd"));
    }
  }

  function handleToggleWishlist() {
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
        imageUrl: activeImage.url,
        stock: isUntracked ? 9999 : product.stock,
      });
      setIsWishAnimating(true);
      setTimeout(() => setIsWishAnimating(false), 400);
      toast.success(t("card.addedWish"), { duration: 2000 });
    }
  }

  // Navigate to full details page
  function handleGoToFullDetails() {
    if (onNavigate) {
      onNavigate(product.slug);
    } else {
      onClose();
      router.push(`/products/${product.slug}`);
    }
  }

  // Pack / Size text
  const sizeText = product.packSize || (unit ? `${formatQuantity(1, locale)} ${unit.label}` : "");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-view-title"
      data-lenis-prevent
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-brand-deep/60 backdrop-blur-sm animate-fade-in overscroll-contain"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        data-lenis-prevent
        className="relative flex w-full max-w-full sm:max-w-3xl md:max-w-4xl max-h-[92vh] sm:max-h-[88vh] flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl border border-border bg-card shadow-2xl transition-all overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Swipe / Drag Handle Indicator */}
        <div className="flex sm:hidden justify-center pt-2.5 pb-1">
          <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5 sm:px-6 sm:py-3.5 bg-secondary/30">
          <div className="flex items-center gap-2 overflow-hidden text-xs text-muted-foreground">
            <span className="font-medium truncate">
              {product.categoryName || t("quickView.title")}
            </span>
            {product.brandName && (
              <>
                <span>•</span>
                <span className="font-semibold text-foreground/80 truncate">
                  {product.brandName}
                </span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t("quickView.close")}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div
          ref={scrollContainerRef}
          data-lenis-prevent
          className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 no-scrollbar"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 items-start">
            {/* ── Left Column: Product Gallery ── */}
            <div className="flex flex-col gap-3">
              <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-secondary/40 shadow-inner">
                {/* Badges */}
                <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5 items-start">
                  {hasDiscount && (
                    <span className="rounded bg-destructive px-2 py-0.5 text-xs font-extrabold text-white shadow-sm">
                      -{formatNumber(product.discount ?? Math.round((saveAmount / originalPrice!) * 100), locale, 0)}%
                    </span>
                  )}
                </div>

                {/* Stock Out Overlay */}
                {outOfStock && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-brand-deep/40 backdrop-blur-[2px]">
                    <span className="rounded bg-destructive px-4 py-1.5 text-sm font-extrabold text-white shadow-md">
                      {t("quickView.stockOut")}
                    </span>
                  </div>
                )}

                {/* Main Product Image */}
                <Image
                  src={activeImage.url}
                  alt={activeImage.alt || product.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 420px"
                  className={`object-contain p-4 transition-transform duration-300 ${
                    outOfStock ? "opacity-60 grayscale" : ""
                  }`}
                  priority
                />
              </div>

              {/* Thumbnails (if multiple images) */}
              {images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
                  {images.map((img, idx) => (
                    <button
                      key={img.id || idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                        activeImageIndex === idx
                          ? "border-primary shadow-sm"
                          : "border-border/60 hover:border-border opacity-70 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={img.url}
                        alt={img.alt || `${product.name} ${idx + 1}`}
                        fill
                        sizes="64px"
                        className="object-contain p-1"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Right Column: Product Overview & Actions ── */}
            <div className="flex flex-col gap-4">
              {/* Medicine Form Info (if applicable) */}
              {product.medicineMeta && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    <Pill className="h-3.5 w-3.5" />
                    {product.medicineMeta.dosageForm} {product.medicineMeta.strength ? `· ${product.medicineMeta.strength}` : ""}
                  </span>
                  {product.medicineMeta.type === "PRESCRIPTION" && (
                    <span className="rounded bg-indigo-500/10 px-1.5 py-1 text-[10px] font-bold text-indigo-700 dark:text-indigo-400">
                      Rx Only
                    </span>
                  )}
                  {product.medicineMeta.genericName && (
                    <span className="text-xs italic text-muted-foreground truncate">
                      {product.medicineMeta.genericName}
                    </span>
                  )}
                </div>
              )}

              {/* Product Title */}
              <div>
                <h2
                  id="quick-view-title"
                  className="font-outfit text-xl sm:text-2xl font-bold leading-snug text-foreground"
                >
                  {product.name}
                </h2>
                {sizeText && (
                  <p className="mt-1 text-xs sm:text-sm font-medium text-muted-foreground">
                    {sizeText}
                  </p>
                )}
              </div>

              {/* Pricing & Stock Status */}
              <div className="flex flex-wrap items-baseline gap-3 rounded-xl border border-border/80 bg-secondary/30 p-3">
                <div className="flex items-baseline gap-2">
                  <span className="font-outfit text-2xl sm:text-3xl font-extrabold text-primary dark:text-accent-text">
                    {formatBDT(price)}
                  </span>
                  {hasDiscount && (
                    <span className="text-sm sm:text-base text-muted-foreground line-through">
                      {formatBDT(originalPrice!)}
                    </span>
                  )}
                </div>

                {hasDiscount && saveAmount > 0 && (
                  <span className="rounded-full bg-emerald-600/15 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    {t("quickView.save")} {formatBDT(saveAmount)}
                  </span>
                )}

                <div className="ml-auto">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold ${
                      outOfStock
                        ? "text-destructive"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        outOfStock ? "bg-destructive" : "bg-emerald-500 animate-pulse"
                      }`}
                    />
                    {isUntracked
                      ? t("quickView.dailyFresh")
                      : outOfStock
                      ? t("quickView.stockOut")
                      : t("quickView.inStock")}
                  </span>
                </div>
              </div>

              {/* Short Description */}
              {product.shortDescription && (
                <div className="text-xs sm:text-sm text-foreground/85 leading-relaxed bg-card rounded-lg border border-border/50 p-3 shadow-xs">
                  <p className="line-clamp-3 sm:line-clamp-4">
                    {product.shortDescription}
                  </p>
                </div>
              )}

              {/* Weighed Item Notice */}
              {product.isWeighed && (
                <p className="text-[11px] text-muted-foreground italic flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-brand-fresh shrink-0" />
                  {t("summary.weighedNotice")}
                </p>
              )}

              {/* Variant Picker (if multiple variants) */}
              {product.variants.length > 1 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-foreground">
                    {t("card.chooseOption")}:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                          selectedVariant?.id === v.id
                            ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                            : "border-border text-foreground hover:border-foreground/40 bg-card"
                        }`}
                      >
                        {v.label} · {formatBDT(v.price)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Stepper & Add to Bag Row */}
              <div className="mt-2 flex items-center gap-3">
                {/* Stepper */}
                <div className="flex items-center rounded-xl border border-border bg-secondary/40 shadow-xs">
                  <button
                    type="button"
                    onClick={handleQuantityMinus}
                    disabled={outOfStock}
                    aria-label={t("card.decrease")}
                    className="flex h-11 w-10 items-center justify-center text-foreground transition-colors hover:bg-secondary active:scale-95 disabled:opacity-40"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-[2.8rem] px-2 text-center font-outfit text-sm font-bold tabular-nums">
                    {formatQuantity(quantity, locale)}
                    {unit && !unit.allowDecimal && ""}
                  </span>
                  <button
                    type="button"
                    onClick={handleQuantityPlus}
                    disabled={outOfStock}
                    aria-label={t("card.increase")}
                    className="flex h-11 w-10 items-center justify-center text-foreground transition-colors hover:bg-secondary active:scale-95 disabled:opacity-40"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Main Add to Cart Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={outOfStock || busy}
                  className="flex flex-1 h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 font-outfit text-sm font-bold text-primary-foreground shadow-md transition-all hover:bg-brand-fresh hover:text-on-fresh active:scale-98 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>
                    {outOfStock ? t("quickView.stockOut") : t("summary.addToCart")}
                  </span>
                </button>

                {/* Wishlist Button */}
                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  aria-label={t("summary.wishlist")}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card shadow-xs transition-colors hover:text-destructive ${
                    inVault ? "text-destructive" : "text-muted-foreground"
                  } ${isWishAnimating ? "scale-125" : ""}`}
                >
                  <Heart
                    className={`h-5 w-5 transition-transform duration-200 ${
                      inVault ? "fill-current" : ""
                    }`}
                  />
                </button>
              </div>

              {/* ── Prominent "Full Details" Action Button (Click 2) ── */}
              <div className="mt-2 pt-3 border-t border-border/80">
                <button
                  type="button"
                  onClick={handleGoToFullDetails}
                  className="group flex w-full items-center justify-between rounded-xl border border-brand-fresh/40 bg-brand-fresh/5 px-4 py-3 text-left transition-all hover:bg-brand-fresh/15 hover:border-brand-fresh active:scale-[0.99]"
                >
                  <div className="flex flex-col">
                    <span className="font-outfit text-sm font-bold text-brand-deep dark:text-emerald-300 group-hover:text-primary transition-colors flex items-center gap-1.5">
                      {t("quickView.viewFullDetails")}
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {t("quickView.viewFullDetailsSubtitle")}
                    </span>
                  </div>

                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-card border border-border/80 text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-xs">
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


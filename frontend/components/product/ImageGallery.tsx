"use client";

import type { Product, ProductImage } from "@/lib/types";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

interface ImageGalleryProps {
  product: Product;
  saveBadge?: string | null;
}

export default function ImageGallery({ product, saveBadge }: ImageGalleryProps) {
  const t = useTranslations("Product");
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  const images: ProductImage[] =
    product.images.length > 0
      ? product.images
      : [
          {
            id: "fallback",
            url: "/placeholder.svg",
            alt: product.name,
            isPrimary: true,
          },
        ];

  const primaryImage = images[activeIndex];

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft")
        setLightboxIndex((i) => (i - 1 + images.length) % images.length);
      if (e.key === "ArrowRight")
        setLightboxIndex((i) => (i + 1) % images.length);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxOpen, images.length]);

  function handleThumbnailClick(idx: number) {
    if (idx === activeIndex) return;
    setActiveIndex(idx);
  }

  function handleOpenLightbox() {
    setLightboxIndex(activeIndex);
    setLightboxOpen(true);
  }

  // Filter out "NEW" badge from the product details image
  const otherBadges = product.badges.filter(
    (b) => (b as string).toUpperCase() !== "NEW" && (b as string) !== "নতুন"
  );

  return (
    <div className="flex flex-col gap-4">
      {/* ── Main Image ─────────────────────────────────── */}
      <div
        className="relative rounded overflow-hidden bg-muted border border-border aspect-square cursor-zoom-in group"
        onClick={handleOpenLightbox}
        role="button"
        tabIndex={0}
        aria-label={t("gallery.open")}
        onKeyDown={(e) => e.key === "Enter" && handleOpenLightbox()}
      >
        {/* Full-bleed product image filling container edge-to-edge */}
        <div className="absolute inset-0 overflow-hidden">
          {images.map((img, i) => (
            <Image
              key={img.id}
              src={img.url}
              alt={img.alt}
              fill
              className="object-cover scale-[1.14] transition-opacity duration-300"
              style={{
                opacity: i === activeIndex ? 1 : 0,
                transform: "scale(1.14)",
                transformOrigin: "center",
              }}
              aria-hidden={i !== activeIndex}
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={i === 0}
            />
          ))}
        </div>

        {/* Ambient glow */}
        <div className="absolute inset-0 bg-brand-fresh/5 blur-3xl rounded opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* Zoom hint */}
        <div className="sr-only">
          <div className="bg-brand-deep/60 backdrop-blur-sm text-muted-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded border border-border">
            {t("gallery.zoom")}
          </div>
        </div>

        {/* ── Save Badge Overlaid On Top Of Image ── */}
        {saveBadge && (
          <span className="absolute left-3.5 top-3.5 z-10 rounded bg-emerald-700 px-2.5 py-1 text-xs font-bold text-white shadow pointer-events-none">
            {saveBadge}
          </span>
        )}

        {/* Product badges (excluding "NEW") */}
        {otherBadges.length > 0 && (
          <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none opacity-100 transition-opacity duration-200 group-hover:opacity-0">
            {otherBadges.map((badge) => (
              <BadgeChip key={badge} badge={badge} />
            ))}
          </div>
        )}
      </div>

      {/* ── Thumbnail Strip ────────────────────────────── */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
          {images.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => handleThumbnailClick(idx)}
              aria-label={t("gallery.viewImage", { n: idx + 1, alt: img.alt })}
              className={`relative flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all duration-200 ${
                idx === activeIndex
                  ? "border-brand-fresh opacity-100"
                  : "border-border opacity-50 hover:opacity-80 hover:border-border"
              }`}
            >
              <Image
                src={img.url}
                alt={img.alt}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}

      {/* ── Lightbox ───────────────────────────────────── */}
      {lightboxOpen && (
        <Lightbox
          images={images}
          currentIndex={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}

// ── Badge Chip ──────────────────────────────────────────────────────────────
// Solid colours (same as the product cards): the badges sit on top of photos, so see-through tints are hard to read.
const BADGE_STYLES: Record<string, string> = {
  NEW: "bg-emerald-600 text-white border-emerald-700",
  HOT: "bg-brand-fresh text-on-fresh border-brand-fresh",
  "BEST SELLER": "bg-brand-fresh text-on-fresh border-brand-fresh",
  "LIMITED STOCK": "bg-destructive text-white border-destructive",
};

function BadgeChip({ badge }: { badge: string }) {
  const t = useTranslations("Product");
  return (
    <span
      className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded border shadow-sm ${
        BADGE_STYLES[badge] ?? "bg-secondary text-muted-foreground border-border"
      }`}
    >
      {t(`badges.${badge.replace(" ", "_")}`)}
    </span>
  );
}

// ── Lightbox ────────────────────────────────────────────────────────────────
interface LightboxProps {
  images: ProductImage[];
  currentIndex: number;
  onIndexChange: (idx: number) => void;
  onClose: () => void;
}

function Lightbox({
  images,
  currentIndex,
  onIndexChange,
  onClose,
}: LightboxProps) {
  const t = useTranslations("Product");
  const overlayRef = useRef<HTMLDivElement>(null);

  const goPrev = useCallback(
    () => onIndexChange((currentIndex - 1 + images.length) % images.length),
    [currentIndex, images.length, onIndexChange]
  );
  const goNext = useCallback(
    () => onIndexChange((currentIndex + 1) % images.length),
    [currentIndex, images.length, onIndexChange]
  );

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[2000] bg-brand-deep/95 backdrop-blur-xl flex items-center justify-center animate-scale-in"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={t("gallery.lightbox")}
    >
      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        aria-label={t("gallery.closeLightbox")}
        className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded bg-secondary border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-all z-10"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Prev */}
      {images.length > 1 && (
        <button
          type="button"
          onClick={goPrev}
          aria-label={t("gallery.prev")}
          className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded bg-secondary border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-all z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Image */}
      <div className="relative w-full max-w-4xl max-h-[80vh] mx-16 aspect-square">
        <Image
          src={images[currentIndex].url}
          alt={images[currentIndex].alt}
          fill
          className="object-contain"
          sizes="(max-width: 1024px) 90vw, 800px"
          priority
        />
      </div>

      {/* Next */}
      {images.length > 1 && (
        <button
          type="button"
          onClick={goNext}
          aria-label={t("gallery.next")}
          className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded bg-secondary border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-all z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Counter */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-muted-foreground/70 text-xs font-bold tracking-widest">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => onIndexChange(idx)}
              aria-label={t("gallery.viewImageN", { n: idx + 1 })}
              className={`w-12 h-12 rounded overflow-hidden border-2 transition-all ${
                idx === currentIndex
                  ? "border-brand-fresh opacity-100"
                  : "border-border opacity-40 hover:opacity-70"
              }`}
            >
              <Image
                src={img.url}
                alt={img.alt}
                width={48}
                height={48}
                className="object-contain w-full h-full"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

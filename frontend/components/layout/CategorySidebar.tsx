"use client";

import { Link } from "@/i18n/navigation";
import { gsap } from "@/components/motion/gsap";
import CategoryTree from "@/components/layout/CategoryTree";
import type { Category } from "@/lib/types";
import { ArrowRight, Flame, LayoutGrid, LifeBuoy, Phone, Sparkles, Tag, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import type { Locale } from "@/lib/locale";

interface CategorySidebarProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
}

/**
 * Floating "All categories" drawer: Popular / Offers / New arrivals at the top, then the whole category tree
 * (as many levels as the shop has), and Help / Contact at the bottom. Slides in from the left over the page.
 */
export default function CategorySidebar({ open, onClose, categories }: CategorySidebarProps) {
  const t = useTranslations("Nav");
  const locale = useLocale() as Locale;
  const panel = useRef<HTMLElement>(null);
  // rendered on <body>: the sticky nav has a backdrop blur, which would otherwise trap `fixed` children inside it
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Esc closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // lock page scroll + focus the panel while open (the scrollbar gutter is permanently reserved, so no page shift)
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // rows rise in one after another each time it opens
  useEffect(() => {
    if (!open || !panel.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rows = panel.current.querySelectorAll("[data-cat-row]");
    const tween = gsap.fromTo(rows, { x: -24, opacity: 0 }, { x: 0, opacity: 1, duration: 0.55, ease: "power3.out", stagger: 0.04, delay: 0.12 });
    return () => {
      tween.kill();
    };
  }, [open]);

  if (!mounted) return null;

  const quick = [
    { href: "/products?sortBy=popular", label: t("popular"), icon: Flame },
    { href: "/products?onSale=true", label: t("offers"), icon: Tag },
    { href: "/products?sortBy=newest", label: t("newArrivals"), icon: Sparkles },
  ];

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        data-lenis-prevent
        onClick={onClose}
        className={`fixed inset-0 z-[2100] bg-brand-deep/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        ref={panel}
        tabIndex={-1}
        data-lenis-prevent
        role="dialog"
        aria-modal="true"
        aria-label={t("allCategories")}
        aria-hidden={!open}
        className={`fixed left-0 top-0 z-[2110] flex h-full w-full max-w-[380px] flex-col border-r border-border bg-background outline-none transition-transform duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between bg-brand-deep px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded bg-brand-fresh text-on-fresh">
              <LayoutGrid className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <h2 className="font-outfit text-lg font-extrabold">{t("allCategories")}</h2>
              <p className="text-xs text-white/70">{t("categoriesCount", { count: formatNumber(categories.length, locale, 0) })}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("closeCategories")}
            className="flex h-9 w-9 items-center justify-center rounded border border-white/25 transition-colors hover:bg-white/15"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav aria-label={t("allCategories")} className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {/* Popular · Offers · New arrivals */}
          <ul className="mb-3 grid grid-cols-3 gap-2" data-cat-row>
            {quick.map((q) => (
              <li key={q.href}>
                <Link
                  href={q.href}
                  onClick={onClose}
                  className="flex h-full flex-col items-center gap-1.5 rounded border border-border bg-card px-2 py-3 text-center text-xs font-bold text-foreground transition-colors hover:border-brand-fresh hover:text-accent-text"
                >
                  <q.icon className="h-5 w-5 text-brand-fresh" aria-hidden="true" />
                  {q.label}
                </Link>
              </li>
            ))}
          </ul>

          <CategoryTree categories={categories} onNavigate={onClose} />
        </nav>

        {/* Footer: all products, help, contact */}
        <div className="shrink-0 space-y-3 border-t border-border bg-card px-4 py-4">
          <Link
            href="/products"
            onClick={onClose}
            className="flex items-center justify-center gap-2 rounded bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("browseAll")}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <div className="grid grid-cols-2 gap-2 text-sm font-semibold">
            <Link href="/returns-policy" onClick={onClose} className="flex items-center justify-center gap-1.5 rounded border border-border px-3 py-2 text-muted-foreground transition-colors hover:border-brand-fresh hover:text-foreground">
              <LifeBuoy className="h-4 w-4" aria-hidden="true" />
              {t("help")}
            </Link>
            <Link href="/contact" onClick={onClose} className="flex items-center justify-center gap-1.5 rounded border border-border px-3 py-2 text-muted-foreground transition-colors hover:border-brand-fresh hover:text-foreground">
              <Phone className="h-4 w-4" aria-hidden="true" />
              {t("contact")}
            </Link>
          </div>
        </div>
      </aside>
    </>,
    document.body,
  );
}

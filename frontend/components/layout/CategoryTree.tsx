"use client";

import { Link, usePathname } from "@/i18n/navigation";
import type { Category, SubCategory } from "@/lib/types";
import { categoryHref, pathTo } from "@/lib/utils/categories";
import { formatNumber } from "@/lib/format";
import type { Locale } from "@/lib/locale";
import { ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

interface Props {
  categories: Category[];
  /** called when a link is followed (e.g. close the drawer) */
  onNavigate?: () => void;
}

interface TreeNode {
  slug: string;
  name: string;
  productCount: number;
  children: TreeNode[];
}

const toNode = (s: SubCategory): TreeNode => ({ slug: s.slug, name: s.name, productCount: s.productCount, children: (s.children ?? []).map(toNode) });

interface RowProps {
  node: TreeNode;
  topSlug: string;
  depth: number;
  open: Set<string>;
  activeSlug: string | null;
  locale: Locale;
  onToggle: (slug: string) => void;
  onNavigate?: () => void;
  expandLabel: (open: boolean, name: string) => string;
}

function Row({ node, topSlug, depth, open, activeSlug, locale, onToggle, onNavigate, expandLabel }: RowProps) {
  const isOpen = open.has(node.slug);
  const has = node.children.length > 0;
  const active = node.slug === activeSlug;
  return (
    <li data-cat-row={depth === 0 ? "" : undefined}>
      <div className={`flex items-stretch ${depth === 0 ? "rounded border border-border bg-card" : ""}`}>
        <Link
          href={categoryHref(topSlug, node.slug)}
          onClick={onNavigate}
          aria-current={active ? "page" : undefined}
          className={`flex min-w-0 flex-1 items-center justify-between gap-2 py-2.5 pr-2 text-sm transition-colors hover:text-accent-text ${
            depth === 0 ? "px-4 font-bold" : "pl-3 font-medium"
          } ${active ? "text-accent-text" : depth === 0 ? "text-foreground" : "text-muted-foreground"}`}
        >
          <span className="flex min-w-0 items-center gap-2">
            {depth > 0 && <span className={`h-1.5 w-1.5 shrink-0 ${active ? "bg-brand-fresh" : "bg-border"}`} aria-hidden="true" />}
            <span className="truncate">{node.name}</span>
          </span>
          <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">{formatNumber(node.productCount, locale, 0)}</span>
        </Link>
        {has && (
          <button
            type="button"
            onClick={() => onToggle(node.slug)}
            aria-expanded={isOpen}
            aria-label={expandLabel(isOpen, node.name)}
            className={`flex w-10 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground ${depth === 0 ? "border-l border-border" : ""}`}
          >
            <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>
      {has && (
        <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
          <div className="overflow-hidden">
            <ul aria-hidden={!isOpen} className={depth === 0 ? "ml-3 mt-0.5 border-l-2 border-brand-fresh/30 pl-1" : "ml-3 border-l border-border pl-1"}>
              {node.children.map((c) => (
                <Row key={c.slug} node={c} topSlug={topSlug} depth={depth + 1} open={open} activeSlug={activeSlug} locale={locale} onToggle={onToggle} onNavigate={onNavigate} expandLabel={expandLabel} />
              ))}
            </ul>
          </div>
        </div>
      )}
    </li>
  );
}

/**
 * The category tree: an accordion with a chevron on every category that has children, as deep as the shop goes.
 * The category you are on is highlighted and its branch starts open. Used in the "All categories" drawer.
 */
export default function CategoryTree({ categories, onNavigate }: Props) {
  const t = useTranslations("Nav");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  // which category the address points at: /category/<top> or /category/<top>?sub=<deeper>
  const [sub, setSub] = useState<string | null>(null);
  useEffect(() => {
    setSub(new URLSearchParams(window.location.search).get("sub"));
  }, [pathname]);
  const top = pathname.startsWith("/category/") ? pathname.split("/")[2] : null;
  const activeSlug = sub ?? top;

  const activePath = useMemo(() => {
    if (!top || !activeSlug) return [] as string[];
    const cat = categories.find((c) => c.slug === top);
    return cat ? pathTo(cat, activeSlug) : [];
  }, [categories, top, activeSlug]);

  const [open, setOpen] = useState<Set<string>>(new Set());
  // the branch of the page you are on opens by itself
  useEffect(() => {
    if (activePath.length) setOpen((prev) => new Set([...prev, ...activePath.slice(0, -1)]));
  }, [activePath]);

  const onToggle = (slug: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  const expandLabel = (isOpen: boolean, name: string) => t(isOpen ? "collapse" : "expand", { name });

  return (
    <ul className="space-y-1.5">
      {categories.map((cat) => (
        <Row
          key={cat.slug}
          node={{ slug: cat.slug, name: cat.name, productCount: cat.productCount, children: cat.subCategories.map(toNode) }}
          topSlug={cat.slug}
          depth={0}
          open={open}
          activeSlug={activeSlug}
          locale={locale}
          onToggle={onToggle}
          onNavigate={onNavigate}
          expandLabel={expandLabel}
        />
      ))}
    </ul>
  );
}

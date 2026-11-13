"use client";

import { Link } from "@/i18n/navigation";
import type { Product } from "@/lib/types";
import Image from "next/image";
import { Plus } from "lucide-react";
import { useQuickAdd } from "@/lib/hooks/use-quick-add";
import { useLocale, useTranslations } from "next-intl";
import { formatMoney } from "@/lib/format";
import type { Locale } from "@/lib/locale";

/** Vertical "Related Products" list for the product page's left column. */
export default function RelatedSideList({ products }: { products: Product[] }) {
  const t = useTranslations("Product");
  const locale = useLocale() as Locale;
  const money = (n: number) => formatMoney(n, locale);
  const quickAdd = useQuickAdd();

  if (products.length === 0) return null;
  return (
    <section aria-labelledby="related-side-heading" className="overflow-hidden rounded border border-border bg-card">
      <h2 id="related-side-heading" className="border-b border-border px-5 py-4 font-outfit text-base font-bold text-foreground">
        {t("related.title")}
      </h2>
      <ul className="divide-y divide-border/70">
        {products.map((p) => {
          const img = p.images.find((i) => i.isPrimary) ?? p.images[0];
          const save = p.originalPrice && p.originalPrice > p.price ? p.originalPrice - p.price : 0;
          return (
            <li key={p.id} className="group flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-secondary/60">
              <Link href={`/products/${p.slug}`} className="flex items-center gap-3.5 min-w-0 flex-1">
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded border border-border bg-secondary">
                  {img && <Image src={img.url} alt="" fill sizes="64px" className="object-cover transition-transform duration-500 group-hover:scale-110" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-accent-text">{p.name}</span>
                  <span className="mt-1 flex flex-wrap items-baseline gap-x-2">
                    <span className="font-outfit text-base font-extrabold text-destructive">{money(p.price)}</span>
                    {save > 0 && <span className="text-xs text-muted-foreground line-through">{money(p.originalPrice!)}</span>}
                  </span>
                  {save > 0 && <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Save: {money(save)}</span>}
                </span>
              </Link>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void quickAdd({
                    id: p.id,
                    slug: p.slug,
                    name: p.name,
                    price: p.price,
                    stock: p.trackStock === false ? 9999 : p.stock,
                    trackStock: p.trackStock,
                    imageUrl: img?.url ?? "",
                    hasVariants: p.hasVariants,
                    unit: p.unit,
                  });
                }}
                aria-label={t("card.addNamed", { name: p.name })}
                className="w-8 h-8 shrink-0 rounded bg-muted border border-border flex items-center justify-center hover:bg-brand-fresh hover:border-brand-fresh hover:text-white transition-all group/btn active:scale-95"
              >
                <Plus className="w-4 h-4 text-muted-foreground/70 group-hover/btn:text-white transition-colors" />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

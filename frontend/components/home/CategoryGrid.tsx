import { Link } from "@/i18n/navigation";
import RevealGroup from "@/components/motion/RevealGroup";
import type { Category } from "@/lib/types";
import { BrowseTrigger } from "@/components/browse/BrowseModals";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import SectionHeader from "./SectionHeader";
import SectionMore, { sectionMoreClass } from "./SectionMore";
import { useLocale, useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import type { Locale } from "@/lib/locale";

interface CategoryGridProps {
  categories: Category[];
}

export default function CategoryGrid({ categories }: CategoryGridProps) {
  const t = useTranslations("Home");
  const locale = useLocale() as Locale;
  return (
    <section className="relative overflow-hidden bg-secondary pb-16 pt-[60px] sm:pt-[58px] md:pb-20 md:pt-[71px]" aria-labelledby="categories-heading">
      {/* decorative pixels that drift while scrolling */}
      <RevealGroup className="relative mx-auto max-w-[1440px] px-4 md:px-8">
        <span data-drift="1" className="pointer-events-none absolute -right-2 top-4 hidden h-6 w-6 bg-brand-fresh/70 md:block" aria-hidden="true" />
        <span data-drift="1.8" className="pointer-events-none absolute right-24 top-24 hidden h-3 w-3 bg-brand-fresh/40 md:block" aria-hidden="true" />
        <span data-drift="0.6" className="pointer-events-none absolute right-48 top-2 hidden h-4 w-4 bg-primary/30 md:block" aria-hidden="true" />

        <SectionHeader
          once
          title={
            <span id="categories-heading">
              {t.rich("categoriesTitle", { accent: (c) => <span className="text-brand-fresh">{c}</span> })}
            </span>
          }
          description={t("categoriesDesc")}
          action={
            <BrowseTrigger
              kind="categories"
              className="group inline-flex w-fit shrink-0 items-center gap-2 rounded border border-border bg-card px-5 py-3 text-sm font-bold text-foreground transition-colors hover:border-brand-fresh hover:text-accent-text"
            >
              {t("allCategories")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </BrowseTrigger>
          }
        />

        {/* small tiles: a picture, two lines of name */}
        <div className="grid grid-cols-4 gap-x-2 gap-y-5 sm:grid-cols-5 md:gap-x-4 lg:grid-cols-8">
          {categories.map((cat) => {
            // The dashboard can attach an image to a category; fall back to its icon, then to its first letter.
            const image = cat.image;
            return (
              <Link
                data-reveal="clip"
                key={cat.slug}
                href={`/category/${cat.slug}`}
                prefetch
                id={`category-${cat.slug}`}
                className="group flex flex-col items-center gap-2 text-center"
              >
                <span className="relative flex aspect-square w-full max-w-[96px] items-center justify-center overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary to-brand-deep-light shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-brand-fresh group-hover:shadow-md">
                  {cat.slug === "medicine" ? (
                    <span className="text-4xl" role="img" aria-label="Medicine">💊</span>
                  ) : image ? (
                    <Image src={image} alt="" fill sizes="96px" className="object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : cat.icon ? (
                    <svg className="h-9 w-9 text-white/90" fill="none" stroke="currentColor" strokeWidth={1.4} viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d={cat.icon} />
                    </svg>
                  ) : (
                    <span className="font-outfit text-3xl font-black text-white/90" aria-hidden="true">{Array.from(cat.name)[0]}</span>
                  )}
                </span>
                <span className="line-clamp-2 w-full break-words text-[12px] font-semibold leading-tight text-foreground transition-colors group-hover:text-accent-text sm:text-[13px]">{cat.name}</span>
                <span className="-mt-1.5 text-[11px] font-medium text-muted-foreground">{t("productsCount", { count: formatNumber(cat.productCount, locale, 0) })}</span>
              </Link>
            );
          })}
        </div>

        <SectionMore>
          <BrowseTrigger kind="categories" className={sectionMoreClass}>
            {t("allCategories")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </BrowseTrigger>
        </SectionMore>
      </RevealGroup>
    </section>
  );
}

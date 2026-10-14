import ProductCard from "@/components/product/ProductCard";
import type { Product } from "@/lib/types";
import RevealGroup from "@/components/motion/RevealGroup";
import SectionHeader from "./SectionHeader";
import SectionMore from "./SectionMore";
import { useTranslations } from "next-intl";

interface BestSellingProductsProps {
  products: Product[];
}

export default function BestSellingProducts({ products }: BestSellingProductsProps) {
  const t = useTranslations("Home");
  return (
    <section className="overflow-x-clip bg-secondary pb-16 pt-[60px] sm:pt-[58px] md:pb-20 md:pt-[71px]" aria-labelledby="best-selling-heading">
      <RevealGroup className="relative mx-auto max-w-[1440px] px-4 md:px-8">
        <span data-drift="1.4" className="pointer-events-none absolute right-0 top-2 hidden h-5 w-5 bg-brand-fresh/60 md:block" aria-hidden="true" />
        <span data-drift="0.7" className="pointer-events-none absolute right-16 top-20 hidden h-3 w-3 bg-primary/30 md:block" aria-hidden="true" />
        <SectionHeader
          title={
            <span id="best-selling-heading">
              {t.rich("bestTitle", { accent: (c) => <span className="text-brand-fresh">{c}</span> })}
            </span>
          }
          description={t("bestDesc")}
          href="/products"
          hrefLabel={t("seeBest")}
        />

        <div className="grid grid-cols-2 gap-3 [perspective:1100px] sm:grid-cols-3 md:gap-4 lg:grid-cols-5 xl:grid-cols-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} entrance={false} />
          ))}
        </div>

        <SectionMore href="/products" label={t("seeBest")} />
      </RevealGroup>
    </section>
  );
}

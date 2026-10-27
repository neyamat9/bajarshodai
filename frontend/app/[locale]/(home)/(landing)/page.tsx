import BestSellingProducts from "@/components/home/BestSellingProducts";
import CategoryGrid from "@/components/home/CategoryGrid";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import HeroSection from "@/components/home/HeroSection";
import { getShopCategories } from "@/lib/services/categories.service";
import { getHomeData } from "@/lib/services/products.service";
import { getBanners } from "@/lib/services/site.service";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/locale";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  setRequestLocale(rawLocale);
  const locale = rawLocale as Locale;
  const [categories, home, heroMain, heroSide] = await Promise.all([
    getShopCategories(locale),
    getHomeData(locale).catch(() => ({ featured: [], newArrivals: [], bestSellers: [], onSale: [] })),
    getBanners("HERO_MAIN"),
    getBanners("HERO_SIDE"),
  ]);

  return (
    <>
      <HeroSection main={heroMain} side={heroSide} spotlight={home.featured} categories={categories} />
      <CategoryGrid categories={categories} />
      {home.featured.length > 0 && <FeaturedProducts products={home.featured.slice(0, 8)} />}
      {home.bestSellers.length > 0 && <BestSellingProducts products={home.bestSellers.slice(0, 8)} />}
    </>
  );
}

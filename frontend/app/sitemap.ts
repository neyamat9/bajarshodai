import type { MetadataRoute } from "next";
import { getShopCategories } from "@/lib/services/categories.service";

export const revalidate = 86400; // 24 hours

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bazarshodai.com";
  const categories = await getShopCategories("bn").catch(() => []);

  const staticRoutes = [
    "",          // homepage /bn (default locale)
    "/products",
    "/contact",
    "/returns-policy",
    "/track-order",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  const categoryRoutes = categories.map((c) => ({
    url: `${baseUrl}/category/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes];
}

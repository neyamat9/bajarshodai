import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bazarshodai.com";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account*", "/orders*", "/cart*", "/checkout*", "/api*"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

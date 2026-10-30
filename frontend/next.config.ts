import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// Product images are served by the API server (…/uploads/…): allow its host.
const api = new URL(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api");
const apiPattern = {
  protocol: api.protocol.replace(":", "") as "http" | "https",
  hostname: api.hostname,
  ...(api.port ? { port: api.port } : {}),
};

// Also allow UPLOADS_PUBLIC_URL if different from the API URL
// (e.g., when uploads are served from a CDN or a separate subdomain)
const uploadsPatterns: { protocol: "http" | "https"; hostname: string; port?: string; pathname?: string }[] = [];
if (process.env.UPLOADS_PUBLIC_URL) {
  try {
    const uploadsBase = new URL(process.env.UPLOADS_PUBLIC_URL);
    uploadsPatterns.push({
      protocol: uploadsBase.protocol.replace(":", "") as "http" | "https",
      hostname: uploadsBase.hostname,
      ...(uploadsBase.port ? { port: uploadsBase.port } : {}),
      pathname: "/uploads/**",
    });
  } catch {
    // Invalid URL — skip
  }
}

const nextConfig: NextConfig = {
  // lets a production build run beside the dev server (different folder), e.g. NEXT_DIST_DIR=.nextprod for speed checks (avoid dashes in the name: they break the font loader)
  distDir: process.env.NEXT_DIST_DIR || ".next",
  experimental: {
    // Pages the visitor has opened stay in the browser's memory: going back or opening them again is instant (no skeleton).
    // Seconds: 10 minutes for pages that were opened, 30 minutes for pages that were only prefetched.
    staleTimes: { dynamic: 600, static: 1800 },
  },
  images: {
    // when the API runs on this machine (local development), allow the optimizer to fetch from it
    dangerouslyAllowLocalIP: ["localhost", "127.0.0.1"].includes(api.hostname),
    remotePatterns: [
      apiPattern,
      { protocol: "http", hostname: "localhost", port: "8000" },
      { protocol: "http", hostname: "127.0.0.1", port: "8000" },
      ...uploadsPatterns,
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.cloudinary.com" },
    ],
  },
};

export default withNextIntl(nextConfig);

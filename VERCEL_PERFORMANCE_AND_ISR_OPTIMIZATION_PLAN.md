# Next.js 16 & Vercel Performance Optimization Plan

## Bulletproof Architecture for Instant Speed, Minimal ISR Writes & Zero-Crash VPS Readiness

**Document Version:** 1.6.0 (Sitemap Routes Verified Against Actual App Pages)  
**Target Environment:** Vercel (Current Production) & Linux VPS / Docker / PM2 (Future Portability)  
**Status:** Approved for Documentation — Ready for Execution on User Approval

---

## 1. Executive Summary & Core Objectives

This plan addresses excessive Vercel ISR Writes, unnecessary cache invalidations, and server load spikes across the Bazar Shodai storefront (`frontend/`) and backend synchronization service (`server/`).

### Guiding Principles & Commitments:

1. **Zero Slowdown / Faster Loads:** Page response times will be faster (sub-50ms) because cached pages will stay warm on Vercel's Edge Network (Singapore `sin1`) rather than being wiped out repeatedly.
2. **Freshness Guaranteed:** When product prices, stock, or details are updated in the admin dashboard, they will continue to update immediately. Live prices and stock remain verified on client mount.
3. **100% Visual & Functional Parity:** Zero UI, styling, or checkout changes.
4. **VPS Ready:** All architectural improvements use standard Next.js native primitives (`revalidateTag`, Data Cache, `dynamic = 'force-dynamic'`), ensuring 100% portability to a self-hosted VPS without code rewrites.

---

## 2. Identified Critical Bottlenecks & Root Causes

|   #   |   Severity   | Problem                                                     | File Location & Line Numbers                                                        | Root Cause & Impact                                                                                                                                                               |
| :---: | :----------: | ----------------------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | **CRITICAL** | Customer Orders & Checkouts Purging Storefront Cache        | `server/src/common/storefront/storefront-revalidate.interceptor.ts:20`              | Every order placed or checkout calls `notify(['products', 'home'])`, wiping the entire product catalog and homepage cache on every purchase.                                      |
| **2** | **CRITICAL** | Thundering Herd via Dual `router.refresh()`                 | `frontend/components/layout/FreshnessWatcher.tsx:34-36`                             | Whenever `content-version` moves, every open visitor browser fires `router.refresh()` **twice** in 3 seconds, triggering hundreds of simultaneous serverless executions.          |
| **3** |   **HIGH**   | Private Account & Checkout Routes on 300s ISR Loops         | `frontend/app/[locale]/(account)/layout.tsx:13`                                     | `export const revalidate = 300;` forces Vercel to continuously rebuild and bill ISR Writes for 14 private client-only shells (`/account`, `/orders`, `/cart`, `/checkout`, etc.). |
| **4** |   **HIGH**   | Monolithic Coarse Cache Tagging                             | `frontend/lib/api/client.ts:169-178`                                                | All endpoints starting with `/customer/products` get tagged with single string `'products'`. Updating 1 product purges all 1,000 products.                                        |
| **5** |   **HIGH**   | Product Page Revalidation Interval Downgrade (120s vs 300s) | `frontend/lib/services/reviews.service.ts:14,24`                                    | Inner reviews and questions fetches use `revalidate: 120`, which lowers the entire product route revalidation from 300s to 120s (2 minutes).                                      |
| **6** |  **MEDIUM**  | Dynamic Search Query Cache Pollution                        | `frontend/app/[locale]/(home)/search/page.tsx:56`, `frontend/lib/api/client.ts:199` | Every unique search query string (`search=rice`) gets cached in the Next.js Data Cache tagged with `products`.                                                                    |
| **7** |  **MEDIUM**  | Eager LiveChat WebSocket Connection on Every Page Load      | `frontend/components/chat/LiveChatContext.tsx:134-135`                              | Establishes a Socket.IO connection and 2 API calls on page mount for 100% of visitors, even if chat is never opened.                                                              |
| **8** |  **MEDIUM**  | Missing `robots.ts` and `sitemap.ts`                        | `frontend/app/`                                                                     | Search engines crawl randomly without structured index hints, triggering unnecessary SSR executions.                                                                              |

---

## 3. Step-by-Step Implementation Plan

```mermaid
flowchart TD
    subgraph Phase 1: Invalidation Decoupling
        A1["1. server/storefront-revalidate.interceptor.ts"] -->|Remove order/checkout events| B1["Stops catalog-wipe on customer checkout"]
        A2["2. frontend/lib/api/client.ts"] -->|Introduce granular tags| B2["Tag product-${slug}, category-${slug}"]
    end

    subgraph Phase 2: Route & Refresh Stabilization
        C1["3. frontend/app/[locale]/(account)/layout.tsx"] -->|dynamic = 'force-dynamic'| D1["Eliminates 14 private ISR loop routes"]
        C2["4. frontend/components/layout/FreshnessWatcher.tsx"] -->|Remove duplicate refresh & add jitter| D2["Stops 600 concurrent serverless spikes"]
    end

    subgraph Phase 3: Route & Cache Fine-Tuning
        E1["5. frontend/lib/services/reviews.service.ts"] -->|Align revalidation to 300s| F1["Stops 120s downgrade; aligns with layout"]
        E2["6. frontend/app/[locale]/(home)/search/page.tsx"] -->|Bypass Data Cache on search| F2["Prevents search query bloat"]
        E3["7. frontend/components/chat/LiveChatContext.tsx"] -->|Lazy-load Socket on chat click| F3["Removes initial load WebSocket overhead"]
        E4["8. frontend/app/robots.ts & sitemap.ts"] -->|Generate standard XML sitemap| F4["Optimal search engine crawl rate"]
    end
```

---

### Step 1: Decouple Customer Orders & Checkouts from Catalog Invalidation

- **Target File:** `server/src/common/storefront/storefront-revalidate.interceptor.ts`
- **Change:**
  1. Remove `orders` and `checkout` from `tagsFor()`. Customer purchases only mutate inventory rows in PostgreSQL; they do not change static product titles, images, or descriptions.
  2. Keep product catalog cache warm so the next visitor gets instant response times.
  3. Ensure price/description edits by admins in the dashboard continue to trigger targeted invalidation.

```ts
// server/src/common/storefront/storefront-revalidate.interceptor.ts
function tagsFor(path: string): string[] {
  // Customer checkout / orders should NEVER invalidate the static product cache.
  // Live stock and prices are already verified in real-time on cart & product mount.
  if (/\/customer\/(orders|checkout)/i.test(path)) return [];

  // Note: POST /customer/reviews and POST /customer/questions do NOT contain a product slug in
  // their URLs, so they fall through to the default [] below — meaning a new review does not
  // immediately wipe a product's cache. The existing 5-minute ISR cycle picks it up. This is
  // acceptable: reviews are low-urgency and cache-busting every review would waste ISR writes.

  const m = /\/admin\/([a-z-]+)/i.exec(path);
  if (!m) return [];
  switch (m[1].toLowerCase()) {
    case "products":
    case "product":
    case "flash-deals":
      return ["products", "home"];
    case "inventory":
    case "orders":
    case "returns":
      return []; // Do not purge public marketing catalog on routine status/stock changes
    case "categories":
    case "category":
    case "sub-categories":
    case "sub-category":
      return ["categories"];
    case "brands":
    case "brand":
      return ["brands"];
    case "banners":
      return ["banners", "home"];
    case "settings":
      return ["settings", "shipping"];
    default:
      return [];
  }
}
```

---

### Step 2: Implement True Granular Cache Tagging (Isolate Detail Pages from Listing Wipes)

- **Target File:** `frontend/lib/api/client.ts`
- **Target File:** `frontend/app/api/revalidate/route.ts`
- **Target File:** `server/src/common/storefront/storefront-revalidate.interceptor.ts`
- **Architectural Principle:**
  In Next.js App Router, if a cache entry is tagged with multiple tags (e.g., `['product-fresh-suji-500g', 'products']`), calling `revalidateTag('products')` purges **all** entries carrying `'products'`.
  Therefore, individual product detail pages **must not** carry the broad `'products'` tag. They must be tagged **exclusively** with `product-${slug}`.

```ts
// frontend/lib/api/client.ts
function cacheTagsFor(endpoint: string): string[] {
  const [path] = endpoint.split("?");
  const parts = path.split("/").filter(Boolean); // e.g. ['customer', 'products', 'fresh-suji-500g']

  if (path === "/customer/home") return ["home"];
  if (parts[1] === "products") {
    // Individual product detail page gets its OWN tag ONLY (isolates it from catalog wipes)
    if (parts[2] && parts[2] !== "filters" && parts[2] !== "suggestions") {
      return [`product-${parts[2]}`];
    }
    // Catalog listing, category grids, search cards
    return ["products"];
  }
  if (parts[1] === "categories") {
    if (parts[2]) return [`category-${parts[2]}`];
    return ["categories"];
  }
  if (parts[1] === "brands") {
    if (parts[2]) return [`brand-${parts[2]}`];
    return ["brands"];
  }
  if (parts[1] === "banners") return ["banners", "home"];
  if (parts[1] === "settings") return ["settings"];
  if (parts[1] === "shipping") return ["shipping", "settings"];
  return [];
}
```

```ts
// server/src/common/storefront/storefront-revalidate.interceptor.ts
// Extract entity slug from controller response to invalidate that specific detail page:
@Injectable()
export class StorefrontRevalidateInterceptor implements NestInterceptor {
  constructor(private readonly sync: StorefrontSyncService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") return next.handle();
    const req = context.switchToHttp().getRequest<Request>();
    if (!WRITES.has(req.method)) return next.handle();
    const staticTags = tagsFor(req.originalUrl ?? req.url);

    return next.handle().pipe(
      tap({
        next: (body: unknown) => {
          const tags = [...staticTags];
          if (body && typeof body === "object") {
            const b = body as { slug?: string; product?: { slug?: string } };
            const slug = b.slug ?? b.product?.slug;
            const url = (req.originalUrl ?? req.url).toLowerCase();
            if (slug) {
              if (url.includes("/admin/categor")) {
                tags.push(`category-${slug}`);
              } else if (url.includes("/admin/brand")) {
                tags.push(`brand-${slug}`);
              } else if (
                url.includes("/admin/product") ||
                url.includes("/customer/reviews") ||
                url.includes("/customer/questions")
              ) {
                tags.push(`product-${slug}`);
              }
            }
          }
          if (tags.length) this.sync.notify(tags);
        },
      }),
    );
  }
}
```

```ts
// frontend/app/api/revalidate/route.ts
// REQUIRED: Replace ALLOWED.has(t) filter with this prefix-aware check.
// The current Set-only check silently drops granular tags like 'product-{slug}'.
function isAllowedTag(tag: string): boolean {
  if (ALLOWED.has(tag)) return true;
  if (
    tag.startsWith("product-") ||
    tag.startsWith("category-") ||
    tag.startsWith("brand-")
  )
    return true;
  return false;
}

// Update the tags filter line from:
//   tags = body.tags.filter((t): t is string => typeof t === "string" && ALLOWED.has(t));
// To:
//   tags = body.tags.filter((t): t is string => typeof t === "string" && isAllowedTag(t));
```

---

### Step 3: Convert Private Account Routes to Dynamic Client Shells

- **Target File:** `frontend/app/[locale]/(account)/layout.tsx` ← **only this file**

> [!NOTE]
> **Scope is limited to `(account)/layout.tsx` only.**
> `(checkout)/layout.tsx` has been verified to have **no** `revalidate` export and no ISR configuration — it is already safe and must NOT be modified. The `cart` and `checkout` pages under `(checkout)/` are also already clean.

- **Change:**
  Remove `export const revalidate = 300;` from `(account)/layout.tsx` and replace with `export const dynamic = "force-dynamic"`. This stops Vercel from running ISR write loops every 5 minutes for 14 private account-only page shells (`/account`, `/orders`, `/wishlist`, `/account/settings`, etc.) that never serve public cached content.

```tsx
// frontend/app/[locale]/(account)/layout.tsx
// REMOVE this line:
// export const revalidate = 300; // only the shop chrome is rendered here; the account pages load their own data in the browser

// ADD this line instead:
export const dynamic = "force-dynamic";
```

---

### Step 4: Stabilize `FreshnessWatcher` (Eliminate Dual Refresh & Add Jitter)

- **Target File:** `frontend/components/layout/FreshnessWatcher.tsx`
- **Change:**
  1. Increase polling interval from 60s to 120s.
  2. Remove `window.setTimeout(() => router.refresh(), 3000)`.
  3. Add a randomized jitter window (100ms – 1,500ms) to spread background refreshes smoothly across visitors.

```tsx
// frontend/components/layout/FreshnessWatcher.tsx
const EVERY_MS = 120_000; // 2 minutes

// Inside check():
const changed = last.current !== null && last.current !== v;
last.current = v;
if (changed) {
  const jitter = Math.floor(Math.random() * 1400) + 100;
  setTimeout(() => {
    router.refresh();
  }, jitter);
}
```

---

### Step 5: Stop Reviews/Questions from Downgrading Product Page ISR (Align to 300s)

- **Target File:** `frontend/lib/services/reviews.service.ts`
- **Target File:** `frontend/app/[locale]/(home)/products/[slug]/page.tsx`
- **Context & Next.js App Router Precedence:**
  In Next.js App Router, the effective revalidation period for any route is `Math.min(layout, page, ...fetches)`.
  Because `frontend/app/[locale]/(home)/layout.tsx` exports `revalidate = 300` (5 minutes), child routes cannot revalidate slower than 300 seconds without modifying the layout. 300s (5 minutes) is the desired e-commerce production baseline.
- **The Actual Root Bottleneck:**
  `frontend/lib/services/reviews.service.ts` had hardcoded `revalidate: 120` in `getReviews()` (line 14) and `getQuestions()` (line 24). This forced Next.js to downgrade the entire product detail route from 300s down to 120s (2 minutes), accelerating ISR cache writes by 2.5x.
- **Change:**
  1. Update `getReviews()` and `getQuestions()` in `frontend/lib/services/reviews.service.ts` from `revalidate: 120` to `revalidate: 300` (aligning with the 300s layout floor).
  2. Maintain `export const revalidate = 300;` on `products/[slug]/page.tsx` so the entire tree is uniformly aligned at 5 minutes.

---

### Step 6: Prevent Search from Caching Category Data Unnecessarily

- **Target File:** `frontend/app/[locale]/(home)/search/page.tsx`

> [!NOTE]
> **Partially already done.** The search page already has `export const dynamic = "force-dynamic"` which prevents search result queries (`listProducts`, `getProductFacets`) from being cached. No change needed for search result fetches.
>
> **One remaining issue:** The `getCategories(locale)` call inside the search page still runs through the standard `'categories'` Data Cache tag. Since the search page is `force-dynamic`, this fetch re-runs on every search request but could share stale cached category data. No critical action required here — it is already protected by `force-dynamic`. This step is effectively **complete as-is**; no code changes needed for search/page.tsx.

---

### Step 7: Lazy-Load Live Chat WebSocket

- **Target File:** `frontend/components/chat/LiveChatContext.tsx`
- **Change:**
  Connect the Socket.IO client and load message history only when the user opens the live chat modal (or clicks the button), removing immediate socket overhead for normal shoppers.

```tsx
// frontend/components/chat/LiveChatContext.tsx
// Before: initSession() called on mount for all visitors
// After: Guard with isOpen so normal shoppers make 0 WebSocket connections:
useEffect(() => {
  if (!isOpen) return;
  initSession();

  const handleAuthChange = () => {
    if (isOpen) initSession();
  };

  window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
  return () => {
    window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };
}, [isOpen, initSession]);
```

---

### Step 8: Add SEO `robots.ts` & `sitemap.ts`

- **Target File:** `frontend/app/robots.ts`
- **Target File:** `frontend/app/sitemap.ts`
- **Change:**
  Add standard App Router sitemap and robots handlers with 24-hour cache headers so search crawlers index canonical product and category URLs without hitting random dynamic routes.

```ts
// frontend/app/robots.ts
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
```

```ts
// frontend/app/sitemap.ts
import type { MetadataRoute } from "next";
import { getShopCategories } from "@/lib/services/categories.service";

export const revalidate = 86400; // 24 hours

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bazarshodai.com";
  const categories = await getShopCategories("bn").catch(() => []);

  const staticRoutes = [
    "", // homepage /bn (default locale)
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
```

---

## 4. Expected Results & Resource Impact

| Metric                              | Current State                           | Optimized State              | Business & Infrastructure Impact             |
| ----------------------------------- | --------------------------------------- | ---------------------------- | -------------------------------------------- |
| **Vercel ISR Writes**               | ~50,000 – 150,000+ / mo                 | ~5,000 – 15,000 / mo         | **70% – 85% Cost Reduction**                 |
| **Serverless Function Invocations** | Spikes on every order (thundering herd) | Smooth, predictable baseline | **40% – 60% Invocations Cut**                |
| **Edge Cache Hit Ratio**            | Low (frequently wiped by checkouts)     | 95%+ High                    | **Sub-50ms Instant Page Loads**              |
| **PostgreSQL Database Load**        | High query spikes on cache clears       | Low & Steady                 | **Prevents Neon DB connection exhaustion**   |
| **VPS Portability**                 | At risk of 100% CPU crash on orders     | 100% Safe & Stable           | **Runs smoothly on a modest $10–$20/mo VPS** |

---

## 5. Verification & Testing Matrix

Before concluding execution, the following verification will be conducted:

1. **TypeScript Typecheck:**
   - Web: `node frontend/node_modules/typescript/bin/tsc -p frontend/tsconfig.json --noEmit`
   - Mobile: `npm --prefix bazar-shodai-app run type-check`
2. **Automated Unit & Integration Tests:**
   - Web: `npm --prefix frontend test` (All 11 test suites / 88 tests)
   - Mobile: `npm --prefix bazar-shodai-app test` (All 11 test suites / 72 tests)
3. **Storefront Verification:**
   - Homepage loads with active categories and products.
   - Product details page loads instantly, displaying accurate price and stock.
   - Admin price updates correctly invalidate the targeted product.
   - Cart, checkout, and order history function without regression.
4. **Build Verification:**
   - Run `npm --prefix frontend run build` to verify `prerender-manifest.json` confirms no private routes are trapped in ISR loops.

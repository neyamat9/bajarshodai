# Bazar Shodai (বাজার সদাই) — Master Plan

## 1. Context

`E:\bazar-shodai` holds three apps copied from an older electronics shop ("GadgetBachai" / "RaizBD" / "TechBD"):

| App | Stack | Role |
|---|---|---|
| `server/` | NestJS 11, Prisma 7, PostgreSQL, JWT | REST API (`/api/customer/*`, `/api/admin/*`) |
| `frontend/` | Next.js 16, React 19, Tailwind 4, GSAP | Customer storefront |
| `dashboard/` | Vite, React 19, Tailwind 4, TanStack Query, Zustand, Recharts | Admin panel |

**Git status (checked):** you already removed every `.git` and `.husky` folder, including the old remotes. There is no git anywhere now, so we start clean (§16).
**Database:** a new, empty Neon database is configured in `server/.env`.

**Goal:** turn it into **Bazar Shodai**, a daily-needs grocery and fresh-food delivery service (fish, vegetables, fruit and so on) for **Shahrasti upazila, Chandpur**, delivering within about 20 km. It needs:

- Bangla (default) and English.
- GPS-based location sharing.
- Distance-based delivery fee.
- Staff and rider management.
- Delivery tracking, activity logs and delivery statistics.
- A new green brand taken from the logo.

**What already exists and will be reused**

- Order, cart and guest checkout flow, plus COD and manual bKash/Nagad payments.
- `ActivityLog` and `AuditLog` (`server/src/common/activity/`, `common/audit/`).
- Settings store with encrypted secrets (`server/src/common/settings/` — `SECRET_FIELDS`, `secret-box.ts`).
- Order item editing (`server/src/admin/orders/order-edit.service.ts`), reports, analytics and dashboard shell.
- Bangladesh division/district/upazila data (`server/src/common/locations/`), and lat/lng columns on `Address`.

**What is missing and is new work**

- No i18n and no Bangla font anywhere.
- No staff or permission system. Every admin sees everything, and `MODERATOR` is unused.
- No map code, no delivery or rider module.
- Quantities are integers, so there are no weight-based items.
- Categories are only two levels in practice, but the screenshots show three.
- No floating cart.

## 2. Decisions already made

| Topic | Decision |
|---|---|
| Maps | **Both Google Maps and OpenStreetMap**, chosen in **Admin → Settings → Maps**. Switch at any time. Start on OSM if wanted, move to Google later. |
| Payments | Cash on Delivery + manual bKash/Nagad (existing flow). |
| Customer login | **Phone + password**, email optional, **guest checkout kept**. SMS OTP can come later. |
| Units | **Admin-managed** (kg, piece, packet and any future unit) in Dashboard → Catalog → Units. A database table, not a fixed list. |
| Slugs | **English ASCII slug only.** Bangla lives in separate `…Bn` fields. See §6. |
| Database | Assumed **fresh**. We reset to one new Prisma baseline migration (the old migrations are stale). |
| **Distance origin** | **Kalibari Bazar, by the Kalibari High School field and Sonali Bank Kalibari.** Every delivery distance, and the 20 km service limit, is measured from this one point. |
| Git | **One monorepo at `E:\bazar-shodai`** (server, frontend, dashboard, PLAN.md, brand assets). Fresh history. Remote `https://github.com/neyamat7/bazar-shodai.git`, branch `main`, everything pushed to `main`. See §16. |
| Hosting | **Not now.** No VPS settings or deploy files in this work. Done later. |
| Env files | Regenerate all secrets, fix dev paths, add the new variables. See §17. |
| Plan file | Already copied to `E:\bazar-shodai\PLAN.md` (Phase 0, done). |

## 3. Brand and theme (green)

Logos: use the **new** pair you attached (they replace the earlier versions). They now include a **medicine capsule** in the cart:

- Square mark with the name below (2000×2000): `...\images\7.png`.
- Horizontal wordmark (2800×840): `...\images\8.png`.

(Both are in the session's temp `images` folder.) During implementation they get copied into `frontend/public`, `dashboard/public` and `app/icon.png`, exported to webp, and used to make a favicon and PWA icons. The wide logo goes in headers and the dashboard sidebar, the square one on login pages, the favicon and PWA icons.

Palette sampled from the logo (exact hex values are re-sampled from the files in Phase 1):

| Token | Approx. | Use |
|---|---|---|
| Deep green (বাজার) | `#0B6234` | Header, headings, sidebar |
| Fresh green (সদাই) | `#4DA32F` | Accents, active states |
| CTA green | about `#3E9B2A` | Add-to-cart, primary buttons. Contrast with white text must be ≥ 4.5:1. |
| Tomato red | `#E0261B` | Discounts, errors |
| Carrot orange | `#F57C00` | Secondary highlights, badges |
| Fish blue | `#1E88B5` | Info, links |
| Background | soft off-white with a green tint | Page background |

**How to change it**

- **Storefront.** Colours live only in `frontend/app/globals.css`. `brand-orange` is used about 283 times and `brand-navy` about 31, so rename the tokens with a codemod instead of editing by hand:
  - `brand-navy` → `brand-deep`
  - `brand-orange` → `brand-fresh`
  - `on-orange` → `on-fresh`
- **Hardcoded values to fix:**
  - `#1d6ac9` and `via-[#0b4d9c]` in `components/auth/AuthBits.tsx`, `AuthForm.tsx`, `components/account/ui.tsx`, `AccountShell.tsx`, `app/(account)/account/page.tsx`.
  - Navy and orange `rgba(...)` shadows in `CartSidebar.tsx`, `ProductCard.tsx`, `CheckoutHeader.tsx`, `OrderReview.tsx`, `app/(checkout)/cart/page.tsx`, `app/not-found.tsx`.
  - The `AuthModal.tsx` background gradient.
  - `RobotMascot.tsx` (about 25 fills; recolour it, or replace it with the logo mark).
  - Keep the bKash `#e2136e` and Nagad `#f6921e` brand colours.
- **Dashboard.** Edit `dashboard/src/index.css` (`--color-navy-*` and `--color-orange-*` scales, `:root`/`.dark` variables). Then fix:
  - `Sidebar.tsx` (`to-[#042a55]`, `text-navy-*`).
  - `AuthShell.tsx` gradients and decorative capsules.
  - `pages/dashboard/Dashboard.tsx` chart hexes (`PIE`, area and bar colours).
  - `StatCard.tsx` `STROKE` map, `ui/badge.tsx` `brand`/`orange` variants.
  - `pages/catalog/Banners.tsx` placeholder.
- **Rebrand strings.** Replace "GadgetBachai", "RaizBD", "TechBD" and "RZ-" everywhere:
  - Storefront: `app/layout.tsx` metadata, every page `generateMetadata` title, `BrandLogo.tsx`, `SiteFooter.tsx`, `AuthForm.tsx`, `ProductDetailClient.tsx`, `contact/page.tsx`, `lib/services/site.service.ts` fallback, `lib/api/mappers.ts:210`.
  - Dashboard: `index.html`, `Sidebar.tsx`, `AuthShell.tsx`, `useLiveOrders.ts`, `AdminLayout.tsx` fallback URL, `ProductEditor.tsx` SEO preview.
  - Server: `main.ts` Swagger, `app.service.ts`, `settings.types.ts` defaults (`TechBD`), `configuration.ts` `MAIL_FROM`, `.env.example`, `settings.dto.ts` examples.
  - Order-number prefix `RZ-` → `BS-` (`common/orders/order-lifecycle.ts` and its Swagger examples).
  - Also rename the `gb_*` localStorage keys and events to `bs_*`.
  - Delete `frontend/demo/`, `public/window.svg`, and `server/test_output.txt`.
- **Fonts.** Add a Bangla font (Hind Siliguri, or Noto Sans Bengali / Anek Bangla) via `next/font/google` with the `bengali` subset in `frontend/app/layout.tsx`. Keep Inter for Latin text. Add it to the dashboard CSS import too.

## 4. Data model (Prisma) — `server/prisma/schema.prisma`

Reset to a single baseline migration. Seed new grocery data (§11).

**Remove** (unused or electronics-only): `SpecificationHeader/Item`, `CompareItem`, `Affiliate`, `Commission`, `AbandonedCartReminder`, `ShippingMethod/Zone/ZoneRate`, `SitePage`, `BlogPost`, `Redirect`, `AnalyticsEvent`, `SubCategory`, product warranty, and the courier/tracking and `shippingZone` fields on `Order`.

**Change**

| Model | Change |
|---|---|
| `Category` | One self-referencing tree with unlimited depth (screenshots need 3 levels). Add `nameBn`, `descriptionBn`. Slug stays ASCII. SubCategory rows migrate into it. |
| `Product` | Add `nameBn`, `shortDescriptionBn`, `descriptionBn`. Add `unitId` (a link to the admin-managed `Unit` table, not a fixed list), `packSize` (e.g. "500 g"), `sellStep` and `minQty` (optional, they override the unit's defaults, e.g. 0.5 for fish), `isWeighed` (final weight may differ). `stock` becomes Decimal. Brand stays optional, hidden in the UI. |
| `ProductVariant` | Becomes "pack options" (250 g / 500 g / 1 kg), with `nameBn`. |
| `CartItem`, `OrderItem` | `quantity` → `Decimal(10,3)`. `OrderItem` adds `unitLabel` / `unitLabelBn` (a **snapshot** of the unit text at order time, so renaming a unit later never changes old orders or invoices), `orderedQty`, `finalQty`, `finalTotal` (set when the packer weighs the item). |
| `Banner` | Add `titleBn` and bilingual text. |
| `User` | Phone required and unique, email optional. Roles: `USER, STAFF, ADMIN, SUPER_ADMIN` (`MODERATOR` removed). Add `permissions String[]`, `canDeliver Boolean`, `staffTitle`, `isActive`. Keep `language`, default `bn`. |
| `Address` | Add `placeName`, `placeNameBn`, `landmark`, `accuracyM`, `locationSource` (GPS / PIN / LINK), `locationCapturedAt`. |
| `Order` | Add `deliveryLat/Lng` (snapshot), `deliveryDistanceKm`, `deliveryDurationSec`, `deliveryFee` (calculated), `deliveryFeeOverride`, `deliveryFeeOverrideReason`, `distanceEstimated`, `deliverySlot`, `deliveryDate`, `customerKey`. Statuses simplify to `PENDING, CONFIRMED, PACKING, OUT_FOR_DELIVERY, DELIVERED, CANCELLED, FAILED`. |

**New models**

| Model | Fields |
|---|---|
| `Unit` | **Admin-managed units of sale.** `code` (unique ASCII, e.g. `kg`), `name` / `nameBn` (Kilogram / কেজি), `shortLabel` / `shortLabelBn` (shown on cards, e.g. `kg` / `কেজি`), `allowDecimal` (true for kg and litre, false for piece and packet), `defaultStep` (0.5, 1 …), `defaultMinQty`, `isActive`, `displayOrder`. See the rules below this table. |
| `CustomerLocation` | `userId?`, `deviceToken?`, `phone`, `lat`, `lng`, `accuracyM`, `placeName`, `source`, `capturedAt`, `consentAt`. Keeps recent history; the latest is the "saved location". |
| `LocationRequest` | Share-link record: `token`, `phone?`, `name?`, `orderId?`, `status` (PENDING / SHARED / EXPIRED), `expiresAt`, shared `lat/lng`, `createdByStaffId`. |
| `Delivery` | `orderId` (unique), `assigneeId`, `assignedById`, `status` (ASSIGNED, ACCEPTED, PICKED_UP, ON_THE_WAY, DELIVERED, FAILED, CANCELLED), `assignedAt`, `pickedUpAt`, `deliveredAt`, `failedReason`, `cashToCollect`, `cashCollected`, `cashHandedOverAt`, `proofUploadId?`, `distanceKm`, `customerKey`. |
| `DeliveryEvent` | Append-only history of every delivery status change (who, when, note). |

**Unit rules (admin can add units any time)**

- Admin adds, edits, reorders and deactivates units in **Dashboard → Catalog → Units**. No developer or deploy is needed for a new unit such as বোতল (bottle), আঁটি (bundle) or হালি (set of 4).
- A unit that products use **cannot be deleted**. It can only be **deactivated**, which hides it from new products but keeps old products and orders correct.
- Editing a unit's label changes the storefront everywhere at once. Past orders and invoices keep the snapshot text.
- `allowDecimal = false` makes the cart stepper whole numbers only (1, 2, 3). `allowDecimal = true` uses the step (for example 0.5 kg).
- A product can override the unit's step and minimum (e.g. fish sold from 0.5 kg, rice from 1 kg).
- No unit conversion (grams to kilograms). Each product is sold in one unit. If a product needs several sizes, use **pack options** (250 g / 500 g / 1 kg).
- Every active unit is returned with the product data and cached with the home and settings data, so cards render without extra requests.

**Counters.** `customerKey = userId ?? normalizedPhone`.

- Total deliveries = `Delivery` rows with status `DELIVERED`.
- Unique customers = `COUNT(DISTINCT customerKey)` over those rows.

## 5. Delivery fee and service area

**Settings (new `delivery` group in `settings.types.ts`, all editable in the dashboard)**

- **Origin = Kalibari Bazar** (Kalibari High School field side / Sonali Bank Kalibari), stored as `originLat/originLng` plus a label in Bangla and English (কালীবাড়ী বাজার, হাই স্কুল মাঠ সংলগ্ন / সোনালী ব্যাংক কালীবাড়ী). The service-area centre defaults to this same point.
- I don't have the exact coordinates, and guessing would put every fee off. So the seed leaves a placeholder, and the **admin drops the pin on the map once in Settings → Delivery** (satellite view helps find the school field). Until the pin is set, checkout stays disabled with a warning in the dashboard.
- `serviceRadiusKm` = 20, measured from the origin.
- `baseKm` = 2, `baseCharge` = 20, `perKmRate` = 10, `stepKm` = 1.
- Minimum order amount, optional free-delivery threshold, delivery time slots, shop open/close hours and an on/off switch.

**Formula** (server-authoritative; the client only previews)

```
d = round(roadDistanceKm, 2)
fee = d <= baseKm ? baseCharge
                  : baseCharge + perKmRate * ceil((d - baseKm) / stepKm)
```

| Distance | Fee |
|---|---|
| 0 – 2 km | ৳20 |
| 2.01 – 3 km | ৳30 |
| 3.01 – 4 km | ৳40 |
| … | +৳10 per started km |
| 19.01 – 20 km | ৳200 |

- Rounding to 2 decimals before `ceil` avoids float glitches such as 2.0000001 → ৳30.
- **Service-area check:** straight-line distance from the origin (Kalibari Bazar) must be ≤ `serviceRadiusKm`, otherwise checkout is blocked with a clear message. The fee uses **road distance from the same origin** to the customer pin.
- **Fallback:** if routing fails, use straight line × 1.3 and set `distanceEstimated = true`. Admin sees a warning.
- Admin can **override** the fee on an order. A reason is required and the change is logged.

The rewrite goes in `server/src/customer/shipping/shipping.service.ts` (replacing the Dhaka zone logic), called from `checkout.service.ts` and `orders.service.ts`.

> Note: 20 km is larger than Shahrasti upazila itself, so it reaches neighbouring upazilas. If you want exactly the upazila boundary, we can add a polygon check later.

## 6. Bangla and English

- **Library:** `next-intl` in the storefront. **Bangla is the default with no URL prefix**, English is `/en/...`. Routes move under `app/[locale]/`. This is a mechanical move of the route groups, but it touches many files.
- **Slugs:** ASCII English only, identical in both languages (`/products/fresh-rui-fish` and `/en/products/fresh-rui-fish`). Bangla slugs become long encoded URLs that break when shared. So the answer to "do we need Bangla slugs?" is **no**: use separate `…Bn` fields.
- **API:** returns both fields (`name`, `nameBn`). The frontend mapper picks one by locale, so the cache stays shared. If `…Bn` is empty it falls back to English.
- **Formatting:** one central `lib/format.ts` replaces the ~25 inline `৳` sites and three `formatBDT` copies. It uses `bn-BD` for Bangla digits (৳ ৬,২৪৫) and `en-BD` for English.
- **Language switch:** a toggle in the header, remembered per customer in a cookie and in `User.language`.
- **Server texts:** order status labels, emails, invoice and notifications follow `User.language` or the order's language.
- **Dashboard:** `react-i18next`, **Bangla default**, English toggle. New pages are written bilingual from day one. Old pages are translated in the final phase, starting with Orders, Deliveries and Staff.
- **Admin entry:** the product and category forms get Bangla fields next to English ones. The Bangla name is required, and the English name is used for the slug. An optional "auto-fill Bangla" button (AI translate) is a later suggestion.

## 7. Maps (switchable in admin settings)

**Server module `server/src/common/maps/`**

```
interface MapProvider {
  route(origin, dest): { meters, seconds, polyline }
  reverseGeocode(lat, lng, lang): { placeName }
  search(query): Place[]            // address search
}
```

- `GoogleMapsProvider`: Routes API (Compute Routes) + Geocoding API.
- `OsmProvider`: OpenRouteService for routes, Nominatim or the ORS geocoder for place names.
- The active provider is read from the `maps` settings group, so the switch needs no redeploy.
- Cache reverse-geocode results (coordinates rounded to ~5 decimals), compute the route **once per order** and store it on the order, and add a configurable **daily request cap** to protect the bill.

**Settings → Maps tab (dashboard)**

- Provider: `Google` or `OpenStreetMap`.
- Google: a browser key (HTTP-referrer restricted, public) and a server key (secret, encrypted via `SECRET_FIELDS`).
- OSM: tile URL, routing API key (secret).
- A "Test connection" button and today's usage counter.
- `GET /customer/settings` exposes only the public values (provider, browser key, tile URL), never the server keys.

**Frontend `<MapView>`** (lazy-loaded with `next/dynamic`, so ordinary browsing never loads a map or costs anything):

- `GoogleMapView` (`@vis.gl/react-google-maps`).
- `OsmMapView` (MapLibre GL or Leaflet).
- Both support: draggable pin, accuracy circle, route polyline, shop marker.

**Navigation links are free.** Rider and admin buttons use `https://www.google.com/maps/dir/?api=1&destination=lat,lng`. This works in both provider modes and costs nothing.

**Google billing (from Google's pricing page, March 2025 model, no $200 credit any more)**

| Product | Free per month | After free (first tier) |
|---|---|---|
| Dynamic Maps (map loads) | 10,000 | $7.00 / 1,000 |
| Geocoding (place name from coordinates) | 10,000 | $5.00 / 1,000 |
| Routes: Compute Routes Essentials | 10,000 | $5.00 / 1,000 |
| Routes: Compute Route Matrix Essentials | 10,000 | $5.00 / 1,000 |
| Autocomplete (address search) | 10,000 | $2.83 / 1,000 |
| Compute Routes Pro (traffic-aware) | 5,000 | $10.00 / 1,000 |

Rough monthly estimates (mine, not Google's):

- **About 100 orders/day:** every product stays under its free 10,000 → **$0**.
- **About 500 orders/day:** about 20k map loads, 15k routes, 15k geocodes → roughly **$120/month** (about ৳14,000 at ৳120 per $).

Volume discounts start above 100k calls. These estimates assume lazy-loaded maps, cached place names and one route per order. Prices can change, so verify them in the Google Cloud console before launch. A billing account is needed to activate the APIs.

**OSM caveats:** the public tile and Nominatim servers forbid heavy use, so production needs a hosted tile provider (e.g. MapTiler or Stadia) or self-hosting. Village lanes and place names are patchier than Google's.

## 8. Customer storefront (`frontend/`)

**a. Categories and menu (screenshots 1, 3, 4)**

- New `components/layout/CategoryTree.tsx`: accordion tree with chevrons, 3 levels, and the active path highlighted in brand green. It is a left rail on desktop and a drawer on mobile.
- Update `CategorySidebar.tsx`, `CategoryNav.tsx` and `MobileMenu.tsx` to use it.
- Special links at the top: Popular, Offers, New arrivals. Footer links: Help, Contact.
- Data from a new `GET /customer/categories/tree` (cached).

**b. Smaller category cards.** `components/home/CategoryGrid.tsx` becomes compact tiles: a round or square image of about 72–96 px with a 2-line label. 4 columns on mobile (or a horizontal scroller), up to 8 on desktop. No big gradient cards.

**c. Smaller, simpler product card.** `components/product/ProductCard.tsx` (368 lines) is rewritten.

- Layout: small square image, 2-line name, unit chip taken from the product's admin-managed unit (`১ কেজি` / `500 g` / `প্যাকেট` / `পিস` …), price with the old price struck through and a small `-%` badge, and the add button.
- The add button becomes a `− qty +` stepper after the first add. Weighed items step by 0.5 kg.
- Removed: compare, rating, "sold today", brand, rank tag, second-image hover swap.
- Grid: 2 columns on mobile, 3 on tablet, 5–6 on desktop. Update `ProductGrid.tsx`, `SkeletonGrid.tsx`, `FeaturedProducts.tsx`, `BestSellingProducts.tsx`.
- Products with pack options keep the small in-card picker.

**d. Floating cart with animated total (screenshot 2)**

- New `components/cart/FloatingCart.tsx`: fixed on the right edge, middle of the screen. It shows a bag icon, "20 items" and the ৳ total in a darker footer strip. Clicking opens the existing `CartSidebar` drawer (restyled green).
- New `AnimatedNumber` component: counts from the old to the new total on each change (GSAP is already installed; respect `prefers-reduced-motion`). The widget also does a small bump when an item is added.
- On mobile it becomes a bottom bar so it doesn't cover products. Move `ScrollToTop` out of its way.
- The total comes from `CartContext.tsx` (`cartTotal`).

**e. Remove compare entirely.** Delete: `app/(home)/compare/`, `components/compare/*`, `components/skeletons/CompareSkeleton.tsx`, `lib/context/CompareContext.tsx`, `lib/hooks/use-compare.ts`, `lib/compare-rows.ts`. Edit out references in `app/layout.tsx`, `ProductCard.tsx`, `ProductSummary.tsx`, `MobileMenu.tsx`, `NavigationGate.tsx`, `lib/hooks/index.ts`, `lib/types/index.ts`. Then grep `compare`, `GitCompareArrows`, `gb_compare`.

**f. Checkout (`app/(checkout)/checkout/page.tsx`, `components/checkout/*`)**

1. Details: name, phone, address text, landmark, note.
2. **Location:** a "Share my current location" button, then a map with the pin, an accuracy circle and the place name shown live. The pin is draggable and there is an address search as a fallback. The delivery fee and distance update live in the order summary.
3. Payment and review. **Confirm stays disabled until a location exists.**

- The server re-validates the service area and recomputes the fee at `placeOrder`. It never trusts the client fee.
- New hook `useGeolocation`: high accuracy, `watchPosition` for a few seconds to get under ~50 m, then stop. It handles denied permission, timeout and non-HTTPS (geolocation needs HTTPS), with clear Bangla and English instructions.
- Saved to the DB on first share. Later orders prefill from it.

**g. Public `/share-location` page (and `/l/<token>` links)**

- A mobile-first page with one big "Share my location" button. It shows the place name and the estimated delivery fee, then confirms.
- Staff generate a link from the dashboard ("Request location") and send it by WhatsApp or Messenger. This suits phone and Facebook orders.
- Without a token it works as a public "Check my delivery charge" page.
- Backend: `POST /customer/locations/share`, `POST /customer/location-requests/:token/submit`.

**h. Saved location ("track after the browser closes")**

- Stored in `CustomerLocation`, linked to the logged-in account, or to a `deviceToken` for guests.
- Because there is no OTP, a guest's saved location is prefilled **by device token only**, not by typing a phone number. This stops someone from reading another person's location by entering their phone number.
- Admin can always see it by phone or customer.
- This remembers the **last location the customer chose to share**. It is not continuous background tracking. Browsers can't do that, and it would be a privacy problem. The page shows a consent line, and customers can delete their saved location in the account page.

**i. Phone-first auth.** Signup and login by phone and password, email optional. Keep guest checkout and the existing "claim guest orders" flow. Phone validation helper already exists (`server/src/common/utils/phone.ts`).

**j. Home and copy.** New hero banners, small category tiles, "Today's fresh", Offers. Search placeholder in Bangla ("মাছ, সবজি, ফল…"). Replace gadget copy.

## 9. Admin dashboard (`dashboard/`)

**a. Staff management — new `/staff` page**

- List, create, edit and deactivate staff. Never hard-delete, to keep history. Reset password.
- Fields: name, phone, email (optional), password, role preset, permission checkboxes, `canDeliver` toggle, active flag.
- Presets: Admin, Manager, Packer, Rider, Order taker.
- **Permissions** (strings): `orders.view`, `orders.manage`, `orders.assign`, `products.manage`, `inventory.manage`, `customers.view`, `delivery.perform`, `delivery.manage`, `reports.view`, `settings.manage`, `staff.manage`, `logs.view`. ADMIN and SUPER_ADMIN have all. Only SUPER_ADMIN can grant admin (existing rule kept).
- **"Everyone can deliver":** `delivery.perform` is independent of role. A staff member, a manager or an admin can have it, and all of them appear in the "assign to" list, including "Assign to me".
- Staff detail: activity timeline and delivery stats.

**b. Permission enforcement**

- Server: new `PermissionsGuard` and `@RequirePermissions()` decorator, replacing `@Roles(ADMIN, SUPER_ADMIN)` on the ~25 admin controllers. `jwt.strategy.ts` already loads the user on every request, so permission changes apply immediately.
- Dashboard: a `can()` helper, menu filtering in `components/layout/menu.tsx`, and a route guard next to `components/shared/AuthGuard.tsx`. Today there are no role guards.

**c. Deliveries**

- `/deliveries` board: columns Unassigned, Assigned, On the way, Delivered, Failed. Filters by date and rider. Assign, reassign and bulk assign.
- **Order detail:** map card with shop → customer route, distance and fee. "Override fee" dialog (reason required). Customer's place name. "Open navigation", call and WhatsApp buttons. "Request location" button.
- **`/my-deliveries` rider view:** mobile-first. Today's assigned orders. Buttons step through Accept → Picked up → On the way → **Delivered** (confirm the cash collected, prefilled with the due amount, optional note and photo) or **Failed** (pick a reason).
- Every press:
  - Writes a `DeliveryEvent`.
  - Writes an explicit activity-log entry (`delivery.delivered` etc., with the actor).
  - Updates the order status (existing COD-paid-on-delivery rule is reused).
  - Notifies the customer.

**d. Statistics (dashboard cards)**

- **Total deliveries done**, and **unique customers delivered to**.
- Repeat-customer %, average delivery time, pending today, COD still to collect.
- Per-rider leaderboard.
- New endpoint `GET /admin/deliveries/stats`, built on `Delivery` and `customerKey`.

**e. Activity logs.** The existing middleware already logs every request. Add explicit semantic events for delivery steps, staff changes, location shares, fee overrides and settings changes. Add a filter by staff and an activity timeline on staff and order detail pages. Logs stay append-only. Translate action labels into Bangla and English.

**f. Settings.** New tabs **Delivery** and **Maps**.

- Delivery tab: drop the **Kalibari Bazar origin pin** on a map (with satellite view), a 20 km radius circle preview, the rates, minimum order, slots, hours, and a "click the map to preview the fee" tool. The service centre can optionally be set separately from the origin.
- Maps tab: the provider switch described in §7.

**g. Catalog admin**

- Product editor: Bangla fields, **unit picker (with a "+ Add new unit" shortcut that opens the unit form)**, optional step and minimum, pack options.
- **New `/units` page** (Catalog menu): list, add, edit, reorder (drag), deactivate. Form fields: code, name (English and Bangla), short label (English and Bangla), "allow decimals" switch, default step, default minimum. Shows how many products use each unit. Needs `products.manage`.
- **Bulk daily price and stock sheet.** Fish and vegetable prices change every day, so this saves a lot of time.
- Category page becomes a nestable drag-and-drop tree (`@dnd-kit` is already installed). Brands moves out of the main menu.

**h. Other**

- Phone-order create page: add location request and map pin, with automatic fee.
- Customer detail: last shared location on a map, delivered count.
- Reports: add delivery per rider, per day, and COD reconciliation.
- Dashboard rebrand and Bangla toggle (§3, §6).

## 10. Server work (`server/src/`)

| Area | Change |
|---|---|
| `common/maps/` (new) | `MapProvider`, Google and OSM implementations, cache, daily cap |
| `customer/shipping/` | Distance-based fee (replace Dhaka zones), service-area check |
| `customer/checkout/`, `customer/orders/` | Fee and location validation, decimal quantities, delivery slot |
| `customer/locations/` (new share endpoints) | `share`, `location-requests/:token`, saved location read and delete |
| `admin/staff/` (new) | CRUD, permissions, deactivate, reset password |
| `admin/deliveries/` (new) + `customer` tracking | Assign, status steps, stats, cash handover |
| `common/guards/` | `PermissionsGuard`, `@RequirePermissions()` |
| `common/settings/settings.types.ts` | Add `delivery` and `maps` groups, update defaults |
| `common/inventory/stock.service.ts`, cart, invoice, reports | Decimal quantity support |
| `admin/category/`, `customer/categories/` | Tree API; remove `sub-category` modules |
| `admin/units/` (new) + `customer` read | Unit CRUD, reorder, deactivate (delete blocked while in use), activity-logged. Active units included in the customer product and settings data. |
| `admin/product/` | Bangla fields, `unitId`, optional step and minimum, bulk price/stock endpoint. Validates that quantity rules fit the unit (`allowDecimal`, step). |
| `common/activity/` | Explicit delivery, staff and location events |
| `prisma/seed.ts` | Grocery category tree (Bangla and English) and sample products; first admin |
| Cleanup | Remove CompareItem/PC-builder/spec code and unused models; document `REVALIDATE_SECRET` and `API_KEY` in `.env.example` |

## 11. Seed data (grocery)

Category tree with Bangla names, for example: খাদ্য → ফল ও সবজি → তাজা সবজি / তাজা ফল; মাছ; মাংস; ডিম ও দুগ্ধজাত; চাল-ডাল-তেল-মসলা; পানীয়; শিশুদের পণ্য; ব্যক্তিগত পরিচর্যা; ঘরের সামগ্রী; ওষুধ ও স্বাস্থ্য (the new logo shows a medicine capsule). Plus a **starter list of units** (admin can change or add more any time): kg / কেজি, gram / গ্রাম, litre / লিটার, ml / মি.লি., piece / পিস, dozen / ডজন, hali (4 pcs) / হালি, packet / প্যাকেট, bundle / আঁটি, bottle / বোতল, box / বক্স, can / কৌটা. Then about 30 demo products using them with steps, and a seeded SUPER_ADMIN.

## 12. Suggestions (best additions)

**Included in the phases above**

- Weight-based items with a final-weight step. The packer weighs the fish and the bill adjusts. The existing order-item editor is reused.
- Item notes ("clean and cut the fish") and a "reorder last order" button.
- Delivery time slots, minimum order amount, shop open/closed switch.
- Bulk daily price and stock sheet.
- WhatsApp order button and click-to-call in the header and footer.
- Live new-order sound for staff (`dashboard/src/hooks/useLiveOrders.ts` exists).
- Printable order slip with a QR link to the location.

**Recommended next** (not in the first release, each needs an extra service)

- SMS OTP login and order SMS (needs a Bangladesh SMS gateway; small per-SMS cost).
- Delivery OTP confirmation, so a rider can't mark an order delivered wrongly.
- Installable app (PWA) and web push notifications for riders.
- Rider live location **while on duty only**, with opt-in.
- Cash handover and settlement per rider.
- Auto-suggest the nearest rider, and batch nearby orders into one route.
- Order heat-map by area, and substitution preferences ("if out of stock…").
- AI "auto-fill Bangla" for product names.

**Risks to handle**

- If you sell **medicine** (the logo suggests so), Bangladesh requires a pharmacy/drug licence from the drug authority. Please confirm the rules before launch. We can restrict that category to OTC items or add a "prescription needed" flag.
- The origin pin must be dropped accurately once; every fee depends on it.
- Product images upload to local disk. That is fine for development; decide where they live (persistent disk or object storage) when we plan deployment.
- Geolocation requires HTTPS and can be inaccurate indoors, hence the draggable pin.
- The old migrations are stale, so we reset the baseline.
- Order numbers change prefix, so old `RZ-` numbers (if any) still need to be found by exact match.

## 13. Phases

| Phase | Scope |
|---|---|
| 0 | **Done:** plan copied to `E:\bazar-shodai\PLAN.md`, logos copied to `assets/brand/`. Nothing in git was changed. |
| 0b | Git and env (§16, §17): `git init -b main` at the root, add the remote `https://github.com/neyamat7/bazar-shodai.git`, root `.gitignore`/README/package.json, rewrite all three `.env.example` files, regenerate secrets, fix dev paths, first commit, push to `main`. |
| 1 | **Done.** Rebrand, green theme, compare and electronics-only code removed (specs, warranty, in-the-box, EMI, GraphQL, unused models), new Prisma baseline and grocery seed. Left for later phases: the SubCategory-to-tree change (Phase 3), the courier/tracking and shipping-zone fields on Order (Phases 4 and 5), and the shipping-zone setting (Phase 4). |
| 2 | **Done.** Bangla (default, no URL prefix) and English (`/en`) across the whole storefront with next-intl, self-hosted Bangla font, central formatters (Bangla digits ৳ ৬,২৪৫), server texts (emails, invoice, notifications) in both languages, API errors shown in the page language, phone-first accounts (phone + password, email optional, guest checkout kept, admin temporary password for customers without email). Left for later phases: the checkout address form is still the old division/district form and the contact form still asks for an email (both are replaced in Phase 4 with the location flow), and the dashboard stays English until Phase 6. |
| 3 | **Done.** Category tree of any depth (sub-categories moved into one tree), admin-managed Units (add, edit, reorder, switch off; delete only when unused), decimal quantities with the unit step and minimum enforced by the server, Bangla fields in the product and category forms, daily price and stock sheet, small category tiles, small product cards with a quantity stepper, animated floating cart, tree drawer with Popular / Offers / New arrivals. Left for later: the dashboard menu and screens are still English (Phase 6); the packer's final-weight screen for weighed items uses the existing order editor. |
| 4 | **Done.** Map service switchable in Settings → Maps (OpenStreetMap + OpenRouteService, or Google; keys stored encrypted, daily limit, test button), delivery charge by road distance from the Kalibari Bazar pin (Settings → Delivery: pin on a satellite map, radius circle, rates, minimum order, slots, hours, shop open switch, fee preview), service-area limit, share-my-location and drop-a-pin picker, saved location per account or device (with delete), `/share-location` and `/l/<token>` links the shop sends, 4-step checkout, order page map with route, distance and charge override (reason logged), request-location and move-pin, phone orders with a pin, last shared location on the customer page. Left for later: the dashboard is still English (Phase 6); the old saved-address form in the account page still has the division/district fields; without an OpenRouteService or Google key distances are an estimate (flagged on the order). |
| 5 | **Done.** Staff with a permissions list (Manager, Packer, Rider, Order taker presets; admins can do everything; only a super admin makes admins), checked on every staff-facing page and API call; anyone of any role can be switched to "can deliver". Staff page (add, change, deactivate, temporary password, activity timeline), delivery board (waiting, given, on the way, delivered, failed; give to a rider, move, take back, "give to me"), mobile rider screen (accept, picked up, on the way, delivered with cash taken, could not deliver with a reason), cash handover from riders, delivery statistics (total deliveries, different customers, came-back %, average time, per-rider numbers, per-day chart), rider card on the order page, rider name and phone for the customer once the parcel is with them, explicit activity-log and audit events. Left for later: the dashboard is still English (Phase 6); coupons, banners, reviews, support and newsletter pages stay admin-only. |
| 6 | Dashboard Bangla, reports, polish, tests (deployment is a later, separate job) |

## 14. Verification

- **Unit tests** (server and frontend already have Jest): fee table (0.5, 2.0, 2.01, 3.0, 3.01, 19.5, 20, 20.1), rounding edge cases, radius check, provider fallback, decimal stock, permission guard (403 without permission), unique-customer counting, unit rules (delete blocked while in use, deactivate hides it from new products, `allowDecimal=false` rejects 1.5, label change leaves old order snapshots untouched).
- **Units by hand:** in the dashboard add a new unit (e.g. বোতল), create a product with it, see it on the storefront card in both languages, order it, then rename the unit and confirm the old order still shows the old text.
- **Run:** `server` → `npm run start:dev` (port 8000, Swagger at `/docs`), `frontend` → `npm run dev`, `dashboard` → `npm run dev`. Run `npm run validate` in `frontend` and `npm run build` in `dashboard` and `server`.
- **End-to-end by hand:**
  1. Add items → floating cart total animates.
  2. Checkout → share location → place name and fee appear → Confirm enabled.
  3. A point beyond 20 km is blocked.
  4. Admin sees the pin, route and fee, overrides the fee (logged).
  5. Assign to a staff member who is also a rider.
  6. The rider marks delivered with cash collected.
  7. Dashboard counters (total deliveries, unique customers) update; activity log shows each step.
  8. Switch Maps provider Google ↔ OSM in Settings and repeat steps 2–3.
  9. Toggle Bangla/English: digits, names, slugs unchanged.
  10. Close and reopen the browser: saved location prefilled.
- Test geolocation on a real phone over HTTPS, and run a mobile Lighthouse pass.
- Grep the repo for old brand names, `RZ-`, `gb_`, `compare`, `navy` and `orange`.

## 16. Git (monorepo)

**Why a monorepo.** Almost every feature here crosses all three apps (schema → API → storefront → dashboard). One repo means one commit and one review per feature, and `PLAN.md` and the brand assets have a natural home. The three apps keep their own `package.json` and `node_modules` (no workspaces, to avoid dependency-hoisting surprises).

**Remote:** `https://github.com/neyamat7/bazar-shodai.git`. Everything goes on the **`main`** branch.

**VPS / deployment settings are out of scope for now.** No `deploy/` folder, Nginx, PM2 or `DEPLOY.md` in this work. We do that later. The one thing to remember for then: phone GPS needs HTTPS.

**Git steps (Phase 0b)**

1. `git init -b main` at `E:\bazar-shodai`.
2. Root `.gitignore`: `node_modules`, `dist`, `.next`, `.swc`, all `.env*` except `.env.example`, `uploads/`, `*.log`, `*.tsbuildinfo`, `server/test_output.txt`. (Note: `frontend/.gitignore` currently uses `.env*`, which also hides `.env.example`; add `!.env.example`.)
3. Root `package.json`: rename to `bazar-shodai`, remove the old `raizzbd` repo and bugs URLs and the husky `prepare` script. The `.husky` folders are already deleted, so also remove `prepare: husky` and the husky/lint-staged dev dependencies from each app's `package.json`. Hooks can be re-added later if wanted.
4. Root `README.md`: project summary, folder map, how to run each app, link to `PLAN.md`.
5. Before the first commit, check with `git status` that no `.env` file, key or `node_modules` is staged (the DB password and secrets must never be committed). First commit: "Initial commit: Bazar Shodai base (from existing codebase)".
6. `git remote add origin https://github.com/neyamat7/bazar-shodai.git`, then `git push -u origin main`. If the GitHub repo is not empty (for example it has a README), I stop and ask you before touching it. I will not force-push.
7. From then on, finished work is committed and pushed to `main`, one commit per step, as you asked.

## 17. Environment files

**Findings from the current files** (values not shown; secrets checked by length only)

- Secrets are long (64 and 48 characters). I can't tell if they were copied from the old project, and it costs nothing to replace them on a fresh database. **Regenerate all of them.**
- `UPLOAD_DIR=/var/data/uploads` is a Linux path and will not work on your Windows machine. Use `./uploads` in dev.
- `UPLOADS_PUBLIC_URL=https://api.example.com` makes every uploaded image URL point to a site that doesn't exist. Use `http://localhost:8000` in dev.
- `API_KEY` is empty and its guard is not used. `NEXT_PUBLIC_USE_MOCK_API` is not read by any code. Remove both.
- `REVALIDATE_SECRET` is used by the server but missing from `server/.env.example`. Add it. It must be the **same value** in the server and the storefront.
- `MAIL_FROM` is already "Bazar-Shodai". Change the placeholder domain once you have one.
- Neon's pooled connection can break `prisma migrate`. Add an optional `DATABASE_URL_DIRECT`, used by `prisma.config.ts` for migrations and falling back to `DATABASE_URL`.

**Secrets.** I generate fresh random values with Node (`crypto.randomBytes(48).toString('hex')`) and write them straight into the real, git-ignored `.env` files. I don't print them in chat. All of these must differ from each other: `JWT_SECRET`, `JWT_SECRET_REFRESH`, `SETTINGS_ENCRYPTION_KEY`, `ADMIN_SEED_SECRET`, `REVALIDATE_SECRET`. Changing `SETTINGS_ENCRYPTION_KEY` later forces re-entering stored SMTP/API secrets, which is fine now.

**`server/.env` and `server/.env.example`**

The "Production" column is only a reminder for later. We set only the **dev** values now.

| Variable | Dev value | Production (later) | Notes |
|---|---|---|---|
| `NODE_ENV` | `development` | `production` | |
| `PORT`, `API_PREFIX` | `8000`, `api` | same | |
| `TRUST_PROXY` | `1` | `1` | Number of proxies in front |
| `TZ` | `Asia/Dhaka` | `Asia/Dhaka` | **New.** Order numbers and reports use Bangladesh days |
| `DATABASE_URL` | new Neon URL | Neon or local Postgres | Rotate the Neon password (it was shown in this session) |
| `DATABASE_URL_DIRECT` | optional | optional | **New.** Non-pooled URL for migrations |
| `JWT_SECRET`, `JWT_SECRET_REFRESH`, `JWT_EXPIRES_IN` | fresh random, `1d` | fresh random | |
| `SETTINGS_ENCRYPTION_KEY` | fresh random | fresh random | |
| `ADMIN_SEED_SECRET` | fresh random | fresh random | Remove after first admin exists |
| `REVALIDATE_SECRET` | fresh random | same as storefront | **Added** to the example file |
| `CORS_ORIGINS`, `FRONTEND_URL`, `ADMIN_URL` | localhost 3000 / 5173 | `https://bazarshodai.com`, `https://admin.bazarshodai.com` | No trailing slash |
| `RESET_PASSWORD_PATH`, `ADMIN_RESET_PASSWORD_PATH`, `PASSWORD_RESET_TTL_MINUTES` | unchanged | unchanged | |
| `MAIL_HOST/PORT/SECURE/USER/PASS`, `MAIL_FROM` | blank, `"Bazar Shodai <no-reply@yourdomain>"` | real SMTP | Also editable in Settings → Email |
| `UPLOAD_DIR` | `./uploads` | `/var/www/bazar-shodai/uploads` | Fix |
| `UPLOADS_PUBLIC_URL` | `http://localhost:8000` | `https://api.bazarshodai.com` | Fix |
| `UPLOAD_CLEANUP_INTERVAL_MS`, `UPLOAD_UNATTACHED_TTL_MS` | defaults | defaults | |
| `THROTTLE_TTL`, `THROTTLE_LIMIT` | `60`, `60` | same | |
| `SWAGGER_ENABLED`, `GRAPHQL_*` | `true` in dev | `false` | |
| `ACTIVITY_LOG_*` | `365` / `30` / `false` | same | |
| `SEED_SUPERADMIN_NAME`, `_PHONE`, `_EMAIL` (optional), `_PASSWORD` | yours | yours | **New.** Used only by `prisma db seed` to create the first Super Admin. Remove after seeding. |
| `LOCATION_LINK_TTL_HOURS` | `24` | `24` | **New.** Lifetime of "share your location" links |
| `MAPS_PROVIDER` | `osm` | `osm` or `google` | **New.** Starting value only. After first start, the dashboard setting wins |
| `GOOGLE_MAPS_SERVER_KEY`, `GOOGLE_MAPS_BROWSER_KEY` | blank | blank | **New**, optional. Normally entered in Dashboard → Settings → Maps and stored encrypted. Env is only a starting fallback |
| `ORS_API_KEY`, `OSM_TILE_URL`, `OSM_CONTACT_EMAIL` | blank | set | **New**, optional. OpenRouteService key, tile server URL, and a contact email Nominatim requires in its User-Agent |
| `SMS_PROVIDER`, `SMS_API_KEY`, `SMS_SENDER_ID` | commented out | commented out | **New**, placeholders for later SMS OTP |
| `DISCOUNT_SCHEDULER_INTERVAL_MS`, `BACK_IN_STOCK_INTERVAL_MS` | commented out | commented out | |
| ~~`API_KEY`~~ | remove | remove | Unused |

Delivery rates, the Kalibari Bazar origin and the radius are **not** in env. They are dashboard settings, so there is one source of truth and no redeploy to change them.

**`frontend/.env.local` and `.env.example`**

| Variable | Dev | Production |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api` | `https://api.bazarshodai.com/api` |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | `https://bazarshodai.com`. **New.** Canonical URL for metadata, sitemap, Open Graph and location-share links |
| `REVALIDATE_SECRET` | same as server | same as server |
| ~~`NEXT_PUBLIC_USE_MOCK_API`~~ | remove | remove |

**`dashboard/.env` and `.env.example`**

| Variable | Dev | Production |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000/api` | `https://api.bazarshodai.com/api` |
| `VITE_PUBLIC_SITE_URL` | `http://localhost:3000` | `https://bazarshodai.com` |

Map keys reach the browsers through `GET /customer/settings` from the Maps tab. So the storefront and dashboard need **no** Google or OSM variables.

**Other server cleanup (recommended in Phase 1):** remove the legacy GraphQL layer (only `auth.resolver`, `ping.resolver` and one activity resolver use it), with `@nestjs/graphql`, `@nestjs/apollo`, `@apollo/server`, `apollo-server-core`, `@as-integrations/express5`, and the stray `jwt-service`, `config` and `@types/joi` packages. This also drops the three `GRAPHQL_*` variables.

**Verification for this step:** start the server and confirm it boots with the new `.env` (`npm run start:dev`, then `GET /api/ping`). Confirm `git status` shows no `.env` files. Confirm `NEXT_PUBLIC_API_URL` and `VITE_API_URL` reach the API. Confirm an uploaded image URL opens at `http://localhost:8000/uploads/...`.

## 15. Critical files

- Server: `prisma/schema.prisma`, `src/common/settings/settings.types.ts`, `src/customer/shipping/shipping.service.ts`, `src/customer/checkout/checkout.service.ts`, `src/customer/orders/orders.service.ts`, `src/common/inventory/stock.service.ts`, `src/common/guards/`, `src/main.ts`.
- Storefront: `app/globals.css`, `app/layout.tsx`, `components/product/ProductCard.tsx`, `components/layout/CategorySidebar.tsx`, `components/home/CategoryGrid.tsx`, `components/cart/CartSidebar.tsx`, `lib/context/CartContext.tsx`, `app/(checkout)/checkout/page.tsx`, `lib/api/client.ts`, `lib/services/site.service.ts`.
- Dashboard: `src/index.css`, `src/router.tsx`, `src/components/layout/menu.tsx`, `src/components/layout/Sidebar.tsx`, `src/pages/settings/Settings.tsx`, `src/pages/orders/OrderDetail.tsx`, `src/pages/dashboard/Dashboard.tsx`, `src/api/client.ts`.

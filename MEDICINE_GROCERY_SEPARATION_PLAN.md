# Implementation Plan: Medicine & Grocery Separation + Medicine Details Modal

## 1. Overview

Bazar Shodai sells groceries (vegetables, fish, meat, dairy, household) **and** medicines. The two must feel like separate shops:

- **All Products page (`/products`)** currently shows medicines, the "Medicine" category, and pharma brands.
- **Home page** currently shows medicines in Featured / Best Selling sections and in the category grid.
- **Medicine page (`/category/medicine`)** currently shows grocery categories (vegetables, meat…) in its filter.
- **Clicking a medicine name** currently opens the full product page. For medicines it should open a **details modal** instead.

---

## 2. Final Target Behavior

| Place | Medicines shown? | Notes |
| :--- | :--- | :--- |
| **Header / navigation menu** | ✅ Yes | "Medicine" menu stays exactly as it is today. |
| **Home page – product sections** (Featured, Best Selling, hero spotlight) | ❌ No | Grocery products only. |
| **Home page – category grid** | ❌ No | Medicine tile removed from the home grid only (menu keeps it). |
| **All Products (`/products`)** | ❌ No | No medicine products, no "Medicine" category, no pharma brands, no generics filter. |
| **Search (`/search`)** | ✅ Both | Groceries and medicines together (no change). |
| **Brand pages (`/brand/...`)** | ✅ Both | No change. |
| **Medicine page (`/category/medicine`)** | ✅ Only medicines | Filters: **medicine subcategories**, Brand, Generic name, Price, Stock. **No grocery categories.** |
| **Product details page (`/products/[slug]`)** | ✅ Still works | Kept for all products incl. medicines (search results, cart, wishlist, orders, Google links). |

### Click behavior

| Where | Grocery product | Medicine |
| :--- | :--- | :--- |
| Medicine page – list view | — | **Opens Medicine Details Modal** |
| Medicine page – grid view | — | **Opens Medicine Details Modal** |
| Everywhere else | Full details page | Full details page (fallback) |

---

## 3. Implementation Steps

### Phase 1: Server – medicine scoping

1. **DTO** – [`product-query.dto.ts`](file:///e:/bazar-shodai/server/src/customer/products/dto/product-query.dto.ts)
   - Add `excludeMedicine?: boolean` to `ProductScopeDto` (inherited by `ProductQueryDto`).
   - Use `@Transform(toBool)` + `@IsBoolean()` (existing `toBool` already parses `"false"` correctly).

2. **Shared "is medicine" rule** – [`product-filters.ts`](file:///e:/bazar-shodai/server/src/customer/products/product-filters.ts)
   - A product is a medicine if it **has `medicineMeta`** **or** sits anywhere in the **`medicine` category tree**.
   - Add helper `notMedicine(): Prisma.ProductWhereInput` →
     `{ medicineMeta: { is: null }, NOT: inCategories(['medicine']) }`.
   - In `buildScopeWhere`: when `excludeMedicine === true`, push `notMedicine()` into `AND`.
   - When `excludeMedicine === true` and `category` / `subCategory` points into the medicine tree (e.g. `/products?category=medicine`), the medicine rule still wins → empty result instead of leaking medicines.

3. **Filter facets** – [`products.service.ts`](file:///e:/bazar-shodai/server/src/customer/products/products.service.ts) `getFilters`
   - Add `excludeMedicine` to the cache key (otherwise cached brand lists leak between pages).
   - Brands/generics are then computed only from non-medicine products → no pharma brands, no generics.

4. **Home page data** – `home()` in [`products.service.ts`](file:///e:/bazar-shodai/server/src/customer/products/products.service.ts#L552-L587)
   - **Featured:** add `notMedicine()` to the `where`.
   - **New arrivals / Best sellers:** pass the medicine exclusion into `section(...)` and include it in their cache keys (so the standalone section endpoints are not affected).
   - **On sale (raw SQL):** add `AND NOT EXISTS (SELECT 1 FROM "MedicineMeta" m WHERE m."productId" = p.id)` and exclude the medicine category tree (recursive CTE, same pattern already used there). Add a flag to its cache key.
   - **Home categories:** leave out the `medicine` category.
   - Rename the cache key `products:home` → `products:home:v2` so old cached data (with medicines) is not served after deploy.

5. **No change** to search (`/search`), suggestions, or brand page queries – they keep showing both.

---

### Phase 2: Frontend services

1. [`products.service.ts`](file:///e:/bazar-shodai/frontend/lib/services/products.service.ts)
   - Add `excludeMedicine?: boolean` to `ProductQuery` and the facets scope; send it as a query param.

2. [`categories.service.ts`](file:///e:/bazar-shodai/frontend/lib/services/categories.service.ts)
   - **Keep `getShopCategories()` default behavior unchanged** (medicine included and first) – it powers the header menu in [(home)/layout.tsx](file:///e:/bazar-shodai/frontend/app/%5Blocale%5D/%28home%29/layout.tsx#L31) and [(account)/layout.tsx](file:///e:/bazar-shodai/frontend/app/%5Blocale%5D/%28account%29/layout.tsx#L30).
   - Add an opt-in option: `getShopCategories(locale, { excludeMedicine: true })` for pages that must hide it.

---

### Phase 3: Home page

- File: [`(landing)/page.tsx`](file:///e:/bazar-shodai/frontend/app/%5Blocale%5D/%28home%29/%28landing%29/page.tsx)
  - Use `getShopCategories(locale, { excludeMedicine: true })` for `HeroSection` and `CategoryGrid`.
  - Featured / Best Selling already come from `/customer/home`, which is medicine-free after Phase 1.
- Header menu is untouched → **Medicine menu still visible**.

---

### Phase 4: All Products page (`/products`)

1. [`products/page.tsx`](file:///e:/bazar-shodai/frontend/app/%5Blocale%5D/%28home%29/products/page.tsx)
   - `listProducts({ ..., excludeMedicine: true })`
   - `getProductFacets({ ..., excludeMedicine: true })`
   - `getShopCategories(locale, { excludeMedicine: true })`
   - Pass `excludeMedicine` prop to `<ProductGrid />`.

2. [`ProductGrid.tsx`](file:///e:/bazar-shodai/frontend/components/product/ProductGrid.tsx)
   - New prop `excludeMedicine?: boolean`, added into the `query` object.
   - **Important:** this makes every browser-side request (filter change, sort, price, multi-category merge, infinite scroll / `loadMore`) also exclude medicines – not only the first server load.

3. **Fix existing list-view bug:** list view currently renders every product with `MedicineListItem` (Rx/OTC badges on vegetables).
   - Use `MedicineListItem` only when the product is a medicine; otherwise use a normal row/card.

---

### Phase 5: Medicine page (`/category/medicine`) & filter sidebar

1. [`category/[slug]/page.tsx`](file:///e:/bazar-shodai/frontend/app/%5Blocale%5D/%28home%29/category/%5Bslug%5D/page.tsx)
   - For `slug === "medicine"`: pass **only the medicine category (with its subcategories)** to `<ProductGrid />` instead of every shop category.
   - Product query stays `category: "medicine"` (already limits results to the medicine tree).

2. [`FilterSidebar.tsx`](file:///e:/bazar-shodai/frontend/components/product/FilterSidebar.tsx)
   - On the medicine page, the Category section lists **medicine subcategories** (e.g. Tablet, Syrup, Injection…) as tickable options, instead of top-level grocery categories.
   - If the medicine category has **no subcategories**, the Category section is hidden.
   - Brand (pharma companies), Generic name (জেনেরিক নাম), Price and Stock remain.

---

### Phase 6: Medicine Details Modal

1. **New component** – `frontend/components/medicine/MedicineDetailModal.tsx`
   - Overlay with backdrop blur, open/close animation, ESC + click-outside to close, focus trap, body scroll lock, mobile bottom-sheet layout.
   - Shows:
     - Photo (if admin uploaded) or dosage-form icon fallback.
     - Brand name, strength, dosage form badge.
     - Generic name (click → filters the list by that generic and closes modal).
     - Manufacturer.
     - Rx (prescription required) / OTC badge.
     - Price per unit / strip (পাতা) / box (বাক্স), pack size info.
     - Quantity stepper + Add to cart, Wishlist toggle.
   - Uses only data already loaded in the list (`product.medicineMeta`) → opens instantly, no extra request.

2. **Wire it up on the medicine page**
   - [`MedicineListItem.tsx`](file:///e:/bazar-shodai/frontend/components/medicine/MedicineListItem.tsx#L201-L206): replace the `<Link href="/products/[slug]">` on the name (and image) with a button that opens the modal. Remove the now-unneeded route prefetch.
   - **Grid view** on the medicine page: clicking a card also opens the modal (ProductCard gets an optional `onOpen` handler used only on the medicine page).
   - All other pages keep linking to `/products/[slug]`.

---

### Phase 7: Medicine Visuals (Dosage Icons)

- Photos are **skipped for now**.
- Medicines rely on the high-clarity dosage-form icon system (Tablet, Syrup, Injection, Cream, Drops) with distinct colors and badges across the list, grid, and detail modal.
- No new image upload features will be built.

---

### Phase 8: Verification

1. `npx tsc --noEmit` in `server` and `frontend`; `npm run build` in `frontend`.
2. **Home:** no medicine in Featured / Best Selling / hero spotlight / category grid; **Medicine menu still in header**.
3. **`/products`:** no medicines on first load **and** after changing filters, sorting, and scrolling; no "Medicine" category; no pharma brands; no generics filter; `?category=medicine` returns nothing.
4. **`/search` and `/brand/...`:** still show both groceries and medicines.
5. **`/category/medicine`:** category filter shows only medicine subcategories; Brand + Generic filters work; clicking a medicine (list and grid) opens the modal; add to cart from modal works.
6. **`/products/[medicine-slug]`** still opens directly (from search/cart/wishlist).

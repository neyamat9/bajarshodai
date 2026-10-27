# Implementation Plan: Medicine & Grocery Product Separation

## 1. Overview & Objectives

Bazar Shodai operates both a general grocery store (fresh produce, vegetables, meat, dairy, household items) and a specialized pharmacy store. Currently:
- **All Products Page (`/products`)** inadvertently includes pharmaceutical medicine products, lists the "Medicine" category in the category filter, and lists pharmaceutical brands in the brand filter.
- **Medicine Page (`/category/medicine`)** shows grocery categories (vegetables, meat, etc.) in the filter sidebar instead of focusing strictly on medicine-relevant filters (**Brand / Pharma Manufacturer** and **Generic Molecule / জেনেরিক নাম**).

This plan isolates the two shopping experiences completely.

---

## 2. Target Behavior

| Page | Product Listing | Category Filter | Brand Filter | Generics Filter |
| :--- | :--- | :--- | :--- | :--- |
| **All Products (`/products`)** | Grocery & general products only. **Zero medicines.** | Grocery categories only. **No "Medicine" category.** | Grocery/consumer brands only. **No pharma brands.** | **Hidden** (not applicable). |
| **Medicine (`/category/medicine`)** | Medicine products only. | **Hidden** (or medicine-only subcategories). No grocery categories. | Pharmaceutical manufacturers/brands only. | **Visible & active** (Filter by generic name). |

---

## 3. Step-by-Step Implementation Plan

### Phase 1: Server-Side API & Query Scoping
1. **Update Product Query DTOs**
   - File: `server/src/customer/products/dto/product-query.dto.ts`
   - Add optional field `isMedicine?: boolean` to `ProductScopeDto` and `ProductQueryDto`.
   - Decorate with `@ApiPropertyOptional()` and `@Transform(toBool)`.

2. **Update Filter Where Clauses**
   - File: `server/src/customer/products/product-filters.ts`
   - In `buildScopeWhere(q: ProductScopeDto)`:
     - When `q.isMedicine === false`:
       - Add condition: `medicineMeta: null`.
       - Exclude `category: { slug: 'medicine' }` and parent category trees belonging to `'medicine'`.
     - When `q.isMedicine === true`:
       - Add condition: `{ OR: [{ medicineMeta: { isNot: null } }, inCategories(['medicine'])] }`.

3. **Update Facets & Aggregations**
   - File: `server/src/customer/products/products.service.ts`
   - In `getFilters(scope: ProductScopeDto)`:
     - Include `scope.isMedicine` in cache key: `products:filters:${JSON.stringify([...])}`.
   - When `isMedicine: false` is passed:
     - The product `where` clause excludes medicines.
     - `brandGroups` aggregation on `Product` will naturally only include brands attached to non-medicine products.
     - `genericGroups` will return 0 rows (so generic filter is omitted for general products).

---

### Phase 2: Frontend Data Services & Types
1. **Update Product Service**
   - File: `frontend/lib/services/products.service.ts`
   - Add `isMedicine?: boolean` to `ProductQuery` and `ProductScope`.
   - Forward `isMedicine` query parameter in `listProducts` and `getProductFacets`.

2. **Update Category Service**
   - File: `frontend/lib/services/categories.service.ts`
   - Update `getShopCategories`:
     - Add optional argument `options?: { includeMedicine?: boolean }` (defaulting to `false` when fetching shop categories for grocery pages).
     - Filter out `c.slug === 'medicine'` when `includeMedicine === false`.

---

### Phase 3: All Products Page (`/products`)
1. **Update Server Component & Querying**
   - File: `frontend/app/[locale]/(home)/products/page.tsx`
   - Pass `isMedicine: false` to `listProducts(...)`.
   - Pass `isMedicine: false` to `getProductFacets(...)`.
   - Call `getShopCategories(locale, { includeMedicine: false })` so the "Medicine" category is never rendered in the category filter sidebar.

2. **Result for `/products`**:
   - Product list contains only grocery and household products.
   - Category filter only displays grocery categories.
   - Brand filter only displays grocery brands.

---

### Phase 4: Medicine Page (`/category/medicine`) & Sidebar Filter
1. **Update Category Page Logic**
   - File: `frontend/app/[locale]/(home)/category/[slug]/page.tsx`
   - For `slug === "medicine"`:
     - Pass an empty list (or only medicine subcategories) for `categories` to `<ProductGrid />` instead of all shop grocery categories.
     - Pass `isMedicine: true` implicitly (via `category: "medicine"`).

2. **Refine Filter Sidebar for Medicine**
   - File: `frontend/components/product/FilterSidebar.tsx`
   - If `categories.length === 0` or if locked to `"medicine"`, suppress the general Category accordion section.
   - Prominently display:
     - **Price Range**
     - **Brand** (Pharma companies: Beximco, Square, Incepta, etc.)
     - **Generic Name (জেনেরিক নাম)**
     - Stock / Availability

---

### Phase 5: Verification & Quality Assurance
1. **Type Checking:** Run `npx tsc --noEmit` on both backend (`server`) and frontend (`frontend`).
2. **All Products Verification (`/products`):**
   - Inspect loaded products: confirm 0 medicine items.
   - Inspect Category filter: confirm "Medicine" is absent.
   - Inspect Brand filter: confirm pharma brands are absent.
3. **Medicine Page Verification (`/category/medicine`):**
   - Inspect filter sidebar: confirm Vegetables, Meat, Dairy, etc. are absent.
   - Confirm Brand and Generic Name filters function seamlessly.

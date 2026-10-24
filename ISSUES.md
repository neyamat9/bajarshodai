# Bazar Shodai — Audit Report (2026-10-24)

Scope: `server` (NestJS), `frontend` (storefront), `dashboard` (admin).
Method: code review + `jest` (82 unit tests pass) + builds + `npm audit`.
Severity: 🔴 Critical · 🟠 High · 🟡 Medium · ⚪ Low · ✅ Fixed

> Honest note: this is a code-level audit. I did not click through every
> screen in a live browser, so UI-only bugs may still exist. Items marked
> "verify" need a quick manual check.

---

## A. Backend

### Security / Auth
1. 🔴 No phone verification (OTP). Anyone can register or order with any phone number.
2. 🔴 Password reset is email-only, but accounts are phone-first → most customers cannot self-reset.
3. 🟠 `POST /customer/auth/register` has no `@Throttle` → account spam.
4. 🟠 `POST /customer/auth/refresh` has no throttle and trusts `userId` from the request body.
5. 🟠 Guest order tracking/invoice is protected only by order number + phone. Order numbers are sequential (`BS-YYYYMMDD-NNNN`) → guessable; invoice exposes address/phone. Limit is 30/min/IP only.
6. 🟠 Register returns raw error text (`Failed to register user: …`) → information leak.
7. 🟡 Duplicate phone race returns 500 instead of 409.
8. 🟡 Login returns early for unknown users (no argon2 run) → timing user enumeration.
9. 🟡 One refresh-token hash per user → logging in on a second device logs out the first.
10. 🟡 Helmet CSP hard-codes `http://localhost:8000`; `scriptSrc` uses `'unsafe-inline'` with a malformed `https: 'unsafe-inline'` string. Needs a production config.
11. 🟡 Swagger `/docs` is enabled by default — disable or protect in production.
12. 🟡 Some `@Param('id')` routes lack `ParseUUIDPipe` (e.g. customer `cancelOrder`/`findById`) → bad id can give 500.
13. 🟡 Several admin controllers use `RolesGuard` instead of `PermissionsGuard` (support-tickets, reviews, newsletter, flash-deals, admin-storefront). Manager/Packer/Rider permission presets do not apply to them.
14. 🟠 `server/.env` contains real Neon password and JWT secrets. Rotate before launch; never share the file.
15. ⚪ Admin accounts have no 2FA; no account lockout after repeated failed logins (only IP throttling).

### Orders / Payments / Inventory
16. 🟠 No idempotency key in `placeOrder` → double-click or retry can create duplicate orders (untracked/fresh items have no stock guard).
17. 🟠 bKash/Nagad transaction-ID uniqueness is checked outside the DB transaction and has no unique constraint → same TrxID can be used on two orders.
18. 🟠 Payments are manual (customer types a TrxID). Nothing verifies it with bKash/Nagad → fraud risk.
19. 🟠 `updatePackerWeights` (`order-edit.service.ts` ~L539) decrements `product.stock` directly: skips `StockService` (no stock log, no negative guard), ignores variants (parent stock desyncs from variant sum), ignores `trackStock`.
20. 🟡 Phone-order screen forces whole-number quantities (`Math.floor`) → cannot add 0.5 / 1.5 kg. Verify server DTO for admin order lines (`IsInt`?).
21. 🟡 Untracked products use a fake `availableStock = 9999` in checkout quote and storefront. Works, but cosmetic hack — send an explicit `trackStock` flag instead.
22. 🟡 Variant pickers in dashboard (`OrderCreate.tsx` ~L561, `EditItemsDialog.tsx` ~L109) still block variants with `stock <= 0` even if the product is untracked.
23. 🟡 Verify coupon `usageCount`/`CouponUsage` are released when an order is cancelled (only `firstOrderOnly` ignores cancelled orders). Per-user limit check is not race-safe (small).
24. 🟡 Reports / CSV export: untracked products show `stock 0`; CSV cells are not guarded against formula injection (`=`, `+`, `-`, `@`).
25. ✅ Fixed in this session: `StockService.change()` now no-ops for untracked products (cancel/return/edit/admin-adjust no longer create phantom stock). *(It was a regression from the Daily Fresh feature.)*
26. ✅ Fixed in this session: `OrderCreate.tsx` allows adding untracked products without a stock check. *(Same regression.)*

### Infra / Quality
27. 🔴 Test coverage gap: no tests for orders, cart, checkout, stock, returns/refunds, coupons, loyalty, auth — the most money-critical code.
28. 🟠 `npm audit` reports vulnerabilities in `server` and `frontend` production deps — run `npm audit` and upgrade.
29. 🟠 Images saved on local disk (PLAN §12 risk) → lost on redeploy, no CDN. Use S3/R2/Cloudinary.
30. 🟡 Prisma migrations hang on pooled Neon URL; a `DATABASE_URL_DIRECT` is needed in every environment (document it in `.env.example`).
31. 🟡 No health/readiness endpoint for DB; `ping` only. No Sentry/log aggregation, no DB backup/restore plan.
32. 🟡 Verify cron/cleanup jobs (expired guest carts, old uploads, stale location requests).
33. ⚪ Verify DB indexes on high-traffic filters (`Order.status/createdAt/userId/guestPhone`, `Product.categoryId/isActive`).

---

## B. Public Frontend (`frontend`)

34. 🟠 Guest checkout depends on unverified phone (see #1) — spam/fake orders reach the packer queue.
35. 🟡 No PWA / offline / push — rural users on weak networks reload everything (PLAN §12).
36. 🟡 `inStock` badge/filter, "Limited stock", and back-in-stock UI must treat untracked (Daily Fresh) products as always available — verify on listing, search, wishlist and cart pages.
37. 🟡 Geolocation requires HTTPS — location share will silently fail on plain HTTP hosting.
38. 🟡 Catalog cache (`revalidate 300`) can show stale price/availability for fresh items; verify `FreshnessWatcher` triggers.
39. 🟡 Verify `messages/en.json` and `bn.json` have identical keys (missing key → runtime error/blank text). Add a CI key-parity script.
40. 🟡 Account password-reset page only supports email (see #2).
41. ⚪ Verify accessibility basics (focus trap in AuthModal, alt text, color contrast on badges) and custom 404/error pages in both locales.
42. ⚪ Run `next build` + `eslint` in CI; `tsc --noEmit` takes ~2 min.

---

## C. Dashboard (`dashboard`)

43. 🟡 Main JS bundle ≈ 1 MB — add route-level code-splitting (`React.lazy`).
44. 🟡 Bangla translation gaps still listed in PLAN Phase 6: catalog pages, coupons, reviews, support, inventory, product editor, audit log, some settings. Verify which remain English.
45. 🟡 Route guards use permissions in UI only; backend `RolesGuard` controllers (#13) mean a Packer could reach some endpoints directly. Align both.
46. 🟡 Phone-order whole-number quantity (#20) and variant block (#22).
47. ⚪ No unsaved-changes warning in product editor / settings forms (verify).
48. ⚪ No dashboard error boundary per page (verify) — one failing widget may blank the screen.

---

## D. Missing features — suggestions for an upazila "Chaldal-style" service

Priority = impact for a small-town delivery business.

### Must-have before launch
1. **SMS OTP** (phone verification + phone-based password reset) — SSL Wireless / BulkSMSBD / Greenweb.
2. **Order SMS**: placed / packed / out-for-delivery / delivered. Many customers don't open apps.
3. **Delivery OTP / hand-over code** to stop "rider says delivered" disputes.
4. **bKash/Nagad API verification** (or Payment Gateway like SSLCommerz/aamarPay) instead of manual TrxID.
5. **COD safeguards**: block/flag numbers with repeated cancels or refused deliveries; optional advance for large orders.
6. **Object storage + CDN** for images, **daily DB backup**, **Sentry** error tracking.
7. **Tests** for order/stock/payment/refund flows.

### High value
8. **Delivery slot capacity + cut-off times** (e.g. "order before 10 AM for noon delivery"), max orders per slot.
9. **Substitution preference** per order ("replace if out of stock / skip / call me").
10. **"Available today" morning sheet** for Daily Fresh items: admin sets today's price/availability in one screen; storefront shows "Fresh today ✓".
11. **Weighed-item handling**: show "approx weight, final price after packing", tolerance (±10%), customer notified of final bill.
12. **Rider app / page**: live location (opt-in), tap-to-call, navigate button, cash-collected tracking, daily cash settlement.
13. **Auto-suggest / batch rider assignment** by area (union/village clusters).
14. **Area-wise delivery fee & min-order** per union/village (partly exists via locations) with free-delivery progress bar.
15. **Reorder / "My monthly bazar" list** — one-tap repeat of last order; saved lists.
16. **WhatsApp/Messenger order button** and a **phone-order mode** (already have admin phone order; add caller-ID lookup of customer + address).

### Growth
17. **Referral & loyalty** (points exist — add referral code, village leaderboard).
18. **Back-in-stock / price-drop SMS** (back-in-stock exists; add SMS channel).
19. **Wholesale / bulk pricing** for restaurants, hostels, events.
20. **Subscription deliveries** (daily milk/egg/bread).
21. **Purchase & profit tracking**: buying price per batch (arot purchase), wastage log for perishables, daily profit report.
22. **Price-change history** and **low-stock/purchase-order list** for the buyer.
23. **Customer app wrapper** (PWA install prompt, push) — fits Android-heavy market.
24. **Multi-language voice/search** — Bangla + Banglish search ("alu", "peyaj" → আলু, পেঁয়াজ), image-first browsing.
25. **Festival/Ramadan bundles**, "Eid bazar" combo packs.
26. **Admin 2FA**, staff activity alerts, and data-retention / privacy policy page.
27. **Medicine/regulated items** flag (licence requirement per PLAN §12).
28. **Complaint/refund by photo** (damaged item) with one-tap resolution (partial refund/credit to wallet).
29. **Customer wallet / store credit** for refunds — avoids manual bKash refunds.
30. **Offline-tolerant phone-order screen** for poor network at the shop.

---

## Suggested fix order
1. #1/#2 OTP + phone reset → #3/#4/#6 auth hardening
2. #16/#17/#19 order idempotency, TrxID race, packer-weight stock
3. #13/#45 permission guards consistency
4. #27 tests for orders/stock/refunds
5. #28/#29/#14 npm audit, image storage, secret rotation

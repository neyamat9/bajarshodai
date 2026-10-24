# Bazar Shodai — Implementation Plan & Roadmap

This document outlines the agreed implementation plan based on the audit in [ISSUES.md](file:///e:/bazar-shodai/ISSUES.md) and user decisions. Each section will be updated point-by-point as decisions are made, and then executed systematically.

---

## Progress Overview

| Issue # | Area | Status | User Decision / Summary |
|---|---|---|---|
| **1** | Phone OTP | ✅ Planned | **Do NOT implement OTP.** Keep phone-first registration & order without SMS OTP. |
| **2** | Password Reset | ✅ Planned | **Email-based self-reset if email exists; Admin-assisted request flow if phone-only.** |
| **3** | Register Rate Limit | ✅ Planned | Add `@Throttle({ medium: { ttl: 60000, limit: 5 } })` to block automated spam accounts. |
| **4** | Refresh Token Security | ✅ Planned | Add throttle limit & decode/verify `userId` directly from JWT refreshToken. |
| **5** | Guest Order Tracking & Invoice | ✅ Planned | Unguessable order numbers (random suffix) + strict tracking rate limiting. |
| **6** | Register Error Information Leak | ✅ Planned | Clean user messages; prevent leaking raw Prisma/DB error traces. |
| **7** | Duplicate Phone Race (500 vs 409) | ✅ Planned | Catch `P2002` Prisma unique constraint and return clean HTTP 409 Conflict. |
| **8** | Timing User Enumeration Fix | ✅ Planned | Run constant-time dummy argon2 verify for non-existent users. |
| **9** | Multi-Device Login Sessions | ✅ Planned | Support multiple active sessions/devices instead of single overwritten hash. |
| **10** | Helmet CSP & Production Headers | ✅ Planned | Clean valid CSP directives; remove hard-coded localhost; support production domains. |
| **11** | Swagger Production Protection | ✅ Planned | Disable or protect `/docs` in production environment by default. |
| **12** | Missing `ParseUUIDPipe` on ID routes | ✅ Planned | Enforce `ParseUUIDPipe` across all entity `@Param('id')` routes to prevent DB 500s. |
| **13** | Admin Controller PermissionsGuard Consistency | ✅ Planned | Migrate all admin controllers from `RolesGuard` to `PermissionsGuard` & `@RequirePermissions`. |
| **14** | Production Secrets Rotation | ✅ Planned | Pre-launch checklist to rotate Neon DB password and generate 64-char JWT secrets. |
| **15** | Admin 2FA via Email OTP & Lockout | ✅ Planned | 2-step verification for admin dashboard using 6-digit Email OTP + 5-attempt lockout. |
| **16** | Order Idempotency (Double-Click Guard) | ✅ Planned | Frontend button debounce + backend idempotency window to prevent duplicate orders. |
| **17** | bKash/Nagad Duplicate TrxID Validation | ✅ Planned | Validate TrxID inside DB transaction (if provided) to prevent duplicate usage. |
| **18** | Manual bKash/Nagad Payment Workflow | ✅ Planned | Admin sets receiver number; customer provides sender number/last 4 digits; TrxID optional; manual admin check. |
| **19** | Packer Final Weights Stock Sync | ✅ Planned | Route weight adjustments through `StockService.change()` respecting `trackStock` & variants. |
| **20** | Decimal Quantities in Phone-Order Screen | ✅ Planned | Allow entering fractional quantities (e.g. 0.5 kg, 1.5 kg) in OrderCreate screen. |
| **21** | Untracked Products Clean Flag in Cart | ✅ Planned | Send explicit `trackStock: false` property in cart/quote instead of dummy 9999. |
| **22** | Untracked Products Variant Picker in Dashboard | ✅ Planned | Allow picking variants with 0 stock when parent product is untracked (Daily Fresh). |
| **23** | Coupon Release on Order Cancellation | ✅ Planned | Release coupon usage count and per-user quota when an order is cancelled. |
| **24** | CSV Report Formula Injection Sanitization | ✅ Planned | Sanitize `=, +, -, @` formula prefixes on CSV report exports for Excel safety. |
| **27** | Automated Test Coverage for Critical Paths | ✅ Planned | Add Jest tests for orders, stock decrement, coupon evaluation, refunds. |
| **28** | Dependency Security Fixes (`npm audit`) | ✅ Planned | Resolve reported vulnerabilities across server, frontend, and dashboard. |
| **29** | Image Storage (Local Disk vs Cloud) | ⏭️ Skipped | User decision: Keep local disk storage (`uploads/`). |
| **30** | Neon Direct Migration Connection Docs | ✅ Planned | Document `DATABASE_URL_DIRECT` requirement in `.env.example`. |
| **31** | Database Health Check Endpoint | ✅ Planned | Expand `/ping` to verify PostgreSQL connection with `SELECT 1`. |
| **32** | Automated Cleanup Cron Jobs | ⏭️ Skipped | User decision: Not required at this stage. |
| **33** | High-Traffic Database Indexes | ✅ Planned | Add composite indexes on `Order` and `Product` for fast queries. |
| **34** | Guest Phone Validation Safeguards | ✅ Planned | Strict client & server validation (`^01[3-9]\d{8}$`) to prevent checkout typos/spam. |
| **35** | PWA Support & Mobile App Prompt | ✅ Planned | Add web app manifest, offline asset caching, and "Add to Home Screen" prompt. |
| **36** | Storefront Daily Fresh Stock Display | ✅ Planned | Ensure untracked items never show "Out of Stock" or low-stock badges. |
| **37** | Geolocation HTTPS Production Protocol | ✅ Planned | Document HTTPS requirement for browser geolocation in deployment checklist. |
| **38** | Catalog Cache Immediate Invalidation | ✅ Planned | Verify `FreshnessWatcher` and Next.js `revalidateTag` for immediate price sync. |
| **39** | English/Bangla i18n Translation Parity | ✅ Planned | Audit and sync missing keys between `messages/en.json` and `bn.json`. |
| **40** | Storefront Password Reset Request Flow | ✅ Planned | Add phone-number password reset request UI connecting to Point 2. |
| **41** | Storefront Accessibility & 404/Error Pages | ✅ Planned | Ensure localized 404/Error pages and accessible modal focus trapping. |
| **42** | Production Frontend Build & Lint Verification | ✅ Planned | Verify clean Next.js build and zero lint errors. |
| **43** | Dashboard Bundle Code-Splitting | ✅ Planned | Use `React.lazy` for route-level splitting to shrink initial bundle from 1MB. |
| **44** | Dashboard Full Bangla Translations | ✅ Planned | Complete Bangla translations across coupons, reviews, support, audit log, settings. |
| **45** | Dashboard Route & Backend Permission Alignment | ✅ Planned | Align navigation visibility and route guards with backend PermissionsGuard. |
| **46** | Phone-Order Decimals & Variant Stock | ✅ Planned | Included in Points 20 & 22 (decimal inputs & untracked variant picker). |
| **47** | Unsaved Changes Warning in Admin Forms | ✅ Planned | Add dirty-form navigation warning in product editor and settings forms. |
| **48** | Dashboard Page Error Boundary | ✅ Planned | Wrap pages in React Error Boundary with recovery button to prevent white screens. |
| **D1** | COD Safeguards & Customer Blacklist | ✅ Planned | Fraud protection: track refusal rate & block abusive phones from COD orders. |
| **D2** | Weighed-Item Transparency & Final Bill Notice | ✅ Planned | Storefront & checkout notices clarifying exact weight calculation upon packing. |
| **D3** | Floating WhatsApp Order & Support Button | ✅ Planned | Configurable floating WhatsApp button for one-tap orders, photo lists, and help. |
| **D4** | Rider Cash Collection & Daily Settlement | ✅ Planned | Track daily COD cash collected per rider with manager sign-off & cash handover. |

---

## Detailed Plans by Issue

### Point 1 & 2: Authentication, Phone Verification & Password Reset Flow

#### User Requirements & Decisions:
1. **No SMS OTP System:** Do not implement OTP for registration, login, or checkout.
2. **Email Status:** Email remains optional during registration and can be updated anytime in the customer profile.
3. **Password Reset for Users with Email:**
   - Continue supporting self-service password reset via email link/token.
4. **Password Reset for Phone-Only Users (No Email):**
   - Customer cannot self-reset without an email.
   - On the "Forgot Password" UI, if the user enters a phone number that has no linked email, allow them to submit a **Password Reset Request**.
   - Admin receives this request in the Dashboard.
   - Admin calls/contacts the customer to verify identity.
   - Admin can then either:
     - **Option A:** Directly update/reset the customer's password in the admin dashboard.
     - **Option B:** Add/update the customer's email address in their profile so the customer can perform self-service email reset.

#### Implementation Architecture:

1. **Database / Prisma Schema:**
   - Create a model `PasswordResetRequest`:
     - `id`: UUID (Primary Key)
     - `userId`: String (Foreign Key to User)
     - `phone`: String
     - `status`: Enum (`PENDING`, `CONTACTED`, `RESOLVED`, `REJECTED`) @default(`PENDING`)
     - `notes`: String? (for admin notes)
     - `resolvedBy`: String? (Admin user ID)
     - `resolvedAt`: DateTime?
     - `createdAt`, `updatedAt`: DateTime
   - Ensure `User` model can be queried easily by phone/email.

2. **Backend (`server`):**
   - **Customer API:**
     - Endpoint `POST /customer/auth/forgot-password`:
       - If input is an email OR a phone with an email attached: send reset email link (existing flow).
       - If input is a phone number with **no email attached**:
         - Create a `PasswordResetRequest` with status `PENDING`.
         - Return response indicating request has been submitted to admin support.
         - Throttle repeated requests per phone number (e.g., max 1 active pending request per 24h).
   - **Admin API:**
     - `GET /admin/users/password-reset-requests`: Paginated list of pending/resolved requests.
     - `PATCH /admin/users/password-reset-requests/:id`: Update status (`CONTACTED`, `RESOLVED`, `REJECTED`) and admin notes.
     - `POST /admin/users/:id/reset-password`: Allow admin with proper permissions (`users.manage`) to directly set a new password for the user.
     - `PATCH /admin/users/:id`: Ensure admin can add or update user's email address.

3. **Public Frontend (`frontend`):**
   - Update `Forgot Password` modal/page:
     - Allow entering either **Email or Phone Number**.
     - If phone number entered has no email:
       - Display clear Bangla/English confirmation:
         *"আপনার অ্যাকাউন্টে কোনো ইমেইল যুক্ত নেই। পাসওয়ার্ড রিসেটের অনুরোধ সফলভাবে পাঠানো হয়েছে। আমাদের প্রতিনিধি শীঘ্রই আপনার সাথে যোগাযোগ করবেন।"*
         *(No email is linked to your account. Your reset request has been submitted. Our support team will contact you shortly.)*
   - Profile settings: Ensure users see a prompt/badge encouraging them to add an email address for easier account recovery.

4. **Admin Dashboard (`dashboard`):**
   - Add a "Password Reset Requests" tab/badge in the Users or Support section.
   - Show customer name, phone number, request time, status, and action buttons:
     - **Call Customer** button / phone link.
     - **Reset Password** modal (enter new password directly for customer).
     - **Add Email** modal (assign email to user profile).
     - **Mark Resolved / Reject** with note.

---

### Point 3: Customer Registration Rate Limiting (`POST /customer/auth/register`)

#### Problem:
- Registration endpoint had no rate limiter, allowing scripts/bots to flood the database with dummy user accounts.

#### Plan & Architecture:
- Add `@Throttle({ medium: { ttl: 60000, limit: 5 } })` to `register` in `server/src/customer/auth/auth.controller.ts`.
- Max 5 registration attempts per 60 seconds per IP address.
- Returns standard HTTP 429 ("Too Many Requests") if breached, protecting the database and server resources.

---

### Point 4: Refresh Token Security & Body Trust (`POST /customer/auth/refresh`)

#### Problem:
- The refresh endpoint lacked rate limiting and required the client to pass `userId` in the raw body alongside `refreshToken`.

#### Plan & Architecture:
- Add `@Throttle({ medium: { ttl: 60000, limit: 30 } })` to prevent token refresh flooding.
- Update `AuthService.refreshTokens(refreshToken: string)`:
  - Verify and decode the JWT `refreshToken` using `jwtService.verifyAsync()`.
  - Extract the `userId` (`sub`) directly from the verified token payload.
  - Make `dto.userId` optional (or deprecated), preventing client manipulation or ID mismatches.

---

### Point 5: Guest Order Tracking & Invoice Privacy

#### Problem:
- Order numbers were sequential (`BS-YYYYMMDD-0001`, `0002`...). In a local community where phone numbers are known, people could guess neighbor orders and view private addresses, items, and billing totals.

#### Plan & Architecture:
1. **Unguessable Order Numbers:**
   - Update order number generation in `OrderLifecycle` / `orders.service.ts`:
   - Format: `BS-YYMMDD-XXXX` where `XXXX` is a 4-character random alphanumeric code (using unambiguous uppercase letters and digits: `23456789ABCDEFGHJKLMNPQRSTUVWXYZ`), e.g., `BS-261024-9K7F`.
   - Maintain uniqueness check in DB with automatic retry if a collision occurs.
   - Keep existing order lookup backward-compatible for historical orders.
2. **Strict Rate Limiting on Order Tracking & Invoices:**
   - Add `@Throttle({ medium: { ttl: 60000, limit: 6 } })` on both:
     - `GET /customer/orders/track`
     - `GET /customer/orders/invoice`
   - Thwarts automated brute-force attacks guessing order numbers with phones.
3. **Data Masking for Public Guest Invoices/Tracking:**
   - On public guest tracking/invoice responses, ensure sensitive fields (e.g. detailed internal delivery notes) are protected.

---

### Point 6: Register Error Information Leak (`POST /customer/auth/register`)

#### Problem:
- In `auth.service.ts`, catching unexpected errors during registration rethrew `InternalServerErrorException('Failed to register user: ' + message)`.
- If a database exception occurred, raw database schema, query parameters, or driver details were exposed to the API response.

#### Plan & Architecture:
- Intercept errors cleanly in `auth.service.ts`:
  - Log the full technical stack trace to the server logs via `this.logger.error()`.
  - For unhandled exceptions, return a safe, generic message: `InternalServerErrorException('Registration failed due to a server error. Please try again.')`.
  - Never concatenate internal `error.message` or stack frames to user-facing responses.

---

### Point 7: Duplicate Phone / Email Race Handling (HTTP 409 vs 500)

#### Problem:
- Even though pre-checks exist (`findFirst`), two concurrent registration requests with the same phone or email can slip past the pre-check and hit the database at the same moment.
- The second query violates the unique database constraint, Prisma throws a `P2002` error, which fell into the generic `catch` block and returned `500 Internal Server Error`.

#### Plan & Architecture:
- In `auth.service.ts`, explicitly check for Prisma known request errors:
  - If `error instanceof Prisma.PrismaClientKnownRequestError` and `error.code === 'P2002'`:
    - Identify target fields (e.g. `phone` or `email`).
    - Throw a clean `ConflictException('This phone number already has an account. Please log in.')` or `'Email is already registered.'`.
  - Ensures clients receive the correct HTTP status code `409 Conflict` instead of `500`.

### Point 8: Timing User Enumeration Fix in Login (`validateLocalUser`)

#### Problem:
- When a user enters a non-existent phone number, the function returns immediately (~10ms).
- When a user enters a registered phone number with an incorrect password, `argon2.verify` runs (~250ms).
- Attackers can measure the response time to compile a list of all registered phone numbers.

#### Plan & Architecture:
- Store a static, precomputed dummy argon2 hash (`DUMMY_ARGON2_HASH`) in `auth.service.ts`.
- In `validateLocalUser({ identifier, password })`:
  - If `!user`:
    - Perform `await argon2.verify(DUMMY_ARGON2_HASH, password);`
    - Throw `UnauthorizedException('Invalid Credentials')`.
  - Both registered and non-registered attempts take virtually identical CPU time (~250ms), eliminating the side-channel timing attack.

---

### Point 9: Multi-Device Login Sessions

#### Problem:
- Currently, `User` only has a single `refreshTokenHash String?` column in the database.
- Logging in on a new device (e.g., laptop) overwrites the hash from the previous device (e.g., smartphone), immediately logging the user out of their mobile session when it attempts to refresh.

#### Plan & Architecture:
- Create a dedicated model `UserSession` in `schema.prisma`:
  - `id`: UUID (Primary Key)
  - `userId`: String (Foreign Key to User)
  - `refreshTokenHash`: String
  - `device`: String? (User-Agent snippet or device label)
  - `ip`: String?
  - `expiresAt`: DateTime
  - `createdAt`, `updatedAt`: DateTime
- Support up to 5 concurrent devices/sessions per user (oldest session automatically pruned when exceeding limit).
- During token refresh:
  - Verify token and match against the user's active `UserSession` records.
  - Rotate the session's refresh token hash on each refresh (Refresh Token Rotation pattern).
- On logout:
  - Delete only the current device's session, leaving other devices logged in.
  - Provide an optional "Log out of all devices" method that deletes all sessions for the user.

---

### Point 10: Helmet CSP & Production Headers Configuration

#### Problem:
- `main.ts` hardcoded `http://localhost:8000` inside `contentSecurityPolicy.directives.defaultSrc`.
- Directives contained malformed syntax (`https: 'unsafe-inline'` combined in a single string).
- In production, this causes browser console CSP violations and can block resources.

#### Plan & Architecture:
- Update Helmet configuration in `server/src/main.ts`:
  - Extract allowed domains from `corsOrigins` / environment variables (`APP_URL`, `FRONTEND_URL`, `DASHBOARD_URL`).
  - Fix directive array syntax:
    ```typescript
    scriptSrc: ["'self'", 'https:', "'unsafe-inline'"],
    connectSrc: ["'self'", 'https:', ...corsOrigins],
    ```
  - For pure JSON API responses (`/api/*`), relax unnecessary HTML-only CSP restrictions while keeping strict headers (`X-Frame-Options`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Referrer-Policy`).

### Point 11: Swagger Production Protection (`server/src/main.ts`)

#### Problem:
- Swagger `/docs` and `/docs-json` were enabled by default regardless of `NODE_ENV`. In production, exposing full internal API schemas, DTO structures, and endpoint signatures facilitates reconnaissance by attackers.

#### Plan & Architecture:
- In `server/src/main.ts`:
  - Default Swagger to `false` in production unless explicitly overridden via environment variable:
    ```typescript
    const isProduction = nodeEnv === 'production';
    const swaggerEnabled = configService.get<boolean>('swagger.enabled') ?? !isProduction;
    ```
  - If Swagger is enabled in production (via `SWAGGER_ENABLED=true`), wrap it with HTTP Basic Authentication middleware or a secret access key header.

---

### Point 12: Missing `ParseUUIDPipe` on ID Parameters

#### Problem:
- Several controller endpoints accepted `@Param('id') id: string` without validating that `id` was a valid UUID:
  - `Customer`: `OrdersController` (`findById`, `cancelOrder`), `ReturnsController` (`findOne`, `cancel`), `AddressesController` (`update`, `remove`, `setDefault`), `SearchHistoryController` (`remove`).
  - `Admin`: `UnitsController` (`update`, `remove`), `ReturnsController` (`findOne`, `update`), `CategoryController` (`findOne`, `update`, `remove`), `BrandController` (`findOne`, `update`, `remove`), `BannersController` (`update`, `remove`), `FlashDealsController` (`update`, `remove`).
- When invalid string inputs are passed (e.g. malformed links or scanner probes), PostgreSQL throws a `22P02: invalid input syntax for type uuid` error, resulting in an unhandled 500 server crash instead of an immediate HTTP 400 Bad Request.

#### Plan & Architecture:
- Audit and apply `new ParseUUIDPipe({ version: '4' })` on all entity `@Param('id')` parameters.
- Rejects malformed IDs immediately at the NestJS validation layer with a clean `400 Bad Request` ("Validation failed (uuid v4 is expected)"), preventing useless database queries and 500 error logs.

### Point 13: Admin Controller PermissionsGuard Consistency

#### Problem:
- Several admin controllers used `RolesGuard` and `@Roles(Role.ADMIN, Role.SUPER_ADMIN)` instead of the granular `PermissionsGuard`:
  - `AdminSupportTicketsController` (`admin/support-tickets`)
  - `AdminReviewsController` (`admin/reviews`)
  - `AdminNewsletterController` (`admin/newsletter`)
  - `AdminFlashDealsController` (`admin/flash-deals`)
  - `AdminStorefrontController` (`admin/storefront`)
- This bypassed the permission matrix: any staff user with `Role.ADMIN` (such as a Packer or Delivery Rider) could access and modify customer support tickets, approve/reject reviews, create flash deals, or alter storefront configuration.

#### Plan & Architecture:
- Replace `RolesGuard` with `PermissionsGuard` across all admin controllers.
- Apply appropriate `@RequirePermissions` annotations:
  - `support-tickets`: `@RequirePermissions(['support.view', 'support.manage'], 'support.manage')`
  - `reviews`: `@RequirePermissions(['reviews.view', 'reviews.manage'], 'reviews.manage')`
  - `flash-deals`: `@RequirePermissions(['promotions.view', 'promotions.manage'], 'promotions.manage')`
  - `newsletter`: `@RequirePermissions(['marketing.view', 'marketing.manage'], 'marketing.manage')`
  - `admin/storefront`: `@RequirePermissions(['settings.view', 'settings.manage'], 'settings.manage')`
- Aligns dashboard route permissions strictly with backend enforcement so staff roles (Manager, Packer, Rider) cannot exceed their authorized scope.

### Point 14: Production Secrets Rotation & Hardening

#### Problem:
- The local development `server/.env` contains actual Neon database credentials and dev JWT keys. Reusing dev credentials in production or exposing them poses a severe security risk.

#### Plan & Architecture:
- Maintain `.env.example` with documented dummy keys for any future contributors/servers.
- Define a pre-production launch protocol:
  1. Reset database password in the Neon PostgreSQL console before production deployment.
  2. Generate cryptographically strong (64+ character hexadecimal or base64) secrets for `JWT_SECRET` and `JWT_REFRESH_SECRET`.
  3. Set production environment variables via secure hosting environment secrets (e.g. Docker secrets, Railway/Render/VPS environment variables) rather than checking `.env` into git.

---

### Point 15: Admin Two-Factor Authentication (Email OTP) & Lockout

#### Problem:
- Dashboard access only required a single password factor. If an admin password was compromised, an unauthorized user could access customer data, orders, and financial reports.
- No account-level lockout existed after consecutive bad password guesses (only IP throttling).

#### Plan & Architecture:
1. **Admin 2FA via Email OTP:**
   - **Step 1 (Credentials):** Admin submits email and password at `/admin/auth/login`.
   - Server verifies credentials. If valid:
     - Generates a cryptographically secure 6-digit numeric OTP (e.g. `crypto.randomInt(100000, 999999)`).
     - Hashes the OTP using argon2/SHA-256 and stores it in the database with a 10-minute expiration (`AdminTwoFactorOtp`).
     - Dispatches an email via `MailService` to the admin's email address: *"Your Bazar Shodai Dashboard Verification Code: 582914 (valid for 10 minutes)"*.
     - Returns `{ requires2FA: true, tempToken: '<ephemeral_jwt>' }` (short-lived 10-minute token with restricted scope `2fa_pending`).
   - **Step 2 (Verification):** Dashboard displays the OTP verification modal:
     - Form: 6-digit input box with "Resend code in 60s" countdown.
     - Endpoint: `POST /admin/auth/verify-2fa` with `{ tempToken, otp }`.
     - Upon valid OTP match: OTP record is invalidated (one-time use) and standard admin access & refresh tokens are returned.
2. **Account Lockout on Consecutive Failures:**
   - Track `failedLoginAttempts: Int` and `lockedUntil: DateTime?` on `User` model.
   - After 5 consecutive wrong passwords or wrong OTP entries:
     - Set `lockedUntil = now() + 15 minutes`.
     - Return HTTP 423 Locked: *"Account temporarily locked due to 5 failed attempts. Please try again in 15 minutes."*
   - Successful login resets `failedLoginAttempts = 0`.

### Point 16: Order Idempotency (Prevent Duplicate Orders on Double-Click)

#### Problem:
- Double-clicking the "Confirm Order" button or network retries on mobile connections could invoke `placeOrder` concurrently. For uncounted (Daily Fresh) items that don't exhaust stock, two separate identical orders would be created.

#### Plan & Architecture:
1. **Frontend Debounce:**
   - In `CheckoutModal` / `checkout/page.tsx`, disable the submit button immediately upon the first click, displaying a clear loading spinner (*"অর্ডার প্রক্রিয়াধীন..."* / *"Processing order..."*).
2. **Backend Idempotency Window:**
   - In `orders.service.ts` / `OrdersController`:
   - Accept an optional `x-idempotency-key` header (or generate a hash of `userId/guestPhone + cartItems + total`).
   - If a duplicate order creation request is received within a 30-second window for the same cart/customer, return the existing order record instead of creating a duplicate.

---

### Point 17: bKash/Nagad Duplicate TrxID Validation Inside DB Transaction

#### Problem:
- The check for an already-used `bkashTransactionId` was performed outside the database transaction without a unique constraint, allowing identical TrxIDs to be submitted concurrently.

#### Plan & Architecture:
- Move the uniqueness check inside the `tx` transaction block:
  - If `trx` is provided and non-empty:
    - Query `tx.order.findFirst({ where: { bkashTransactionId: trx, status: { not: 'CANCELLED' } } })`.
    - If found, throw `BadRequestException('এই ট্রানজেকশন আইডিটি ইতিমধ্যে অন্য অর্ডারে ব্যবহৃত হয়েছে।' / 'This transaction ID has already been used.')`.
- Ensures that concurrent submissions of the same TrxID cannot race past each other.

---

### Point 18: Manual bKash / Nagad Payment Workflow

#### User Requirements & Decisions:
- **No Merchant API integration.** Payments remain 100% manual Send Money / Personal / Agent number.
- Admin can configure the receiver bKash / Nagad / Rocket numbers in Settings.
- In checkout, **Transaction ID (TrxID) is OPTIONAL**, but **Sender Number (or Last 4 Digits) is MANDATORY**.
- Admin verifies payment manually by checking their bKash/Nagad SMS or app before confirming the order.

#### Plan & Architecture:
1. **Settings / Admin Configuration:**
   - Ensure `SettingsService` provides configurable fields for:
     - `bkashNumber`: string (e.g. `017XXXXXXXX`)
     - `bkashType`: enum (`PERSONAL`, `MERCHANT`, `AGENT`)
     - `nagadNumber`, `rocketNumber` (with payment instructions).
2. **Checkout DTO & Storefront UI (`PlaceOrderDto`):**
   - Make `bkashTransactionId` optional (`@IsOptional()`).
   - Make `bkashSenderNumber` mandatory when `paymentMethod` is `BKASH` or `NAGAD`:
     - Must accept either full BD phone number (`017XXXXXXXX`) or last 4 digits (`XXXX`).
   - In checkout UI:
     - Clearly display: *"আমাদের এই নাম্বারে Send Money করুন: 017XXXXXXXX"*
     - Field 1: *"যে নাম্বার থেকে টাকা পাঠিয়েছেন (পুরো নাম্বার অথবা শেষ ৪ ডিজিট)"* [Required]
     - Field 2: *"ট্রানজেকশন আইডি (TrxID) - ঐচ্ছিক"* [Optional]
3. **Admin Dashboard Flow:**
   - Orders list shows payment status as `PENDING` with sender number/digits prominently displayed.
   - Admin checks their physical phone/app for the incoming SMS matching that sender number/last 4 digits.
   - Admin clicks **"Verify Payment"** in the order action bar to mark `paymentStatus: 'PAID'`.
   - If customer hasn't sent money, admin can switch payment method to `CASH_ON_DELIVERY` with a single click after phone confirmation.

---

### Point 19: Packer Final Weights Stock Sync via StockService

#### Problem:
- When a packer adjusted final weights in `order-edit.service.ts`, it ran a raw database decrement:
  `tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: diff } } })`.
- This bypassed `StockService.change()`, did not check `product.trackStock` (modifying phantom stock on untracked products), and adjusted parent product stock instead of variant stock for items with variants.

#### Plan & Architecture:
- Refactor `updatePackerWeights` in `server/src/admin/orders/order-edit.service.ts`:
  - Fetch item details including `product.trackStock` and `variantId`.
  - Replace the raw decrement with:
    ```typescript
    if (item.productId) {
      await this.stockService.change(tx, {
        productId: item.productId,
        variantId: item.variantId || undefined,
        change: -diff, // diff is (finalQty - orderedQty)
        reason: 'WEIGHT_ADJUSTMENT',
        reference: `Order weight adjustment: ${order.orderNumber}`,
      });
    }
    ```
  - If `product.trackStock === false`, `StockService.change()` automatically no-ops.
  - If the item has a variant, it adjusts the variant stock cleanly.
  - Creates a transparent stock audit log entry for every weight change.

### Point 20: Fractional / Decimal Quantities in Phone-Order Screen (`OrderCreate.tsx`)

#### Problem:
- In `dashboard/src/pages/orders/OrderCreate.tsx`, the quantity input enforced integer regex `replace(/\D/g, "")` and `Math.floor()`.
- Staff creating phone orders for weighed items (e.g. 0.5 kg beef, 1.25 kg potatoes) were prevented from entering decimals.

#### Plan & Architecture:
- In `OrderCreate.tsx`:
  - Update quantity input handler:
    - Allow decimal format `replace(/[^\d.]/g, "")` (supporting up to 2-3 decimal places, e.g. `0.5`, `1.5`, `2.25`).
    - Parse with `parseFloat(val)` instead of integer casting.
  - In `order-admin.dto.ts`:
    - Ensure admin order line quantity validator uses `@IsNumber({ maxDecimalPlaces: 3 })` with `@Min(0.01)` instead of `@IsInt()`.

---

### Point 21: Untracked Products Clean Flag in Cart & Checkout

#### Problem:
- For untracked products (Daily Fresh), the backend mocked `availableStock: 9999` so cart checks wouldn't block them. While functional, 9999 is a cosmetic hack and can leak into client UI badges.

#### Plan & Architecture:
- Add `trackStock: boolean` explicitly in:
  - `CartItemDto` / `CheckoutQuoteItem` / `ProductSummary`.
- Frontend UI logic:
  - If `item.product.trackStock === false`: treat as unlimited stock, omit "Only X left!" badges, and don't display 9999.
  - If `item.product.trackStock === true`: enforce strict `availableStock` and stock warnings.

---

### Point 22: Untracked Products Variant Picker in Dashboard

#### Problem:
- In `dashboard/src/pages/orders/OrderCreate.tsx` (~L561) and `EditItemsDialog.tsx` (~L109), variant buttons had `disabled={v.stock <= 0}` regardless of whether the product tracks stock.

#### Plan & Architecture:
- Update the condition:
  `disabled={product.trackStock && v.stock <= 0}`
- Allows selecting variants of untracked products (e.g. Daily Fresh fish/chicken cut options) even if their stored stock counter is 0.

---

### Point 23: Coupon Release on Order Cancellation

#### Problem:
- When an order with a coupon is cancelled, `coupon.usageCount` was not decremented, and the `CouponUsage` record remained active.
- If a coupon had `maxUsagePerUser: 1`, the customer was permanently blocked from reusing that coupon even though their order was never fulfilled.

#### Plan & Architecture:
- In `order-lifecycle.ts` / `cancelOrder`:
  - Inside the cancellation transaction:
    - If `order.couponCode` exists:
      - Decrement `coupon.usageCount: { decrement: 1 }` (guarded by `Math.max(0, usageCount - 1)`).
      - Delete or flag the corresponding `CouponUsage` record (`tx.couponUsage.deleteMany({ where: { orderId: order.id } })`).
- Restores the customer's eligibility to use the coupon on their next attempt.

---

### Point 24: CSV Report Formula Injection Sanitization

#### Problem:
- When admins export reports to CSV (`reports.service.ts`), string values (such as customer names or delivery notes) were written directly. If an input begins with `=, +, -, @`, spreadsheet programs (Excel, LibreOffice) can execute it as a formula.

#### Plan & Architecture:
- In `reports.service.ts`, add a helper `sanitizeCsvField(val: string)`:
  - If a cell string starts with `=`, `+`, `-`, or `@`, prefix it with an apostrophe `'` or tab character.
- Guarantees that opening CSV reports in Microsoft Excel renders text safely without security alerts or formula execution.

### Point 27: Automated Test Coverage for Critical Business Paths

#### Problem:
- Current tests (82 tests) primarily cover utilities, delivery fee, phone normalization, and shipping. The core money-handling logic (orders, cart, stock decrement, coupon evaluation, refunds) lacked automated test suites.

#### Plan & Architecture:
- Add Jest test suites under `server/src/test/`:
  1. `orders.service.spec.ts`: Test `placeOrder` with stock decrement, coupon deductions, delivery fee calculation, and order number generation.
  2. `stock.service.spec.ts`: Test untracked product bypass (`trackStock: false`), variant stock deduction, negative stock guard, and stock log creation.
  3. `coupons.service.spec.ts`: Test minimum order limit, expiry, percentage vs fixed discounts, first-order restrictions, and cancellation release.
  4. `order-payments.spec.ts`: Test manual payment flow, due balance updates, and refund calculations.

---

### Point 28: Dependency Security Fixes (`npm audit`)

#### Problem:
- `npm audit` flagged vulnerabilities in packages across workspaces (e.g. `zod` in `dashboard`, and minor transitive packages in `server` and `frontend`).

#### Plan & Architecture:
- Review and run targeted dependency updates:
  - Update `zod` in `dashboard` to the patched secure version.
  - Run `npm audit fix` in `server` and `frontend` ensuring no breaking peer dependency conflicts.
  - Validate all three builds (`nest build`, `tsc --noEmit`, `vite build`) pass cleanly.

---

### Point 30: Neon Direct Migration Connection Documentation

#### Problem:
- Neon uses connection pooling (PgBouncer) for normal queries, but Prisma migrations require direct session-level connections (due to PostgreSQL advisory locks). Without `DATABASE_URL_DIRECT`, `prisma migrate` hangs.

#### Plan & Architecture:
- Update `server/.env.example` with clear documentation:
  ```env
  # Pooled connection URL (port 6543 or pgbouncer host) for app queries
  DATABASE_URL="postgresql://user:pass@ep-xyz-pooler.region.neon.tech/neondb?sslmode=require"

  # Direct connection URL (port 5432 or non-pooler host) required for prisma migrate
  DATABASE_URL_DIRECT="postgresql://user:pass@ep-xyz.region.neon.tech/neondb?sslmode=require"
  ```
- Ensure `server/prisma/schema.prisma` explicitly configures `directUrl = env("DATABASE_URL_DIRECT")`.

---

### Point 31: Database Health Check Endpoint

#### Problem:
- The existing `/ping` endpoint only checked that the NestJS process was alive, but did not test if PostgreSQL was accepting connections. If the DB paused or failed, load balancers wouldn't know.

#### Plan & Architecture:
- Update `PingController` or add `GET /health`:
  - Run a lightweight query: `await this.prisma.$queryRaw\`SELECT 1\``.
  - Return `{ status: 'ok', db: 'healthy', timestamp: new Date().toISOString() }`.
  - If DB is down, return HTTP 503 Service Unavailable so monitoring/hosting can alert or restart gracefully.

---

### Point 33: High-Traffic Database Indexes

#### Problem:
- High-volume customer queries (order history, product catalog by category, order tracking by phone) benefit from compound indexes to maintain low latency as order history grows.

#### Plan & Architecture:
- In `server/prisma/schema.prisma`, verify and add indexes:
  - `Order`: `@@index([userId, placedAt])`, `@@index([guestPhone, placedAt])`, `@@index([status, placedAt])`.
  - `Product`: `@@index([categoryId, isActive, status])`.
- Run migration using direct URL to create indexes without table locks.

### Point 34: Guest Phone Validation Safeguards

#### Problem:
- In the absence of SMS OTP, typos or invalid phone numbers entered during guest checkout can lead to failed deliveries or fake orders reaching the packing queue.

#### Plan & Architecture:
- Implement strict client-side & server-side Bangladeshi phone validation:
  - Regex: `/^(?:\+?88)?01[3-9]\d{8}$/`.
  - Strip spaces, dashes, and ensure exactly 11 digits starting with valid operator prefixes (`013`, `014`, `015`, `016`, `017`, `018`, `019`).
  - Provide inline instant feedback on the checkout form if the phone number length or prefix is invalid.

---

### Point 35: PWA Support & Mobile Experience

#### Problem:
- Customers on rural mobile connections experience slow reload times on page navigation, and there is no direct app icon for one-tap access.

#### Plan & Architecture:
- Configure PWA in `frontend`:
  - Add `manifest.json` with app icons (192x192, 512x512), theme color, and `standalone` display mode.
  - Implement a subtle "Add Bazar Shodai to Home Screen" install prompt for Android/iOS mobile browsers.
  - Service worker caching for static UI assets, logos, and fonts to ensure fast loading on 3G networks.

---

### Point 36: Storefront Daily Fresh Stock Display & Badges

#### Problem:
- Ensure untracked items (`trackStock: false`) are treated as permanently available on all customer-facing interfaces.

#### Plan & Architecture:
- Verify and audit:
  - Product listing / grid: ensure "Out of Stock" overlay never shows for untracked items.
  - Filter drawer: ensure the "In Stock Only" toggle does not hide untracked items with stock 0.
  - Product details page: hide "Only X items left!" low-stock warning and hide "Notify me when in stock" buttons for untracked products.
  - Wishlist & Cart: ensure items remain addable and checkoutable without inventory limits.

---

### Point 37: Geolocation HTTPS Production Protocol

#### Problem:
- Browser geolocation API (`navigator.geolocation`) is blocked by modern mobile browsers on insecure HTTP origins.

#### Plan & Architecture:
- Add a production deployment checklist item:
  - Ensure SSL/TLS certificates (Let's Encrypt / Cloudflare) are enforced with HTTP-to-HTTPS redirect.
  - Add graceful fallback in UI if a user denies location access: allow pinpointing their delivery spot directly on the interactive Leaflet map.

---

### Point 38: Catalog Cache Immediate Invalidation (`FreshnessWatcher`)

#### Problem:
- Storefront uses Next.js incremental cache (`revalidate: 300`). If an admin changes daily prices in the morning for fresh fish or vegetables, customers might see cached prices for up to 5 minutes.

#### Plan & Architecture:
- Verify `FreshnessWatcher` and on-demand cache revalidation:
  - When an admin saves a product price or status in the dashboard, call the Next.js revalidation webhook: `POST /api/revalidate?tag=products`.
  - Ensures price updates on the dashboard reflect instantly on the public storefront.

---

### Point 39: English & Bangla i18n Translation Parity

#### Problem:
- Any missing translation key in `messages/bn.json` or `messages/en.json` can cause runtime UI fallback issues or blank labels.

#### Plan & Architecture:
- Run a key-parity script comparing keys in `frontend/messages/en.json` and `frontend/messages/bn.json`.
- Fill any missing translations ensuring 100% parity across storefront headers, cart, checkout, badges, and footer.

---

### Point 40: Storefront Password Reset Request Flow (Phone Users)

#### Problem:
- The storefront's "Forgot Password" modal previously only accepted an email address.

#### Plan & Architecture:
- Update the Forgot Password UI in `frontend`:
  - Input field: "Email or Phone Number".
  - If a phone number is entered that has no email linked:
    - Display confirmation: *"আপনার অ্যাকাউন্টে কোনো ইমেইল যুক্ত নেই। পাসওয়ার্ড রিসেটের অনুরোধ সফলভাবে পাঠানো হয়েছে। আমাদের প্রতিনিধি শীঘ্রই আপনার সাথে যোগাযোগ করবেন।"*
    - Calls the `POST /customer/auth/forgot-password` endpoint configured in Point 2.

---

### Point 41: Storefront Accessibility & 404/Error Pages

#### Problem:
- Modal focus trapping, alt text on promotional banners, and localized error pages needed verification.

#### Plan & Architecture:
- Check and verify:
  - Custom `not-found.tsx` and `error.tsx` in `frontend/src/app/[locale]/` with friendly Bangla and English recovery buttons (*"হোমে ফিরে যান"* / *"Go to Homepage"*).
  - Proper image `alt` attributes on banners and product cards.
  - Accessible focus management in the `AuthModal` dialog.

---

### Point 42: Production Frontend Build & Lint Verification

#### Problem:
- Ensure no TypeScript errors or ESLint warnings block production builds.

#### Plan & Architecture:
- Run `npm run lint` and `npx next build` in `frontend`.
- Fix any lingering type mismatches or unescaped entities to guarantee zero-warning production deployment.

### Point 43: Dashboard Route-Level Code-Splitting (`React.lazy`)

#### Problem:
- The dashboard is bundled into a single large JS chunk (~1,051 kB minified). Loading all pages (orders, catalog, reports, settings, staff, tickets) upfront causes slow initial load on slower networks.

#### Plan & Architecture:
- In `dashboard/src/App.tsx` (or router configuration):
  - Convert route imports to `React.lazy()`:
    ```tsx
    const OrdersList = React.lazy(() => import('./pages/orders/OrdersList'));
    const OrderDetail = React.lazy(() => import('./pages/orders/OrderDetail'));
    const ProductEditor = React.lazy(() => import('./pages/catalog/ProductEditor'));
    const Reports = React.lazy(() => import('./pages/reports/Reports'));
    ```
  - Wrap routes in `<Suspense fallback={<PageLoadingSpinner />}>`.
  - Reduces initial bundle payload to <250 kB, accelerating initial dashboard login.

---

### Point 44: Complete Dashboard Bangla Translations

#### Problem:
- Phase 6 notes identified translation gaps in coupons, reviews, support tickets, audit log, inventory, product editor, and certain settings tabs where English labels remain untranslated.

#### Plan & Architecture:
- Audit and translate all missing translation keys in `dashboard/src/i18n/bn/`:
  - `catalog.ts`: product editor specifications, variants, untracked toggles.
  - `orders.ts`: weight adjustment modals, payment verification banners.
  - `coupons.ts`: coupon usage limits, type labels.
  - `reviews.ts` & `support.ts`: moderation actions, ticket priorities, reply forms.
  - `settings.ts`: payment accounts, delivery distance and slot labels.
- Ensure all admin UI buttons, badges, table headers, and tooltips display natural, polished Bangla when Bangla locale is selected.

---

### Point 45: Dashboard Route & Backend Permission Alignment

#### Problem:
- Dashboard route protection checked permissions on navigation, but backend controllers previously used `RolesGuard`. Aligning them ensures seamless security.

#### Plan & Architecture:
- Audit sidebar items and protected routes in `dashboard/src/components/layout/Sidebar.tsx` and route guards:
  - If staff member lacks `support.view`, hide the Support Tickets menu item and block navigation to `/support`.
  - If staff member is a Packer (only `orders.pack`), hide Reports, Staff Management, and Settings.
  - Guarantees 1:1 synchronization between frontend visibility and backend `PermissionsGuard` (Point 13).

---

### Point 46: Phone-Order Quantities & Untracked Variant Stock

- *Fully planned under Points 20 & 22 (enabling decimal inputs like 0.5 kg in `OrderCreate.tsx` and allowing selection of untracked product variants with stock 0).*

---

### Point 47: Unsaved Changes Warning in Admin Forms

#### Problem:
- In long forms (e.g. `ProductEditor`, site settings), navigating away by clicking a sidebar link or refreshing can cause staff to lose typed changes without warning.

#### Plan & Architecture:
- Add a dirty-state listener (`useBeforeUnload` / React Router blocker):
  - Track `isDirty` form state.
  - If unsaved changes exist and the user attempts to leave:
    - Browser prompt / modal: *"আপনার করা পরিবর্তনগুলো সংরক্ষিত হয়নি। আপনি কি নিশ্চিত যে পৃষ্ঠা ত্যাগ করতে চান?"* (*"You have unsaved changes. Are you sure you want to leave?"*).

---

### Point 48: Dashboard Page-Level Error Boundary

#### Problem:
- An unexpected runtime JavaScript exception in a complex table, chart, or date-picker widget can crash the entire React component tree to an empty white screen.

#### Plan & Architecture:
- Create a reusable `PageErrorBoundary` component:
  - Displays a localized fallback banner:
    *"এই পৃষ্ঠাটি লোড করার সময় একটি ত্রুটি ঘটেছে।"* (*"An error occurred while rendering this page."*)
  - Provides a **"পৃষ্ঠাটি পুনরায় লোড করুন"** (*"Reload Page"*) button and a toggle to view technical error details for developers.
  - Wrap each major route inside `PageErrorBoundary` so an error on one page never breaks dashboard navigation or other tabs.

### Point D1: COD Safeguards & Customer Blacklist

#### User Value:
- In grocery delivery, malicious or prank orders where a customer refuses to accept the parcel at their doorstep cause inventory damage (especially perishables) and rider delivery costs.

#### Plan & Architecture:
1. **Database Schema:**
   - Add `isBlacklisted: Boolean @default(false)` and `blacklistReason: String?` to `User` model.
   - Create a `BlacklistedPhone` model for guests:
     - `phone`: String @id
     - `reason`: String?
     - `createdAt`: DateTime @default(now())
2. **Backend Enforcement (`orders.service.ts`):**
   - During `placeOrder`:
     - Check if customer `userId` or `shippingAddress.phone` is blacklisted.
     - If blacklisted and `paymentMethod === 'CASH_ON_DELIVERY'`:
       - Throw `BadRequestException('এই নাম্বার থেকে ক্যাশ অন ডেলিভারি সুবিধা সাময়িকভাবে বন্ধ আছে। দয়া করে বিকাশে পেমেন্ট করুন অথবা কাস্টমার কেয়ারে যোগাযোগ করুন।' / 'Cash on delivery is disabled for this number. Please pay via bKash or contact customer care.')`.
3. **Admin Dashboard Control:**
   - In Users / Orders list:
     - View delivery completion rate (e.g. 5 delivered, 2 cancelled/refused).
     - Admin can toggle **"Block from COD"** with a one-line note (*"Refused 2 orders at Chitoshi Bazar"*).

---

### Point D2: Weighed-Item Transparency & Final Bill Notice

#### User Value:
- Fresh fish, chicken, and raw vegetables cannot be cut to exact gram accuracy (e.g. ordered 1.0 kg rui fish, cut portion may weigh 1.08 kg). Transparent communication builds trust and prevents customer disputes.

#### Plan & Architecture:
1. **Storefront Product Page & Cart:**
   - For products with `isWeighed: true`:
     - Display a clear transparency badge below the price:
       *"⚖️ ওজন অনুযায়ী চূড়ান্ত বিল নির্ধারিত হবে"* (*"Final bill based on exact packed weight"*).
2. **Checkout Summary Notice:**
   - If cart contains any weighed products, show an informative alert:
     *"আপনার অর্ডারে মাছ/মাংস/সবজি রয়েছে। প্যাকেজিংয়ের সময় সঠিক ওজনের সামান্য তারতম্য (±১০%) হতে পারে। রাইডারের ইনভয়েসে প্রকৃত ওজনের সঠিক মূল্য প্রদর্শিত হবে।"*
     *(Your order contains fresh weighed items. Packed weight may vary slightly (±10%). The rider invoice will reflect the exact packed weight and price.)*
3. **Receipt / Invoice Sync:**
   - When the packer enters the final weight (Point 19), the generated customer invoice and delivery slip highlight both:
     - Ordered Quantity (e.g. 1.000 kg)
     - Actual Packed Quantity (e.g. 1.050 kg)
     - Adjusted Line Total

---

### Point D3: Floating WhatsApp Order & Support Button

#### User Value:
- In small-town / upazila settings, many busy customers, elderly people, or shopkeepers prefer writing a quick WhatsApp message, sending a voice note, or sending a photo of a handwritten grocery list instead of browsing every category.

#### Plan & Architecture:
1. **Admin Settings (`SettingsService`):**
   - Provide setting keys:
     - `whatsappNumber`: string (e.g. `+88017XXXXXXXX`)
     - `whatsappEnabled`: boolean @default(true)
     - `whatsappGreetingBn`: string (*"আসসালামু আলাইকুম, বাজার সদাই থেকে কীভাবে আপনাকে সহায়তা করতে পারি?"*)
2. **Storefront Floating Widget (`frontend`):**
   - Responsive floating green WhatsApp icon at the bottom-right corner of all storefront pages (above the bottom navigation on mobile).
   - Clicking opens WhatsApp directly (via `https://wa.me/88017XXXXXXXX?text=...`) with pre-filled message:
     *"আসসালামু আলাইকুম, আমি বাজার সদাই থেকে অর্ডার করতে / সহায়তা চাই।"*
   - Includes quick options: "Send Grocery List Photo" / "Inquire about Delivery".

---

### Point D4: Rider Cash Collection & Daily Settlement

#### User Value:
- At the end of every delivery shift, delivery riders carry large sums of Cash on Delivery money collected from customers across different unions and villages. A dedicated settlement flow eliminates bookkeeping errors and missing cash disputes.

#### Plan & Architecture:
1. **Database Schema:**
   - Create a `RiderSettlement` model:
     - `id`: UUID (Primary Key)
     - `riderId`: String (Foreign Key to User)
     - `date`: DateTime
     - `orderCount`: Int
     - `totalCashCollected`: Decimal
     - `settledAmount`: Decimal
     - `status`: Enum (`PENDING`, `SETTLED`)
     - `receivedByAdminId`: String?
     - `settledAt`: DateTime?
     - `notes`: String?
2. **Dashboard Management (`admin/deliveries`):**
   - Add a **"Cash Settlement (ক্যাশ হিসাব)"** tab in Deliveries:
     - Shows each active rider:
       - Today's Delivered Orders: e.g. 14 orders
       - Total COD Cash in Hand: e.g. ৳12,450
     - Action: **"ক্যাশ গ্রহণ ও সেটেলমেন্ট"** (*"Receive Cash & Settle"*) button.
     - Clicking opens a confirmation modal where manager verifies the cash received and marks the shift as settled.
   - Generates a printable / downloadable daily handover receipt for the rider and store manager.

---













# DISCOVERY.md: Bazar Shodai Mobile Architecture & Specification

## 1. Executive Summary & System Overview

Bazar Shodai is an omnichannel grocery, daily essentials, and medicine e-commerce ecosystem built specifically for Bangladesh.
The platform consists of:
1. **Backend API**: NestJS (v10+), PostgreSQL with Prisma ORM (v6/v7), Redis cache, Cloudflare R2 object storage, argon2 password hashing, and JWT authentication with refresh token rotation.
2. **Web Storefront**: Next.js (v16 with Turbopack), TypeScript, Tailwind CSS, GSAP 3 animation engine, next-intl (Bengali `bn` and English `en`), and responsive mobile/desktop layouts.
3. **Admin Dashboard**: React (v19 with Vite), TypeScript, Tailwind CSS, React Router v7, TanStack Query, and Lucide icons.

The primary objective is to engineer a **high-performance, standalone React Native (Expo SDK 52/53 with New Architecture & Hermes)** mobile application targeting **Android first** with zero friction iOS-readiness, completely replicating all existing e-commerce, customer care, prescription upload, delivery location sharing, and delivery rider features.

---

## 2. Complete Module & Feature Matrix

### 2.1 Customer Facing Modules
1. **Catalog & Discovery**:
   - Multi-level Category tree (root categories, subcategories, grocery vs medicine categorization).
   - Brand showcase and brand-specific product filtering.
   - Dynamic Hero sliders & promotional banner carousels.
   - Featured products (*আজকের তাজা বাজার*), Best sellers, New arrivals, Flash deals.
   - Full-text faceted search with instant debounce, autocomplete suggestions, and search history persistence.
   - Advanced filters: price range slider, category, brand, stock availability, unit filter, and sort options (popular, price asc/desc, newest).
2. **Product Details & Interaction**:
   - High-resolution multi-image gallery with zoom and swipe gesture.
   - Unit pricing, minimum order quantities, and fractional quantity steppers (e.g., 0.5 kg steps for fresh produce/fish, 1 piece for grocery).
   - Product variant options (size, weight, pack size).
   - Stock indicators (In stock, low stock alert, out of stock).
   - Customer ratings, verified purchase reviews, review photo gallery, helpful votes.
   - Customer Q&A on products.
   - Back-in-stock notification subscription for sold-out products.
   - Recently viewed product tracking with guest-to-user automatic merge.
   - Wishlist / Save for later with instant toggle.
3. **Medicine & Pharmacy Module**:
   - Specialized OTC (Over The Counter) and Prescription medicine catalog.
   - Direct prescription camera capture & document upload with customer phone number and instructions.
   - Prescription order status tracking (Pending review, Approved, Dispensed, Rejected).
4. **Cart & Stepper Engine**:
   - Unified persistent cart with guest token (`X-Guest-Token` UUID).
   - Seamless cart merge upon authentication (login/signup automatically attaches guest cart items to user account).
   - Real-time stock reservation and price validation.
   - Dynamic delivery charge calculation based on cart subtotal and customer GPS location.
5. **Checkout & Mobile Banking Payments**:
   - Single-screen optimized checkout with native keyboard avoidance.
   - Multiple saved delivery addresses (Home, Office, Other) with default address toggle.
   - Accurate GPS pin-drop delivery location sharing (`customer/my-location`) with distance-to-hub and real-time delivery fee calculation.
   - Coupon discount engine (Percentage off, Fixed amount off, Minimum spend validation, single-use per customer enforcement).
   - Payment Methods:
     - **Cash on Delivery (COD)**.
     - **bKash (Manual Mobile Banking)**: Merchant number display, copy-to-clipboard, transaction ID input, and verification flow.
     - **Nagad (Manual Mobile Banking)**: Merchant account, instructions, transaction ID submission.
     - **Rocket (Manual Mobile Banking)**: Merchant account, instructions, transaction ID submission.
6. **Order Management & Live Tracking**:
   - Live order tracking timeline: `PENDING` → `CONFIRMED` → `PROCESSING` → `SHIPPED` → `IN_TRANSIT` → `OUT_FOR_DELIVERY` → `DELIVERED`.
   - Rider delivery event logs and live location updates.
   - Order history with re-order capability (1-tap add previous order items back to cart).
   - Order cancellation (allowed before shipment).
   - Return & refund requests: item selection, reason dropdown (`DAMAGED`, `WRONG_ITEM`, `EXPIRED`, `NOT_AS_DESCRIBED`, `POOR_QUALITY`), photographic evidence upload, and refund method preference (bKash/Nagad/Rocket/Wallet).
7. **Customer Account & Support**:
   - Customer profile management (name, phone, email, avatar upload, language preference).
   - Delivery address book (create, edit, delete, set default).
   - Loyalty rewards points balance & transaction ledger.
   - Push & in-app notification center with read/unread tracking and granular notification preferences.
   - Customer support ticketing system: create ticket, category selection, real-time message thread.
   - Contact form with message status tracking.
   - Newsletter subscription management.

### 2.2 Delivery Rider & Staff Modules (Mobile Accessible)
1. **Rider Delivery Dashboard**:
   - `GET /admin/deliveries/my-deliveries`: List active deliveries assigned to the logged-in rider.
   - Delivery status transitions: `ASSIGNED` → `ACCEPTED` → `PICKED_UP` → `ON_THE_WAY` → `DELIVERED` / `FAILED`.
   - Direct customer call link, delivery address map navigation (Google Maps / Apple Maps integration).
   - Cash collection reconciliation on delivery.
   - Proof of delivery / failure note logging.

---

## 3. Complete API Endpoint Specification (363 Endpoints)

### 3.1 Customer API Endpoints (116 Endpoints)

#### Module: `addresses` (5 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/customer/addresses` | Yes (JWT / Guest) | `ApiOperation` |
| `POST` | `/customer/addresses` | Yes (JWT / Guest) | `HttpCode` |
| `PATCH` | `/customer/addresses/:id` | Yes (JWT / Guest) | `ApiOperation` |
| `DELETE` | `/customer/addresses/:id` | Yes (JWT / Guest) | `HttpCode` |
| `PATCH` | `/customer/addresses/:id/default` | Yes (JWT / Guest) | `ApiOperation` |

#### Module: `auth` (10 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/customer/auth/register` | Yes (JWT / Guest) | `Throttle` |
| `POST` | `/customer/auth/login` | Yes (JWT / Guest) | `Throttle` |
| `POST` | `/customer/auth/refresh` | Yes (JWT / Guest) | `Throttle` |
| `POST` | `/customer/auth/forgot-password` | Yes (JWT / Guest) | `Throttle` |
| `GET` | `/customer/auth/reset-password/verify` | Yes (JWT / Guest) | `Throttle` |
| `POST` | `/customer/auth/reset-password` | Yes (JWT / Guest) | `Throttle` |
| `POST` | `/customer/auth/logout` | Yes (JWT / Guest) | `UseGuards` |
| `GET` | `/customer/auth/profile` | Yes (JWT / Guest) | `UseGuards` |
| `PATCH` | `/customer/auth/profile` | Yes (JWT / Guest) | `UseGuards` |
| `POST` | `/customer/auth/change-password` | Yes (JWT / Guest) | `UseGuards` |

#### Module: `back-in-stock` (4 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/customer/back-in-stock` | Yes (JWT / Guest) | `UseGuards` |
| `POST` | `/customer/back-in-stock/cancel` | Yes (JWT / Guest) | `HttpCode` |
| `GET` | `/customer/back-in-stock/mine` | Yes (JWT / Guest) | `ApiBearerAuth` |
| `DELETE` | `/customer/back-in-stock/:id` | Yes (JWT / Guest) | `ApiBearerAuth` |

#### Module: `banners` (1 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/customer/banners` | Public | `ApiOperation` |

#### Module: `brands` (2 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/customer/brands` | Public | `ApiOperation` |
| `GET` | `/customer/brands/:slug` | Public | `ApiOperation` |

#### Module: `cart` (8 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/customer/cart/guest-token` | Yes (JWT / Guest) | `HttpCode` |
| `POST` | `/customer/cart/merge` | Yes (JWT / Guest) | `UseGuards` |
| `GET` | `/customer/cart` | Yes (JWT / Guest) | `ApiOperation` |
| `GET` | `/customer/cart/count` | Yes (JWT / Guest) | `ApiOperation` |
| `POST` | `/customer/cart` | Yes (JWT / Guest) | `HttpCode` |
| `PATCH` | `/customer/cart/:itemId` | Yes (JWT / Guest) | `ApiOperation` |
| `DELETE` | `/customer/cart/:itemId` | Yes (JWT / Guest) | `HttpCode` |
| `DELETE` | `/customer/cart` | Yes (JWT / Guest) | `HttpCode` |

#### Module: `categories` (4 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/customer/categories` | Public | `ApiOperation` |
| `GET` | `/customer/categories/tree` | Public | `ApiOperation` |
| `GET` | `/customer/categories/:slug/sub-categories` | Public | `ApiOperation` |
| `GET` | `/customer/categories/:slug` | Public | `ApiOperation` |

#### Module: `checkout` (2 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/customer/checkout/summary` | Yes (JWT / Guest) | `HttpCode` |
| `POST` | `/customer/coupons/apply` | Yes (JWT / Guest) | `HttpCode` |

#### Module: `contact` (1 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/customer/contact` | Yes (JWT / Guest) | `UseGuards` |

#### Module: `locations` (5 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/customer/locations/divisions` | Public | `Header` |
| `GET` | `/customer/locations/divisions/:division/districts` | Public | `Header` |
| `GET` | `/customer/locations/districts/:district/upazilas` | Public | `Header` |
| `GET` | `/customer/locations/tree` | Public | `Header` |
| `GET` | `/customer/locations/search` | Public | `ApiOperation` |

#### Module: `loyalty` (1 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/customer/loyalty` | Yes (JWT / Guest) | `ApiOperation` |

#### Module: `my-location` (5 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/customer/my-location` | Yes (JWT / Guest) | `Throttle` |
| `GET` | `/customer/my-location` | Yes (JWT / Guest) | `ApiOperation` |
| `DELETE` | `/customer/my-location` | Yes (JWT / Guest) | `ApiOperation` |
| `GET` | `/customer/my-location/:token` | Yes (JWT / Guest) | `Throttle` |
| `POST` | `/customer/my-location/:token/submit` | Yes (JWT / Guest) | `HttpCode` |

#### Module: `newsletter` (2 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/customer/newsletter/subscribe` | Yes (JWT / Guest) | `UseGuards` |
| `POST` | `/customer/newsletter/unsubscribe` | Yes (JWT / Guest) | `HttpCode` |

#### Module: `notifications` (7 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/customer/notifications` | Yes (JWT / Guest) | `ApiOperation` |
| `GET` | `/customer/notifications/unread-count` | Yes (JWT / Guest) | `ApiOperation` |
| `GET` | `/customer/notifications/preferences` | Yes (JWT / Guest) | `ApiOperation` |
| `PUT` | `/customer/notifications/preferences` | Yes (JWT / Guest) | `ApiOperation` |
| `PATCH` | `/customer/notifications/read-all` | Yes (JWT / Guest) | `HttpCode` |
| `PATCH` | `/customer/notifications/:id/read` | Yes (JWT / Guest) | `HttpCode` |
| `DELETE` | `/customer/notifications/:id` | Yes (JWT / Guest) | `HttpCode` |

#### Module: `orders` (9 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/customer/orders` | Yes (JWT / Guest) | `ApiOperation` |
| `GET` | `/customer/orders/track` | Yes (JWT / Guest) | `Throttle` |
| `GET` | `/customer/orders/invoice` | Yes (JWT / Guest) | `Throttle` |
| `GET` | `/customer/orders/:id/invoice` | Yes (JWT / Guest) | `ApiOperation` |
| `GET` | `/customer/orders/:id` | Yes (JWT / Guest) | `ApiOperation` |
| `POST` | `/customer/orders` | Yes (JWT / Guest) | `HttpCode` |
| `POST` | `/customer/orders/:id/reorder` | Yes (JWT / Guest) | `HttpCode` |
| `POST` | `/customer/orders/claim` | Yes (JWT / Guest) | `HttpCode` |
| `POST` | `/customer/orders/:id/cancel` | Yes (JWT / Guest) | `HttpCode` |

#### Module: `prescriptions` (3 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/)
export class PrescriptionsController {
  constructor(private readonly prescriptions: PrescriptionsService) {}

  /**
   * Public / Customer prescription upload (attaches user if authenticated/prescriptions` | Yes (JWT / Guest) | `HttpCode` |
| `GET` | `/)
export class PrescriptionsController {
  constructor(private readonly prescriptions: PrescriptionsService) {}

  /**
   * Public / Customer prescription upload (attaches user if authenticated/customer/prescriptions` | Yes (JWT / Guest) | `ApiBearerAuth` |
| `DELETE` | `/)
export class PrescriptionsController {
  constructor(private readonly prescriptions: PrescriptionsService) {}

  /**
   * Public / Customer prescription upload (attaches user if authenticated/customer/prescriptions/:id` | Yes (JWT / Guest) | `ApiBearerAuth` |

#### Module: `home` (1 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/customer/home` | Public | `ApiOperation` |

#### Module: `products` (10 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/customer/products` | Public | `ApiOperation` |
| `GET` | `/customer/products/filters` | Public | `ApiOperation` |
| `GET` | `/customer/products/suggestions` | Public | `Throttle` |
| `GET` | `/customer/products/new-arrivals` | Public | `ApiOperation` |
| `GET` | `/customer/products/best-sellers` | Public | `ApiOperation` |
| `GET` | `/customer/products/on-sale` | Public | `ApiOperation` |
| `GET` | `/customer/products/featured` | Public | `ApiOperation` |
| `GET` | `/customer/products/search` | Public | `ApiOperation` |
| `GET` | `/customer/products/:slug` | Public | `ApiOperation` |
| `GET` | `/customer/products/:slug/related` | Public | `ApiOperation` |

#### Module: `recently-viewed` (3 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/customer/recently-viewed` | Yes (JWT / Guest) | `HttpCode` |
| `GET` | `/customer/recently-viewed` | Yes (JWT / Guest) | `ApiOperation` |
| `DELETE` | `/customer/recently-viewed` | Yes (JWT / Guest) | `HttpCode` |

#### Module: `returns` (5 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/customer/returns` | Yes (JWT / Guest) | `ApiOperation` |
| `GET` | `/customer/returns/eligibility/:orderId` | Yes (JWT / Guest) | `ApiOperation` |
| `GET` | `/customer/returns/:id` | Yes (JWT / Guest) | `ApiOperation` |
| `POST` | `/customer/returns` | Yes (JWT / Guest) | `HttpCode` |
| `POST` | `/customer/returns/:id/cancel` | Yes (JWT / Guest) | `HttpCode` |

#### Module: `reviews` (8 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/customer/products/:productId/reviews` | Yes (JWT / Guest) | `ApiOperation` |
| `POST` | `/customer/reviews` | Yes (JWT / Guest) | `UseGuards` |
| `GET` | `/customer/reviews/me` | Yes (JWT / Guest) | `UseGuards` |
| `PATCH` | `/customer/reviews/:reviewId` | Yes (JWT / Guest) | `UseGuards` |
| `DELETE` | `/customer/reviews/:reviewId` | Yes (JWT / Guest) | `UseGuards` |
| `POST` | `/customer/reviews/:reviewId/vote` | Yes (JWT / Guest) | `UseGuards` |
| `GET` | `/customer/products/:productId/questions` | Yes (JWT / Guest) | `ApiOperation` |
| `POST` | `/customer/questions` | Yes (JWT / Guest) | `UseGuards` |

#### Module: `search-history` (4 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/customer/search-history` | Yes (JWT / Guest) | `ApiOperation` |
| `POST` | `/customer/search-history` | Yes (JWT / Guest) | `HttpCode` |
| `DELETE` | `/customer/search-history/:id` | Yes (JWT / Guest) | `ApiOperation` |
| `DELETE` | `/customer/search-history` | Yes (JWT / Guest) | `ApiOperation` |

#### Module: `settings` (1 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/customer/settings` | Public | `ApiOperation` |

#### Module: `shipping` (4 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/customer/shipping/options` | Public | `ApiOperation` |
| `POST` | `/customer/shipping/quote` | Public | `Throttle` |
| `GET` | `/customer/shipping/place` | Public | `Throttle` |
| `GET` | `/customer/shipping/search` | Public | `Throttle` |

#### Module: `support` (5 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/customer/support-tickets` | Yes (JWT / Guest) | `HttpCode` |
| `GET` | `/customer/support-tickets` | Yes (JWT / Guest) | `ApiOperation` |
| `GET` | `/customer/support-tickets/:id` | Yes (JWT / Guest) | `ApiOperation` |
| `POST` | `/customer/support-tickets/:id/messages` | Yes (JWT / Guest) | `HttpCode` |
| `POST` | `/customer/support-tickets/:id/close` | Yes (JWT / Guest) | `HttpCode` |

#### Module: `uploads` (2 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/customer/uploads/review-images` | Yes (JWT / Guest) | `HttpCode` |
| `DELETE` | `/customer/uploads/:id` | Yes (JWT / Guest) | `HttpCode` |

#### Module: `wishlist` (4 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/customer/wishlist` | Yes (JWT / Guest) | `ApiOperation` |
| `GET` | `/customer/wishlist/check/:productId` | Yes (JWT / Guest) | `ApiOperation` |
| `POST` | `/customer/wishlist/:productId` | Yes (JWT / Guest) | `HttpCode` |
| `DELETE` | `/customer/wishlist/:productId` | Yes (JWT / Guest) | `HttpCode` |

### 3.2 Admin & Staff API Endpoints (241 Endpoints)

#### Module: `activity-logs` (5 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/admin/activity-logs` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/activity-logs/stats` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/activity-logs/export` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/activity-logs/entity/:entityType/:entityId` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/activity-logs/:id` | Yes (Admin/Staff JWT) | `ApiOperation` |

#### Module: `audit-logs` (3 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/admin/audit-logs` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/audit-logs/types` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/audit-logs/export` | Yes (Admin/Staff JWT) | `ApiOperation` |

#### Module: `admin-auth` (11 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/admin/auth/login` | Yes (Admin/Staff JWT) | `Throttle` |
| `POST` | `/admin/auth/verify-2fa` | Yes (Admin/Staff JWT) | `Throttle` |
| `POST` | `/admin/auth/refresh` | Yes (Admin/Staff JWT) | `Throttle` |
| `POST` | `/admin/auth/logout` | Yes (Admin/Staff JWT) | `UseGuards` |
| `GET` | `/admin/auth/me` | Yes (Admin/Staff JWT) | `UseGuards` |
| `PATCH` | `/admin/auth/me` | Yes (Admin/Staff JWT) | `UseGuards` |
| `POST` | `/admin/auth/change-password` | Yes (Admin/Staff JWT) | `UseGuards` |
| `POST` | `/admin/auth/forgot-password` | Yes (Admin/Staff JWT) | `Throttle` |
| `POST` | `/admin/auth/reset-password/verify` | Yes (Admin/Staff JWT) | `Throttle` |
| `POST` | `/admin/auth/reset-password` | Yes (Admin/Staff JWT) | `Throttle` |
| `POST` | `/admin/auth/seed-admin` | Yes (Admin/Staff JWT) | `Throttle` |

#### Module: `back-in-stock` (5 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/admin/back-in-stock/summary` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/back-in-stock` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/back-in-stock/requests` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `POST` | `/admin/back-in-stock/notify` | Yes (Admin/Staff JWT) | `HttpCode` |
| `DELETE` | `/admin/back-in-stock/:id` | Yes (Admin/Staff JWT) | `HttpCode` |

#### Module: `banners` (6 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `PUT` | `/admin/banners/reorder` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/banners` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/banners/:id` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `POST` | `/admin/banners` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PATCH` | `/admin/banners/:id` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `DELETE` | `/admin/banners/:id` | Yes (Admin/Staff JWT) | `HttpCode` |

#### Module: `brand` (6 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `PUT` | `/admin/brand/reorder` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `POST` | `/admin/brand` | Yes (Admin/Staff JWT) | `ResponseMessage` |
| `GET` | `/admin/brand` | Yes (Admin/Staff JWT) | `ResponseMessage` |
| `GET` | `/admin/brand/:id` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PATCH` | `/admin/brand/:id` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `DELETE` | `/admin/brand/:id` | Yes (Admin/Staff JWT) | `ApiOperation` |

#### Module: `category` (6 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `PUT` | `/admin/category/reorder` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `POST` | `/admin/category` | Yes (Admin/Staff JWT) | `ResponseMessage` |
| `GET` | `/admin/category` | Yes (Admin/Staff JWT) | `ResponseMessage` |
| `GET` | `/admin/category/:id` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PATCH` | `/admin/category/:id` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `DELETE` | `/admin/category/:id` | Yes (Admin/Staff JWT) | `ApiOperation` |

#### Module: `contact-messages` (5 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/admin/contact-messages` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/contact-messages/:id` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PATCH` | `/admin/contact-messages/:id` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `POST` | `/admin/contact-messages/:id/reply` | Yes (Admin/Staff JWT) | `HttpCode` |
| `DELETE` | `/admin/contact-messages/:id` | Yes (Admin/Staff JWT) | `HttpCode` |

#### Module: `coupons` (9 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/admin/coupons` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `POST` | `/admin/coupons/bulk-generate` | Yes (Admin/Staff JWT) | `HttpCode` |
| `GET` | `/admin/coupons/:id` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/coupons/:id/usage` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/coupons/:id/usage/export` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/coupons/:id/users` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `POST` | `/admin/coupons` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PATCH` | `/admin/coupons/:id` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `DELETE` | `/admin/coupons/:id` | Yes (Admin/Staff JWT) | `HttpCode` |

#### Module: `dashboard` (11 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/admin/dashboard` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/dashboard/analytics` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/dashboard/overview` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/dashboard/sales` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/dashboard/top-products` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/dashboard/top-categories` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/dashboard/revenue-by-payment-method` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/dashboard/revenue-by-zone` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/dashboard/revenue-by-source` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/dashboard/new-customers` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/dashboard/low-stock` | Yes (Admin/Staff JWT) | `ApiOperation` |

#### Module: `deliveries` (18 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/admin/deliveries/board` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/deliveries/riders` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/deliveries/stats` | Yes (Admin/Staff JWT) | `RequirePermissions` |
| `GET` | `/admin/deliveries/cash` | Yes (Admin/Staff JWT) | `RequirePermissions` |
| `POST` | `/admin/deliveries/cash/handover` | Yes (Admin/Staff JWT) | `RequirePermissions` |
| `GET` | `/admin/deliveries/settlements` | Yes (Admin/Staff JWT) | `RequirePermissions` |
| `POST` | `/admin/deliveries/settlements` | Yes (Admin/Staff JWT) | `RequirePermissions` |
| `PATCH` | `/admin/deliveries/settlements/:id/settle` | Yes (Admin/Staff JWT) | `RequirePermissions` |
| `POST` | `/admin/deliveries/assign` | Yes (Admin/Staff JWT) | `HttpCode` |
| `POST` | `/admin/deliveries/:id/unassign` | Yes (Admin/Staff JWT) | `HttpCode` |
| `GET` | `/admin/deliveries/:id` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/deliveries` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/deliveries/summary` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `POST` | `/admin/deliveries/:id/accept` | Yes (Admin/Staff JWT) | `HttpCode` |
| `POST` | `/admin/deliveries/:id/picked-up` | Yes (Admin/Staff JWT) | `HttpCode` |
| `POST` | `/admin/deliveries/:id/on-the-way` | Yes (Admin/Staff JWT) | `HttpCode` |
| `POST` | `/admin/deliveries/:id/delivered` | Yes (Admin/Staff JWT) | `HttpCode` |
| `POST` | `/admin/deliveries/:id/failed` | Yes (Admin/Staff JWT) | `HttpCode` |

#### Module: `featured-products` (2 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/admin/featured-products` | Yes (Admin/Staff JWT) | `RequirePermissions` |
| `PUT` | `/admin/featured-products` | Yes (Admin/Staff JWT) | `RequirePermissions` |

#### Module: `flash-deals` (5 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/admin/flash-deals` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/flash-deals/:id` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `POST` | `/admin/flash-deals` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PATCH` | `/admin/flash-deals/:id` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `DELETE` | `/admin/flash-deals/:id` | Yes (Admin/Staff JWT) | `HttpCode` |

#### Module: `inventory` (8 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/admin/inventory/summary` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/inventory/items` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/inventory/low-stock` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/inventory/out-of-stock` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `POST` | `/admin/inventory/adjust` | Yes (Admin/Staff JWT) | `HttpCode` |
| `GET` | `/admin/inventory/logs` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/inventory/export` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `POST` | `/admin/inventory/bulk-update` | Yes (Admin/Staff JWT) | `HttpCode` |

#### Module: `admin-locations` (4 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/admin/location-requests` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/location-requests` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/location-requests/customer/:userId` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/location-requests/:id` | Yes (Admin/Staff JWT) | `ApiOperation` |

#### Module: `media` (4 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/admin/uploads` | Yes (Admin/Staff JWT) | `HttpCode` |
| `GET` | `/admin/uploads` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/uploads/:id/usage` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `DELETE` | `/admin/uploads/:id` | Yes (Admin/Staff JWT) | `HttpCode` |

#### Module: `medicine` (11 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/admin/medicine/lookup` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/medicine/detail` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/medicine/list` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/medicine/stats` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `POST` | `/admin/medicine/sync-price/:productId` | Yes (Admin/Staff JWT) | `ResponseMessage` |
| `POST` | `/admin/medicine/audit-drift` | Yes (Admin/Staff JWT) | `ResponseMessage` |
| `POST` | `/admin/medicine/accept-drift/:productId` | Yes (Admin/Staff JWT) | `ResponseMessage` |
| `POST` | `/admin/medicine/accept-all-drifts` | Yes (Admin/Staff JWT) | `ResponseMessage` |
| `GET` | `/admin/medicine/discount-settings` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `POST` | `/admin/medicine/global-discount` | Yes (Admin/Staff JWT) | `ResponseMessage` |
| `POST` | `/admin/medicine/single-pricing/:productId` | Yes (Admin/Staff JWT) | `ResponseMessage` |

#### Module: `newsletter` (3 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/admin/newsletter` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/newsletter/export` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `DELETE` | `/admin/newsletter/:id` | Yes (Admin/Staff JWT) | `HttpCode` |

#### Module: `admin-notifications` (6 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/admin/notifications` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/notifications/unread-count` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/notifications/summary` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PATCH` | `/admin/notifications/read-all` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PATCH` | `/admin/notifications/:id/read` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `DELETE` | `/admin/notifications/:id` | Yes (Admin/Staff JWT) | `HttpCode` |

#### Module: `orders` (23 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/admin/orders` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/orders/stats` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/orders/export` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PUT` | `/admin/orders/:id/delivery-fee` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PUT` | `/admin/orders/:id/delivery-pin` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/orders/:id/route` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/orders/shipping-quote` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `POST` | `/admin/orders` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PATCH` | `/admin/orders/bulk-status` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `POST` | `/admin/orders/bulk-delete` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/orders/:id` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/orders/:id/invoice` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PATCH` | `/admin/orders/:id/status` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PATCH` | `/admin/orders/:id/shipping` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PATCH` | `/admin/orders/:id/notes` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PUT` | `/admin/orders/:id/address` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PUT` | `/admin/orders/:id/items` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PUT` | `/admin/orders/:id/weights` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PATCH` | `/admin/orders/:id/verify-payment` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/orders/:id/payments` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `POST` | `/admin/orders/:id/payments` | Yes (Admin/Staff JWT) | `HttpCode` |
| `POST` | `/admin/orders/:id/refunds` | Yes (Admin/Staff JWT) | `HttpCode` |
| `DELETE` | `/admin/orders/:id` | Yes (Admin/Staff JWT) | `ApiOperation` |

#### Module: `admin-prescriptions` (3 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/admin/prescriptions` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PATCH` | `/admin/prescriptions/:id/status` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `DELETE` | `/admin/prescriptions/:id` | Yes (Admin/Staff JWT) | `ApiOperation` |

#### Module: `product` (21 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/admin/products` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/products/stats` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/products/tags` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PUT` | `/admin/products/daily-sheet` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `POST` | `/admin/products/bulk-delete` | Yes (Admin/Staff JWT) | `HttpCode` |
| `GET` | `/admin/products/:id` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `POST` | `/admin/products` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PATCH` | `/admin/products/:id` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `POST` | `/admin/products/:id/duplicate` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `DELETE` | `/admin/products/:id` | Yes (Admin/Staff JWT) | `HttpCode` |
| `PUT` | `/admin/products/:id/tags` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/products/:id/variants` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `POST` | `/admin/products/:id/variants` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PATCH` | `/admin/products/:id/variants/:variantId` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `DELETE` | `/admin/products/:id/variants/:variantId` | Yes (Admin/Staff JWT) | `HttpCode` |
| `GET` | `/admin/products/:id/images` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `POST` | `/admin/products/:id/images` | Yes (Admin/Staff JWT) | `HttpCode` |
| `POST` | `/admin/products/:id/images/attach` | Yes (Admin/Staff JWT) | `HttpCode` |
| `PUT` | `/admin/products/:id/images/order` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PATCH` | `/admin/products/:id/images/:imageId` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `DELETE` | `/admin/products/:id/images/:imageId` | Yes (Admin/Staff JWT) | `HttpCode` |

#### Module: `reports` (8 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/admin/reports/deliveries-by-rider` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/reports/deliveries-by-day` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/reports/cod-reconciliation` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/reports/sales` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/reports/product-performance` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/reports/stock-valuation` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/reports/coupon-performance` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/reports/customers` | Yes (Admin/Staff JWT) | `ApiOperation` |

#### Module: `returns` (3 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/admin/returns` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/returns/:id` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PATCH` | `/admin/returns/:id/status` | Yes (Admin/Staff JWT) | `ApiOperation` |

#### Module: `reviews` (9 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/admin/reviews` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/reviews/stats` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PATCH` | `/admin/reviews/bulk-status` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/reviews/:id` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PATCH` | `/admin/reviews/:id/status` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `DELETE` | `/admin/reviews/:id` | Yes (Admin/Staff JWT) | `HttpCode` |
| `GET` | `/admin/questions` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PUT` | `/admin/questions/:id/answer` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `DELETE` | `/admin/questions/:id` | Yes (Admin/Staff JWT) | `HttpCode` |

#### Module: `settings` (12 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/admin/settings` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/settings/:group` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PUT` | `/admin/settings/site` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PUT` | `/admin/settings/payment` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PUT` | `/admin/settings/delivery` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PUT` | `/admin/settings/maps` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `POST` | `/admin/settings/maps/test` | Yes (Admin/Staff JWT) | `HttpCode` |
| `GET` | `/admin/settings/maps/usage` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PUT` | `/admin/settings/returns` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PUT` | `/admin/settings/loyalty` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PUT` | `/admin/settings/email` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `POST` | `/admin/settings/email/test` | Yes (Admin/Staff JWT) | `HttpCode` |

#### Module: `staff` (6 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/admin/staff/meta` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/staff` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/staff/:id` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `POST` | `/admin/staff` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PATCH` | `/admin/staff/:id` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `POST` | `/admin/staff/:id/reset-password` | Yes (Admin/Staff JWT) | `HttpCode` |

#### Module: `support-tickets` (4 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/admin/support-tickets` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/support-tickets/:id` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `POST` | `/admin/support-tickets/:id/reply` | Yes (Admin/Staff JWT) | `HttpCode` |
| `PATCH` | `/admin/support-tickets/:id` | Yes (Admin/Staff JWT) | `ApiOperation` |

#### Module: `units` (5 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/admin/units` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PUT` | `/admin/units/reorder` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `POST` | `/admin/units` | Yes (Admin/Staff JWT) | `ResponseMessage` |
| `PATCH` | `/admin/units/:id` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `DELETE` | `/admin/units/:id` | Yes (Admin/Staff JWT) | `ApiOperation` |

#### Module: `users` (17 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/admin/users` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/users/export` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/users/password-reset-requests` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PATCH` | `/admin/users/password-reset-requests/:id` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/users/:id` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/users/:id/orders` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/users/:id/addresses` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/users/:id/tickets` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/users/:id/reviews` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/users/:id/coupons` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `GET` | `/admin/users/:id/notes` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `POST` | `/admin/users/:id/notes` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `DELETE` | `/admin/users/:id/notes/:noteId` | Yes (Admin/Staff JWT) | `HttpCode` |
| `PATCH` | `/admin/users/:id/status` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PATCH` | `/admin/users/:id/blacklist` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `POST` | `/admin/users/:id/reset-password` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `PATCH` | `/admin/users/:id/role` | Yes (Admin/Staff JWT) | `RequirePermissions` |

#### Module: `admin-storefront` (2 endpoints)
| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/admin/storefront/sync` | Yes (Admin/Staff JWT) | `ApiOperation` |
| `POST` | `/admin/storefront/sync` | Yes (Admin/Staff JWT) | `ApiOperation` |

## 4. Database Schema Entities & Relations (59 Models, 34 Enums)

### 4.1 Core Entities & Fields
1. **User**: `id`, `phone`, `email`, `name`, `passwordHash`, `role` (`USER` | `STAFF` | `ADMIN` | `SUPER_ADMIN`), `status`, `avatarUrl`, `language`, `permissions` (`string[]`), `pointsBalance`.
2. **Product**: `id`, `slug`, `name`, `nameBn`, `description`, `descriptionBn`, `price`, `regularPrice`, `costPrice`, `sku`, `stock`, `trackStock`, `status` (`ACTIVE` | `INACTIVE` | `OUT_OF_STOCK` | `DRAFT`), `categoryId`, `brandId`, `unitId`, `isFeatured`, `badges` (`string[]`), `hasVariants`.
3. **MedicineMeta**: `productId`, `genericName`, `strength`, `dosageForm`, `manufacturer`, `medicineType` (`OTC` | `PRESCRIPTION`), `indications`, `sideEffects`.
4. **Order**: `id`, `orderNumber`, `userId`, `guestToken`, `status` (`PENDING` through `DELIVERED`), `paymentMethod` (`COD`, `BKASH`, `NAGAD`, `ROCKET`), `paymentStatus` (`PENDING`, `PAID`, `REFUNDED`), `subtotal`, `discountTotal`, `shippingFee`, `total`, `shippingAddress`, `couponId`, `notes`.
5. **OrderItem**: `id`, `orderId`, `productId`, `variantId`, `productName`, `productImage`, `unitPrice`, `quantity`, `totalPrice`.
6. **Payment**: `id`, `orderId`, `method`, `status`, `amount`, `transactionId`, `senderPhone`, `verifiedBy`, `verifiedAt`.
7. **Delivery**: `id`, `orderId`, `riderId`, `status` (`ASSIGNED`, `ACCEPTED`, `PICKED_UP`, `ON_THE_WAY`, `DELIVERED`, `FAILED`), `assignedAt`, `deliveredAt`.
8. **DeliveryEvent**: `id`, `deliveryId`, `status`, `latitude`, `longitude`, `notes`, `timestamp`.
9. **Prescription**: `id`, `userId`, `phone`, `fileUrl`, `notes`, `status` (`PENDING`, `REVIEWED`, `ORDER_CREATED`, `REJECTED`).
10. **CustomerLocation**: `id`, `userId`, `guestToken`, `latitude`, `longitude`, `accuracyM`, `source` (`GPS` | `PIN` | `SEARCH` | `LINK`), `address`, `zone`.
11. **Coupon & CouponUsage**: `id`, `code`, `discountType` (`PERCENTAGE` | `FIXED`), `discountValue`, `minOrderAmount`, `maxDiscount`, `usageLimit`, `expiresAt`.
12. **Review & ReviewHelpfulVote**: `id`, `productId`, `userId`, `rating`, `comment`, `images` (`string[]`), `status` (`APPROVED`, `PENDING`), `isVerifiedPurchase`.
13. **ReturnRequest & ReturnItem**: `id`, `orderId`, `userId`, `status` (`REQUESTED`, `APPROVED`, `REJECTED`, `COMPLETED`), `reason`, `refundMethod`, `refundDetails`, `images`.
14. **SupportTicket & SupportTicketMessage**: `id`, `ticketNumber`, `userId`, `subject`, `category`, `status` (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`), `messages`.
15. **Address**: `id`, `userId`, `label` (`Home`, `Office`), `recipientName`, `phone`, `address`, `city`, `postalCode`, `isDefault`, `latitude`, `longitude`.
16. **Banner & SiteSetting**: Carousel banners, promo slots, site configuration, shipping fees, free shipping threshold, business contact numbers.

---

## 5. Authentication & Session Architecture

### 5.1 Customer Authentication Flow
1. **Credentials**: Bangladeshi mobile phone (+880...) or Email + Password.
2. **Registration**: `POST /customer/auth/register` with `{ name, email, phone, password, guestToken }`.
   - Merges guest cart and guest recently-viewed records into the new account.
   - Returns `{ userId, accessToken, refreshToken, user }`.
3. **Login**: `POST /customer/auth/login` with `{ emailOrPhone, password, guestToken }`.
   - Merges guest cart and guest recently-viewed items automatically.
4. **Token Storage & Security**:
   - `accessToken` (JWT, short-lived) stored in memory / fast-access secure storage.
   - `refreshToken` stored in hardware-backed `expo-secure-store` (Keystore on Android, Keychain on iOS).
5. **Token Rotation**:
   - Axios response interceptor detects `401 Unauthorized`.
   - Queues pending requests and calls `POST /customer/auth/refresh` with `{ userId, refreshToken }`.
   - Updates tokens and retries failed requests without interrupting the user.
6. **Password Recovery**:
   - Request reset link / OTP: `POST /customer/auth/forgot-password`.
   - Token verification: `GET /customer/auth/reset-password/verify?token=...`.
   - Set new password: `POST /customer/auth/reset-password`.

### 5.2 Staff & Admin Authentication Flow
- Identifier (email/phone) + Password → If 2FA enabled, returns temporary token.
- `POST /admin/auth/verify-2fa` with 6-digit email OTP.
- Staff permissions array determines accessible feature tabs (e.g. delivery rider views `MyDeliveries`).

---

## 6. Third-Party Integrations & Services
1. **Object Storage**: Cloudflare R2 bucket via S3 API for product imagery, banners, customer avatars, review photos, and prescription scans.
2. **Payment Methods**: Manual mobile financial services (bKash, Nagad, Rocket) with merchant wallet numbers and customer transaction ID reconciliation.
3. **Location & Maps**: OpenStreetMap reverse geocoding API on backend; native Google Maps / Apple Maps on mobile with GPS hardware geolocation.
4. **Push Notifications**: Expo Notifications service integrating with Firebase Cloud Messaging (FCM) on Android and Apple Push Notification service (APNs) on iOS.
5. **Sound & Haptics**: Native vibration haptic feedback (`expo-haptics`) on add-to-cart, quantity changes, and successful order submission.

---

## 7. Web Screen vs. Mobile Architecture Translation

| Web Route / Feature | Mobile Screen / Pattern | Native Enhancement |
| :--- | :--- | :--- |
| `/(home)/(landing)` | `app/(tabs)/index.tsx` (Home Tab) | Sticky animated search header, pull-to-refresh, skeleton hero, FlashList vertical feed |
| `/category/[slug]`, `/products` | `app/(tabs)/categories.tsx` | 2-column drilldown (root categories on left rail, subcategories & product grid on right) |
| `/products/[slug]` | `app/product/[slug].tsx` (Stack) | Fullscreen swiper with pinch-to-zoom, sticky bottom cart action bar, haptic feedback |
| Product Quick View Modal | `components/product/ProductBottomSheet.tsx` | Native gesture-driven bottom sheet (Gorhom Bottom Sheet) |
| `/cart` | `app/(tabs)/cart.tsx` (Cart Tab) | Swipe-to-delete items, optimistic quantity steppers, live delivery fee progress bar |
| `/checkout` | `app/checkout/index.tsx` (Stack) | Native address selector, GPS auto-fill with 1-tap, clipboard paste for TrxID |
| `/track-order`, `/orders/[id]` | `app/orders/[id].tsx` (Stack) | Native order timeline stepper, live map view with delivery marker, direct call rider |
| `/account` | `app/(tabs)/account.tsx` (Account Tab) | Native menu list with icons, biometric login toggle, dark mode switch, language switch |
| `/share-location` | `app/location/picker.tsx` (Modal) | Native GPS location button (`expo-location`), draggable pin on native map |
| Prescription Upload | `app/prescription/upload.tsx` | Camera capture (`expo-camera`), photo library picker (`expo-image-picker`) |
| Support Tickets | `app/support/[id].tsx` | Keyboard-aware chat thread, instant local optimistic message append |

---

## 8. Resolved Architectural Decisions

1. **App Identity & Dual-Mode Architecture**:
   - **Mode 1 (Primary)**: Customer Storefront covering complete e-commerce experience (Grocery, Fresh Produce, Meat/Fish, Medicine & Prescriptions, Cart, GPS Location, Mobile Banking Checkout, Order Tracking, Loyalty, Support).
   - **Mode 2 (Role-Gated)**: Delivery Rider Portal (`(rider)` routes) activated automatically when a user with `STAFF` or `ADMIN` role with delivery permissions logs in. Covers Assigned Deliveries feed, Customer calling, Turn-by-Turn Map navigation, Delivery Status transitions, and COD Cash Collection reconciliation. Full Admin catalog/CMS operations remain on the desktop web for operational data density.
2. **Project Directory**:
   - Dedicated workspace directory: `bazar-shodai-app` (completely isolated from `server`, `frontend`, and `dashboard`).
3. **Styling Selection**:
   - **NativeWind v4** with Tailwind CSS: Directly reuses existing web design tokens (`brand-fresh`, `brand-charcoal`, `on-fresh`, `muted-foreground`, border/radius tokens) with zero runtime translation overhead and 100% theme fidelity.

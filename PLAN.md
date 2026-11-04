# PLAN.md: Master Implementation Plan for Bazar Shodai Mobile App

## 1. Project Overview & Architecture Blueprint

- **Target Platforms**: Android First, iOS Ready.
- **Directory**: `bazar-shodai-app` (standalone project isolated from backend, frontend, and dashboard).
- **Architecture Strategy**: Dual-Mode Mobile App:
  1. **Customer Storefront (Default)**: Full retail catalog, prescription upload, cart synchronization, GPS location sharing, bKash/Nagad/Rocket/COD checkout, live tracking, returns, loyalty rewards, and customer care.
  2. **Delivery Rider Portal (Role-Gated)**: Assigned delivery queue, 1-tap customer call, GPS turn-by-turn navigation via Google Maps / Apple Maps, live delivery status transitions, and cash reconciliation.
- **Core Stack**:
  - Expo SDK 52+ with React Native New Architecture & Hermes engine
  - Expo Router v4 (file-based navigation with native tabs & stack modaling)
  - NativeWind v4 (Tailwind CSS v3/v4 compiler with direct 1:1 token reuse from web storefront)
  - TanStack Query v5 (server cache, optimistic mutations, offline persistence)
  - Zustand v5 (client UI state: cart, guest token, auth, theme, active filters)
  - FlashList by Shopify (60fps recycling list engine)
  - React Native Reanimated v3 + React Native Gesture Handler v2
  - MMKV (fast key-value storage for cart/cache) + Expo Secure Store (JWT tokens)
  - Axios with automated token refresh rotation & retry interceptors
  - Expo Location, Expo Image, Expo Haptics, Expo Notifications

---

## Milestone 1: Project Initialization & Monorepo Isolation (Phases 1-6)

### Phase 1: Expo App Initialization

- **Goal**: Initialize the standalone Expo project with TypeScript template in strict mode.
- **Files**: `bazar-shodai-app/package.json`, `bazar-shodai-app/tsconfig.json`, `bazar-shodai-app/app.json`
- **API**: None.
- **Acceptance Criteria**: Expo app runs via `npx expo start` with 0 TypeScript errors.
- **Dependencies**: None.
- **Status**: [x] Done

### Phase 2: Strict TypeScript & Path Aliases

- **Goal**: Configure path aliases (`@/*` pointing to `./src/*`) and strict type checking rules.
- **Files**: `bazar-shodai-app/tsconfig.json`, `bazar-shodai-app/babel.config.js`
- **API**: None.
- **Acceptance Criteria**: Absolute imports like `@/components/ui/Button` resolve cleanly.
- **Dependencies**: Phase 1.
- **Status**: [x] Done

### Phase 3: ESLint, Prettier & Git Ignore Configuration

- **Goal**: Establish deterministic code style, formatting, and ignore rules.
- **Files**: `bazar-shodai-app/eslint.config.js`, `bazar-shodai-app/.prettierrc`, `bazar-shodai-app/.gitignore`
- **API**: None.
- **Acceptance Criteria**: `npm run lint` passes with 0 warnings.
- **Dependencies**: Phase 2.
- **Status**: [x] Done

### Phase 4: Environment Variables Setup (`.env`)

- **Goal**: Configure environment support for dev, staging, and production API base URLs.
- **Files**: `bazar-shodai-app/src/config/env.ts`, `bazar-shodai-app/.env.example`, `bazar-shodai-app/.env`
- **API**: None.
- **Acceptance Criteria**: Typed `ENV.API_BASE_URL` validates using Zod at app launch.
- **Dependencies**: Phase 1.
- **Status**: [x] Done

### Phase 5: New Architecture & Hermes Verification

- **Goal**: Verify React Native New Architecture (Fabric + TurboModules) and Hermes engine enabled.
- **Files**: `bazar-shodai-app/app.json`
- **API**: None.
- **Acceptance Criteria**: App config has `newArchEnabled: true` and `jsEngine: "hermes"`.
- **Dependencies**: Phase 1.
- **Status**: [x] Done

### Phase 6: Folder Structure Scaffolding

- **Goal**: Establish the standard enterprise feature-based directory structure.
- **Files**: `bazar-shodai-app/src/{api,assets,components,config,constants,features,hooks,navigation,store,types,utils}`
- **API**: None.
- **Acceptance Criteria**: Clean directory layout matching architecture guidelines.
- **Dependencies**: Phase 1.
- **Status**: [x] Done

---

## Milestone 2: Design Tokens, Theme & NativeWind Setup (Phases 7-12)

### Phase 7: NativeWind v4 Installation & Configuration

- **Goal**: Install and configure NativeWind v4 with Tailwind CSS compiler and Metro plugins.
- **Files**: `bazar-shodai-app/tailwind.config.js`, `bazar-shodai-app/metro.config.js`, `bazar-shodai-app/global.css`, `bazar-shodai-app/babel.config.js`, `bazar-shodai-app/nativewind-env.d.ts`
- **API**: None.
- **Acceptance Criteria**: Test component renders styled with Tailwind utility classes.
- **Dependencies**: Phase 6.
- **Status**: [x] Done

### Phase 8: Color Tokens Porting from Web Storefront

- **Goal**: Port exact web color tokens (`brand-fresh`, `brand-charcoal`, `primary`, `secondary`, `card`, `border`) into mobile theme.
- **Files**: `bazar-shodai-app/src/constants/colors.ts`, `bazar-shodai-app/tailwind.config.js`, `bazar-shodai-app/global.css`
- **API**: None.
- **Acceptance Criteria**: Color palettes match `frontend/tailwind.config.ts` 1:1.
- **Dependencies**: Phase 7.
- **Status**: [x] Done

### Phase 9: Typography & Font Scaling System

- **Goal**: Configure Outfit and Inter font families with accessibility-aware dynamic font scaling.
- **Files**: `bazar-shodai-app/src/constants/typography.ts`, `bazar-shodai-app/src/hooks/useFonts.ts`
- **API**: None.
- **Acceptance Criteria**: Fonts load via `expo-font` before splash screen dismisses.
- **Dependencies**: Phase 8.
- **Status**: [x] Done

### Phase 10: Dark Mode Theme Provider

- **Goal**: Implement system-preference dark mode with manual toggle (Light / Dark / System).
- **Files**: `bazar-shodai-app/src/store/useThemeStore.ts`, `bazar-shodai-app/src/components/theme/ThemeProvider.tsx`
- **API**: None.
- **Acceptance Criteria**: Dark mode toggles instantly without layout flicker.
- **Dependencies**: Phase 8.
- **Status**: [x] Done

### Phase 11: Spacing, Radius & Elevation Tokens

- **Goal**: Standardize touch target dimensions (min 44px), border radii, and native Android elevation shadows.
- **Files**: `bazar-shodai-app/src/constants/layout.ts`
- **API**: None.
- **Acceptance Criteria**: Reusable layout constants exported and typed.
- **Dependencies**: Phase 8.
- **Status**: [x] Done

### Phase 12: Splash Screen & App Icon Branding

- **Goal**: Configure native splash screen with logo and color-matched Android adaptive icons.
- **Files**: `bazar-shodai-app/assets/icon.png`, `bazar-shodai-app/assets/splash-icon.png`, `bazar-shodai-app/src/utils/splash.ts`, `bazar-shodai-app/app.json`
- **API**: None.
- **Acceptance Criteria**: Smooth transition from OS boot to React Native mount.
- **Dependencies**: Phase 9.
- **Status**: [x] Done

---

## Milestone 3: Core Storage, Security & Network Architecture (Phases 13-19)

### Phase 13: MMKV Fast Key-Value Storage

- **Goal**: Setup `react-native-mmkv` for synchronous, ultra-fast client state persistence.
- **Files**: `bazar-shodai-app/src/utils/storage.ts`, `bazar-shodai-app/src/store/useThemeStore.ts`
- **API**: None.
- **Acceptance Criteria**: Read/write benchmarks execute in <1ms without async delay.
- **Dependencies**: Phase 6.
- **Status**: [x] Done

### Phase 14: Secure Token Vault (Expo Secure Store)

- **Goal**: Setup hardware-backed encrypted storage for customer JWT access & refresh tokens.
- **Files**: `bazar-shodai-app/src/utils/secureStore.ts`
- **API**: None.
- **Acceptance Criteria**: Tokens encrypted on device Keystore/Keychain.
- **Dependencies**: Phase 6.
- **Status**: [x] Done

### Phase 15: Guest Token UUID Engine

- **Goal**: Implement persistent device UUID generator for anonymous guest shopping cart and location tracking.
- **Files**: `bazar-shodai-app/src/utils/guestToken.ts`
- **API**: None.
- **Acceptance Criteria**: Guest token persists across app restarts and attaches to `X-Guest-Token` header.
- **Dependencies**: Phase 13.
- **Status**: [x] Done

### Phase 16: Axios Network Client & Interceptors

- **Goal**: Create configured Axios instance with base URL, timeout, and automatic header injection.
- **Files**: `bazar-shodai-app/src/api/client.ts`
- **API**: `GET /ping`
- **Acceptance Criteria**: Requests automatically attach `Authorization: Bearer <token>` and `X-Guest-Token`.
- **Dependencies**: Phases 14, 15.
- **Status**: [x] Done

### Phase 17: Silent Token Refresh & Queue Interceptor

- **Goal**: Handle 401 Unauthorized by executing `POST /customer/auth/refresh` and replaying queued requests.
- **Files**: `bazar-shodai-app/src/api/interceptors.ts`
- **API**: `POST /customer/auth/refresh`
- **Acceptance Criteria**: Seamless token renewal without kicking active users to login screen.
- **Dependencies**: Phase 16.
- **Status**: [x] Done

### Phase 18: TanStack Query v5 Setup & Offline Persistence

- **Goal**: Initialize `QueryClient` with exponential backoff retry and MMKV hydration.
- **Files**: `bazar-shodai-app/src/api/queryClient.ts`, `bazar-shodai-app/src/components/providers/QueryProvider.tsx`
- **API**: None.
- **Acceptance Criteria**: Cached queries rehydrate instantly when app is launched offline.
- **Dependencies**: Phase 13.
- **Status**: [x] Done

### Phase 19: Global API Error & Network Banner Handler

- **Goal**: Standardize error normalization (validation errors, 500 server errors, offline state banner).
- **Files**: `bazar-shodai-app/src/api/errorHandler.ts`, `bazar-shodai-app/src/components/ui/NetworkBanner.tsx`
- **API**: None.
- **Acceptance Criteria**: Shows smooth offline pill when device loses internet connectivity.
- **Dependencies**: Phase 16.
- **Status**: [x] Done

---

## Milestone 4: Design System Primitives & UI Atoms (Phases 20-33)

### Phase 20: Accessible Button Atom

- **Goal**: Create primary, secondary, outline, ghost, and danger buttons with loading spinner and haptics.
- **Files**: `bazar-shodai-app/src/components/ui/Button.tsx`
- **API**: None.
- **Acceptance Criteria**: Supports disabled state, size variants, minimum 44px touch target, and active press scale animation.
- **Dependencies**: Phase 8.
- **Status**: [x] Done

### Phase 21: Typography & Heading Atoms

- **Goal**: Create `Text`, `Heading`, `Subheading`, and `Caption` primitives enforcing font scale and colors.
- **Files**: `bazar-shodai-app/src/components/ui/Typography.tsx`
- **API**: None.
- **Acceptance Criteria**: Text respects Android system font scaling without breaking layouts.
- **Dependencies**: Phase 9.
- **Status**: [x] Done

### Phase 22: Form Input & Floating Label Atom

- **Goal**: Text input with clear button, password visibility toggle, leading/trailing icons, and error states.
- **Files**: `bazar-shodai-app/src/components/ui/Input.tsx`
- **API**: None.
- **Acceptance Criteria**: Seamless keyboard interaction and inline error validation display.
- **Dependencies**: Phase 20.
- **Status**: [x] Done

### Phase 23: Bangladeshi Phone Number Input Atom

- **Goal**: Input with pre-fixed `+880` country code, auto-formatting, and Bangladeshi mobile regex validation.
- **Files**: `bazar-shodai-app/src/components/ui/PhoneInput.tsx`
- **API**: None.
- **Acceptance Criteria**: Validates Grameenphone, Robi, Banglalink, Teletalk prefixes.
- **Dependencies**: Phase 22.
- **Status**: [x] Done

### Phase 24: Currency & Money Formatter Atom

- **Goal**: Standardized BDT (`৳`) currency renderer with English and Bengali numeral translation.
- **Files**: `bazar-shodai-app/src/components/ui/Price.tsx`, `bazar-shodai-app/src/utils/format.ts`
- **API**: None.
- **Acceptance Criteria**: Correctly renders `৳১,২৫৫` in Bengali and `৳1,255` in English.
- **Dependencies**: Phase 21.
- **Status**: [x] Done

### Phase 25: Badge & Tag Atom

- **Goal**: Badge component for product discounts, `NEW`, `HOT`, `BEST SELLER`, and stock statuses.
- **Files**: `bazar-shodai-app/src/components/ui/Badge.tsx`
- **API**: None.
- **Acceptance Criteria**: Port exact color styles from web `BADGE_STYLES`.
- **Dependencies**: Phase 8.
- **Status**: [x] Done

### Phase 26: Skeleton Loading Atom

- **Goal**: Shimmer animation primitive using Reanimated for cards, text blocks, and avatars.
- **Files**: `bazar-shodai-app/src/components/ui/Skeleton.tsx`
- **API**: None.
- **Acceptance Criteria**: Smooth 60fps shimmer running on native thread.
- **Dependencies**: Phase 8.
- **Status**: [x] Done

### Phase 27: Optimized Image Atom (expo-image)

- **Goal**: Wrapper for `expo-image` with progressive blurhash placeholder, disk caching, and fallback.
- **Files**: `bazar-shodai-app/src/components/ui/AppImage.tsx`
- **API**: None.
- **Acceptance Criteria**: Smooth fade-in on image load without visual jump.
- **Dependencies**: Phase 6.
- **Status**: [x] Done

### Phase 28: Icon Engine (Lucide Icons)

- **Goal**: Typed Lucide React Native icon integration with theme color bindings.
- **Files**: `bazar-shodai-app/src/components/ui/Icon.tsx`
- **API**: None.
- **Acceptance Criteria**: Seamless icon rendering with consistent sizing.
- **Dependencies**: Phase 8.
- **Status**: [x] Done

### Phase 29: Toast & Notification Snackbars

- **Goal**: Custom toast notification system for success, warning, error, and cart addition events.
- **Files**: `bazar-shodai-app/src/components/ui/Toast.tsx`, `bazar-shodai-app/src/store/useToastStore.ts`
- **API**: None.
- **Acceptance Criteria**: Smooth slide-down banner dismissible by swipe gesture.
- **Dependencies**: Phase 20.
- **Status**: [x] Done

### Phase 30: Card Container Primitive

- **Goal**: Reusable card wrapper with surface elevation, border tokens, and touchable feedback.
- **Files**: `bazar-shodai-app/src/components/ui/Card.tsx`
- **API**: None.
- **Acceptance Criteria**: Consistent padding, corner radius, and dark mode background.
- **Dependencies**: Phase 11.
- **Status**: [x] Done

### Phase 31: Empty State Graphic Atom

- **Goal**: Illustrated empty state component for empty cart, empty orders, search not found, and offline.
- **Files**: `bazar-shodai-app/src/components/ui/EmptyState.tsx`
- **API**: None.
- **Acceptance Criteria**: Features title, friendly description, and action button.
- **Dependencies**: Phase 20.
- **Status**: [x] Done

### Phase 32: Error Boundary & Crash Fallback

- **Goal**: React error boundary capturing render exceptions with reload action.
- **Files**: `bazar-shodai-app/src/components/shared/ErrorBoundary.tsx`
- **API**: None.
- **Acceptance Criteria**: Gracefully prevents app white-screen crashes.
- **Dependencies**: Phase 20.
- **Status**: [x] Done

### Phase 33: Tactile Haptics Service

- **Goal**: Centralized haptic feedback service wrapper around `expo-haptics`.
- **Files**: `bazar-shodai-app/src/services/haptics.ts`
- **API**: None.
- **Acceptance Criteria**: Provides light, medium, heavy, success, and error tactile pulses.
- **Dependencies**: Phase 6.
- **Status**: [x] Done

---

## Milestone 5: Complex UI Molecules & Bottom Sheets (Phases 34-43)

### Phase 34: Gorhom Bottom Sheet Engine Integration

- **Goal**: Setup `@gorhom/bottom-sheet` with backdrop, snap points, and keyboard avoidance.
- **Files**: `bazar-shodai-app/src/components/ui/BottomSheet.tsx`
- **API**: None.
- **Acceptance Criteria**: Fluid gesture-driven pull down to dismiss with native physics.
- **Dependencies**: Phase 6.
- **Status**: [x] Done

### Phase 35: Quantity Stepper Molecule

- **Goal**: Reusable fractional/integer quantity stepper (`-`, quantity, `+`) supporting unit steps.
- **Files**: `bazar-shodai-app/src/components/product/QuantityStepper.tsx`
- **API**: None.
- **Acceptance Criteria**: Respects minimum quantity and step size (e.g., 0.5kg steps, 1 piece steps).
- **Dependencies**: Phases 20, 33.
- **Status**: [x] Done

### Phase 36: Star Rating & Review Breakdown Molecule

- **Goal**: Interactive star selector (1-5) and display widget with review counts and average score.
- **Files**: `bazar-shodai-app/src/components/ui/StarRating.tsx`
- **API**: None.
- **Acceptance Criteria**: Fractional star filling for accurate average rating display.
- **Dependencies**: Phase 28.
- **Status**: [x] Done

### Phase 37: Search Bar with Voice / Scan Trigger

- **Goal**: Modern search input with instant clear, debounce trigger, and filter button.
- **Files**: `bazar-shodai-app/src/components/ui/SearchBar.tsx`
- **API**: None.
- **Acceptance Criteria**: Smooth animation when transitioning into active search mode.
- **Dependencies**: Phase 22.
- **Status**: [x] Done

### Phase 38: Confirmation Modal Molecule

- **Goal**: Native modal dialog for destructive actions (remove item, cancel order, logout).
- **Files**: `bazar-shodai-app/src/components/ui/ConfirmDialog.tsx`
- **API**: None.
- **Acceptance Criteria**: Clear cancel and confirm actions with dimmed backdrop.
- **Dependencies**: Phase 20.
- **Status**: [x] Done

### Phase 39: Product Card Molecule (Grid Variant)

- **Goal**: High-performance product card with image, badges, price, unit label, and 1-tap cart button.
- **Files**: `bazar-shodai-app/src/components/product/ProductGridCard.tsx`
- **API**: None.
- **Acceptance Criteria**: Instant morphing into stepper upon first tap; tap card body opens Quick View sheet.
- **Dependencies**: Phases 24, 25, 27, 35.
- **Status**: [x] Done

### Phase 40: Product Card Molecule (Horizontal List Variant)

- **Goal**: Compact horizontal product card for carts, checkout review, and search results.
- **Files**: `bazar-shodai-app/src/components/product/ProductListCard.tsx`
- **API**: None.
- **Acceptance Criteria**: Thumbnail, name, unit price, quantity stepper, and delete action.
- **Dependencies**: Phase 39.
- **Status**: [x] Done

### Phase 41: Product Quick View Bottom Sheet

- **Goal**: Mobile equivalent of the web quick view modal: image carousel, unit details, stepper, and "View Full Details" link.
- **Files**: `bazar-shodai-app/src/components/product/ProductQuickViewSheet.tsx`
- **API**: `GET /customer/products/:slug`
- **Acceptance Criteria**: Opens smoothly on product card press with native back-button dismissal.
- **Dependencies**: Phases 34, 39.
- **Status**: [x] Done

### Phase 42: Category Tile Molecule

- **Goal**: Circular/rounded category icon tile with label and press feedback.
- **Files**: `bazar-shodai-app/src/components/category/CategoryTile.tsx`
- **API**: None.
- **Acceptance Criteria**: Displays image or fallback initial; navigates to category drilldown.
- **Dependencies**: Phase 27.
- **Status**: [x] Done

### Phase 43: Banner Carousel Molecule

- **Goal**: Auto-playing banner slider with pagination dots and smooth reanimated gesture swiping.
- **Files**: `bazar-shodai-app/src/components/home/BannerCarousel.tsx`
- **API**: None.
- **Acceptance Criteria**: Pauses on touch press; supports deep link navigation on click.
- **Dependencies**: Phase 27.
- **Status**: [x] Done

---

## Milestone 6: Navigation Architecture & Tab Shell (Phases 44-50)

### Phase 44: Expo Router File-Based Routing Setup

- **Goal**: Setup root layout (`app/_layout.tsx`) with SafeAreaProvider, GestureHandlerRootView, and fonts.
- **Files**: `bazar-shodai-app/app/_layout.tsx`
- **API**: None.
- **Acceptance Criteria**: App boots with zero layout shifts or safe area clipping.
- **Dependencies**: Phase 1.
- **Status**: [x] Done

### Phase 45: Bottom Tab Navigator Architecture

- **Goal**: Create bottom tabs: Home, Categories, Cart, Wishlist, Account with custom badges.
- **Files**: `bazar-shodai-app/app/(tabs)/_layout.tsx`, `bazar-shodai-app/src/navigation/TabBar.tsx`
- **API**: None.
- **Acceptance Criteria**: Native animated bottom bar with active indicator and cart item badge counter.
- **Dependencies**: Phase 44.
- **Status**: [x] Done

### Phase 46: Root Stack & Modal Screen Setup

- **Goal**: Configure modal routes (product quick view, address picker, prescription upload) and standard stack push routes.
- **Files**: `bazar-shodai-app/app/_layout.tsx`
- **API**: None.
- **Acceptance Criteria**: Modals slide up with native drag-to-dismiss gesture on Android & iOS.
- **Dependencies**: Phase 44.
- **Status**: [x] Done

### Phase 47: Header & Navigation Bar Components

- **Goal**: Custom animated header with logo, location pill, search trigger, and notification bell.
- **Files**: `bazar-shodai-app/src/components/navigation/AppHeader.tsx`
- **API**: None.
- **Acceptance Criteria**: Header collapses or pins smoothly as user scrolls content.
- **Dependencies**: Phase 45.
- **Status**: [x] Done

### Phase 48: Deep Linking & Universal Links Configuration

- **Goal**: Configure scheme (`bazarshodai://`) and universal links for products, categories, orders, and reset password.
- **Files**: `bazar-shodai-app/app.json`, `bazar-shodai-app/src/navigation/linking.ts`
- **API**: None.
- **Acceptance Criteria**: Opening `bazarshodai://product/fresh-mango` routes directly to the product screen.
- **Dependencies**: Phase 46.
- **Status**: [x] Done

### Phase 49: Back-Button Android Hardware Navigation

- **Goal**: Intercept hardware back button to close bottom sheets and modals before navigating backwards.
- **Files**: `bazar-shodai-app/src/hooks/useHardwareBack.ts`
- **API**: None.
- **Acceptance Criteria**: 1st press closes active modal/sheet; 2nd press navigates to previous screen or prompts exit.
- **Dependencies**: Phase 46.
- **Status**: [x] Done

### Phase 50: Tab Transition Animations

- **Goal**: Configure lightweight subtle cross-fade transitions between bottom tabs.
- **Files**: `bazar-shodai-app/app/(tabs)/_layout.tsx`
- **API**: None.
- **Acceptance Criteria**: Tab switches feel immediate and fluid without blank frames.
- **Dependencies**: Phase 45.
- **Status**: [x] Done

---

## Milestone 7: Customer Authentication & Session Management (Phases 51-58)

### Phase 51: Auth Store & State Management

- **Goal**: Implement Zustand store for user profile, authentication status, and token lifecycle.
- **Files**: `bazar-shodai-app/src/store/useAuthStore.ts`
- **API**: None.
- **Acceptance Criteria**: Syncs auth state seamlessly between MMKV, SecureStore, and React state.
- **Dependencies**: Phases 13, 14.
- **Status**: [x] Done

### Phase 52: Customer Login Screen

- **Goal**: Mobile login screen accepting Bangladeshi mobile phone or email + password.
- **Files**: `bazar-shodai-app/app/(auth)/login.tsx`, `bazar-shodai-app/src/features/auth/api/login.ts`
- **API**: `POST /customer/auth/login`
- **Acceptance Criteria**: Validates inputs with Zod, sends `guestToken` for automatic cart merge, saves tokens.
- **Dependencies**: Phases 23, 51.
- **Status**: [x] Done

### Phase 53: Customer Registration Screen

- **Goal**: Signup screen with Name, Phone (+880), Email (optional), Password, and terms confirmation.
- **Files**: `bazar-shodai-app/app/(auth)/register.tsx`, `bazar-shodai-app/src/features/auth/api/register.ts`
- **API**: `POST /customer/auth/register`
- **Acceptance Criteria**: Merges guest cart on backend, logs customer in, navigates to Home.
- **Dependencies**: Phases 23, 51.
- **Status**: [x] Done

### Phase 54: Forgot Password Screen

- **Goal**: Request password recovery link/token via customer email or phone.
- **Files**: `bazar-shodai-app/app/(auth)/forgot-password.tsx`, `bazar-shodai-app/src/features/auth/api/forgotPassword.ts`
- **API**: `POST /customer/auth/forgot-password`
- **Acceptance Criteria**: Shows success message and instructions to check inbox.
- **Dependencies**: Phase 52.
- **Status**: [x] Done

### Phase 55: Reset Password Screen

- **Goal**: Token verification and new password entry screen.
- **Files**: `bazar-shodai-app/app/(auth)/reset-password.tsx`, `bazar-shodai-app/src/features/auth/api/resetPassword.ts`
- **API**: `GET /customer/auth/reset-password/verify`, `POST /customer/auth/reset-password`
- **Acceptance Criteria**: Validates token; submits new password with min 6 characters.
- **Dependencies**: Phase 54.
- **Status**: [x] Done

### Phase 56: User Profile Fetch & Background Sync

- **Goal**: Fetch current authenticated customer profile on startup and cache in store.
- **Files**: `bazar-shodai-app/src/features/auth/api/getProfile.ts`
- **API**: `GET /customer/auth/profile`
- **Acceptance Criteria**: Updates user points, avatar, and default address.
- **Dependencies**: Phase 51.
- **Status**: [x] Done

### Phase 57: Change Password Screen

- **Goal**: In-app password change screen requiring current password and new password confirmation.
- **Files**: `bazar-shodai-app/app/(account)/change-password.tsx`
- **API**: `POST /customer/auth/change-password`
- **Acceptance Criteria**: Shows error on incorrect current password; confirms success.
- **Dependencies**: Phase 51.
- **Status**: [x] Done

### Phase 58: Logout & Guest Session Reset

- **Goal**: Invalidate server session, clear tokens, and generate fresh guest cart token.
- **Files**: `bazar-shodai-app/src/features/auth/api/logout.ts`
- **API**: `POST /customer/auth/logout`
- **Acceptance Criteria**: Cleans secure store and resets app state without stale user data.
- **Dependencies**: Phase 51.
- **Status**: [x] Done

---

## Milestone 8: Home Screen Experience & Sliders (Phases 59-67)

### Phase 59: Home Screen Data Aggregator Hook

- **Goal**: Unified TanStack Query hook fetching banners, featured products, categories, and best sellers.
- **Files**: `bazar-shodai-app/src/features/home/api/useHomeData.ts`
- **API**: `GET /customer/products/home`, `GET /customer/banners`, `GET /customer/categories`
- **Acceptance Criteria**: Parallel execution with cached fallback for instant rendering.
- **Dependencies**: Phase 18.
- **Status**: [x] Done

### Phase 60: Home Sticky Header with Location Pill

- **Goal**: App header showing active delivery zone / address, search bar trigger, and shopping bag icon.
- **Files**: `bazar-shodai-app/src/features/home/components/HomeHeader.tsx`
- **API**: `GET /customer/my-location`
- **Acceptance Criteria**: Location pill displays delivery estimate (e.g. "১-২ ঘণ্টা ডেলিভারি").
- **Dependencies**: Phase 47.
- **Status**: [x] Done

### Phase 61: Promotional Hero Slider Section

- **Goal**: Dynamic hero banner carousel with autoplay, manual swipe, and deep link routing.
- **Files**: `bazar-shodai-app/src/features/home/components/HeroSliderSection.tsx`
- **API**: `GET /customer/banners`
- **Acceptance Criteria**: Respects banner position `HERO_MAIN` and `HERO_SIDE`.
- **Dependencies**: Phase 43.
- **Status**: [x] Done

### Phase 62: Category Circular Grid Section

- **Goal**: Horizontal scrolling or 2-row grid of popular categories with icons.
- **Files**: `bazar-shodai-app/src/features/home/components/CategoryGridSection.tsx`
- **API**: `GET /customer/categories`
- **Acceptance Criteria**: Displays top 16 categories; "View All" navigates to Categories tab.
- **Dependencies**: Phase 42.
- **Status**: [x] Done

### Phase 63: Featured Products (_আজকের তাজা বাজার_) Section

- **Goal**: FlashList horizontal/2-column grid showing fresh daily items with live steppers.
- **Files**: `bazar-shodai-app/src/features/home/components/FeaturedProductsSection.tsx`
- **API**: `GET /customer/products/home` (`featured`)
- **Acceptance Criteria**: Seamless add-to-cart directly from home feed.
- **Dependencies**: Phase 39.
- **Status**: [x] Done

### Phase 64: Best Selling Products Section

- **Goal**: Visual section highlighting top-selling grocery essentials.
- **Files**: `bazar-shodai-app/src/features/home/components/BestSellersSection.tsx`
- **API**: `GET /customer/products/home` (`bestSellers`)
- **Acceptance Criteria**: Includes "Top Seller" badges and discount percentages.
- **Dependencies**: Phase 39.
- **Status**: [x] Done

### Phase 65: Brand Showcase Section

- **Goal**: Interactive brand pill selector filtering products by brand with smooth transitions.
- **Files**: `bazar-shodai-app/src/features/home/components/BrandShowcaseSection.tsx`
- **API**: `GET /customer/brands`
- **Acceptance Criteria**: Tapping a brand updates the product carousel instantly.
- **Dependencies**: Phase 39.
- **Status**: [x] Done

### Phase 66: Home Pull-to-Refresh & Skeleton State

- **Goal**: RefreshControl updating all home queries with haptic feedback, and skeleton placeholder layout.
- **Files**: `bazar-shodai-app/app/(tabs)/index.tsx`
- **API**: All home APIs.
- **Acceptance Criteria**: Refreshes data cleanly without layout jumping.
- **Dependencies**: Phases 26, 59.
- **Status**: [x] Done

### Phase 67: Quick Category Quick-Jump Sticky Bar

- **Goal**: Subtle pill bar below search allowing 1-tap jump to Vegetables, Fish, Meat, Dairy, Fruits.
- **Files**: `bazar-shodai-app/src/features/home/components/QuickJumpBar.tsx`
- **API**: `GET /customer/categories`
- **Acceptance Criteria**: Highlights active category as user scrolls.
- **Dependencies**: Phase 62.
- **Status**: [x] Done

---

## Milestone 9: Product Catalog, Facets & Search Engine (Phases 68-76)

### Phase 68: Category Drilldown Screen (Categories Tab)

- **Goal**: 2-column mobile layout: vertical category rail on left, subcategories and product grid on right.
- **Files**: `bazar-shodai-app/app/(tabs)/categories.tsx`
- **API**: `GET /customer/categories`, `GET /customer/products`
- **Acceptance Criteria**: Smooth thumb navigation between parent categories and child products.
- **Dependencies**: Phases 42, 45.
- **Status**: [x] Done

### Phase 69: Product Listing Screen (`/products`)

- **Goal**: Infinite-scroll FlashList grid of products with sorting, count indicator, and active filters.
- **Files**: `bazar-shodai-app/app/products/index.tsx`
- **API**: `GET /customer/products`
- **Acceptance Criteria**: 60fps scrolling over 1,000+ items with optimized window recycling.
- **Dependencies**: Phase 39.
- **Status**: [x] Done

### Phase 70: Full-Text Search Screen with Live Debounce

- **Goal**: Instant search screen with recent searches history and live suggestions as user types.
- **Files**: `bazar-shodai-app/app/search/index.tsx`, `bazar-shodai-app/src/features/search/api/useSearch.ts`
- **API**: `GET /customer/products` (with `search` query param)
- **Acceptance Criteria**: 300ms debounce prevents unnecessary API requests.
- **Dependencies**: Phase 37.
- **Status**: [x] Done

### Phase 71: Search History Persistence & Suggestions

- **Goal**: Persist recent search queries in MMKV and sync with backend history endpoint.
- **Files**: `bazar-shodai-app/src/features/search/api/searchHistory.ts`
- **API**: `GET /customer/search-history`, `POST /customer/search-history`, `DELETE /customer/search-history`
- **Acceptance Criteria**: 1-tap re-search and 1-tap clear history.
- **Dependencies**: Phase 70.
- **Status**: [x] Done

### Phase 72: Filter Bottom Sheet Modal

- **Goal**: Slide-up filter panel with Price Range slider, Brand checkboxes, Category selector, and In-Stock toggle.
- **Files**: `bazar-shodai-app/src/features/products/components/FilterBottomSheet.tsx`
- **API**: `GET /customer/brands`, `GET /customer/categories`
- **Acceptance Criteria**: Dynamic active filter count badge; "Reset" and "Apply" buttons.
- **Dependencies**: Phase 34.
- **Status**: [x] Done

### Phase 73: Sort Options Sheet

- **Goal**: Quick-select bottom sheet for sorting (Relevance, Price: Low to High, Price: High to Low, Newest).
- **Files**: `bazar-shodai-app/src/features/products/components/SortBottomSheet.tsx`
- **API**: None.
- **Acceptance Criteria**: Updates query params and re-orders listing instantly.
- **Dependencies**: Phase 34.
- **Status**: [x] Done

### Phase 74: Infinite Scroll & Pagination Engine

- **Goal**: Automatic page fetching when user reaches 80% scroll depth of FlashList.
- **Files**: `bazar-shodai-app/src/features/products/hooks/useInfiniteProducts.ts`
- **API**: `GET /customer/products` (with `page` & `limit`)
- **Acceptance Criteria**: Shows small bottom activity indicator during next page fetch.
- **Dependencies**: Phase 69.
- **Status**: [x] Done

### Phase 75: Back-In-Stock Subscription Dialog

- **Goal**: Modal allowing customers to subscribe via email/phone when an out-of-stock product is restocked.
- **Files**: `bazar-shodai-app/src/features/products/components/BackInStockDialog.tsx`
- **API**: `POST /customer/back-in-stock`
- **Acceptance Criteria**: Submits subscription and alerts user when confirmed.
- **Dependencies**: Phase 38.
- **Status**: [x] Done

### Phase 76: Empty Search & Filter State

- **Goal**: Helpful empty state suggesting alternative keywords or clearing active filters.
- **Files**: `bazar-shodai-app/src/features/products/components/NoProductsFound.tsx`
- **API**: None.
- **Acceptance Criteria**: Features "Clear All Filters" button resetting state.
- **Dependencies**: Phase 31.
- **Status**: [x] Done

---

## Milestone 10: Product Details Screen & Image Gallery (Phases 77-83)

### Phase 77: Product Details Layout & Header

- **Goal**: Fullscreen screen with collapsible hero image header, share button, and wishlist toggle.
- **Files**: `bazar-shodai-app/app/product/[slug].tsx`
- **API**: `GET /customer/products/:slug`
- **Acceptance Criteria**: Smooth entry transition; back button returns to exact scroll position.
- **Dependencies**: Phase 44.
- **Status**: [x] Done

### Phase 78: Fullscreen Multi-Image Swiper with Pinch-to-Zoom

- **Goal**: Reanimated image carousel supporting pinch-to-zoom gesture and thumbnail selector.
- **Files**: `bazar-shodai-app/src/features/products/components/ProductImageGallery.tsx`
- **API**: None.
- **Acceptance Criteria**: Natural physics zoom with double-tap reset.
- **Dependencies**: Phase 27.
- **Status**: [x] Done

### Phase 79: Unit Pricing & Quantity Stepper Bottom Action Bar

- **Goal**: Sticky bottom bar displaying total price, fractional unit stepper, and Add to Bag button.
- **Files**: `bazar-shodai-app/src/features/products/components/ProductStickyBottomBar.tsx`
- **API**: None.
- **Acceptance Criteria**: Always accessible above Android system navigation bar.
- **Dependencies**: Phases 20, 35.
- **Status**: [x] Done

### Phase 80: Product Description, Nutrition & Specifications

- **Goal**: Accordion tabs for description, nutritional details, origin, and unit specifications in English/Bengali.
- **Files**: `bazar-shodai-app/src/features/products/components/ProductSpecs.tsx`
- **API**: None.
- **Acceptance Criteria**: Clean expandable panels with formatted typography.
- **Dependencies**: Phase 21.
- **Status**: [x] Done

### Phase 81: Customer Reviews & Photo Rating Breakdown

- **Goal**: Review list with star breakdown, verified purchase badge, and customer review images.
- **Files**: `bazar-shodai-app/src/features/reviews/components/ProductReviewsList.tsx`
- **API**: `GET /customer/reviews/product/:productId`
- **Acceptance Criteria**: Displays helpful vote counter with 1-tap helpful button.
- **Dependencies**: Phase 36.
- **Status**: [x] Done

### Phase 82: Write Review & Photo Upload Sheet

- **Goal**: Bottom sheet allowing customers who bought the item to rate, review, and upload photos.
- **Files**: `bazar-shodai-app/src/features/reviews/components/WriteReviewSheet.tsx`
- **API**: `POST /customer/uploads/review-images`, `POST /customer/reviews`
- **Acceptance Criteria**: Uses `expo-image-picker` to attach up to 5 photos from camera or gallery.
- **Dependencies**: Phase 34.
- **Status**: [x] Done

### Phase 83: Related & Frequently Bought Together Products

- **Goal**: Horizontal product recommendation carousel at bottom of product detail page.
- **Files**: `bazar-shodai-app/src/features/products/components/RelatedProducts.tsx`
- **API**: `GET /customer/products` (same category filter)
- **Acceptance Criteria**: 1-tap add directly from related list.
- **Dependencies**: Phase 39.
- **Status**: [x] Done

---

## Milestone 11: Medicine, Pharmacy & Prescription Module (Phases 84-89)

### Phase 84: Pharmacy & Medicine Catalog Screen

- **Goal**: Dedicated pharmacy landing view filtering OTC and Prescription drugs with dosage warnings.
- **Files**: `bazar-shodai-app/app/pharmacy/index.tsx`
- **API**: `GET /customer/products` (category=medicine, type=OTC/PRESCRIPTION)
- **Acceptance Criteria**: Displays generic name, strength (e.g. 500mg), dosage form, and manufacturer.
- **Dependencies**: Phase 69.
- **Status**: [x] Done

### Phase 85: Medicine Detail View & Generic Info

- **Goal**: Medicine-specific details showing indications, precautions, and side effects from `MedicineMeta`.
- **Files**: `bazar-shodai-app/src/features/pharmacy/components/MedicineInfoSheet.tsx`
- **API**: `GET /customer/products/:slug`
- **Acceptance Criteria**: Clear warning banner for prescription-only pharmaceuticals.
- **Dependencies**: Phase 77.
- **Status**: [x] Done

### Phase 86: Prescription Camera Capture & Upload Flow

- **Goal**: Camera viewfinder (`expo-camera`) and file picker allowing instant prescription upload.
- **Files**: `bazar-shodai-app/app/prescription/upload.tsx`
- **API**: `POST /prescriptions`
- **Acceptance Criteria**: Captures clear photo, allows crop/rotate, attaches phone number and optional notes.
- **Dependencies**: Phase 20.
- **Status**: [x] Done

### Phase 87: Uploaded Prescriptions List & Status Tracker

- **Goal**: List customer's uploaded prescriptions with status (`PENDING`, `REVIEWED`, `ORDER_CREATED`, `REJECTED`).
- **Files**: `bazar-shodai-app/app/(account)/prescriptions.tsx`
- **API**: `GET /customer/prescriptions`
- **Acceptance Criteria**: Displays thumbnail preview, admin feedback note, and associated order link if dispensed.
- **Dependencies**: Phase 30.
- **Status**: [x] Done

### Phase 88: Prescription Fullscreen Image Viewer

- **Goal**: Pinch-to-zoom modal viewer to review high-res prescription scans.
- **Files**: `bazar-shodai-app/src/features/pharmacy/components/PrescriptionViewerModal.tsx`
- **API**: None.
- **Acceptance Criteria**: High resolution rendering with close action.
- **Dependencies**: Phase 78.
- **Status**: [x] Done

### Phase 89: 1-Tap Prescription Order Re-order

- **Goal**: Quickly create order from verified prescription items with pharmacist confirmation.
- **Files**: `bazar-shodai-app/src/features/pharmacy/components/PrescriptionOrderButton.tsx`
- **API**: `POST /customer/checkout`
- **Acceptance Criteria**: Bypasses manual search and pre-fills approved medications.
- **Dependencies**: Phase 87.
- **Status**: [x] Done

---

## Milestone 12: Cart Engine & Stepper Synchronization (Phases 90-96)

### Phase 90: Zustand Cart Store & Optimistic Updates

- **Goal**: High-speed local cart store providing instantaneous UI updates before API roundtrip.
- **Files**: `bazar-shodai-app/src/store/useCartStore.ts`
- **API**: None.
- **Acceptance Criteria**: Zero lag on tap; rolls back gracefully if backend rejects.
- **Dependencies**: Phase 13.
- **Status**: [x] Done

### Phase 91: Cart Backend Synchronization Engine

- **Goal**: Sync cart items with `POST /customer/cart/items` and handle `X-Guest-Token` header.
- **Files**: `bazar-shodai-app/src/features/cart/api/cartApi.ts`
- **API**: `GET /customer/cart`, `POST /customer/cart/items`, `PATCH /customer/cart/items/:id`, `DELETE /customer/cart/items/:id`
- **Acceptance Criteria**: Keeps server and client cart state 100% in sync.
- **Dependencies**: Phase 90.
- **Status**: [x] Done

### Phase 92: Full Cart Screen (Cart Tab)

- **Goal**: Dedicated cart screen with list of items, unit details, stepper, subtotal, and checkout button.
- **Files**: `bazar-shodai-app/app/(tabs)/cart.tsx`
- **API**: `GET /customer/cart`
- **Acceptance Criteria**: Shows order breakdown, estimated delivery charge, and free shipping progress bar.
- **Dependencies**: Phase 40.
- **Status**: [x] Done

### Phase 93: Swipe-to-Remove Cart Item Gesture

- **Goal**: Reanimated swipe-to-delete gesture on cart line items with red trash indicator.
- **Files**: `bazar-shodai-app/src/features/cart/components/SwipeableCartItem.tsx`
- **API**: `DELETE /customer/cart/items/:id`
- **Acceptance Criteria**: Fluid swipe with confirmation haptic feedback.
- **Dependencies**: Phase 40.
- **Status**: [x] Done

### Phase 94: Free Shipping Delivery Progress Bar

- **Goal**: Dynamic progress bar calculating distance to free delivery threshold (e.g., "Add ৳120 more for Free Delivery!").
- **Files**: `bazar-shodai-app/src/features/cart/components/FreeShippingProgressBar.tsx`
- **API**: `GET /customer/settings`
- **Acceptance Criteria**: Animates bar width dynamically as cart total changes.
- **Dependencies**: Phase 90.
- **Status**: [x] Done

### Phase 95: Coupon Code Input & Instant Validation

- **Goal**: Coupon promo input with instant server validation and applied discount banner.
- **Files**: `bazar-shodai-app/src/features/cart/components/CouponInput.tsx`
- **API**: `POST /customer/coupons/apply`
- **Acceptance Criteria**: Shows exact discount amount; allows 1-tap remove coupon.
- **Dependencies**: Phase 22.
- **Status**: [x] Done

### Phase 96: Clear Cart Confirmation Dialog

- **Goal**: Modal to prevent accidental cart emptying.
- **Files**: `bazar-shodai-app/src/features/cart/components/ClearCartDialog.tsx`
- **API**: `DELETE /customer/cart`
- **Acceptance Criteria**: Empties cart and clears server state on confirm.
- **Dependencies**: Phase 38.
- **Status**: [x] Done

---

## Milestone 13: Delivery Location & GPS Geocoding (Phases 97-101)

### Phase 97: Expo Location Hardware Integration

- **Goal**: Request OS location permissions and acquire high-accuracy GPS coordinates.
- **Files**: `bazar-shodai-app/src/services/location.ts`
- **API**: None.
- **Acceptance Criteria**: Gracefully handles permission denied with manual map pin fallback.
- **Dependencies**: Phase 6.
- **Status**: [x] Done

### Phase 98: Location Share & Real-Time Delivery Fee Calculation

- **Goal**: Submit customer GPS coordinates to backend and calculate exact delivery charge and distance.
- **Files**: `bazar-shodai-app/src/features/location/api/myLocation.ts`
- **API**: `POST /customer/my-location`, `GET /customer/my-location`
- **Acceptance Criteria**: Returns reverse-geocoded place name, zone, and delivery fee in BDT.
- **Dependencies**: Phase 97.
- **Status**: [x] Done

### Phase 99: Interactive Delivery Map Pin Drop Screen

- **Goal**: Fullscreen native map (`react-native-maps`) allowing drag-and-drop pin positioning.
- **Files**: `bazar-shodai-app/app/location/picker.tsx`
- **API**: `POST /customer/my-location`
- **Acceptance Criteria**: Smooth pin movement with reverse-geocoding address preview at bottom.
- **Dependencies**: Phase 98.
- **Status**: [x] Done

### Phase 100: Address Autocomplete & Search Picker

- **Goal**: Search input to find locations by road, neighborhood, or area name in Bangladesh.
- **Files**: `bazar-shodai-app/src/features/location/components/AddressSearchPicker.tsx`
- **API**: OpenStreetMap reverse geocoding via server.
- **Acceptance Criteria**: Selecting a result centers the map pin automatically.
- **Dependencies**: Phase 99.
- **Status**: [x] Done

### Phase 101: Location Share via Link & Token Reader

- **Goal**: Support opening shared location tokens (`/l/[token]`) from SMS or WhatsApp links.
- **Files**: `bazar-shodai-app/app/location/[token].tsx`
- **API**: `GET /customer/locations/request/:token`, `POST /customer/locations/share`
- **Acceptance Criteria**: Deep link reads token and sends current GPS location to the courier.
- **Dependencies**: Phase 98.
- **Status**: [x] Done

---

## Milestone 14: Checkout & Mobile Financial Services (bKash/Nagad/Rocket/COD) (Phases 102-108)

### Phase 102: Single-Screen Checkout Architecture

- **Goal**: Keyboard-aware single screen orchestrating address selection, delivery time slot, payment, and order summary.
- **Files**: `bazar-shodai-app/app/checkout/index.tsx`
- **API**: `POST /customer/checkout`
- **Acceptance Criteria**: Clean layout with sticky "Confirm Order" bottom button.
- **Dependencies**: Phases 92, 98.
- **Status**: [x] Done

### Phase 103: Delivery Address Selector & Quick Add

- **Goal**: Horizontal selector of saved addresses (Home, Office) with 1-tap "Add New Address" modal.
- **Files**: `bazar-shodai-app/src/features/checkout/components/AddressSelector.tsx`
- **API**: `GET /customer/addresses`, `POST /customer/addresses`
- **Acceptance Criteria**: Pre-selects default address automatically.
- **Dependencies**: Phase 102.
- **Status**: [x] Done

### Phase 104: Delivery Slot & Special Instructions Picker

- **Goal**: Time slot radio picker (Immediate 1-2 hours, Express, Scheduled) and delivery notes text area.
- **Files**: `bazar-shodai-app/src/features/checkout/components/DeliverySlotPicker.tsx`
- **API**: None.
- **Acceptance Criteria**: Attaches instructions to checkout DTO.
- **Dependencies**: Phase 102.
- **Status**: [x] Done

### Phase 105: Payment Method Selector (COD, bKash, Nagad, Rocket)

- **Goal**: Radio selector with branded icons for Cash on Delivery, bKash, Nagad, and Rocket.
- **Files**: `bazar-shodai-app/src/features/checkout/components/PaymentMethodSelector.tsx`
- **API**: None.
- **Acceptance Criteria**: Toggling mobile banking expands the manual transaction form.
- **Dependencies**: Phase 102.
- **Status**: [x] Done

### Phase 106: Mobile Banking Transaction ID Input & Copy-to-Clipboard

- **Goal**: Instructions card showing merchant number with 1-tap copy, and verified Transaction ID input field.
- **Files**: `bazar-shodai-app/src/features/checkout/components/MobileBankingForm.tsx`
- **API**: None.
- **Acceptance Criteria**: 1-tap clipboard copy with haptic feedback; TrxID validation.
- **Dependencies**: Phase 105.
- **Status**: [x] Done

### Phase 107: Order Submission & Verification Mutation

- **Goal**: Execute `POST /customer/checkout` with cart items, address, payment details, and guest token.
- **Files**: `bazar-shodai-app/src/features/checkout/api/useSubmitOrder.ts`
- **API**: `POST /customer/checkout`
- **Acceptance Criteria**: Handles stock errors or redirects to order confirmation on success.
- **Dependencies**: Phase 102.
- **Status**: [x] Done

### Phase 108: Order Confirmation Celebration Screen

- **Goal**: Success screen with celebratory checkmark animation, order number, delivery estimate, and "Track Order" button.
- **Files**: `bazar-shodai-app/app/order-confirmation/[id].tsx`
- **API**: `GET /customer/orders/:id`
- **Acceptance Criteria**: Clears local cart store and plays success haptic feedback.
- **Dependencies**: Phase 107.
- **Status**: [x] Done

---

## Milestone 15: Order Tracking, Timeline & Re-order (Phases 109-114)

### Phase 109: Order History List Screen

- **Goal**: List past orders categorized by status (Active / Completed / Cancelled).
- **Files**: `bazar-shodai-app/app/(account)/orders.tsx`
- **API**: `GET /customer/orders`
- **Acceptance Criteria**: Pull-to-refresh, badge status color, order total, and date.
- **Dependencies**: Phase 30.
- **Status**: [x] Done

### Phase 110: Live Order Details & Status Stepper

- **Goal**: Full order breakdown with 7-step timeline (`PENDING` through `DELIVERED`).
- **Files**: `bazar-shodai-app/app/orders/[id].tsx`
- **API**: `GET /customer/orders/:id`
- **Acceptance Criteria**: Visual progression with timestamps for each milestone reached.
- **Dependencies**: Phase 109.
- **Status**: [x] Done

### Phase 111: Live Courier Map & Contact Action

- **Goal**: Map showing delivery destination and courier marker when order is `OUT_FOR_DELIVERY`.
- **Files**: `bazar-shodai-app/src/features/orders/components/LiveDeliveryMap.tsx`
- **API**: `GET /customer/orders/:id`
- **Acceptance Criteria**: "Call Courier" button triggers native phone dialer with rider number.
- **Dependencies**: Phase 110.
- **Status**: [x] Done

### Phase 112: 1-Tap Re-order Engine

- **Goal**: Add all items from a past order back into active shopping cart with 1 tap.
- **Files**: `bazar-shodai-app/src/features/orders/api/reorder.ts`
- **API**: `POST /customer/orders/:id/reorder` (or client cart push)
- **Acceptance Criteria**: Checks stock availability before adding; redirects to Cart tab.
- **Dependencies**: Phase 90.
- **Status**: [x] Done

### Phase 113: Customer Order Cancellation Dialog

- **Goal**: Allow customer to cancel order before processing begins (`PENDING` status only).
- **Files**: `bazar-shodai-app/src/features/orders/components/CancelOrderDialog.tsx`
- **API**: `POST /customer/orders/:id/cancel`
- **Acceptance Criteria**: Confirmation prompt; updates order status to `CANCELLED`.
- **Dependencies**: Phase 38.
- **Status**: [x] Done

### Phase 114: PDF Invoice View & Share

- **Goal**: Generate or download printable order receipt invoice.
- **Files**: `bazar-shodai-app/src/features/orders/components/OrderInvoiceButton.tsx`
- **API**: `GET /customer/orders/:id/invoice`
- **Acceptance Criteria**: Opens native sharing sheet (`expo-sharing`) to save or print PDF.
- **Dependencies**: Phase 110.
- **Status**: [x] Done

---

## Milestone 16: Returns & Refund Claims Engine (Phases 115-119)

### Phase 115: Return Requests List Screen

- **Goal**: Screen listing customer return and refund claims with live review status.
- **Files**: `bazar-shodai-app/app/(account)/returns.tsx`
- **API**: `GET /customer/returns`
- **Acceptance Criteria**: Displays status badge (`REQUESTED`, `APPROVED`, `COMPLETED`, `REJECTED`).
- **Dependencies**: Phase 30.
- **Status**: [x] Completed

### Phase 116: Create Return Claim Screen (`/returns/new`)

- **Goal**: Form to select delivered order items, specify quantity, and choose return reason.
- **Files**: `bazar-shodai-app/app/returns/new.tsx`
- **API**: None.
- **Acceptance Criteria**: Reasons match enum (`DAMAGED`, `WRONG_ITEM`, `EXPIRED`, `NOT_AS_DESCRIBED`, `POOR_QUALITY`).
- **Dependencies**: Phase 115.
- **Status**: [x] Completed

### Phase 117: Return Photographic Evidence Camera Upload

- **Goal**: Camera and gallery picker uploading photos of damaged goods to Cloudflare R2.
- **Files**: `bazar-shodai-app/src/features/returns/components/ReturnPhotoUploader.tsx`
- **API**: `POST /customer/uploads/review-images`
- **Acceptance Criteria**: Attaches up to 4 photos to the claim request.
- **Dependencies**: Phase 86.
- **Status**: [x] Completed

### Phase 118: Refund Method Selection (bKash/Nagad/Rocket/Wallet)

- **Goal**: Radio selector for customer's preferred refund payout account.
- **Files**: `bazar-shodai-app/src/features/returns/components/RefundMethodPicker.tsx`
- **API**: None.
- **Acceptance Criteria**: Collects account number and account type (Personal/Agent).
- **Dependencies**: Phase 116.
- **Status**: [x] Completed

### Phase 119: Submit Return Request Mutation

- **Goal**: Execute `POST /customer/returns` with selected items, reason, photos, and refund details.
- **Files**: `bazar-shodai-app/src/features/returns/api/useCreateReturn.ts`
- **API**: `POST /customer/returns`
- **Acceptance Criteria**: Navigates to return details screen upon success with tracking instructions.
- **Dependencies**: Phase 116.
- **Status**: [x] Completed

---

## Milestone 17: User Profile, Addresses & Loyalty Rewards (Phases 120-125)

### Phase 120: Customer Profile Screen (Account Tab)

- **Goal**: Central account dashboard showing user info, quick links, order stats, and settings.
- **Files**: `bazar-shodai-app/app/(tabs)/account.tsx`
- **API**: `GET /customer/auth/profile`
- **Acceptance Criteria**: Clean list grouping with icons and navigation chevrons.
- **Dependencies**: Phase 45.
- **Status**: [x] Completed

### Phase 121: Edit Profile Screen & Avatar Camera Upload

- **Goal**: Update name, phone, email, bio, and upload avatar photo.
- **Files**: `bazar-shodai-app/app/(account)/edit-profile.tsx`
- **API**: `PATCH /customer/auth/profile`, `POST /customer/uploads/review-images`
- **Acceptance Criteria**: Form validation; updates store and header immediately.
- **Dependencies**: Phase 22.
- **Status**: [x] Completed

### Phase 122: Saved Addresses Book Screen

- **Goal**: Manage delivery addresses with Add, Edit, Delete, and Set Default actions.
- **Files**: `bazar-shodai-app/app/(account)/addresses.tsx`
- **API**: `GET /customer/addresses`, `POST /customer/addresses`, `PATCH /customer/addresses/:id`, `DELETE /customer/addresses/:id`
- **Acceptance Criteria**: Default address highlighted with green badge.
- **Dependencies**: Phase 30.
- **Status**: [x] Completed

### Phase 123: Loyalty Rewards Points & History Screen

- **Goal**: Customer points balance card with points-to-BDT conversion rate and transaction ledger.
- **Files**: `bazar-shodai-app/app/(account)/rewards.tsx`
- **API**: `GET /customer/loyalty`
- **Acceptance Criteria**: Lists points earned per order and points redeemed on coupons.
- **Dependencies**: Phase 30.
- **Status**: [x] Completed

### Phase 124: Customer Wishlist Screen (Wishlist Tab)

- **Goal**: Grid of customer's saved favorite items with 1-tap "Move to Bag" action.
- **Files**: `bazar-shodai-app/app/(tabs)/wishlist.tsx`
- **API**: `GET /customer/wishlist`, `POST /customer/wishlist`, `DELETE /customer/wishlist/:productId`
- **Acceptance Criteria**: 1-tap heart toggle with micro-interaction scale animation.
- **Dependencies**: Phase 39.
- **Status**: [x] Completed

### Phase 125: App Settings, Language & Biometrics Screen

- **Goal**: Preferences screen: Language toggle (Bangla / English), Dark mode, and Biometric login (Fingerprint / Face ID).
- **Files**: `bazar-shodai-app/app/(account)/settings.tsx`
- **API**: None.
- **Acceptance Criteria**: Language switch updates all UI strings instantly; biometrics integrate with `expo-local-authentication`.
- **Dependencies**: Phase 10.
- **Status**: [x] Completed

---

## Milestone 18: Customer Care, Support Tickets & Contact (Phases 126-130)

### Phase 126: Support Tickets List Screen

- **Goal**: List open and resolved customer support tickets with status tags.
- **Files**: `bazar-shodai-app/app/(account)/support.tsx`
- **API**: `GET /customer/support`
- **Acceptance Criteria**: Pull-to-refresh; "Open New Ticket" floating action button.
- **Dependencies**: Phase 30.
- **Status**: [x] Completed

### Phase 127: Create Support Ticket Screen (`/support/new`)

- **Goal**: Form with category dropdown (`ORDER`, `PAYMENT`, `DELIVERY`, `PRODUCT`, `OTHER`), subject, and message.
- **Files**: `bazar-shodai-app/app/support/new.tsx`
- **API**: `POST /customer/support`
- **Acceptance Criteria**: Validates inputs and creates ticket.
- **Dependencies**: Phase 126.
- **Status**: [x] Completed

### Phase 128: Interactive Support Ticket Chat Thread

- **Goal**: Keyboard-aware messaging screen showing conversation between customer and support agent.
- **Files**: `bazar-shodai-app/app/support/[id].tsx`
- **API**: `GET /customer/support/:id`, `POST /customer/support/:id/messages`
- **Acceptance Criteria**: Auto-scrolls to newest message; optimistic local message append.
- **Dependencies**: Phase 127.
- **Status**: [x] Completed

### Phase 129: Contact Us & Store Information Screen

- **Goal**: Business hours, customer hotline call button, WhatsApp chat trigger, and contact message form.
- **Files**: `bazar-shodai-app/app/contact.tsx`
- **API**: `POST /customer/contact`
- **Acceptance Criteria**: "Call Support" opens native phone dialer with official store phone number.
- **Dependencies**: Phase 22.
- **Status**: [x] Completed

### Phase 130: Notification Center Screen

- **Goal**: Push & in-app notification list with unread indicators and 1-tap mark all as read.
- **Files**: `bazar-shodai-app/app/notifications/index.tsx`
- **API**: `GET /customer/notifications`, `PATCH /customer/notifications/:id/read`, `POST /customer/notifications/mark-all-read`
- **Acceptance Criteria**: Deep links to relevant order or promotion when notification item is tapped.
- **Dependencies**: Phase 30.
- **Status**: [x] Completed

---

## Milestone 19: Delivery Rider Portal (Staff Mode) (Phases 131-136)

### Phase 131: Staff / Rider Authentication & Role Detection

- **Goal**: Detect if logged in user has `STAFF` or `ADMIN` role with rider permissions.
- **Files**: `bazar-shodai-app/src/features/rider/hooks/useRiderAccess.ts`
- **API**: `GET /customer/auth/profile`
- **Acceptance Criteria**: Reveals "Rider Dashboard" switch in Account screen for staff members.
- **Dependencies**: Phase 51.
- **Status**: [x] Completed

### Phase 132: Rider Deliveries Feed Screen

- **Goal**: List active deliveries assigned to the logged-in rider with customer name, address, and total cash to collect.
- **Files**: `bazar-shodai-app/app/(rider)/deliveries.tsx`
- **API**: `GET /admin/deliveries/my-deliveries`
- **Acceptance Criteria**: Filter by status: `ASSIGNED`, `ACCEPTED`, `ON_THE_WAY`, `DELIVERED`.
- **Dependencies**: Phase 131.
- **Status**: [x] Completed

### Phase 133: Rider Live Order Action Bar & Navigation

- **Goal**: Order action screen with 1-tap "Navigate with Google Maps" and 1-tap "Call Customer".
- **Files**: `bazar-shodai-app/app/(rider)/order/[id].tsx`
- **API**: `GET /admin/orders/:id`
- **Acceptance Criteria**: Launches Google Maps / Apple Maps with destination GPS coordinates.
- **Dependencies**: Phase 132.
- **Status**: [x] Completed

### Phase 134: Delivery Status Transition Mutation

- **Goal**: Rider transitions order status (`ACCEPTED` → `PICKED_UP` → `ON_THE_WAY` → `DELIVERED`).
- **Files**: `bazar-shodai-app/src/features/rider/api/useUpdateDeliveryStatus.ts`
- **API**: `PATCH /admin/deliveries/:id/status`
- **Acceptance Criteria**: Captures current rider GPS coordinates on transition.
- **Dependencies**: Phase 133.
- **Status**: [x] Completed

### Phase 135: Cash Collection Reconciliation Screen

- **Goal**: Daily cash collection summary: total COD cash collected vs pending handover.
- **Files**: `bazar-shodai-app/app/(rider)/settlements.tsx`
- **API**: `GET /admin/deliveries/settlements`
- **Acceptance Criteria**: Clear breakdown of cash received per order.
- **Dependencies**: Phase 132.
- **Status**: [x] Completed

### Phase 136: Delivery Failure & Reschedule Modal

- **Goal**: Modal allowing rider to log delivery failure with reason (`CUSTOMER_UNREACHABLE`, `WRONG_ADDRESS`, `CUSTOMER_CANCELLED`).
- **Files**: `bazar-shodai-app/src/features/rider/components/DeliveryFailedModal.tsx`
- **API**: `PATCH /admin/deliveries/:id/status` (`FAILED`)
- **Acceptance Criteria**: Updates order timeline and alerts dispatch staff.
- **Dependencies**: Phase 38.
- **Status**: [x] Completed

---

## Milestone 20: Push Notifications, Deep Linking & Offline Cache (Phases 137-142)

### Phase 137: Expo Notifications Device Token Registration

- **Goal**: Register push notification token with backend upon customer login.
- **Files**: `bazar-shodai-app/src/services/notifications.ts`
- **API**: `POST /customer/notifications/token`
- **Acceptance Criteria**: Obtains native Expo push token and handles Android notification channels.
- **Dependencies**: Phase 51.
- **Status**: [x] Completed

### Phase 138: Foreground & Background Push Notification Handlers

- **Goal**: Handle in-app heads-up notification display and tap routing when app is killed/backgrounded.
- **Files**: `bazar-shodai-app/src/services/notificationHandlers.ts`
- **API**: None.
- **Acceptance Criteria**: Tapping notification routes user directly to matching Order or Promotion.
- **Dependencies**: Phase 137.
- **Status**: [x] Completed

### Phase 139: Android Notification Channels Configuration

- **Goal**: Setup Android 8.0+ notification channels (Orders, Deals & Discounts, Delivery Updates, Pharmacy).
- **Files**: `bazar-shodai-app/src/constants/notificationChannels.ts`
- **API**: None.
- **Acceptance Criteria**: Proper importance levels, sound, and vibration patterns configured.
- **Dependencies**: Phase 137.
- **Status**: [x] Completed

### Phase 140: Offline Cart & Read-Only Catalog Caching

- **Goal**: Allow browsing cached catalog and modifying cart while device is temporarily offline.
- **Files**: `bazar-shodai-app/src/services/offlineSync.ts`
- **API**: None.
- **Acceptance Criteria**: Syncs queued cart operations automatically once connection resumes.
- **Dependencies**: Phase 18.
- **Status**: [x] Completed

### Phase 141: Localized Bengali & English Translation Engine

- **Goal**: Dual-language dictionary (`bn.json` and `en.json`) mirroring web translations.
- **Files**: `bazar-shodai-app/src/i18n/index.ts`, `bazar-shodai-app/src/i18n/locales/{bn,en}.json`
- **API**: None.
- **Acceptance Criteria**: 100% of UI strings translated with fallback to English.
- **Dependencies**: Phase 6.
- **Status**: [x] Completed

### Phase 142: In-App App Update Checker

- **Goal**: Alert users when a mandatory app update is published.
- **Files**: `bazar-shodai-app/src/services/versionCheck.ts`
- **API**: `GET /common/storefront/content-version`
- **Acceptance Criteria**: Modal redirecting to Google Play Store if minimum version not met.
- **Dependencies**: Phase 38.
- **Status**: [x] Completed

---

## Milestone 21: Performance Hardening, Accessibility & EAS Build Pipeline (Phases 143-150)

### Phase 143: Memory Leak & Image Cache Tuning

- **Goal**: Configure disk cache limits for `expo-image` and profile unmount cleanup hooks.
- **Files**: `bazar-shodai-app/src/utils/imageConfig.ts`
- **API**: None.
- **Acceptance Criteria**: App maintains stable memory consumption under continuous scrolling.
- **Dependencies**: Phase 27.
- **Status**: [x] Completed

### Phase 144: Accessibility (a11y) & Screen Reader Audit

- **Goal**: Audit accessibility labels, hints, and minimum 44x44px touch targets across all components.
- **Files**: Design system components.
- **API**: None.
- **Acceptance Criteria**: Full TalkBack (Android) screen reader pass with 0 unlabelled controls.
- **Dependencies**: Phase 20.
- **Status**: [x] Completed

### Phase 145: Jest Unit Tests for Core Business Logic

- **Goal**: Write unit tests for cart calculation, fractional quantity steppers, and phone validation.
- **Files**: `bazar-shodai-app/__tests__/cart.test.ts`, `bazar-shodai-app/__tests__/format.test.ts`
- **API**: None.
- **Acceptance Criteria**: All Jest unit tests pass with 100% assertions satisfied.
- **Dependencies**: Phases 24, 35, 90.
- **Status**: [x] Completed

### Phase 146: Component Integration Tests (RNTL)

- **Goal**: React Native Testing Library tests for Login screen and Cart stepper flow.
- **Files**: `bazar-shodai-app/__tests__/Login.test.tsx`, `bazar-shodai-app/__tests__/Cart.test.tsx`
- **API**: None.
- **Acceptance Criteria**: Integration tests pass cleanly.
- **Dependencies**: Phases 52, 92.
- **Status**: [x] Completed

### Phase 147: ProGuard & Android Production Shrinking

- **Goal**: Enable ProGuard code shrinking, resource shrinking, and native architecture optimizations.
- **Files**: `bazar-shodai-app/android/app/build.gradle` (via Expo config plugins).
- **API**: None.
- **Acceptance Criteria**: Generates minimal production APK/AAB bundle size.
- **Dependencies**: Phase 1.
- **Status**: [x] Completed

### Phase 148: EAS Build Configuration (`eas.json`)

- **Goal**: Configure development, preview, and production build profiles in `eas.json`.
- **Files**: `bazar-shodai-app/eas.json`
- **API**: None.
- **Acceptance Criteria**: Verified `eas.json` with proper Android credentials and environment targets.
- **Dependencies**: Phase 1.
- **Status**: [x] Completed

### Phase 149: Google Play Store Assets & Metadata Verification

- **Goal**: Verify app icons, feature banners, privacy policy link, and permissions declarations.
- **Files**: `bazar-shodai-app/app.json`
- **API**: None.
- **Acceptance Criteria**: All Google Play console submission criteria met.
- **Dependencies**: Phase 12.
- **Status**: [x] Completed

### Phase 150: Final E2E Smoke Test & Release Audit

- **Goal**: Complete end-to-end user journey test: Boot → Catalog → Cart → GPS Location → bKash Checkout → Order Confirmation → Order Tracking.
- **Files**: `bazar-shodai-app/README.md`, `PROGRESS.md`
- **API**: Full backend suite.
- **Acceptance Criteria**: 0 crashes, 60fps interaction speed, complete feature parity confirmed.
- **Dependencies**: Phases 1-149.
- **Status**: [x] Completed

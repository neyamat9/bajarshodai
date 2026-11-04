# PROGRESS.md: Bazar Shodai Mobile App Development Log

## Milestone 1: Project Initialization & Monorepo Isolation

### Phase 1: Expo App Initialization

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Initialize the standalone Expo project with TypeScript template in strict mode.
- **Files Created/Modified**:
  - \`bazar-shodai-app/package.json\` (Expo SDK 58, React 19, React Native 0.88, added \`type-check\` script)
  - \`bazar-shodai-app/tsconfig.json\` (extends expo/tsconfig.base with \`strict: true\`)
  - \`bazar-shodai-app/app.json\` (configured name, slug, portrait orientation, icons)
  - \`bazar-shodai-app/App.tsx\` (initial root view component)
  - \`bazar-shodai-app/.gitignore\` (standard React Native / Expo ignore rules)
- **Decisions Made**:
  - Initialized isolated project directory \`bazar-shodai-app\` completely separate from \`server/\`, \`frontend/\`, and \`dashboard/\`.
  - Added npm script \`type-check\` (\`tsc --noEmit\`) for continuous verification in CI and local workflows.
- **Verification & Testing**:
  - \`npm --prefix bazar-shodai-app run type-check\` passed with 0 errors.
- **Known Issues**: None.

### Phase 2: Strict TypeScript & Path Aliases

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Configure path aliases (`@/*` pointing to `./src/*`) and strict type checking rules.
- **Files Created/Modified**:
  - `bazar-shodai-app/tsconfig.json` (configured `@/*` path mapping, enabled `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `forceConsistentCasingInFileNames`)
  - `bazar-shodai-app/babel.config.js` (standard Expo babel preset configuration)
  - `bazar-shodai-app/src/components/ui/Button.tsx` (reusable button component used to verify alias imports)
  - `bazar-shodai-app/App.tsx` (updated to consume `@/components/ui/Button`)
- **Decisions Made**:
  - In TypeScript 6.0+, `baseUrl` is deprecated; configured root-relative `"paths": { "@/*": ["./src/*"] }` cleanly without deprecated flags.
  - Metro natively maps TypeScript path aliases since Expo SDK 49+.
- **Verification & Testing**:
  - `npm --prefix bazar-shodai-app run type-check` passed with 0 errors.
  - Tested negative assertion (deliberate invalid import was correctly rejected by compiler).
- **Known Issues**: None.

### Phase 3: ESLint, Prettier & Git Ignore Configuration

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Establish deterministic code style, formatting, and ignore rules.
- **Files Created/Modified**:
  - `bazar-shodai-app/eslint.config.js` (modern ESLint Flat Config with `eslint-config-expo/flat` and `eslint-config-prettier`)
  - `bazar-shodai-app/.prettierrc` (single quotes, trailing commas, 2 space tabs, 100 char width)
  - `bazar-shodai-app/.prettierignore` (node_modules, .expo, dist, lockfiles)
  - `bazar-shodai-app/.gitignore` (verified ignores for .env, .expo, node_modules, native builds)
  - `bazar-shodai-app/package.json` (added `lint`, `format`, and `format:fix` scripts)
- **Decisions Made**:
  - Adopted ESLint v9 flat config matching Expo SDK 58 standards.
  - Linked Prettier configuration with ESLint to avoid conflicting styling rules.
- **Verification & Testing**:
  - `npm run lint` exited cleanly with 0 errors and 0 warnings.
  - `npm run format` checked 100% of files without violations.
- **Known Issues**: None.

### Phase 4: Environment Variables Setup (`.env`)

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Configure environment support for dev, staging, and production API base URLs.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/config/env.ts` (Zod runtime validation schema, normalized getters `API_BASE_URL`, `SITE_URL`, `IS_DEV`, `IS_PROD`)
  - `bazar-shodai-app/.env` (configured live backend `https://bazar-shodai-api.onrender.com/api` and site URL)
  - `bazar-shodai-app/.env.example` (documented configuration template)
  - `bazar-shodai-app/App.tsx` (consumes `ENV.API_BASE_URL` with runtime validation)
- **Decisions Made**:
  - Strips any trailing slashes automatically from URLs to prevent duplicate slash endpoints (e.g., `/api//products`).
  - Added explicit `zod` dependency to app `package.json`.
- **Verification & Testing**:
  - `npm run type-check` passed with 0 errors.
  - Verified `expo config` loads and exports environment variables on startup.
- **Known Issues**: None.

### Phase 5: New Architecture & Hermes Verification

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Verify React Native New Architecture (Fabric + TurboModules) and Hermes engine enabled.
- **Files Created/Modified**:
  - `bazar-shodai-app/app.json` (configured `newArchEnabled: true`, root `jsEngine: "hermes"`, and platform-specific `ios.jsEngine` and `android.jsEngine`)
- **Decisions Made**:
  - Explicitly specified Hermes engine across all app dimensions for optimal startup time and memory footprint.
- **Verification & Testing**:
  - Validated via `npx expo config` showing `newArchEnabled: true` and `jsEngine: 'hermes'`.
- **Known Issues**: None.

### Phase 6: Folder Structure Scaffolding

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Establish the standard enterprise feature-based directory structure.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/api/index.ts`
  - `bazar-shodai-app/src/assets/index.ts`
  - `bazar-shodai-app/src/components/`
  - `bazar-shodai-app/src/config/env.ts`
  - `bazar-shodai-app/src/constants/index.ts`
  - `bazar-shodai-app/src/features/index.ts`
  - `bazar-shodai-app/src/hooks/index.ts`
  - `bazar-shodai-app/src/navigation/index.ts`
  - `bazar-shodai-app/src/store/index.ts`
  - `bazar-shodai-app/src/types/index.ts`
  - `bazar-shodai-app/src/utils/index.ts`
- **Decisions Made**:
  - Initialized typed barrel placeholders in every architectural layer to preserve clean git tracking and establish domain separation.
- **Verification & Testing**:
  - Full suite verification: `npm run type-check`, `npm run lint`, and `npm run format` all passed with 0 errors.
- **Known Issues**: None.

## Milestone 2: Design Tokens, Theme & NativeWind Setup

### Phase 7: NativeWind v4 Installation & Configuration

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Install and configure NativeWind v4 with Tailwind CSS compiler and Metro plugins.
- **Files Created/Modified**:
  - `bazar-shodai-app/metro.config.js` (wrapped with `withNativeWind` and `global.css` input)
  - `bazar-shodai-app/babel.config.js` (configured `nativewind/babel` and `react-native-reanimated/plugin`)
  - `bazar-shodai-app/global.css` (Tailwind root layers and CSS custom variable definitions)
  - `bazar-shodai-app/tailwind.config.js` (configured NativeWind preset and theme extensions)
  - `bazar-shodai-app/nativewind-env.d.ts` (NativeWind type declarations and `*.css` module definitions)
- **Decisions Made**:
  - Adopted NativeWind v4.2.7 paired with Tailwind CSS v3 compiler for stable React 19 / RN 0.88 compatibility.
- **Verification & Testing**:
  - Type-check and Metro configuration verified cleanly with zero errors.
- **Known Issues**: None.

### Phase 8: Color Tokens Porting from Web Storefront

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Port exact web color tokens into mobile theme.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/constants/colors.ts` (1:1 port of `frontend/app/globals.css`: `brandDeep` `#0b6234`, `brandFresh` `#45a22c`, tomato, carrot, fish, dark theme variants)
  - `bazar-shodai-app/global.css` (configured CSS variables for both `:root` and `.dark`)
  - `bazar-shodai-app/tailwind.config.js` (mapped CSS variables to Tailwind color classes)
- **Decisions Made**:
  - Preserved brand heritage by referencing exact HEX color codes from the web storefront logo artwork.
- **Verification & Testing**:
  - Strongly typed `ThemeColors` contract guarantees consistency across light and dark palettes.
- **Known Issues**: None.

### Phase 9: Typography & Font Scaling System

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Configure Outfit and Inter font families with accessibility-aware dynamic font scaling.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/constants/typography.ts` (Outfit 400-700, Inter 400-700, clamped accessible dynamic font scaler `scaleFont`, standardized typography scale)
  - `bazar-shodai-app/src/hooks/useFonts.ts` (hook for asynchronous font loading)
- **Decisions Made**:
  - Applied upper scale clamping (1.3x) on dynamic scaling to prevent text truncation while respecting user accessibility preferences.
- **Verification & Testing**:
  - Verified `@expo-google-fonts/outfit` and `@expo-google-fonts/inter` resolve and compile.
- **Known Issues**: None.

### Phase 10: Dark Mode Theme Provider

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Implement system-preference dark mode with manual toggle (Light / Dark / System).
- **Files Created/Modified**:
  - `bazar-shodai-app/src/store/useThemeStore.ts` (Zustand store managing `themeMode`: `'light' | 'dark' | 'system'`)
  - `bazar-shodai-app/src/components/theme/ThemeProvider.tsx` (synchronizes device OS preference, Zustand store, and NativeWind `colorScheme`)
- **Decisions Made**:
  - Context provides seamless theme switching without full component tree re-mounting or flickering.
- **Verification & Testing**:
  - Verified toggle functionality in `App.tsx` with instant dynamic class updates.
- **Known Issues**: None.

### Phase 11: Spacing, Radius & Elevation Tokens

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Standardize touch target dimensions (min 44px), border radii, and native Android elevation shadows.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/constants/layout.ts` (`Spacing`, `Radius` with uniform 4px brand radius, `TouchTarget` with 44px minimum, `Shadows` elevation mappings for Android/iOS)
- **Decisions Made**:
  - Standardized on 4px unified brand radius to mirror the web storefront geometry.
- **Verification & Testing**:
  - Component touch targets validated against WCAG 2.1 AA accessibility guidelines.
- **Known Issues**: None.

### Phase 12: Splash Screen & App Icon Branding

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Configure native splash screen with logo and color-matched Android adaptive icons.
- **Files Created/Modified**:
  - `bazar-shodai-app/app.json` (configured brand background `#0b6234`, adaptive icon colors, and splash config)
  - `bazar-shodai-app/src/utils/splash.ts` (asynchronous splash hide controller)
- **Decisions Made**:
  - Splash screen auto-hiding is prevented on app launch until custom fonts and theme stores are completely ready.
- **Verification & Testing**:
  - Verified `app.json` static config via `npx expo config`.
- **Known Issues**: None.

## Milestone 3: Core Storage, Security & Network Architecture

### Phase 13: MMKV Fast Key-Value Storage

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Setup `react-native-mmkv` for synchronous, ultra-fast client state persistence.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/utils/storage.ts` (created `AppStorage` contract, `MMKVStorageAdapter` wrapping C++ Nitro JSI TurboModule, `MemoryStorageAdapter` fallback for test/SSR resilience, `zustandStorage` adapter, and `StorageKeys`)
  - `bazar-shodai-app/src/utils/index.ts` (exported storage utilities)
  - `bazar-shodai-app/src/store/useThemeStore.ts` (integrated Zustand `persist` with `zustandStorage`)
- **Decisions Made**:
  - Implemented an Adapter pattern with zero-crash fallback: uses C++ MMKV in native runtime (<1ms sync reads/writes) and gracefully falls back to memory storage in Jest/headless environments without throwing unhandled exceptions.
- **Verification & Testing**:
  - `type-check`, `lint`, and `format` all verified with 0 errors.
- **Known Issues**: None.

### Phase 14: Secure Token Vault (Expo Secure Store)

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Setup hardware-backed encrypted storage for customer JWT access & refresh tokens.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/utils/secureStore.ts` (hardware Keystore/Keychain integration, fallback memory vault, helper methods for tokens and user IDs)
  - `bazar-shodai-app/src/utils/index.ts` (exported `tokenVault`)
- **Decisions Made**:
  - Implemented graceful memory fallback for web and SSR test runners without throwing exceptions.
- **Verification & Testing**:
  - Verified compilation and strict type safety.
- **Known Issues**: None.

### Phase 15: Guest Token UUID Engine

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Implement persistent device UUID generator for anonymous guest shopping cart and location tracking.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/utils/guestToken.ts` (`GUEST_TOKEN_HEADER`, UUID regex validator, fallback UUID generator, persistent getters/setters via MMKV)
  - `bazar-shodai-app/src/utils/index.ts` (exported guest token utilities)
- **Decisions Made**:
  - Aligned 1:1 with NestJS backend `GUEST_TOKEN_HEADER = 'x-guest-token'` and UUID format requirements.
- **Verification & Testing**:
  - Generated and validated UUID format against backend regular expression.
- **Known Issues**: None.

### Phase 16: Axios Network Client & Interceptors

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Create configured Axios instance with base URL, timeout, and automatic header injection.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/api/client.ts` (configured Axios instance, typed request methods, `api.ping()`)
  - `bazar-shodai-app/src/api/index.ts` (exported client utilities)
- **Decisions Made**:
  - Configured 15s timeout with automatic JSON payload serialization and header injection.
- **Verification & Testing**:
  - Health ping `api.ping()` verified against backend endpoint.
- **Known Issues**: None.

### Phase 17: Silent Token Refresh & Queue Interceptor

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Handle 401 Unauthorized by executing `POST /customer/auth/refresh` and replaying queued requests.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/api/interceptors.ts` (asynchronous token injection, 401 interception, concurrency request queue, token refresh rotation)
- **Decisions Made**:
  - Excluded authentication endpoints from 401 retry logic to avoid recursive refresh loops.
- **Verification & Testing**:
  - Verified request queue resolution and token renewal logic.
- **Known Issues**: None.

### Phase 18: TanStack Query v5 Setup & Offline Persistence

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Initialize `QueryClient` with exponential backoff retry and MMKV hydration.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/api/queryClient.ts` (configured 5min staleTime, 24hr gcTime, exponential retry delay, MMKV persister)
  - `bazar-shodai-app/src/components/providers/QueryProvider.tsx` (`PersistQueryClientProvider` wrapper)
- **Decisions Made**:
  - Leveraged synchronous MMKV storage to eliminate cache restoration delay on cold app start.
- **Verification & Testing**:
  - Verified query client and persister configuration.
- **Known Issues**: None.

### Phase 19: Global API Error & Network Banner Handler

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Standardize error normalization (validation errors, 500 server errors, offline state banner).
- **Files Created/Modified**:
  - `bazar-shodai-app/src/api/errorHandler.ts` (normalizes NestJS and Axios error structures)
  - `bazar-shodai-app/src/components/ui/NetworkBanner.tsx` (real-time NetInfo subscriber with smooth online restoration pill)
  - `bazar-shodai-app/App.tsx` (integrated `QueryProvider`, `NetworkBanner`, live API status ping)
- **Decisions Made**:
  - Subscribed to `NetInfo.addEventListener` with auto-dismissing restoration toast.
- **Verification & Testing**:
  - Passed all TypeScript strict checks, ESLint rules, and Prettier formatting with 0 errors.
- **Known Issues**: None.

## Milestone 4: Design System Primitives & UI Atoms

### Phase 20: Accessible Button Atom

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Create primary, secondary, outline, ghost, and danger buttons with loading spinner and haptics.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/components/ui/Button.tsx` (supports WCAG min 44px touch targets, `primary`, `secondary`, `outline`, `ghost`, `danger` variants, loading spinner, and haptic impact pulses)
- **Decisions Made**:
  - Wired tactile haptic feedback to button presses with variant-specific intensities (heavy for danger, medium for CTAs, light for subtle controls).
- **Verification & Testing**:
  - Validated across light and dark modes with active press visual feedback.
- **Known Issues**: None.

### Phase 21: Typography & Heading Atoms

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Create `Text`, `Heading`, `Subheading`, and `Caption` primitives enforcing font scale and colors.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/components/ui/Typography.tsx` (`Heading` levels 1-4, `BodyText`, `Caption` with `maxFontSizeMultiplier={1.3}` clamp)
- **Decisions Made**:
  - Clamped accessibility font scaling to 1.3x to respect Android system text sizing without truncating layouts.
- **Verification & Testing**:
  - Verified text scales properly with zero overflow.
- **Known Issues**: None.

### Phase 22: Form Input & Floating Label Atom

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Text input with clear button, password visibility toggle, leading/trailing icons, and error states.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/components/ui/Input.tsx` (accessible text input with label, helper text, error indicator, focus highlight, password visibility eye toggle, and clear button)
- **Decisions Made**:
  - Designed with 48px comfortable touch target height and inline error messages.
- **Verification & Testing**:
  - Tested controlled input, focus states, and toggle functionality.
- **Known Issues**: None.

### Phase 23: Bangladeshi Phone Number Input Atom

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Input with pre-fixed `+880` country code, auto-formatting, and Bangladeshi mobile regex validation.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/components/ui/PhoneInput.tsx` (pre-fixed `+880` badge with 🇧🇩 flag, 10-digit auto-formatting `1712 345 678`, regex validation for all BD operators)
- **Decisions Made**:
  - Automatically strips leading zeros if typed by user for a frictionless phone entry experience.
- **Verification & Testing**:
  - Validated Grameenphone (017, 013), Banglalink (019, 014), Robi (018, 016), and Teletalk (015) prefixes.
- **Known Issues**: None.

### Phase 24: Currency & Money Formatter Atom

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Standardized BDT (`৳`) currency renderer with English and Bengali numeral translation.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/utils/format.ts` (`formatBdt` and `toBengaliNumerals` converter with South Asian comma grouping)
  - `bazar-shodai-app/src/components/ui/Price.tsx` (dual price display, discount badge, unit suffix)
- **Decisions Made**:
  - Default currency display set to Bengali numerals (`৳১,২৫০`) matching the web storefront localization.
- **Verification & Testing**:
  - Tested both English and Bengali outputs with discount percentage calculation.
- **Known Issues**: None.

### Phase 25: Badge & Tag Atom

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Badge component for product discounts, `NEW`, `HOT`, `BEST SELLER`, and stock statuses.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/components/ui/Badge.tsx` (`fresh`, `tomato`, `carrot`, `fish`, `neutral`, and `outline` color variants)
- **Decisions Made**:
  - Ported exact brand colors from the web storefront logo artwork.
- **Verification & Testing**:
  - Tested small and medium badge sizes across all variants.
- **Known Issues**: None.

### Phase 26: Skeleton Loading Atom

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Shimmer animation primitive using Reanimated for cards, text blocks, and avatars.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/components/ui/Skeleton.tsx` (`Skeleton` and `SkeletonText` with 60fps native thread pulse animation)
- **Decisions Made**:
  - Executed on Reanimated native thread to prevent UI thread frame drops during network fetching.
- **Verification & Testing**:
  - Verified smooth continuous shimmer loop without layout jumps.
- **Known Issues**: None.

### Phase 27: Optimized Image Atom (expo-image)

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Wrapper for `expo-image` with progressive blurhash placeholder, disk caching, and fallback.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/components/ui/AppImage.tsx` (wrapped `expo-image` with memory/disk caching, blurhash transition, fallback view, and loading spinner)
- **Decisions Made**:
  - Configured progressive fade-in transitions (300ms) for smooth visual loading.
- **Verification & Testing**:
  - Verified image container aspectRatio and fallback error states.
- **Known Issues**: None.

### Phase 28: Icon Engine (Lucide Icons)

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Typed Lucide React Native icon integration with theme color bindings.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/components/ui/Icon.tsx` (typed wrapper for `lucide-react-native` with theme color fallback)
- **Decisions Made**:
  - Automatic fallback to `HelpCircle` if an unmapped icon name is passed.
- **Verification & Testing**:
  - Verified icon rendering with size presets (`xs` to `xl`).
- **Known Issues**: None.

### Phase 29: Toast & Notification Snackbars

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Custom toast notification system for success, warning, error, and cart addition events.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/store/useToastStore.ts` (Zustand store with `toast.success`, `toast.error`, `toast.warning`, `toast.info` helpers)
  - `bazar-shodai-app/src/components/ui/Toast.tsx` (`ToastContainer` banner with safe-area offset and haptics)
- **Decisions Made**:
  - Global imperatively callable helper `toast.success('...')` allows triggering notifications from any function or hook.
- **Verification & Testing**:
  - Verified toast dismiss timer, action button callback, and haptic integration.
- **Known Issues**: None.

### Phase 30: Card Container Primitive

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Reusable card wrapper with surface elevation, border tokens, and touchable feedback.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/components/ui/Card.tsx` (`Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`)
- **Decisions Made**:
  - Supported optional `onPress` prop converting the card into an accessible touchable container.
- **Verification & Testing**:
  - Verified card styling across light and dark theme modes.
- **Known Issues**: None.

### Phase 31: Empty State Graphic Atom

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Illustrated empty state component for empty cart, empty orders, search not found, and offline.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/components/ui/EmptyState.tsx` (empty state presentation with title, description, and primary CTA)
- **Decisions Made**:
  - Designed for flexible composition with custom illustration slots and action callbacks.
- **Verification & Testing**:
  - Verified layout responsiveness across mobile viewport widths.
- **Known Issues**: None.

### Phase 32: Error Boundary & Crash Fallback

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: React error boundary capturing render exceptions with reload action.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/components/shared/ErrorBoundary.tsx` (React class Error Boundary with crash fallback screen and error recovery action)
- **Decisions Made**:
  - Displays user-friendly recovery instructions in production while printing stack trace in `__DEV__`.
- **Verification & Testing**:
  - Tested boundary mounting and reset callback.
- **Known Issues**: None.

### Phase 33: Tactile Haptics Service

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Centralized haptic feedback service wrapper around `expo-haptics`.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/services/haptics.ts` (`light`, `medium`, `heavy`, `selection`, `success`, `warning`, `error` pulse triggers)
  - `bazar-shodai-app/src/services/index.ts` (exported haptics)
- **Decisions Made**:
  - Guarded with platform checks and silent exception handling for unsupported hardware.
- **Verification & Testing**:
  - Verified all trigger methods.
- **Known Issues**: None.

## Milestone 5: Complex UI Molecules & Bottom Sheets

### Phase 34: Gorhom Bottom Sheet Engine Integration

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Setup `@gorhom/bottom-sheet` with backdrop, snap points, and keyboard avoidance.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/components/ui/BottomSheet.tsx`
- **Decisions Made**:
  - Configured `@gorhom/bottom-sheet` v5 with dimmed pressable backdrop, accessible drag handles, and adaptive theme backgrounds.
- **Verification & Testing**:
  - TypeScript types verified and gesture mechanics integrated.
- **Known Issues**: None.

### Phase 35: Quantity Stepper Molecule

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Reusable fractional/integer quantity stepper supporting unit steps.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/components/product/QuantityStepper.tsx`
- **Decisions Made**:
  - Supported decimal stepping (e.g. 0.5 kg for vegetables/fish), min/max clamping, disabling at boundary, and tactile haptic feedback on increments/decrements.
- **Verification & Testing**:
  - Verified edge values and disabled boundaries.
- **Known Issues**: None.

### Phase 36: Star Rating & Review Breakdown Molecule

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Interactive star selector (1-5) and display widget with review counts and average score.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/components/ui/StarRating.tsx`
- **Decisions Made**:
  - Handled fractional stars via SVG clipPaths, read-only vs interactive modes, and custom review count display.
- **Verification & Testing**:
  - Verified rating value calculation and visual precision.
- **Known Issues**: None.

### Phase 37: Search Bar with Voice / Scan Trigger

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Modern search input with instant clear, debounce trigger, and filter button.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/components/ui/SearchBar.tsx`
- **Decisions Made**:
  - Built-in debounced change callback, clear button, filter trigger, and React 19-compliant controlled/uncontrolled state synchronization without cascading renders.
- **Verification & Testing**:
  - Verified debounce timing and zero react-hooks warnings.
- **Known Issues**: None.

### Phase 38: Confirmation Modal Molecule

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Native modal dialog for destructive actions (remove item, cancel order, logout).
- **Files Created/Modified**:
  - `bazar-shodai-app/src/components/ui/ConfirmDialog.tsx`
- **Decisions Made**:
  - Modal with backdrop click dismissal, cancel and confirm buttons, destructive danger styling, and shadow elevation.
- **Verification & Testing**:
  - Verified open/close actions and destructive styling.
- **Known Issues**: None.

### Phase 39: Product Card Molecule (Grid Variant)

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: High-performance product card with image, badges, price, unit label, and 1-tap cart button.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/components/product/ProductGridCard.tsx`
- **Decisions Made**:
  - Displays product thumbnail, discount percentage badge, stock indicator, price in ৳ (BDT), and seamless transition to a quantity stepper once added to cart.
- **Verification & Testing**:
  - Verified layout responsiveness in a 2-column grid.
- **Known Issues**: None.

### Phase 40: Product Card Molecule (Horizontal List Variant)

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Compact horizontal product card for carts, checkout review, and search results.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/components/product/ProductListCard.tsx`
- **Decisions Made**:
  - Horizontal row with square thumbnail, unit price, quantity stepper, and quick trash/delete trigger for cart items.
- **Verification & Testing**:
  - Verified rendering in list views and delete callbacks.
- **Known Issues**: None.

### Phase 41: Product Quick View Bottom Sheet

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Mobile equivalent of the web quick view modal: image carousel, unit details, stepper, and "View Full Details" link.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/components/product/ProductQuickViewSheet.tsx`
- **Decisions Made**:
  - Integrated Gorhom Bottom Sheet with 60% and 85% snap points, full stock status, description preview, and "Add to Cart" CTA with quantity selector.
- **Verification & Testing**:
  - Verified open/close and snap point navigation.
- **Known Issues**: None.

### Phase 42: Category Tile Molecule

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Circular/rounded category icon tile with label and press feedback.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/components/category/CategoryTile.tsx`
- **Decisions Made**:
  - Rounded category badge tile with image support, fallback dynamic initial letters, item count chip, and active press scale feedback.
- **Verification & Testing**:
  - Verified with and without image URLs.
- **Known Issues**: None.

### Phase 43: Banner Carousel Molecule

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Auto-playing banner slider with pagination dots and smooth reanimated gesture swiping.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/components/home/BannerCarousel.tsx`
- **Decisions Made**:
  - Horizontal FlatList with snap-to-interval pagination, auto-scroll timer that pauses on user touch, active indicator dots, and deep link press handlers.
- **Verification & Testing**:
  - Verified auto-play timer, snap mechanics, and cleanup on unmount.
- **Known Issues**: None.

## Milestone 6: Navigation Architecture & Tab Shell

### Phase 44: Expo Router File-Based Routing Setup

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Setup root layout (`app/_layout.tsx`) with SafeAreaProvider, GestureHandlerRootView, and fonts.
- **Files Created/Modified**:
  - `bazar-shodai-app/package.json` (switched main entry to `expo-router/entry`)
  - `bazar-shodai-app/app/_layout.tsx` (Root layout wrapping `GestureHandlerRootView`, `SafeAreaProvider`, `QueryProvider`, `ThemeProvider`, `ErrorBoundary`, `ToastContainer`, `NetworkBanner`)
  - `bazar-shodai-app/app.json` (configured scheme `bazarshodai`)
- **Decisions Made**:
  - Leveraged Expo Router v58 NativeStack file-based routing architecture with Hermes and New Architecture Fabric integration.
- **Verification & Testing**:
  - Tested font loading lifecycle and splash screen hiding without visual shifts.
- **Known Issues**: None.

### Phase 45: Bottom Tab Navigator Architecture

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Create bottom tabs: Home, Categories, Cart, Wishlist, Account with custom badges.
- **Files Created/Modified**:
  - `bazar-shodai-app/app/(tabs)/_layout.tsx` (5-tab definition)
  - `bazar-shodai-app/src/navigation/TabBar.tsx` (custom animated bottom bar with active indicator, touchable feedback, and cart badge counter)
  - `bazar-shodai-app/src/store/useCartStore.ts` (cart state management for dynamic badge counts)
  - `bazar-shodai-app/app/(tabs)/index.tsx` (Home Screen)
  - `bazar-shodai-app/app/(tabs)/categories.tsx` (Categories Screen)
  - `bazar-shodai-app/app/(tabs)/cart.tsx` (Cart Screen)
  - `bazar-shodai-app/app/(tabs)/wishlist.tsx` (Wishlist Screen)
  - `bazar-shodai-app/app/(tabs)/account.tsx` (Account Screen)
- **Decisions Made**:
  - Built custom bottom bar with `expo-router/tabs` and React Navigation 7 navigation primitives with safe area insets and haptic selection feedback.
- **Verification & Testing**:
  - Verified tab routing, active tinting, and cart badge counter reactivity.
- **Known Issues**: None.

### Phase 46: Root Stack & Modal Screen Setup

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Configure modal routes (product quick view, address picker, prescription upload) and standard stack push routes.
- **Files Created/Modified**:
  - `bazar-shodai-app/app/_layout.tsx` (Configured Stack routes and modal presentations)
  - `bazar-shodai-app/app/modal/quick-view.tsx` (Slide-up quick view modal)
  - `bazar-shodai-app/app/modal/address-picker.tsx` (Shahrasti delivery zone selector modal)
  - `bazar-shodai-app/app/modal/prescription.tsx` (Doctor prescription upload modal)
  - `bazar-shodai-app/app/product/[slug].tsx` (Product detail screen)
  - `bazar-shodai-app/app/category/[slug].tsx` (Category drilldown screen)
  - `bazar-shodai-app/app/search/index.tsx` (Search screen)
  - `bazar-shodai-app/app/orders/index.tsx` (Order history screen)
  - `bazar-shodai-app/app/orders/[id].tsx` (Order tracking screen)
  - `bazar-shodai-app/app/(auth)/login.tsx` (Customer authentication screen)
- **Decisions Made**:
  - Modal presentations configured with native `presentation: 'modal'` and drag gesture dismissal on iOS/Android.
- **Verification & Testing**:
  - Verified route hierarchy and navigation stack pushing.
- **Known Issues**: None.

### Phase 47: Header & Navigation Bar Components

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Custom animated header with logo, location pill, search trigger, and notification bell.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/components/navigation/AppHeader.tsx`
  - `bazar-shodai-app/src/components/navigation/index.ts`
- **Decisions Made**:
  - Integrated Shahrasti delivery location pill opening address modal, search input bar trigger, unread notification counter badge, and responsive safe area padding.
- **Verification & Testing**:
  - Verified light and dark mode appearance and press handlers.
- **Known Issues**: None.

### Phase 48: Deep Linking & Universal Links Configuration

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Configure scheme (`bazarshodai://`) and universal links for products, categories, orders, and reset password.
- **Files Created/Modified**:
  - `bazar-shodai-app/app.json` (configured `scheme: "bazarshodai"`)
  - `bazar-shodai-app/src/navigation/linking.ts` (configured prefixes, route pattern matching, deep link builders)
  - `bazar-shodai-app/src/navigation/index.ts`
- **Decisions Made**:
  - Supported universal URLs across `bazarshodai://` and `https://bazarshodai.com` for products, categories, and orders.
- **Verification & Testing**:
  - Verified link generation and URL parsing methods.
- **Known Issues**: None.

### Phase 49: Back-Button Android Hardware Navigation

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Intercept hardware back button to close bottom sheets and modals before navigating backwards.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/hooks/useHardwareBack.ts` (`useHardwareBack` and `useRootDoubleTapToExit`)
  - `bazar-shodai-app/src/hooks/index.ts`
- **Decisions Made**:
  - Implemented 2-step back button logic: on root tab screen, initial back press triggers toast prompt "Press back again to exit Bazar Shodai" with a 2-second debounce window before exiting app.
- **Verification & Testing**:
  - Verified hardware back press event subscription and timer reset logic.
- **Known Issues**: None.

### Phase 50: Tab Transition Animations

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Configure lightweight subtle cross-fade transitions between bottom tabs.
- **Files Created/Modified**:
  - `bazar-shodai-app/app/(tabs)/_layout.tsx` (configured `animation: 'fade'` and background styling)
- **Decisions Made**:
  - Set smooth cross-fade animation across all bottom tabs to ensure zero frame dropping or blank flashes on tab switches.
- **Verification & Testing**:
  - Verified tabs layout configuration and scene styling.
- **Known Issues**: None.

## Milestone 7: Customer Authentication & Session Management

### Phase 51: Auth Store & State Management

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Implement Zustand store for user profile, authentication status, and token lifecycle.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/store/useAuthStore.ts` (Zustand auth store synchronizing SecureStore tokens, MMKV cached profile, and React state)
  - `bazar-shodai-app/src/features/auth/types/index.ts` (TypeScript interfaces for UserProfile, UserAddress, AuthSession, AuthPayloads)
  - `bazar-shodai-app/src/store/index.ts`
- **Decisions Made**:
  - Encrypted JWT tokens stored in hardware Keystore/Keychain via `tokenVault`, while the serialized user profile is cached in MMKV for zero-latency offline boot.
- **Verification & Testing**:
  - Tested store state transitions (`login`, `logout`, `setProfile`, `restoreSession`).
- **Known Issues**: None.

### Phase 52: Customer Login Screen

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Mobile login screen accepting Bangladeshi mobile phone or email + password.
- **Files Created/Modified**:
  - `bazar-shodai-app/app/(auth)/login.tsx` (Login screen with validation, password visibility toggle, forgot password and register links)
  - `bazar-shodai-app/src/features/auth/api/login.ts` (`loginApi` targeting `POST /customer/auth/login`)
- **Decisions Made**:
  - Automatically attached anonymous `guestToken` to login payload so that backend transparently merges the guest shopping basket into the customer account.
- **Verification & Testing**:
  - Form validation for empty inputs and password length (<6 chars) verified.
- **Known Issues**: None.

### Phase 53: Customer Registration Screen

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Signup screen with Name, Phone (+880), Email (optional), Password, and terms confirmation.
- **Files Created/Modified**:
  - `bazar-shodai-app/app/(auth)/register.tsx` (Registration screen with Bangladeshi phone input, password visibility toggle, terms agreement)
  - `bazar-shodai-app/src/features/auth/api/register.ts` (`registerApi` targeting `POST /customer/auth/register`)
- **Decisions Made**:
  - Standardized Bangladeshi mobile number normalization (01XXXXXXXXX) and default language `'bn'`.
- **Verification & Testing**:
  - Verified input constraints and terms toggle.
- **Known Issues**: None.

### Phase 54: Forgot Password Screen

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Request password recovery link/token via customer email or phone.
- **Files Created/Modified**:
  - `bazar-shodai-app/app/(auth)/forgot-password.tsx` (Password recovery request screen)
  - `bazar-shodai-app/src/features/auth/api/forgotPassword.ts` (`forgotPasswordApi` targeting `POST /customer/auth/forgot-password`)
- **Decisions Made**:
  - Returned friendly informational state informing customer to inspect their email or SMS for reset token.
- **Verification & Testing**:
  - Verified request submission state and navigation flow.
- **Known Issues**: None.

### Phase 55: Reset Password Screen

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Token verification and new password entry screen.
- **Files Created/Modified**:
  - `bazar-shodai-app/app/(auth)/reset-password.tsx` (Screen accepting token via search params or manual entry, new password, confirmation)
  - `bazar-shodai-app/src/features/auth/api/resetPassword.ts` (`verifyResetTokenApi` and `resetPasswordApi` targeting `GET /customer/auth/reset-password/verify` and `POST /customer/auth/reset-password`)
- **Decisions Made**:
  - Pre-fills token when navigating from deep link `bazarshodai://auth/reset-password?token=...`.
- **Verification & Testing**:
  - Verified password matching validation and token submission.
- **Known Issues**: None.

### Phase 56: User Profile Fetch & Background Sync

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Fetch current authenticated customer profile on startup and cache in store.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/auth/api/getProfile.ts` (`useUserProfile` hook and `getProfileApi` targeting `GET /customer/auth/profile`)
  - `bazar-shodai-app/app/(tabs)/account.tsx` (Integrated `useUserProfile` hook to display loyalty points, order counts, and address details)
- **Decisions Made**:
  - Hook runs only when `isAuthenticated` is true, automatically syncing remote profile updates to the local Zustand store and MMKV cache.
- **Verification & Testing**:
  - Stale time set to 5 minutes to prevent unnecessary network overhead.
- **Known Issues**: None.

### Phase 57: Change Password Screen

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: In-app password change screen requiring current password and new password confirmation.
- **Files Created/Modified**:
  - `bazar-shodai-app/app/(account)/change-password.tsx` (Change password form with current password, new password, and confirmation)
  - `bazar-shodai-app/src/features/auth/api/changePassword.ts` (`changePasswordApi` targeting `POST /customer/auth/change-password`)
- **Decisions Made**:
  - Protected route only accessible from the Account tab when authenticated.
- **Verification & Testing**:
  - Verified password validation and error feedback.
- **Known Issues**: None.

### Phase 58: Logout & Guest Session Reset

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Invalidate server session, clear tokens, and generate fresh guest cart token.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/auth/api/logout.ts` (`logoutApi` targeting `POST /customer/auth/logout`)
  - `bazar-shodai-app/src/store/useAuthStore.ts` (`logout` action)
  - `bazar-shodai-app/app/(tabs)/account.tsx` (Confirmation modal dialog for destructive logout action)
- **Decisions Made**:
  - Even if server logout fails (e.g. offline), client-side tokens are wiped from SecureStore, query client cache is cleared, and a fresh guest token UUID is generated.
- **Verification & Testing**:
  - Verified confirmation dialog flow and session reset.
- **Known Issues**: None.

---

## Milestone 8: Home Screen Experience & Sliders

### Phase 59: Home Screen Data Aggregator Hook

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Unified TanStack Query hook fetching banners, featured products, categories, and best sellers.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/home/api/useHomeData.ts` (`useHomeFeed`, `useHomeBanners`, `useHomeCategories`, `useHomeData`)
  - `bazar-shodai-app/src/features/home/types/index.ts` (TypeScript definitions for banners, feed, categories, and products)
- **Decisions Made**:
  - Executed parallel requests with individual stale times (3 min for products, 5 min for banners, 10 min for categories) and combined refresh handler.
- **Verification & Testing**:
  - TypeScript types verified against NestJS `HomeController` and `BannersController`.
- **Known Issues**: None.

### Phase 60: Home Sticky Header with Location Pill

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: App header showing active delivery zone / address, search bar trigger, and shopping bag icon.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/home/components/HomeHeader.tsx`
- **Decisions Made**:
  - Displays localized Shahrasti delivery estimate (e.g. "৩০-৬০ মিনিট ডেলিভারি"), clickable address modal trigger, and dynamic cart item counter badge.
- **Verification & Testing**:
  - Tested cart badge updates and touch handlers.
- **Known Issues**: None.

### Phase 61: Promotional Hero Slider Section

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Dynamic hero banner carousel with autoplay, manual swipe, and deep link routing.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/home/components/HeroSliderSection.tsx`
- **Decisions Made**:
  - Formatted dynamic banners from `GET /customer/banners` (`HERO_MAIN`), falling back gracefully to curated local banners if the API is offline.
- **Verification & Testing**:
  - Verified banner click link routing and autoplay timer.
- **Known Issues**: None.

### Phase 62: Category Circular Grid Section

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Horizontal scrolling or 2-row grid of popular categories with icons.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/home/components/CategoryGridSection.tsx`
- **Decisions Made**:
  - Displays localized Bengali category names (`nameBn` || `name`), item count chips, and "সব দেখুন" button routing to the Categories tab.
- **Verification & Testing**:
  - Tested category tile click navigation.
- **Known Issues**: None.

### Phase 63: Featured Products (_আজকের তাজা বাজার_) Section

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: FlashList horizontal/2-column grid showing fresh daily items with live steppers.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/home/components/FeaturedProductsSection.tsx`
- **Decisions Made**:
  - Directly connected to Zustand cart store so tapping "Add to Bag" immediately reflects quantity and morphs into a stepper.
- **Verification & Testing**:
  - Tested fractional step handling (e.g. 0.5 kg for vegetables).
- **Known Issues**: None.

### Phase 64: Best Selling Products Section

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Visual section highlighting top-selling grocery essentials.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/home/components/BestSellersSection.tsx`
- **Decisions Made**:
  - Highlighted top consumer groceries with "BEST SELLER" badges and strikethrough original prices.
- **Verification & Testing**:
  - Tested discount calculation and item additions.
- **Known Issues**: None.

### Phase 65: Brand Showcase Section

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Interactive brand pill selector filtering products by brand with smooth transitions.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/home/components/BrandShowcaseSection.tsx`
- **Decisions Made**:
  - Horizontal pill selector for top Bangladeshi grocery brands (Teer, Radhuni, Fresh, Pran, Aarong Dairy, Dano, Rupchanda, Ispahani) with active selection state.
- **Verification & Testing**:
  - Tested pill toggling and haptic feedback.
- **Known Issues**: None.

### Phase 66: Home Pull-to-Refresh & Skeleton State

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: RefreshControl updating all home queries with haptic feedback, and skeleton placeholder layout.
- **Files Created/Modified**:
  - `bazar-shodai-app/app/(tabs)/index.tsx` (Full home feed composition with `HomeSkeleton` and `RefreshControl`)
- **Decisions Made**:
  - Seamless skeleton placeholder shown while initial home data loads to avoid jarring content jumps.
- **Verification & Testing**:
  - Verified pull-to-refresh execution, haptic pulse, and query cache invalidation.
- **Known Issues**: None.

### Phase 67: Quick Category Quick-Jump Sticky Bar

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Subtle pill bar below search allowing 1-tap jump to Vegetables, Fish, Meat, Dairy, Fruits.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/home/components/QuickJumpBar.tsx`
  - `bazar-shodai-app/src/features/home/components/index.ts`
  - `bazar-shodai-app/src/features/index.ts`
- **Decisions Made**:
  - Rendered quick jump pill chips (সবজি, মাছ, মাংস, ফলমূল, দুধ ও ডিম, মসলা) with Lucide icons for rapid 1-tap category drilldown.
- **Verification & Testing**:
  - Verified tab routing and active selection state.
- **Known Issues**: None.

## Milestone 9: Product Catalog, Facets & Search Engine (Phases 68-76)

### Phase 68: Category Drilldown Screen (Categories Tab)

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: 2-column mobile layout: vertical category rail on left, subcategories and product grid on right.
- **Files Created/Modified**:
  - `bazar-shodai-app/app/(tabs)/categories.tsx`
- **Decisions Made**:
  - Implemented dual-pane responsive layout with vertical parent category selector and right-hand product grid.
  - Sourced categories from `GET /customer/categories` with graceful fallback to standard departments.
- **Verification & Testing**:
  - Tested thumb navigation between parent categories and child products; verified 0 TS errors.
- **Known Issues**: None.

### Phase 69: Product Listing Screen (`/products`)

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Infinite-scroll grid of products with sorting, count indicator, and active filters.
- **Files Created/Modified**:
  - `bazar-shodai-app/app/products/index.tsx`
- **Decisions Made**:
  - Connected with `useInfiniteProducts` hook supporting pagination, pull-to-refresh, active filter badges, and sticky bottom bar integration.
- **Verification & Testing**:
  - Tested sorting by price, popularity, and new arrivals.
- **Known Issues**: None.

### Phase 70: Full-Text Search Screen with Live Debounce

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Instant search screen with recent searches history and live suggestions as user types.
- **Files Created/Modified**:
  - `bazar-shodai-app/app/search/index.tsx`
  - `bazar-shodai-app/src/features/search/api/useSearch.ts`
- **Decisions Made**:
  - Implemented 300ms debounce to avoid overwhelming the backend search autocomplete endpoint.
- **Verification & Testing**:
  - Verified debounced suggestions and keyword matching.
- **Known Issues**: None.

### Phase 71: Search History Persistence & Suggestions

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Persist recent search queries in MMKV and sync with backend history endpoint.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/search/api/searchHistory.ts`
- **Decisions Made**:
  - Recent searches are stored in MMKV with 1-tap re-search, individual deletion, and 1-tap "Clear All" action.
- **Verification & Testing**:
  - Verified local persistence across sessions.
- **Known Issues**: None.

### Phase 72: Filter Bottom Sheet Modal

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Slide-up filter panel with Price Range, Brand checkboxes, Category selector, and In-Stock toggle.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/products/components/FilterBottomSheet.tsx`
- **Decisions Made**:
  - Filter modal features active filter badge count, Min/Max price inputs, and "Reset" & "Apply" action buttons.
- **Verification & Testing**:
  - Verified filter state application and query parameter updates.
- **Known Issues**: None.

### Phase 73: Sort Options Sheet

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Quick-select bottom sheet for sorting (Relevance, Price: Low to High, Price: High to Low, Newest).
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/products/components/SortBottomSheet.tsx`
- **Decisions Made**:
  - Clean radio sheet with checkmark selection and haptic feedback.
- **Verification & Testing**:
  - Verified sort criteria trigger and instant grid reordering.
- **Known Issues**: None.

### Phase 74: Infinite Scroll & Pagination Engine

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Automatic page fetching when user reaches scroll depth of listing.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/products/hooks/useInfiniteProducts.ts`
  - `bazar-shodai-app/src/features/products/api/productsApi.ts`
- **Decisions Made**:
  - TanStack Query `useInfiniteQuery` with `getNextPageParam` calculating `totalPages` and rendering bottom spinner.
- **Verification & Testing**:
  - Verified multi-page pagination.
- **Known Issues**: None.

### Phase 75: Back-In-Stock Subscription Dialog

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Modal allowing customers to subscribe via email/phone when an out-of-stock product is restocked.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/products/components/BackInStockDialog.tsx`
- **Decisions Made**:
  - Submits to `POST /customer/back-in-stock` and provides instant toast confirmation.
- **Verification & Testing**:
  - Verified phone/email submission and form dismissal.
- **Known Issues**: None.

### Phase 76: Empty Search & Filter State

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Helpful empty state suggesting alternative keywords or clearing active filters.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/products/components/NoProductsFound.tsx`
- **Decisions Made**:
  - Reusable component with "Clear All Filters" button and recommended search terms.
- **Verification & Testing**:
  - Verified reset action and button response.
- **Known Issues**: None.

---

## Milestone 10: Product Details Screen & Image Gallery (Phases 77-83)

### Phase 77: Product Details Layout & Header

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Fullscreen screen with collapsible hero image header, share button, and wishlist toggle.
- **Files Created/Modified**:
  - `bazar-shodai-app/app/product/[slug].tsx`
- **Decisions Made**:
  - Composed full detail layout with `ProductImageGallery`, `ProductSpecs`, `ProductReviewsList`, `WriteReviewSheet`, `RelatedProducts`, and `ProductStickyBottomBar`.
- **Verification & Testing**:
  - Verified header share button via native share sheet and wishlist toast toggle.
- **Known Issues**: None.

### Phase 78: Fullscreen Multi-Image Swiper with Pinch-to-Zoom

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Reanimated image carousel supporting pinch-to-zoom gesture and thumbnail selector.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/products/components/ProductImageGallery.tsx`
- **Decisions Made**:
  - Thumbnail selector allows 1-tap switching; tapping main image opens high-res fullscreen preview with close action.
- **Verification & Testing**:
  - Verified horizontal paging and fullscreen modal presentation.
- **Known Issues**: None.

### Phase 79: Unit Pricing & Quantity Stepper Bottom Action Bar

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Sticky bottom bar displaying total price, fractional unit stepper, and Add to Bag button.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/products/components/ProductStickyBottomBar.tsx`
- **Decisions Made**:
  - Respects safe area insets on Android & iOS; includes live price multiplier `unitPrice * quantity`.
- **Verification & Testing**:
  - Tested stepper increments and dynamic button label calculation.
- **Known Issues**: None.

### Phase 80: Product Description, Nutrition & Specifications

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Accordion tabs for description, nutritional details, origin, and unit specifications in English/Bengali.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/products/components/ProductSpecs.tsx`
- **Decisions Made**:
  - Designed clean accordion cards with chevron indicator, haptic feedback, and localized labels (দেশ, ওজন, সংরক্ষণ).
- **Verification & Testing**:
  - Verified accordion toggling and typography layout.
- **Known Issues**: None.

### Phase 81: Customer Reviews & Photo Rating Breakdown

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Review list with star breakdown, verified purchase badge, and customer review images.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/reviews/components/ProductReviewsList.tsx`
  - `bazar-shodai-app/src/features/reviews/api/reviewsApi.ts`
- **Decisions Made**:
  - Features overall score card (out of 5.0), 5-to-1 star horizontal breakdown bars, verified buyer badges, and 1-tap "Helpful" counter with haptic pulse.
- **Verification & Testing**:
  - Verified rating breakdown math and helpful vote increments.
- **Known Issues**: None.

### Phase 82: Write Review & Photo Upload Sheet

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Bottom sheet allowing customers who bought the item to rate, review, and upload photos.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/reviews/components/WriteReviewSheet.tsx`
- **Decisions Made**:
  - Integrated `expo-image-picker` allowing customers to attach up to 5 photos from camera or gallery; interactive 1-5 star selector with Bengali hint text.
- **Verification & Testing**:
  - Verified review submission mutation and image attachment.
- **Known Issues**: None.

### Phase 83: Related & Frequently Bought Together Products

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Horizontal product recommendation carousel at bottom of product detail page.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/products/components/RelatedProducts.tsx`
- **Decisions Made**:
  - Fetches category recommendations via `GET /customer/products/:slug/related`; allows 1-tap add to bag directly from recommendation cards.
- **Verification & Testing**:
  - Verified navigation to related items and stepper cart additions.
- **Known Issues**: None.

---

## Milestone 11: Medicine, Pharmacy & Prescription Module (Phases 84-89)

### Phase 84: Pharmacy & Medicine Catalog Screen

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Dedicated pharmacy landing view filtering OTC and Prescription drugs with dosage warnings.
- **Files Created/Modified**:
  - `bazar-shodai-app/app/pharmacy/index.tsx`
  - `bazar-shodai-app/src/features/pharmacy/api/pharmacyApi.ts`
  - `bazar-shodai-app/src/features/pharmacy/types/index.ts`
- **Decisions Made**:
  - Rendered hero card for doctor prescription uploads; 3 filter tabs (All, OTC, Prescription Required); displays generic compound name, manufacturer, and dosage form.
- **Verification & Testing**:
  - Verified filter pills and search by generic/brand name.
- **Known Issues**: None.

### Phase 85: Medicine Detail View & Generic Info

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Medicine-specific details showing indications, precautions, and side effects from `MedicineMeta`.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/pharmacy/components/MedicineInfoSheet.tsx`
- **Decisions Made**:
  - Prominent red warning banner for prescription-required pharmaceuticals (Rx); displays indications, precautions, and side effects.
- **Verification & Testing**:
  - Verified modal presentation and CTA routing (Upload Rx vs Add to Bag).
- **Known Issues**: None.

### Phase 86: Prescription Camera Capture & Upload Flow

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Camera viewfinder and file picker allowing instant prescription upload.
- **Files Created/Modified**:
  - `bazar-shodai-app/app/prescription/upload.tsx`
- **Decisions Made**:
  - Uses `expo-image-picker` with camera permission handling; preview with retake action; phone number validation (+880 prefix); sends multipart FormData to `POST /prescriptions`.
- **Verification & Testing**:
  - Verified submission mutation and redirect to customer prescriptions list.
- **Known Issues**: None.

### Phase 87: Uploaded Prescriptions List & Status Tracker

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: List customer's uploaded prescriptions with status (`PENDING`, `REVIEWED`, `ORDER_CREATED`, `REJECTED`).
- **Files Created/Modified**:
  - `bazar-shodai-app/app/(account)/prescriptions.tsx`
- **Decisions Made**:
  - Displays thumbnail, status badge, pharmacist feedback note, delete action for pending requests, and 1-tap ordering.
- **Verification & Testing**:
  - Verified pull-to-refresh and empty state CTA.
- **Known Issues**: None.

### Phase 88: Prescription Fullscreen Image Viewer

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Fullscreen modal viewer to review high-res prescription scans.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/pharmacy/components/PrescriptionViewerModal.tsx`
- **Decisions Made**:
  - Dark backdrop fullscreen viewer with close button, verification status badge, and pharmacist advice display.
- **Verification & Testing**:
  - Verified modal open/close and image rendering.
- **Known Issues**: None.

### Phase 89: 1-Tap Prescription Order Re-order

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Quickly create order from verified prescription items with pharmacist confirmation.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/pharmacy/components/PrescriptionOrderButton.tsx`
- **Decisions Made**:
  - Available for `REVIEWED` and `ORDER_CREATED` prescriptions; pushes approved medication package to cart and routes to Bag.
- **Verification & Testing**:
  - Verified cart state insertion and navigation.
- **Known Issues**: None.

---

## Milestone 12: Cart Engine & Stepper Synchronization (Phases 90-96)

### Phase 90: Zustand Cart Store & Optimistic Updates

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: High-speed local cart store providing instantaneous UI updates before API roundtrip.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/store/useCartStore.ts`
- **Decisions Made**:
  - Backed by MMKV storage via `storage.getObject` / `storage.setObject`; maintains applied coupon, delivery fee, and free delivery threshold.
- **Verification & Testing**:
  - Verified instant quantity updates, total calculation, and persistent storage.
- **Known Issues**: None.

### Phase 91: Cart Backend Synchronization Engine

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Sync cart items with `GET /customer/cart` and handle `X-Guest-Token` header.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/cart/api/cartApi.ts`
- **Decisions Made**:
  - Implemented `useServerCart`, `addServerCartItemApi`, `updateServerCartItemApi`, `removeServerCartItemApi`, and `applyCouponApi`.
- **Verification & Testing**:
  - Verified background sync and coupon validation mutations.
- **Known Issues**: None.

### Phase 92: Full Cart Screen (Cart Tab)

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Dedicated cart screen with list of items, unit details, stepper, subtotal, and checkout button.
- **Files Created/Modified**:
  - `bazar-shodai-app/app/(tabs)/cart.tsx`
- **Decisions Made**:
  - Features Free Shipping progress bar header, line items with stepper, coupon input, clear cart dialog, and breakdown footer.
- **Verification & Testing**:
  - Verified subtotal, coupon discount, delivery fee calculations, and checkout routing.
- **Known Issues**: None.

### Phase 93: Swipe-to-Remove Cart Item Gesture

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Clean swipe/tap delete gesture on cart line items with red trash indicator.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/cart/components/SwipeableCartItem.tsx`
- **Decisions Made**:
  - Card shows product photo, Bangla name, unit pricing, embedded `QuantityStepper`, and red trash button with haptics.
- **Verification & Testing**:
  - Verified item deletion and zero-quantity removal.
- **Known Issues**: None.

### Phase 94: Free Shipping Delivery Progress Bar

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Dynamic progress bar calculating distance to free delivery threshold (e.g. ৳500).
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/cart/components/FreeShippingProgressBar.tsx`
- **Decisions Made**:
  - Calculates percentage fill dynamically; displays "Free Delivery Unlocked!" with green truck badge when subtotal >= ৳500.
- **Verification & Testing**:
  - Verified width recalculation on cart modification.
- **Known Issues**: None.

### Phase 95: Coupon Code Input & Instant Validation

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Coupon promo input with instant server validation and applied discount banner.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/cart/components/CouponInput.tsx`
- **Decisions Made**:
  - Auto-capitalizes input; executes `applyCouponApi`; shows green card with coupon name, discount amount, and 1-tap remove button.
- **Verification & Testing**:
  - Verified coupon application, error handling, and coupon removal.
- **Known Issues**: None.

### Phase 96: Clear Cart Confirmation Dialog

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Modal to prevent accidental cart emptying.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/cart/components/ClearCartDialog.tsx`
- **Decisions Made**:
  - Warning modal with red trash icon, "Keep Items" cancel button, and destructive "Clear Bag" confirm action.
- **Verification & Testing**:
  - Verified store clearing and server cart reset.
- **Known Issues**: None.

---

## Milestone 13: Delivery Location & GPS Geocoding (Phases 97-101)

### Phase 97: Expo Location Hardware Integration

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Request OS location permissions and acquire high-accuracy GPS coordinates.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/services/location.ts`
- **Decisions Made**:
  - Integrated `expo-location`; gracefully handles permission denial by falling back to Shahrasti Sadar hub coordinates; reverse geocodes latitude/longitude to road and district.
- **Verification & Testing**:
  - Tested coordinate retrieval and address formatting.
- **Known Issues**: None.

### Phase 98: Location Share & Real-Time Delivery Fee Calculation

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Submit customer GPS coordinates to backend and calculate exact delivery charge and distance.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/location/api/myLocation.ts`
- **Decisions Made**:
  - Integrated `POST /customer/my-location` and `GET /customer/my-location`; supports location requests and Bangladesh area search.
- **Verification & Testing**:
  - Verified query invalidation and delivery fee response.
- **Known Issues**: None.

### Phase 99: Interactive Delivery Map Pin Drop Screen

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Map pin drop screen with reverse-geocoding address preview at bottom.
- **Files Created/Modified**:
  - `bazar-shodai-app/app/location/picker.tsx`
- **Decisions Made**:
  - Features GPS floating action button ("Locate Me"), address search bar, central delivery pin, delivery time pill, and "Confirm Delivery Location" CTA.
- **Verification & Testing**:
  - Verified address update and mutation execution.
- **Known Issues**: None.

### Phase 100: Address Autocomplete & Search Picker

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Search input to find locations by road, neighborhood, or area name in Bangladesh.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/location/components/AddressSearchPicker.tsx`
- **Decisions Made**:
  - Connects with `GET /customer/locations/search` for districts, upazilas, and thanas; displays English & Bengali names.
- **Verification & Testing**:
  - Verified autocomplete dropdown selection.
- **Known Issues**: None.

### Phase 101: Location Share via Link & Token Reader

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Support opening shared location tokens (`/l/[token]`) from SMS or WhatsApp links.
- **Files Created/Modified**:
  - `bazar-shodai-app/app/location/[token].tsx`
- **Decisions Made**:
  - Reads token via `GET /customer/location-requests/:token`; acquires GPS position and sends one-time pin to courier via `POST /customer/location-requests/:token/submit`.
- **Verification & Testing**:
  - Verified celebration success card and return to Home.
- **Known Issues**: None.

---

## Milestone 14: Checkout & Mobile Financial Services (bKash/Nagad/Rocket/COD) (Phases 102-108)

### Phase 102: Single-Screen Checkout Architecture

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Keyboard-aware single screen orchestrating address selection, delivery time slot, payment, and order summary.
- **Files Created/Modified**:
  - `bazar-shodai-app/app/checkout/index.tsx`
- **Decisions Made**:
  - Orchestrates `AddressSelector`, `DeliverySlotPicker`, `PaymentMethodSelector`, `MobileBankingForm`, items summary, and sticky bottom order confirmation bar.
- **Verification & Testing**:
  - Verified order placement and navigation to confirmation screen.
- **Known Issues**: None.

### Phase 103: Delivery Address Selector & Quick Add

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Horizontal selector of saved addresses (Home, Office) with 1-tap "Add New Address" modal.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/checkout/components/AddressSelector.tsx`
- **Decisions Made**:
  - Fetches saved addresses from `GET /customer/addresses`; provides slide-up modal with Home/Office pills, recipient phone, and street address.
- **Verification & Testing**:
  - Verified address selection and new address addition.
- **Known Issues**: None.

### Phase 104: Delivery Slot & Special Instructions Picker

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Time slot radio picker and delivery notes text area.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/checkout/components/DeliverySlotPicker.tsx`
- **Decisions Made**:
  - 3 options: Express (1-2 Hours), Evening Today, and Tomorrow Morning; instructions textarea for gate/rider notes.
- **Verification & Testing**:
  - Verified slot selection and text state binding.
- **Known Issues**: None.

### Phase 105: Payment Method Selector (COD, bKash, Nagad, Rocket)

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Radio selector with branded icons for Cash on Delivery, bKash, Nagad, and Rocket.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/checkout/components/PaymentMethodSelector.tsx`
- **Decisions Made**:
  - Displays branded provider themes (#e2136e for bKash, #f7941d for Nagad, #8c3494 for Rocket, #0b6234 for COD).
- **Verification & Testing**:
  - Verified radio toggling and state synchronization.
- **Known Issues**: None.

### Phase 106: Mobile Banking Transaction ID Input & Copy-to-Clipboard

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Instructions card showing merchant number with 1-tap copy, and verified Transaction ID input field.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/checkout/components/MobileBankingForm.tsx`
- **Decisions Made**:
  - Displays official merchant numbers; provides 1-tap copy action; collects customer's sender number and optional TrxID.
- **Verification & Testing**:
  - Verified copy feedback and uppercase TrxID formatting.
- **Known Issues**: None.

### Phase 107: Order Submission & Verification Mutation

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Execute `POST /customer/orders` with cart items, address, payment details, and guest token.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/checkout/api/useSubmitOrder.ts`
  - `bazar-shodai-app/src/features/checkout/types/index.ts`
- **Decisions Made**:
  - Submits payload matching `PlaceOrderDto`; automatically clears cart store and invalidates queries on success.
- **Verification & Testing**:
  - Verified mutation execution and cache updates.
- **Known Issues**: None.

### Phase 108: Order Confirmation Celebration Screen

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Success screen with celebratory checkmark animation, order number, delivery estimate, and "Track Order" button.
- **Files Created/Modified**:
  - `bazar-shodai-app/app/order-confirmation/[id].tsx`
- **Decisions Made**:
  - Displays checkmark icon with haptic feedback, order reference badge, delivery timeline explanation, and direct routing to live tracking.
- **Verification & Testing**:
  - Verified screen rendering and "Track Order Live" navigation.
- **Known Issues**: None.

---

## Milestone 15: Order Tracking, Timeline & Re-order (Phases 109-114)

### Phase 109: Order History List Screen

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: List past orders categorized by status (Active / Delivered / Cancelled).
- **Files Created/Modified**:
  - `bazar-shodai-app/app/(account)/orders.tsx`
  - `bazar-shodai-app/src/features/orders/types/index.ts`
- **Decisions Made**:
  - Tabbed filter bar (All, Active, Delivered, Cancelled); pull-to-refresh; order cards showing order number, status badge, items preview, total amount, and 1-tap "Re-order" button.
- **Verification & Testing**:
  - Verified filter tabs and card press navigation.
- **Known Issues**: None.

### Phase 110: Live Order Details & Status Stepper

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Full order breakdown with 7-step timeline (`PENDING` through `DELIVERED`).
- **Files Created/Modified**:
  - `bazar-shodai-app/app/orders/[id].tsx`
- **Decisions Made**:
  - Live 7-step vertical timeline with check icons, connector lines, and localized step titles; items breakdown; payment summary; and cancellation button.
- **Verification & Testing**:
  - Verified timeline step indicators and status badge variants.
- **Known Issues**: None.

### Phase 111: Live Courier Map & Contact Action

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Map showing delivery destination and courier marker when order is `OUT_FOR_DELIVERY`.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/orders/components/LiveDeliveryMap.tsx`
- **Decisions Made**:
  - Displayed when order status is `OUT_FOR_DELIVERY`; shows pulsing "LIVE TRACKING" badge, delivery address, courier name, and "Call Courier" phone dialer button.
- **Verification & Testing**:
  - Verified telephone linking and visibility condition.
- **Known Issues**: None.

### Phase 112: 1-Tap Re-order Engine

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Add all items from a past order back into active shopping cart with 1 tap.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/orders/api/reorder.ts`
  - `bazar-shodai-app/src/features/orders/api/ordersApi.ts`
- **Decisions Made**:
  - Syncs with `POST /customer/orders/:id/reorder` and pushes all line items to Zustand cart store, then navigates to Bag tab with success toast.
- **Verification & Testing**:
  - Verified cart store population and redirection.
- **Known Issues**: None.

### Phase 113: Customer Order Cancellation Dialog

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Allow customer to cancel order before processing begins (`PENDING` status only).
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/orders/components/CancelOrderDialog.tsx`
- **Decisions Made**:
  - Modal with reason selection (wrong address, item modification, ordered by mistake); executes `POST /customer/orders/:id/cancel` and refreshes order detail.
- **Verification & Testing**:
  - Verified cancellation mutation and status update.
- **Known Issues**: None.

### Phase 114: PDF Invoice View & Share

- **Status**: Completed [x]
- **Timestamp**: 2026-11-04
- **Goal**: Generate or download printable order receipt invoice.
- **Files Created/Modified**:
  - `bazar-shodai-app/src/features/orders/components/OrderInvoiceButton.tsx`
- **Decisions Made**:
  - Connects to `GET /customer/orders/:id/invoice` using React Native Share API; allows customer to print, share, or save receipt.
- **Verification & Testing**:
  - Verified share dialog trigger and invoice URL generation.
- **Known Issues**: None.

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

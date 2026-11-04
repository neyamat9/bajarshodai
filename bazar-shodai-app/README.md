# Bazar Shodai Mobile (React Native / Expo SDK 58)

The official native mobile storefront for **Bazar Shodai (বাজার সদাই)** — hyperlocal grocery, fresh fish, meat, produce, and online pharmacy delivery service designed for Shahrasti, Chandpur, Bangladesh.

---

## 🚀 Technology Stack

- **Framework**: Expo SDK 58 (Expo Router v58, Hermes JS engine, React Native 0.88.1, React 19.3.0)
- **Styling**: NativeWind v4 (Tailwind CSS v3.4.19) + Custom Design System Tokens
- **State Management**:
  - Global Store: Zustand v5 (Auth Store, Cart Store, Theme Store, Toast Store)
  - Synchronous Cache: `react-native-mmkv`
  - Secure Vault: `expo-secure-store`
- **Networking & Server State**:
  - Client: Axios with automatic JWT token refresh & guest UUID injection
  - Cache: TanStack React Query v5 with offline query persistence
- **Hardware & Device Capabilities**:
  - Push Notifications: `expo-notifications` with Android 8.0+ custom channels
  - GPS Geocoding: `expo-location`
  - Biometrics: `expo-local-authentication` (Fingerprint & Face ID)
  - Camera & Uploads: `expo-image-picker` with Cloudflare R2 presigned URLs
  - Social & Document Sharing: `expo-sharing`
- **Testing & Tooling**:
  - TypeScript 6.0 in Strict Mode (`@/*` root path mapping)
  - ESLint v9 Flat Config (`eslint-config-expo/flat`, `eslint-config-prettier`)
  - Prettier v3.9
  - Jest v29 + `ts-jest` for unit & business logic verification

---

## 📁 Architecture & Directory Structure

```
bazar-shodai-app/
├── app/                          # Expo Router file-system routing
│   ├── (tabs)/                   # Main navigation shell (5 bottom tabs)
│   │   ├── index.tsx             # Home: Hero banners, flash deals, categories
│   │   ├── categories.tsx        # Visual category drilldown with icons
│   │   ├── cart.tsx              # Synchronous shopping bag with free delivery bar
│   │   ├── wishlist.tsx          # Saved items with 1-tap "Move to Bag"
│   │   └── account.tsx           # Customer profile, addresses, rewards, rider portal
│   ├── (auth)/                   # Customer login, register, password reset
│   ├── (account)/                # Edit profile, address book, rewards, settings, support
│   ├── (rider)/                  # Delivery rider portal (active drop-offs, settlements)
│   ├── product/[slug].tsx        # Product details, gallery, reviews, stepper
│   ├── category/[slug].tsx       # Category catalog with price/stock facets
│   ├── search/index.tsx          # Instant search with recent queries & trending
│   ├── checkout/index.tsx        # 1-tap checkout (bKash, Nagad, Rocket, COD)
│   ├── orders/                   # Order tracking, live courier timeline, re-order
│   ├── pharmacy/                 # Prescription upload & medicine orders
│   ├── returns/                  # Refund claims with photo proof & MFS payout
│   ├── contact.tsx               # Hotline dialer & WhatsApp direct trigger
│   └── notifications/            # Inbox with deep-link navigation
├── src/
│   ├── api/                      # Axios client, interceptors, TanStack Query client
│   ├── components/               # Atomic design system (Button, Badge, Price, Card, etc.)
│   ├── constants/                # Colors, Typography, Spacing, Touch Targets, Channels
│   ├── features/                 # Modular domain slices (auth, cart, checkout, rider...)
│   ├── i18n/                     # Bilingual translation engine (English & বাংলা)
│   ├── services/                 # Push notifications, GPS location, haptics, version check
│   ├── store/                    # Zustand stores (Cart, Auth, Theme, Toast)
│   └── utils/                    # Storage (MMKV), secure vault, formatting helpers
├── __tests__/                    # Jest unit & business logic test suites
├── assets/                       # Adaptive icons, splash screen, images
├── app.json                      # Expo production app manifest
└── eas.json                      # EAS Build profiles (Dev, Preview APK, Production AAB)
```

---

## 🛠️ Development & Quality Commands

```bash
# Start Expo development server
npm start

# Run full TypeScript compiler verification (Strict Mode)
npm run type-check

# Run ESLint validation (0 errors, 0 warnings enforced)
npm run lint

# Run Jest unit test suite
npm run test

# Check & enforce Prettier code style
npm run format
npm run format:fix
```

---

## 📦 EAS Build Pipeline

Configured in `eas.json` for reproducible CI/CD:

```bash
# Build internal preview APK for Android device testing
eas build --platform android --profile preview

# Build production Android App Bundle (AAB) for Google Play Console
eas build --platform android --profile production
```

---

## 🛡️ Production Optimizations

- **Hermes Engine**: Enabled for ultra-fast startup time and minimal memory footprint.
- **ProGuard & Resource Shrinking**: Configured via `expo-build-properties` to strip unused native bytecode and drawable resources in release builds.
- **Strict Network Boundary**: Guest token UUID warmth, token rotation interceptor, and hardware-backed credential storage in iOS Keychain / Android KeyStore.


# Repository Guidelines & Rules

## Database Schema & Migrations (Prisma)

- **ALWAYS use Prisma Migrations:**
  - For schema changes in development:
    ```bash
    npx prisma migrate dev --name <descriptive_migration_name>
    ```
  - For applying migrations to staging/production:
    ```bash
    npx prisma migrate deploy
    ```
  - For regenerating the Prisma client after migrations:
    ```bash
    npx prisma generate
    ```
- **STRICT PROHIBITION on `prisma db push`:**
  - NEVER use `npx prisma db push` or `prisma db push` under any circumstances.
  - Every schema change in `server/prisma/schema.prisma` must be backed by a version-controlled migration SQL file in `server/prisma/migrations/`.

## Cross-Platform Feature Parity (Web Frontend & Mobile App)

- **Mandatory Feature & Fix Synchronization:**
  - Whenever a new feature, business logic, UX flow, or bug fix is implemented in the web storefront (`frontend/`), ALWAYS check if that capability or fix is applicable to the mobile app (`bazar-shodai-app/`).
  - If applicable, implement the corresponding feature or fix in `bazar-shodai-app/` without skipping any requirements, maintaining full cross-platform parity.
  - Never leave the mobile app out of sync with customer-facing web capabilities (such as medicine purchase options, discount engines, cart workflows, prescription uploads, and checkout behaviors).

- **Cross-Platform Verification & Testing:**
  - Verify changes in both workspaces before concluding tasks:
    - **Frontend (Web):** Run `tsc` typecheck (`node frontend/node_modules/typescript/bin/tsc -p frontend/tsconfig.json --noEmit`) and Jest tests (`npm --prefix frontend test`).
    - **Mobile App:** Run `tsc` typecheck (`npx tsc --noEmit`) and Jest tests (`npm test`) inside `bazar-shodai-app/`.

- **Comprehensive Post-Task Updates:**
  - After completing an implementation, always provide the user with a detailed, structured status report highlighting:
    1. What was updated or implemented across both Web and Mobile.
    2. Key design decisions and shared business logic.
    3. Verification and test results across both codebases.

## Communication Language

- **Always Communicate in English:**
  - Regardless of the presence of Bengali UI strings, product names, or prompt snippets, ALWAYS address the user and write all responses, status reports, plans, and explanations in clear English.

## Product Onboarding & Inventory Rules

- **Zero Stock Tracking on Product Creation (`trackStock: false`, `stock: 0`):**
  - ALL products across all categories (groceries, fresh produce, cooking staples, spices, dal, rice, packaged items, medicines, etc.) MUST be created and added WITHOUT tracking stock:
    - `trackStock: false`
    - `stock: 0`
  - NEVER assign, set, or seed positive stock numbers for any product.
  - The store owner will manually add or adjust stock in the dashboard, or explicitly request it, if stock tracking is ever needed.

- **Gram-Based Products Sold as Packets (`unit: packet`):**
  - Any product that specifies a gram measurement (e.g., 25g, 50g, 100g, 200g, 250g, 400g, 500g, etc.) MUST be configured with the unit **`packet`** (`প্যাকেট`):
    - `unit`: `packet` (`প্যাকেট`)
    - `packSize`: The exact gram amount (e.g., `"250 g"`, `"500 g"`)
    - `allowDecimal`: `false`
    - `step`: `1`
    - `minQty`: `1`
  - Customers purchase these items as discrete pre-packaged units (1 packet, 2 packets, etc.) with whole step increments, avoiding confusing decimal weight fractions.




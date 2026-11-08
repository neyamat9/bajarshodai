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


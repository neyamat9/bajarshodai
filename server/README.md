# Bazar Shodai API

REST API for Bazar Shodai (বাজার সদাই), built with NestJS, Prisma and PostgreSQL.

```bash
cp .env.example .env      # then fill it in (database URL, secrets)
npm install
npx prisma migrate deploy # create the tables
npx prisma db seed        # units, categories, demo products (optional first admin)
npm run start:dev         # http://localhost:8000/api  (Swagger at /docs)
```

- Customer endpoints live under `/api/customer/*`, admin endpoints under `/api/admin/*`.
- `SEED_SUPERADMIN_EMAIL` and `SEED_SUPERADMIN_PASSWORD` in `.env` create the first Super Admin when you run the seed.
- Build progress: [API_PROGRESS.md](API_PROGRESS.md). Project plan: [../PLAN.md](../PLAN.md).

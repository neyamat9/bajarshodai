# Bazar Shodai (বাজার সদাই)

Daily-needs grocery and fresh-food delivery for **Shahrasti upazila, Chandpur**. Customers order online (Bangla by default, English available), share their location, and we deliver within about 20 km of Kalibari Bazar.

The full plan, with the data model, delivery-fee rules, map setup and build phases, is in [PLAN.md](PLAN.md).

## Folders

| Folder | What it is | Stack | Default port |
|---|---|---|---|
| [server/](server/) | REST API | NestJS, Prisma, PostgreSQL | 8000 |
| [frontend/](frontend/) | Customer storefront | Next.js, Tailwind | 3000 |
| [dashboard/](dashboard/) | Admin and staff panel | Vite, React, Tailwind | 5173 |
| [assets/brand/](assets/brand/) | Logos | PNG | n/a |

Each app has its own `package.json` and `node_modules`. There are no workspaces, so run `npm install` inside each folder.

## Run locally

1. Copy each `.env.example` to the real env file and fill it in:
   - `server/.env.example` to `server/.env`
   - `frontend/.env.example` to `frontend/.env.local`
   - `dashboard/.env.example` to `dashboard/.env`
2. API: `cd server && npm install && npx prisma migrate deploy && npm run start:dev` (Swagger at `/docs` when `SWAGGER_ENABLED=true`).
3. Storefront: `cd frontend && npm install && npm run dev`.
4. Dashboard: `cd dashboard && npm install && npm run dev`.

Real `.env` files are git-ignored. Never commit secrets.

## Git

Single repository, single branch: `main`.

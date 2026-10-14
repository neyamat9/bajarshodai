# Bazar Shodai storefront

Customer website for Bazar Shodai (বাজার সদাই), built with Next.js, React and Tailwind CSS.

```bash
cp .env.example .env.local   # then fill it in
npm install
npm run dev                  # http://localhost:3000
```

Needs the API from `../server` running. Set `NEXT_PUBLIC_API_URL` in `.env.local`.

Useful scripts: `npm run type-check`, `npm test`, `npm run validate` (type-check + build).
See the project plan in [../PLAN.md](../PLAN.md).

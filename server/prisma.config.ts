import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node --transpile-only prisma/seed.ts',
  },
  datasource: {
    // Migrations prefer a direct (non-pooled) connection when one is given.
    url: process.env['DATABASE_URL_DIRECT'] || process.env['DATABASE_URL'],
  },
});

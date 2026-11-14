const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

let url = process.env.DATABASE_URL.replace(/&channel_binding=[^&]*/, '').replace(/\?channel_binding=[^&]*&?/, '?');
const pool = new Pool({ connectionString: url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const cats = await prisma.category.findMany({
    select: { id: true, name: true, nameBn: true, slug: true, parentCategoryId: true },
    orderBy: { displayOrder: 'asc' }
  });
  console.log(`Found ${cats.length} categories:`);
  for (const c of cats) {
    if (!c.parentCategoryId) {
      console.log(`ROOT: [${c.id}] ${c.name} (${c.nameBn}) - slug: ${c.slug}`);
      const children = cats.filter(ch => ch.parentCategoryId === c.id);
      for (const ch of children) {
        console.log(`  CHILD: [${ch.id}] ${ch.name} (${ch.nameBn}) - slug: ${ch.slug}`);
        const sub = cats.filter(s => s.parentCategoryId === ch.id);
        for (const s of sub) {
          console.log(`    SUB: [${s.id}] ${s.name} (${s.nameBn}) - slug: ${s.slug}`);
        }
      }
    }
  }
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});

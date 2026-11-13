const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

let url = process.env.DATABASE_URL.replace(/&channel_binding=[^&]*/, '').replace(/\?channel_binding=[^&]*&?/, '?');
const pool = new Pool({ connectionString: url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  const cats = await prisma.category.findMany({
    where: { parentCategoryId: 'f54d730c-5ae4-49a4-a587-f07bbc24aa17' },
    include: { _count: { select: { products: true } } },
    orderBy: { displayOrder: 'asc' }
  });
  console.log('Categories under grocery:');
  cats.forEach(c => console.log(`${c.displayOrder}. [${c.id}] ${c.slug} | ${c.name} (${c.nameBn}) | Products: ${c._count.products}`));
}

run()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });


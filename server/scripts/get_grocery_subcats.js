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
  const subcats = await prisma.category.findMany({
    where: { parentCategoryId: 'f54d730c-5ae4-49a4-a587-f07bbc24aa17' },
    orderBy: { displayOrder: 'asc' },
    select: { id: true, name: true, nameBn: true, slug: true, displayOrder: true }
  });
  console.log('Subcategories under grocery:');
  console.table(subcats);
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});

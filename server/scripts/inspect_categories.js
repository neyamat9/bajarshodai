require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

let url = process.env.DATABASE_URL;
url = url.replace(/&channel_binding=[^&]*/, '');
url = url.replace(/\?channel_binding=[^&]*&?/, '?');

const pool = new Pool({ connectionString: url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const products = await prisma.product.findMany({
    where: { categoryId: 'c6fc9554-388d-4a41-9de2-591a76bb8e84' },
    select: { id: true, name: true, nameBn: true, slug: true, productCode: true },
  });
  console.log(`FOUND ${products.length} PRODUCTS IN SPICES:`);
  for (const p of products) {
    console.log(`- [${p.productCode}] ${p.name} (${p.nameBn})`);
  }
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});

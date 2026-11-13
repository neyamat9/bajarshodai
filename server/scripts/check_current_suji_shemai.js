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
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { categoryId: '045904be-0f18-41d5-8ff1-999bdd268227' },
        { categoryId: '389fc4e7-5c3f-4961-a90f-77da18c9330f' },
        { productCode: { startsWith: 'SS-' } }
      ]
    },
    include: { images: true, category: true, unit: true },
    orderBy: { productCode: 'asc' }
  });

  console.log(`Found ${products.length} products:`);
  products.forEach(p => {
    console.log(`[${p.productCode}] ${p.name} (${p.nameBn}) | Cat: ${p.category.name} (${p.category.nameBn}) [${p.category.slug}] | Unit: ${p.unit.nameBn} | Stock: ${p.stock} | Img: ${p.images[0]?.url}`);
  });
}

run()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });


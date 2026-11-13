const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

let url = process.env.DATABASE_URL.replace(/&channel_binding=[^&]*/, '').replace(/\?channel_binding=[^&]*&?/, '?');
const pool = new Pool({ connectionString: url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkCatalog() {
  console.log('--- 1. Grocery Category Details ---');
  const parent = await prisma.category.findUnique({
    where: { slug: 'grocery' },
    include: {
      childCategories: {
        where: { status: 'ACTIVE' },
        orderBy: { displayOrder: 'asc' },
        include: {
          _count: { select: { products: true } }
        }
      }
    }
  });

  console.log(`Parent: ${parent?.name} (${parent?.nameBn}) [slug: ${parent?.slug}]`);
  parent?.childCategories.forEach(sub => {
    console.log(`  ${sub.displayOrder}. ${sub.name.padEnd(20, ' ')} (${sub.nameBn.padEnd(20, ' ')}) [slug: ${sub.slug}] => ${sub._count.products} products`);
  });

  console.log('\n--- 2. Flour & Semolina Products (আটা, ময়দা ও সুজি) ---');
  const flourProducts = await prisma.product.findMany({
    where: { category: { slug: 'cooking-flour-and-semolina' }, status: 'ACTIVE' },
    include: { images: true, unit: true },
    orderBy: { productCode: 'asc' }
  });
  flourProducts.forEach(p => {
    console.log(`  [${p.productCode}] ${p.name} | Price: ৳${p.sellingPrice} | Unit: ${p.unit.nameBn} | Stock: ${p.stock} | TrackStock: ${p.trackStock} | Image: ${p.images[0]?.url}`);
  });

  console.log('\n--- 3. Shemai Products (সেমাই) ---');
  const shemaiProducts = await prisma.product.findMany({
    where: { category: { slug: 'cooking-shemai' }, status: 'ACTIVE' },
    include: { images: true, unit: true },
    orderBy: { productCode: 'asc' }
  });
  shemaiProducts.forEach(p => {
    console.log(`  [${p.productCode}] ${p.name} | Price: ৳${p.sellingPrice} | Unit: ${p.unit.nameBn} | Stock: ${p.stock} | TrackStock: ${p.trackStock} | Image: ${p.images[0]?.url}`);
  });
}

checkCatalog()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

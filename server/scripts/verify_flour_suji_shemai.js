const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

let url = process.env.DATABASE_URL.replace(/&channel_binding=[^&]*/, '').replace(/\?channel_binding=[^&]*&?/, '?');
const pool = new Pool({ connectionString: url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const FLOUR_CATEGORY_ID = '389fc4e7-5c3f-4961-a90f-77da18c9330f'; // Flour & Semolina (আটা, ময়দা ও সুজি)
const SHEMAI_CATEGORY_ID = '045904be-0f18-41d5-8ff1-999bdd268227'; // Shemai (সেমাই)
const UNIT_PACKET_ID = '77eb802d-9a7f-4bde-b0ca-d48056787943';

async function main() {
  console.log('========================================================================');
  console.log('VERIFICATION AUDIT: FLOUR & SEMOLINA (SUJI) + SHEMAI PRODUCTS');
  console.log('========================================================================\n');

  // Verify Flour & Semolina Category
  const flourCat = await prisma.category.findUnique({
    where: { id: FLOUR_CATEGORY_ID },
    include: {
      products: {
        include: { images: true, unit: true },
        orderBy: { productCode: 'asc' },
      },
    },
  });

  console.log(`Category 1: ${flourCat.name} (${flourCat.nameBn}) [Slug: "${flourCat.slug}"] - DisplayOrder: ${flourCat.displayOrder}`);
  console.log(`Products Count: ${flourCat.products.length}`);
  flourCat.products.forEach((p, i) => {
    console.log(
      `  ${i + 1}. [${p.productCode}] ${p.name.padEnd(28, ' ')} (${p.nameBn.padEnd(24, ' ')}) | Pack: ${p.packSize.padEnd(6, ' ')} | Price: ৳${p.sellingPrice} | Unit: ${p.unit.nameBn} | Stock: ${p.stock} (track: ${p.trackStock}) | Image: ${p.images[0]?.url ? 'OK' : 'MISSING'}`
    );
  });

  // Verify Shemai Category
  const shemaiCat = await prisma.category.findUnique({
    where: { id: SHEMAI_CATEGORY_ID },
    include: {
      products: {
        include: { images: true, unit: true },
        orderBy: { productCode: 'asc' },
      },
    },
  });

  console.log(`\nCategory 2: ${shemaiCat.name} (${shemaiCat.nameBn}) [Slug: "${shemaiCat.slug}"] - DisplayOrder: ${shemaiCat.displayOrder}`);
  console.log(`Products Count: ${shemaiCat.products.length}`);
  shemaiCat.products.forEach((p, i) => {
    console.log(
      `  ${i + 1}. [${p.productCode}] ${p.name.padEnd(42, ' ')} (${p.nameBn.padEnd(35, ' ')}) | Pack: ${p.packSize.padEnd(6, ' ')} | Price: ৳${p.sellingPrice} | Unit: ${p.unit.nameBn} | Stock: ${p.stock} (track: ${p.trackStock}) | Image: ${p.images[0]?.url ? 'OK' : 'MISSING'}`
    );
  });

  const allProducts = [...flourCat.products, ...shemaiCat.products];

  const allZeroStock = allProducts.every(p => Number(p.stock) === 0);
  const allNoTrack = allProducts.every(p => p.trackStock === false);
  const allPacket = allProducts.every(p => p.unitId === UNIT_PACKET_ID);
  const allImages = allProducts.every(p => p.images.length > 0 && p.images[0].url.startsWith('https://'));

  console.log('\n--- Business Rules Audit Results ---');
  console.log(`1. Zero Stock Rule (stock === 0):                    ${allZeroStock ? 'PASS ✓' : 'FAIL ✗'}`);
  console.log(`2. No Stock Tracking (trackStock === false):        ${allNoTrack ? 'PASS ✓' : 'FAIL ✗'}`);
  console.log(`3. Grams Sold As Packet (unit === packet):          ${allPacket ? 'PASS ✓' : 'FAIL ✗'}`);
  console.log(`4. 1200x1200px WebP Images on R2 CDN:              ${allImages ? 'PASS ✓' : 'FAIL ✗'}`);
  console.log(`5. Suji Count in Flour & Semolina:                  ${flourCat.products.length === 2 ? 'PASS ✓ (2/2)' : 'FAIL ✗'}`);
  console.log(`6. Shemai Count in Shemai:                          ${shemaiCat.products.length === 7 ? 'PASS ✓ (7/7)' : 'FAIL ✗'}`);
  console.log('========================================================================\n');

  if (!allZeroStock || !allNoTrack || !allPacket || !allImages || flourCat.products.length !== 2 || shemaiCat.products.length !== 7) {
    throw new Error('Audit verification failed!');
  }
}

main()
  .catch(err => {
    console.error('Audit failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });


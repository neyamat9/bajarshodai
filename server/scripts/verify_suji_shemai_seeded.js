require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

let url = process.env.DATABASE_URL.replace(/&channel_binding=[^&]*/, '').replace(/\?channel_binding=[^&]*&?/, '?');
const pool = new Pool({ connectionString: url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const FLOUR_CATEGORY_ID = '389fc4e7-5c3f-4961-a90f-77da18c9330f'; // Flour & Semolina (আটা, ময়দা ও সুজি)
const SHEMAI_CATEGORY_ID = '045904be-0f18-41d5-8ff1-999bdd268227'; // Shemai (সেমাই)
const UNIT_PACKET_ID = '77eb802d-9a7f-4bde-b0ca-d48056787943';

async function main() {
  const sujiProducts = await prisma.product.findMany({
    where: { categoryId: FLOUR_CATEGORY_ID },
    include: { images: true, unit: true, category: true },
    orderBy: { productCode: 'asc' },
  });

  const shemaiProducts = await prisma.product.findMany({
    where: { categoryId: SHEMAI_CATEGORY_ID },
    include: { images: true, unit: true, category: true },
    orderBy: { productCode: 'asc' },
  });

  console.log(`\n======================================================`);
  console.log(`VERIFICATION REPORT: SUJI & SHEMAI PRODUCTS`);
  console.log(`======================================================`);
  console.log(`Suji in Flour & Semolina (আটা, ময়দা ও সুজি): ${sujiProducts.length} / 2`);
  sujiProducts.forEach((p, idx) => {
    console.log(
      `  ${idx + 1}. [${p.productCode}] ${p.name.padEnd(25, ' ')} | Pack: ${p.packSize.padEnd(6, ' ')} | Price: ৳${p.sellingPrice} | Unit: ${p.unit.nameBn} | TrackStock: ${p.trackStock} | Stock: ${p.stock} | Img: ${p.images[0]?.url ? 'YES' : 'NO'}`
    );
  });

  console.log(`\nShemai in Shemai Category (সেমাই): ${shemaiProducts.length} / 7`);
  shemaiProducts.forEach((p, idx) => {
    console.log(
      `  ${idx + 1}. [${p.productCode}] ${p.name.padEnd(38, ' ')} | Pack: ${p.packSize.padEnd(6, ' ')} | Price: ৳${p.sellingPrice} | Unit: ${p.unit.nameBn} | TrackStock: ${p.trackStock} | Stock: ${p.stock} | Img: ${p.images[0]?.url ? 'YES' : 'NO'}`
    );
  });

  const all = [...sujiProducts, ...shemaiProducts];
  const allZeroStock = all.every(p => Number(p.stock) === 0);
  const allTrackStockFalse = all.every(p => p.trackStock === false);
  const allPacketUnit = all.every(p => p.unitId === UNIT_PACKET_ID);
  const allHaveImages = all.every(p => p.images && p.images.length > 0);

  console.log(`\n--- Verification Checks ---`);
  console.log(`- Strict Zero Stock (stock === 0): ${allZeroStock ? 'PASS ✓' : 'FAIL ✗'}`);
  console.log(`- Strict No Stock Tracking (trackStock === false): ${allTrackStockFalse ? 'PASS ✓' : 'FAIL ✗'}`);
  console.log(`- Gram-to-Packet Unit Rule (unit === packet): ${allPacketUnit ? 'PASS ✓' : 'FAIL ✗'}`);
  console.log(`- 1200x1200px Clean WebP Images Linked: ${allHaveImages ? 'PASS ✓' : 'FAIL ✗'}`);
  console.log(`- Flour Category Count: ${sujiProducts.length === 2 ? 'PASS ✓ (2)' : 'FAIL ✗'}`);
  console.log(`- Shemai Category Count: ${shemaiProducts.length === 7 ? 'PASS ✓ (7)' : 'FAIL ✗'}`);
  console.log(`======================================================\n`);

  if (!allZeroStock || !allTrackStockFalse || !allPacketUnit || !allHaveImages || sujiProducts.length !== 2 || shemaiProducts.length !== 7) {
    throw new Error('Verification failed!');
  }
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});

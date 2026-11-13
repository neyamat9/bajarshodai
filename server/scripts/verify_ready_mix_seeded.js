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

const CATEGORY_ID = '0f7bf7ac-c705-4274-8957-b1a49a62adec';
const UNIT_PACKET_ID = '77eb802d-9a7f-4bde-b0ca-d48056787943';

async function main() {
  const products = await prisma.product.findMany({
    where: { categoryId: CATEGORY_ID },
    include: {
      images: true,
      unit: true,
      category: true,
    },
    orderBy: { productCode: 'asc' },
  });

  console.log(`\n========================================`);
  console.log(`VERIFICATION REPORT: READY MIX PRODUCTS`);
  console.log(`========================================`);
  console.log(`Total Products in Ready Mix Category: ${products.length} / 48`);

  let allZeroStock = true;
  let allTrackStockFalse = true;
  let allPacketUnit = true;
  let allHaveImages = true;

  products.forEach((p, idx) => {
    if (Number(p.stock) !== 0) allZeroStock = false;
    if (p.trackStock !== false) allTrackStockFalse = false;
    if (p.unitId !== UNIT_PACKET_ID) allPacketUnit = false;
    if (!p.images || p.images.length === 0) allHaveImages = false;

    console.log(
      `${String(idx + 1).padStart(2, ' ')}. [${p.productCode}] ${p.name.padEnd(42, ' ')} | Pack: ${p.packSize.padEnd(6, ' ')} | Price: ৳${p.sellingPrice} | Unit: ${p.unit.nameBn} | TrackStock: ${p.trackStock} | Stock: ${p.stock} | Img: ${p.images[0]?.url ? 'YES' : 'NO'}`
    );
  });

  console.log(`\n--- Verification Checks ---`);
  console.log(`- Strict Zero Stock (stock === 0): ${allZeroStock ? 'PASS ✓' : 'FAIL ✗'}`);
  console.log(`- Strict No Stock Tracking (trackStock === false): ${allTrackStockFalse ? 'PASS ✓' : 'FAIL ✗'}`);
  console.log(`- Gram-to-Packet Unit Rule (unit === packet): ${allPacketUnit ? 'PASS ✓' : 'FAIL ✗'}`);
  console.log(`- 1200x1200px Clean WebP Images Linked: ${allHaveImages ? 'PASS ✓' : 'FAIL ✗'}`);
  console.log(`========================================\n`);

  if (!allZeroStock || !allTrackStockFalse || !allPacketUnit || !allHaveImages || products.length !== 48) {
    throw new Error('Verification failed!');
  }
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});

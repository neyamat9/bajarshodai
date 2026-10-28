require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

let url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is missing!');
  process.exit(1);
}
url = url.replace(/&channel_binding=[^&]*/, '').replace(/\?channel_binding=[^&]*&?/, '?');
const pool = new Pool({ connectionString: url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Fast Fixing Medicine Units and Setting Up Initial Pricing ---');

  // 1. Upsert strip unit
  const stripUnit = await prisma.unit.upsert({
    where: { code: 'strip' },
    update: {
      name: 'Strip',
      nameBn: 'পাতা',
      shortLabel: 'strip',
      shortLabelBn: 'পাতা',
      allowDecimal: false,
      defaultStep: 1,
      defaultMinQty: 1,
      isActive: true,
    },
    create: {
      code: 'strip',
      name: 'Strip',
      nameBn: 'পাতা',
      shortLabel: 'strip',
      shortLabelBn: 'পাতা',
      allowDecimal: false,
      defaultStep: 1,
      defaultMinQty: 1,
      isActive: true,
    },
  });
  console.log(`Ensured 'strip' unit exists: ID ${stripUnit.id} (${stripUnit.nameBn})`);

  // 2. Fast Bulk Update for Tablet & Capsule Medicines -> assign strip unit & ensure regularPrice = mrpStrip
  console.log('Running bulk SQL update for tablets & capsules...');
  const stripRes = await prisma.$executeRawUnsafe(`
    UPDATE "Product" p
    SET 
      "unitId" = '${stripUnit.id}',
      "regularPrice" = COALESCE(m."mrpStrip", m."mrpUnit" * 10, p."sellingPrice"),
      "sellingPrice" = COALESCE(m."mrpStrip", m."mrpUnit" * 10, p."sellingPrice")
    FROM "MedicineMeta" m
    WHERE p.id = m."productId"
      AND (
        m."dosageForm" ~* 'tablet|capsule|pill'
        OR p."packSize" ~* 'strip'
        OR m."packSizeInfo" ~* 'strip'
      );
  `);
  console.log(`Updated ${stripRes} tablet/capsule products to unit 'strip' (পাতা).`);

  // 3. Fast Bulk Update for other medicines (Syrup, Drop, Cream, etc.) -> regularPrice = mrpUnit
  console.log('Running bulk SQL update for other medicines...');
  const otherRes = await prisma.$executeRawUnsafe(`
    UPDATE "Product" p
    SET 
      "regularPrice" = COALESCE(m."mrpUnit", p."sellingPrice")
    FROM "MedicineMeta" m
    WHERE p.id = m."productId"
      AND NOT (
        m."dosageForm" ~* 'tablet|capsule|pill'
        OR p."packSize" ~* 'strip'
        OR m."packSizeInfo" ~* 'strip'
      );
  `);
  console.log(`Updated ${otherRes} other medicines.`);

  // 4. Initialize discountMode in MedicineMeta
  const metaRes = await prisma.$executeRawUnsafe(`
    UPDATE "MedicineMeta"
    SET "discountMode" = 'GLOBAL'
    WHERE "discountMode" IS NULL OR "discountMode" = '';
  `);
  console.log(`Initialized ${metaRes} MedicineMeta rows to discountMode 'GLOBAL'.`);

  // 5. Verification query on Napa 500 mg Tablet
  const napa = await prisma.product.findFirst({
    where: { name: { contains: 'Napa 500 mg Tablet', mode: 'insensitive' } },
    include: { medicineMeta: true, unit: true },
  });
  if (napa) {
    console.log('\n--- Napa 500 mg Tablet Verification ---');
    console.log(`Product: ${napa.name}`);
    console.log(`Selling Price: ৳${napa.sellingPrice}`);
    console.log(`Regular Price (MRP): ৳${napa.regularPrice}`);
    console.log(`Unit: ${napa.unit?.nameBn} (${napa.unit?.code})`);
    console.log(`MRP Unit: ৳${napa.medicineMeta?.mrpUnit}`);
    console.log(`MRP Strip: ৳${napa.medicineMeta?.mrpStrip}`);
    console.log(`Discount Mode: ${napa.medicineMeta?.discountMode}`);
  }

  console.log('\n--- Completed fast migration successfully! ---');
  await pool.end();
  process.exit(0);
}

main().catch(async (e) => {
  console.error('Error during fast unit fix script:', e);
  await pool.end();
  process.exit(1);
});

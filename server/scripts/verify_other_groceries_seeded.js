const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

let url = process.env.DATABASE_URL.replace(/&channel_binding=[^&]*/, '').replace(/\?channel_binding=[^&]*&?/, '?');
const pool = new Pool({ connectionString: url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const CATEGORY_ID = 'cd7283be-6dc3-4063-be4c-3152cb3b485a';

async function main() {
  console.log('========================================================================');
  console.log('VERIFICATION AUDIT: OTHER GROCERIES (অন্যান্য সামগ্রী) PRODUCTS');
  console.log('========================================================================\n');

  const cat = await prisma.category.findUnique({
    where: { id: CATEGORY_ID },
    include: {
      parentCategory: true,
      products: {
        include: { images: true, unit: true, brand: true },
        orderBy: { productCode: 'asc' },
      },
    },
  });

  if (!cat) {
    console.error('ERROR: Category not found!');
    process.exit(1);
  }

  console.log(`Category: ${cat.name} (${cat.nameBn})`);
  console.log(`Slug: "${cat.slug}" | ID: ${cat.id} | DisplayOrder: ${cat.displayOrder}`);
  console.log(`Parent: ${cat.parentCategory?.name} (${cat.parentCategory?.nameBn}) [Slug: ${cat.parentCategory?.slug}]\n`);

  console.log(`Products Count: ${cat.products.length}\n`);

  let allChecksPassed = true;

  cat.products.forEach((p, idx) => {
    const mainImg = p.images.find(img => img.isMain) || p.images[0];
    const imgStatus = mainImg?.url?.startsWith('https://') ? 'VALID_URL' : 'MISSING';
    const zeroStockOk = p.stock == 0 && p.trackStock === false;
    const unitOk = p.unit?.name?.toLowerCase() === 'packet' && p.unit?.nameBn === 'প্যাকেট';

    console.log(`[#${idx + 1}] Code: ${p.productCode}`);
    console.log(`    Name: ${p.name} | ${p.nameBn}`);
    console.log(`    Slug: ${p.slug}`);
    console.log(`    Pack Size: ${p.packSize} | Unit: ${p.unit?.nameBn} (${p.unit?.name})`);
    console.log(`    Price: Regular ৳${p.regularPrice} | Selling ৳${p.sellingPrice} | Discount: ${p.discountPrice ? `৳${p.discountPrice}` : 'None'}`);
    console.log(`    Stock: ${p.stock} | trackStock: ${p.trackStock} [Rule check: ${zeroStockOk ? 'PASS' : 'FAIL'}]`);
    console.log(`    Brand: ${p.brand ? p.brand.name : 'None (Generic)'}`);
    console.log(`    Image: [${imgStatus}] ${mainImg?.url}`);
    console.log('------------------------------------------------------------------------');

    if (!zeroStockOk || !unitOk || imgStatus !== 'VALID_URL') {
      allChecksPassed = false;
    }
  });

  console.log(`\nOverall Verification Result: ${allChecksPassed ? 'ALL AUDIT CHECKS PASSED PERFECTLY ✓' : 'FAILED AUDIT CHECKS ✗'}`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

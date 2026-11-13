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

async function main() {
  console.log('--- Step 1: Update Categories ---');

  // Update Flour & Semolina (আটা, ময়দা ও সুজি)
  const flourCat = await prisma.category.update({
    where: { id: FLOUR_CATEGORY_ID },
    data: {
      name: 'Flour & Semolina',
      nameBn: 'আটা, ময়দা ও সুজি',
      slug: 'cooking-flour-and-semolina',
      displayOrder: 7,
      status: 'ACTIVE',
      description: 'High-quality wheat flour (atta), refined flour (maida), and granular semolina (suji) for daily cooking and desserts.',
      descriptionBn: 'প্রতিদিনের পুষ্টিকর রুটি, পরোটা ও সুস্বাদু হালুয়ার জন্য বাছাইকৃত সেরা আটা, ময়দা ও দানাদার সুজি।',
    },
  });
  console.log(`✓ Updated Flour & Semolina: [${flourCat.id}] ${flourCat.name} (${flourCat.nameBn}) -> Order: ${flourCat.displayOrder}`);

  // Update Shemai (সেমাই)
  const shemaiCat = await prisma.category.update({
    where: { id: SHEMAI_CATEGORY_ID },
    data: {
      name: 'Shemai',
      nameBn: 'সেমাই',
      slug: 'cooking-shemai',
      displayOrder: 8,
      status: 'ACTIVE',
      description: 'Traditional crispy lachha shemai, golden roasted vermicelli, and fine red shemai from leading brands.',
      descriptionBn: 'সেরা ব্র্যান্ডের মুখরোচক লাচ্ছা সেমাই, সোনালী রোস্টেড চিকন সেমাই ও লাল ভারমিচিলি সেমাই।',
    },
  });
  console.log(`✓ Updated Shemai: [${shemaiCat.id}] ${shemaiCat.name} (${shemaiCat.nameBn}) -> Order: ${shemaiCat.displayOrder}`);

  console.log('\n--- Step 2: Move Suji Products to Flour & Semolina ---');
  const sujiProducts = [
    {
      slug: 'fresh-suji-500g',
      productCode: 'SUJI-01',
      name: 'Fresh Suji 500g',
      nameBn: 'ফ্রেশ সুজি ৫০০ গ্রাম',
    },
    {
      slug: 'aci-pure-suji-500g',
      productCode: 'SUJI-02',
      name: 'ACI Pure Suji 500g',
      nameBn: 'এ সি আই পিওর সুজি ৫০০ গ্রাম',
    },
  ];

  for (const item of sujiProducts) {
    const updated = await prisma.product.update({
      where: { slug: item.slug },
      data: {
        productCode: item.productCode,
        categoryId: FLOUR_CATEGORY_ID,
        categoryName: 'Flour & Semolina',
      },
    });
    console.log(`  ✓ Moved to Flour & Semolina: [${updated.productCode}] ${updated.name} (${updated.nameBn})`);
  }

  console.log('\n--- Step 3: Update Shemai Products in Shemai Category ---');
  const shemaiProducts = [
    {
      slug: 'banoful-lachha-shemai-200g',
      productCode: 'SHEMAI-01',
      name: 'Banoful Lachha Shemai 200g',
      nameBn: 'বনফুল লাচ্ছা সেমাই ২০০ গ্রাম',
    },
    {
      slug: 'radhuni-shemai-200g',
      productCode: 'SHEMAI-02',
      name: 'Radhuni Shemai 200g',
      nameBn: 'রাঁধুনী সেমাই ২০০ গ্রাম',
    },
    {
      slug: 'kolson-special-lachha-shemai-180g',
      productCode: 'SHEMAI-03',
      name: 'Kolson Special Lachha Shemai 180g',
      nameBn: 'কুলসন স্পেশাল লাচ্ছা সেমাই ১৮০ গ্রাম',
    },
    {
      slug: 'pran-chikon-shemai-200g',
      productCode: 'SHEMAI-04',
      name: 'Pran Chikon Shemai 200g',
      nameBn: 'প্রাণ চিকন সেমাই ২০০ গ্রাম',
    },
    {
      slug: 'olympic-lachha-shemai-200g',
      productCode: 'SHEMAI-05',
      name: 'Olympic Lachha Shemai 200g',
      nameBn: 'অলিম্পিক লাচ্ছা সেমাই ২০০ গ্রাম',
    },
    {
      slug: 'banoful-vermicelli-shemai-200g',
      productCode: 'SHEMAI-06',
      name: 'Banoful Vermicelli Shemai 200g',
      nameBn: 'বনফুল ভারমিচিলি সেমাই ২০০ গ্রাম',
    },
    {
      slug: 'kolson-cock-vermicelli-red-shemai-200g',
      productCode: 'SHEMAI-07',
      name: 'Kolson Cock Vermicelli Red Shemai 200g',
      nameBn: 'কুলসন কক ভারমিসেলি লাল সেমাই ২০০ গ্রাম',
    },
  ];

  for (const item of shemaiProducts) {
    const updated = await prisma.product.update({
      where: { slug: item.slug },
      data: {
        productCode: item.productCode,
        categoryId: SHEMAI_CATEGORY_ID,
        categoryName: 'Shemai',
      },
    });
    console.log(`  ✓ Updated in Shemai: [${updated.productCode}] ${updated.name} (${updated.nameBn})`);
  }

  console.log('\n--- Step 4: Verification of Grocery Subcategories ---');
  const grocerySubs = await prisma.category.findMany({
    where: { parentCategoryId: 'f54d730c-5ae4-49a4-a587-f07bbc24aa17' },
    include: { _count: { select: { products: true } } },
    orderBy: { displayOrder: 'asc' },
  });

  grocerySubs.forEach(c => {
    console.log(` ${c.displayOrder}. ${c.name} (${c.nameBn}) -> slug: "${c.slug}" | Products: ${c._count.products}`);
  });
}

main()
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });


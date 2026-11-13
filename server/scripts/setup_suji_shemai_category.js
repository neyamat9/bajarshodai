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
  const parentId = 'f54d730c-5ae4-49a4-a587-f07bbc24aa17'; // grocery

  // Setup / Update Flour & Semolina (আটা, ময়দা ও সুজি)
  const flourCat = await prisma.category.upsert({
    where: { slug: 'cooking-flour-and-semolina' },
    update: {
      name: 'Flour & Semolina',
      nameBn: 'আটা, ময়দা ও সুজি',
      parentCategoryId: parentId,
      displayOrder: 7,
      status: 'ACTIVE',
      description: 'High-quality wheat flour (atta), refined flour (maida), and granular semolina (suji) for daily cooking and desserts.',
      descriptionBn: 'প্রতিদিনের পুষ্টিকর রুটি, পরোটা ও সুস্বাদু হালুয়ার জন্য বাছাইকৃত সেরা আটা, ময়দা ও দানাদার সুজি।',
    },
    create: {
      name: 'Flour & Semolina',
      nameBn: 'আটা, ময়দা ও সুজি',
      slug: 'cooking-flour-and-semolina',
      parentCategoryId: parentId,
      displayOrder: 7,
      status: 'ACTIVE',
      description: 'High-quality wheat flour (atta), refined flour (maida), and granular semolina (suji) for daily cooking and desserts.',
      descriptionBn: 'প্রতিদিনের পুষ্টিকর রুটি, পরোটা ও সুস্বাদু হালুয়ার জন্য বাছাইকৃত সেরা আটা, ময়দা ও দানাদার সুজি।',
    },
  });
  console.log(`✓ Flour & Semolina Category: [${flourCat.id}] ${flourCat.name} (${flourCat.nameBn})`);

  // Setup / Update Shemai (সেমাই)
  const shemaiCat = await prisma.category.upsert({
    where: { slug: 'cooking-shemai' },
    update: {
      name: 'Shemai',
      nameBn: 'সেমাই',
      parentCategoryId: parentId,
      displayOrder: 8,
      status: 'ACTIVE',
      description: 'Traditional crispy lachha shemai, golden roasted vermicelli, and fine red shemai from leading brands.',
      descriptionBn: 'সেরা ব্র্যান্ডের মুখরোচক লাচ্ছা সেমাই, সোনালী রোস্টেড চিকন সেমাই ও লাল ভারমিচিলি সেমাই।',
    },
    create: {
      name: 'Shemai',
      nameBn: 'সেমাই',
      slug: 'cooking-shemai',
      parentCategoryId: parentId,
      displayOrder: 8,
      status: 'ACTIVE',
      description: 'Traditional crispy lachha shemai, golden roasted vermicelli, and fine red shemai from leading brands.',
      descriptionBn: 'সেরা ব্র্যান্ডের মুখরোচক লাচ্ছা সেমাই, সোনালী রোস্টেড চিকন সেমাই ও লাল ভারমিচিলি সেমাই।',
    },
  });
  console.log(`✓ Shemai Category: [${shemaiCat.id}] ${shemaiCat.name} (${shemaiCat.nameBn})`);

  const children = await prisma.category.findMany({
    where: { parentCategoryId: parentId },
    orderBy: { displayOrder: 'asc' },
  });

  console.log('\nGrocery Child Categories in Order:');
  children.forEach(c => console.log(` ${c.displayOrder}. ${c.name} (${c.nameBn}) -> slug: "${c.slug}" [${c.id}]`));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

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
  const parentCooking = await prisma.category.findUnique({
    where: { slug: 'cooking' },
  });

  if (!parentCooking) {
    throw new Error('Parent category Cooking not found!');
  }

  console.log(`Parent Cooking category found: ${parentCooking.id}`);

  // Create or update Spices subcategory
  const spicesCategory = await prisma.category.upsert({
    where: { slug: 'cooking-spices' },
    update: {
      name: 'Spices',
      nameBn: 'মসলা',
      parentCategoryId: parentCooking.id,
      displayOrder: 2,
      status: 'ACTIVE',
      descriptionBn: 'রান্নার সেরা খাঁটি গুঁড়া ও আস্ত মসলা, বস্তার খোলা মসলা ও ব্র্যান্ডেড প্যাকেট',
      description: 'Authentic ground & whole spices, open loose bazaar spices, and branded spice packets',
    },
    create: {
      name: 'Spices',
      nameBn: 'মসলা',
      slug: 'cooking-spices',
      parentCategoryId: parentCooking.id,
      displayOrder: 2,
      status: 'ACTIVE',
      descriptionBn: 'রান্নার সেরা খাঁটি গুঁড়া ও আস্ত মসলা, বস্তার খোলা মসলা ও ব্র্যান্ডেড প্যাকেট',
      description: 'Authentic ground & whole spices, open loose bazaar spices, and branded spice packets',
    },
  });

  console.log(`✓ Spices subcategory ready: [${spicesCategory.id}] ${spicesCategory.name} (${spicesCategory.nameBn})`);

  // Update other child categories display order so they follow in logical sequence:
  // 1: Rice, 2: Spices, 3: Pulses & Dal, 4: Cooking Oil, 5: Flour & Semolina
  await prisma.category.updateMany({
    where: { slug: 'cooking-rice' },
    data: { displayOrder: 1 },
  });
  await prisma.category.updateMany({
    where: { slug: 'cooking-pulses' },
    data: { displayOrder: 3 },
  });
  await prisma.category.updateMany({
    where: { slug: 'cooking-oil' },
    data: { displayOrder: 4 },
  });
  await prisma.category.updateMany({
    where: { slug: 'cooking-flour-and-semolina' },
    data: { displayOrder: 5 },
  });

  const children = await prisma.category.findMany({
    where: { parentCategoryId: parentCooking.id },
    orderBy: { displayOrder: 'asc' },
  });

  console.log('\nCooking Subcategories in Order:');
  children.forEach(c => console.log(` ${c.displayOrder}. ${c.name} (${c.nameBn}) -> slug: ${c.slug} [${c.id}]`));
}

run()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

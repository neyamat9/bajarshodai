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
  console.log('--- Consolidating Category into Cooking (রান্নাবান্না) ---');

  // 1. Update Parent Category
  const parentId = 'f54d730c-5ae4-49a4-a587-f07bbc24aa17';
  const cookingCat = await prisma.category.update({
    where: { id: parentId },
    data: {
      name: 'Cooking',
      nameBn: 'রান্নাবান্না',
      slug: 'cooking',
      description: 'Essential pantry ingredients, daily staples, spices, and cooking essentials for your kitchen.',
      descriptionBn: 'প্রতিদিনের রান্নার প্রয়োজনীয় চাল, ডাল, তেল, মসলা ও রান্নাবান্নার সকল সামগ্রী।',
      displayOrder: 5,
      isHomepage: true,
      status: 'ACTIVE',
    },
  });
  console.log('Updated Parent Category:', cookingCat.name, cookingCat.nameBn, cookingCat.slug);

  // 2. Update Child Subcategories under Cooking
  const subRice = await prisma.category.update({
    where: { id: '52012c42-5df8-4cb3-a72f-538c20ce382a' },
    data: {
      name: 'Rice',
      nameBn: 'চাল',
      slug: 'cooking-rice',
      displayOrder: 1,
      status: 'ACTIVE',
    },
  });
  console.log('Updated Subcategory:', subRice.name, subRice.nameBn, subRice.slug);

  const subPulses = await prisma.category.update({
    where: { id: '0e411582-f204-433b-acf7-dcf62d74955c' },
    data: {
      name: 'Pulses & Dal',
      nameBn: 'ডাল',
      slug: 'cooking-pulses',
      displayOrder: 2,
      status: 'ACTIVE',
    },
  });
  console.log('Updated Subcategory:', subPulses.name, subPulses.nameBn, subPulses.slug);

  const subOil = await prisma.category.update({
    where: { id: '1c3f5cfc-73f3-42f8-bfb3-58e186f97513' },
    data: {
      name: 'Cooking Oil',
      nameBn: 'ভোজ্যতেল',
      slug: 'cooking-oil',
      displayOrder: 3,
      status: 'ACTIVE',
    },
  });
  console.log('Updated Subcategory:', subOil.name, subOil.nameBn, subOil.slug);

  const subFlour = await prisma.category.update({
    where: { id: '389fc4e7-5c3f-4961-a90f-77da18c9330f' },
    data: {
      name: 'Flour & Semolina',
      nameBn: 'আটা, ময়দা ও সুজি',
      slug: 'cooking-flour-and-semolina',
      displayOrder: 4,
      status: 'ACTIVE',
    },
  });
  console.log('Updated Subcategory:', subFlour.name, subFlour.nameBn, subFlour.slug);

  console.log('--- Consolidation Complete Successfully ---');
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});


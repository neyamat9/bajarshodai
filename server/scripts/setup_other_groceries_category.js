const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

let url = process.env.DATABASE_URL.replace(/&channel_binding=[^&]*/, '').replace(/\?channel_binding=[^&]*&?/, '?');
const pool = new Pool({ connectionString: url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const GROCERY_PARENT_ID = 'f54d730c-5ae4-49a4-a587-f07bbc24aa17'; // grocery (মুদি বাজার)

async function main() {
  console.log('--- Setting up Other Groceries Category & Brands ---');

  // 1. Check or create "Other Groceries" (অন্যান্য সামগ্রী)
  let cat = await prisma.category.findFirst({
    where: {
      OR: [
        { slug: 'cooking-others' },
        { name: 'Other Groceries' },
        { nameBn: 'অন্যান্য সামগ্রী' },
      ],
      parentCategoryId: GROCERY_PARENT_ID,
    },
  });

  if (!cat) {
    cat = await prisma.category.create({
      data: {
        name: 'Other Groceries',
        nameBn: 'অন্যান্য সামগ্রী',
        slug: 'cooking-others',
        description: 'Other cooking essentials, staples, baking ingredients and miscellaneous grocery items.',
        descriptionBn: 'রান্নার অন্যান্য প্রয়োজনীয় সামগ্রী, বেকিং উপাদান ও বিবিধ মুদি পণ্য।',
        parentCategoryId: GROCERY_PARENT_ID,
        displayOrder: 9,
        status: 'ACTIVE',
        isHomepage: false,
      },
    });
    console.log('Created category:', cat);
  } else {
    console.log('Category already exists:', cat);
  }

  // 2. Check or create "Foster Clark's" brand
  let brand = await prisma.brand.findFirst({
    where: {
      OR: [
        { slug: 'foster-clarks' },
        { name: { equals: "Foster Clark's", mode: 'insensitive' } },
        { name: { equals: "Foster Clark", mode: 'insensitive' } },
      ],
    },
  });

  if (!brand) {
    brand = await prisma.brand.create({
      data: {
        name: "Foster Clark's",
        slug: 'foster-clarks',
        description: "Foster Clark's quality food products and baking ingredients.",
        status: 'ACTIVE',
      },
    });
    console.log('Created brand:', brand);
  } else {
    console.log('Brand already exists:', brand);
  }

  return { categoryId: cat.id, brandId: brand.id };
}

main()
  .then((res) => console.log('Setup finished successfully:', res))
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

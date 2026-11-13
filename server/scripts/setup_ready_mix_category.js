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

async function main() {
  const parentId = 'f54d730c-5ae4-49a4-a587-f07bbc24aa17';

  // Upsert Ready Mix category
  const readyMix = await prisma.category.upsert({
    where: { slug: 'cooking-ready-mix' },
    update: {
      name: 'Ready Mix',
      nameBn: 'রেডি মিক্স',
      parentCategoryId: parentId,
      displayOrder: 3,
      status: 'ACTIVE',
      description: 'Authentic cooking ready mixes, biryani, roast, halim, kebab, firni, falooda and seasonings',
      descriptionBn: 'সেরা ব্র্যান্ডের রেডি মিক্স বিরিয়ানি, রোস্ট, হালিম, কাবাব, ফিরনি, ফালুদা ও স্পেশাল মসলা মিক্স',
    },
    create: {
      name: 'Ready Mix',
      nameBn: 'রেডি মিক্স',
      slug: 'cooking-ready-mix',
      parentCategoryId: parentId,
      displayOrder: 3,
      status: 'ACTIVE',
      description: 'Authentic cooking ready mixes, biryani, roast, halim, kebab, firni, falooda and seasonings',
      descriptionBn: 'সেরা ব্র্যান্ডের রেডি মিক্স বিরিয়ানি, রোস্ট, হালিম, কাবাব, ফিরনি, ফালুদা ও স্পেশাল মসলা মিক্স',
    },
  });

  console.log(`✓ Ready Mix Category Ready: [${readyMix.id}] ${readyMix.name} (${readyMix.nameBn})`);

  // Update sibling categories display order
  await prisma.category.updateMany({ where: { slug: 'cooking-rice' }, data: { displayOrder: 1 } });
  await prisma.category.updateMany({ where: { slug: 'cooking-spices' }, data: { displayOrder: 2 } });
  await prisma.category.updateMany({ where: { slug: 'cooking-ready-mix' }, data: { displayOrder: 3 } });
  await prisma.category.updateMany({ where: { slug: 'cooking-pulses' }, data: { displayOrder: 4 } });
  await prisma.category.updateMany({ where: { slug: 'cooking-salt-and-sugar' }, data: { displayOrder: 5 } });
  await prisma.category.updateMany({ where: { slug: 'cooking-oil' }, data: { displayOrder: 6 } });
  await prisma.category.updateMany({ where: { slug: 'cooking-flour-and-semolina' }, data: { displayOrder: 7 } });

  const children = await prisma.category.findMany({
    where: { parentCategoryId: parentId },
    orderBy: { displayOrder: 'asc' },
  });

  console.log('\nGrocery Child Categories in Order:');
  children.forEach(c => console.log(` ${c.displayOrder}. ${c.name} (${c.nameBn}) -> slug: "${c.slug}" [${c.id}]`));
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});


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
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: 'Biryani', mode: 'insensitive' } },
        { name: { contains: 'Firni', mode: 'insensitive' } },
        { name: { contains: 'Haleem', mode: 'insensitive' } },
        { name: { contains: 'Chotpoti', mode: 'insensitive' } },
        { name: { contains: 'Masala', mode: 'insensitive' } },
        { name: { contains: 'Roast', mode: 'insensitive' } },
        { name: { contains: 'Tehari', mode: 'insensitive' } },
        { name: { contains: 'Falooda', mode: 'insensitive' } },
        { name: { contains: 'Kabab', mode: 'insensitive' } },
        { name: { contains: 'Khichuri', mode: 'insensitive' } },
        { name: { contains: 'Shan', mode: 'insensitive' } },
      ],
    },
    select: { id: true, name: true, nameBn: true, productCode: true, categoryId: true },
  });

  console.log(`Matching products in DB: ${products.length}`);
  for (const p of products) {
    console.log(`- [${p.productCode}] ${p.name} | ${p.nameBn}`);
  }
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});


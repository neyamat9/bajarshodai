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
  const units = await prisma.unit.findMany();
  console.log('Units:', units.map(u => ({ id: u.id, name: u.name, nameBn: u.nameBn, code: u.code })));
  const brands = await prisma.brand.findMany({ select: { id: true, name: true, slug: true } });
  console.log('Total Brands:', brands.length);
  const foster = brands.filter(b => b.name.toLowerCase().includes('foster') || b.slug.includes('foster'));
  console.log('Foster brands:', foster);
  
  // Also check existing product codes to make sure our new product codes are unique and consistent
  const lastProducts = await prisma.product.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, nameBn: true, productCode: true, slug: true }
  });
  console.log('Recent products:', lastProducts);
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});

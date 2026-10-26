require('dotenv/config');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
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

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parsePrice(raw) {
  if (!raw) return 0;
  const cleaned = raw.replace(/,/g, '');
  const m = cleaned.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!m) return 0;
  return parseFloat(m[1]);
}

const OTC_KEYWORDS = [
  'paracetamol', 'caffeine', 'cetirizine', 'loratadine', 'omeprazole', 'esomeprazole',
  'pantoprazole', 'famotidine', 'ranitidine', 'calcium', 'vitamin c', 'vitamin d',
  'multivitamin', 'multimineral', 'zinc', 'folic acid', 'iron', 'oral rehydration',
  'antacid', 'chlorpheniramine', 'fexofenadine', 'phenylephrine', 'dextromethorphan',
  'guaifenesin', 'povidone iodine', 'chlorhexidine', 'diclofenac', 'ibuprofen'
];

function isOtc(generic) {
  if (!generic) return false;
  const g = generic.toLowerCase();
  return OTC_KEYWORDS.some(k => g.includes(k));
}

async function main() {
  console.log('Connecting to database and verifying categories & units...');
  const medicineCat = await prisma.category.findFirst({
    where: { slug: 'medicine' },
  });

  if (!medicineCat) {
    console.error('Medicine category not found!');
    process.exit(1);
  }

  let unit = await prisma.unit.findFirst({
    where: { code: 'strip' }
  });
  if (!unit) {
    unit = await prisma.unit.findFirst({
      where: { code: 'piece' }
    }) || await prisma.unit.findFirst();
  }

  console.log('Cleaning up any incomplete products in medicine category...');
  const orphaned = await prisma.product.deleteMany({
    where: {
      categoryId: medicineCat.id,
      medicineMeta: null,
    },
  });
  if (orphaned.count > 0) {
    console.log(`Cleaned up ${orphaned.count} incomplete products.`);
  }

  const rawJsonPath = path.resolve(__dirname, '../../medicine_dataset.json');
  console.log('Reading dataset from:', rawJsonPath);
  const rawData = JSON.parse(fs.readFileSync(rawJsonPath, 'utf8'));
  const keys = Object.keys(rawData);
  console.log(`Loaded ${keys.length} raw medicine records.`);

  const existingProducts = await prisma.product.findMany({
    select: { id: true, name: true, slug: true, productCode: true },
  });
  const existingSlugs = new Set(existingProducts.map(p => p.slug));
  const existingNames = new Set(existingProducts.map(p => p.name));
  const existingCodes = new Set(existingProducts.map(p => p.productCode).filter(Boolean));
  console.log(`Found ${existingProducts.length} existing products in DB.`);

  // Prepare batch items
  const productsToCreate = [];
  const metasToCreate = [];

  for (let i = 0; i < keys.length; i++) {
    const item = rawData[keys[i]];
    const brandName = (item.Name || '').trim();
    if (!brandName) continue;

    const strength = (item.MG || '').trim();
    const dosageForm = (item.Type || 'Tablet').trim();
    const genericName = (item['Generic Name'] || 'Pharmaceutical Active Ingredient').trim();
    const manufacturer = (item['Company Name'] || 'Bangladesh Pharmaceuticals').trim();
    const medexUrl = item.Link || null;
    const medexIdMatch = medexUrl?.match(/\/brands\/(\d+)\//);
    const medexId = medexIdMatch ? parseInt(medexIdMatch[1], 10) : null;

    // Unique display name
    let displayName = [brandName, strength, dosageForm].filter(Boolean).join(' ');
    if (existingNames.has(displayName)) {
      displayName = `${displayName} (${manufacturer})`;
    }
    if (existingNames.has(displayName)) {
      displayName = `${displayName} #${medexId || i}`;
    }
    existingNames.add(displayName);

    // Unique slug
    let baseSlug = slugify(displayName);
    if (!baseSlug) baseSlug = `medicine-${i}`;
    let uniqueSlug = baseSlug;
    if (existingSlugs.has(uniqueSlug)) {
      uniqueSlug = `${baseSlug}-${medexId || i}`;
    }
    if (existingSlugs.has(uniqueSlug)) {
      uniqueSlug = `${baseSlug}-${i}-${Math.floor(Math.random() * 1000)}`;
    }
    existingSlugs.add(uniqueSlug);

    // Unique productCode
    let code = medexId ? `MED-${medexId}` : `MED-${i}`;
    if (existingCodes.has(code)) {
      code = `${code}-${i}`;
    }
    existingCodes.add(code);

    const price = parsePrice(item.Price);
    const isTabletOrCap = /tablet|capsule|pill/i.test(dosageForm);
    const isRawUnitPrice = (item.Price || '').toLowerCase().includes('unit price');

    let mrpUnit = price > 0 ? price : 10;
    let mrpStrip = null;
    let sellingPrice = mrpUnit;
    let packSize = `1 ${dosageForm}`;

    if (isTabletOrCap) {
      if (isRawUnitPrice || price <= 15) {
        mrpStrip = Math.round(mrpUnit * 10 * 100) / 100;
        sellingPrice = mrpStrip;
        packSize = `1 Strip (10 ${dosageForm}s)`;
      } else {
        mrpStrip = price;
        sellingPrice = price;
        packSize = `1 Strip (10 ${dosageForm}s)`;
      }
    } else {
      sellingPrice = mrpUnit;
      packSize = `1 ${dosageForm}`;
    }

    const buyingPrice = Math.round(sellingPrice * 0.88 * 100) / 100;
    const medicineType = isOtc(genericName) ? 'OTC' : 'PRESCRIPTION';
    const genericSlug = slugify(genericName) || 'generic-active';
    const productId = crypto.randomUUID();

    productsToCreate.push({
      id: productId,
      name: displayName,
      slug: uniqueSlug,
      productCode: code,
      description: `${displayName} (${genericName}). Manufactured by ${manufacturer}. Official Bangladesh pharmaceutical catalog entry with factual MedEx verification.`,
      shortDescription: `${dosageForm} • ${strength || 'Standard'} • ${manufacturer}`,
      categoryId: medicineCat.id,
      unitId: unit?.id || null,
      brandName: manufacturer,
      categoryName: 'Medicine',
      packSize,
      sellingPrice,
      regularPrice: sellingPrice,
      buyingPrice,
      stock: 100,
      trackStock: true,
      status: 'ACTIVE',
      isFeatured: i < 20, // Feature first 20 medicines
      isNew: false,
    });

    metasToCreate.push({
      id: crypto.randomUUID(),
      productId,
      genericName,
      genericSlug,
      dosageForm,
      strength: strength || 'Standard',
      manufacturer,
      type: medicineType,
      medexUrl,
      medexId,
      mrpUnit: mrpUnit ? String(mrpUnit) : null,
      mrpStrip: mrpStrip ? String(mrpStrip) : null,
      mrpBox: null,
      packSizeInfo: packSize,
      syncStatus: 'SYNCED',
      lastSyncedAt: new Date(),
    });
  }

  console.log(`Prepared ${productsToCreate.length} products to insert.`);

  // Insert in chunks of 500
  const CHUNK_SIZE = 500;
  let inserted = 0;

  for (let c = 0; c < productsToCreate.length; c += CHUNK_SIZE) {
    const prodChunk = productsToCreate.slice(c, c + CHUNK_SIZE);
    const metaChunk = metasToCreate.slice(c, c + CHUNK_SIZE);

    await prisma.product.createMany({
      data: prodChunk,
      skipDuplicates: true,
    });

    await prisma.medicineMeta.createMany({
      data: metaChunk,
      skipDuplicates: true,
    });

    inserted += prodChunk.length;
    process.stdout.write(`\rProgress: ${inserted} / ${productsToCreate.length} inserted...`);
  }

  console.log('\n\nBulk import complete!');
  const finalCount = await prisma.medicineMeta.count();
  console.log(`Verified total medicines in database now: ${finalCount}`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

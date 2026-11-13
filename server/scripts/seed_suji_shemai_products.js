const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const fs = require('fs');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

let url = process.env.DATABASE_URL.replace(/&channel_binding=[^&]*/, '').replace(/\?channel_binding=[^&]*&?/, '?');
const pool = new Pool({ connectionString: url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const uploadedImgs = JSON.parse(fs.readFileSync(path.join(__dirname, 'suji_shemai_uploaded_images.json'), 'utf8'));

const FLOUR_CATEGORY_ID = '389fc4e7-5c3f-4961-a90f-77da18c9330f'; // Flour & Semolina (আটা, ময়দা ও সুজি)
const SHEMAI_CATEGORY_ID = '045904be-0f18-41d5-8ff1-999bdd268227'; // Shemai (সেমাই)
const UNIT_PACKET_ID = '77eb802d-9a7f-4bde-b0ca-d48056787943'; // packet

const PRODUCTS = [
  // --- Flour & Semolina Category: Suji Products ---
  {
    serial: 1,
    code: 'SUJI-01',
    imgKey: 'SS-01',
    categoryId: FLOUR_CATEGORY_ID,
    categoryName: 'Flour & Semolina',
    name: 'Fresh Suji 500g',
    nameBn: 'ফ্রেশ সুজি ৫০০ গ্রাম',
    slug: 'fresh-suji-500g',
    brandName: 'Fresh',
    packSize: '500 g',
    regularPrice: 48,
    sellingPrice: 48,
    discountPrice: null,
    shortDescriptionBn: 'সেরা মানের বাছাইকৃত গমের দানাদার পুষ্টিকর ফ্রেশ সুজি ৫০০ গ্রাম।',
    shortDescription: 'Premium granulated wholesome wheat semolina Fresh Suji 500g.',
    overview: 'Fresh Suji 500g (ফ্রেশ সুজি ৫০০ গ্রাম) by Fresh.',
    overviewBn: 'ফ্রেশ সুজি ৫০০ গ্রাম (Fresh)। পরিবারের মিষ্টিমুখ ও উৎসবের আয়োজনে ঝটপট তৈরি করুন সুস্বাদু ডেজার্ট।',
  },
  {
    serial: 2,
    code: 'SUJI-02',
    imgKey: 'SS-04',
    categoryId: FLOUR_CATEGORY_ID,
    categoryName: 'Flour & Semolina',
    name: 'ACI Pure Suji 500g',
    nameBn: 'এ সি আই পিওর সুজি ৫০০ গ্রাম',
    slug: 'aci-pure-suji-500g',
    brandName: 'ACI Pure',
    packSize: '500 g',
    regularPrice: 48,
    sellingPrice: 48,
    discountPrice: null,
    shortDescriptionBn: 'আধুনিক প্রযুক্তিতে পরিশোধিত ১০০% খাঁটি এসিআই পিওর সুজি ৫০০ গ্রাম।',
    shortDescription: 'Hygienically processed 100% authentic ACI Pure Suji 500g.',
    overview: 'ACI Pure Suji 500g (এ সি আই পিওর সুজি ৫০০ গ্রাম) by ACI Pure.',
    overviewBn: 'এ সি আই পিওর সুজি ৫০০ গ্রাম (ACI Pure)। পুষ্টিকর উপাদান ও স্বাস্থ্যসম্মত খাবার তৈরিতে সেরা।',
  },

  // --- Shemai Category: Shemai & Vermicelli Products ---
  {
    serial: 3,
    code: 'SHEMAI-01',
    imgKey: 'SS-02',
    categoryId: SHEMAI_CATEGORY_ID,
    categoryName: 'Shemai',
    name: 'Banoful Lachha Shemai 200g',
    nameBn: 'বনফুল লাচ্ছা সেমাই ২০০ গ্রাম',
    slug: 'banoful-lachha-shemai-200g',
    brandName: 'Banoful',
    packSize: '200 g',
    regularPrice: 50,
    sellingPrice: 50,
    discountPrice: null,
    shortDescriptionBn: 'ঘিয়ে ভাজা তুলতুলে নরম ও সুস্বাদু ঐতিহ্যবাহী বনফুল লাচ্ছা সেমাই ২০০ গ্রাম।',
    shortDescription: 'Traditional crispy and delicate Banoful Lachha Shemai 200g.',
    overview: 'Banoful Lachha Shemai 200g (বনফুল লাচ্ছা সেমাই ২০০ গ্রাম) by Banoful.',
    overviewBn: 'বনফুল লাচ্ছা সেমাই ২০০ গ্রাম (Banoful)। ঘিয়ে ভাজা সুবাসিত তুলতুলে নরম লাচ্ছা সেমাই।',
  },
  {
    serial: 4,
    code: 'SHEMAI-02',
    imgKey: 'SS-03',
    categoryId: SHEMAI_CATEGORY_ID,
    categoryName: 'Shemai',
    name: 'Radhuni Shemai 200g',
    nameBn: 'রাঁধুনী সেমাই ২০০ গ্রাম',
    slug: 'radhuni-shemai-200g',
    brandName: 'Radhuni',
    packSize: '200 g',
    regularPrice: 45,
    sellingPrice: 45,
    discountPrice: null,
    shortDescriptionBn: 'সোনালী রোস্টেড চিকন রাঁধুনী ভারমিচিলি সেমাই ২০০ গ্রাম।',
    shortDescription: 'Golden roasted fine vermicelli Radhuni Shemai 200g.',
    overview: 'Radhuni Shemai 200g (রাঁধুনী সেমাই ২০০ গ্রাম) by Radhuni.',
    overviewBn: 'রাঁধুনী সেমাই ২০০ গ্রাম (Radhuni)। সোনালী রোস্টেড চিকন সুস্বাদু ভারমিচিলি সেমাই।',
  },
  {
    serial: 5,
    code: 'SHEMAI-03',
    imgKey: 'SS-05',
    categoryId: SHEMAI_CATEGORY_ID,
    categoryName: 'Shemai',
    name: 'Kolson Special Lachha Shemai 180g',
    nameBn: 'কুলসন স্পেশাল লাচ্ছা সেমাই ১৮০ গ্রাম',
    slug: 'kolson-special-lachha-shemai-180g',
    brandName: 'Kolson',
    packSize: '180 g',
    regularPrice: 50,
    sellingPrice: 50,
    discountPrice: null,
    shortDescriptionBn: 'স্পেশাল প্রক্রিয়াজাত মুচমুচে ও সুস্বাদু কুলসন লাচ্ছা সেমাই ১৮০ গ্রাম।',
    shortDescription: 'Crispy and delectable dessert Kolson Special Lachha Shemai 180g.',
    overview: 'Kolson Special Lachha Shemai 180g (কুলসন স্পেশাল লাচ্ছা সেমাই ১৮০ গ্রাম) by Kolson.',
    overviewBn: 'কুলসন স্পেশাল লাচ্ছা সেমাই ১৮০ গ্রাম (Kolson)। মুচমুচে ও সুস্বাদু ঐতিহ্যবাহী লাচ্ছা।',
  },
  {
    serial: 6,
    code: 'SHEMAI-04',
    imgKey: 'SS-06',
    categoryId: SHEMAI_CATEGORY_ID,
    categoryName: 'Shemai',
    name: 'Pran Chikon Shemai 200g',
    nameBn: 'প্রাণ চিকন সেমাই ২০০ গ্রাম',
    slug: 'pran-chikon-shemai-200g',
    brandName: 'Pran',
    packSize: '200 g',
    regularPrice: 45,
    sellingPrice: 45,
    discountPrice: null,
    shortDescriptionBn: 'প্রাণ প্রিমিয়াম লম্বা চিকন ভারমিচিলি সেমাই ২০০ গ্রাম।',
    shortDescription: 'Pran high quality traditional fine Vermicelli Shemai 200g.',
    overview: 'Pran Chikon Shemai 200g (প্রাণ চিকন সেমাই ২০০ গ্রাম) by Pran.',
    overviewBn: 'প্রাণ চিকন সেমাই ২০০ গ্রাম (Pran)। দুধ সেমাই ও জর্দা সেমাই তৈরিতে অসাধারণ।',
  },
  {
    serial: 7,
    code: 'SHEMAI-05',
    imgKey: 'SS-07',
    categoryId: SHEMAI_CATEGORY_ID,
    categoryName: 'Shemai',
    name: 'Olympic Lachha Shemai 200g',
    nameBn: 'অলিম্পিক লাচ্ছা সেমাই ২০০ গ্রাম',
    slug: 'olympic-lachha-shemai-200g',
    brandName: 'Olympic',
    packSize: '200 g',
    regularPrice: 50,
    sellingPrice: 50,
    discountPrice: null,
    shortDescriptionBn: 'অলিম্পিক ব্র্যান্ডের রাজকীয় স্বাদের নরম ও মুচমুচে লাচ্ছা সেমাই ২০০ গ্রাম।',
    shortDescription: 'Olympic rich and delicious traditional Lachha Shemai 200g.',
    overview: 'Olympic Lachha Shemai 200g (অলিম্পিক লাচ্ছা সেমাই ২০০ গ্রাম) by Olympic.',
    overviewBn: 'অলিম্পিক লাচ্ছা সেমাই ২০০ গ্রাম (Olympic)। খাঁটি ঘিয়ে ভাজা শাহী স্বাদের লাচ্ছা।',
  },
  {
    serial: 8,
    code: 'SHEMAI-06',
    imgKey: 'SS-08',
    categoryId: SHEMAI_CATEGORY_ID,
    categoryName: 'Shemai',
    name: 'Banoful Vermicelli Shemai 200g',
    nameBn: 'বনফুল ভারমিচিলি সেমাই ২০০ গ্রাম',
    slug: 'banoful-vermicelli-shemai-200g',
    brandName: 'Banoful',
    packSize: '200 g',
    regularPrice: 45,
    sellingPrice: 45,
    discountPrice: null,
    shortDescriptionBn: 'বনফুল খাঁটি ভারমিচিলি চিকন সেমাই ২০০ গ্রাম।',
    shortDescription: 'Banoful fine vermicelli shemai for sweet milk desserts 200g.',
    overview: 'Banoful Vermicelli Shemai 200g (বনফুল ভারমিচিলি সেমাই ২০০ গ্রাম) by Banoful.',
    overviewBn: 'বনফুল ভারমিচিলি সেমাই ২০০ গ্রাম (Banoful)। ঘরোয়া মিষ্টিমুখের জনপ্রিয় পছন্দ।',
  },
  {
    serial: 9,
    code: 'SHEMAI-07',
    imgKey: 'SS-09',
    categoryId: SHEMAI_CATEGORY_ID,
    categoryName: 'Shemai',
    name: 'Kolson Cock Vermicelli Red Shemai 200g',
    nameBn: 'কুলসন কক ভারমিসেলি লাল সেমাই ২০০ গ্রাম',
    slug: 'kolson-cock-vermicelli-red-shemai-200g',
    brandName: 'Kolson',
    packSize: '200 g',
    regularPrice: 45,
    sellingPrice: 45,
    discountPrice: null,
    shortDescriptionBn: 'বিখ্যাত রোস্টেড লাল সেমাই কুলসন কক ভারমিসেলি ২০০ গ্রাম।',
    shortDescription: 'Famous golden roasted red Kolson Cock Vermicelli Shemai 200g.',
    overview: 'Kolson Cock Vermicelli Red Shemai 200g (কুলসন কক ভারমিসেলি লাল সেমাই ২০০ গ্রাম) by Kolson.',
    overviewBn: 'কুলসন কক ভারমিসেলি লাল সেমাই ২০০ গ্রাম (Kolson)। সুস্বাদু রোস্টেড লাল সেমাই।',
  },
];

async function main() {
  console.log(`Starting seeding of ${PRODUCTS.length} products (2 Suji in Flour, 7 Shemai in Shemai)...`);

  for (const item of PRODUCTS) {
    const buyingPrice = Number((item.sellingPrice * 0.82).toFixed(2));
    const profitMargin = Number(((item.sellingPrice - buyingPrice) / item.sellingPrice * 100).toFixed(2));
    const isDiscounted = item.discountPrice !== null && item.discountPrice < item.regularPrice;
    const imgUrl = uploadedImgs[item.imgKey];

    console.log(`[${item.serial}/${PRODUCTS.length}] Upserting ${item.code}: ${item.name} into ${item.categoryName}...`);

    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        productCode: item.code,
        name: item.name,
        nameBn: item.nameBn,
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        unitId: UNIT_PACKET_ID,
        packSize: item.packSize,
        regularPrice: item.regularPrice,
        sellingPrice: item.sellingPrice,
        discountPrice: item.discountPrice,
        priceBeforeDiscount: isDiscounted ? item.regularPrice : null,
        buyingPrice: buyingPrice,
        profitMargin: profitMargin,
        trackStock: false,
        stock: 0,
        lowStockThreshold: 5,
        status: 'ACTIVE',
        brandName: item.brandName,
        shortDescription: item.shortDescription,
        shortDescriptionBn: item.shortDescriptionBn,
        description: `### Product Overview\n${item.overview}\n\n### Highlights\n- High quality ingredients\n- Ideal for Bengali sweets, halwa, and family desserts\n- Net Weight: ${item.packSize}`,
        descriptionBn: `### পণ্য পরিচিতি\n${item.overviewBn}\n\n### বৈশিষ্ট্য\n- সেরা উপাদান ও উন্নত প্রক্রিয়াজাতকরণ\n- পুষ্টিকর ও চমৎকার স্বাদ\n- নেট ওজন: ${item.packSize}`,
        isFeatured: item.serial <= 4,
        isNew: true,
        isHot: item.serial === 1 || item.serial === 3,
      },
      create: {
        productCode: item.code,
        name: item.name,
        nameBn: item.nameBn,
        slug: item.slug,
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        unitId: UNIT_PACKET_ID,
        packSize: item.packSize,
        regularPrice: item.regularPrice,
        sellingPrice: item.sellingPrice,
        discountPrice: item.discountPrice,
        priceBeforeDiscount: isDiscounted ? item.regularPrice : null,
        buyingPrice: buyingPrice,
        profitMargin: profitMargin,
        trackStock: false,
        stock: 0,
        lowStockThreshold: 5,
        status: 'ACTIVE',
        brandName: item.brandName,
        shortDescription: item.shortDescription,
        shortDescriptionBn: item.shortDescriptionBn,
        description: `### Product Overview\n${item.overview}\n\n### Highlights\n- High quality ingredients\n- Ideal for Bengali sweets, halwa, and family desserts\n- Net Weight: ${item.packSize}`,
        descriptionBn: `### পণ্য পরিচিতি\n${item.overviewBn}\n\n### বৈশিষ্ট্য\n- সেরা উপাদান ও উন্নত প্রক্রিয়াজাতকরণ\n- পুষ্টিকর ও চমৎকার স্বাদ\n- নেট ওজন: ${item.packSize}`,
        isFeatured: item.serial <= 4,
        isNew: true,
        isHot: item.serial === 1 || item.serial === 3,
      },
    });

    if (imgUrl) {
      await prisma.productImage.deleteMany({
        where: { productId: product.id },
      });

      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: imgUrl,
          alt: `${item.nameBn} - ${item.name}`,
          isMain: true,
          order: 0,
        },
      });
    }

    console.log(`   ✓ [${item.code}] Done: ID ${product.id}`);
  }

  console.log(`\nAll ${PRODUCTS.length} products successfully seeded!`);
}

main()
  .catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

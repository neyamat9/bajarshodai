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

const uploadedImgs = JSON.parse(fs.readFileSync(path.join(__dirname, 'salt_sugar_uploaded_images.json'), 'utf8'));

const CATEGORY_ID = '8e97b5a6-c456-481e-82d8-6c45f31d96cb'; // Salt & Sugar under Cooking
const CATEGORY_NAME = 'Salt & Sugar';
const UNIT_PACKET_ID = '77eb802d-9a7f-4bde-b0ca-d48056787943'; // packet

const PRODUCTS = [
  {
    serial: 1,
    name: 'ACI Pure Salt 1kg',
    nameBn: 'এ সি আই পিওর লবণ ১ কেজি',
    slug: 'aci-pure-salt-1kg',
    packSize: '1 kg',
    unitId: UNIT_PACKET_ID,
    regularPrice: 42,
    sellingPrice: 42,
    discountPrice: null,
    brandName: 'ACI Pure',
    imgUrl: uploadedImgs.aci_pure_salt_1kg,
    shortDescriptionBn: '১০০% ভ্যাকুয়াম ইভাপোরেটেড আয়োডিনযুক্ত এসিআই পিওর লবণ ১ কেজি প্যাকেট।',
    shortDescription: '100% vacuum evaporated iodized ACI Pure Salt 1kg pack.',
    descriptionBn: `### পণ্য পরিচিতি
এসিআই পিওর লবণ বাংলাদেশের মানুষের সবচেয়ে বিশ্বস্ত আয়োডিনযুক্ত লবণ। সর্বাধুনিক সুইস ভ্যাকুয়াম বাষ্পীভবন প্রযুক্তিতে প্রস্তুত, যা নিশ্চিত করে ৯৯.৫% সোডিয়াম ক্লোরাইডের খাঁটি বিশুদ্ধতা ও সঠিক মাত্রার পটাশিয়াম আয়োডেট।

### বৈশিষ্ট্য ও পুষ্টি তথ্য
- **বিশুদ্ধতা:** ৯৯.৫% বিশুদ্ধ ও ধবধবে সাদা মুক্তার মতো ঝরঝরে দানা।
- **আয়োডিন:** শিশুদের শারীরিক ও মানসিক বিকাশ এবং গলগণ্ড প্রতিরোধে সহায়ক সঠিক মাত্রার আয়োডিন।
- **প্রযুক্তি:** সুইস ভ্যাকুয়াম ইভাপোরেশন প্রযুক্তিতে সম্পূর্ণ মানবস্পর্শহীনভাবে প্যাকেটজাত।
- **সংরক্ষণ:** শুষ্ক পাত্রে বায়ুরোধী অবস্থায় রাখুন।`,
    description: `### Product Overview
ACI Pure Salt is Bangladesh's leading iodized vacuum-evaporated table salt. Refined using advanced Swiss technology to ensure 99.5% chemical purity and the optimal standard of potassium iodate.

### Key Highlights & Nutritional Profile
- **Purity:** 99.5% pure sodium chloride with pristine, free-flowing crystal grains.
- **Enrichment:** Appropriately fortified with iodine to prevent goiter and support brain development.
- **Processing:** Hygienically processed and packed without human hand touch.
- **Storage:** Keep sealed in an airtight dry container.`,
  },
  {
    serial: 2,
    name: 'ACI Pure Salt 500g',
    nameBn: 'এ সি আই পিওর লবণ ৫০০ গ্রাম',
    slug: 'aci-pure-salt-500g',
    packSize: '500 g',
    unitId: UNIT_PACKET_ID,
    regularPrice: 22,
    sellingPrice: 22,
    discountPrice: null,
    brandName: 'ACI Pure',
    imgUrl: uploadedImgs.aci_pure_salt_500g,
    shortDescriptionBn: 'ছোট পরিবারের জন্য সাশ্রয়ী এসিআই পিওর আয়োডিনযুক্ত লবণ ৫০০ গ্রাম প্যাকেট।',
    shortDescription: 'ACI Pure Iodized Vacuum Salt 500g convenient pack.',
    descriptionBn: `### পণ্য পরিচিতি
ছোট পরিবার ও নিয়মিত রান্নায় ব্যবহারের জন্য এসিআই পিওর লবণের সাশ্রয়ী ৫০০ গ্রাম প্যাকেট।`,
    description: `### Product Overview
Convenient 500g pack of ACI Pure Iodized Vacuum Table Salt.`,
  },
  {
    serial: 3,
    name: 'Fresh Super Premium (Vacuum) Salt 1kg',
    nameBn: 'ফ্রেশ সুপার প্রিমিয়াম (ভ্যাকুয়াম) লবণ ১ কেজি',
    slug: 'fresh-super-premium-vacuum-salt-1kg',
    packSize: '1 kg',
    unitId: UNIT_PACKET_ID,
    regularPrice: 42,
    sellingPrice: 42,
    discountPrice: null,
    brandName: 'Fresh',
    imgUrl: uploadedImgs.fresh_super_premium_salt_1kg,
    shortDescriptionBn: 'মেঘনা গ্রুপের ভ্যাকুয়াম রিফাইন্ড সুপার প্রিমিয়াম ফ্রেশ লবণ ১ কেজি।',
    shortDescription: 'Fresh Super Premium Vacuum Evaporated Iodized Salt 1kg by Meghna Group.',
    descriptionBn: `### পণ্য পরিচিতি
মেঘনা গ্রুপ অব ইন্ডাস্ট্রিজের সর্বাধুনিক ভ্যাকুয়াম ইভাপোরেটেড পদ্ধতিতে প্রস্তুত ফ্রেশ সুপার প্রিমিয়াম লবণ। প্রতিটি দানাই সুষম, ঝরঝরে ও প্রয়োজনীয় আয়োডিন সমৃদ্ধ।

### বৈশিষ্ট্য ও উপকারিতা
- **গুণমান:** অত্যন্ত ঝরঝরে ফ্রি-ফ্লোয়িং টেবিল সল্ট, যা রান্নায় সহজে ও সুষমভাবে মিশে যায়।
- **স্বাস্থ্যগুণ:** দৈনন্দিন আয়োডিনের চাহিদা পূরণ করে এবং পরিবারের থাইরয়েড স্বাস্থ্য বজায় রাখে।
- **প্যাকিং:** আধুনিক ত্রি-স্তরীয় পলিব্যাগে সুরক্ষিত, যা স্যাঁতসেঁতে হওয়া রোধ করে।`,
    description: `### Product Overview
Fresh Super Premium Salt from Meghna Group of Industries is produced using advanced vacuum evaporation technology for uniform, free-flowing crystal grain perfection.

### Features & Health Benefits
- **Free-Flowing:** Disperses instantly and evenly across cooked meals, salads, and curries.
- **Fortified:** Delivers daily dietary iodine to maintain thyroid balance and cognitive well-being.
- **Airtight Packaging:** Tri-layer moisture-resistant packaging preserving crystal crispness.`,
  },
  {
    serial: 4,
    name: 'Fresh Refined Sugar 1kg',
    nameBn: 'ফ্রেশ রিফাইন্ড চিনি ১ কেজি',
    slug: 'fresh-refined-sugar-1kg',
    packSize: '1 kg',
    unitId: UNIT_PACKET_ID,
    regularPrice: 110,
    sellingPrice: 110,
    discountPrice: null,
    brandName: 'Fresh',
    imgUrl: uploadedImgs.fresh_refined_sugar_1kg,
    shortDescriptionBn: '১০০% খাঁটি ও চকচকে দানাদার ফ্রেশ রিফাইন্ড চিনি ১ কেজি প্যাকেট।',
    shortDescription: 'Fresh 100% Pure Crystal Refined White Cane Sugar 1kg pack.',
    descriptionBn: `### পণ্য পরিচিতি
মেঘনা গ্রুপের নিজস্ব চিনিকলে পরিশোধিত ফ্রেশ রিফাইন্ড চিনি। উৎকৃষ্ট আখের রস থেকে কোনো ক্ষতিকর ব্লিচিং বা রাসায়নিক উপাদান ছাড়া প্রাকৃতিক পদ্ধতিতে প্রক্রিয়াজাত।

### বৈশিষ্ট্য ও ব্যবহার
- **দানার গুণমান:** চকচকে, ধবধবে সাদা ও সমান দানাদার ক্রিস্টাল সুগার।
- **ব্যবহার:** প্রতিদিনের চা, কফি, মিষ্টি, পায়েস, ক্ষীর, হালুয়া, শরবত ও বেকিংয়ের জন্য নিখুঁত মিষ্টি স্বাদ।
- **বিশুদ্ধতা:** কোনো সালফার বা ক্ষতিকর ভেজালমুক্ত শতভাগ বিশুদ্ধ চিনি।`,
    description: `### Product Overview
Fresh Refined Sugar from Meghna Sugar Refineries is processed from pure sugarcane using modern state-of-the-art refining with zero harmful bleaching agents.

### Culinary Highlights
- **Grist Quality:** Uniform, sparkling translucent crystal grains that dissolve cleanly without residue.
- **Applications:** Ideal for morning teas, coffee, festive desserts, halwa, kheer, and confectionery baking.
- **Purity:** 100% pure food-grade white sugar free from artificial preservatives.`,
  },
  {
    serial: 5,
    name: 'Teer Refined Sugar 1kg',
    nameBn: 'তীর চিনি ১ কেজি',
    slug: 'teer-refined-sugar-1kg',
    packSize: '1 kg',
    unitId: UNIT_PACKET_ID,
    regularPrice: 110,
    sellingPrice: 110,
    discountPrice: null,
    brandName: 'Teer',
    imgUrl: uploadedImgs.teer_refined_sugar_1kg,
    shortDescriptionBn: 'সিটি গ্রুপের প্রিমিয়াম রিফাইন্ড আখের চিনি ১ কেজি প্যাকেট।',
    shortDescription: 'Teer Pure Refined Cane Sugar 1kg pack by City Group.',
    descriptionBn: `### পণ্য পরিচিতি
সিটি গ্রুপের বিশ্বস্ত তীর রিফাইন্ড চিনি। দেশের সবচেয়ে আধুনিক চিনিকলে প্রাকৃতিক আখের নির্যাস থেকে তৈরি, যা মিষ্টান্ন ও প্রতিদিনের পানীয়তে এনে দেয় আসল মিষ্টতা।

### বৈশিষ্ট্য ও ব্যবহার
- **মিষ্টি স্বাদ:** প্রাকৃতিক আখের খাঁটি মিষ্টতা, যা অল্প ব্যবহারেই চমৎকার মিষ্টি স্বাদ দেয়।
- **স্বচ্ছতা:** পানীয়তে মিশালে পানি স্বচ্ছ থাকে এবং কোনো প্রকার তলানি জমে না।
- **প্যাকিং:** আন্তর্জাতিক মানসম্মত ভার্জিন পলিব্যাগে প্যাকেটজাত।`,
    description: `### Product Overview
Teer Refined Sugar by City Group is refined using world-class European processing technology, delivering natural cane sweetness with unmatched clarity.

### Culinary Profile
- **Natural Sweetness:** Superior sweetness quotient providing rich taste with optimum quantity.
- **Clean Dissolution:** Dissolves clear in tea, iced beverages, syrups, and traditional desserts.
- **Packaging:** Sealed in food-grade protective pouch ensuring moisture defense.`,
  },
  {
    serial: 6,
    name: 'Loose Refined White Sugar (Open Plastic Bosta Display) 1kg',
    nameBn: 'খোলা সাদা চিনি (প্লাস্টিকের বস্তা) ১ কেজি',
    slug: 'loose-white-sugar-open-plastic-bosta-1kg',
    packSize: '1 kg',
    unitId: UNIT_PACKET_ID,
    regularPrice: 110,
    sellingPrice: 105,
    discountPrice: 105,
    brandName: 'Bazar Shodai Select',
    imgUrl: uploadedImgs.sugar_plastic_bosta_open,
    shortDescriptionBn: 'খোলা সাদা প্লাস্টিকের বস্তার চকচকে পরিষ্কার সাদা দানাদার চিনি ১ কেজি।',
    shortDescription: 'Pure sparkling white crystal sugar from traditional open woven plastic sack display 1kg pack.',
    descriptionBn: `### পণ্য পরিচিতি
আমাদের বাজারের খোলা সাদা প্লাস্টিকের বস্তার (Woven Polypropylene Sack) তাজা, ধবধবে সাদা ও চকচকে ক্রিস্টাল চিনি। পাইকারি সরাসরি মিল থেকে আনানো পরিষ্কার দানাদার চিনি, যা প্রতিদিনের ঘরোয়া চা, শরবত ও রান্নায় সাশ্রয়ী ও সুস্বাদু।

### বৈশিষ্ট্য ও রান্নার তথ্য
- **ডিসপ্লে ধরণ:** প্রথাগত সাদা প্লাস্টিকের বস্তার মুখ খুলে রাখা সতেজ চিনি।
- **দানার বৈশিষ্ট্য:** পরিষ্কার, চকচকে ও শুকনো দানা, কোনো প্রকার স্যাঁতসেঁতে ভাব নেই।
- **সাশ্রয়ী মূল্য:** প্যাকেটজাত ব্র্যান্ডের চেয়ে সাশ্রয়ী মূল্যে ১ কেজি পরিমাপে পরিবেশবান্ধব প্যাকেটে ডেলিভারি।`,
    description: `### Product Overview
Selected white crystal sugar sourced directly from mill shipments, scooped fresh from open woven polypropylene sacks. Clean, sparkling, dry grains offering prime sweetness at wholesale value.

### Key Attributes
- **Visual Display:** Authentic white woven plastic sack display overflowing with crystal sugar.
- **Grain Profile:** Crisp, dry, uniform grains that dissolve quickly in beverages and cooking.
- **Value Pricing:** Everyday cost savings compared to branded poly pouches.`,
  },
  {
    serial: 7,
    name: 'Refined White Sugar (Plastic Bosta) 25kg',
    nameBn: 'সাদা চিনি প্লাস্টিকের বস্তা ২৫ কেজি',
    slug: 'refined-white-sugar-plastic-bosta-25kg',
    packSize: '25 kg',
    unitId: UNIT_PACKET_ID,
    regularPrice: 2750,
    sellingPrice: 2650,
    discountPrice: 2650,
    brandName: 'Bazar Shodai Select',
    imgUrl: uploadedImgs.sugar_plastic_bosta_open,
    shortDescriptionBn: 'হোটেল, রেস্তোরাঁ ও বড় অনুষ্ঠানের জন্য ২৫ কেজি সাদা প্লাস্টিকের বস্তা চিনি।',
    shortDescription: 'Commercial 25kg woven polypropylene sack of pure refined white crystal sugar.',
    descriptionBn: `### পণ্য পরিচিতি
হোটেল, রেস্তোরাঁ, বেকারি, চা দোকান ও পারিবারিক বড় অনুষ্ঠানের জন্য পাইকারি মূল্যে ২৫ কেজি চিনির সম্পূর্ণ প্লাস্টিকের বস্তা। ফ্যাক্টরি সিল করা মজবুত সাদা পিপি বস্তা।

### বাণিজ্যিক সুবিধা
- **প্যাকিং:** মজবুত সাদা ওভেন প্লাস্টিক বস্তা (Woven PP Sack), যা আর্দ্রতা প্রতিরোধ করে।
- **গুণমান:** ৯৯.৮% খাঁটি ক্রিস্টাল পরিশোধিত চিনি।
- **সাশ্রয়:** এককালীন পাইকারি ক্রয়ে সর্বোচ্চ খরচ সাশ্রয়।`,
    description: `### Product Overview
Commercial 25kg woven polypropylene sack of pure refined crystal sugar for restaurants, bakeries, tea stalls, and festive catering.

### Commercial Advantages
- **Packaging:** Heavy-duty moisture-tight woven PP sack safeguarding against storage humidity.
- **Quality:** High sucrose crystal purity with zero dust or clump formation.
- **Bulk Economy:** Wholesale wholesale price tier for commercial kitchens.`,
  },
  {
    serial: 8,
    name: 'Refined White Sugar (Plastic Bosta) 50kg',
    nameBn: 'সাদা চিনি প্লাস্টিকের বস্তা ৫০ কেজি',
    slug: 'refined-white-sugar-plastic-bosta-50kg',
    packSize: '50 kg',
    unitId: UNIT_PACKET_ID,
    regularPrice: 5500,
    sellingPrice: 5300,
    discountPrice: 5300,
    brandName: 'Bazar Shodai Select',
    imgUrl: uploadedImgs.sugar_plastic_bosta_open,
    shortDescriptionBn: 'মিষ্টান্ন কারখানা ও বাণিজ্যিক ব্যবহারের জন্য সম্পূর্ণ ৫০ কেজি প্লাস্টিকের চিনির বস্তা।',
    shortDescription: 'Industrial 50kg heavy-duty woven polypropylene sack of refined white sugar.',
    descriptionBn: `### পণ্য পরিচিতি
মিষ্টান্ন প্রস্তুতকারক কারখানা, বড় কেটারিং ও খাদ্য প্রস্তুতকারী প্রতিষ্ঠানের জন্য ৫০ কেজি চিনির সম্পূর্ণ ওভেন প্লাস্টিক বস্তা।`,
    description: `### Product Overview
Industrial 50kg bulk sack of refined white sugar for sweet confectioneries and commercial food processing.`,
  },
];

async function seed() {
  console.log(`Starting seeding of ${PRODUCTS.length} Salt & Sugar products into Subcategory:`);
  console.log(` - Category ID: ${CATEGORY_ID} (${CATEGORY_NAME})`);
  console.log(` - Parent: Cooking (f54d730c-5ae4-49a4-a587-f07bbc24aa17)`);
  console.log(` - trackStock: false (Always in stock, inventory count bypassed)`);
  console.log(` - stock: 0 (clean default; count not tracked)`);
  console.log(` - Units assigned: packet\n`);

  let count = 0;
  for (const item of PRODUCTS) {
    count++;
    const buyingPrice = Number((item.sellingPrice * 0.88).toFixed(2));
    const profitMargin = 12.0;
    const isDiscounted = item.discountPrice !== null && item.discountPrice < item.regularPrice;

    console.log(`[${count}/${PRODUCTS.length}] Upserting: ${item.name} (${item.nameBn})...`);

    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        nameBn: item.nameBn,
        shortDescription: item.shortDescription,
        shortDescriptionBn: item.shortDescriptionBn,
        description: item.description,
        descriptionBn: item.descriptionBn,
        packSize: item.packSize,
        unitId: item.unitId,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        brandName: item.brandName,
        buyingPrice: buyingPrice,
        regularPrice: item.regularPrice,
        sellingPrice: item.sellingPrice,
        discountPrice: item.discountPrice,
        priceBeforeDiscount: isDiscounted ? item.regularPrice : null,
        profitMargin: profitMargin,
        status: 'ACTIVE',
        trackStock: false, // CRUCIAL: Do NOT track inventory count
        stock: 0, // Clean default; count not tracked
        isWeighed: false,
        isFeatured: item.serial <= 6,
        isNew: true,
        isHot: item.serial === 1 || item.serial === 4 || item.serial === 6,
        productCode: `SALT-SUGAR-${String(item.serial).padStart(2, '0')}`,
      },
      create: {
        name: item.name,
        nameBn: item.nameBn,
        slug: item.slug,
        shortDescription: item.shortDescription,
        shortDescriptionBn: item.shortDescriptionBn,
        description: item.description,
        descriptionBn: item.descriptionBn,
        packSize: item.packSize,
        unitId: item.unitId,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        brandName: item.brandName,
        buyingPrice: buyingPrice,
        regularPrice: item.regularPrice,
        sellingPrice: item.sellingPrice,
        discountPrice: item.discountPrice,
        priceBeforeDiscount: isDiscounted ? item.regularPrice : null,
        profitMargin: profitMargin,
        status: 'ACTIVE',
        trackStock: false, // CRUCIAL: Do NOT track inventory count
        stock: 0, // Clean default; count not tracked
        isWeighed: false,
        isFeatured: item.serial <= 6,
        isNew: true,
        isHot: item.serial === 1 || item.serial === 4 || item.serial === 6,
        productCode: `SALT-SUGAR-${String(item.serial).padStart(2, '0')}`,
      },
    });

    // Link Main Image
    if (item.imgUrl) {
      await prisma.productImage.deleteMany({
        where: { productId: product.id },
      });
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: item.imgUrl,
          alt: `${item.nameBn} - ${item.name}`,
          isMain: true,
          order: 0,
        },
      });
    }

    console.log(`   ✓ Upserted: ID ${product.id}`);
  }

  console.log(`\n======================================================`);
  console.log(`Successfully seeded all ${PRODUCTS.length} Salt & Sugar products!`);
  console.log(`Category: Salt & Sugar (slug: cooking-salt-and-sugar)`);
  console.log(`Stock Status: trackStock = false, stock = 0`);
  console.log(`======================================================`);
}

seed()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });


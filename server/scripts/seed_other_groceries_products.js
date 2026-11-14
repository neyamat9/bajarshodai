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

const uploadedImgs = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'other_groceries_uploaded_images.json'), 'utf8')
);

const CATEGORY_ID = 'cd7283be-6dc3-4063-be4c-3152cb3b485a'; // Other Groceries (অন্যান্য সামগ্রী)
const CATEGORY_NAME = 'Other Groceries';
const UNIT_PACKET_ID = '77eb802d-9a7f-4bde-b0ca-d48056787943'; // packet (প্যাকেট)
const FOSTER_CLARKS_BRAND_ID = '69d16579-ae00-4290-aa92-e5cebba05fb6';

const PRODUCTS = [
  {
    serial: 1,
    code: 'OTHER-01',
    name: 'BBQ Charcoal Bag 1 kg',
    nameBn: 'বিবিভিউ কয়লা ব্যাগ ১ কেজি',
    slug: 'bbq-charcoal-bag-1-kg',
    brandId: null,
    brandName: null,
    packSize: '1 kg',
    regularPrice: 149,
    sellingPrice: 149,
    discountPrice: null,
    isDiscounted: false,
    shortDescriptionBn: 'বারবিকিউ ও গ্রিলিংয়ের জন্য উন্নত মানের প্রাকৃতিক কয়লা ব্যাগ ১ কেজি।',
    shortDescription: 'High-quality natural lump hardwood charcoal bag 1 kg for BBQ and grilling.',
    overview: 'BBQ Charcoal Bag 1 kg (বিবিভিউ কয়লা ব্যাগ ১ কেজি). Premium natural lump charcoal that burns long, clean, and hot for outdoor grilling, steaks, kebabs, and barbecue sessions.',
    overviewBn: 'বিবিভিউ কয়লা ব্যাগ ১ কেজি। আউটডোর গ্রিলিং, কাবাব, স্টেক ও বারবিকিউ আয়োজনের জন্য নিখুঁত এবং দীর্ঘস্থায়ী তাপ উৎপন্নকারী প্রাকৃতিক কয়লা।',
    highlights: [
      '100% natural hardwood lump charcoal',
      'Consistent, long-lasting high heat with minimal ash',
      'Perfect for BBQ grill, kebabs, steaks, and outdoor cooking',
      'Net Weight: 1 kg',
    ],
    highlightsBn: [
      '১০০% প্রাকৃতিক শক্ত কাঠের কয়লা',
      'ধীর ও দীর্ঘস্থায়ী তীব্র তাপ, কম ছাই উৎপন্ন করে',
      'বারবিকিউ গ্রিল, কাবাব, শিক কাবাব ও স্টেক তৈরির জন্য সেরা',
      'নেট ওজন: ১ কেজি',
    ],
  },
  {
    serial: 2,
    code: 'OTHER-02',
    name: 'Booter Besan 500g',
    nameBn: 'বুটের বেসন ৫০০ গ্রাম',
    slug: 'booter-besan-500g',
    brandId: null,
    brandName: null,
    packSize: '500 g',
    regularPrice: 69,
    sellingPrice: 69,
    discountPrice: null,
    isDiscounted: false,
    shortDescriptionBn: 'মুচমুচে বেগুনি, পিঁয়াজু ও পাকোড়া তৈরির জন্য খাঁটি দানাদার বুটের বেসন ৫০০ গ্রাম।',
    shortDescription: 'Pure and fine chickpea gram flour Booter Besan 500g for crispy pakoras and snacks.',
    overview: 'Booter Besan 500g (বুটের বেসন ৫০০ গ্রাম). Made from selected high quality split Bengal gram chickpeas, ground to perfection for delicious savory fritters, snacks, and traditional sweets.',
    overviewBn: 'বুটের বেসন ৫০০ গ্রাম। বাছাইকৃত খাঁটি ছোলার ডাল থেকে ভাঙানো দানাদার বেসন, যা যেকোনো ভাজাপোড়া, বেগুনি, চপ ও নাস্তা মুচমুচে ও মুখরোচক করতে সেরা।',
    highlights: [
      '100% pure Bengal gram chickpea flour (Besan)',
      'Rich in plant protein and dietary fiber',
      'Guarantees extra crispiness in beguni, piaju, and vegetable pakoras',
      'Net Weight: 500 g',
    ],
    highlightsBn: [
      '১০০% খাঁটি বাছাইকৃত বুটের ডালের বেসন',
      'প্রাকৃতিক প্রোটিন ও পুষ্টিতে ভরপুর',
      'বেগুনি, পেঁয়াজু, ডিম চপ ও পাকোড়ায় অতুলনীয় মচমচে ভাব এনে দেয়',
      'নেট ওজন: ৫০০ গ্রাম',
    ],
  },
  {
    serial: 3,
    code: 'OTHER-03',
    name: 'Sagudana 200g',
    nameBn: 'সাগুদana ২০০ গ্রাম',
    nameBnCorrect: 'সাগুদানা ২০০ গ্রাম',
    slug: 'sagudana-200g',
    brandId: null,
    brandName: null,
    packSize: '200 g',
    regularPrice: 60,
    sellingPrice: 49,
    discountPrice: 49,
    isDiscounted: true,
    shortDescriptionBn: 'পুষ্টিকর ও খাঁটি দানাদার মুক্তোর মতো সাদা সাগুদানা ২০০ গ্রাম।',
    shortDescription: 'Wholesome and pure white tapioca sago pearls Sagudana 200g.',
    overview: 'Sagudana 200g (সাগুদানা ২০০ গ্রাম). Pure premium tapioca sago pearls, ideal for baby food, wholesome pudding, falooda, payesh, and fasting snacks.',
    overviewBn: 'সাগুদানা ২০০ গ্রাম। ঝকঝকে মুক্তার দানার মতো পুষ্টিকর সাগুদানা; শিশুদের সহজপাচ্য খাবার, ফালুদা, ক্ষীর, পায়েস ও রোগীর পথ্য তৈরিতে দারুণ উপকারী।',
    highlights: [
      'Premium uniform white sago pearls',
      'Easy to digest, rich in healthy carbohydrates',
      'Excellent for desserts, falooda, khichdi, and baby food',
      'Net Weight: 200 g',
    ],
    highlightsBn: [
      'পরিষ্কার ও সমরূপ দানার মুক্তা সদৃশ সাদা সাগুদানা',
      'সহজলভ্য শক্তি ও দ্রুত হজমযোগ্য কার্বোহাইড্রেট সমৃদ্ধ',
      'ফালুদা, পায়েস, পুডিং এবং শিশুদের পুষ্টিকর খাবার তৈরিতে আদর্শ',
      'নেট ওজন: ২০০ গ্রাম',
    ],
  },
  {
    serial: 4,
    code: 'OTHER-04',
    name: "Foster Clark's Corn Flour 400g",
    nameBn: "ফস্টার ক্লার্ক'স কর্ন ময়দা ৪০০ গ্রাম",
    slug: 'foster-clarks-corn-flour-400g',
    brandId: FOSTER_CLARKS_BRAND_ID,
    brandName: "Foster Clark's",
    packSize: '400 g',
    regularPrice: 360,
    sellingPrice: 360,
    discountPrice: null,
    isDiscounted: false,
    shortDescriptionBn: "আমদানিকৃত প্রিমিয়াম মানের ফস্টার ক্লার্ক'স কর্ন ময়দা ৪০০ গ্রাম; স্যুপ, গ্রেভি ও বেকিংয়ের জন্য আদর্শ।",
    shortDescription: "Premium imported Foster Clark's Corn Flour 400g for silky sauces, soups, and baking.",
    overview: "Foster Clark's Corn Flour 400g (ফস্টার ক্লার্ক'স কর্ন ময়দা ৪০০ গ্রাম) by Foster Clark's. Premium ultra-fine corn starch for smooth thickening of Chinese soups, savory gravies, sauces, puddings, and pastry fillings.",
    overviewBn: "ফস্টার ক্লার্ক'স কর্ন ময়দা ৪০০ গ্রাম (Foster Clark's)। বিশ্বখ্যাত ব্র্যান্ডের মসৃণ কর্ন স্টার্চ, যা স্যুপ, ফ্রায়েড চিকেন কোটিং, গ্রেভি ঘন করতে এবং কাস্টার্ড ও পুডিং বানাতে অপরিহার্য।",
    highlights: [
      "Original imported Foster Clark's corn flour",
      'Delivers smooth, lump-free thickness to soups and sauces',
      'Essential for crispy fried chicken coatings and bakery confectionery',
      'Net Weight: 400 g',
    ],
    highlightsBn: [
      "আসল আমদানিকৃত ফস্টার ক্লার্ক'স কর্ন ফ্লাওয়ার",
      'স্যুপ, গ্রেভি ও সসে মসৃণ ঘনত্ব আনে কোনো দলা না পাকিয়ে',
      'ফ্রায়েড আইটেমে মুচমুচে কোটিং এবং কেক-পেস্ট্রির বেকিংয়ে ব্যবহৃত',
      'নেট ওজন: ৪০০ গ্রাম',
    ],
  },
  {
    serial: 5,
    code: 'OTHER-05',
    name: 'Deshelled Tamarind 200g',
    nameBn: 'তেঁতুল খোসা ছাড়ানো ২০০ গ্রাম',
    slug: 'deshelled-tamarind-200g',
    brandId: null,
    brandName: null,
    packSize: '200 g',
    regularPrice: 59,
    sellingPrice: 55,
    discountPrice: 55,
    isDiscounted: true,
    shortDescriptionBn: 'পরিষ্কার ও খোসা ছাড়ানো প্রাকৃতিক খাঁটি টক তেঁতুল ২০০ গ্রাম; চাটনি, ফুচকার টক ও রান্নার জন্য উপযোগী।',
    shortDescription: 'Clean, deshelled natural tangy tamarind pulp 200g for chutney, tok, and cooking.',
    overview: 'Deshelled Tamarind 200g (তেঁতুল খোসা ছাড়ানো ২০০ গ্রাম). Selected premium dried tamarind pulp without outer brittle shells, ready to soak and use for tangy chutneys, fuchka tok, fish curries, and sauces.',
    overviewBn: 'তেঁতুল খোসা ছাড়ানো ২০০ গ্রাম। বাছাই করা পরিষ্কার শুকনো তেঁতুলের ঘন শাঁস; খোসা ছাড়ানোর বাড়তি ঝামেলা ছাড়াই ঝটপট চাটনি, আচার, ফুচকা ও রান্নায় ব্যবহারের জন্য সেরা।',
    highlights: [
      'Pre-deshelled, clean natural tamarind pulp',
      'Authentic zesty sweet & sour profile',
      'Ready to use for fuchka tok, spicy chutneys, and sour curries',
      'Net Weight: 200 g',
    ],
    highlightsBn: [
      'খোসা ছাড়ানো পরিষ্কার ও খাঁটি প্রাকৃতিক তেঁতুল',
      'অরিজিনাল টক স্বাদ ও ঘ্রাণযুক্ত',
      'ফুচকার টক, চাটনি, তেঁতুলের আচার ও টকের তরকারির জন্য প্রস্তুত',
      'নেট ওজন: ২০০ গ্রাম',
    ],
  },
  {
    serial: 6,
    code: 'OTHER-06',
    name: 'Pumpkin Seeds 100g',
    nameBn: 'মিষ্টি কুমড়া বীজ ১০০ গ্রাম',
    slug: 'pumpkin-seeds-100g',
    brandId: null,
    brandName: null,
    packSize: '100 g',
    regularPrice: 99,
    sellingPrice: 99,
    discountPrice: null,
    isDiscounted: false,
    shortDescriptionBn: 'জিংক ও ম্যাগনেশিয়াম সমৃদ্ধ পুষ্টিকর কাঁচা মিষ্টি কুমড়ার বীজ ১০০ গ্রাম।',
    shortDescription: 'Healthy, raw green shelled pumpkin seeds (pepitas) 100g rich in magnesium & zinc.',
    overview: 'Pumpkin Seeds 100g (মিষ্টি কুমড়া বীজ ১০০ গ্রাম). High nutrient green pepitas pumpkin seeds, naturally loaded with healthy fats, dietary fiber, magnesium, and plant protein for snacking, oatmeal, and baking.',
    overviewBn: 'মিষ্টি কুমড়া বীজ ১০০ গ্রাম। পুষ্টিগুণে ভরপুর সবুজ রঙের খোসা ছাড়ানো মিষ্টি কুমড়ার বীজ; রোগ প্রতিরোধ ক্ষমতা বৃদ্ধি ও হৃদযন্ত্রের যত্নে প্রতিদিনের খাদ্যতালিকায় সুপারফুড।',
    highlights: [
      'Premium raw, deshelled green pepitas',
      'Rich in zinc, magnesium, antioxidants, and dietary fiber',
      'Ideal for healthy snacking, salad toppings, smoothies, and granola',
      'Net Weight: 100 g',
    ],
    highlightsBn: [
      'খোসা ছাড়ানো সবুজ রঙের প্রিমিয়াম মিষ্টি কুমড়ার বীজ',
      'প্রচুর পরিমাণে জিংক, ম্যাগনেশিয়াম ও ওমেগা ফ্যাটি অ্যাসিড সমৃদ্ধ',
      'সরাসরি খাবার উপযোগী অথবা সালাদ, স্মুদি ও ওটসের সাথে পুষ্টিকর সংযোজন',
      'নেট ওজন: ১০০ গ্রাম',
    ],
  },
  {
    serial: 7,
    code: 'OTHER-07',
    name: 'Whole Nutmeg 5 pcs',
    nameBn: 'আস্ত জয়ফল ৫ টি',
    slug: 'whole-nutmeg-5-pcs',
    brandId: null,
    brandName: null,
    packSize: '5 pcs',
    regularPrice: 49,
    sellingPrice: 49,
    discountPrice: null,
    isDiscounted: false,
    shortDescriptionBn: 'শাহী বিরিয়ানি, রেজালা ও রোস্টের ঘ্রাণ বাড়াতে আস্ত খাঁটি জয়ফল ৫ টি।',
    shortDescription: 'Aromatic authentic whole nutmeg seeds (Jaiphol) 5 pcs for biryani and rich curries.',
    overview: 'Whole Nutmeg 5 pcs (আস্ত জয়ফল ৫ টি). Whole aromatic nutmeg nuts packed with warm woody flavor and essential oils. Grate freshly into biryani, meat rezala, korma, garam masala, and dessert recipes.',
    overviewBn: 'আস্ত জয়ফল ৫ টি। রাজকীয় সুবাস ও উষ্ণ ঝাঁঝালো স্বাদের বাছাই করা গোটা জয়ফল; বিরিয়ানি, রোস্ট, রেজালা, বোরহানি ও স্পেশাল গরম মশলায় ব্যবহারের জন্য খাঁটি।',
    highlights: [
      'Whole, intact aromatic nutmeg seeds (Jaiphol)',
      'Locks in maximum freshness and rich natural essential oils',
      'Essential for authentic royal biryani, rezala, and spice blends',
      'Pack Contents: 5 pcs',
    ],
    highlightsBn: [
      'বাছাইকৃত তাজা আস্ত গোটা জয়ফল (Jaiphol)',
      'প্রাকৃতিক এসেনশিয়াল অয়েল ও সুবাস অটুট থাকে',
      'শাহী বিরিয়ানি, খাসির রেজালা, কোরমা ও মাংসের রান্নার অপরিহার্য মশলা',
      'প্যাক সাইজ: ৫ টি',
    ],
  },
];

async function main() {
  console.log(`Starting seeding of ${PRODUCTS.length} Other Groceries products into category "${CATEGORY_NAME}"...`);

  for (const item of PRODUCTS) {
    const buyingPrice = Number((item.sellingPrice * 0.82).toFixed(2));
    const profitMargin = Number((((item.sellingPrice - buyingPrice) / item.sellingPrice) * 100).toFixed(2));
    const imgData = uploadedImgs[item.code];
    const imgUrl = imgData ? imgData.url : null;
    const finalNameBn = item.nameBnCorrect || item.nameBn;

    console.log(`[${item.serial}/${PRODUCTS.length}] Upserting ${item.code}: ${item.name} (${finalNameBn})...`);

    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        productCode: item.code,
        name: item.name,
        nameBn: finalNameBn,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        brandId: item.brandId,
        brandName: item.brandName,
        unitId: UNIT_PACKET_ID,
        packSize: item.packSize,
        regularPrice: item.regularPrice,
        sellingPrice: item.sellingPrice,
        discountPrice: item.discountPrice,
        priceBeforeDiscount: item.isDiscounted ? item.regularPrice : null,
        buyingPrice: buyingPrice,
        profitMargin: profitMargin,
        trackStock: false,
        stock: 0,
        lowStockThreshold: 5,
        sellStep: 1,
        minQty: 1,
        isDiscounted: item.isDiscounted,
        status: 'ACTIVE',
        shortDescription: item.shortDescription,
        shortDescriptionBn: item.shortDescriptionBn,
        description: `### Product Overview\n${item.overview}\n\n### Highlights\n${item.highlights.map((h) => `- ${h}`).join('\n')}`,
        descriptionBn: `### পণ্য পরিচিতি\n${item.overviewBn}\n\n### বৈশিষ্ট্য\n${item.highlightsBn.map((h) => `- ${h}`).join('\n')}`,
        isFeatured: item.serial <= 3,
        isNew: true,
        isHot: item.serial === 1 || item.serial === 4,
      },
      create: {
        productCode: item.code,
        name: item.name,
        nameBn: finalNameBn,
        slug: item.slug,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        brandId: item.brandId,
        brandName: item.brandName,
        unitId: UNIT_PACKET_ID,
        packSize: item.packSize,
        regularPrice: item.regularPrice,
        sellingPrice: item.sellingPrice,
        discountPrice: item.discountPrice,
        priceBeforeDiscount: item.isDiscounted ? item.regularPrice : null,
        buyingPrice: buyingPrice,
        profitMargin: profitMargin,
        trackStock: false,
        stock: 0,
        lowStockThreshold: 5,
        sellStep: 1,
        minQty: 1,
        isDiscounted: item.isDiscounted,
        status: 'ACTIVE',
        shortDescription: item.shortDescription,
        shortDescriptionBn: item.shortDescriptionBn,
        description: `### Product Overview\n${item.overview}\n\n### Highlights\n${item.highlights.map((h) => `- ${h}`).join('\n')}`,
        descriptionBn: `### পণ্য পরিচিতি\n${item.overviewBn}\n\n### বৈশিষ্ট্য\n${item.highlightsBn.map((h) => `- ${h}`).join('\n')}`,
        isFeatured: item.serial <= 3,
        isNew: true,
        isHot: item.serial === 1 || item.serial === 4,
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
          alt: `${finalNameBn} - ${item.name}`,
          isMain: true,
          order: 0,
        },
      });
    }

    console.log(`   ✓ [${item.code}] Done: ID ${product.id} | Image: ${imgUrl ? 'OK' : 'MISSING'}`);
  }

  console.log(`\nAll ${PRODUCTS.length} products successfully seeded into category "Other Groceries" (${CATEGORY_NAME})!`);
}

main()
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

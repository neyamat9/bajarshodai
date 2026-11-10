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

const uploadedImgs = JSON.parse(fs.readFileSync(path.join(__dirname, 'dal_uploaded_images.json'), 'utf8'));

const CATEGORY_ID = '0e411582-f204-433b-acf7-dcf62d74955c'; // Pulses & Dal under Cooking
const CATEGORY_NAME = 'Pulses & Dal';
const UNIT_PACKET_ID = '77eb802d-9a7f-4bde-b0ca-d48056787943'; // packet

const PRODUCTS = [
  {
    serial: 1,
    name: 'Kabuli Boot (White Chickpeas) 500g',
    nameBn: 'কাবুলি বুট (সাদা ছোলা) ৫০০ গ্রাম',
    slug: 'kabuli-boot-white-chickpeas-500g',
    packSize: '500 g',
    unitId: UNIT_PACKET_ID,
    regularPrice: 129,
    sellingPrice: 129,
    discountPrice: null,
    brandName: 'Bazar Shodai Premium',
    imgUrl: uploadedImgs.kabuli_boot_bowl,
    shortDescriptionBn: 'বড় দানার ধবধবে সাদা প্রিমিয়াম কোয়ালিটি কাবুলি বুট ৫০০ গ্রাম প্যাকেট।',
    shortDescription: 'Large white grain premium quality Kabuli Boot (garbanzo chickpeas) 500g pack.',
    descriptionBn: `### পণ্য পরিচিতি
বড় দানার ধবধবে পরিষ্কার কাবুলি বুট (সাদা ছোলা)। ছোলা ভাটুরে, সুস্বাদু হুমাস, কাবুলি ছোলার চাট ও সালাদ তৈরির জন্য আদর্শ।

### পুষ্টিগুণ ও উপকারিতা
- **প্রোটিন ও ফাইবার:** উচ্চমাত্রার উদ্ভিজ্জ প্রোটিন ও ফাইবার সমৃদ্ধ যা দীর্ঘক্ষণ পেট ভরা রাখে।
- **স্বাদ ও টেক্সচার:** সেদ্ধ করলে সুন্দর ফুলে ওঠে ও মাখনের মতো নরম মোলায়েম হয়।
- **সংরক্ষণ:** শুষ্ক ও শীতল স্থানে সংরক্ষণ করুন।`,
    description: `### Product Overview
Plump, large-grain premium quality white chickpeas (Kabuli Chana / Garbanzo beans). Perfect for chole bhature, rich curries, Mediterranean hummus, and protein-packed salads.

### Key Highlights
- **High Plant Protein:** Excellent natural protein and dietary fiber source.
- **Tender Texture:** Cooks up fluffy, tender, and deliciously nutty.
- **Storage:** Keep sealed in an airtight dry container.`,
  },
  {
    serial: 2,
    name: 'Pran Moong Dal 500g',
    nameBn: 'প্রাণ মুগ ডাল ৫০০ গ্রাম',
    slug: 'pran-moong-dal-500g',
    packSize: '500 g',
    unitId: UNIT_PACKET_ID,
    regularPrice: 100,
    sellingPrice: 100,
    discountPrice: null,
    brandName: 'PRAN',
    imgUrl: uploadedImgs.pran_moong_dal_packet,
    shortDescriptionBn: 'প্রাণ প্রিমিয়াম বাছাইকৃত সোনালী মুগ ডাল ৫০০ গ্রাম প্যাকেট।',
    shortDescription: 'PRAN premium selected golden yellow Moong Dal 500g pack.',
    descriptionBn: `### পণ্য পরিচিতি
প্রাণ মুগ ডাল পুষ্টি ও সুস্বাদু স্বাদের জন্য জনপ্রিয়। সোনালী দানার এই মুগ ডাল হালকা ভেজে রান্না করলে চমৎকার মিষ্টি সুবাস ছড়ায়। খিচুড়ি ও পাতলা মুগ ডালের জন্য সেরা পছন্দ।

### বৈশিষ্ট্য
- বাছাইকৃত উজ্জ্বল সোনালী দানা।
- সহজে সিদ্ধ হয় ও রান্নায় চমৎকার গন্ধ তৈরি করে।
- প্রাণ কোয়ালিটি নিশ্চয়তায় প্যাকেটজাত।`,
    description: `### Product Overview
PRAN Moong Dal (split yellow mung beans) is known for its appetizing golden color and delicate aroma when roasted. Ideal for traditional Bengali bhuna khichuri, dal tadka, and light soups.`,
  },
  {
    serial: 3,
    name: 'Anchor Boot Dal 500g',
    nameBn: 'অ্যাঙ্কর বুট ডাল ৫০০ গ্রাম',
    slug: 'anchor-boot-dal-500g',
    packSize: '500 g',
    unitId: UNIT_PACKET_ID,
    regularPrice: 39,
    sellingPrice: 39,
    discountPrice: null,
    brandName: 'Anchor',
    imgUrl: uploadedImgs.boot_dal_bowl,
    shortDescriptionBn: 'অ্যাঙ্কর বুট ডাল (আমদানিকৃত হলুদ স্প্লিট ডাল) ৫০০ গ্রাম প্যাকেট।',
    shortDescription: 'Anchor Boot Dal (imported yellow split peas) 500g pack.',
    descriptionBn: `### পণ্য পরিচিতি
অ্যাঙ্কর বুট ডাল অত্যন্ত জনপ্রিয় ও সাশ্রয়ী একটি ডাল। হালুয়া, পুরি ও মুখরোচক ডাল রান্নায় চমৎকার স্বাদ এনে দেয়।`,
    description: `### Product Overview
Anchor Boot Dal (yellow split peas) 500g pack. Economical and versatile for daily family cooking, dal curries, and traditional Bengali desserts.`,
  },
  {
    serial: 4,
    name: 'Kangaroo Masoor Dal 1kg',
    nameBn: 'ক্যাঙ্গারু মসুর ডাল ১ কেজি',
    slug: 'kangaroo-masoor-dal-1kg',
    packSize: '1 kg',
    unitId: UNIT_PACKET_ID,
    regularPrice: 179,
    sellingPrice: 179,
    discountPrice: null,
    brandName: 'Kangaroo',
    imgUrl: uploadedImgs.kangaroo_masoor_dal_packet,
    shortDescriptionBn: 'অস্ট্রেলিয়ান ক্যাঙ্গারু মসুর ডাল ১ কেজি প্রিমিয়াম প্যাকেট।',
    shortDescription: 'Imported Australian Kangaroo brand premium split red lentils 1kg pack.',
    descriptionBn: `### পণ্য পরিচিতি
বিশ্বখ্যাত অস্ট্রেলিয়ান ক্যাঙ্গারু ব্র্যান্ডের মসুর ডাল। পরিষ্কার পরিচ্ছন্ন, দ্রুত সিদ্ধ হয় এবং রান্নায় দারুণ ঘন লালচে বর্ণ ও চমৎকার স্বাদ তৈরি করে।`,
    description: `### Product Overview
Kangaroo brand Australian red split lentils (Masoor Dal) 1kg pack. Renowned for consistent quality, rapid cooking time, and velvety texture.`,
  },
  {
    serial: 5,
    name: 'Mixed Dal (Mishro Dal) 500g',
    nameBn: 'মিশ্র ডাল ৫০০ গ্রাম',
    slug: 'mixed-dal-mishro-500g',
    packSize: '500 g',
    unitId: UNIT_PACKET_ID,
    regularPrice: 79,
    sellingPrice: 75,
    discountPrice: 75,
    brandName: 'Bazar Shodai Special',
    imgUrl: uploadedImgs.mixed_dal_bowl,
    shortDescriptionBn: '৫ পদের পুষ্টিকর মিশ্র ডাল ৫০০ গ্রাম প্যাকেট (সাশ্রয়ী অফার)।',
    shortDescription: 'Nutrient-rich 5-lentil mixed dal (Panchmel blend) 500g pack.',
    descriptionBn: `### পণ্য পরিচিতি
মসুর, মুগ, বুট, মাষকলাই ও অড়হর ডালের সুষম মিশ্রণ। পঞ্চমেল ডাল বা মিক্সড ডাল তরকা রান্নার জন্য অতুলনীয়। সব ধরনের অ্যামিনো অ্যাসিড ও প্রোটিনের পরিপূর্ণ যোগান দেয়।`,
    description: `### Product Overview
A harmonious five-lentil blend featuring masoor, moong, chana, urad, and toor dal. Packed with diverse plant proteins, iron, and fiber for a wholesome family meal.`,
  },
  {
    serial: 6,
    name: 'Pran Masoor Dal (Deshi) 500g',
    nameBn: 'প্রাণ মসুর ডাল (দেশি) ৫০০ গ্রাম',
    slug: 'pran-masoor-dal-deshi-500g',
    packSize: '500 g',
    unitId: UNIT_PACKET_ID,
    regularPrice: 95,
    sellingPrice: 95,
    discountPrice: null,
    brandName: 'PRAN',
    imgUrl: uploadedImgs.pran_masoor_dal_deshi_packet,
    shortDescriptionBn: 'প্রাণ খাঁটি দেশি ছোট দানার মসুর ডাল ৫০০ গ্রাম প্যাকেট।',
    shortDescription: 'PRAN authentic local Deshi Masoor Dal (small red grain) 500g pack.',
    descriptionBn: `### পণ্য পরিচিতি
বাংলাদেশের উর্বর মাটিতে উৎপাদিত ছোট দানার খাঁটি দেশি মসুর ডাল। এর সুবাস ও স্বাদ আমদানিকৃত ডালের চেয়ে বহুগুণ সমৃদ্ধ। অল্প সময়ে সিদ্ধ হয়ে চমৎকার ঘন ও মিষ্টি ডাল তৈরি করে।`,
    description: `### Product Overview
PRAN Deshi Masoor Dal (authentic Bangladeshi indigenous small-grain red lentils) 500g pack. Rich in aroma, naturally sweet taste, and superior nutrient density.`,
  },
  {
    serial: 7,
    name: 'Motor Dal 500g',
    nameBn: 'মটর ডাল ৫০০ গ্রাম',
    slug: 'motor-dal-500g',
    packSize: '500 g',
    unitId: UNIT_PACKET_ID,
    regularPrice: 79,
    sellingPrice: 79,
    discountPrice: null,
    brandName: 'Bazar Shodai Premium',
    imgUrl: uploadedImgs.motor_dal_bowl,
    shortDescriptionBn: 'পরিষ্কার হলুদ মটর ডাল ৫০০ গ্রাম প্যাকেট।',
    shortDescription: 'Clean yellow-green split Motor Dal (split field peas) 500g pack.',
    descriptionBn: `### পণ্য পরিচিতি
সুস্বাদু মটর ডাল। মুখরোচক বড়া, বেসন প্রস্তুতি ও ঝাল ডাল রান্নায় চমৎকার স্বাদ প্রদান করে।`,
    description: `### Product Overview
Natural dried split motor dal (field peas) 500g. Great for crunchy fritters (bora), savory pancakes, and hearty vegetable stews.`,
  },
  {
    serial: 8,
    name: 'Aarong Natural Masoor Dal 1kg',
    nameBn: 'আড়ং ন্যাচারাল মসুর ডাল ১ কেজি',
    slug: 'aarong-natural-masoor-dal-1kg',
    packSize: '1 kg',
    unitId: UNIT_PACKET_ID,
    regularPrice: 185,
    sellingPrice: 185,
    discountPrice: null,
    brandName: 'Aarong Natural',
    imgUrl: uploadedImgs.aarong_natural_masoor_dal_packet,
    shortDescriptionBn: 'আড়ং ন্যাচারাল প্রিমিয়াম বাছাইকৃত মসুর ডাল ১ কেজি প্যাকেট।',
    shortDescription: 'Aarong Natural premium selected Masoor Dal 1kg pack.',
    descriptionBn: `### পণ্য পরিচিতি
আড়ং ন্যাচারাল মসুর ডাল গ্রাম বাংলার প্রাকৃতিক পরিবেশ থেকে সরাসরি সংগৃহীত। রাসায়নিকমুক্ত ও স্বাস্থ্যসম্মতভাবে প্যাকেটজাত।`,
    description: `### Product Overview
Aarong Natural premium Masoor Dal 1kg pack. Farm-sourced, gently graded, and packed under strict quality standards for wholesome nutrition.`,
  },
  {
    serial: 9,
    name: 'Golden Grain Premium Moong Dal 500g',
    nameBn: 'গোল্ডেন গ্রেইন প্রিমিয়াম মুগ ডাল ৫০০ গ্রাম',
    slug: 'golden-grain-premium-moong-dal-500g',
    packSize: '500 g',
    unitId: UNIT_PACKET_ID,
    regularPrice: 100,
    sellingPrice: 100,
    discountPrice: null,
    brandName: 'Golden Grain',
    imgUrl: uploadedImgs.golden_grain_moong_dal_packet,
    shortDescriptionBn: 'গোল্ডেন গ্রেইন প্রিমিয়াম পালিশড মুগ ডাল ৫০০ গ্রাম প্যাকেট।',
    shortDescription: 'Golden Grain Premium Moong Dal 500g pack.',
    descriptionBn: `### পণ্য পরিচিতি
গোল্ডেন গ্রেইন প্রিমিয়াম মুগ ডাল অত্যন্ত পুষ্টিকর ও সুস্বাদু। ভিটামিন ও খনিজ উপাদানে ভরপুর, যা সহজে হজম হয় ও শরীরকে চনমনে রাখে।`,
    description: `### Product Overview
Golden Grain Premium Moong Dal 500g pack. Rich in antioxidants, vitamins, and minerals. Exceptionally easy to digest.`,
  },
  {
    serial: 10,
    name: 'Fresh Premium Masoor Dal 1kg',
    nameBn: 'ফ্রেশ প্রিমিয়াম মসুর ডাল ১ কেজি',
    slug: 'fresh-premium-masoor-dal-1kg',
    packSize: '1 kg',
    unitId: UNIT_PACKET_ID,
    regularPrice: 175,
    sellingPrice: 175,
    discountPrice: null,
    brandName: 'Fresh',
    imgUrl: uploadedImgs.fresh_masoor_dal_packet,
    shortDescriptionBn: 'ফ্রেশ প্রিমিয়াম লাল মসুর ডাল ১ কেজি প্যাকেট।',
    shortDescription: 'Fresh brand premium red split Masoor Dal 1kg family pack.',
    descriptionBn: `### পণ্য পরিচিতি
মেঘনা গ্রুপের ফ্রেশ ব্র্যান্ডের আধুনিক কারখানায় স্বয়ংক্রিয়ভাবে পরিশোধিত ও প্যাকেটজাত মসুর ডাল। রান্না হয় দ্রুত, স্বাদ নিখুঁত।`,
    description: `### Product Overview
Fresh Premium Masoor Dal 1kg pack. Organically sourced and automatically processed under stringent hygiene protocols.`,
  },
  {
    serial: 11,
    name: 'Maskalai Dal (Peeled) 500g',
    nameBn: 'মাসকলাই ডাল পিলড ৫০০ গ্রাম',
    slug: 'maskalai-dal-peeled-500g',
    packSize: '500 g',
    unitId: UNIT_PACKET_ID,
    regularPrice: 95,
    sellingPrice: 95,
    discountPrice: null,
    brandName: 'Bazar Shodai Premium',
    imgUrl: uploadedImgs.maskalai_dal_bowl,
    shortDescriptionBn: 'খোসা ছাড়ানো ধবধবে সাদা মাসকলাই ডাল ৫০০ গ্রাম প্যাকেট।',
    shortDescription: 'Peeled ivory-white Maskalai Dal (split urad dal) 500g pack.',
    descriptionBn: `### পণ্য পরিচিতি
খোসা ছাড়ানো ধবধবে সাদা মাষকলাইয়ের ডাল। ইলিশ মাছের মাথা দিয়ে ডাল রান্না, মাসকলাইয়ের রুটি কিংবা দোসা-ইডলি তৈরির জন্য আদর্শ।`,
    description: `### Product Overview
Skinless, split white Urad Dal (Maskalai Dal) 500g. Prized for its rich creaminess, earthy flavor, and traditional pairing with fish head curries.`,
  },
  {
    serial: 12,
    name: 'Masoor Dal (Imported) 250g',
    nameBn: 'মসুর ডাল (আমদানিকৃত) ২৫০ গ্রাম',
    slug: 'masoor-dal-imported-250g',
    packSize: '250 g',
    unitId: UNIT_PACKET_ID,
    regularPrice: 29,
    sellingPrice: 29,
    discountPrice: null,
    brandName: 'Bazar Shodai Selection',
    imgUrl: uploadedImgs.masoor_dal_imported_bowl,
    shortDescriptionBn: 'আমদানিকৃত উজ্জ্বল লাল মসুর ডাল ২৫০ গ্রাম মিনি প্যাক।',
    shortDescription: 'Imported red split Masoor Dal 250g mini trial pack.',
    descriptionBn: `### পণ্য পরিচিতি
ছোট পরিবারের জন্য সাশ্রয়ী ২৫০ গ্রাম মসুর ডাল। নিখুঁতভাবে পরিষ্কার করা ও দ্রুত সিদ্ধ হওয়ার উপযোগী।`,
    description: `### Product Overview
Imported split red lentils 250g mini pack. Perfect small portion for quick cooking and single households.`,
  },
  {
    serial: 13,
    name: 'Mixed Dal (Mishro Dal) 250g',
    nameBn: 'মিশ্র ডাল ২৫০ গ্রাম',
    slug: 'mixed-dal-mishro-250g',
    packSize: '250 g',
    unitId: UNIT_PACKET_ID,
    regularPrice: 45,
    sellingPrice: 39,
    discountPrice: 39,
    brandName: 'Bazar Shodai Special',
    imgUrl: uploadedImgs.mixed_dal_bowl,
    shortDescriptionBn: '৫ পদের সুস্বাদু মিশ্র ডাল ২৫০ গ্রাম প্যাকেট।',
    shortDescription: 'Five-lentil healthy mixed dal blend 250g pack.',
    descriptionBn: `### পণ্য পরিচিতি
পঞ্চমেল মিশ্র ডালের সাশ্রয়ী ২৫০ গ্রাম প্যাকেট। স্বাস্থ্যকর প্রোটিন ও পুষ্টিতে ভরপুর।`,
    description: `### Product Overview
Convenient 250g pack of our five-variety mixed lentils blend.`,
  },
  {
    serial: 14,
    name: 'Moong Dal 500g',
    nameBn: 'মুগ ডাল ৫০০ গ্রাম',
    slug: 'moong-dal-500g',
    packSize: '500 g',
    unitId: UNIT_PACKET_ID,
    regularPrice: 89,
    sellingPrice: 89,
    discountPrice: null,
    brandName: 'Bazar Shodai Selection',
    imgUrl: uploadedImgs.moong_dal_bowl,
    shortDescriptionBn: 'উজ্জ্বল সোনালী পালিশ মুগ ডাল ৫০০ গ্রাম প্যাকেট।',
    shortDescription: 'Polished golden yellow split Moong Dal 500g pack.',
    descriptionBn: `### পণ্য পরিচিতি
উন্নত জাতের সোনালী মুগ ডাল। ভাজা মুগ ডাল ও খিচুড়িতে অতুলনীয় ঘ্রাণ ও স্বাদ সৃষ্টি করে।`,
    description: `### Product Overview
Fine quality golden yellow moong lentils (split mung beans) 500g pack.`,
  },
  {
    serial: 15,
    name: 'Masoor Dal (Imported) 1kg',
    nameBn: 'মসুর ডাল (আমদানিকৃত) ১ কেজি',
    slug: 'masoor-dal-imported-1kg',
    packSize: '1 kg',
    unitId: UNIT_PACKET_ID,
    regularPrice: 115,
    sellingPrice: 109,
    discountPrice: 109,
    brandName: 'Bazar Shodai Selection',
    imgUrl: uploadedImgs.masoor_dal_imported_bowl,
    shortDescriptionBn: 'আমদানিকৃত প্রিমিয়াম লাল মসুর ডাল ১ কেজি ফ্যামিলি প্যাক।',
    shortDescription: 'Imported bright red split Masoor Dal 1kg family pack.',
    descriptionBn: `### পণ্য পরিচিতি
পরিবারের প্রতিদিনের পুষ্টির চাহিদা মেটাতে ১ কেজি আমদানিকৃত মসুর ডাল। দারুণ স্বাদ ও দ্রুত সিদ্ধ হওয়ার নিশ্চয়তা।`,
    description: `### Product Overview
Imported split red lentils (Masoor Dal) 1kg value pack. Daily kitchen staple across Bangladesh.`,
  },
  {
    serial: 16,
    name: 'Masoor Dal (Deshi) 1kg',
    nameBn: 'মসুর ডাল (দেশি) ১ কেজি',
    slug: 'masoor-dal-deshi-1kg',
    packSize: '1 kg',
    unitId: UNIT_PACKET_ID,
    regularPrice: 179,
    sellingPrice: 159,
    discountPrice: 159,
    brandName: 'Bazar Shodai Premium',
    imgUrl: uploadedImgs.masoor_dal_deshi_bowl,
    shortDescriptionBn: 'খাঁটি দেশি ছোট দানার সুস্বাদু মসুর ডাল ১ কেজি প্যাক (বিশেষ অফার)।',
    shortDescription: 'Authentic local small-grain Deshi Masoor Dal 1kg pack.',
    descriptionBn: `### পণ্য পরিচিতি
ছোট দানার খাঁটি দেশি লাল মসুর ডাল। সাধারণ ডালের চেয়ে অনেক বেশি সুস্বাদু ও ঘ্রাণময়। স্বাস্থ্য সচেতন পরিবারের প্রথম পছন্দ।`,
    description: `### Product Overview
Bangladeshi indigenous Deshi Masoor Dal 1kg pack. Unmatched natural flavor and deep aroma.`,
  },
  {
    serial: 17,
    name: 'Boot Dal 500g',
    nameBn: 'বুট ডাল ৫০০ গ্রাম',
    slug: 'boot-dal-500g',
    packSize: '500 g',
    unitId: UNIT_PACKET_ID,
    regularPrice: 59,
    sellingPrice: 59,
    discountPrice: null,
    brandName: 'Bazar Shodai Selection',
    imgUrl: uploadedImgs.boot_dal_bowl,
    shortDescriptionBn: 'উজ্জ্বল গোল্ডেন বুট ডাল (ছোলার ডাল) ৫০০ গ্রাম প্যাকেট।',
    shortDescription: 'Golden split Boot Dal / Chana Dal 500g pack.',
    descriptionBn: `### পণ্য পরিচিতি
উন্নত মানের ছোলার ডাল / বুট ডাল। মাংস দিয়ে বুটের ডাল ভুনা কিংবা নারিকেল দিয়ে শাহী ছোলার ডাল রান্নায় আদর্শ।`,
    description: `### Product Overview
High-grade split Bengal gram chickpeas (Chana Dal / Boot Dal) 500g. Excellent for slow-cooked meat gravies and rich festive dishes.`,
  },
  {
    serial: 18,
    name: 'Teer Masoor Dal 1kg',
    nameBn: 'তীর মসুর ডাল ১ কেজি',
    slug: 'teer-masoor-dal-1kg',
    packSize: '1 kg',
    unitId: UNIT_PACKET_ID,
    regularPrice: 130,
    sellingPrice: 130,
    discountPrice: null,
    brandName: 'Teer',
    imgUrl: uploadedImgs.teer_masoor_dal_packet,
    shortDescriptionBn: 'তীর রিফাইন্ড লাল মসুর ডাল ১ কেজি প্রিমিয়াম প্যাকেট।',
    shortDescription: 'Teer Refined Red Split Masoor Dal 1kg pack.',
    descriptionBn: `### পণ্য পরিচিতি
সিটি গ্রুপের বিশ্বস্ত তীর ব্র্যান্ডের মসুর ডাল। সর্বাধুনিক মেশিনে বাছাইকৃত ও স্বাস্থ্যকর উপায়ে প্যাকেটজাত।`,
    description: `### Product Overview
Teer Refined Red Lentil (Masoor Dal) 1kg pack. Clean, impurity-free, and rapid-cooking.`,
  },
  {
    serial: 19,
    name: 'Masoor Dal (Imported) 500g',
    nameBn: 'মসুর ডাল (আমদানিকৃত) ৫০০ গ্রাম',
    slug: 'masoor-dal-imported-500g',
    packSize: '500 g',
    unitId: UNIT_PACKET_ID,
    regularPrice: 55,
    sellingPrice: 55,
    discountPrice: null,
    brandName: 'Bazar Shodai Selection',
    imgUrl: uploadedImgs.masoor_dal_imported_bowl,
    shortDescriptionBn: 'আমদানিকৃত লাল মসুর ডাল ৫০০ গ্রাম সুবিধাজনক প্যাকেট।',
    shortDescription: 'Imported red split Masoor Dal 500g convenient pack.',
    descriptionBn: `### পণ্য পরিচিতি
প্রতিদিনের রান্নায় ব্যবহারের জন্য সুবিধাজনক ৫০০ গ্রাম আমদানিকৃত মসুর ডাল।`,
    description: `### Product Overview
Imported red lentils (Masoor Dal) 500g pack. Standard high-yield pulse for daily home curries.`,
  },
  {
    serial: 20,
    name: 'Chola Boot (Desi Chickpeas) 1kg',
    nameBn: 'ছোলা বুট ১ কেজি',
    slug: 'chola-boot-1kg',
    packSize: '1 kg',
    unitId: UNIT_PACKET_ID,
    regularPrice: 109,
    sellingPrice: 109,
    discountPrice: null,
    brandName: 'Bazar Shodai Selection',
    imgUrl: uploadedImgs.chola_boot_bowl,
    shortDescriptionBn: 'বাছাইকৃত লালচে-বাদামি দেশি ছোলা বুট ১ কেজি প্যাকেট।',
    shortDescription: 'Selected brown Desi Chola Boot (chickpeas) 1kg pack.',
    descriptionBn: `### পণ্য পরিচিতি
রমজানের ইফতার ও সকালের পুষ্টিকর নাস্তার জন্য অপরিহার্য দেশি ছোলা বুট। সেদ্ধ কিংবা ভুনা ছোলা হিসেবে খেলে দীর্ঘস্থায়ী শক্তি পাওয়া যায়।`,
    description: `### Product Overview
Bengali brown Desi Chickpeas (Chola Boot / Kala Chana) 1kg pack. Dense in protein, low glycemic index, and essential for traditional breakfast and Iftar dishes.`,
  },
  {
    serial: 21,
    name: 'Dabli Boot (Dried Yellow Peas) 500g',
    nameBn: 'ডাবলি বুট ৫০০ গ্রাম',
    slug: 'dabli-boot-500g',
    packSize: '500 g',
    unitId: UNIT_PACKET_ID,
    regularPrice: 39,
    sellingPrice: 39,
    discountPrice: null,
    brandName: 'Bazar Shodai Selection',
    imgUrl: uploadedImgs.dabli_boot_bowl,
    shortDescriptionBn: 'চটপটি ও ঘুগনির আসল ডাবলি বুট ৫০০ গ্রাম প্যাকেট।',
    shortDescription: 'Whole dried yellow field peas (Dabli Boot) 500g pack.',
    descriptionBn: `### পণ্য পরিচিতি
চটপটি ও ঘুঘনির প্রধান উপকরণ ডাবলি বুট। পানিতে ভিজিয়ে সেদ্ধ করলে নিখুঁত নরম ও আঠালো হয়।`,
    description: `### Product Overview
Dabli Boot (whole dried yellow peas) 500g pack. The authentic base ingredient for Bangladeshi street-style Chotpoti and Ghugni.`,
  },
  {
    serial: 22,
    name: 'Peeled Chola Boot (Skinless Split) 500g',
    nameBn: 'খোসা ছাড়ানো ছোলা বুট ৫০০ গ্রাম',
    slug: 'peeled-chola-boot-500g',
    packSize: '500 g',
    unitId: UNIT_PACKET_ID,
    regularPrice: 75,
    sellingPrice: 65,
    discountPrice: 65,
    brandName: 'Bazar Shodai Selection',
    imgUrl: uploadedImgs.peeled_chola_boot_bowl,
    shortDescriptionBn: 'খোসা ছাড়ানো হলুদ ছোলা বুট ৫০০ গ্রাম প্যাকেট।',
    shortDescription: 'Dehulled skinless split Chola Boot 500g pack.',
    descriptionBn: `### পণ্য পরিচিতি
খোসা ছাড়ানো পরিষ্কার ছোলা বুট। নরম তুলতুলে ডাল ভুনা ও মিষ্টি হালুয়া তৈরিতে সময় বাঁচায় ও মসৃণ স্বাদ দেয়।`,
    description: `### Product Overview
Skinless split chickpeas (peeled chola boot) 500g pack. Saves prep time while delivering creamy texture for curries and halwa.`,
  },
  {
    serial: 23,
    name: 'Pran Masoor Dal (Deshi) 1kg',
    nameBn: 'প্রাণ মসুর ডাল (দেশি) ১ কেজি',
    slug: 'pran-masoor-dal-deshi-1kg',
    packSize: '1 kg',
    unitId: UNIT_PACKET_ID,
    regularPrice: 185,
    sellingPrice: 185,
    discountPrice: null,
    brandName: 'PRAN',
    imgUrl: uploadedImgs.pran_masoor_dal_deshi_packet,
    shortDescriptionBn: 'প্রাণ প্রিমিয়াম খাঁটি দেশি মসুর ডাল ১ কেজি ফ্যামিলি প্যাক।',
    shortDescription: 'PRAN authentic local Deshi Masoor Dal 1kg family pack.',
    descriptionBn: `### পণ্য পরিচিতি
খাঁটি দেশি ছোট দানার সুস্বাদু প্রাণ মসুর ডাল ১ কেজি পারিবারিক প্যাক। সেরা স্বাদ ও পুষ্টির মেলবন্ধন।`,
    description: `### Product Overview
PRAN Deshi Masoor Dal 1kg family pack. Pure Bangladeshi indigenous red lentils with rich taste and aroma.`,
  },
  {
    serial: 24,
    name: 'Moong Dal 250g',
    nameBn: 'মুগ ডাল ২৫০ গ্রাম',
    slug: 'moong-dal-250g',
    packSize: '250 g',
    unitId: UNIT_PACKET_ID,
    regularPrice: 45,
    sellingPrice: 45,
    discountPrice: null,
    brandName: 'Bazar Shodai Selection',
    imgUrl: uploadedImgs.moong_dal_bowl,
    shortDescriptionBn: 'সোনালী মুগ ডাল ২৫০ গ্রাম মিনি প্যাক।',
    shortDescription: 'Golden yellow Moong Dal 250g mini pack.',
    descriptionBn: `### পণ্য পরিচিতি
ছোট পরিবারের জন্য সাশ্রয়ী ২৫০ গ্রাম সোনালী মুগ ডাল।`,
    description: `### Product Overview
Golden yellow split moong dal 250g mini pack.`,
  },
  {
    serial: 25,
    name: 'Khesari Dal 500g',
    nameBn: 'খেসারি ডাল ৫০০ গ্রাম',
    slug: 'khesari-dal-500g',
    packSize: '500 g',
    unitId: UNIT_PACKET_ID,
    regularPrice: 65,
    sellingPrice: 59,
    discountPrice: 59,
    brandName: 'Bazar Shodai Premium',
    imgUrl: uploadedImgs.khesari_dal_bowl,
    shortDescriptionBn: 'মচমচে পেঁয়াজু তৈরির আসল খেসারি ডাল ৫০০ গ্রাম প্যাকেট।',
    shortDescription: 'Authentic crunchy piyaju Khesari Dal (grass pea pulse) 500g pack.',
    descriptionBn: `### পণ্য পরিচিতি
ঐতিহ্যবাহী খেসারি ডাল। মচমচে গরম গরম পেঁয়াজু ও ডাল বড়া তৈরির জন্য খেসারি ডালের কোনো বিকল্প নেই। এর বিশেষ টেক্সচার বড়াকে ভেতর থেকে নরম ও বাইরে থেকে অতিরিক্ত মুচমুচে করে তোলে।

### ব্যবহার ও টিপস
- পেঁয়াজু তৈরির জন্য ডাল আধা-বাটা করে পেঁয়াজ, কাঁচামরিচ ও ধনেপাতার সাথে মাখিয়ে ভাজুন।
- সংরক্ষণ: আলো-বাতাসহীন শুকনো পাত্রে রাখুন।`,
    description: `### Product Overview
Traditional Khesari Dal (grass pea lentils / Lathyrus sativus) 500g pack. The irreplaceable secret behind delightfully crunchy Bengali piyaju and vegetable pakoras.`,
  },
];

async function main() {
  console.log(`--- Seeding ${PRODUCTS.length} Dal & Pulses Products into PostgreSQL ---`);

  // Verify category exists
  const category = await prisma.category.findUnique({
    where: { id: CATEGORY_ID },
  });
  if (!category) {
    throw new Error(`Category ${CATEGORY_ID} (${CATEGORY_NAME}) does not exist!`);
  }
  console.log(`Target Category: ${category.name} (${category.nameBn}) [${category.slug}]`);

  for (const item of PRODUCTS) {
    const code = `DAL-${String(item.serial).padStart(2, '0')}`;
    const buyingPrice = Number((item.sellingPrice * 0.84).toFixed(2));
    const profitMargin = Number(((item.sellingPrice - buyingPrice) / item.sellingPrice * 100).toFixed(2));
    const isDiscounted = item.discountPrice !== null && item.discountPrice < item.regularPrice;

    console.log(`[${item.serial}/${PRODUCTS.length}] Seeding ${item.name} (${code})...`);

    // Upsert product
    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        productCode: code,
        name: item.name,
        nameBn: item.nameBn,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        unitId: item.unitId,
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
        description: item.description,
        descriptionBn: item.descriptionBn,
        isFeatured: item.serial <= 8,
        isNew: true,
        isHot: item.serial === 2 || item.serial === 4 || item.serial === 6 || item.serial === 16,
      },
      create: {
        productCode: code,
        name: item.name,
        nameBn: item.nameBn,
        slug: item.slug,
        categoryId: CATEGORY_ID,
        categoryName: CATEGORY_NAME,
        unitId: item.unitId,
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
        description: item.description,
        descriptionBn: item.descriptionBn,
        isFeatured: item.serial <= 8,
        isNew: true,
        isHot: item.serial === 2 || item.serial === 4 || item.serial === 6 || item.serial === 16,
      },
    });

    // Handle Product Image
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

  console.log(`\nAll ${PRODUCTS.length} Dal products successfully seeded and linked with images!`);
}

main()
  .catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

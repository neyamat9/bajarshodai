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

const brandImgs = JSON.parse(fs.readFileSync(path.join(__dirname, 'brand_rice_images.json'), 'utf8'));
const customImgs = JSON.parse(fs.readFileSync(path.join(__dirname, 'custom_rice_images.json'), 'utf8'));

const CATEGORY_ID = '52012c42-5df8-4cb3-a72f-538c20ce382a'; // Rice (চাল)
const UNIT_ID = '3f8fe6cd-96eb-49c2-8ece-ba277c5608f5'; // kg

const PRODUCTS = [
  {
    serial: 1,
    name: 'Miniket Rice Premium (Parboiled) 5kg',
    nameBn: 'মিনিকেট চাল প্রিমিয়াম (সিদ্ধ) ± ৫০ গ্রাম ৫ কেজি',
    slug: 'miniket-rice-premium-parboiled-5kg',
    packSize: '5 kg',
    regularPrice: 439,
    sellingPrice: 439,
    discountPrice: null,
    brandName: 'Bazar Shodai Select',
    imgUrl: customImgs.bowl_miniket_premium.r2Url,
    shortDescriptionBn: 'প্রিমিয়াম গ্রেড চিকন, ঝরঝরে ও সুস্বাদু সিদ্ধ মিনিকেট চাল।',
    shortDescription: 'Premium slender, long-grain, non-sticky parboiled Miniket rice.',
    descriptionBn: `### পণ্য পরিচিতি
আমাদের প্রিমিয়াম মিনিকেট চাল বাছাইকৃত উন্নতমানের ধান থেকে স্বয়ংক্রিয় মিলে আধুনিক পদ্ধতিতে প্রস্তুত ও পলিশ করা। প্রতিটি চালের দানা লম্বা, চিকন এবং ধবধবে পরিষ্কার। রান্নার পর ভাত চমৎকার ঝরঝরে ও সুস্বাদু হয়।

### বৈশিষ্ট্য ও রান্নার তথ্য
- **চালের ধরণ:** চিকন লম্বা দানার সিদ্ধ চাল (Parboiled)।
- **সেরা ব্যবহার:** প্রতিদিনের দুপুরের ও রাতের খাবারের সেরা পছন্দ।
- **রান্নার অনুপাত:** ১ কাপ চালে ২ কাপ পানি। ভাত সহজে গলে যায় না ও দীর্ঘক্ষণ নরম থাকে।
- **পুষ্টিগুণ:** সহজে হজমযোগ্য কার্বোহাইড্রেট, ফাইবার ও প্রয়োজনীয় খনিজ উপাদানে সমৃদ্ধ।
- **সংরক্ষণ পদ্ধতি:** শুষ্ক, ঠান্ডা ও বায়ুরোধী পাত্রে সংরক্ষণ করুন যাতে আর্দ্রতা ও পোকার উপদ্রব না হয়।`,
    description: `### Product Overview
Our Premium Miniket Rice is processed from top-grade harvested paddy using state-of-the-art automated milling and cleaning. Features slender, clean, uniform grains that cook up delightfully fluffy and non-sticky.

### Culinary Profile & Cooking Guide
- **Grain Type:** Slender long-grain parboiled rice.
- **Best For:** Everyday family meals, steamed bhat with curries and lentils.
- **Cooking Ratio:** 1 cup rice to 2 cups water. Remains firm, separate, and soft.
- **Nutrition:** High quality energy, easy digestibility, and dietary essential carbs.
- **Storage Instructions:** Store in a cool, dry, airtight container protected from humidity.`,
  },
  {
    serial: 2,
    name: 'Chashi Aromatic Chinigura Rice 1kg',
    nameBn: 'চাষী সুগন্ধি চিনিগুঁড়া চাল ১ কেজি',
    slug: 'chashi-aromatic-chinigura-rice-1kg',
    packSize: '1 kg',
    regularPrice: 190,
    sellingPrice: 190,
    discountPrice: null,
    brandName: 'Chashi',
    imgUrl: brandImgs.chashi_chinigura_1kg.r2Url,
    shortDescriptionBn: 'উৎকৃষ্ট সুবাস ও স্বাদের অরিজিনাল চাষী সুগন্ধি চিনিগুঁড়া চাল।',
    shortDescription: 'Original authentic fragrant Chashi Aromatic Chinigura Rice 1kg pack.',
    descriptionBn: `### পণ্য পরিচিতি
স্কয়ার ফুড অ্যান্ড বেভারেজের চাষী সুগন্ধি চিনিগুঁড়া চাল বাংলাদেশের সবচেয়ে জনপ্রিয় ও বিশ্বস্ত পোলাওয়ের চাল। উত্তরবঙ্গের উর্বর মাটির বাছাইকৃত ধান থেকে আধুনিক ভ্যাকুয়াম প্যাকে প্রস্তুত, যা প্রাকৃতিক সুবাস অক্ষুণ্ণ রাখে।

### বৈশিষ্ট্য ও রান্নার তথ্য
- **চালের ধরণ:** ছোট দানার খাঁটি সুগন্ধি আতপ চাল (Aromatic Chinigura)।
- **সেরা ব্যবহার:** শাহী পোলাও, বিরিয়ানি, তেহারি, খিচুড়ি, ক্ষীর, ফিরনি ও পায়েস।
- **রান্নার অনুপাত:** ১ কাপ চালে ১.৭৫ কাপ গরম পানি। রান্নার আগে ২০ মিনিট ভিজিয়ে রাখলে দ্বিগুণ ঝরঝরে হয়।
- **সুবাস:** রান্নার সাথে সাথেই ছড়িয়ে পড়ে মনমাতানো প্রাকৃতিক দেশি সুবাস।
- **সংরক্ষণ পদ্ধতি:** ব্যবহারের পর প্যাকেটের মুখ ভালোভাবে বন্ধ রাখুন।`,
    description: `### Product Overview
Square Food & Beverage Ltd.'s Chashi Aromatic Chinigura Rice is Bangladesh's premier aromatic rice. Specially harvested from fertile northern regions, thoroughly cleaned and vacuum-packed to preserve natural scent and purity.

### Culinary Profile & Cooking Guide
- **Grain Type:** Small aromatic non-parboiled white grain (Chinigura).
- **Best For:** Shahi Polao, Mutton/Chicken Biryani, Tehari, Khichuri, Payesh, and Firni.
- **Cooking Ratio:** 1 cup rice to 1.75 cups hot water. Soak for 20 minutes before cooking.
- **Aroma:** Naturally rich, sweet, traditional Bangladeshi festive fragrance.
- **Storage Instructions:** Keep sealed in an airtight container away from strong spices.`,
  },
  {
    serial: 3,
    name: 'Atash Rice BR-28 (Parboiled) 5kg',
    nameBn: 'আঠাশ চাল (সিদ্ধ) ± ৫০ গ্রাম ৫ কেজি',
    slug: 'atash-rice-parboiled-5kg',
    packSize: '5 kg',
    regularPrice: 375,
    sellingPrice: 329,
    discountPrice: 329,
    brandName: 'Bazar Shodai Select',
    imgUrl: customImgs.bowl_atash_siddha.r2Url,
    shortDescriptionBn: 'সাশ্রয়ী মূল্যে পুষ্টিকর ও পেটভরা তৃপ্তিদায়ক সিদ্ধ আঠাশ (বিআর-২৮) চাল।',
    shortDescription: 'Wholesome, nutritious, everyday staple BR-28 Atash parboiled rice 5kg.',
    descriptionBn: `### পণ্য পরিচিতি
বাংলাদেশের মধ্যবিত্ত ও সাধারণ পরিবারের প্রথম পছন্দ পুষ্টিকর বিআর-২৮ আঠাশ চাল। উন্নতমানের ধান থেকে সিদ্ধ করে শুকানো এই চালের ভাত নরম, সুস্বাদু এবং দীর্ঘক্ষণ পেট ভরা রাখে।

### বৈশিষ্ট্য ও রান্নার তথ্য
- **চালের ধরণ:** মাঝারি দানার সিদ্ধ চাল (BR-28 Parboiled Atash)।
- **সেরা ব্যবহার:** পরিবারের দৈনন্দিন নিয়মিত ভাত, ভুনা খিচুড়ি।
- **রান্নার অনুপাত:** ১ কাপ চালে ২ কাপ পানি।
- **পুষ্টিগুণ:** সিদ্ধ প্রক্রিয়ার কারণে চালের ভেতরের প্রাকৃতিক ভিটামিন ও খনিজ বজায় থাকে।
- **সংরক্ষণ পদ্ধতি:** আর্দ্রতামুক্ত ও বাতাস চলাচলযুক্ত স্থানে রাখুন।`,
    description: `### Product Overview
BR-28 Atash rice is Bangladesh's staple everyday family favorite. Properly parboiled to retain vital grain nutrients, producing soft, satisfying, and wholesome cooked rice.

### Culinary Profile & Cooking Guide
- **Grain Type:** Medium-grain parboiled rice (BR-28 variety).
- **Best For:** Daily breakfast, lunch, dinner, and traditional Bengali bhuna khichuri.
- **Cooking Ratio:** 1 cup rice to 2 cups boiling water.
- **Nutrition:** High complex carbohydrates and natural B-vitamins locked in by parboiling.
- **Storage Instructions:** Store in a dry, ventilated, airtight grain container.`,
  },
  {
    serial: 4,
    name: 'ACI Pure Nazirshail Rice 5kg',
    nameBn: 'এ সি আই পিওর নাজিরশাইল চাল ৫ কেজি',
    slug: 'aci-pure-nazirshail-rice-5kg',
    packSize: '5 kg',
    regularPrice: 495,
    sellingPrice: 495,
    discountPrice: null,
    brandName: 'ACI Pure',
    imgUrl: brandImgs.aci_pure_nazirshail_5kg.r2Url,
    shortDescriptionBn: '১০০% খাঁটি ও পরিষ্কার এসিআই পিওর প্রিমিয়াম নাজিরশাইল চাল।',
    shortDescription: '100% pure, hygienically packed ACI Pure Premium Nazirshail Rice 5kg.',
    descriptionBn: `### পণ্য পরিচিতি
এসিআই পিওর প্রিমিয়াম নাজিরশাইল চাল বাংলাদেশের ঐতিহ্যবাহী চিকন নাজিরশাইল ধানের বাছাইকৃত ফসল। সম্পূর্ণ স্বয়ংক্রিয় ও জীবাণুমুক্ত কারখানায় বাছাই ও প্যাকেটজাত করা হয়, ফলে চালে কোনো ধুলাবালি বা পাথর থাকে না।

### বৈশিষ্ট্য ও রান্নার তথ্য
- **চালের ধরণ:** চিকন লম্বা দানার আধা-সিদ্ধ নাজিরশাইল (Adha Siddha)।
- **সেরা ব্যবহার:** রুচিশীল প্রতিদিনের খাবার, অতিথি আপ্যায়ন ও বিশেষ ভোজ।
- **রান্নার অনুপাত:** ১ কাপ চালে ২ কাপ পানি। ভাত ঝরঝরে ও দেখতে আকর্ষণীয় হয়।
- **সংরক্ষণ পদ্ধতি:** শুষ্ক স্থানে মুখবন্ধ কৌটায় রাখুন।`,
    description: `### Product Overview
ACI Pure Premium Nazirshail Rice is processed from genuine premium Nazirshail paddy in fully automated, hygienic milling plants. 100% free from dust, husk, or stones.

### Culinary Profile & Cooking Guide
- **Grain Type:** Slender, pointed half-parboiled long grain.
- **Best For:** Gourmet everyday meals, guests, and traditional family banquets.
- **Cooking Ratio:** 1 cup rice to 2 cups water. Yields separate, non-sticky rice.
- **Storage Instructions:** Keep in a dry, cool pantry in an airtight container.`,
  },
  {
    serial: 5,
    name: 'Paijam Rice (Parboiled) 25kg Sack',
    nameBn: 'পাইজাম চাল (সিদ্ধ) ± ২০০ গ্রাম ২৫ কেজি বস্তা',
    slug: 'paijam-rice-parboiled-25kg-sack',
    packSize: '25 kg',
    regularPrice: 1680,
    sellingPrice: 1639,
    discountPrice: 1639,
    brandName: 'Bazar Shodai Select',
    imgUrl: customImgs.bosta_paijam_25kg.r2Url,
    shortDescriptionBn: 'সাশ্রয়ী পারিবারিক ২৫ কেজি পাইজাম চালের বস্তা, ঝরঝরে ও সুস্বাদু।',
    shortDescription: 'Economical bulk 25kg jute sack of parboiled Paijam rice for families.',
    descriptionBn: `### পণ্য পরিচিতি
বড় পরিবার ও মাসিক বাজারের জন্য আদর্শ ২৫ কেজি পাইজাম চালের বস্তা। আমাদের নিজস্ব মিল থেকে সরাসরি বাছাইকৃত এই চাল রান্নার পর সুন্দর ঝরঝরে হয় এবং স্বাদে অতুলনীয়।

### বৈশিষ্ট্য ও রান্নার তথ্য
- **চালের ধরণ:** সিদ্ধ পাইজাম চাল (Parboiled Paijam)।
- **প্যাকিং:** পরিবেশবান্ধব ও মজবুত পাটের বস্তা (Jute Chalar Bosta)।
- **সেরা ব্যবহার:** পরিবারের পুরো মাসের দৈনন্দিন খাবার, মেস ও ক্যাটারিং।
- **রান্নার অনুপাত:** ১ কাপ চালে ২ কাপ পানি।
- **সংরক্ষণ পদ্ধতি:** মেঝের ওপর কাঠের তক্তা দিয়ে শুষ্ক স্থানে বস্তা রাখুন।`,
    description: `### Product Overview
The 25kg Paijam Rice Sack (Chalar Bosta) is the ideal monthly grocery choice for large families and catering. Milled to perfection, yielding fluffy, delicious, non-mushy cooked rice.

### Culinary Profile & Cooking Guide
- **Grain Type:** Medium-grain parboiled Paijam rice.
- **Packaging:** Authentic eco-friendly heavy-duty woven jute sack (Bosta).
- **Best For:** Monthly household pantry staple, community kitchens, catering.
- **Cooking Ratio:** 1 cup rice to 2 cups water.
- **Storage Instructions:** Store elevated off concrete floors in a dry, well-ventilated area.`,
  },
  {
    serial: 6,
    name: 'Rupchanda Chinigura Premium Aromatic Rice 1kg',
    nameBn: 'রূপচাঁদা চিনিগুঁড়া প্রিমিয়াম সুগন্ধি চাল ১ কেজি',
    slug: 'rupchanda-chinigura-premium-aromatic-rice-1kg',
    packSize: '1 kg',
    regularPrice: 175,
    sellingPrice: 175,
    discountPrice: null,
    brandName: 'Rupchanda',
    imgUrl: brandImgs.rupchanda_chinigura_1kg.r2Url,
    shortDescriptionBn: 'দিনাজপুরের বিখ্যাত সুবাসিত রূপচাঁদা চিনিগুঁড়া পোলাওয়ের চাল।',
    shortDescription: 'Finest Dinajpur aromatic Rupchanda Chinigura Rice 1kg pack.',
    descriptionBn: `### পণ্য পরিচিতি
বাংলাদেশ এডিবল অয়েল লিমিটেডের (BEOL) রূপচাঁদা প্রিমিয়াম সুগন্ধি চিনিগুঁড়া চাল দিনাজপুরের ঐতিহ্যবাহী সুগন্ধি ধান থেকে সংগৃহীত। প্রতিটি দানা ধবধবে সাদা ও খাঁটি সুবাসে ভরপুর।

### বৈশিষ্ট্য ও রান্নার তথ্য
- **চালের ধরণ:** প্রিমিয়াম গ্রেড ছোট দানার সুগন্ধি আতপ চাল।
- **সেরা ব্যবহার:** বিয়ে বাড়ি স্টাইল কাচ্চি বিরিয়ানি, মোরগ পোলাও, ফিরনি ও ক্ষীর।
- **রান্নার অনুপাত:** ১ কাপ চালে ১.৭৫ কাপ পানি বা দুধ।
- **সংরক্ষণ পদ্ধতি:** বায়ুরোধী বয়ামে রাখুন।`,
    description: `### Product Overview
Rupchanda Premium Chinigura Aromatic Rice from BEOL is sourced from the famous fragrant rice fields of Dinajpur. Carefully sorted and packed to deliver an unmatched culinary aroma.

### Culinary Profile & Cooking Guide
- **Grain Type:** Premium small aromatic white grain.
- **Best For:** Royal Kacchi Biryani, Morog Polao, traditional Firni, and Payesh.
- **Cooking Ratio:** 1 cup rice to 1.75 cups hot liquid.
- **Storage Instructions:** Store in an airtight container protected from heat and moisture.`,
  },
  {
    serial: 7,
    name: 'Nazirshail Rice Premium (Half Parboiled) 5kg',
    nameBn: 'নাজিরশাইল চাল প্রিমিয়াম (আধা সিদ্ধ) ± ৫০ গ্রাম ৫ কেজি',
    slug: 'nazirshail-rice-premium-half-parboiled-5kg',
    packSize: '5 kg',
    regularPrice: 475,
    sellingPrice: 449,
    discountPrice: 449,
    brandName: 'Bazar Shodai Select',
    imgUrl: customImgs.bowl_nazirshail_adhasiddha.r2Url,
    shortDescriptionBn: 'চিকন সুস্বাদু আধা-সিদ্ধ প্রিমিয়াম নাজিরশাইল চাল ৫ কেজি।',
    shortDescription: 'Premium slender half-parboiled (adha siddha) Nazirshail rice 5kg.',
    descriptionBn: `### পণ্য পরিচিতি
বাছাইকৃত খাঁটি নাজিরশাইল ধানের প্রিমিয়াম আধা-সিদ্ধ চাল। সাধারণ চালের চেয়ে চিকন ও রান্নায় লম্বাটে হয়। এই চালের ভাত দেখতে যেমন সুন্দর, খেতেও তেমনি অত্যন্ত সুস্বাদু।

### বৈশিষ্ট্য ও রান্নার তথ্য
- **চালের ধরণ:** আধা-সিদ্ধ চিকন নাজিরশাইল (Adha Siddha Premium)।
- **সেরা ব্যবহার:** দৈনন্দিন দুপুরের খাবার ও রুচিশীল পরিবারের পছন্দ।
- **রান্নার অনুপাত:** ১ কাপ চালে ২ কাপ পানি।
- **সংরক্ষণ পদ্ধতি:** শুষ্ক ও শীতল স্থানে রাখুন।`,
    description: `### Product Overview
Selected high-grade half-parboiled (adha siddha) Nazirshail rice. Slender, delicate, and elongates nicely upon cooking without turning sticky or soggy.

### Culinary Profile & Cooking Guide
- **Grain Type:** Half-parboiled slender pointed grain.
- **Best For:** Daily gourmet Bengali dining with fresh fish, meat, and dal.
- **Cooking Ratio:** 1 cup rice to 2 cups boiling water.
- **Storage Instructions:** Store in a sealed container in a moisture-free area.`,
  },
  {
    serial: 8,
    name: 'Fortune Biryani Special Basmati Rice 1kg',
    nameBn: 'ফরচুন বিরিয়ানি স্পেশাল বাসমতি চাল ১ কেজি',
    slug: 'fortune-biryani-special-basmati-rice-1kg',
    packSize: '1 kg',
    regularPrice: 400,
    sellingPrice: 400,
    discountPrice: null,
    brandName: 'Fortune',
    imgUrl: brandImgs.fortune_biryani_basmati_1kg.r2Url,
    shortDescriptionBn: 'রয়েল বিরিয়ানির জন্য অতিরিক্ত লম্বা দানার ফরচুন স্পেশাল বাসমতি চাল।',
    shortDescription: 'Extra-long grain aged Fortune Biryani Special Basmati Rice 1kg.',
    descriptionBn: `### পণ্য পরিচিতি
ফরচুন বিরিয়ানি স্পেশাল বাসমতি চাল বিশেষভাবে শাহী বিরিয়ানি ও স্পেশাল পোলাও রান্নার জন্য তৈরি। রান্নার পর এর প্রতিটি চালের দানা সাধারণের চেয়ে দ্বিগুণ লম্বা হয় এবং সম্পূর্ণ ঝরঝরে থাকে।

### বৈশিষ্ট্য ও রান্নার তথ্য
- **চালের ধরণ:** অতিরিক্ত লম্বা দানার পরিপক্ক বাসমতি চাল (Aged Extra Long Basmati)।
- **সেরা ব্যবহার:** দম বিরিয়ানি, মাটন কাচ্চি, চিকেন বিরিয়ানি ও কাশ্মীরি পোলাও।
- **রান্নার নিয়ম:** রান্নার ৩০ মিনিট আগে ঠান্ডা পানিতে ভিজিয়ে রাখুন।
- **রান্নার অনুপাত:** ১ কাপ চালে ১.৫ কাপ পানি।`,
    description: `### Product Overview
Fortune Biryani Special Basmati Rice is naturally aged to elongate up to twice its original length upon cooking. Non-sticky, fluffy, and delivers restaurant-quality biryani results at home.

### Culinary Profile & Cooking Guide
- **Grain Type:** Extra-long aged grain Basmati.
- **Best For:** Dum Biryani, Hyderabadi Biryani, Kashmiri Pulao, and festive dishes.
- **Cooking Ratio:** 1 cup rice to 1.5 cups water. Soak 30 minutes before cooking.
- **Storage Instructions:** Store in a dry, cool place in an airtight container.`,
  },
  {
    serial: 9,
    name: 'Chashi Aromatic Chinigura Rice 2kg',
    nameBn: 'চাষী সুগন্ধি চিনিগুঁড়া চাল ২ কেজি',
    slug: 'chashi-aromatic-chinigura-rice-2kg',
    packSize: '2 kg',
    regularPrice: 370,
    sellingPrice: 370,
    discountPrice: null,
    brandName: 'Chashi',
    imgUrl: brandImgs.chashi_chinigura_2kg.r2Url,
    shortDescriptionBn: 'পারিবারিক রান্নার জন্য সাশ্রয়ী ২ কেজি চাষী সুগন্ধি চিনিগুঁড়া প্যাক।',
    shortDescription: 'Convenient 2kg family pack of Chashi Aromatic Chinigura Rice.',
    descriptionBn: `### পণ্য পরিচিতি
স্কয়ার ফুড অ্যান্ড বেভারেজের চাষী সুগন্ধি চিনিগুঁড়া চালের ২ কেজি ফ্যামিলি প্যাক। পরিবারের যেকোনো অনুষ্ঠান, উৎসব কিংবা মেহমানদারির জন্য উপযুক্ত সাশ্রয়ী প্যাক।

### বৈশিষ্ট্য ও রান্নার তথ্য
- **চালের ধরণ:** প্রাকৃতিক সুবাসিত ছোট দানার চিনিগুঁড়া চাল।
- **সেরা ব্যবহার:** পোলাও, বিরিয়ানি, জর্দা, পায়েস ও খির।
- **রান্নার অনুপাত:** ১ কাপ চালে ১.৭৫ কাপ পানি।`,
    description: `### Product Overview
The 2kg family pack of Chashi Aromatic Chinigura Rice by Square Food & Beverage Ltd. Perfect for weekend feasts, festival gatherings, and dessert preparations.

### Culinary Profile & Cooking Guide
- **Grain Type:** Small aromatic Chinigura white rice.
- **Best For:** Family celebrations, Morog Polao, Zarda, Payesh.
- **Cooking Ratio:** 1 cup rice to 1.75 cups hot water.`,
  },
  {
    serial: 10,
    name: 'Amon Seasonal Rice 1kg',
    nameBn: 'আমন চাল ১ কেজি',
    slug: 'amon-seasonal-rice-1kg',
    packSize: '1 kg',
    regularPrice: 85,
    sellingPrice: 79,
    discountPrice: 79,
    brandName: 'Bazar Shodai Select',
    imgUrl: customImgs.bowl_atash_siddha.r2Url,
    shortDescriptionBn: 'বাংলার ঐতিহ্যবাহী মৌসুমী নতুন আমন ধানের সুস্বাদু চাল।',
    shortDescription: 'Traditional seasonal fresh harvested Amon rice 1kg.',
    descriptionBn: `### পণ্য পরিচিতি
গ্রাম বাংলার ঐতিহ্যবাহী আমন মৌসুমের তাজা ধান থেকে তৈরি চাল। এর প্রাকৃতিক মিষ্ট স্বাদ এবং অনন্য নরম টেক্সচার আবহমান বাংলার ভোজনরসিকদের প্রথম পছন্দ।

### বৈশিষ্ট্য ও রান্নার তথ্য
- **চালের ধরণ:** মৌসুমী আমন চাল (Amon Seasonal Rice)।
- **সেরা ব্যবহার:** শীতের পিঠা-পুলি, গরম ভাত, ভর্তা-ভাত ও খিচুড়ি।
- **রান্নার অনুপাত:** ১ কাপ চালে ২ কাপ পানি।`,
    description: `### Product Overview
Harvested during the traditional Bengali Amon season, this rice offers a distinctive rustic taste and naturally tender texture cherished in rural and urban households alike.

### Culinary Profile & Cooking Guide
- **Grain Type:** Traditional seasonal Amon grain.
- **Best For:** Steamed bhat with bhortas, seasonal winter pitha, and rustic khichuri.
- **Cooking Ratio:** 1 cup rice to 2 cups water.`,
  },
  {
    serial: 11,
    name: 'ACI Pure Premium Miniket Rice 5kg',
    nameBn: 'এ সি আই পিওর প্রিমিয়াম মিনিকেট চাল ৫ কেজি',
    slug: 'aci-pure-premium-miniket-rice-5kg',
    packSize: '5 kg',
    regularPrice: 480,
    sellingPrice: 480,
    discountPrice: null,
    brandName: 'ACI Pure',
    imgUrl: brandImgs.aci_pure_miniket_5kg.r2Url,
    shortDescriptionBn: 'সিল্কি মসৃণ ও ধবধবে পরিষ্কার এসিআই পিওর প্রিমিয়াম মিনিকেট ৫ কেজি।',
    shortDescription: 'Hygienically sorted silky smooth ACI Pure Premium Miniket Rice 5kg.',
    descriptionBn: `### পণ্য পরিচিতি
এসিআই পিওর প্রিমিয়াম মিনিকেট চাল সম্পূর্ণ আধুনিক অপটিক্যাল সর্টার প্রযুক্তিতে বাছাই করা। চালের প্রতিটি দানা শতভাগ পরিষ্কার, চিকন ও চকচকে।

### বৈশিষ্ট্য ও রান্নার তথ্য
- **চালের ধরণ:** প্রিমিয়াম চিকন সিদ্ধ মিনিকেট।
- **সেরা ব্যবহার:** প্রতিদিনের ঝরঝরে ভাতের জন্য সেরা পছন্দ।
- **রান্নার অনুপাত:** ১ কাপ চালে ২ কাপ পানি।`,
    description: `### Product Overview
ACI Pure Premium Miniket Rice uses modern optical color sorting to ensure 100% spotless, silky, slender white grains that cook up light and separate.

### Culinary Profile & Cooking Guide
- **Grain Type:** Premium parboiled Miniket.
- **Best For:** Premium everyday family meals.
- **Cooking Ratio:** 1 cup rice to 2 cups water.`,
  },
  {
    serial: 12,
    name: 'Atash Rice (Parboiled) 25kg Sack',
    nameBn: 'আঠাশ চাল (সিদ্ধ) ± ২০০ গ্রাম ২৫ কেজি বস্তা',
    slug: 'atash-rice-parboiled-25kg-sack',
    packSize: '25 kg',
    regularPrice: 1750,
    sellingPrice: 1599,
    discountPrice: 1599,
    brandName: 'Bazar Shodai Select',
    imgUrl: customImgs.bosta_atash_25kg.r2Url,
    shortDescriptionBn: 'সাশ্রয়ী পারিবারিক ২৫ কেজি আঠাশ চালের বস্তা, পুষ্টিকর ও পেটভরা।',
    shortDescription: 'Value-for-money 25kg wholesale burlap sack of parboiled Atash rice.',
    descriptionBn: `### পণ্য পরিচিতি
পুরো মাসের পারিবারিক খাবারের জন্য অত্যন্ত সাশ্রয়ী ও পুষ্টিকর ২৫ কেজি বিআর-২৮ আঠাশ চালের বস্তা। আমাদের সরাসরি মিল থেকে সংগৃহীত।

### বৈশিষ্ট্য ও রান্নার তথ্য
- **চালের ধরণ:** সিদ্ধ আঠাশ চাল (BR-28 Parboiled)।
- **প্যাকিং:** মজবুত পাটের বস্তা (Jute Chalar Bosta)।
- **সেরা ব্যবহার:** পারিবারিক মাসিক বাজেট সাশ্রয়ী বাজার।`,
    description: `### Product Overview
The 25kg Atash Rice Burlap Sack provides the most economical, nourishing staple for household monthly grocery reserves.

### Culinary Profile & Cooking Guide
- **Grain Type:** Parboiled BR-28 Atash rice.
- **Packaging:** Heavy woven jute rice sack (Bosta).
- **Best For:** Monthly household staple reserve.`,
  },
  {
    serial: 13,
    name: 'PRAN Chinigura Aromatic Rice 1kg',
    nameBn: 'প্রাণ চিনিগুঁড়া সুগন্ধি চাল ১ কেজি',
    slug: 'pran-chinigura-aromatic-rice-1kg',
    packSize: '1 kg',
    regularPrice: 190,
    sellingPrice: 190,
    discountPrice: null,
    brandName: 'PRAN',
    imgUrl: brandImgs.pran_chinigura_1kg.r2Url,
    shortDescriptionBn: 'মনমাতানো সুবাসিত প্রিমিয়াম প্রাণ চিনিগুঁড়া সুগন্ধি চাল ১ কেজি।',
    shortDescription: 'Aromatic, fine-grain PRAN Chinigura Aromatic Rice 1kg packet.',
    descriptionBn: `### পণ্য পরিচিতি
প্রাণ ফুডসের খাঁটি চিনিগুঁড়া সুগন্ধি চাল। ভ্যাকুয়াম সিল্ড প্যাকেজিংয়ে প্রাকৃতিক সুবাস ও মিষ্ট স্বাদ অক্ষুণ্ণ রাখা হয়।

### বৈশিষ্ট্য ও রান্নার তথ্য
- **চালের ধরণ:** ছোট দানার সুগন্ধি আতপ চাল।
- **সেরা ব্যবহার:** পোলাও, বিরিয়ানি, ফিরনি, পায়েস।
- **রান্নার অনুপাত:** ১ কাপ চালে ১.৭৫ কাপ পানি।`,
    description: `### Product Overview
PRAN Chinigura Aromatic Rice is packaged in airtight, vacuum-sealed bags to retain natural field freshness and enchanting fragrance.

### Culinary Profile & Cooking Guide
- **Grain Type:** Small grain aromatic white rice.
- **Best For:** Traditional Bengali polao, kheer, firni, festive banquets.
- **Cooking Ratio:** 1 cup rice to 1.75 cups hot water.`,
  },
  {
    serial: 14,
    name: 'Kataribhog Rice 1kg',
    nameBn: 'কাটারিভোগ চাল ১ কেজি',
    slug: 'kataribhog-rice-1kg',
    packSize: '1 kg',
    regularPrice: 129,
    sellingPrice: 129,
    discountPrice: null,
    brandName: 'Bazar Shodai Select',
    imgUrl: customImgs.bowl_chinigura_aromatic.r2Url,
    shortDescriptionBn: 'দিনাজপুরের বিখ্যাত ঐতিহ্যবাহী সুস্বাদু কাটারিভোগ চাল।',
    shortDescription: 'Heritage fragrant Kataribhog rice from Dinajpur 1kg.',
    descriptionBn: `### পণ্য পরিচিতি
দিনাজপুরের ঐতিহ্যবাহী ও ভৌগোলিক নির্দেশক (GI) সমতুল্য সুপরিচিত কাটারিভোগ চাল। চালের অগ্রভাগ সুঁচালো এবং রান্নার পর হালকা সুবাস ছড়ায়।

### বৈশিষ্ট্য ও রান্নার তথ্য
- **চালের ধরণ:** সুঁচালো চিকন আতপ চাল (Kataribhog)।
- **সেরা ব্যবহার:** স্পেশাল ভুনা খিচুড়ি, পোলাও ও উৎসবের ভাত।`,
    description: `### Product Overview
Renowned heritage rice of Dinajpur, Kataribhog is celebrated for its pointed slender tips, delicate aroma, and tender cooking texture.

### Culinary Profile & Cooking Guide
- **Grain Type:** Pointed slender aromatic grain.
- **Best For:** Special celebratory meals, bhuna khichuri, and polao.`,
  },
  {
    serial: 15,
    name: 'Mehran Basmati Kernel Rice 1kg',
    nameBn: 'মেহরান বাসমতি কার্নেল চাল ১ কেজি',
    slug: 'mehran-basmati-kernel-rice-1kg',
    packSize: '1 kg',
    regularPrice: 595,
    sellingPrice: 595,
    discountPrice: null,
    brandName: 'Mehran',
    imgUrl: brandImgs.mehran_basmati_kernel_1kg.r2Url,
    shortDescriptionBn: 'আন্তর্জাতিক মানের পাকিস্তানি মেহরান সুপার কার্নেল বাসমতি চাল।',
    shortDescription: 'Premium Pakistani Super Kernel aged Basmati Rice by Mehran 1kg.',
    descriptionBn: `### পণ্য পরিচিতি
পাকিস্তানের বিশ্ববিখ্যাত মেহরান স্পাইস অ্যান্ড ফুডসের সুপার কার্নেল বাসমতি চাল। হিমালয়ের পাদদেশে উৎপাদিত এবং প্রাকৃতিকভাবে বহু বছর ধরে সংরক্ষিত।

### বৈশিষ্ট্য ও রান্নার তথ্য
- **চালের ধরণ:** সুপার কার্নেল ওল্ড বাসমতি (Super Kernel Basmati)।
- **সেরা ব্যবহার:** রাজকীয় দম বিরিয়ানি, জাফরানি পোলাও।`,
    description: `### Product Overview
World-renowned Mehran Super Kernel Basmati Rice, naturally aged and sourced from the finest fertile valleys of Pakistan.

### Culinary Profile & Cooking Guide
- **Grain Type:** Authentic Super Kernel aged Basmati.
- **Best For:** Royal Mughlai biryani, saffron pilaf, fine dining.`,
  },
  {
    serial: 16,
    name: 'Miniket Rice Standard (Parboiled) 5kg',
    nameBn: 'মিনিকেট চাল স্ট্যান্ডার্ড (সিদ্ধ) ± ৫০ গ্রাম ৫ কেজি',
    slug: 'miniket-rice-standard-parboiled-5kg',
    packSize: '5 kg',
    regularPrice: 389,
    sellingPrice: 389,
    discountPrice: null,
    brandName: 'Bazar Shodai Select',
    imgUrl: customImgs.bowl_miniket_premium.r2Url,
    shortDescriptionBn: 'দৈনন্দিন খাবারের জন্য সাশ্রয়ী স্ট্যান্ডার্ড সিদ্ধ মিনিকেট চাল ৫ কেজি।',
    shortDescription: 'Affordable standard quality parboiled Miniket rice 5kg.',
    descriptionBn: `### পণ্য পরিচিতি
সাশ্রয়ী মূল্যে পরিবারের নিয়মিত আহারের জন্য পরিষ্কার ও ভালো মানের সিদ্ধ মিনিকেট চাল।`,
    description: `### Product Overview
Everyday budget-friendly standard grade parboiled Miniket rice for family meals.`,
  },
  {
    serial: 17,
    name: 'Fresh Chinigura Rice 1kg',
    nameBn: 'ফ্রেশ চিনিগুড়া চাল ১ কেজি',
    slug: 'fresh-chinigura-rice-1kg',
    packSize: '1 kg',
    regularPrice: 175,
    sellingPrice: 175,
    discountPrice: null,
    brandName: 'Fresh',
    imgUrl: brandImgs.fresh_chinigura_1kg.r2Url,
    shortDescriptionBn: 'মেঘনা গ্রুপের বাছাইকৃত সুবাসিত ফ্রেশ চিনিগুড়া চাল ১ কেজি।',
    shortDescription: 'Pure fragrant Fresh Chinigura Rice 1kg pack by Meghna Group.',
    descriptionBn: `### পণ্য পরিচিতি
মেঘনা গ্রুপ অব ইন্ডাস্ট্রিজের ফ্রেশ চিনিগুড়া সুগন্ধি চাল। পরিষ্কার, ঝরঝরে ও অনন্য প্রাকৃতিক সুবাসযুক্ত।`,
    description: `### Product Overview
Fresh Chinigura Rice by Meghna Group, meticulously processed to deliver spotless white aromatic grains.`,
  },
  {
    serial: 18,
    name: 'Atap Rice 25kg Sack',
    nameBn: 'আতপ চাল ± ২০০ গ্রাম ২৫ কেজি বস্তা',
    slug: 'atap-rice-25kg-sack',
    packSize: '25 kg',
    regularPrice: 1650,
    sellingPrice: 1439,
    discountPrice: 1439,
    brandName: 'Bazar Shodai Select',
    imgUrl: customImgs.bosta_atap_25kg.r2Url,
    shortDescriptionBn: 'হোয়াইট আতপ চালের সাশ্রয়ী ২৫ কেজি বস্তা, খিচুড়ি ও পিঠার জন্য আদর্শ।',
    shortDescription: 'Wholesale 25kg burlap sack of white non-parboiled Atap rice.',
    descriptionBn: `### পণ্য পরিচিতি
হোয়াইট আতপ চালের ২৫ কেজি বাণিজ্যিক ও পারিবারিক বস্তা। নরম খিচুড়ি, পায়েস ও শীতকালীন পিঠা তৈরির জন্য অত্যন্ত উপযোগী।`,
    description: `### Product Overview
Bulk 25kg burlap jute sack of non-parboiled white Atap rice, ideal for soft khichuri, desserts, and rice flour.`,
  },
  {
    serial: 19,
    name: 'ACI Aroma Premium Basmati Rice 1kg',
    nameBn: 'এ সি আই অ্যারোমা প্রিমিয়াম বাসমতি চাল ১ কেজি',
    slug: 'aci-aroma-premium-basmati-rice-1kg',
    packSize: '1 kg',
    regularPrice: 480,
    sellingPrice: 480,
    discountPrice: null,
    brandName: 'ACI Aroma',
    imgUrl: brandImgs.aci_aroma_basmati_1kg.r2Url,
    shortDescriptionBn: 'হিমালয়ের সেরা খাঁটি সুবাসিত এসিআই অ্যারোমা বাসমতি চাল ১ কেজি।',
    shortDescription: 'Authentic Himalayan ACI Aroma Premium Basmati Rice 1kg.',
    descriptionBn: `### পণ্য পরিচিতি
হিমালয়ের খাঁটি লম্বা দানার এসিআই অ্যারোমা প্রিমিয়াম বাসমতি চাল। নিখুঁত বিরিয়ানির জন্য সেরা বিশ্বস্ত ব্র্যান্ড।`,
    description: `### Product Overview
Finest long-grain Himalayan Basmati rice by ACI Aroma, ensuring fragrant, non-sticky rice for biryani.`,
  },
  {
    serial: 20,
    name: 'Katari Atap Rice 5kg',
    nameBn: 'কাটারি আতপ চাল ± ৫০ গ্রাম ৫ কেজি',
    slug: 'katari-atap-rice-5kg',
    packSize: '5 kg',
    regularPrice: 489,
    sellingPrice: 489,
    discountPrice: null,
    brandName: 'Bazar Shodai Select',
    imgUrl: customImgs.bowl_chinigura_aromatic.r2Url,
    shortDescriptionBn: 'চিকন ও সুস্বাদু কাটারি আতপ চাল ৫ কেজি প্যাক।',
    shortDescription: 'Slender, pointed white Katari Atap rice 5kg pack.',
    descriptionBn: `### পণ্য পরিচিতি
উন্নত জাতের কাটারি ধান থেকে প্রস্তুত চিকন শুভ্র আতপ চাল। রান্নায় সহজেই ফুটে ওঠে এবং নরম ঝরঝরে থাকে।`,
    description: `### Product Overview
Slender, pointed white non-parboiled Katari Atap rice, beloved for traditional festive Bengali dishes.`,
  },
  {
    serial: 21,
    name: 'Aarong Natural Chinigura Rice 5kg',
    nameBn: 'আড়ং ন্যাচারাল চিনিগুঁড়া চাল ৫ কেজি',
    slug: 'aarong-natural-chinigura-rice-5kg',
    packSize: '5 kg',
    regularPrice: 761,
    sellingPrice: 761,
    discountPrice: null,
    brandName: 'Aarong Natural',
    imgUrl: brandImgs.aarong_natural_chinigura_5kg.r2Url,
    shortDescriptionBn: 'ব্র্যাক আড়ংয়ের শতভাগ খাঁটি ন্যাচারাল চিনিগুঁড়া চাল ৫ কেজি প্যাক।',
    shortDescription: 'BRAC Aarong Natural 100% pure Chinigura Rice 5kg bag.',
    descriptionBn: `### পণ্য পরিচিতি
ব্র্যাক আড়ং এন্টারপ্রাইজের শতভাগ খাঁটি ও প্রাকৃতিকভাবে চাষকৃত চিনিগুঁড়া চাল। ক্ষতিকর রাসায়নিকমুক্ত ও প্রাকৃতিক ঘ্রাণে ভরপুর।`,
    description: `### Product Overview
100% pure, naturally grown Chinigura rice by BRAC Aarong, free from artificial polishing or additives.`,
  },
  {
    serial: 22,
    name: 'Paijam Rice (Parboiled) 1kg',
    nameBn: 'পাইজাম চাল (সিদ্ধ) ১ কেজি',
    slug: 'paijam-rice-parboiled-1kg',
    packSize: '1 kg',
    regularPrice: 75,
    sellingPrice: 65,
    discountPrice: 65,
    brandName: 'Bazar Shodai Select',
    imgUrl: customImgs.bowl_atash_siddha.r2Url,
    shortDescriptionBn: 'দৈনন্দিন খাবারের নরম ও সুস্বাদু সিদ্ধ পাইজাম চাল ১ কেজি।',
    shortDescription: 'Fresh everyday parboiled Paijam rice 1kg.',
    descriptionBn: `### পণ্য পরিচিতি
প্রতিদিনের পুষ্টিকর খাবারের জন্য পরিষ্কার সিদ্ধ পাইজাম চাল। ভাত নরম ও সহজে হজমযোগ্য।`,
    description: `### Product Overview
Everyday standard parboiled Paijam rice 1kg, soft, digestive, and wholesome.`,
  },
  {
    serial: 23,
    name: 'Royal Umbrella Pure Thai Hom Mali Jasmine Rice 5kg',
    nameBn: 'রয়েল আমব্রেলা পিওর থাই হোম মালি চাল ৫ কেজি',
    slug: 'royal-umbrella-pure-thai-hom-mali-rice-5kg',
    packSize: '5 kg',
    regularPrice: 1500,
    sellingPrice: 1500,
    discountPrice: null,
    brandName: 'Royal Umbrella',
    imgUrl: brandImgs.royal_umbrella_hom_mali_5kg.r2Url,
    shortDescriptionBn: 'বিশ্ববিখ্যাত থাইল্যান্ডের পিওর হোম মালি জেসমিন সুগন্ধি চাল ৫ কেজি।',
    shortDescription: 'Authentic imported Thai Hom Mali Jasmine Rice by Royal Umbrella 5kg.',
    descriptionBn: `### পণ্য পরিচিতি
থাইল্যান্ডের সরকার অনুমোদিত প্রিমিয়াম পিওর হোম মালি জেসমিন চাল। আন্তর্জাতিক মানের আকর্ষণীয় প্রাকৃতিক সুবাস ও মোলায়েম টেক্সচার।`,
    description: `### Product Overview
Award-winning genuine Thai Hom Mali Jasmine Rice imported from Thailand. Fragrant, soft, and slightly sweet.`,
  },
  {
    serial: 24,
    name: 'Nazirshail Rice Standard (Half Parboiled) 5kg',
    nameBn: 'নাজিরশাইল চাল স্ট্যান্ডার্ড (আধা সিদ্ধ) ± ৫০ গ্রাম ৫ কেজি',
    slug: 'nazirshail-rice-standard-half-parboiled-5kg',
    packSize: '5 kg',
    regularPrice: 459,
    sellingPrice: 399,
    discountPrice: 399,
    brandName: 'Bazar Shodai Select',
    imgUrl: customImgs.bowl_nazirshail_adhasiddha.r2Url,
    shortDescriptionBn: 'সাশ্রয়ী মূল্যে স্ট্যান্ডার্ড মানের আধা-সিদ্ধ নাজিরশাইল চাল ৫ কেজি।',
    shortDescription: 'Standard quality half-parboiled Nazirshail rice 5kg.',
    descriptionBn: `### পণ্য পরিচিতি
নিয়মিত খাবারের জন্য সাশ্রয়ী মূল্যে পরিষ্কার ও স্বাস্থ্যসম্মত আধা-সিদ্ধ নাজিরশাইল চাল।`,
    description: `### Product Overview
Reliable everyday half-parboiled Nazirshail rice 5kg at a competitive price.`,
  },
  {
    serial: 25,
    name: 'PRAN Metro Basmati Rice 1kg',
    nameBn: 'প্রাণ মেট্রো বাসমতি চাল ১ কেজি',
    slug: 'pran-metro-basmati-rice-1kg',
    packSize: '1 kg',
    regularPrice: 420,
    sellingPrice: 420,
    discountPrice: null,
    brandName: 'PRAN',
    imgUrl: brandImgs.pran_metro_basmati_1kg.r2Url,
    shortDescriptionBn: 'লম্বা দানার ঝরঝরে ও সুস্বাদু প্রাণ মেট্রো বাসমতি চাল ১ কেজি।',
    shortDescription: 'Premium long grain PRAN Metro Basmati Rice 1kg pack.',
    descriptionBn: `### পণ্য পরিচিতি
প্রাণ ফুডসের এক্সপোর্ট কোয়ালিটি মেট্রো বাসমতি চাল। রান্নার পর ভাত লম্বা, ঝরঝরে ও দেখতে দারুণ আকর্ষণীয় হয়।`,
    description: `### Product Overview
PRAN Metro Basmati Rice offers premium extra-long grains that stay distinct and fluffy after cooking.`,
  },
  {
    serial: 26,
    name: 'Chinigura Rice Premium (Loose) 1kg',
    nameBn: 'চিনিগুঁড়া চাল প্রিমিয়াম ১ কেজি',
    slug: 'chinigura-rice-premium-loose-1kg',
    packSize: '1 kg',
    regularPrice: 169,
    sellingPrice: 169,
    discountPrice: null,
    brandName: 'Bazar Shodai Select',
    imgUrl: customImgs.bowl_chinigura_aromatic.r2Url,
    shortDescriptionBn: 'দিনাজপুরের খাঁটি খোলা চিনিগুঁড়া পোলাও চাল, সুবাসিত ও পরিষ্কার।',
    shortDescription: 'Freshly milled premium loose Chinigura aromatic rice 1kg.',
    descriptionBn: `### পণ্য পরিচিতি
দিনাজপুরের কৃষকের সরাসরি খামার থেকে সংগৃহীত খাঁটি খোলা চিনিগুঁড়া চাল। হ্যান্ডপিকড ও পরিষ্কার।`,
    description: `### Product Overview
Direct farm-sourced premium loose Chinigura rice, freshly milled and thoroughly cleaned.`,
  },
  {
    serial: 27,
    name: 'Rupchanda Jirashail Rice 5kg',
    nameBn: 'রূপচাঁদা জিরাশাইল চাল ৫ কেজি',
    slug: 'rupchanda-jirashail-rice-5kg',
    packSize: '5 kg',
    regularPrice: 480,
    sellingPrice: 480,
    discountPrice: null,
    brandName: 'Rupchanda',
    imgUrl: brandImgs.rupchanda_jirashail_5kg.r2Url,
    shortDescriptionBn: 'চিকন জিরার মতো দানার রূপচাঁদা প্রিমিয়াম জিরাশাইল চাল ৫ কেজি।',
    shortDescription: 'Fine cumin-shaped slender Rupchanda Jirashail Rice 5kg pack.',
    descriptionBn: `### পণ্য পরিচিতি
রূপচাঁদার প্রিমিয়াম জিরাশাইল চাল। জিরার মতো চিকন দানা রান্নার পর চমৎকার সুস্বাদু ও ঝরঝরে ভাত তৈরি করে।`,
    description: `### Product Overview
Rupchanda Jirashail rice features delicate, slender cumin-like grains that remain non-sticky when cooked.`,
  },
  {
    serial: 28,
    name: 'Atap Rice 1kg',
    nameBn: 'আতপ চাল ১ কেজি',
    slug: 'atap-rice-1kg',
    packSize: '1 kg',
    regularPrice: 75,
    sellingPrice: 59,
    discountPrice: 59,
    brandName: 'Bazar Shodai Select',
    imgUrl: customImgs.bowl_chinigura_aromatic.r2Url,
    shortDescriptionBn: 'সাদা পরিষ্কার আতপ চাল ১ কেজি, নরম খিচুড়ি ও পায়েসের জন্য।',
    shortDescription: 'Clean white non-parboiled Atap rice 1kg.',
    descriptionBn: `### পণ্য পরিচিতি
ধবধবে সাদা আতপ চাল। নরম খিচুড়ি, চালের গুঁড়া ও বিভিন্ন মিষ্টান্ন তৈরির জন্য উপযুক্ত।`,
    description: `### Product Overview
Pure white non-parboiled Atap rice 1kg, suitable for sweet porridge, khichuri, and pitha recipes.`,
  },
  {
    serial: 29,
    name: 'ACI Pure Miniket Rice Premium 10kg',
    nameBn: 'এ সি আই পিওর মিনিকেট চাল প্রিমিয়াম ১০ কেজি',
    slug: 'aci-pure-miniket-rice-premium-10kg',
    packSize: '10 kg',
    regularPrice: 950,
    sellingPrice: 950,
    discountPrice: null,
    brandName: 'ACI Pure',
    imgUrl: brandImgs.aci_pure_miniket_10kg.r2Url,
    shortDescriptionBn: '১০ কেজি পারিবারিক সাশ্রয়ী এসিআই পিওর প্রিমিয়াম মিনিকেট ব্যাগ।',
    shortDescription: 'Economical 10kg family bag of ACI Pure Premium Miniket Rice.',
    descriptionBn: `### পণ্য পরিচিতি
পারিবারিক সুবিধার জন্য ১০ কেজি সিল্ড ব্যাগে এসিআই পিওর প্রিমিয়াম মিনিকেট চাল। শতভাগ স্বাস্থ্যসম্মত ও খাঁটি।`,
    description: `### Product Overview
10kg value pack of ACI Pure Premium Miniket Rice, sealed for family kitchen freshness and convenience.`,
  },
  {
    serial: 30,
    name: 'Baulamati Rice (Parboiled) 1kg',
    nameBn: 'বাউলামতি চাল (সিদ্ধ) ১ কেজি',
    slug: 'baulamati-rice-parboiled-1kg',
    packSize: '1 kg',
    regularPrice: 119,
    sellingPrice: 105,
    discountPrice: 105,
    brandName: 'Bazar Shodai Select',
    imgUrl: customImgs.bowl_nazirshail_adhasiddha.r2Url,
    shortDescriptionBn: 'উচ্চ পুষ্টিসমৃদ্ধ ঐতিহ্যবাহী বাউলামতি সিদ্ধ চাল ১ কেজি।',
    shortDescription: 'Nutrient-rich heritage Baulamati parboiled rice 1kg.',
    descriptionBn: `### পণ্য পরিচিতি
বাংলাদেশ কৃষি বিশ্ববিদ্যালয় (BAU) উদ্ভাবিত বিশেষ জাতের উচ্চ পুষ্টিমানসম্পন্ন বাউলামতি চাল। ডায়াবেটিক ও স্বাস্থ্য সচেতনদের জন্য অত্যন্ত উপকারী।`,
    description: `### Product Overview
Developed by Bangladesh Agricultural University, Baulamati rice offers high dietary fiber and sustained energy for health-conscious diets.`,
  },
  {
    serial: 31,
    name: 'PRAN Chinigura Aromatic Rice 2kg',
    nameBn: 'প্রাণ চিনিগুঁড়া সুগন্ধি চাল ২ কেজি',
    slug: 'pran-chinigura-aromatic-rice-2kg',
    packSize: '2 kg',
    regularPrice: 370,
    sellingPrice: 370,
    discountPrice: null,
    brandName: 'PRAN',
    imgUrl: brandImgs.pran_chinigura_2kg.r2Url,
    shortDescriptionBn: '২ কেজি ফ্যামিলি প্যাক প্রাণ চিনিগুঁড়া সুগন্ধি চাল।',
    shortDescription: 'Convenient 2kg family pack of PRAN Chinigura Aromatic Rice.',
    descriptionBn: `### পণ্য পরিচিতি
প্রাণ ফুডসের প্রিমিয়াম চিনিগুঁড়া সুগন্ধি চালের ২ কেজি ফ্যামিলি প্যাক। উৎসবের প্রতিটি আয়োজনে খাঁটি সুবাস।`,
    description: `### Product Overview
PRAN Chinigura Aromatic Rice 2kg pack, ideal for weekend family biryani and polao.`,
  },
  {
    serial: 32,
    name: 'Jirashail Rice (Parboiled) 5kg',
    nameBn: 'জিরাশাইল চাল (সিদ্ধ) ± ৫০ গ্রাম ৫ কেজি',
    slug: 'jirashail-rice-parboiled-5kg',
    packSize: '5 kg',
    regularPrice: 419,
    sellingPrice: 349,
    discountPrice: 349,
    brandName: 'Bazar Shodai Select',
    imgUrl: customImgs.bowl_miniket_premium.r2Url,
    shortDescriptionBn: 'চিকন দানার সুস্বাদু সিদ্ধ জিরাশাইল চাল ৫ কেজি।',
    shortDescription: 'Slender parboiled Jirashail rice 5kg pack.',
    descriptionBn: `### পণ্য পরিচিতি
চিকন ও পরিচ্ছন্ন সিদ্ধ জিরাশাইল চাল। রান্নায় ভাত সুন্দর ঝরঝরে হয় এবং প্রতিটি লোকমায় তৃপ্তি দেয়।`,
    description: `### Product Overview
Fine parboiled Jirashail rice 5kg, known for distinct slender grains and satisfying taste.`,
  },
  {
    serial: 33,
    name: 'Royal Umbrella Thai Glutinous Sticky Rice 1kg',
    nameBn: 'রয়েল আমব্রেলা থাই গ্লুটিনাস স্টিকি রাইস ১ কেজি',
    slug: 'royal-umbrella-thai-glutinous-sticky-rice-1kg',
    packSize: '1 kg',
    regularPrice: 500,
    sellingPrice: 500,
    discountPrice: null,
    brandName: 'Royal Umbrella',
    imgUrl: brandImgs.royal_umbrella_sticky_rice_1kg.r2Url,
    shortDescriptionBn: 'আমদানিকৃত থাই খাঁটি মিষ্টি গ্লুটিনাস স্টিকি রাইস ১ কেজি।',
    shortDescription: 'Imported authentic Thai Sweet Glutinous Sticky Rice by Royal Umbrella 1kg.',
    descriptionBn: `### পণ্য পরিচিতি
থাইল্যান্ডের জনপ্রিয় রয়েল আমব্রেলা গ্লুটিনাস (স্টিকি) রাইস। এশিয়ান ডেজার্ট, স্টিকি রাইস উইথ ম্যাঙ্গো ও সুশি তৈরির জন্য আদর্শ।`,
    description: `### Product Overview
Imported Royal Umbrella Thai Glutinous (Sticky) Rice 1kg, essential for Asian desserts, sweet rice, and mango sticky rice.`,
  },
  {
    serial: 34,
    name: 'Husky Rice (Half Parboiled) 5kg',
    nameBn: 'হুসকি চাল (আধা সিদ্ধ) ৫ কেজি',
    slug: 'husky-rice-half-parboiled-5kg',
    packSize: '5 kg',
    regularPrice: 399,
    sellingPrice: 329,
    discountPrice: 329,
    brandName: 'Bazar Shodai Select',
    imgUrl: customImgs.bowl_nazirshail_adhasiddha.r2Url,
    shortDescriptionBn: 'স্বাদ ও পুষ্টিতে ভরপুর ঐতিহ্যবাহী আধা-সিদ্ধ হুসকি চাল ৫ কেজি।',
    shortDescription: 'Wholesome half-parboiled traditional Husky rice 5kg.',
    descriptionBn: `### পণ্য পরিচিতি
উত্তরবঙ্গের ঐতিহ্যবাহী আধা-সিদ্ধ হুসকি চাল। প্রাকৃতিক ফাইবার ও খনিজ সমৃদ্ধ, স্বাস্থ্যকর খাবারের চমৎকার উৎস।`,
    description: `### Product Overview
Traditional Northern half-parboiled Husky rice 5kg, rich in natural grain bran and dietary fiber.`,
  },
  {
    serial: 35,
    name: 'Extra Long Grain Basmati Rice 1kg',
    nameBn: 'এক্সট্রা লম্বা দানার বাসমতি চাল ১ কেজি',
    slug: 'extra-long-grain-basmati-rice-1kg',
    packSize: '1 kg',
    regularPrice: 299,
    sellingPrice: 299,
    discountPrice: null,
    brandName: 'Bazar Shodai Select',
    imgUrl: customImgs.bowl_basmati_aged.r2Url,
    shortDescriptionBn: 'অতিরিক্ত লম্বা দানার ঝরঝরে ও প্রিমিয়াম বাসমতি চাল ১ কেজি।',
    shortDescription: 'Extra-long grain aromatic aged Basmati Rice 1kg.',
    descriptionBn: `### পণ্য পরিচিতি
বাছাইকৃত অতিরিক্ত লম্বা দানার পরিপক্ক বাসমতি চাল। রান্নার পর প্রতিটি দানা দীর্ঘ ও সম্পূর্ণ আলাদা থাকে।`,
    description: `### Product Overview
Select extra-long grain aged Basmati rice 1kg, offering exquisite grain elongation and delicate aroma.`,
  },
  {
    serial: 36,
    name: 'ACI Aroma Chinigura Rice 2kg',
    nameBn: 'এসিআই অ্যারোমা চিনিগুঁড়া চাল ২ কেজি',
    slug: 'aci-aroma-chinigura-rice-2kg',
    packSize: '2 kg',
    regularPrice: 385,
    sellingPrice: 385,
    discountPrice: null,
    brandName: 'ACI Aroma',
    imgUrl: brandImgs.aci_aroma_chinigura_2kg.r2Url,
    shortDescriptionBn: 'শাহী পোলাও ও বিরিয়ানির জন্য এসিআই অ্যারোমা চিনিগুঁড়া ২ কেজি।',
    shortDescription: 'Shahi Polao special ACI Aroma Chinigura Rice 2kg pack.',
    descriptionBn: `### পণ্য পরিচিতি
এসিআই অ্যারোমা চিনিগুঁড়া চালের ২ কেজি প্রিমিয়াম প্যাক। রাজকীয় বিয়ে বাড়ি পোলাও ও মিষ্টি পায়েসের সেরা সঙ্গী।`,
    description: `### Product Overview
ACI Aroma Chinigura Rice 2kg pack, ideal for royal festive pilaf, kheer, and fragrant traditional dishes.`,
  },
  {
    serial: 37,
    name: 'Chashi Aromatic Chinigura Rice 5kg',
    nameBn: 'চাষী সুগন্ধি চিনিগুঁড়া চাল ৫ কেজি',
    slug: 'chashi-aromatic-chinigura-rice-5kg',
    packSize: '5 kg',
    regularPrice: 910,
    sellingPrice: 910,
    discountPrice: null,
    brandName: 'Chashi',
    imgUrl: brandImgs.chashi_chinigura_5kg.r2Url,
    shortDescriptionBn: 'পারিবারিক অনুষ্ঠান ও বড় আয়োজনের ৫ কেজি সাশ্রয়ী চাষী সুগন্ধি প্যাক।',
    shortDescription: 'Large 5kg value bag of Chashi Aromatic Chinigura Rice for feasts.',
    descriptionBn: `### পণ্য পরিচিতি
বড় পারিবারিক আয়োজন ও অনুষ্ঠানের জন্য সাশ্রয়ী ৫ কেজি চাষী সুগন্ধি চিনিগুঁড়া চালের বড় ব্যাগ। প্রতিটি দানায় অতুলনীয় দেশি ঘ্রাণ।`,
    description: `### Product Overview
The generous 5kg value bag of Chashi Aromatic Chinigura Rice, catering to family feasts and community celebrations.`,
  },
];

async function seed() {
  console.log(`Starting seeding of ${PRODUCTS.length} rice products into subcategory 'Rice'...`);

  for (const item of PRODUCTS) {
    const buyingPrice = Number((item.sellingPrice * 0.88).toFixed(2));
    const profitMargin = 12.0;
    const isDiscounted = item.discountPrice !== null && item.discountPrice < item.regularPrice;

    console.log(`[${item.serial}/${PRODUCTS.length}] Seeding: ${item.name} (${item.nameBn})...`);

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
        unitId: UNIT_ID,
        categoryId: CATEGORY_ID,
        categoryName: 'Rice',
        brandName: item.brandName,
        buyingPrice: buyingPrice,
        regularPrice: item.regularPrice,
        sellingPrice: item.sellingPrice,
        discountPrice: item.discountPrice,
        priceBeforeDiscount: isDiscounted ? item.regularPrice : null,
        profitMargin: profitMargin,
        status: 'ACTIVE',
        isWeighed: false,
        isFeatured: item.serial <= 6,
        isNew: item.serial <= 10,
        isHot: item.serial <= 8,
        productCode: `RICE-${String(item.serial).padStart(2, '0')}`,
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
        unitId: UNIT_ID,
        categoryId: CATEGORY_ID,
        categoryName: 'Rice',
        brandName: item.brandName,
        buyingPrice: buyingPrice,
        regularPrice: item.regularPrice,
        sellingPrice: item.sellingPrice,
        discountPrice: item.discountPrice,
        priceBeforeDiscount: isDiscounted ? item.regularPrice : null,
        profitMargin: profitMargin,
        status: 'ACTIVE',
        isWeighed: false,
        isFeatured: item.serial <= 6,
        isNew: item.serial <= 10,
        isHot: item.serial <= 8,
        productCode: `RICE-${String(item.serial).padStart(2, '0')}`,
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

    console.log(`   ✓ Saved: ID ${product.id}`);
  }

  console.log(`\nAll ${PRODUCTS.length} rice products seeded successfully!`);
}

seed()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

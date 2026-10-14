import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as argon2 from 'argon2';
import { normalizeBdPhone, isBdMobile } from '../src/common/utils/phone';

// Bazar Shodai seed: units, bilingual categories, demo products, store name and
// (optionally) the first Super Admin. Safe to run again: everything is upserted.
//
//   npx prisma db seed
//
// Optional env (see .env.example):
//   SEED_DEMO_PRODUCTS=false     skip the ~35 demo products
//   SEED_SUPERADMIN_EMAIL / _PASSWORD / _NAME / _PHONE   create the first admin

let dbUrl = process.env.DATABASE_URL || '';
dbUrl = dbUrl.replace(/^"|"$/g, '');
dbUrl = dbUrl.replace(/&channel_binding=[^&]*/, '');
dbUrl = dbUrl.replace(/\?channel_binding=[^&]*&?/, '?');
const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ---------------------------------------------------------------------------
// Units of sale. The admin can change these and add more in the dashboard.
// ---------------------------------------------------------------------------
type UnitSeed = {
  code: string;
  name: string;
  nameBn: string;
  shortLabel: string;
  shortLabelBn: string;
  allowDecimal: boolean;
  defaultStep: number;
  defaultMinQty: number;
};

const units: UnitSeed[] = [
  { code: 'kg', name: 'Kilogram', nameBn: 'কেজি', shortLabel: 'kg', shortLabelBn: 'কেজি', allowDecimal: true, defaultStep: 0.5, defaultMinQty: 0.5 },
  { code: 'gram', name: 'Gram', nameBn: 'গ্রাম', shortLabel: 'g', shortLabelBn: 'গ্রাম', allowDecimal: false, defaultStep: 50, defaultMinQty: 100 },
  { code: 'litre', name: 'Litre', nameBn: 'লিটার', shortLabel: 'L', shortLabelBn: 'লিটার', allowDecimal: true, defaultStep: 0.5, defaultMinQty: 0.5 },
  { code: 'ml', name: 'Millilitre', nameBn: 'মিলিলিটার', shortLabel: 'ml', shortLabelBn: 'মি.লি.', allowDecimal: false, defaultStep: 50, defaultMinQty: 100 },
  { code: 'piece', name: 'Piece', nameBn: 'পিস', shortLabel: 'pc', shortLabelBn: 'পিস', allowDecimal: false, defaultStep: 1, defaultMinQty: 1 },
  { code: 'dozen', name: 'Dozen', nameBn: 'ডজন', shortLabel: 'dz', shortLabelBn: 'ডজন', allowDecimal: false, defaultStep: 1, defaultMinQty: 1 },
  { code: 'hali', name: 'Hali (4 pcs)', nameBn: 'হালি (৪ পিস)', shortLabel: 'hali', shortLabelBn: 'হালি', allowDecimal: false, defaultStep: 1, defaultMinQty: 1 },
  { code: 'packet', name: 'Packet', nameBn: 'প্যাকেট', shortLabel: 'pkt', shortLabelBn: 'প্যাকেট', allowDecimal: false, defaultStep: 1, defaultMinQty: 1 },
  { code: 'bundle', name: 'Bundle', nameBn: 'আঁটি', shortLabel: 'bundle', shortLabelBn: 'আঁটি', allowDecimal: false, defaultStep: 1, defaultMinQty: 1 },
  { code: 'bottle', name: 'Bottle', nameBn: 'বোতল', shortLabel: 'btl', shortLabelBn: 'বোতল', allowDecimal: false, defaultStep: 1, defaultMinQty: 1 },
  { code: 'box', name: 'Box', nameBn: 'বক্স', shortLabel: 'box', shortLabelBn: 'বক্স', allowDecimal: false, defaultStep: 1, defaultMinQty: 1 },
  { code: 'can', name: 'Can / Tin', nameBn: 'কৌটা', shortLabel: 'can', shortLabelBn: 'কৌটা', allowDecimal: false, defaultStep: 1, defaultMinQty: 1 },
];

// ---------------------------------------------------------------------------
// Categories (top level) and sub-categories, English + Bangla.
// ---------------------------------------------------------------------------
type Sub = { name: string; nameBn: string };
type Cat = { name: string; nameBn: string; subs: Sub[] };

const categories: Cat[] = [
  {
    name: 'Fruits & Vegetables',
    nameBn: 'ফল ও সবজি',
    subs: [
      { name: 'Fresh Vegetables', nameBn: 'তাজা সবজি' },
      { name: 'Fresh Fruits', nameBn: 'তাজা ফল' },
      { name: 'Leafy Greens', nameBn: 'শাক-পাতা' },
      { name: 'Onion, Garlic & Chilli', nameBn: 'পেঁয়াজ, রসুন ও মরিচ' },
    ],
  },
  {
    name: 'Fish',
    nameBn: 'মাছ',
    subs: [
      { name: 'Freshwater Fish', nameBn: 'মিঠা পানির মাছ' },
      { name: 'Hilsa & Sea Fish', nameBn: 'ইলিশ ও সামুদ্রিক মাছ' },
      { name: 'Prawn & Crab', nameBn: 'চিংড়ি ও কাঁকড়া' },
      { name: 'Dried Fish', nameBn: 'শুঁটকি মাছ' },
    ],
  },
  {
    name: 'Meat',
    nameBn: 'মাংস',
    subs: [
      { name: 'Chicken', nameBn: 'মুরগি' },
      { name: 'Beef', nameBn: 'গরুর মাংস' },
      { name: 'Mutton', nameBn: 'খাসির মাংস' },
      { name: 'Duck & Others', nameBn: 'হাঁস ও অন্যান্য' },
    ],
  },
  {
    name: 'Eggs & Dairy',
    nameBn: 'ডিম ও দুগ্ধজাত',
    subs: [
      { name: 'Eggs', nameBn: 'ডিম' },
      { name: 'Milk', nameBn: 'দুধ' },
      { name: 'Yogurt & Sweets', nameBn: 'দই ও মিষ্টি' },
      { name: 'Butter, Ghee & Cheese', nameBn: 'মাখন, ঘি ও পনির' },
    ],
  },
  {
    name: 'Rice, Pulses & Oil',
    nameBn: 'চাল, ডাল ও তেল',
    subs: [
      { name: 'Rice', nameBn: 'চাল' },
      { name: 'Pulses', nameBn: 'ডাল' },
      { name: 'Cooking Oil', nameBn: 'ভোজ্যতেল' },
      { name: 'Flour & Semolina', nameBn: 'আটা, ময়দা ও সুজি' },
    ],
  },
  {
    name: 'Spices & Cooking Essentials',
    nameBn: 'মসলা ও রান্নার উপকরণ',
    subs: [
      { name: 'Ground Spices', nameBn: 'গুঁড়া মসলা' },
      { name: 'Whole Spices', nameBn: 'আস্ত মসলা' },
      { name: 'Salt & Sugar', nameBn: 'লবণ ও চিনি' },
      { name: 'Sauces & Pickles', nameBn: 'সস ও আচার' },
    ],
  },
  {
    name: 'Beverages',
    nameBn: 'পানীয়',
    subs: [
      { name: 'Drinking Water', nameBn: 'খাবার পানি' },
      { name: 'Juice & Soft Drinks', nameBn: 'জুস ও কোমল পানীয়' },
      { name: 'Tea & Coffee', nameBn: 'চা ও কফি' },
    ],
  },
  {
    name: 'Snacks & Biscuits',
    nameBn: 'স্ন্যাকস ও বিস্কুট',
    subs: [
      { name: 'Biscuits & Cookies', nameBn: 'বিস্কুট ও কুকিজ' },
      { name: 'Chips & Snacks', nameBn: 'চিপস ও স্ন্যাকস' },
      { name: 'Noodles & Pasta', nameBn: 'নুডলস ও পাস্তা' },
      { name: 'Chocolate & Sweets', nameBn: 'চকলেট ও মিষ্টান্ন' },
    ],
  },
  {
    name: 'Baby Care',
    nameBn: 'শিশুদের পণ্য',
    subs: [
      { name: 'Diapers', nameBn: 'ডায়াপার' },
      { name: 'Baby Food', nameBn: 'শিশু খাদ্য' },
      { name: 'Baby Bath & Skin Care', nameBn: 'শিশুর স্নান ও ত্বকের যত্ন' },
    ],
  },
  {
    name: 'Personal Care',
    nameBn: 'ব্যক্তিগত পরিচর্যা',
    subs: [
      { name: 'Soap & Hand Wash', nameBn: 'সাবান ও হ্যান্ড ওয়াশ' },
      { name: 'Shampoo & Hair Care', nameBn: 'শ্যাম্পু ও চুলের যত্ন' },
      { name: 'Oral Care', nameBn: 'দাঁতের যত্ন' },
      { name: 'Skin Care', nameBn: 'ত্বকের যত্ন' },
    ],
  },
  {
    name: 'Household',
    nameBn: 'ঘরের সামগ্রী',
    subs: [
      { name: 'Cleaning Supplies', nameBn: 'পরিষ্কারের সামগ্রী' },
      { name: 'Tissue & Paper', nameBn: 'টিস্যু ও কাগজ' },
      { name: 'Kitchen Items', nameBn: 'রান্নাঘরের সামগ্রী' },
    ],
  },
  {
    name: 'Health & Medicine',
    nameBn: 'ওষুধ ও স্বাস্থ্য',
    subs: [
      { name: 'First Aid', nameBn: 'প্রাথমিক চিকিৎসা' },
      { name: 'Vitamins & Supplements', nameBn: 'ভিটামিন ও সাপ্লিমেন্ট' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Demo products. Prices in BDT. Remove or edit them in the dashboard.
// `weighed`: sold by weight, the final weight may differ when it is packed.
// ---------------------------------------------------------------------------
type ProductSeed = {
  name: string;
  nameBn: string;
  cat: string; // category English name
  sub: string; // sub-category English name
  unit: string; // unit code
  price: number; // selling price per unit
  regular?: number; // higher "was" price, to show a discount
  stock: number;
  step?: number;
  minQty?: number;
  pack?: string;
  weighed?: boolean;
  desc: string;
  descBn: string;
  featured?: boolean;
};

const products: ProductSeed[] = [
  // Vegetables
  { name: 'Potato', nameBn: 'আলু', cat: 'Fruits & Vegetables', sub: 'Fresh Vegetables', unit: 'kg', price: 45, stock: 300, step: 0.5, minQty: 0.5, desc: 'Fresh local potatoes.', descBn: 'তাজা দেশি আলু।', featured: true },
  { name: 'Tomato', nameBn: 'টমেটো', cat: 'Fruits & Vegetables', sub: 'Fresh Vegetables', unit: 'kg', price: 70, regular: 85, stock: 150, step: 0.5, minQty: 0.5, desc: 'Ripe red tomatoes.', descBn: 'পাকা লাল টমেটো।', featured: true },
  { name: 'Brinjal', nameBn: 'বেগুন', cat: 'Fruits & Vegetables', sub: 'Fresh Vegetables', unit: 'kg', price: 60, stock: 120, step: 0.5, minQty: 0.5, desc: 'Fresh brinjal.', descBn: 'তাজা বেগুন।' },
  { name: 'Local Onion', nameBn: 'দেশি পেঁয়াজ', cat: 'Fruits & Vegetables', sub: 'Onion, Garlic & Chilli', unit: 'kg', price: 80, stock: 250, step: 0.5, minQty: 1, desc: 'Local onion.', descBn: 'দেশি পেঁয়াজ।' },
  { name: 'Green Chilli', nameBn: 'কাঁচা মরিচ', cat: 'Fruits & Vegetables', sub: 'Onion, Garlic & Chilli', unit: 'kg', price: 160, stock: 40, step: 0.25, minQty: 0.25, desc: 'Fresh green chilli.', descBn: 'তাজা কাঁচা মরিচ।' },
  { name: 'Spinach', nameBn: 'পালং শাক', cat: 'Fruits & Vegetables', sub: 'Leafy Greens', unit: 'bundle', price: 15, stock: 80, desc: 'Fresh spinach, one bundle.', descBn: 'তাজা পালং শাক, এক আঁটি।' },
  // Fruits
  { name: 'Banana (Sagar)', nameBn: 'সাগর কলা', cat: 'Fruits & Vegetables', sub: 'Fresh Fruits', unit: 'dozen', price: 80, stock: 60, desc: 'Sweet sagar bananas.', descBn: 'মিষ্টি সাগর কলা।', featured: true },
  { name: 'Apple (Imported)', nameBn: 'আপেল (আমদানি)', cat: 'Fruits & Vegetables', sub: 'Fresh Fruits', unit: 'kg', price: 280, regular: 320, stock: 50, step: 0.5, minQty: 0.5, desc: 'Crisp imported apples.', descBn: 'মচমচে আমদানি করা আপেল।' },
  { name: 'Orange', nameBn: 'কমলা', cat: 'Fruits & Vegetables', sub: 'Fresh Fruits', unit: 'kg', price: 220, stock: 50, step: 0.5, minQty: 0.5, desc: 'Juicy oranges.', descBn: 'রসালো কমলা।' },
  { name: 'Papaya', nameBn: 'পেঁপে', cat: 'Fruits & Vegetables', sub: 'Fresh Fruits', unit: 'kg', price: 60, stock: 60, step: 0.5, minQty: 1, desc: 'Fresh papaya.', descBn: 'তাজা পেঁপে।' },
  // Fish
  { name: 'Rui Fish', nameBn: 'রুই মাছ', cat: 'Fish', sub: 'Freshwater Fish', unit: 'kg', price: 380, stock: 40, step: 0.5, minQty: 1, weighed: true, desc: 'Fresh rui. Cleaned and cut on request.', descBn: 'তাজা রুই মাছ। চাইলে কেটে পরিষ্কার করে দেওয়া হয়।', featured: true },
  { name: 'Tilapia', nameBn: 'তেলাপিয়া', cat: 'Fish', sub: 'Freshwater Fish', unit: 'kg', price: 220, stock: 40, step: 0.5, minQty: 0.5, weighed: true, desc: 'Fresh tilapia.', descBn: 'তাজা তেলাপিয়া মাছ।' },
  { name: 'Pangas', nameBn: 'পাঙ্গাস', cat: 'Fish', sub: 'Freshwater Fish', unit: 'kg', price: 190, stock: 40, step: 0.5, minQty: 0.5, weighed: true, desc: 'Fresh pangas.', descBn: 'তাজা পাঙ্গাস মাছ।' },
  { name: 'Hilsa (Ilish)', nameBn: 'ইলিশ মাছ', cat: 'Fish', sub: 'Hilsa & Sea Fish', unit: 'kg', price: 1800, stock: 20, step: 0.5, minQty: 0.5, weighed: true, desc: 'Fresh hilsa, about 1 kg each.', descBn: 'তাজা ইলিশ, প্রতিটি প্রায় ১ কেজি।', featured: true },
  { name: 'Golda Prawn', nameBn: 'গলদা চিংড়ি', cat: 'Fish', sub: 'Prawn & Crab', unit: 'kg', price: 1200, stock: 15, step: 0.5, minQty: 0.5, weighed: true, desc: 'Large golda prawns.', descBn: 'বড় গলদা চিংড়ি।' },
  // Meat
  { name: 'Broiler Chicken', nameBn: 'ব্রয়লার মুরগি', cat: 'Meat', sub: 'Chicken', unit: 'kg', price: 210, stock: 60, step: 0.5, minQty: 1, weighed: true, desc: 'Fresh broiler chicken, cut as you like.', descBn: 'তাজা ব্রয়লার মুরগি, পছন্দমতো কাটা।' },
  { name: 'Beef (Bone-in)', nameBn: 'গরুর মাংস (হাড়সহ)', cat: 'Meat', sub: 'Beef', unit: 'kg', price: 780, stock: 30, step: 0.5, minQty: 0.5, weighed: true, desc: 'Fresh beef with bone.', descBn: 'তাজা গরুর মাংস, হাড়সহ।' },
  { name: 'Mutton', nameBn: 'খাসির মাংস', cat: 'Meat', sub: 'Mutton', unit: 'kg', price: 1200, stock: 20, step: 0.5, minQty: 0.5, weighed: true, desc: 'Fresh mutton.', descBn: 'তাজা খাসির মাংস।' },
  // Eggs & dairy
  { name: 'Farm Eggs', nameBn: 'ফার্মের ডিম', cat: 'Eggs & Dairy', sub: 'Eggs', unit: 'dozen', price: 140, stock: 100, desc: 'Fresh farm eggs, 12 pieces.', descBn: 'তাজা ফার্মের ডিম, ১২ পিস।', featured: true },
  { name: 'Liquid Milk', nameBn: 'তরল দুধ', cat: 'Eggs & Dairy', sub: 'Milk', unit: 'litre', price: 90, stock: 80, step: 1, minQty: 1, desc: 'Fresh liquid milk.', descBn: 'তাজা তরল দুধ।' },
  { name: 'Sweet Yogurt', nameBn: 'মিষ্টি দই', cat: 'Eggs & Dairy', sub: 'Yogurt & Sweets', unit: 'packet', price: 120, stock: 40, pack: '500 g', desc: 'Sweet yogurt, 500 g.', descBn: 'মিষ্টি দই, ৫০০ গ্রাম।' },
  // Rice, pulses, oil
  { name: 'Miniket Rice', nameBn: 'মিনিকেট চাল', cat: 'Rice, Pulses & Oil', sub: 'Rice', unit: 'kg', price: 75, stock: 500, step: 1, minQty: 1, desc: 'Quality miniket rice.', descBn: 'ভালো মানের মিনিকেট চাল।', featured: true },
  { name: 'Masoor Dal', nameBn: 'মসুর ডাল', cat: 'Rice, Pulses & Oil', sub: 'Pulses', unit: 'kg', price: 140, stock: 200, step: 0.5, minQty: 0.5, desc: 'Red lentils (masoor dal).', descBn: 'মসুর ডাল।' },
  { name: 'Soybean Oil', nameBn: 'সয়াবিন তেল', cat: 'Rice, Pulses & Oil', sub: 'Cooking Oil', unit: 'bottle', price: 880, regular: 920, stock: 60, pack: '5 L', desc: 'Refined soybean oil, 5 litre.', descBn: 'পরিশোধিত সয়াবিন তেল, ৫ লিটার।' },
  { name: 'Whole Wheat Atta', nameBn: 'আটা', cat: 'Rice, Pulses & Oil', sub: 'Flour & Semolina', unit: 'packet', price: 120, stock: 80, pack: '2 kg', desc: 'Whole wheat atta, 2 kg.', descBn: 'আটা, ২ কেজি।' },
  // Spices & essentials
  { name: 'Salt', nameBn: 'লবণ', cat: 'Spices & Cooking Essentials', sub: 'Salt & Sugar', unit: 'packet', price: 45, stock: 150, pack: '1 kg', desc: 'Iodised salt, 1 kg.', descBn: 'আয়োডিনযুক্ত লবণ, ১ কেজি।' },
  { name: 'Sugar', nameBn: 'চিনি', cat: 'Spices & Cooking Essentials', sub: 'Salt & Sugar', unit: 'kg', price: 125, stock: 200, step: 1, minQty: 1, desc: 'White sugar.', descBn: 'সাদা চিনি।' },
  { name: 'Turmeric Powder', nameBn: 'হলুদ গুঁড়া', cat: 'Spices & Cooking Essentials', sub: 'Ground Spices', unit: 'packet', price: 65, stock: 90, pack: '200 g', desc: 'Turmeric powder, 200 g.', descBn: 'হলুদ গুঁড়া, ২০০ গ্রাম।' },
  // Beverages
  { name: 'Drinking Water', nameBn: 'খাবার পানি', cat: 'Beverages', sub: 'Drinking Water', unit: 'bottle', price: 30, stock: 200, pack: '1.5 L', desc: 'Purified drinking water, 1.5 L.', descBn: 'বিশুদ্ধ খাবার পানি, ১.৫ লিটার।' },
  { name: 'Black Tea', nameBn: 'চা পাতা', cat: 'Beverages', sub: 'Tea & Coffee', unit: 'packet', price: 230, stock: 70, pack: '400 g', desc: 'Black tea leaves, 400 g.', descBn: 'চা পাতা, ৪০০ গ্রাম।' },
  // Snacks
  { name: 'Biscuit', nameBn: 'বিস্কুট', cat: 'Snacks & Biscuits', sub: 'Biscuits & Cookies', unit: 'packet', price: 30, stock: 150, desc: 'Tea biscuit packet.', descBn: 'চায়ের বিস্কুট প্যাকেট।' },
  { name: 'Instant Noodles', nameBn: 'ইনস্ট্যান্ট নুডলস', cat: 'Snacks & Biscuits', sub: 'Noodles & Pasta', unit: 'packet', price: 25, stock: 200, desc: 'Instant noodles packet.', descBn: 'ইনস্ট্যান্ট নুডলস প্যাকেট।' },
  // Personal care & household
  { name: 'Hand Wash', nameBn: 'হ্যান্ড ওয়াশ', cat: 'Personal Care', sub: 'Soap & Hand Wash', unit: 'bottle', price: 95, stock: 60, pack: '250 ml', desc: 'Liquid hand wash, 250 ml.', descBn: 'তরল হ্যান্ড ওয়াশ, ২৫০ মি.লি.।' },
  { name: 'Bathing Soap', nameBn: 'গোসলের সাবান', cat: 'Personal Care', sub: 'Soap & Hand Wash', unit: 'piece', price: 40, stock: 120, desc: 'Bathing soap bar.', descBn: 'গোসলের সাবান।' },
  { name: 'Dishwashing Liquid', nameBn: 'থালা-বাসন ধোয়ার তরল', cat: 'Household', sub: 'Cleaning Supplies', unit: 'bottle', price: 120, stock: 50, pack: '500 ml', desc: 'Dishwashing liquid, 500 ml.', descBn: 'থালা-বাসন ধোয়ার তরল, ৫০০ মি.লি.।' },
];

async function seedUnits() {
  const map = new Map<string, string>();
  for (const [i, u] of units.entries()) {
    const row = await prisma.unit.upsert({
      where: { code: u.code },
      // do not overwrite edits the admin made later
      update: {},
      create: { ...u, displayOrder: i },
    });
    map.set(u.code, row.id);
  }
  console.log(`  ✓ ${units.length} units`);
  return map;
}

async function seedCategories() {
  const catIds = new Map<string, string>();
  const subIds = new Map<string, string>();
  for (const [ci, cat] of categories.entries()) {
    const catSlug = slug(cat.name);
    const category = await prisma.category.upsert({
      where: { slug: catSlug },
      update: { nameBn: cat.nameBn },
      create: {
        name: cat.name,
        nameBn: cat.nameBn,
        slug: catSlug,
        status: 'ACTIVE',
        isHomepage: true,
        displayOrder: ci,
      },
    });
    catIds.set(cat.name, category.id);
    for (const [si, sub] of cat.subs.entries()) {
      const subSlug = `${catSlug}-${slug(sub.name)}`;
      const row = await prisma.subCategory.upsert({
        where: { slug: subSlug },
        update: { nameBn: sub.nameBn },
        create: {
          name: sub.name,
          nameBn: sub.nameBn,
          slug: subSlug,
          parentCategoryId: category.id,
          status: 'ACTIVE',
          displayOrder: si,
        },
      });
      subIds.set(`${cat.name}|${sub.name}`, row.id);
    }
  }
  console.log(
    `  ✓ ${categories.length} categories, ${subIds.size} sub-categories`,
  );
  return { catIds, subIds };
}

async function seedProducts(
  unitIds: Map<string, string>,
  catIds: Map<string, string>,
  subIds: Map<string, string>,
) {
  let n = 0;
  for (const p of products) {
    const categoryId = catIds.get(p.cat);
    const subCategoryId = subIds.get(`${p.cat}|${p.sub}`);
    const unitId = unitIds.get(p.unit);
    if (!categoryId || !subCategoryId || !unitId) {
      throw new Error(`Seed data problem for product "${p.name}"`);
    }
    const regular = p.regular ?? p.price;
    const data = {
      nameBn: p.nameBn,
      description: p.desc,
      descriptionBn: p.descBn,
      shortDescription: p.desc,
      shortDescriptionBn: p.descBn,
      categoryId,
      subCategoryId,
      categoryName: p.cat,
      subCategoryName: p.sub,
      unitId,
      packSize: p.pack ?? null,
      sellStep: p.step ?? null,
      minQty: p.minQty ?? null,
      isWeighed: p.weighed ?? false,
      buyingPrice: Math.round(p.price * 0.85),
      regularPrice: regular,
      sellingPrice: p.price,
      isDiscounted: regular > p.price,
      stock: p.stock,
      lowStockThreshold: 10,
      isFeatured: p.featured ?? false,
      status: 'ACTIVE' as const,
    };
    await prisma.product.upsert({
      where: { slug: slug(p.name) },
      update: data,
      create: { name: p.name, slug: slug(p.name), ...data },
    });
    n++;
  }
  console.log(`  ✓ ${n} demo products`);
}

async function seedStoreName() {
  // Only create it: never overwrite what the admin saved in Settings.
  await prisma.siteSetting.upsert({
    where: { key: 'site' },
    update: {},
    create: {
      key: 'site',
      group: 'general',
      value: JSON.stringify({
        storeName: 'Bazar Shodai',
        tagline: 'Fresh daily needs, delivered to your door in Shahrasti',
        address:
          'Kalibari Bazar, near Kalibari High School field, Shahrasti, Chandpur',
        currency: 'BDT',
        currencySymbol: '৳',
      }),
    },
  });
  console.log('  ✓ store name and address');
}

async function seedSuperAdmin() {
  const email = (process.env.SEED_SUPERADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.SEED_SUPERADMIN_PASSWORD || '';
  const name = (process.env.SEED_SUPERADMIN_NAME || 'Super Admin').trim();
  const rawPhone = process.env.SEED_SUPERADMIN_PHONE || '';

  if (!email || !password) {
    console.log(
      '  - Super Admin not created: set SEED_SUPERADMIN_EMAIL and SEED_SUPERADMIN_PASSWORD in server/.env, then run the seed again.',
    );
    return;
  }
  if (password.length < 8) {
    throw new Error('SEED_SUPERADMIN_PASSWORD must be at least 8 characters');
  }
  let phone: string | null = null;
  if (rawPhone.trim()) {
    phone = normalizeBdPhone(rawPhone);
    if (!isBdMobile(phone)) {
      throw new Error(
        'SEED_SUPERADMIN_PHONE must be a Bangladeshi mobile number, e.g. 01712345678',
      );
    }
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`  - Super Admin ${email} already exists, left unchanged`);
    return;
  }
  await prisma.user.create({
    data: {
      email,
      name,
      phone,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      passwordHash: await argon2.hash(password),
      emailVerified: true,
      language: 'bn',
    },
  });
  console.log(`  ✓ Super Admin created: ${email}`);
}

async function main() {
  console.log('Seeding Bazar Shodai...');
  const unitIds = await seedUnits();
  const { catIds, subIds } = await seedCategories();
  if (process.env.SEED_DEMO_PRODUCTS !== 'false') {
    await seedProducts(unitIds, catIds, subIds);
  } else {
    console.log('  - demo products skipped (SEED_DEMO_PRODUCTS=false)');
  }
  await seedStoreName();
  await seedSuperAdmin();
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

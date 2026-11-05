/**
 * Generates or resolves authentic Bangla and English descriptions for products,
 * ensuring products without a Bangla description in the database never display
 * raw English text when the app or storefront is in Bangla (bn) mode.
 */

export interface ProductDescriptionInput {
  name?: string;
  nameBn?: string;
  banglaName?: string;
  category?: string | { slug?: string; name?: string; nameBn?: string };
  categoryName?: string;
  categorySlug?: string;
  description?: string | null;
  descriptionBn?: string | null;
  shortDescription?: string | null;
  shortDescriptionBn?: string | null;
  medicineMeta?: unknown;
  dosageForm?: string;
  isMedicine?: boolean;
}

export function getLocalizedDescription(
  product?: ProductDescriptionInput | null,
  isBn: boolean = true,
): string {
  if (!product) {
    return isBn
      ? '১০০% তাজা ও স্বাস্থ্যসম্মত পণ্য। পরিবারের সুস্বাস্থ্য নিশ্চিত করতে বিশেষ যত্নসহকারে বাছাই ও সরবরাহকৃত।'
      : '100% fresh, premium-grade produce carefully sourced and packaged under hygienic standards.';
  }

  const name = (isBn ? product.nameBn || product.banglaName || product.name : product.name) || '';
  const catSlug = (
    product.categorySlug ||
    (typeof product.category === 'object' ? product.category?.slug : product.category) ||
    ''
  ).toLowerCase();

  const isMed =
    Boolean(product.medicineMeta) ||
    Boolean(product.dosageForm) ||
    product.isMedicine ||
    catSlug === 'medicine' ||
    catSlug.includes('medicine');

  // If in English mode
  if (!isBn) {
    if (product.description && product.description.trim()) {
      return product.description.trim();
    }
    if (product.shortDescription && product.shortDescription.trim()) {
      return product.shortDescription.trim();
    }
    if (isMed) {
      return `${name || 'This medicine'} is a genuine pharmaceutical product. Read packaging label carefully before use and take as advised by a registered physician.`;
    }
    return `100% fresh and genuine quality ${name || 'produce'}. Carefully packed and delivered for your daily family needs.`;
  }

  // In Bangla mode (isBn === true)
  // 1. If explicit Bangla description exists, use it
  if (product.descriptionBn && product.descriptionBn.trim()) {
    return product.descriptionBn.trim();
  }
  if (product.shortDescriptionBn && product.shortDescriptionBn.trim()) {
    return product.shortDescriptionBn.trim();
  }

  // 2. Synthesize context-aware authentic Bangla description based on category/type
  if (isMed) {
    return `${name} একটি কার্যকরী ও গুণগত মানসম্পন্ন ওষুধ। সেবনের পূর্বে প্যাকেটের নির্দেশনাবলী ভালোভাবে দেখে নিন এবং রেজিস্টার্ড চিকিৎসকের পরামর্শ অনুযায়ী সঠিক মাত্রায় গ্রহণ করুন। শিশুদের নাগালের বাইরে শুষ্ক ও ঠাণ্ডা স্থানে সংরক্ষণ করুন।`;
  }

  if (catSlug.includes('fish') || catSlug.includes('mach')) {
    return `তাজা ও রাসায়নিকমুক্ত দেশি ${name}। সরাসরি স্থানীয় নদী ও হাওর অববাহিকা থেকে সংগৃহীত। রান্নার জন্য সম্পূর্ণ নিরাপদ ও স্বাস্থ্যসম্মত।`;
  }

  if (catSlug.includes('meat') || catSlug.includes('mangsho') || catSlug.includes('chicken') || catSlug.includes('beef') || catSlug.includes('mutton')) {
    return `১০০% হালাল ও স্বাস্থ্যসম্মত উপায়ে প্রক্রিয়াজাত তাজা ${name}। কোনো ক্ষতিকর প্রিজারভেটিভ নেই, পারিবারিক রান্নার জন্য সম্পূর্ণ নিরাপদ।`;
  }

  if (catSlug.includes('veg') || catSlug.includes('fruit') || catSlug.includes('sobji') || catSlug.includes('fol')) {
    return `সরাসরি কৃষকের খামার থেকে সংগৃহীত সতেজ ও ফরমালিনমুক্ত ${name}। দৈনন্দিন পুষ্টি ও সতেজতার শতভাগ নিশ্চয়তা।`;
  }

  if (catSlug.includes('dairy') || catSlug.includes('egg') || catSlug.includes('dudh') || catSlug.includes('dim')) {
    return `খাঁটি ও পুষ্টিকর ${name}। পরিবারের প্রতিদিনের পুষ্টি চাহিদা মেটাতে স্বাস্থ্যসম্মত ও নিরাপদভাবে প্যাকেটজাত।`;
  }

  return `১০০% খাঁটি ও সেরা মানের ${name}। আপনার পরিবারের সুস্থতা ও পুষ্টি নিশ্চিত করতে যাচাইকৃত স্বাস্থ্যকর পণ্য।`;
}

export function getLocalizedShortDescription(
  product?: ProductDescriptionInput | null,
  isBn: boolean = true,
): string {
  if (!product) {
    return isBn ? 'তাজা ও খাঁটি পণ্য' : 'Fresh and authentic';
  }

  const name = (isBn ? product.nameBn || product.banglaName || product.name : product.name) || '';

  if (!isBn) {
    return product.shortDescription?.trim() || `Fresh quality ${name}`;
  }

  if (product.shortDescriptionBn && product.shortDescriptionBn.trim()) {
    return product.shortDescriptionBn.trim();
  }
  if (product.descriptionBn && product.descriptionBn.trim()) {
    return product.descriptionBn.trim().slice(0, 80);
  }

  return `১০০% খাঁটি ও মানসম্মত ${name}`;
}


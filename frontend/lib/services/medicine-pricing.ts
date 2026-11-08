import type { MedicineMeta, Product } from '@/lib/types';

export type DiscountEligibility = 'INHERIT_GLOBAL' | 'ALL_CASES' | 'MIN_STRIP_ONLY' | 'NO_DISCOUNT';

export interface MedicinePriceBreakdown {
  unitsPerStrip: number;
  totalStrips: number;
  looseTabs: number;
  totalTabs: number;
  stripPrice: number;
  tabPrice: number;
  effectiveStripPrice: number;
  effectiveTabPrice: number;
  stripTotal: number;
  tabTotal: number;
  finalTotal: number;
  originalTotal: number;
  totalSavings: number;
  discountPercent: number;
  discountApplied: boolean;
}

/**
 * Extracts how many tablets/capsules are in one full pata (strip).
 * 1. Checks explicit `unitsPerStrip` if present on meta.
 * 2. Parses MedEx `packSizeInfo` (e.g. "1 Strip (10 Tablets)", "10's strip", "6's strip").
 * 3. Uses ratio of `mrpStrip / mrpUnit` if both exist and result in an integer > 1.
 * 4. Defaults to 10.
 */
export function parseUnitsPerStrip(meta?: MedicineMeta | null, fallback = 10): number {
  if (!meta) return fallback;

  // 1. Explicit meta field if available
  const explicit = (meta as unknown as Record<string, unknown>).unitsPerStrip;
  if (typeof explicit === 'number' && explicit > 0) {
    return Math.round(explicit);
  }

  // 2. Parse from MedEx packSizeInfo string
  if (meta.packSizeInfo) {
    const text = meta.packSizeInfo;
    // Patterns like: "1 Strip (10 Tablets)", "(10's strip)", "10's pack", "6 Tablets", etc.
    const matchStripTabs = text.match(/(\d+)\s*(?:tablet|capsule|tab|cap)/i);
    if (matchStripTabs && Number(matchStripTabs[1]) > 0) {
      return Number(matchStripTabs[1]);
    }
    const matchStripDigits = text.match(/(\d+)\s*'\s*s\s*strip/i);
    if (matchStripDigits && Number(matchStripDigits[1]) > 0) {
      return Number(matchStripDigits[1]);
    }
    const matchGeneralDigits = text.match(/(\d+)\s*'\s*s/i);
    if (matchGeneralDigits && Number(matchGeneralDigits[1]) > 0) {
      return Number(matchGeneralDigits[1]);
    }
  }

  // 3. Fallback: Ratio of strip MRP to unit MRP
  if (meta.mrpStrip && meta.mrpUnit && meta.mrpUnit > 0) {
    const ratio = Math.round(Number(meta.mrpStrip) / Number(meta.mrpUnit));
    if (ratio >= 2 && ratio <= 100) {
      return ratio;
    }
  }

  // 4. Default standard in Bangladesh
  return fallback;
}

/**
 * Checks whether the product is an oral solid medicine (Tablet / Capsule)
 * that requires the Strip vs Loose Tablet purchase options.
 */
export function isOralSolidMedicine(product: Product): boolean {
  const meta = product.medicineMeta;
  if (!meta) return false;
  const form = (meta.dosageForm || '').toLowerCase().trim();
  return (
    form.includes('tablet') ||
    form.includes('capsule') ||
    form.includes('cap') ||
    form.includes('tab')
  );
}

/**
 * Core pricing calculation engine for medicine purchase.
 * 
 * Rules:
 * - ALL_CASES: Discount applied to every tablet (both full strips and loose tabs).
 * - MIN_STRIP_ONLY: Customer must buy >= 1 full pata (totalStrips >= 1) to unlock the discount.
 *   Once unlocked, ALL tablets (both full strips and loose tabs, e.g. all 13 tabs) get the discount!
 *   If customer buys < 1 pata (only loose tabs), no discount is applied.
 * - NO_DISCOUNT: Full MRP for all quantities.
 */
export function calculateMedicinePrice(params: {
  product: Product;
  strips: number;
  looseTabs: number;
  globalDiscountEligibility?: DiscountEligibility;
  defaultDiscountPercent?: number;
}): MedicinePriceBreakdown {
  const {
    product,
    strips: rawStrips,
    looseTabs: rawLoose,
    globalDiscountEligibility = 'MIN_STRIP_ONLY',
    defaultDiscountPercent = 0,
  } = params;

  const meta = product.medicineMeta;
  const unitsPerStrip = parseUnitsPerStrip(meta);

  // Rollover any overflow loose tablets into full strips
  const totalLooseRaw = Math.max(0, rawLoose);
  const additionalStrips = Math.floor(totalLooseRaw / unitsPerStrip);
  const looseTabs = totalLooseRaw % unitsPerStrip;
  const totalStrips = Math.max(0, rawStrips) + additionalStrips;
  const totalTabs = totalStrips * unitsPerStrip + looseTabs;

  // Base pricing
  // If product.price is strip price, unitPrice is product.price / unitsPerStrip or meta.mrpUnit
  const stripPrice = Number(product.price) || (meta?.mrpStrip ? Number(meta.mrpStrip) : 0);
  const tabPrice = meta?.mrpUnit
    ? Number(meta.mrpUnit)
    : stripPrice > 0 && unitsPerStrip > 0
    ? Math.round((stripPrice / unitsPerStrip) * 100) / 100
    : 0;

  // Discount configuration
  const productDiscount = product.discount ?? defaultDiscountPercent;
  const perMedicineSetting = ((meta as unknown as Record<string, unknown>)?.discountEligibility as DiscountEligibility) || 'INHERIT_GLOBAL';
  const effectiveRule: DiscountEligibility =
    perMedicineSetting === 'INHERIT_GLOBAL'
      ? globalDiscountEligibility
      : perMedicineSetting;

  let stripDiscountRate = 0;
  let tabDiscountRate = 0;
  let discountApplied = false;

  if (effectiveRule !== 'NO_DISCOUNT' && productDiscount > 0) {
    if (effectiveRule === 'ALL_CASES') {
      stripDiscountRate = productDiscount / 100;
      tabDiscountRate = productDiscount / 100;
      discountApplied = true;
    } else if (effectiveRule === 'MIN_STRIP_ONLY') {
      // The user's exact rule: If order contains >= 1 full pata, ALL tablets get the discount!
      if (totalStrips >= 1) {
        stripDiscountRate = productDiscount / 100;
        tabDiscountRate = productDiscount / 100;
        discountApplied = true;
      } else {
        // Less than 1 full pata (only loose tabs): standard unit MRP (no discount)
        stripDiscountRate = 0;
        tabDiscountRate = 0;
        discountApplied = false;
      }
    }
  }

  const effectiveStripPrice =
    Math.round(stripPrice * (1 - stripDiscountRate) * 100) / 100;
  const effectiveTabPrice =
    Math.round(tabPrice * (1 - tabDiscountRate) * 100) / 100;

  const stripTotal = Math.round(totalStrips * effectiveStripPrice * 100) / 100;
  const tabTotal = Math.round(looseTabs * effectiveTabPrice * 100) / 100;
  const finalTotal = Math.round((stripTotal + tabTotal) * 100) / 100;

  const originalTotal = Math.round((totalStrips * stripPrice + looseTabs * tabPrice) * 100) / 100;
  const totalSavings = Math.max(0, Math.round((originalTotal - finalTotal) * 100) / 100);

  return {
    unitsPerStrip,
    totalStrips,
    looseTabs,
    totalTabs,
    stripPrice,
    tabPrice,
    effectiveStripPrice,
    effectiveTabPrice,
    stripTotal,
    tabTotal,
    finalTotal,
    originalTotal,
    totalSavings,
    discountPercent: productDiscount,
    discountApplied,
  };
}

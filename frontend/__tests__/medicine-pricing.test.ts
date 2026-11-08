/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  parseUnitsPerStrip,
  isOralSolidMedicine,
  calculateMedicinePrice,
} from '@/lib/services/medicine-pricing';
import type { Product } from '@/lib/types';

function createMockMedicine(overrides: Partial<Product> = {}): Product {
  return {
    id: 'med-123',
    slug: 'napa-500mg-tablet',
    name: 'Napa 500 mg Tablet',
    price: 50, // Strip price = ৳50
    discount: 8, // 8% off
    stock: 999,
    trackStock: false,
    images: [],
    unit: {
      code: 'strip',
      label: 'পাতা',
      allowDecimal: false,
      step: 1,
      minQty: 1,
    },
    medicineMeta: {
      id: 'meta-123',
      genericName: 'Paracetamol',
      genericSlug: 'paracetamol',
      dosageForm: 'Tablet',
      strength: '500 mg',
      manufacturer: 'Beximco Pharmaceuticals Ltd.',
      type: 'OTC',
      mrpUnit: 5, // ৳5 per tablet
      mrpStrip: 50, // ৳50 per strip
      packSizeInfo: '1 Strip (10 Tablets)',
    },
    ...overrides,
  } as Product;
}

describe('Medicine Pricing & Rule Engine', () => {
  describe('parseUnitsPerStrip', () => {
    it('extracts units from packSizeInfo "1 Strip (10 Tablets)"', () => {
      const units = parseUnitsPerStrip({
        packSizeInfo: '1 Strip (10 Tablets)',
      } as any);
      expect(units).toBe(10);
    });

    it('extracts units from packSizeInfo "6\'s strip"', () => {
      const units = parseUnitsPerStrip({
        packSizeInfo: "6's strip",
      } as any);
      expect(units).toBe(6);
    });

    it('extracts units from packSizeInfo "20 Tablets"', () => {
      const units = parseUnitsPerStrip({
        packSizeInfo: '20 Tablets in a strip',
      } as any);
      expect(units).toBe(20);
    });

    it('falls back to mrpStrip / mrpUnit ratio if packSizeInfo is absent', () => {
      const units = parseUnitsPerStrip({
        mrpStrip: 50,
        mrpUnit: 5,
        packSizeInfo: null,
      } as any);
      expect(units).toBe(10);
    });

    it('defaults to 10 if no hints available', () => {
      const units = parseUnitsPerStrip(null);
      expect(units).toBe(10);
    });
  });

  describe('isOralSolidMedicine', () => {
    it('returns true for Tablet and Capsule', () => {
      const tab = createMockMedicine();
      expect(isOralSolidMedicine(tab)).toBe(true);

      const cap = createMockMedicine({
        medicineMeta: { ...tab.medicineMeta!, dosageForm: 'Capsule' },
      });
      expect(isOralSolidMedicine(cap)).toBe(true);
    });

    it('returns false for liquids, drops, and ointments', () => {
      const syrup = createMockMedicine({
        medicineMeta: { ...createMockMedicine().medicineMeta!, dosageForm: 'Syrup' },
      });
      expect(isOralSolidMedicine(syrup)).toBe(false);

      const drop = createMockMedicine({
        medicineMeta: { ...createMockMedicine().medicineMeta!, dosageForm: 'Eye Drops' },
      });
      expect(isOralSolidMedicine(drop)).toBe(false);
    });
  });

  describe('calculateMedicinePrice', () => {
    const med = createMockMedicine(); // ৳50/strip, ৳5/tab, 8% discount

    it('Scenario A: 1 Full Pata with MIN_STRIP_ONLY', () => {
      const result = calculateMedicinePrice({
        product: med,
        strips: 1,
        looseTabs: 0,
        globalDiscountEligibility: 'MIN_STRIP_ONLY',
      });

      expect(result.totalStrips).toBe(1);
      expect(result.looseTabs).toBe(0);
      expect(result.effectiveStripPrice).toBe(46); // 50 - 8% = 46
      expect(result.finalTotal).toBe(46);
      expect(result.totalSavings).toBe(4);
      expect(result.discountApplied).toBe(true);
    });

    it('Scenario B: 3 Loose Tabs with MIN_STRIP_ONLY (less than 1 full pata)', () => {
      const result = calculateMedicinePrice({
        product: med,
        strips: 0,
        looseTabs: 3,
        globalDiscountEligibility: 'MIN_STRIP_ONLY',
      });

      expect(result.totalStrips).toBe(0);
      expect(result.looseTabs).toBe(3);
      expect(result.effectiveTabPrice).toBe(5); // No discount, full MRP
      expect(result.finalTotal).toBe(15);
      expect(result.totalSavings).toBe(0);
      expect(result.discountApplied).toBe(false);
    });

    it('Scenario B2: 3 Loose Tabs with ALL_CASES', () => {
      const result = calculateMedicinePrice({
        product: med,
        strips: 0,
        looseTabs: 3,
        globalDiscountEligibility: 'ALL_CASES',
      });

      expect(result.totalStrips).toBe(0);
      expect(result.looseTabs).toBe(3);
      expect(result.effectiveTabPrice).toBe(4.6); // 5 - 8% = 4.60
      expect(result.finalTotal).toBe(13.8); // 3 * 4.60 = 13.80
      expect(result.totalSavings).toBe(1.2);
      expect(result.discountApplied).toBe(true);
    });

    it('Scenario C (User Core Rule): 1 Pata + 3 Tabs (13 tabs) with MIN_STRIP_ONLY', () => {
      // User rule: Since customer bought >= 1 full pata, ALL 13 tabs get the discount!
      const result = calculateMedicinePrice({
        product: med,
        strips: 1,
        looseTabs: 3,
        globalDiscountEligibility: 'MIN_STRIP_ONLY',
      });

      expect(result.totalStrips).toBe(1);
      expect(result.looseTabs).toBe(3);
      expect(result.totalTabs).toBe(13);
      expect(result.effectiveStripPrice).toBe(46);
      expect(result.effectiveTabPrice).toBe(4.6); // Loose tabs ALSO get 8% discount!
      expect(result.stripTotal).toBe(46);
      expect(result.tabTotal).toBe(13.8);
      expect(result.finalTotal).toBe(59.8);
      expect(result.originalTotal).toBe(65);
      expect(result.totalSavings).toBe(5.2);
      expect(result.discountApplied).toBe(true);
    });

    it('Auto-rollover: Selecting 10 loose tabs converts into +1 full strip and 0 loose tabs', () => {
      const result = calculateMedicinePrice({
        product: med,
        strips: 0,
        looseTabs: 10,
        globalDiscountEligibility: 'MIN_STRIP_ONLY',
      });

      expect(result.totalStrips).toBe(1);
      expect(result.looseTabs).toBe(0);
      expect(result.finalTotal).toBe(46);
    });

    it('Auto-rollover: Selecting 13 loose tabs converts into 1 full strip + 3 loose tabs', () => {
      const result = calculateMedicinePrice({
        product: med,
        strips: 0,
        looseTabs: 13,
        globalDiscountEligibility: 'MIN_STRIP_ONLY',
      });

      expect(result.totalStrips).toBe(1);
      expect(result.looseTabs).toBe(3);
      expect(result.finalTotal).toBe(59.8);
    });

    it('Per-medicine override: NO_DISCOUNT ignores global discount', () => {
      const noDiscMed = createMockMedicine({
        medicineMeta: {
          ...med.medicineMeta!,
          discountEligibility: 'NO_DISCOUNT',
        } as any,
      });

      const result = calculateMedicinePrice({
        product: noDiscMed,
        strips: 1,
        looseTabs: 3,
        globalDiscountEligibility: 'MIN_STRIP_ONLY',
      });

      expect(result.effectiveStripPrice).toBe(50);
      expect(result.effectiveTabPrice).toBe(5);
      expect(result.finalTotal).toBe(65);
      expect(result.totalSavings).toBe(0);
      expect(result.discountApplied).toBe(false);
    });

    it('Per-medicine override: ALL_CASES applies discount even if global is MIN_STRIP_ONLY and quantity < 1 strip', () => {
      const allCasesMed = createMockMedicine({
        medicineMeta: {
          ...med.medicineMeta!,
          discountEligibility: 'ALL_CASES',
        } as any,
      });

      const result = calculateMedicinePrice({
        product: allCasesMed,
        strips: 0,
        looseTabs: 3,
        globalDiscountEligibility: 'MIN_STRIP_ONLY',
      });

      expect(result.effectiveTabPrice).toBe(4.6);
      expect(result.finalTotal).toBe(13.8);
      expect(result.totalSavings).toBe(1.2);
      expect(result.discountApplied).toBe(true);
    });
  });
});

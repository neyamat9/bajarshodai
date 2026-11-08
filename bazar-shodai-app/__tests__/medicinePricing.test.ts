import {
  calculateMedicinePrice,
  parseUnitsPerStrip,
  isOralSolidMedicine,
} from '../src/services/medicinePricing';

describe('Medicine Pricing & Discount Engine (Mobile App)', () => {
  describe('isOralSolidMedicine', () => {
    it('identifies oral solid dosage forms', () => {
      expect(isOralSolidMedicine('Tablet')).toBe(true);
      expect(isOralSolidMedicine('Capsule')).toBe(true);
      expect(isOralSolidMedicine('Film Coated Tablet')).toBe(true);
      expect(isOralSolidMedicine('Extended Release Capsule')).toBe(true);
      expect(isOralSolidMedicine('cap')).toBe(true);
      expect(isOralSolidMedicine('tab')).toBe(true);
    });

    it('rejects non-solid or liquid dosage forms', () => {
      expect(isOralSolidMedicine('Syrup')).toBe(false);
      expect(isOralSolidMedicine('Suspension')).toBe(false);
      expect(isOralSolidMedicine('Oral Drops')).toBe(false);
      expect(isOralSolidMedicine('Ointment')).toBe(false);
      expect(isOralSolidMedicine('Cream')).toBe(false);
      expect(isOralSolidMedicine('Injection')).toBe(false);
      expect(isOralSolidMedicine(undefined)).toBe(false);
    });
  });

  describe('parseUnitsPerStrip', () => {
    it('uses explicit unitsPerStrip if provided', () => {
      expect(parseUnitsPerStrip({ unitsPerStrip: 14 })).toBe(14);
    });

    it('extracts units from packSizeInfo string', () => {
      expect(parseUnitsPerStrip({ packSizeInfo: '1 Strip (10 Tablets)' })).toBe(10);
      expect(parseUnitsPerStrip({ packSizeInfo: '10’s strip' })).toBe(10);
      expect(parseUnitsPerStrip({ packSizeInfo: "10's strip" })).toBe(10);
      expect(parseUnitsPerStrip({ packSizeInfo: '6 Tablets pack' })).toBe(6);
      expect(parseUnitsPerStrip({ packSizeInfo: "14's" })).toBe(14);
    });

    it('calculates ratio from mrpStrip / mrpUnit', () => {
      expect(parseUnitsPerStrip({ mrpStrip: 50, mrpUnit: 5 })).toBe(10);
      expect(parseUnitsPerStrip({ mrpStrip: 42, mrpUnit: 7 })).toBe(6);
    });

    it('falls back to 10 when no info available', () => {
      expect(parseUnitsPerStrip(null)).toBe(10);
      expect(parseUnitsPerStrip({})).toBe(10);
    });
  });

  describe('calculateMedicinePrice', () => {
    // Scenario A: 1 Full Pata (Strip MRP 50, 8% off)
    it('Scenario A: calculates 1 full strip with 8% discount', () => {
      const res = calculateMedicinePrice({
        strips: 1,
        looseTabs: 0,
        stripPrice: 50,
        discountPercent: 8,
        discountEligibility: 'MIN_STRIP_ONLY',
      });

      expect(res.totalStrips).toBe(1);
      expect(res.looseTabs).toBe(0);
      expect(res.effectiveStripPrice).toBe(46);
      expect(res.finalTotal).toBe(46);
      expect(res.totalSavings).toBe(4);
      expect(res.discountApplied).toBe(true);
    });

    // Scenario B: 3 Loose Tabs under MIN_STRIP_ONLY (Unit MRP 5, < 1 pata -> NO discount)
    it('Scenario B: 3 loose tabs under MIN_STRIP_ONLY receives no discount', () => {
      const res = calculateMedicinePrice({
        strips: 0,
        looseTabs: 3,
        stripPrice: 50,
        tabPrice: 5,
        discountPercent: 8,
        discountEligibility: 'MIN_STRIP_ONLY',
      });

      expect(res.totalStrips).toBe(0);
      expect(res.looseTabs).toBe(3);
      expect(res.effectiveTabPrice).toBe(5);
      expect(res.finalTotal).toBe(15);
      expect(res.totalSavings).toBe(0);
      expect(res.discountApplied).toBe(false);
    });

    // Scenario B2: 3 Loose Tabs under ALL_CASES (8% discount applies to loose tabs)
    it('Scenario B2: 3 loose tabs under ALL_CASES receives discount', () => {
      const res = calculateMedicinePrice({
        strips: 0,
        looseTabs: 3,
        stripPrice: 50,
        tabPrice: 5,
        discountPercent: 8,
        discountEligibility: 'ALL_CASES',
      });

      expect(res.totalStrips).toBe(0);
      expect(res.looseTabs).toBe(3);
      expect(res.effectiveTabPrice).toBe(4.6);
      expect(res.finalTotal).toBe(13.8);
      expect(res.totalSavings).toBe(1.2);
      expect(res.discountApplied).toBe(true);
    });

    // Scenario C: 1 Pata + 3 Loose Tabs under MIN_STRIP_ONLY (Total 13 tabs, ALL get discount!)
    it('Scenario C: 1 strip + 3 loose tabs unlocks discount for all 13 tablets', () => {
      const res = calculateMedicinePrice({
        strips: 1,
        looseTabs: 3,
        stripPrice: 50,
        tabPrice: 5,
        discountPercent: 8,
        discountEligibility: 'MIN_STRIP_ONLY',
      });

      expect(res.totalStrips).toBe(1);
      expect(res.looseTabs).toBe(3);
      expect(res.effectiveStripPrice).toBe(46); // 50 - 8%
      expect(res.effectiveTabPrice).toBe(4.6); // 5 - 8%
      expect(res.stripTotal).toBe(46);
      expect(res.tabTotal).toBe(13.8);
      expect(res.finalTotal).toBe(59.8);
      expect(res.totalSavings).toBe(5.2);
      expect(res.discountApplied).toBe(true);
    });

    // Scenario: Rollover loose tablets into strips
    it('automatically rolls over loose tabs into full strips when reaching unitsPerStrip', () => {
      const res = calculateMedicinePrice({
        strips: 1,
        looseTabs: 13, // 10 makes 1 strip, 3 loose remain
        stripPrice: 50,
        tabPrice: 5,
        discountPercent: 8,
        discountEligibility: 'MIN_STRIP_ONLY',
      });

      expect(res.totalStrips).toBe(2);
      expect(res.looseTabs).toBe(3);
      expect(res.totalTabs).toBe(23);
    });

    // Scenario: NO_DISCOUNT rule
    it('applies full MRP when rule is NO_DISCOUNT even if discount percent is provided', () => {
      const res = calculateMedicinePrice({
        strips: 1,
        looseTabs: 3,
        stripPrice: 50,
        tabPrice: 5,
        discountPercent: 8,
        discountEligibility: 'NO_DISCOUNT',
      });

      expect(res.effectiveStripPrice).toBe(50);
      expect(res.effectiveTabPrice).toBe(5);
      expect(res.finalTotal).toBe(65);
      expect(res.totalSavings).toBe(0);
      expect(res.discountApplied).toBe(false);
    });
  });
});


import { toBengaliNumerals, formatBdt } from '../src/utils/format';

describe('format utilities', () => {
  describe('toBengaliNumerals', () => {
    it('converts English digits to Bengali numerals correctly', () => {
      expect(toBengaliNumerals(0)).toBe('০');
      expect(toBengaliNumerals(12345)).toBe('১২৩৪৫');
      expect(toBengaliNumerals('67890')).toBe('৬৭৮৯০');
    });

    it('preserves non-numeric characters like commas and decimals', () => {
      expect(toBengaliNumerals('1,250.50')).toBe('১,২৫০.৫০');
      expect(toBengaliNumerals('Phone: 01711-223344')).toBe('Phone: ০১৭১১-২২৩৩৪৪');
    });
  });

  describe('formatBdt', () => {
    it('formats amount in Bengali locale by default', () => {
      const formatted = formatBdt(500);
      expect(formatted).toBe('৳৫০০');
    });

    it('formats amount in English locale when requested', () => {
      const formatted = formatBdt(1250, { locale: 'en' });
      expect(formatted).toBe('৳1,250');
    });

    it('handles zero and decimal values properly', () => {
      expect(formatBdt(0, { locale: 'en' })).toBe('৳0');
      expect(formatBdt(99.5, { locale: 'en', showDecimals: true })).toBe('৳99.50');
    });
  });
});

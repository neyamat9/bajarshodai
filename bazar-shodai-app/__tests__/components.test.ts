import { toBengaliNumerals, formatBdt } from '../src/utils/format';
import { TouchTarget, Radius, Spacing } from '../src/constants/layout';

describe('design tokens & component layout integrity', () => {
  it('satisfies WCAG touch target standards of at least 44px', () => {
    expect(TouchTarget.min).toBeGreaterThanOrEqual(44);
    expect(TouchTarget.comfortable).toBeGreaterThanOrEqual(48);
  });

  it('provides consistent spacing scale and border radii', () => {
    expect(Spacing.base).toBe(16);
    expect(Spacing.sm).toBe(8);
    expect(Radius.brand).toBe(4);
    expect(Radius.full).toBe(9999);
  });

  it('correctly handles edge-case price calculations with zero and large amounts', () => {
    expect(formatBdt(0, { locale: 'en' })).toBe('৳0');
    expect(formatBdt(100000, { locale: 'en' })).toBe('৳1,00,000');
    expect(formatBdt(500000, { locale: 'bn' })).toBe(`৳${toBengaliNumerals('5,00,000')}`);
  });

  it('validates Bangladeshi mobile numbers according to national format', () => {
    const isValidBdMobile = (phone: string) => /^(?:\+8801|01)[3-9]\d{8}$/.test(phone.trim());

    // Valid Bangladeshi mobile numbers (Grameenphone, Banglalink, Robi, Teletalk)
    expect(isValidBdMobile('01712345678')).toBe(true);
    expect(isValidBdMobile('+8801812345678')).toBe(true);
    expect(isValidBdMobile('01912345678')).toBe(true);
    expect(isValidBdMobile('01512345678')).toBe(true);
    expect(isValidBdMobile('01312345678')).toBe(true);

    // Invalid numbers
    expect(isValidBdMobile('01212345678')).toBe(false); // Invalid operator prefix 012
    expect(isValidBdMobile('0171234567')).toBe(false); // Too short
    expect(isValidBdMobile('017123456789')).toBe(false); // Too long
    expect(isValidBdMobile('abcdefghijk')).toBe(false); // Non-numeric
  });

  it('manages quick view modal state cleanly', async () => {
    const { useQuickViewStore } = await import('../src/store/useQuickViewStore');
    expect(useQuickViewStore.getState().isOpen).toBe(false);

    useQuickViewStore.getState().openQuickView({
      id: 'prod-1',
      slug: 'fresh-potato',
      name: 'Fresh Potato',
      banglaName: 'তাজা আলু',
      price: 45,
      originalPrice: 50,
      unit: 'kg',
      stock: 20,
    });

    expect(useQuickViewStore.getState().isOpen).toBe(true);
    expect(useQuickViewStore.getState().product?.slug).toBe('fresh-potato');
    expect(useQuickViewStore.getState().product?.banglaName).toBe('তাজা আলু');

    useQuickViewStore.getState().closeQuickView();
    expect(useQuickViewStore.getState().isOpen).toBe(false);
    expect(useQuickViewStore.getState().product).toBeNull();
  });
});

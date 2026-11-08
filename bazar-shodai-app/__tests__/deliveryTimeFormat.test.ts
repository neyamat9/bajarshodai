import { formatDeliveryWindow } from '../src/utils/format';

describe('formatDeliveryWindow (Mobile App)', () => {
  const sampleUtc = '2026-11-12T10:00:00.000Z'; // 4:00 PM in Asia/Dhaka (UTC+6)

  it('returns empty string when no date or slot is provided', () => {
    expect(formatDeliveryWindow(null, null)).toBe('');
    expect(formatDeliveryWindow(undefined, undefined)).toBe('');
    expect(formatDeliveryWindow('', '')).toBe('');
  });

  it('formats date and hour window when only estimatedDelivery is provided (English)', () => {
    const formatted = formatDeliveryWindow(sampleUtc, null, 'en');
    expect(formatted).toContain('Nov 12, 2026');
    expect(formatted).toMatch(/4:00\s*PM/);
  });

  it('formats date and hour window when only estimatedDelivery is provided (Bengali)', () => {
    const formatted = formatDeliveryWindow(sampleUtc, null, 'bn');
    expect(formatted).toContain('১২');
    expect(formatted).toContain('৪:০০');
  });

  it('combines date and delivery slot when both are provided (English)', () => {
    const formatted = formatDeliveryWindow(sampleUtc, '3:00 PM - 5:00 PM', 'en');
    expect(formatted).toBe('Nov 12, 2026, 3:00 PM - 5:00 PM');
  });

  it('combines date and delivery slot with localized numerals when both are provided (Bengali)', () => {
    const formatted = formatDeliveryWindow(sampleUtc, '3:00 PM - 5:00 PM', 'bn');
    expect(formatted).toContain('১২');
    expect(formatted).toContain('৩:০০ PM - ৫:০০ PM');
  });

  it('returns only deliverySlot when estimatedDelivery is missing', () => {
    expect(formatDeliveryWindow(null, 'Within 1-2 hours', 'en')).toBe('Within 1-2 hours');
    expect(formatDeliveryWindow(undefined, 'Within 1-2 hours', 'en')).toBe('Within 1-2 hours');
  });
});


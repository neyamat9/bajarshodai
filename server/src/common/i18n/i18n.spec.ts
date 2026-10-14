import {
  bnDigits,
  fmtDate,
  fmtMoney,
  fmtNumber,
  normalizeLang,
  paymentLabel,
  statusLabel,
  tr,
} from './index';

describe('server i18n', () => {
  it('defaults to Bangla and understands English', () => {
    expect(normalizeLang(undefined)).toBe('bn');
    expect(normalizeLang('bn-BD')).toBe('bn');
    expect(normalizeLang('en')).toBe('en');
    expect(normalizeLang('en-US,en;q=0.9')).toBe('en');
  });

  it('writes Bangla digits', () => {
    expect(bnDigits('৳1,250.50')).toBe('৳১,২৫০.৫০');
    expect(fmtNumber('bn', 6245)).toBe('৬,২৪৫');
    expect(fmtNumber('en', 6245)).toBe('6,245');
    expect(fmtMoney('bn', 6245)).toBe('৳৬,২৪৫');
    expect(fmtMoney('en', 1250.5)).toBe('৳1,250.5');
  });

  it('formats dates in Bangladesh time', () => {
    // 20:00 UTC on 14 Oct is already 15 Oct in Dhaka
    const d = new Date('2026-10-14T20:00:00Z');
    expect(fmtDate('en', d)).toBe('15 Oct 2026');
    expect(fmtDate('bn', d)).toBe('১৫ অক্টোবর ২০২৬');
  });

  it('fills placeholders and falls back to the key for unknown messages', () => {
    expect(tr('en', 'order.placed.title', { n: 'BS-1' })).toBe('Order BS-1 received');
    expect(tr('bn', 'order.placed.title', { n: 'BS-1' })).toBe('অর্ডার BS-1 গ্রহণ করা হয়েছে');
    expect(tr('en', 'no.such.key')).toBe('no.such.key');
  });

  it('has a Bangla and English text for every order status and payment method', () => {
    for (const s of ['PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED', 'ON_HOLD']) {
      expect(statusLabel('bn', s)).not.toBe(s);
      expect(statusLabel('en', s)).not.toBe(s);
    }
    expect(paymentLabel('bn', 'BKASH')).toBe('বিকাশ');
    expect(paymentLabel('en', 'CASH_ON_DELIVERY')).toBe('Cash on Delivery');
  });
});

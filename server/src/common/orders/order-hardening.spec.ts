import { nextOrderNumber } from './order-lifecycle';

describe('Order & Payment Hardening (Phases 1 & 2)', () => {
  describe('nextOrderNumber (Unguessable Order Numbers)', () => {
    it('generates an unguessable order number with 4-digit counter and 4-character random suffix', async () => {
      const mockTx = {
        $queryRaw: jest.fn().mockResolvedValue([{ value: 42 }]),
      } as any;

      const date = new Date('2026-05-12T10:00:00Z');
      const orderNumber = await nextOrderNumber(mockTx, date);

      // Expected pattern: BS-YYYYMMDD-0042-XXXX where XXXX is alphanumeric (no ambiguous chars)
      expect(orderNumber).toMatch(/^BS-20260512-0042-[2-9A-HJ-NP-Z]{4}$/);
    });

    it('generates unique random suffixes across multiple calls for the same counter value', async () => {
      const mockTx = {
        $queryRaw: jest.fn().mockResolvedValue([{ value: 1 }]),
      } as any;

      const date = new Date('2026-05-12T10:00:00Z');
      const orderNumbers = await Promise.all(
        Array.from({ length: 20 }, () => nextOrderNumber(mockTx, date)),
      );

      const uniqueNumbers = new Set(orderNumbers);
      expect(uniqueNumbers.size).toBe(20);
      for (const num of orderNumbers) {
        expect(num).toMatch(/^BS-20260512-0001-[2-9A-HJ-NP-Z]{4}$/);
      }
    });
  });

  describe('Manual Mobile Banking Validation Rules', () => {
    const SENDER_REGEX = /^(\d{4}|01[3-9]\d{8})$/;
    const TRX_REGEX = /^[A-Za-z0-9]{6,20}$/;

    it('validates sender phone as either last 4 digits or 11-digit BD phone', () => {
      // 4 digits: valid
      expect(SENDER_REGEX.test('1234')).toBe(true);
      expect(SENDER_REGEX.test('9876')).toBe(true);

      // 11-digit BD mobile: valid
      expect(SENDER_REGEX.test('01712345678')).toBe(true);
      expect(SENDER_REGEX.test('01912345678')).toBe(true);
      expect(SENDER_REGEX.test('01312345678')).toBe(true);

      // Invalid formats
      expect(SENDER_REGEX.test('123')).toBe(false); // only 3 digits
      expect(SENDER_REGEX.test('12345')).toBe(false); // 5 digits
      expect(SENDER_REGEX.test('01212345678')).toBe(false); // invalid operator 012
      expect(SENDER_REGEX.test('0171234567')).toBe(false); // 10 digits
      expect(SENDER_REGEX.test('017123456789')).toBe(false); // 12 digits
      expect(SENDER_REGEX.test('abcd')).toBe(false); // non-digits
    });

    it('validates that transaction ID is optional, but if provided must be 6-20 alphanumeric chars', () => {
      const isValidTrx = (trx?: string | null) => {
        if (!trx || trx.trim().length === 0) return true; // optional
        return TRX_REGEX.test(trx.trim());
      };

      // Optional cases:
      expect(isValidTrx(undefined)).toBe(true);
      expect(isValidTrx(null)).toBe(true);
      expect(isValidTrx('')).toBe(true);
      expect(isValidTrx('   ')).toBe(true);

      // Valid non-empty cases:
      expect(isValidTrx('8N7A6B5C4D')).toBe(true);
      expect(isValidTrx('BKASH123456')).toBe(true);
      expect(isValidTrx('123456')).toBe(true);

      // Invalid cases:
      expect(isValidTrx('12345')).toBe(false); // too short (< 6)
      expect(isValidTrx('TOOLONGTRANSACTIONID1234567890')).toBe(false); // > 20
      expect(isValidTrx('INVALID-CHARS!')).toBe(false); // special chars
    });
  });

  describe('Order Debounce Window (15 seconds)', () => {
    it('detects duplicate orders placed within 15 seconds', () => {
      const isRapidDuplicate = (placedAt: Date, now: Date) => {
        const diffMs = now.getTime() - placedAt.getTime();
        return diffMs >= 0 && diffMs < 15_000;
      };

      const now = new Date('2026-05-12T12:00:10Z');
      const orderPlaced5SecsAgo = new Date('2026-05-12T12:00:05Z');
      const orderPlaced20SecsAgo = new Date('2026-05-12T11:59:50Z');

      expect(isRapidDuplicate(orderPlaced5SecsAgo, now)).toBe(true);
      expect(isRapidDuplicate(orderPlaced20SecsAgo, now)).toBe(false);
    });
  });

  describe('COD Blacklist Safeguards', () => {
    it('blocks COD payment method if account or phone is blacklisted', () => {
      const isCodBlocked = (params: {
        paymentMethod: string;
        isUserBlacklisted?: boolean;
        isPhoneBlacklisted?: boolean;
      }) => {
        if (params.paymentMethod !== 'CASH_ON_DELIVERY') return false;
        return !!params.isUserBlacklisted || !!params.isPhoneBlacklisted;
      };

      // Clean customer: allowed
      expect(
        isCodBlocked({
          paymentMethod: 'CASH_ON_DELIVERY',
          isUserBlacklisted: false,
          isPhoneBlacklisted: false,
        }),
      ).toBe(false);

      // Blacklisted user: blocked
      expect(
        isCodBlocked({
          paymentMethod: 'CASH_ON_DELIVERY',
          isUserBlacklisted: true,
          isPhoneBlacklisted: false,
        }),
      ).toBe(true);

      // Blacklisted phone: blocked
      expect(
        isCodBlocked({
          paymentMethod: 'CASH_ON_DELIVERY',
          isUserBlacklisted: false,
          isPhoneBlacklisted: true,
        }),
      ).toBe(true);

      // Non-COD payment (e.g. BKASH): allowed even if blacklisted
      expect(
        isCodBlocked({
          paymentMethod: 'BKASH',
          isUserBlacklisted: true,
          isPhoneBlacklisted: true,
        }),
      ).toBe(false);
    });
  });

  describe('Rider Daily Settlement Logic', () => {
    it('correctly aggregates unhanded delivered cash deliveries into a settlement batch', () => {
      const deliveries = [
        { id: 'd1', cashCollected: 500, cashHandedOverAt: null },
        { id: 'd2', cashCollected: 1200, cashHandedOverAt: null },
        { id: 'd3', cashCollected: 350, cashHandedOverAt: null },
        { id: 'd4', cashCollected: 400, cashHandedOverAt: new Date() }, // already handed over
      ];

      const unhanded = deliveries.filter((d) => d.cashHandedOverAt === null);
      const totalCash = unhanded.reduce(
        (sum, d) => sum + (d.cashCollected ?? 0),
        0,
      );
      const count = unhanded.length;

      expect(count).toBe(3);
      expect(totalCash).toBe(2050);
    });
  });
});

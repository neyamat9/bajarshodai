import { Linking } from 'react-native';
import {
  sanitizeWhatsAppNumber,
  buildWhatsAppOrderMessage,
  buildWhatsAppOrderUrls,
  openWhatsAppOrder,
} from '../src/utils/whatsappOrder';

jest.mock('react-native', () => ({
  Linking: {
    canOpenURL: jest.fn(),
    openURL: jest.fn(),
  },
}));

describe('WhatsApp Order Utility (Mobile App)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sanitizeWhatsAppNumber', () => {
    it('normalizes local 11-digit numbers with 88 prefix', () => {
      expect(sanitizeWhatsAppNumber('01712345678')).toBe('8801712345678');
    });

    it('removes spaces, dashes, and plus signs', () => {
      expect(sanitizeWhatsAppNumber('+880 1812-345678')).toBe('8801812345678');
      expect(sanitizeWhatsAppNumber('01911-223 344')).toBe('8801911223344');
    });

    it('leaves existing international 88 numbers unchanged', () => {
      expect(sanitizeWhatsAppNumber('8801700000000')).toBe('8801700000000');
    });

    it('handles null, undefined, and empty inputs gracefully', () => {
      expect(sanitizeWhatsAppNumber(null)).toBe('');
      expect(sanitizeWhatsAppNumber(undefined)).toBe('');
      expect(sanitizeWhatsAppNumber('')).toBe('');
      expect(sanitizeWhatsAppNumber('---')).toBe('');
    });
  });

  describe('buildWhatsAppOrderMessage', () => {
    it('formats default message in Bangla with placeholders replaced', () => {
      const msg = buildWhatsAppOrderMessage({
        productName: 'নাপা ৫০০ মিগ্রা',
        productSlug: 'napa-500mg',
        productPrice: 120,
        isBn: true,
      });

      expect(msg).toContain('নাপা ৫০০ মিগ্রা');
      expect(msg).toContain('https://bajarshodai.com/products/napa-500mg');
      expect(msg).toContain('আসসালামু আলাইকুম');
    });

    it('formats default message in English with placeholders replaced', () => {
      const msg = buildWhatsAppOrderMessage({
        productName: 'Fresh Milk 1L',
        productSlug: 'fresh-milk-1l',
        productPrice: 90,
        isBn: false,
      });

      expect(msg).toContain('Fresh Milk 1L');
      expect(msg).toContain('Hello! I would like to order this product from Bazar Shodai:');
      expect(msg).toContain('https://bajarshodai.com/products/fresh-milk-1l');
    });

    it('supports custom templates configured by admin', () => {
      const customTemplate =
        'অর্ডার রিকোয়েস্ট: {product_name} | দাম: {product_price} | লিঙ্ক: {product_url}';
      const msg = buildWhatsAppOrderMessage({
        productName: 'সয়াবিন তেল ৫ লিটার',
        productSlug: 'soybean-oil-5l',
        productPrice: 850,
        isBn: true,
        template: customTemplate,
      });

      expect(msg).toBe(
        'অর্ডার রিকোয়েস্ট: সয়াবিন তেল ৫ লিটার | দাম: ৳৮৫০ | লিঙ্ক: https://bajarshodai.com/products/soybean-oil-5l',
      );
    });
  });

  describe('buildWhatsAppOrderUrls', () => {
    it('returns both native scheme and web wa.me URLs', () => {
      const { appUrl, webUrl, phone } = buildWhatsAppOrderUrls({
        whatsappNumber: '01712345678',
        productName: 'Test Item',
        productSlug: 'test-item',
        productPrice: 50,
      });

      expect(phone).toBe('8801712345678');
      expect(appUrl).toContain('whatsapp://send?phone=8801712345678&text=');
      expect(webUrl).toContain('https://wa.me/8801712345678?text=');
    });

    it('returns empty URLs if phone number is absent', () => {
      const { appUrl, webUrl } = buildWhatsAppOrderUrls({
        productName: 'Test',
        productSlug: 'test',
        productPrice: 10,
      });

      expect(appUrl).toBe('');
      expect(webUrl).toBe('');
    });
  });

  describe('openWhatsAppOrder', () => {
    it('opens native whatsapp scheme when supported', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
      (Linking.openURL as jest.Mock).mockResolvedValue(true);

      const success = await openWhatsAppOrder({
        whatsappNumber: '01712345678',
        productName: 'Test',
        productSlug: 'test',
        productPrice: 10,
      });

      expect(success).toBe(true);
      expect(Linking.canOpenURL).toHaveBeenCalledWith(expect.stringContaining('whatsapp://send?'));
      expect(Linking.openURL).toHaveBeenCalledWith(expect.stringContaining('whatsapp://send?'));
    });

    it('falls back to web wa.me url when native scheme is not supported', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);
      (Linking.openURL as jest.Mock).mockResolvedValue(true);

      const success = await openWhatsAppOrder({
        whatsappNumber: '01712345678',
        productName: 'Test',
        productSlug: 'test',
        productPrice: 10,
      });

      expect(success).toBe(true);
      expect(Linking.openURL).toHaveBeenCalledWith(expect.stringContaining('https://wa.me/'));
    });

    it('falls back to web url when canOpenURL throws', async () => {
      (Linking.canOpenURL as jest.Mock).mockRejectedValue(new Error('Permission denied'));
      (Linking.openURL as jest.Mock).mockResolvedValue(true);

      const success = await openWhatsAppOrder({
        whatsappNumber: '01712345678',
        productName: 'Test',
        productSlug: 'test',
        productPrice: 10,
      });

      expect(success).toBe(true);
      expect(Linking.openURL).toHaveBeenCalledWith(expect.stringContaining('https://wa.me/'));
    });
  });
});


import { Linking } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {
  sanitizeMessengerUsername,
  buildMessengerUrl,
  buildMessengerAppUrl,
  buildMessengerOrderMessage,
  openMessengerOrder,
} from '../src/utils/messengerOrder';

jest.mock('react-native', () => ({
  Linking: {
    canOpenURL: jest.fn(),
    openURL: jest.fn(),
  },
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/store/useToastStore', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Messenger Order Utility (Mobile App)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sanitizeMessengerUsername', () => {
    it('handles plain username', () => {
      expect(sanitizeMessengerUsername('bajarshodai2')).toBe('bajarshodai2');
    });

    it('strips leading @ from handles', () => {
      expect(sanitizeMessengerUsername('@bajarshodai2')).toBe('bajarshodai2');
    });

    it('extracts username from m.me links', () => {
      expect(sanitizeMessengerUsername('https://m.me/bajarshodai2')).toBe('bajarshodai2');
      expect(sanitizeMessengerUsername('http://m.me/bajarshodai2/')).toBe('bajarshodai2');
    });

    it('extracts username from Facebook page URLs', () => {
      expect(sanitizeMessengerUsername('https://www.facebook.com/bajarshodai2')).toBe('bajarshodai2');
      expect(sanitizeMessengerUsername('https://facebook.com/bajarshodai2/')).toBe('bajarshodai2');
      expect(sanitizeMessengerUsername('fb.com/bajarshodai2')).toBe('bajarshodai2');
    });

    it('extracts numeric ID from profile.php URLs', () => {
      expect(
        sanitizeMessengerUsername('https://www.facebook.com/profile.php?id=61550000000000'),
      ).toBe('61550000000000');
    });

    it('handles null, undefined, and empty inputs gracefully', () => {
      expect(sanitizeMessengerUsername(null)).toBe('');
      expect(sanitizeMessengerUsername(undefined)).toBe('');
      expect(sanitizeMessengerUsername('')).toBe('');
      expect(sanitizeMessengerUsername('   ')).toBe('');
    });
  });

  describe('buildMessengerUrl & buildMessengerAppUrl', () => {
    it('builds https://m.me/ web URL', () => {
      expect(buildMessengerUrl('bajarshodai2')).toBe('https://m.me/bajarshodai2');
    });

    it('builds fb-messenger://user-thread/ app URL', () => {
      expect(buildMessengerAppUrl('bajarshodai2')).toBe('fb-messenger://user-thread/bajarshodai2');
    });

    it('returns empty string when username is absent', () => {
      expect(buildMessengerUrl(null)).toBe('');
      expect(buildMessengerAppUrl(null)).toBe('');
    });
  });

  describe('buildMessengerOrderMessage', () => {
    it('formats default message in Bangla with placeholders replaced', () => {
      const msg = buildMessengerOrderMessage({
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
      const msg = buildMessengerOrderMessage({
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
      const msg = buildMessengerOrderMessage({
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

  describe('openMessengerOrder', () => {
    it('copies to clipboard and opens native app link when supported', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
      (Linking.openURL as jest.Mock).mockResolvedValue(true);

      const result = await openMessengerOrder({
        messengerUsername: 'bajarshodai2',
        productName: 'Test Item',
        productSlug: 'test-item',
        productPrice: 100,
        isBn: true,
      });

      expect(result).toBe(true);
      expect(Clipboard.setStringAsync).toHaveBeenCalled();
      expect(Linking.canOpenURL).toHaveBeenCalledWith('fb-messenger://user-thread/bajarshodai2');
      expect(Linking.openURL).toHaveBeenCalledWith('fb-messenger://user-thread/bajarshodai2');
    });

    it('falls back to m.me web URL when native scheme cannot be opened', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(false);
      (Linking.openURL as jest.Mock).mockResolvedValue(true);

      const result = await openMessengerOrder({
        messengerUsername: 'bajarshodai2',
        productName: 'Test Item',
        productSlug: 'test-item',
        productPrice: 100,
        isBn: false,
      });

      expect(result).toBe(true);
      expect(Clipboard.setStringAsync).toHaveBeenCalled();
      expect(Linking.openURL).toHaveBeenCalledWith('https://m.me/bajarshodai2');
    });
  });
});


import { useCartStore } from '../src/store/useCartStore';
import { shareLocationApi, SharedLocationResponse } from '../src/features/location/api/myLocation';

jest.mock('../src/api/client', () => ({
  api: {
    get: jest.fn().mockResolvedValue({}),
    post: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
  },
}));

describe('Guest Checkout & Location Parity Tests', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
    jest.clearAllMocks();
  });

  describe('Cart state and server sync', () => {
    it('manages cart items and calculates subtotal correctly for guest', () => {
      const store = useCartStore.getState();
      store.addItem({
        id: 'prod-1',
        productId: 'prod-1',
        name: 'Fresh Tomatoes',
        price: 50,
      }, 2);

      expect(useCartStore.getState().items).toHaveLength(1);
      expect(useCartStore.getState().items[0]?.quantity).toBe(2);
      expect(useCartStore.getState().subtotal()).toBe(100);
    });

    it('syncCartFromServer fetches and populates items from backend', async () => {
      const { api } = require('../src/api/client');
      api.get.mockResolvedValueOnce({
        items: [
          {
            id: 'server-item-1',
            productId: 'prod-100',
            product: {
              name: 'Apple',
              nameBn: 'আপেল',
              sellingPrice: 120,
              stock: 10,
            },
            quantity: 3,
          },
        ],
      });

      await useCartStore.getState().syncCartFromServer();

      const items = useCartStore.getState().items;
      expect(items).toHaveLength(1);
      expect(items[0]?.productId).toBe('prod-100');
      expect(items[0]?.quantity).toBe(3);
      expect(items[0]?.price).toBe(120);
    });
  });

  describe('Location Sharing & Quote evaluation', () => {
    it('parses valid location quote and calculated delivery fee', async () => {
      const { api } = require('../src/api/client');
      const mockResponse: SharedLocationResponse = {
        location: {
          id: 'loc-1',
          lat: 23.2185,
          lng: 90.9525,
          placeName: 'Shahrasti Sadar',
          placeNameBn: 'শাহরাস্তি সদর',
        },
        quote: {
          available: true,
          calculatedFee: 45,
          distanceKm: 2.5,
          freeDelivery: false,
        },
      };
      api.post.mockResolvedValueOnce(mockResponse);

      const res = await shareLocationApi({
        lat: 23.2185,
        lng: 90.9525,
        source: 'GPS',
        subtotal: 300,
      });

      expect(res.location?.placeName).toBe('Shahrasti Sadar');
      expect(res.quote?.calculatedFee).toBe(45);
      expect(res.quote?.distanceKm).toBe(2.5);
      expect(res.quote?.block).toBeUndefined();
    });

    it('detects OUT_OF_AREA block from backend delivery settings', async () => {
      const { api } = require('../src/api/client');
      const outOfAreaResponse: SharedLocationResponse = {
        quote: {
          available: false,
          block: 'OUT_OF_AREA',
          calculatedFee: 0,
          distanceKm: 28.5,
          freeDelivery: false,
        },
      };
      api.post.mockResolvedValueOnce(outOfAreaResponse);

      const res = await shareLocationApi({
        lat: 23.8103,
        lng: 90.4125,
        source: 'GPS',
        subtotal: 500,
      });

      expect(res.quote?.block).toBe('OUT_OF_AREA');
      expect(res.quote?.available).toBe(false);
    });
  });

  describe('Guest phone number validation rule', () => {
    it('validates 11-digit Bangladeshi mobile numbers accurately', () => {
      const bdPhoneRegex = /^01[3-9]\d{8}$/;
      expect(bdPhoneRegex.test('01712345678')).toBe(true);
      expect(bdPhoneRegex.test('01812345678')).toBe(true);
      expect(bdPhoneRegex.test('01912345678')).toBe(true);
      expect(bdPhoneRegex.test('01312345678')).toBe(true);
      expect(bdPhoneRegex.test('01412345678')).toBe(true);

      // Invalid formats
      expect(bdPhoneRegex.test('01212345678')).toBe(false); // Invalid operator code
      expect(bdPhoneRegex.test('0171234567')).toBe(false); // 10 digits
      expect(bdPhoneRegex.test('017123456789')).toBe(false); // 12 digits
      expect(bdPhoneRegex.test('0171234abcd')).toBe(false); // Non-digit characters
    });
  });
});


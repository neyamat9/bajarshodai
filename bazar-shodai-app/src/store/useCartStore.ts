import { create } from 'zustand';
import { storage } from '@/utils/storage';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  banglaName?: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  imageUrl?: string;
  unit?: string;
  stock?: number;
  serverItemId?: string; // ID assigned by backend /customer/cart
}

export interface AppliedCoupon {
  code: string;
  discount: number;
  type?: 'PERCENTAGE' | 'FIXED';
}

interface CartState {
  items: CartItem[];
  coupon: AppliedCoupon | null;
  deliveryCharge: number;
  freeDeliveryThreshold: number;

  totalItems: () => number;
  subtotal: () => number;
  totalPrice: () => number;

  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setItems: (items: CartItem[]) => void;
  setCoupon: (coupon: AppliedCoupon | null) => void;
  setDeliveryCharge: (charge: number) => void;
}

const STORAGE_KEY = 'bazar_cart_items';
const COUPON_STORAGE_KEY = 'bazar_cart_coupon';

// Helper to load initial state from MMKV
function loadSavedCart(): CartItem[] {
  try {
    return storage.getObject<CartItem[]>(STORAGE_KEY) || [];
  } catch {
    return [];
  }
}

function loadSavedCoupon(): AppliedCoupon | null {
  try {
    return storage.getObject<AppliedCoupon>(COUPON_STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

export const useCartStore = create<CartState>((set, get) => ({
  items: loadSavedCart(),
  coupon: loadSavedCoupon(),
  deliveryCharge: 40,
  freeDeliveryThreshold: 500,

  totalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },

  subtotal: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  totalPrice: () => {
    const sub = get().subtotal();
    const discount = get().coupon?.discount ?? 0;
    const isFreeDelivery = sub >= get().freeDeliveryThreshold;
    const delivery = sub > 0 ? (isFreeDelivery ? 0 : get().deliveryCharge) : 0;
    return Math.max(0, sub - discount + delivery);
  },

  addItem: (item, quantity = 1) => {
    set((state) => {
      const existing = state.items.find((i) => i.productId === item.productId);
      let updated: CartItem[];
      if (existing) {
        updated = state.items.map((i) =>
          i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i,
        );
      } else {
        updated = [...state.items, { ...item, quantity }];
      }
      storage.setObject(STORAGE_KEY, updated);
      return { items: updated };
    });
  },

  removeItem: (productId) => {
    set((state) => {
      const updated = state.items.filter((i) => i.productId !== productId);
      storage.setObject(STORAGE_KEY, updated);
      return { items: updated };
    });
  },

  updateQuantity: (productId, quantity) => {
    set((state) => {
      let updated: CartItem[];
      if (quantity <= 0) {
        updated = state.items.filter((i) => i.productId !== productId);
      } else {
        updated = state.items.map((i) => (i.productId === productId ? { ...i, quantity } : i));
      }
      storage.setObject(STORAGE_KEY, updated);
      return { items: updated };
    });
  },

  clearCart: () => {
    storage.remove(STORAGE_KEY);
    storage.remove(COUPON_STORAGE_KEY);
    set({ items: [], coupon: null });
  },

  setItems: (items) => {
    storage.setObject(STORAGE_KEY, items);
    set({ items });
  },

  setCoupon: (coupon) => {
    if (coupon) {
      storage.setObject(COUPON_STORAGE_KEY, coupon);
    } else {
      storage.remove(COUPON_STORAGE_KEY);
    }
    set({ coupon });
  },

  setDeliveryCharge: (charge) => {
    set({ deliveryCharge: charge });
  },
}));

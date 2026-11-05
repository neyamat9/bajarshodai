import { create } from 'zustand';
import { storage } from '@/utils/storage';
import { api } from '@/api/client';

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

// Background persistence to guarantee 0ms touch response
function persistCartAsync(items: CartItem[]) {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(() => {
      try {
        storage.setObject(STORAGE_KEY, items);
      } catch {
        // ignore
      }
    });
  } else {
    setTimeout(() => {
      try {
        storage.setObject(STORAGE_KEY, items);
      } catch {
        // ignore
      }
    }, 0);
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
      persistCartAsync(updated);
      return { items: updated };
    });

    // Background sync to server so cart persists on server & refresh
    void api
      .post<{ id?: string }>('/customer/cart', { productId: item.productId, quantity })
      .then((res) => {
        if (res?.id) {
          set((state) => {
            const synced = state.items.map((i) =>
              i.productId === item.productId ? { ...i, serverItemId: res.id } : i,
            );
            persistCartAsync(synced);
            return { items: synced };
          });
        }
      })
      .catch(() => {});
  },

  removeItem: (productId) => {
    const item = get().items.find((i) => i.productId === productId);
    set((state) => {
      const updated = state.items.filter((i) => i.productId !== productId);
      persistCartAsync(updated);
      return { items: updated };
    });

    const targetId = item?.serverItemId || productId;
    void api.delete(`/customer/cart/${encodeURIComponent(targetId)}`).catch(() => {});
  },

  updateQuantity: (productId, quantity) => {
    const item = get().items.find((i) => i.productId === productId);
    set((state) => {
      let updated: CartItem[];
      if (quantity <= 0) {
        updated = state.items.filter((i) => i.productId !== productId);
      } else {
        updated = state.items.map((i) => (i.productId === productId ? { ...i, quantity } : i));
      }
      persistCartAsync(updated);
      return { items: updated };
    });

    if (quantity <= 0) {
      const targetId = item?.serverItemId || productId;
      void api.delete(`/customer/cart/${encodeURIComponent(targetId)}`).catch(() => {});
    } else {
      void api.post('/customer/cart', { productId, quantity }).catch(() => {});
    }
  },

  clearCart: () => {
    storage.remove(STORAGE_KEY);
    storage.remove(COUPON_STORAGE_KEY);
    set({ items: [], coupon: null });
    void api.delete('/customer/cart').catch(() => {});
  },

  setItems: (items) => {
    persistCartAsync(items);
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

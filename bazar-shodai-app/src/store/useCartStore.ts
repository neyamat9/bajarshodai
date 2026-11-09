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
  syncCartFromServer: () => Promise<void>;
}

const STORAGE_KEY = 'bazar_cart_items';
const COUPON_STORAGE_KEY = 'bazar_cart_coupon';

// Helper to load initial state from MMKV with full data sanitization
function loadSavedCart(): CartItem[] {
  try {
    const raw = storage.getObject<CartItem[]>(STORAGE_KEY) || [];
    if (!Array.isArray(raw)) return [];
    return raw.map((item: any) => {
      const rawPrice = item.price ?? item.sellingPrice ?? 0;
      const price = typeof rawPrice === 'number' && !isNaN(rawPrice) ? rawPrice : Number(rawPrice) || 0;
      const quantity = Math.max(1, Number(item.quantity) || 1);
      return {
        ...item,
        price,
        quantity,
      };
    });
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
    return get().items.reduce((total, item) => total + (Number(item.quantity) || 1), 0);
  },

  subtotal: () => {
    return get().items.reduce((sum, item) => {
      const p = typeof item.price === 'number' && !isNaN(item.price) ? item.price : Number(item.price) || 0;
      const q = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : Number(item.quantity) || 1;
      return sum + p * q;
    }, 0);
  },

  totalPrice: () => {
    const sub = get().subtotal();
    const discount = Number(get().coupon?.discount) || 0;
    const threshold = Number(get().freeDeliveryThreshold) || 500;
    const charge = Number(get().deliveryCharge) || 40;
    const isFreeDelivery = sub >= threshold;
    const delivery = sub > 0 ? (isFreeDelivery ? 0 : charge) : 0;
    return Math.max(0, sub - discount + delivery);
  },

  addItem: (item, quantity = 1) => {
    const rawPrice = item.price ?? (item as any).sellingPrice ?? 0;
    const price = typeof rawPrice === 'number' && !isNaN(rawPrice) ? rawPrice : Number(rawPrice) || 0;
    const cleanQty = Math.max(1, Number(quantity) || 1);
    const itemId = item.id || item.productId;
    const cleanItem = { ...item, id: itemId, price };

    set((state) => {
      const existing = state.items.find((i) => (i.id ? i.id === itemId : i.productId === item.productId));
      let updated: CartItem[];
      if (existing) {
        updated = state.items.map((i) =>
          (i.id ? i.id === itemId : i.productId === item.productId)
            ? { ...i, price, quantity: (Number(i.quantity) || 1) + cleanQty }
            : i,
        );
      } else {
        updated = [...state.items, { ...cleanItem, quantity: cleanQty }];
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
              (i.id === itemId || i.productId === item.productId) ? { ...i, serverItemId: res.id } : i,
            );
            persistCartAsync(synced);
            return { items: synced };
          });
        }
      })
      .catch(() => {});
  },

  removeItem: (idOrProductId) => {
    const item = get().items.find((i) => i.id === idOrProductId || i.productId === idOrProductId);
    set((state) => {
      const updated = state.items.filter((i) => i.id !== idOrProductId && i.productId !== idOrProductId);
      persistCartAsync(updated);
      return { items: updated };
    });

    const targetId = item?.serverItemId || idOrProductId;
    void api.delete(`/customer/cart/${encodeURIComponent(targetId)}`).catch(() => {});
  },

  updateQuantity: (idOrProductId, quantity) => {
    const item = get().items.find((i) => i.id === idOrProductId || i.productId === idOrProductId);
    set((state) => {
      let updated: CartItem[];
      if (quantity <= 0) {
        updated = state.items.filter((i) => i.id !== idOrProductId && i.productId !== idOrProductId);
      } else {
        updated = state.items.map((i) =>
          (i.id === idOrProductId || i.productId === idOrProductId) ? { ...i, quantity } : i,
        );
      }
      persistCartAsync(updated);
      return { items: updated };
    });

    if (quantity <= 0) {
      const targetId = item?.serverItemId || idOrProductId;
      void api.delete(`/customer/cart/${encodeURIComponent(targetId)}`).catch(() => {});
    } else {
      void api.post('/customer/cart', { productId: item?.productId || idOrProductId, quantity }).catch(() => {});
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

  syncCartFromServer: async () => {
    try {
      const res = await api.get<{
        items?: Array<{
          id: string;
          productId: string;
          quantity: number;
          unitPrice?: number;
          product?: {
            id: string;
            name: string;
            nameBn?: string;
            price?: number;
            sellingPrice?: number;
            regularPrice?: number;
            imageUrl?: string;
            primaryImage?: { url: string };
            images?: Array<{ url: string }>;
            unit?: { shortLabel?: string; shortLabelBn?: string };
            stock?: number;
          };
          variant?: {
            id: string;
            price?: number;
            stock?: number;
          };
        }>;
      }>('/customer/cart');

      if (res && Array.isArray(res.items)) {
        const mapped: CartItem[] = res.items.map((it) => {
          const rawPrice =
            it.variant?.price ??
            it.product?.sellingPrice ??
            it.product?.price ??
            it.unitPrice ??
            0;
          const price = typeof rawPrice === 'number' && !isNaN(rawPrice) ? rawPrice : Number(rawPrice) || 0;
          const rawOriginalPrice = it.product?.regularPrice;
          const originalPrice = rawOriginalPrice ? Number(rawOriginalPrice) || undefined : undefined;
          const quantity = Math.max(1, Number(it.quantity) || 1);

          return {
            id: it.product?.id || it.productId || it.id,
            productId: it.product?.id || it.productId || it.id,
            serverItemId: it.id,
            name: it.product?.name || 'Product',
            banglaName: it.product?.nameBn,
            price,
            originalPrice,
            quantity,
            imageUrl:
              it.product?.imageUrl ||
              it.product?.primaryImage?.url ||
              it.product?.images?.[0]?.url ||
              '',
            unit:
              it.product?.unit?.shortLabelBn ||
              it.product?.unit?.shortLabel ||
              'pc',
            stock: it.variant ? Number(it.variant.stock) : Number(it.product?.stock ?? 999),
          };
        });

        get().setItems(mapped);
      }
    } catch {
      // Keep existing local items if network error
    }
  },
}));

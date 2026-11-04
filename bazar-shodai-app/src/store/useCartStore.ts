import { create } from 'zustand';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  unit?: string;
}

interface CartState {
  items: CartItem[];
  totalItems: () => number;
  totalPrice: () => number;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  totalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },
  totalPrice: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },
  addItem: (item, quantity = 1) => {
    set((state) => {
      const existing = state.items.find((i) => i.productId === item.productId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i,
          ),
        };
      }
      return {
        items: [...state.items, { ...item, quantity }],
      };
    });
  },
  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    }));
  },
  updateQuantity: (productId, quantity) => {
    set((state) => {
      if (quantity <= 0) {
        return {
          items: state.items.filter((i) => i.productId !== productId),
        };
      }
      return {
        items: state.items.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
      };
    });
  },
  clearCart: () => {
    set({ items: [] });
  },
}));

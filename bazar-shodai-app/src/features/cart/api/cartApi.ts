import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { useCartStore } from '@/store/useCartStore';

export interface ServerCartItem {
  id: string; // CartItem UUID
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: {
    id: string;
    name: string;
    nameBn?: string;
    slug: string;
    imageUrl?: string;
    primaryImage?: { url: string };
    price: number;
    stock?: number;
    unit?: { shortLabel: string; shortLabelBn?: string };
  };
}

export interface ServerCartResponse {
  id: string;
  items: ServerCartItem[];
  subtotal: number;
  itemCount: number;
  currency?: string;
}

export interface CheckoutSummaryResponse {
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  coupon?: {
    code: string;
    discount: number;
    type: string;
  } | null;
  stockIssues?: { productId: string; name: string; requested: number; available: number }[];
}

export async function fetchServerCartApi(): Promise<ServerCartResponse> {
  return api.get<ServerCartResponse>('/customer/cart');
}

export async function addServerCartItemApi(payload: {
  productId: string;
  quantity: number;
  unitId?: string;
}): Promise<ServerCartItem> {
  return api.post<ServerCartItem>('/customer/cart', payload);
}

export async function updateServerCartItemApi(
  itemId: string,
  quantity: number,
): Promise<ServerCartItem> {
  return api.patch<ServerCartItem>(`/customer/cart/${encodeURIComponent(itemId)}`, { quantity });
}

export async function removeServerCartItemApi(itemId: string): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`/customer/cart/${encodeURIComponent(itemId)}`);
}

export async function clearServerCartApi(): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>('/customer/cart');
}

export async function applyCouponApi(payload: {
  couponCode: string;
  phone?: string;
  lat?: number;
  lng?: number;
}): Promise<CheckoutSummaryResponse> {
  return api.post<CheckoutSummaryResponse>('/customer/coupons/apply', payload);
}

export async function fetchCheckoutSummaryApi(payload: {
  couponCode?: string;
  phone?: string;
  lat?: number;
  lng?: number;
  redeemPoints?: number;
}): Promise<CheckoutSummaryResponse> {
  return api.post<CheckoutSummaryResponse>('/customer/checkout/summary', payload);
}

export function useServerCart() {
  const setItems = useCartStore((s) => s.setItems);

  return useQuery({
    queryKey: ['server-cart'],
    queryFn: async () => {
      try {
        const localItems = useCartStore.getState().items;
        const res = await fetchServerCartApi();

        if (res && Array.isArray(res.items) && res.items.length > 0) {
          // Sync server items with robust price and field extraction
          const mapped = res.items.map((it: any) => {
            const rawPrice =
              it.variant?.price ??
              it.product?.sellingPrice ??
              it.product?.price ??
              it.unitPrice ??
              it.price ??
              0;
            const price = typeof rawPrice === 'number' && !isNaN(rawPrice) ? rawPrice : Number(rawPrice) || 0;
            const rawOriginalPrice =
              it.product?.regularPrice ??
              it.product?.priceBeforeDiscount ??
              it.originalPrice ??
              undefined;
            const originalPrice = rawOriginalPrice ? Number(rawOriginalPrice) || undefined : undefined;
            const quantity = Math.max(1, Number(it.quantity) || 1);

            return {
              id: it.product?.id || it.productId || it.id,
              productId: it.product?.id || it.productId || it.id,
              serverItemId: it.id,
              name: it.product?.name || it.name || 'Product',
              banglaName: it.product?.nameBn || it.banglaName || undefined,
              price,
              originalPrice,
              quantity,
              imageUrl:
                it.product?.imageUrl ||
                it.product?.primaryImage?.url ||
                it.product?.images?.[0]?.url ||
                it.imageUrl ||
                '',
              unit:
                it.product?.unit?.shortLabelBn ||
                it.product?.unit?.shortLabel ||
                it.unit ||
                'pc',
              stock: it.variant ? Number(it.variant.stock) : Number(it.product?.stock ?? 999),
            };
          });

          // Merge any local items that haven't synced to server yet
          const serverProductIds = new Set(mapped.map((m) => m.productId));
          const unsyncedLocal = localItems
            .filter((l) => !serverProductIds.has(l.productId))
            .map((l) => ({
              ...l,
              price:
                typeof l.price === 'number' && !isNaN(l.price) ? l.price : Number(l.price) || 0,
              quantity: Math.max(1, Number(l.quantity) || 1),
            }));

          // Sync unsynced local items to the server in the background
          for (const it of unsyncedLocal) {
            void addServerCartItemApi({ productId: it.productId, quantity: it.quantity }).catch(
              () => {},
            );
          }

          const combined = [...mapped, ...unsyncedLocal];
          setItems(combined);
          return res;
        }

        // CRITICAL: If server cart is empty but local cart has items, NEVER wipe out local items!
        // Push local items to server instead so they persist across refreshes!
        if (localItems.length > 0) {
          const sanitized = localItems.map((it) => ({
            ...it,
            price:
              typeof it.price === 'number' && !isNaN(it.price) ? it.price : Number(it.price) || 0,
            quantity: Math.max(1, Number(it.quantity) || 1),
          }));
          setItems(sanitized);
          for (const it of sanitized) {
            void addServerCartItemApi({ productId: it.productId, quantity: it.quantity }).catch(
              () => {},
            );
          }
          return { id: '', items: [], subtotal: 0, itemCount: 0 };
        }

        return res;
      } catch {
        // Fallback to local cart store silently - never wipe local cart on network/server error!
        return null;
      }
    },
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
}

export function useApplyCoupon() {
  const queryClient = useQueryClient();
  const setCoupon = useCartStore((s) => s.setCoupon);

  return useMutation({
    mutationFn: applyCouponApi,
    onSuccess: (data) => {
      if (data.coupon) {
        setCoupon({
          code: data.coupon.code,
          discount: data.coupon.discount || data.discount,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['server-cart'] });
    },
  });
}

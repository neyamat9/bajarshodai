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
        const res = await fetchServerCartApi();
        if (res && res.items) {
          // Sync to local store
          const mapped = res.items.map((it) => ({
            id: it.product.id,
            productId: it.product.id,
            serverItemId: it.id,
            name: it.product.name,
            banglaName: it.product.nameBn,
            price: it.unitPrice || it.product.price,
            quantity: it.quantity,
            imageUrl: it.product.imageUrl || it.product.primaryImage?.url,
            unit: it.product.unit?.shortLabel || 'kg',
            stock: it.product.stock,
          }));
          setItems(mapped);
        }
        return res;
      } catch {
        // Fallback to local cart store silently
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

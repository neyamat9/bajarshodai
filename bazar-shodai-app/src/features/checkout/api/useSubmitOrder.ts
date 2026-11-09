import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { useCartStore } from '@/store/useCartStore';
import { PlaceOrderPayload, PlacedOrderResponse } from '../types';

export async function submitOrderApi(payload: PlaceOrderPayload): Promise<PlacedOrderResponse> {
  // Ensure items from local store exist in server cart
  const localItems = useCartStore.getState().items;
  if (localItems.length > 0) {
    try {
      const serverCart = await api.get<{ items?: Array<{ id: string; productId: string; quantity: number }> }>('/customer/cart');
      const serverItemProductIds = new Set((serverCart?.items || []).map((i) => i.productId));
      for (const item of localItems) {
        if (!serverItemProductIds.has(item.productId)) {
          await api.post('/customer/cart', { productId: item.productId, quantity: item.quantity }).catch(() => {});
        }
      }
    } catch {
      // Continue anyway as cart might already be synced
    }
  }
  return api.post<PlacedOrderResponse>('/customer/orders', payload);
}

export function useSubmitOrder() {
  const queryClient = useQueryClient();
  const clearCart = useCartStore((s) => s.clearCart);

  return useMutation({
    mutationFn: submitOrderApi,
    onSuccess: () => {
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['server-cart'] });
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
    },
  });
}

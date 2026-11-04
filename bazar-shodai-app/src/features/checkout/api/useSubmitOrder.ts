import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { useCartStore } from '@/store/useCartStore';
import { PlaceOrderPayload, PlacedOrderResponse } from '../types';

export async function submitOrderApi(payload: PlaceOrderPayload): Promise<PlacedOrderResponse> {
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


import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { CustomerOrderRecord } from '../types';

export async function fetchCustomerOrdersApi(): Promise<CustomerOrderRecord[]> {
  try {
    const res = await api.get<CustomerOrderRecord[]>('/customer/orders');
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

export async function fetchOrderDetailApi(orderId: string): Promise<CustomerOrderRecord> {
  return api.get<CustomerOrderRecord>(`/customer/orders/${encodeURIComponent(orderId)}`);
}

export async function cancelOrderApi(
  orderId: string,
): Promise<{ success: boolean; message: string }> {
  return api.post<{ success: boolean; message: string }>(
    `/customer/orders/${encodeURIComponent(orderId)}/cancel`,
  );
}

export async function reorderApi(
  orderId: string,
): Promise<{ success: boolean; itemsAdded: number }> {
  return api.post<{ success: boolean; itemsAdded: number }>(
    `/customer/orders/${encodeURIComponent(orderId)}/reorder`,
  );
}

export function useCustomerOrders() {
  return useQuery({
    queryKey: ['customer-orders'],
    queryFn: fetchCustomerOrdersApi,
    staleTime: 1000 * 60 * 3,
  });
}

export function useOrderDetail(orderId: string) {
  return useQuery({
    queryKey: ['order-detail', orderId],
    queryFn: () => fetchOrderDetailApi(orderId),
    enabled: Boolean(orderId),
    staleTime: 1000 * 30, // 30 sec polling/stale for active order status
  });
}

export function useCancelOrder(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cancelOrderApi(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-detail', orderId] });
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
    },
  });
}

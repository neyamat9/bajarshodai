import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { CreateReturnPayload, ReturnRequestItem } from '../types';

export async function fetchReturnsApi(): Promise<ReturnRequestItem[]> {
  try {
    const res = await api.get<ReturnRequestItem[]>('/customer/returns');
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

export async function fetchReturnDetailApi(id: string): Promise<ReturnRequestItem> {
  return api.get<ReturnRequestItem>(`/customer/returns/${encodeURIComponent(id)}`);
}

export async function createReturnApi(payload: CreateReturnPayload): Promise<ReturnRequestItem> {
  return api.post<ReturnRequestItem>('/customer/returns', payload);
}

export async function cancelReturnApi(id: string): Promise<{ success: boolean }> {
  return api.post<{ success: boolean }>(`/customer/returns/${encodeURIComponent(id)}/cancel`);
}

export function useCustomerReturns() {
  return useQuery({
    queryKey: ['customer-returns'],
    queryFn: fetchReturnsApi,
    staleTime: 1000 * 60 * 3,
  });
}

export function useReturnDetail(id: string) {
  return useQuery({
    queryKey: ['return-detail', id],
    queryFn: () => fetchReturnDetailApi(id),
    enabled: Boolean(id),
  });
}

export function useCreateReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReturnApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-returns'] });
      queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
    },
  });
}

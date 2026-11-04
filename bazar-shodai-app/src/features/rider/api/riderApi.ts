import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { api } from '@/api/client';
import { RiderDelivery, RiderSummary, RiderFailReason, RiderSettlement } from '../types';

// ======================== API CALLS ========================

export async function fetchMyDeliveriesApi(
  scope: 'active' | 'done' = 'active',
): Promise<RiderDelivery[]> {
  try {
    const res = await api.get<RiderDelivery[]>('/admin/my-deliveries', {
      params: { scope },
    });
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

export async function fetchMySummaryApi(): Promise<RiderSummary> {
  try {
    const res = await api.get<RiderSummary>('/admin/my-deliveries/summary');
    return (
      res || {
        activeCount: 0,
        deliveredToday: 0,
        failedToday: 0,
        cashInHand: 0,
        cashCollectedToday: 0,
      }
    );
  } catch {
    return {
      activeCount: 0,
      deliveredToday: 0,
      failedToday: 0,
      cashInHand: 0,
      cashCollectedToday: 0,
    };
  }
}

export async function fetchDeliveryDetailApi(id: string): Promise<RiderDelivery> {
  return api.get<RiderDelivery>(`/admin/deliveries/${encodeURIComponent(id)}`);
}

export async function acceptDeliveryApi(id: string): Promise<RiderDelivery> {
  return api.post<RiderDelivery>(`/admin/my-deliveries/${encodeURIComponent(id)}/accept`);
}

export async function pickedUpDeliveryApi(id: string, note?: string): Promise<RiderDelivery> {
  return api.post<RiderDelivery>(`/admin/my-deliveries/${encodeURIComponent(id)}/picked-up`, {
    note,
  });
}

export async function onTheWayDeliveryApi(id: string, note?: string): Promise<RiderDelivery> {
  return api.post<RiderDelivery>(`/admin/my-deliveries/${encodeURIComponent(id)}/on-the-way`, {
    note,
  });
}

export async function completeDeliveryApi(
  id: string,
  data: { cashCollected?: number; note?: string },
): Promise<RiderDelivery> {
  return api.post<RiderDelivery>(`/admin/my-deliveries/${encodeURIComponent(id)}/delivered`, data);
}

export async function failDeliveryApi(
  id: string,
  data: { reason: RiderFailReason; note?: string },
): Promise<RiderDelivery> {
  return api.post<RiderDelivery>(`/admin/my-deliveries/${encodeURIComponent(id)}/failed`, data);
}

export async function fetchSettlementsApi(): Promise<RiderSettlement[]> {
  try {
    const res = await api.get<RiderSettlement[]>('/admin/deliveries/settlements');
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

// ======================== HOOKS ========================

export function useRiderDeliveries(scope: 'active' | 'done' = 'active') {
  return useQuery({
    queryKey: ['rider-deliveries', scope],
    queryFn: () => fetchMyDeliveriesApi(scope),
    refetchInterval: 1000 * 15, // 15 sec live feed polling for delivery rider
  });
}

export function useRiderSummary() {
  return useQuery({
    queryKey: ['rider-summary'],
    queryFn: fetchMySummaryApi,
    refetchInterval: 1000 * 30,
  });
}

export function useRiderDeliveryDetail(id: string) {
  return useQuery({
    queryKey: ['rider-delivery-detail', id],
    queryFn: () => fetchDeliveryDetailApi(id),
    enabled: Boolean(id),
    refetchInterval: 1000 * 10,
  });
}

export function useRiderSettlements() {
  return useQuery({
    queryKey: ['rider-settlements'],
    queryFn: fetchSettlementsApi,
    staleTime: 1000 * 60 * 3,
  });
}

// Helper: Safely grab live GPS position
async function tryGetLocation() {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status === 'granted') {
      return await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    }
  } catch {
    // Graceful fallback if GPS is disabled or permission denied
  }
  return null;
}

export function useUpdateDeliveryStatus() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['rider-deliveries'] });
    queryClient.invalidateQueries({ queryKey: ['rider-summary'] });
    queryClient.invalidateQueries({ queryKey: ['rider-delivery-detail'] });
  };

  const acceptMutation = useMutation({
    mutationFn: async (id: string) => {
      await tryGetLocation();
      return acceptDeliveryApi(id);
    },
    onSuccess: invalidate,
  });

  const pickedUpMutation = useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }) => {
      await tryGetLocation();
      return pickedUpDeliveryApi(id, note);
    },
    onSuccess: invalidate,
  });

  const onTheWayMutation = useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }) => {
      await tryGetLocation();
      return onTheWayDeliveryApi(id, note);
    },
    onSuccess: invalidate,
  });

  const completeMutation = useMutation({
    mutationFn: async ({
      id,
      cashCollected,
      note,
    }: {
      id: string;
      cashCollected?: number;
      note?: string;
    }) => {
      await tryGetLocation();
      return completeDeliveryApi(id, { cashCollected, note });
    },
    onSuccess: invalidate,
  });

  const failMutation = useMutation({
    mutationFn: async ({
      id,
      reason,
      note,
    }: {
      id: string;
      reason: RiderFailReason;
      note?: string;
    }) => {
      await tryGetLocation();
      return failDeliveryApi(id, { reason, note });
    },
    onSuccess: invalidate,
  });

  return {
    acceptMutation,
    pickedUpMutation,
    onTheWayMutation,
    completeMutation,
    failMutation,
  };
}

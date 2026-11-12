import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';

export interface LocationSharePayload {
  lat: number;
  lng: number;
  accuracyM?: number;
  source?: 'GPS' | 'PIN' | 'SEARCH';
  phone?: string;
  subtotal?: number;
}

export interface ShippingQuote {
  available: boolean;
  block?: 'DISABLED' | 'ORIGIN_NOT_SET' | 'OUT_OF_AREA' | 'NO_LOCATION' | null;
  calculatedFee: number;
  distanceKm: number;
  roadDistanceKm?: number | null;
  directDistanceKm?: number | null;
  freeDelivery: boolean;
  minOrderAmount?: number;
  minOrderOk?: boolean;
  durationSec?: number | null;
  isAbroad?: boolean;
  isPendingFee?: boolean;
}

export interface SharedLocationResponse {
  location?: {
    id: string;
    lat: number;
    lng: number;
    accuracyM?: number | null;
    placeName?: string | null;
    placeNameBn?: string | null;
    source?: string;
  };
  quote?: ShippingQuote;
  lat?: number;
  lng?: number;
  accuracyM?: number;
  placeName?: string;
  placeNameBn?: string;
  deliveryCharge?: number;
  distanceKm?: number;
}

export interface LocationTokenInfo {
  token: string;
  requesterName?: string;
  requesterPhone?: string;
  orderNumber?: string;
  shopName?: string;
  deliveryZone?: string;
  status: 'PENDING' | 'SUBMITTED' | 'EXPIRED';
}

export interface LocationSearchResult {
  id: string;
  name: string;
  nameBn?: string;
  type: 'district' | 'upazila' | 'thana' | string;
  parentName?: string;
}

export async function shareLocationApi(
  payload: LocationSharePayload,
): Promise<SharedLocationResponse> {
  return api.post<SharedLocationResponse>('/customer/my-location', payload);
}

export async function fetchSavedLocationApi(subtotal = 0): Promise<SharedLocationResponse | null> {
  try {
    return await api.get<SharedLocationResponse>(`/customer/my-location?subtotal=${subtotal}`);
  } catch {
    return null;
  }
}

export async function forgetLocationApi(): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>('/customer/my-location');
}

export async function fetchLocationTokenInfoApi(token: string): Promise<LocationTokenInfo> {
  return api.get<LocationTokenInfo>(`/customer/location-requests/${encodeURIComponent(token)}`);
}

export async function submitLocationTokenApi(
  token: string,
  payload: { lat: number; lng: number; accuracyM?: number },
): Promise<{ success: boolean; message: string }> {
  return api.post<{ success: boolean; message: string }>(
    `/customer/location-requests/${encodeURIComponent(token)}/submit`,
    payload,
  );
}

export async function searchAreasApi(query: string): Promise<LocationSearchResult[]> {
  if (!query.trim()) return [];
  try {
    const res = await api.get<LocationSearchResult[]>(
      `/customer/locations/search?q=${encodeURIComponent(query)}&limit=10`,
    );
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

export function useSavedLocation(subtotal = 0) {
  return useQuery({
    queryKey: ['saved-location', subtotal],
    queryFn: () => fetchSavedLocationApi(subtotal),
    staleTime: 1000 * 60 * 10,
  });
}

export function useShareLocationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: shareLocationApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-location'] });
      queryClient.invalidateQueries({ queryKey: ['server-cart'] });
    },
  });
}

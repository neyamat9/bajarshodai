import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import {
  UserAddress,
  CreateAddressPayload,
  UpdateProfilePayload,
  LoyaltySummary,
  WishlistItem,
} from '../types';

// ======================== ADDRESSES ========================

export async function fetchAddressesApi(): Promise<UserAddress[]> {
  try {
    const res = await api.get<UserAddress[]>('/customer/addresses');
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

export async function createAddressApi(payload: CreateAddressPayload): Promise<UserAddress> {
  return api.post<UserAddress>('/customer/addresses', payload);
}

export async function updateAddressApi(
  id: string,
  payload: Partial<CreateAddressPayload>,
): Promise<UserAddress> {
  return api.patch<UserAddress>(`/customer/addresses/${encodeURIComponent(id)}`, payload);
}

export async function deleteAddressApi(id: string): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`/customer/addresses/${encodeURIComponent(id)}`);
}

export function useCustomerAddresses() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ['customer-addresses'],
    queryFn: fetchAddressesApi,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAddressApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] });
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateAddressPayload> }) =>
      updateAddressApi(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] });
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAddressApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] });
    },
  });
}

// ======================== PROFILE ========================

export async function updateProfileApi(payload: UpdateProfilePayload) {
  return api.patch('/customer/auth/profile', payload);
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { setProfile, user } = useAuthStore();

  return useMutation({
    mutationFn: updateProfileApi,
    onSuccess: (updatedData: any) => {
      if (user && updatedData) {
        setProfile({
          ...user,
          name: updatedData.name ?? user.name,
          email: updatedData.email !== undefined ? updatedData.email : user.email,
          phone: updatedData.phone ?? user.phone,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['auth-user-profile'] });
    },
  });
}

// ======================== LOYALTY ========================

export async function fetchLoyaltySummaryApi(): Promise<LoyaltySummary | null> {
  try {
    return await api.get<LoyaltySummary>('/customer/loyalty');
  } catch {
    return null;
  }
}

export function useLoyaltySummary() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ['customer-loyalty-summary'],
    queryFn: fetchLoyaltySummaryApi,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 3,
  });
}

// ======================== WISHLIST ========================

export async function fetchWishlistApi(): Promise<WishlistItem[]> {
  try {
    const res = await api.get<WishlistItem[]>('/customer/wishlist');
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

export async function addToWishlistApi(productId: string): Promise<WishlistItem> {
  return api.post<WishlistItem>(`/customer/wishlist/${encodeURIComponent(productId)}`);
}

export async function removeFromWishlistApi(productId: string): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`/customer/wishlist/${encodeURIComponent(productId)}`);
}

export function useWishlist() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ['customer-wishlist'],
    queryFn: fetchWishlistApi,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 3,
  });
}

export function useToggleWishlist() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  return useMutation({
    mutationFn: async ({ productId, inWishlist }: { productId: string; inWishlist: boolean }) => {
      if (!isAuthenticated) {
        throw new Error('Please sign in to manage wishlist');
      }
      if (inWishlist) {
        return removeFromWishlistApi(productId);
      }
      return addToWishlistApi(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-wishlist'] });
    },
  });
}

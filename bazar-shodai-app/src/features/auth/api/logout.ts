import { api } from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import { queryClient } from '@/api/queryClient';

export async function logoutApi(): Promise<void> {
  try {
    await api.post('/customer/auth/logout');
  } catch {
    // If token already expired or network down, still continue local cleanup
  } finally {
    await useAuthStore.getState().logout();
    queryClient.clear();
  }
}


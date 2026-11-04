import { api } from '@/api/client';
import { ChangePasswordPayload } from '../types';

export async function changePasswordApi(
  payload: ChangePasswordPayload,
): Promise<{ success: boolean; message: string }> {
  return api.post<{ success: boolean; message: string }>('/customer/auth/change-password', payload);
}

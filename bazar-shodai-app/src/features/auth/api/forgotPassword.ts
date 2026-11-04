import { api } from '@/api/client';
import { ForgotPasswordPayload } from '../types';

export async function forgotPasswordApi(
  payload: ForgotPasswordPayload,
): Promise<{ success: boolean; message: string }> {
  return api.post<{ success: boolean; message: string }>('/customer/auth/forgot-password', payload);
}

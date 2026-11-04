import { api } from '@/api/client';
import { ResetPasswordPayload } from '../types';

export async function verifyResetTokenApi(token: string): Promise<{ valid: boolean }> {
  return api.get<{ valid: boolean }>(
    `/customer/auth/reset-password/verify?token=${encodeURIComponent(token)}`,
  );
}

export async function resetPasswordApi(
  payload: ResetPasswordPayload,
): Promise<{ success: boolean; message: string }> {
  return api.post<{ success: boolean; message: string }>('/customer/auth/reset-password', payload);
}

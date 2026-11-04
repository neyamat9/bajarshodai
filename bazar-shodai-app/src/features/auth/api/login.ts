import { api } from '@/api/client';
import { LoginPayload, AuthSession } from '../types';

export async function loginApi(payload: LoginPayload): Promise<AuthSession> {
  return api.post<AuthSession>('/customer/auth/login', payload);
}

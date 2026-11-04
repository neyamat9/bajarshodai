import { api } from '@/api/client';
import { RegisterPayload, AuthSession } from '../types';

export async function registerApi(payload: RegisterPayload): Promise<AuthSession> {
  return api.post<AuthSession>('/customer/auth/register', payload);
}

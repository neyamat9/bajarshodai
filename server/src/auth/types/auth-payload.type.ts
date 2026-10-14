import type { User } from '@prisma/client';

export interface AuthPayload {
  userId: string;
  accessToken?: string;
  refreshToken?: string;
  user?: User;
}

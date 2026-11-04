export interface UserAddress {
  id: string;
  label?: string;
  recipientName: string;
  phone: string;
  street: string;
  city: string;
  postalCode?: string;
  isDefault: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  language?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  occupation?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  role?: string;
  status?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  loyaltyPoints?: number;
  totalOrders?: number;
  totalSpent?: number;
  createdAt?: string;
  addresses?: UserAddress[];
}

export interface AuthSession {
  userId: string;
  accessToken: string;
  refreshToken: string;
  user?: UserProfile;
}

export interface LoginPayload {
  identifier: string;
  password: string;
  guestToken?: string;
}

export interface RegisterPayload {
  name: string;
  phone: string;
  password: string;
  email?: string;
  language?: 'bn' | 'en';
  guestToken?: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}


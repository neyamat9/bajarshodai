import { create } from 'zustand';
import { tokenVault } from '@/utils/secureStore';
import { storage } from '@/utils/storage';
import { resetGuestToken } from '@/utils/guestToken';
import { UserProfile, AuthSession } from '@/features/auth/types';

const AUTH_USER_KEY = 'bazar_cached_user';

interface AuthState {
  user: UserProfile | null;
  userId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (session: AuthSession) => Promise<void>;
  logout: () => Promise<void>;
  setProfile: (user: UserProfile) => void;
  restoreSession: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  userId: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (session: AuthSession) => {
    // 1. Save tokens to secure hardware vault
    await tokenVault.saveTokens({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      userId: session.userId,
    });

    // 2. Cache user profile in synchronous MMKV for immediate offline render
    if (session.user) {
      storage.setString(AUTH_USER_KEY, JSON.stringify(session.user));
    }

    // 3. Update active React state
    set({
      user: session.user ?? null,
      userId: session.userId,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: async () => {
    // 1. Clear secure store tokens
    await tokenVault.clearTokens();

    // 2. Clear cached user in MMKV
    storage.remove(AUTH_USER_KEY);

    // 3. Generate a fresh anonymous guest token for subsequent shopping
    resetGuestToken();

    // 4. Reset store state
    set({
      user: null,
      userId: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setProfile: (user: UserProfile) => {
    storage.setString(AUTH_USER_KEY, JSON.stringify(user));
    set({ user });
  },

  restoreSession: async () => {
    try {
      const accessToken = await tokenVault.getAccessToken();
      const userId = await tokenVault.getUserId();

      if (!accessToken || !userId) {
        set({ isAuthenticated: false, user: null, userId: null, isLoading: false });
        return false;
      }

      // Restore cached user from MMKV if available
      const cached = storage.getString(AUTH_USER_KEY);
      let parsedUser: UserProfile | null = null;
      if (cached) {
        try {
          parsedUser = JSON.parse(cached);
        } catch {
          // ignore corrupted json
        }
      }

      set({
        isAuthenticated: true,
        userId,
        user: parsedUser,
        isLoading: false,
      });
      return true;
    } catch {
      set({ isAuthenticated: false, user: null, userId: null, isLoading: false });
      return false;
    }
  },
}));

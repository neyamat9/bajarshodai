import { create } from "zustand";
import { api, tokens, type AdminUser, SESSION_EXPIRED_EVENT } from "@/api/client";

export interface LoginResult {
  requires2FA: boolean;
  tempToken?: string;
  maskedEmail?: string;
}

interface AuthState {
  user: AdminUser | null;
  login: (identifier: string, password: string, remember?: boolean) => Promise<LoginResult>;
  verify2FA: (tempToken: string, otp: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: AdminUser) => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: tokens.access ? tokens.user : null,
  async login(identifier, password, remember = false) {
    const res = await api.post<{
      requires2FA?: boolean;
      tempToken?: string;
      maskedEmail?: string;
      accessToken?: string;
      refreshToken?: string;
      user?: AdminUser;
    }>("/admin/auth/login", { identifier, password });

    if (res.data.requires2FA && res.data.tempToken) {
      return {
        requires2FA: true,
        tempToken: res.data.tempToken,
        maskedEmail: res.data.maskedEmail,
      };
    }

    if (res.data.accessToken && res.data.refreshToken && res.data.user) {
      tokens.clear();
      tokens.set(res.data.accessToken, res.data.refreshToken, res.data.user, remember);
      set({ user: res.data.user });
    }
    return { requires2FA: false };
  },
  async verify2FA(tempToken, otp, remember = false) {
    const res = await api.post<{ accessToken: string; refreshToken: string; user: AdminUser }>("/admin/auth/verify-2fa", {
      tempToken,
      otp,
    });
    tokens.clear();
    tokens.set(res.data.accessToken, res.data.refreshToken, res.data.user, remember);
    set({ user: res.data.user });
  },
  async logout() {
    try {
      if (tokens.access) await api.post("/admin/auth/logout");
    } catch {
      /* already signed out */
    }
    tokens.clear();
    set({ user: null });
  },
  setUser(u) {
    tokens.set(tokens.access ?? "", tokens.refresh ?? "", u);
    set({ user: u });
  },
}));

window.addEventListener(SESSION_EXPIRED_EVENT, () => useAuth.setState({ user: null }));

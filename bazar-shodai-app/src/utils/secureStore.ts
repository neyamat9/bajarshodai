import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const SECURE_STORAGE_KEYS = {
  ACCESS_TOKEN: 'bazar_access_token',
  REFRESH_TOKEN: 'bazar_refresh_token',
  USER_ID: 'bazar_user_id',
  USER_ROLE: 'bazar_user_role',
} as const;

// Memory fallback for Web or environments without native keystore support
const memorySecureStore = new Map<string, string>();

const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainService: 'bazar_shodai_keychain',
};

async function isSecureStoreAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * Save an encrypted value in hardware Keystore/Keychain
 */
export async function setSecureItem(key: string, value: string): Promise<void> {
  const available = await isSecureStoreAvailable();
  if (!available) {
    memorySecureStore.set(key, value);
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value, SECURE_STORE_OPTIONS);
  } catch (error) {
    console.warn(`[SecureStore] Failed to write key "${key}":`, error);
    memorySecureStore.set(key, value);
  }
}

/**
 * Retrieve an encrypted value from hardware Keystore/Keychain
 */
export async function getSecureItem(key: string): Promise<string | null> {
  const available = await isSecureStoreAvailable();
  if (!available) {
    return memorySecureStore.get(key) ?? null;
  }
  try {
    return await SecureStore.getItemAsync(key, SECURE_STORE_OPTIONS);
  } catch (error) {
    console.warn(`[SecureStore] Failed to read key "${key}":`, error);
    return memorySecureStore.get(key) ?? null;
  }
}

/**
 * Delete an item from SecureStore
 */
export async function deleteSecureItem(key: string): Promise<void> {
  const available = await isSecureStoreAvailable();
  if (!available) {
    memorySecureStore.delete(key);
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key, SECURE_STORE_OPTIONS);
  } catch (error) {
    console.warn(`[SecureStore] Failed to delete key "${key}":`, error);
    memorySecureStore.delete(key);
  }
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  userId?: string;
}

/**
 * Secure token vault helper for access, refresh, and user identification
 */
export const tokenVault = {
  async saveTokens(tokens: AuthTokens): Promise<void> {
    await setSecureItem(SECURE_STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    if (tokens.refreshToken) {
      await setSecureItem(SECURE_STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    }
    if (tokens.userId) {
      await setSecureItem(SECURE_STORAGE_KEYS.USER_ID, tokens.userId);
    }
  },

  async getAccessToken(): Promise<string | null> {
    return getSecureItem(SECURE_STORAGE_KEYS.ACCESS_TOKEN);
  },

  async getRefreshToken(): Promise<string | null> {
    return getSecureItem(SECURE_STORAGE_KEYS.REFRESH_TOKEN);
  },

  async getUserId(): Promise<string | null> {
    return getSecureItem(SECURE_STORAGE_KEYS.USER_ID);
  },

  async clearTokens(): Promise<void> {
    await Promise.all([
      deleteSecureItem(SECURE_STORAGE_KEYS.ACCESS_TOKEN),
      deleteSecureItem(SECURE_STORAGE_KEYS.REFRESH_TOKEN),
      deleteSecureItem(SECURE_STORAGE_KEYS.USER_ID),
      deleteSecureItem(SECURE_STORAGE_KEYS.USER_ROLE),
    ]);
  },
};

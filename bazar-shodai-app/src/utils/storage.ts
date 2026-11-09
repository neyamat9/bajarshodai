import type { MMKV } from 'react-native-mmkv';

export interface AppStorage {
  getString(key: string): string | undefined;
  setString(key: string, value: string): void;
  getBoolean(key: string): boolean | undefined;
  setBoolean(key: string, value: boolean): void;
  getNumber(key: string): number | undefined;
  setNumber(key: string, value: number): void;
  getObject<T>(key: string): T | null;
  setObject<T>(key: string, value: T): void;
  contains(key: string): boolean;
  remove(key: string): void;
  clearAll(): void;
  getAllKeys(): string[];
}

/**
 * In-memory fallback storage adapter used during SSR, unit testing,
 * or unsupported runtime environments to guarantee 100% crash immunity.
 */
class MemoryStorageAdapter implements AppStorage {
  private map = new Map<string, string>();

  getString(key: string): string | undefined {
    return this.map.get(key);
  }

  setString(key: string, value: string): void {
    this.map.set(key, value);
  }

  getBoolean(key: string): boolean | undefined {
    const val = this.map.get(key);
    return val === undefined ? undefined : val === 'true';
  }

  setBoolean(key: string, value: boolean): void {
    this.map.set(key, String(value));
  }

  getNumber(key: string): number | undefined {
    const val = this.map.get(key);
    if (val === undefined) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  }

  setNumber(key: string, value: number): void {
    this.map.set(key, String(value));
  }

  getObject<T>(key: string): T | null {
    const raw = this.map.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  setObject<T>(key: string, value: T): void {
    this.map.set(key, JSON.stringify(value));
  }

  contains(key: string): boolean {
    return this.map.has(key);
  }

  remove(key: string): void {
    this.map.delete(key);
  }

  clearAll(): void {
    this.map.clear();
  }

  getAllKeys(): string[] {
    return Array.from(this.map.keys());
  }
}

/**
 * MMKV Native Storage Adapter wrapping C++ Nitro JSI TurboModule
 */
class MMKVStorageAdapter implements AppStorage {
  constructor(private mmkv: MMKV) {}

  getString(key: string): string | undefined {
    return this.mmkv.getString(key);
  }

  setString(key: string, value: string): void {
    this.mmkv.set(key, value);
  }

  getBoolean(key: string): boolean | undefined {
    return this.mmkv.getBoolean(key);
  }

  setBoolean(key: string, value: boolean): void {
    this.mmkv.set(key, value);
  }

  getNumber(key: string): number | undefined {
    return this.mmkv.getNumber(key);
  }

  setNumber(key: string, value: number): void {
    this.mmkv.set(key, value);
  }

  getObject<T>(key: string): T | null {
    const raw = this.mmkv.getString(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  setObject<T>(key: string, value: T): void {
    this.mmkv.set(key, JSON.stringify(value));
  }

  contains(key: string): boolean {
    return this.mmkv.contains(key);
  }

  remove(key: string): void {
    if (typeof (this.mmkv as any).delete === 'function') {
      (this.mmkv as any).delete(key);
    } else if (typeof (this.mmkv as any).remove === 'function') {
      (this.mmkv as any).remove(key);
    }
  }

  clearAll(): void {
    this.mmkv.clearAll();
  }

  getAllKeys(): string[] {
    return this.mmkv.getAllKeys();
  }
}

function initializeStorage(): AppStorage {
  try {
    // Dynamically require so environments without native NitroModules (like Expo Go or web)
    // gracefully fall back to MemoryStorageAdapter without crashing the runtime on startup.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createMMKV } = require('react-native-mmkv');
    const instance = createMMKV({ id: 'bazar-shodai-fast-storage' });
    return new MMKVStorageAdapter(instance);
  } catch (error) {
    if (__DEV__) {
      console.warn(
        '[Storage] MMKV native module not available in this client (e.g. running in Expo Go). Falling back to MemoryStorageAdapter.',
        error,
      );
    }
    return new MemoryStorageAdapter();
  }
}

/**
 * Global synchronous persistent storage instance
 */
export const storage: AppStorage = initializeStorage();

/**
 * Adapter interface for Zustand's `persist` middleware
 */
export interface ZustandStorageAdapter {
  getItem: (name: string) => string | null;
  setItem: (name: string, value: string) => void;
  removeItem: (name: string) => void;
}

export const zustandStorage: ZustandStorageAdapter = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.setString(name, value),
  removeItem: (name: string) => storage.remove(name),
};

/**
 * Standard Storage Keys
 */
export const StorageKeys = {
  GUEST_TOKEN: 'bazar_guest_token',
  ACTIVE_CART: 'bazar_active_cart',
  USER_PREFERENCES: 'bazar_user_preferences',
  RECENT_SEARCHES: 'bazar_recent_searches',
  LOCATION_CACHE: 'bazar_location_cache',
  THEME_MODE: 'bazar_theme_mode',
} as const;

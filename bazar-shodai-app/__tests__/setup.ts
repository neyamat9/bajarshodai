/* eslint-disable @typescript-eslint/no-explicit-any */
(global as any).__DEV__ = true;

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    select: (objs: any) => objs.android || objs.default,
  },
  Alert: { alert: jest.fn() },
  Linking: { openURL: jest.fn().mockResolvedValue(true) },
  StyleSheet: { create: (styles: any) => styles },
  BackHandler: {
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    removeEventListener: jest.fn(),
    exitApp: jest.fn(),
  },
}));

jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => {
    const memory = new Map<string, any>();
    return {
      getString: jest.fn((k: string) => memory.get(k)),
      set: jest.fn((k: string, v: any) => memory.set(k, String(v))),
      getBoolean: jest.fn((k: string) => memory.get(k)),
      getNumber: jest.fn((k: string) => memory.get(k)),
      contains: jest.fn((k: string) => memory.has(k)),
      delete: jest.fn((k: string) => memory.delete(k)),
      remove: jest.fn((k: string) => memory.delete(k)),
      clearAll: jest.fn(() => memory.clear()),
      getAllKeys: jest.fn(() => Array.from(memory.keys())),
    };
  }),
}));

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage, StorageKeys } from '@/utils/storage';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeState {
  themeMode: ThemePreference;
  setThemeMode: (mode: ThemePreference) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeMode: 'system',
      setThemeMode: (mode) => set({ themeMode: mode }),
      toggleTheme: () =>
        set((state) => ({
          themeMode: state.themeMode === 'dark' ? 'light' : 'dark',
        })),
    }),
    {
      name: StorageKeys.THEME_MODE,
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);

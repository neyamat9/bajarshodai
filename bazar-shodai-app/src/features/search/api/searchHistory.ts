import { storage } from '@/utils/storage';
import { api } from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';

const STORAGE_KEY = 'bazar_recent_searches';
const MAX_HISTORY = 8;

export function getLocalRecentSearches(): string[] {
  const raw = storage.getString(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function saveLocalSearchQuery(term: string): string[] {
  const clean = term.trim();
  if (!clean || clean.length < 2) return getLocalRecentSearches();

  const existing = getLocalRecentSearches().filter(
    (item) => item.toLowerCase() !== clean.toLowerCase(),
  );
  const updated = [clean, ...existing].slice(0, MAX_HISTORY);
  storage.setString(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function removeLocalSearchQuery(term: string): string[] {
  const existing = getLocalRecentSearches().filter((t) => t !== term);
  storage.setString(STORAGE_KEY, JSON.stringify(existing));
  return existing;
}

export function clearLocalSearchHistory(): void {
  storage.remove(STORAGE_KEY);
}

export async function recordSearchHistory(term: string): Promise<void> {
  saveLocalSearchQuery(term);
  const isAuthenticated = useAuthStore.getState().isAuthenticated;
  if (isAuthenticated && term.trim().length >= 2) {
    try {
      await api.post('/customer/search-history', { term: term.trim() });
    } catch {
      // Best effort sync
    }
  }
}

export async function clearAllSearchHistory(): Promise<void> {
  clearLocalSearchHistory();
  const isAuthenticated = useAuthStore.getState().isAuthenticated;
  if (isAuthenticated) {
    try {
      await api.delete('/customer/search-history');
    } catch {
      // Best effort sync
    }
  }
}

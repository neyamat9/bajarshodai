import { QueryClient } from '@tanstack/react-query';
import type { Persister, PersistedClient } from '@tanstack/react-query-persist-client';
import { storage } from '@/utils/storage';

const QUERY_CACHE_KEY = 'bazar_react_query_offline_cache';

/**
 * Standard QueryClient with production mobile defaults
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data remains fresh for 5 minutes
      staleTime: 1000 * 60 * 5,
      // Cached data kept in memory and storage for 24 hours
      gcTime: 1000 * 60 * 60 * 24,
      // Retry twice with exponential delay before failing
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

/**
 * MMKV-backed synchronous offline query cache persister
 */
export const clientPersister: Persister = {
  persistClient: async (client: PersistedClient) => {
    try {
      storage.setString(QUERY_CACHE_KEY, JSON.stringify(client));
    } catch (err) {
      console.warn('[QueryPersister] Error writing query cache to storage:', err);
    }
  },
  restoreClient: async () => {
    const raw = storage.getString(QUERY_CACHE_KEY);
    if (!raw) return undefined;
    try {
      return JSON.parse(raw) as PersistedClient;
    } catch (err) {
      console.warn('[QueryPersister] Error parsing query cache from storage:', err);
      return undefined;
    }
  },
  removeClient: async () => {
    storage.remove(QUERY_CACHE_KEY);
  },
};

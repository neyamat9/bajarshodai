import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { storage } from '@/utils/storage';

const OFFLINE_QUEUE_KEY = 'bazar_offline_mutation_queue';
const CATALOG_CACHE_PREFIX = 'bazar_cache_';

export interface QueuedMutation {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
}

export function cacheData<T>(key: string, data: T): void {
  try {
    storage.setObject(`${CATALOG_CACHE_PREFIX}${key}`, data);
  } catch {
    // MMKV fallback
  }
}

export function getCachedData<T>(key: string): T | null {
  try {
    return storage.getObject<T>(`${CATALOG_CACHE_PREFIX}${key}`);
  } catch {
    return null;
  }
}

export function enqueueOfflineMutation(type: string, payload: any): void {
  try {
    const queue = storage.getObject<QueuedMutation[]>(OFFLINE_QUEUE_KEY) || [];
    const item: QueuedMutation = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      payload,
      timestamp: Date.now(),
    };
    queue.push(item);
    storage.setObject(OFFLINE_QUEUE_KEY, queue);
  } catch {
    // Failed to queue
  }
}

export function getOfflineQueue(): QueuedMutation[] {
  return storage.getObject<QueuedMutation[]>(OFFLINE_QUEUE_KEY) || [];
}

export function clearOfflineQueue(): void {
  storage.remove(OFFLINE_QUEUE_KEY);
}

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected);
      setIsInternetReachable(state.isInternetReachable);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    isConnected: isConnected !== false,
    isInternetReachable: isInternetReachable !== false,
    isOffline: isConnected === false || isInternetReachable === false,
  };
}

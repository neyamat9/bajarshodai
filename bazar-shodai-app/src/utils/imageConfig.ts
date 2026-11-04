import { Image } from 'expo-image';

export interface ImageCacheConfig {
  maxDiskCacheBytes: number;
  maxMemoryCacheBytes: number;
}

export const DEFAULT_IMAGE_CACHE_CONFIG: ImageCacheConfig = {
  // 150 MB disk cache limit
  maxDiskCacheBytes: 150 * 1024 * 1024,
  // 50 MB memory cache limit
  maxMemoryCacheBytes: 50 * 1024 * 1024,
};

/**
 * Clear both disk and memory caches for expo-image.
 */
export async function clearAppImageCache(): Promise<boolean> {
  try {
    await Promise.all([Image.clearDiskCache(), Image.clearMemoryCache()]);
    return true;
  } catch (error) {
    console.warn('[ImageCache] Error clearing image cache:', error);
    return false;
  }
}

/**
 * Prefetches an array of remote image URLs into disk/memory cache.
 */
export async function prefetchImages(urls: string[]): Promise<boolean[]> {
  const validUrls = urls.filter((u) => typeof u === 'string' && u.startsWith('http'));
  try {
    return await Promise.all(validUrls.map((url) => Image.prefetch(url)));
  } catch {
    return [];
  }
}


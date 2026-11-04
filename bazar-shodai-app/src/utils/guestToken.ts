import { storage, StorageKeys } from './storage';

export const GUEST_TOKEN_HEADER = 'x-guest-token';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidGuestToken(token: unknown): token is string {
  return typeof token === 'string' && UUID_REGEX.test(token);
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Returns the active guest token from MMKV storage or generates a new one.
 */
export function getOrCreateGuestToken(): string {
  const existing = storage.getString(StorageKeys.GUEST_TOKEN);
  if (existing && isValidGuestToken(existing)) {
    return existing.toLowerCase();
  }

  const newToken = generateUUID().toLowerCase();
  storage.setString(StorageKeys.GUEST_TOKEN, newToken);
  return newToken;
}

/**
 * Retrieves the currently saved guest token without generating a new one.
 */
export function getGuestToken(): string | null {
  const existing = storage.getString(StorageKeys.GUEST_TOKEN);
  if (existing && isValidGuestToken(existing)) {
    return existing.toLowerCase();
  }
  return null;
}

/**
 * Generates and stores a fresh guest token (e.g. after cart merge or explicit logout).
 */
export function resetGuestToken(): string {
  const newToken = generateUUID().toLowerCase();
  storage.setString(StorageKeys.GUEST_TOKEN, newToken);
  return newToken;
}

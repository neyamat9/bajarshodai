// Talks to the Bazar Shodai backend. Works in the browser (tokens, guest cart id)
// and on the server (public data only, no tokens).

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');
// ASSET_BASE = the origin of the API server (strip the /api suffix)
const ASSET_BASE = API_BASE_URL.replace(/\/api$/, '');

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'APIError';
  }
}

import { translateApiMessage } from '../api-errors';
import { clientLocale } from '../locale';

const isBrowser = () => typeof window !== 'undefined';

// ── image urls ───────────────────────────────────────────
export const PLACEHOLDER_IMAGE = '/placeholder.svg';

/**
 * Converts a raw image URL/path from the API into a fully-qualified URL
 * suitable for use in an <img> src attribute.
 *
 * Handles these input shapes:
 *  - Absolute URL (https://...):  returned as-is (server already knows its public URL)
 *  - Relative path (/uploads/...): prepend ASSET_BASE (derived from NEXT_PUBLIC_API_URL)
 *  - localhost URL in any env:    strip host, treat as relative, prepend ASSET_BASE
 */
export function assetUrl(url?: string | null): string {
  if (!url) return PLACEHOLDER_IMAGE;
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  // Strip localhost/127.0.0.1 prefix that may be left over from dev data
  const clean = url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, '');
  // Already an absolute URL pointing to a real host — use it directly
  if (/^https?:\/\//i.test(clean)) return clean;
  // Relative path: prepend the API server base
  return `${ASSET_BASE}${clean.startsWith('/') ? '' : '/'}${clean}`;
}

// ── token storage ────────────────────────────────────────
const K = { access: 'bs_access', refresh: 'bs_refresh', uid: 'bs_uid', guest: 'bs_guest' } as const;
export const AUTH_CHANGED_EVENT = 'bs:auth-changed';
/** localStorage keys that make up a login — other tabs watch these (the `storage` event) to stay in sync */
export const AUTH_STORAGE_KEYS: readonly string[] = [K.access, K.refresh, K.uid];
/** Dispatched with `detail.reason = 'expired'` when the server ended the session (refresh token rejected) */
export function notifySessionEnded() {
  if (isBrowser()) window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT, { detail: { reason: 'expired' } }));
}

function read(key: string): string | null {
  if (!isBrowser()) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string | null) {
  if (!isBrowser()) return;
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* storage blocked */
  }
}

export const tokens = {
  get access() {
    return read(K.access);
  },
  get refresh() {
    return read(K.refresh);
  },
  get userId() {
    return read(K.uid);
  },
  set(access: string, refresh: string, userId: string) {
    write(K.access, access);
    write(K.refresh, refresh);
    write(K.uid, userId);
  },
  clear() {
    write(K.access, null);
    write(K.refresh, null);
    write(K.uid, null);
  },
};
// kept for older imports
export const setTokens = tokens.set;
export const clearTokens = tokens.clear;

function uuid(): string {
  if (isBrowser() && typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// A guest keeps a cart under this id until they log in (the cart then moves to the account).
export function guestToken(): string | null {
  if (!isBrowser()) return null;
  let t = read(K.guest);
  if (!t) {
    t = uuid();
    write(K.guest, t);
  }
  return t;
}
export function clearGuestToken() {
  write(K.guest, null);
}

// ── request core ─────────────────────────────────────────
function messageOf(data: unknown, fallback: string): string {
  const m = (data as { message?: unknown } | null)?.message;
  if (Array.isArray(m)) return m.join('. ');
  return typeof m === 'string' && m ? m : fallback;
}

// 'ok' = new tokens saved · 'denied' = the server rejected the refresh token (really logged out) · 'error' = couldn't reach it (stay logged in)
type RefreshResult = 'ok' | 'denied' | 'error';
let refreshing: Promise<RefreshResult> | null = null;
async function tryRefresh(): Promise<RefreshResult> {
  const refreshToken = tokens.refresh;
  const userId = tokens.userId;
  if (!refreshToken || !userId) return 'denied';
  refreshing ??= (async (): Promise<RefreshResult> => {
    try {
      const res = await fetch(`${API_BASE_URL}/customer/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken, userId }),
      });
      if (res.status >= 500) return 'error';
      if (!res.ok) {
        // another tab may have rotated the token a moment ago — if so we are still logged in
        return tokens.refresh && tokens.refresh !== refreshToken && tokens.access ? 'ok' : 'denied';
      }
      const json = await res.json();
      const d = json?.data ?? json;
      if (!d?.accessToken) return 'denied';
      tokens.set(d.accessToken, d.refreshToken ?? refreshToken, userId);
      return 'ok';
    } catch {
      return 'error';
    } finally {
      setTimeout(() => (refreshing = null), 0);
    }
  })();
  return refreshing;
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  // server components: seconds the response may be reused (0 = always fresh)
  revalidate?: number;
}

/** Names for the shared server cache, so the API can refresh just the right pages when the admin changes something. */
function cacheTagsFor(endpoint: string): string[] {
  const p = endpoint.split('?')[0];
  if (p.startsWith('/customer/home')) return ['home', 'products'];
  if (p.startsWith('/customer/products')) return ['products'];
  if (p.startsWith('/customer/categories')) return ['categories'];
  if (p.startsWith('/customer/brands')) return ['brands'];
  if (p.startsWith('/customer/banners')) return ['banners', 'home'];
  if (p.startsWith('/customer/settings')) return ['settings'];
  if (p.startsWith('/customer/shipping')) return ['shipping', 'settings'];
  return [];
}

export async function fetchAPI<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { body, revalidate, headers: extra, ...rest } = options;
  const method = (rest.method ?? 'GET').toUpperCase();

  const build = (): RequestInit => {
    const headers: Record<string, string> = { Accept: 'application/json', ...(extra as Record<string, string>) };
    if (body !== undefined && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
    const access = tokens.access;
    if (access) headers.Authorization = `Bearer ${access}`;
    const guest = guestToken();
    if (guest) headers['x-guest-token'] = guest;
    const init: RequestInit = {
      ...rest,
      method,
      headers,
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
    };
    if (!isBrowser() && method === 'GET') {
      (init as RequestInit & { next?: unknown }).next = { revalidate: revalidate ?? 300, tags: cacheTagsFor(endpoint) };
    } else if (method === 'GET') {
      init.cache = 'no-store';
    }
    return init;
  };

  const url = `${API_BASE_URL}${endpoint}`;
  let res: Response;
  try {
    res = await fetch(url, build());
    if (res.status === 401 && isBrowser() && tokens.refresh && !endpoint.includes('/auth/')) {
      const result = await tryRefresh();
      if (result === 'ok') res = await fetch(url, build());
      else if (result === 'denied') {
        tokens.clear();
        notifySessionEnded();
      }
    }
  } catch (e) {
    void e;
    throw new APIError(translateApiMessage('Could not reach the server. Check your connection and try again.', clientLocale()), 0);
  }

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!res.ok) throw new APIError(translateApiMessage(messageOf(json, `Request failed (${res.status})`), clientLocale()), res.status, json);
  if (res.status === 204 || json === null) return undefined as T;
  const env = json as { success?: boolean; data?: unknown };
  return (env && typeof env === 'object' && 'success' in env && 'data' in env ? env.data : json) as T;
}

export const api = {
  get: <T>(endpoint: string, o?: RequestOptions) => fetchAPI<T>(endpoint, o),
  post: <T>(endpoint: string, body?: unknown, o?: RequestOptions) => fetchAPI<T>(endpoint, { ...o, method: 'POST', body }),
  put: <T>(endpoint: string, body?: unknown, o?: RequestOptions) => fetchAPI<T>(endpoint, { ...o, method: 'PUT', body }),
  patch: <T>(endpoint: string, body?: unknown, o?: RequestOptions) => fetchAPI<T>(endpoint, { ...o, method: 'PATCH', body }),
  delete: <T>(endpoint: string, o?: RequestOptions) => fetchAPI<T>(endpoint, { ...o, method: 'DELETE' }),
};

export const errorMessage = (e: unknown, fallback = 'Something went wrong. Please try again.') =>
  e instanceof Error && e.message ? e.message : fallback;

// meta of paged lists
export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}
export interface Paged<T> {
  data: T[];
  meta: PageMeta;
}

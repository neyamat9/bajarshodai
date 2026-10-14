import { api } from '../api/client';
import { clientLocale, type Locale } from '../locale';
import type { DeliveryQuote, GeoPoint, PickedLocation } from '../types/index';
import type { DeliveryConfig } from './site.service';


/** The delivery rules, fresh (the dashboard can change the origin pin at any moment). */
export const getDeliveryConfig = () => api.get<DeliveryConfig>('/customer/shipping/options');

/** Distance and delivery charge for a point: "check my delivery charge". */
export const quoteDelivery = (p: GeoPoint, subtotal = 0) => api.post<DeliveryQuote>('/customer/shipping/quote', { lat: p.lat, lng: p.lng, subtotal });

/** A readable name for a point, in the page language. null when none could be found. */
export async function getPlaceName(p: GeoPoint, lang: Locale = clientLocale()): Promise<string | null> {
  try {
    const r = await api.get<{ name: string | null }>(`/customer/shipping/place?lat=${p.lat}&lng=${p.lng}&lang=${lang}`);
    return r.name;
  } catch {
    return null;
  }
}

export interface FoundPlace {
  name: string;
  lat: number;
  lng: number;
}
export async function searchPlaces(q: string, lang: Locale = clientLocale()): Promise<FoundPlace[]> {
  try {
    const r = await api.get<{ results: FoundPlace[] }>(`/customer/shipping/search?q=${encodeURIComponent(q)}&lang=${lang}`);
    return r.results;
  } catch {
    return [];
  }
}

// ---- the location the customer (or this device) shared last --------------------------------

export interface SharedLocation {
  id: string;
  lat: number;
  lng: number;
  accuracyM: number | null;
  placeName: string | null;
  placeNameBn: string | null;
  source: 'GPS' | 'PIN' | 'SEARCH' | 'LINK';
  capturedAt: string;
}

const pickName = (l: { placeName: string | null; placeNameBn: string | null }, lang: Locale) => (lang === 'bn' ? l.placeNameBn ?? l.placeName : l.placeName ?? l.placeNameBn);

/** The customer pressed "share my location": it is saved on the server (their account, or this device). */
export async function shareLocation(p: PickedLocation, subtotal = 0, lang: Locale = clientLocale()) {
  const r = await api.post<{ location: SharedLocation; quote: DeliveryQuote }>('/customer/my-location', {
    lat: p.lat,
    lng: p.lng,
    accuracyM: p.accuracyM ?? undefined,
    source: p.source === 'LINK' ? 'PIN' : p.source,
    subtotal,
  });
  return { location: toPicked(r.location, lang), quote: r.quote };
}

export async function getSavedLocation(subtotal = 0, lang: Locale = clientLocale()) {
  const r = await api.get<{ location: SharedLocation | null; quote: DeliveryQuote | null }>(`/customer/my-location?subtotal=${subtotal}`);
  return { location: r.location ? toPicked(r.location, lang) : null, quote: r.quote };
}

export const forgetSavedLocation = () => api.delete<{ success: boolean; removed: number }>('/customer/my-location');

function toPicked(l: SharedLocation, lang: Locale): PickedLocation {
  return { lat: l.lat, lng: l.lng, accuracyM: l.accuracyM, source: l.source, placeName: pickName(l, lang) };
}

// ---- the link the shop sends by WhatsApp / Messenger ----------------------------------------

export interface LocationLinkInfo {
  status: 'PENDING' | 'SHARED' | 'EXPIRED';
  name: string | null;
  expiresAt: string;
  shop: { name: string; hotline: string | null; whatsapp: string | null };
  delivery: DeliveryConfig;
  shared: { placeName: string | null; placeNameBn: string | null; distanceKm: number | null; deliveryFee: number | null } | null;
}
export const getLocationLink = (token: string) => api.get<LocationLinkInfo>(`/customer/location-requests/${encodeURIComponent(token)}`);
export const submitLocationLink = (token: string, p: PickedLocation) =>
  api.post<{ success: boolean; placeName: string | null; placeNameBn: string | null; quote: DeliveryQuote }>(`/customer/location-requests/${encodeURIComponent(token)}/submit`, { lat: p.lat, lng: p.lng, accuracyM: p.accuracyM ?? undefined });

import type { LatLng } from '../delivery/fee';

export type Lang = 'bn' | 'en';

export interface RouteResult {
  meters: number;
  seconds: number;
  /** the road to draw on the map, from the origin to the destination */
  path: LatLng[];
}

export interface PlaceResult {
  name: string;
  lat: number;
  lng: number;
}

/**
 * What the shop needs from a map service. Two implementations (OpenStreetMap, Google) answer the same
 * questions, and the admin switches between them in Settings → Maps without a redeploy.
 */
export interface MapProvider {
  readonly name: 'osm' | 'google';
  /** Road distance and time. Returns null when the service has no route (no key, no road, offline). */
  route(origin: LatLng, dest: LatLng): Promise<RouteResult | null>;
  /** A readable place name for a point, in the language asked for. */
  reverseGeocode(point: LatLng, lang: Lang): Promise<string | null>;
  /** Address search, for the "find my street" box. */
  search(query: string, lang: Lang, near?: LatLng): Promise<PlaceResult[]>;
}

/** A provider that is configured badly (missing key) says so with this, so the dashboard can show why. */
export class MapConfigError extends Error {}

export const MAP_TIMEOUT_MS = 8000;

export async function getJson(url: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(MAP_TIMEOUT_MS) });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText} ${body.slice(0, 160)}`.trim());
  }
  return res.json();
}

/** Google's encoded polyline → points. */
export function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    for (const axis of ['lat', 'lng'] as const) {
      let shift = 0;
      let result = 0;
      let byte: number;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20 && index <= encoded.length);
      const delta = result & 1 ? ~(result >> 1) : result >> 1;
      if (axis === 'lat') lat += delta;
      else lng += delta;
    }
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

/** Keeps a long road short enough to send to a phone: every nth point, always the last. */
export function thin(path: LatLng[], max = 300): LatLng[] {
  if (path.length <= max) return path;
  const step = Math.ceil(path.length / max);
  const out = path.filter((_, i) => i % step === 0);
  if (out[out.length - 1] !== path[path.length - 1]) out.push(path[path.length - 1]);
  return out;
}

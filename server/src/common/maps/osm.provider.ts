import type { LatLng } from '../delivery/fee';
import {
  getJson,
  Lang,
  MapConfigError,
  MapProvider,
  PlaceResult,
  RouteResult,
  thin,
} from './map-provider';

interface OsmConfig {
  orsApiKey: string | null;
  contactEmail: string | null;
}

/** Nominatim allows one request a second per client: a tiny queue in front of it. */
let nominatimNext = Promise.resolve();
function nominatimTurn<T>(fn: () => Promise<T>): Promise<T> {
  const run = nominatimNext.then(fn);
  nominatimNext = run.then(
    () => new Promise<void>((r) => setTimeout(r, 1100)),
    () => new Promise<void>((r) => setTimeout(r, 1100)),
  );
  return run;
}

/** OpenStreetMap: road routes from OpenRouteService (free key), place names and search from Nominatim. */
export class OsmProvider implements MapProvider {
  readonly name = 'osm' as const;

  constructor(private cfg: OsmConfig) {}

  private headers() {
    // Nominatim's usage policy wants a real contact in the User-Agent
    const contact = this.cfg.contactEmail ? ` (${this.cfg.contactEmail})` : '';
    return {
      'User-Agent': `BazarShodai/1.0${contact}`,
      Accept: 'application/json',
    };
  }

  async route(origin: LatLng, dest: LatLng): Promise<RouteResult | null> {
    const key = this.cfg.orsApiKey;
    if (!key) throw new MapConfigError('OpenRouteService key is not set');
    const url =
      'https://api.openrouteservice.org/v2/directions/driving-car' +
      `?api_key=${encodeURIComponent(key)}` +
      `&start=${origin.lng},${origin.lat}&end=${dest.lng},${dest.lat}`;
    const json = (await getJson(url, {
      headers: {
        ...this.headers(),
        Accept: 'application/geo+json, application/json, */*',
        Authorization: key,
      },
    })) as {
      features?: {
        properties?: { summary?: { distance?: number; duration?: number } };
        geometry?: { coordinates?: [number, number][] };
      }[];
    };
    const f = json.features?.[0];
    const summary = f?.properties?.summary;
    if (!summary?.distance) return null;
    const path = (f?.geometry?.coordinates ?? []).map(([lng, lat]) => ({
      lat,
      lng,
    }));
    return {
      meters: summary.distance,
      seconds: summary.duration ?? 0,
      path: thin(path),
    };
  }

  async reverseGeocode(point: LatLng, lang: Lang): Promise<string | null> {
    const url =
      'https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=17&addressdetails=1' +
      `&lat=${point.lat}&lon=${point.lng}&accept-language=${lang}`;
    const json = (await nominatimTurn(() =>
      getJson(url, { headers: this.headers() }),
    )) as {
      name?: string;
      display_name?: string;
      address?: Record<string, string>;
    };
    return shortAddress(json) ?? null;
  }

  async search(
    query: string,
    lang: Lang,
    near?: LatLng,
  ): Promise<PlaceResult[]> {
    // 1. If OpenRouteService API key is available, use ORS Geocoding (Pelias)
    if (this.cfg.orsApiKey) {
      try {
        const focus = near
          ? `&focus.point.lat=${near.lat}&focus.point.lon=${near.lng}`
          : '';
        const url =
          `https://api.openrouteservice.org/geocode/autocomplete?api_key=${encodeURIComponent(this.cfg.orsApiKey)}` +
          `&text=${encodeURIComponent(query)}&boundary.country=BGD&size=6${focus}`;
        const json = (await getJson(url, { headers: { Accept: 'application/json' } })) as {
          features?: {
            properties?: { label?: string; name?: string };
            geometry?: { coordinates?: [number, number] };
          }[];
        };
        const features = json.features ?? [];
        if (features.length > 0) {
          return features.map((f) => ({
            name: f.properties?.label ?? f.properties?.name ?? query,
            lng: f.geometry?.coordinates?.[0] ?? 0,
            lat: f.geometry?.coordinates?.[1] ?? 0,
          }));
        }
      } catch {
        // Fall back to Nominatim below if ORS geocoding errors
      }
    }

    // 2. Fall back to OpenStreetMap Nominatim
    const view = near
      ? `&viewbox=${near.lng - 0.5},${near.lat + 0.5},${near.lng + 0.5},${near.lat - 0.5}`
      : '';
    const url =
      'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&countrycodes=bd' +
      `&accept-language=${lang}&q=${encodeURIComponent(query)}${view}`;
    const rows = (await nominatimTurn(() =>
      getJson(url, { headers: this.headers() }),
    )) as {
      display_name: string;
      lat: string;
      lon: string;
    }[];
    return rows.map((r) => ({
      name: r.display_name,
      lat: Number(r.lat),
      lng: Number(r.lon),
    }));
  }
}

/** "Kalibari Bazar, Shahrasti": the useful first parts of an OpenStreetMap address, not the whole country chain. */
function shortAddress(j: {
  name?: string;
  display_name?: string;
  address?: Record<string, string>;
}): string | null {
  const a = j.address ?? {};
  const parts = [
    j.name,
    a.road,
    a.neighbourhood ?? a.suburb ?? a.hamlet ?? a.village,
    a.town ?? a.city_district ?? a.county,
    a.city ?? a.state_district,
  ].filter((p): p is string => !!p);
  const seen = new Set<string>();
  const unique = parts.filter((p) =>
    seen.has(p) ? false : (seen.add(p), true),
  );
  if (unique.length) return unique.slice(0, 3).join(', ');
  return j.display_name
    ? j.display_name.split(',').slice(0, 3).join(',').trim()
    : null;
}

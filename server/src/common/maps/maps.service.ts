import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from '../cache';
import { SettingsService } from '../settings';
import { haversineKm, type LatLng } from '../delivery/fee';
import { GoogleProvider } from './google.provider';
import { Lang, MapConfigError, MapProvider, PlaceResult, RouteResult } from './map-provider';
import { OsmProvider } from './osm.provider';

export interface RouteAnswer {
  meters: number;
  km: number;
  seconds: number;
  path: LatLng[];
  /** true when no road route was found and the distance is the straight line times a factor */
  estimated: boolean;
  provider: 'osm' | 'google';
  /** why the estimate was used, for the admin */
  note?: string;
}

const DAY_MS = 24 * 3600 * 1000;
const key5 = (p: LatLng) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`;
// slow roads in a village: used only to guess a time when the route is estimated
const FALLBACK_KMH = 22;

/**
 * Everything the shop asks a map for, behind one door. It picks the provider the admin chose
 * (Settings → Maps), remembers answers so the same place is never paid for twice, stops at the daily cap,
 * and falls back to a straight-line estimate so a map outage never blocks an order.
 */
@Injectable()
export class MapsService {
  private readonly logger = new Logger(MapsService.name);
  private usage = { day: '', route: 0, geocode: 0, search: 0 };

  constructor(
    private settings: SettingsService,
    private cache: CacheService,
  ) {}

  private async provider(): Promise<MapProvider> {
    const m = await this.settings.get('maps');
    return m.provider === 'google' ? new GoogleProvider(m.googleServerKey) : new OsmProvider({ orsApiKey: m.orsApiKey, contactEmail: m.contactEmail });
  }

  private today() {
    const d = new Date(Date.now() + 6 * 3600 * 1000).toISOString().slice(0, 10); // Bangladesh day
    if (this.usage.day !== d) this.usage = { day: d, route: 0, geocode: 0, search: 0 };
    return d;
  }

  /** Counts one billable call; false when today's cap is used up. */
  private async spend(kind: 'route' | 'geocode' | 'search'): Promise<boolean> {
    this.today();
    const cap = (await this.settings.get('maps')).dailyRequestCap;
    const total = this.usage.route + this.usage.geocode + this.usage.search;
    if (cap > 0 && total >= cap) return false;
    this.usage[kind]++;
    return true;
  }

  async usageToday() {
    this.today();
    const m = await this.settings.get('maps');
    return { ...this.usage, cap: m.dailyRequestCap, provider: m.provider };
  }

  /** Road distance and time between two points; an estimate (flagged) when no road route can be had. */
  async route(origin: LatLng, dest: LatLng): Promise<RouteAnswer> {
    const m = await this.settings.get('maps');
    const d = await this.settings.get('delivery');
    const cacheKey = `maps:route:${m.provider}:${key5(origin)}>${key5(dest)}`;
    const cached = this.cache.get<RouteAnswer>(cacheKey);
    if (cached) return cached;

    const straight = haversineKm(origin, dest);
    const estimate = (note: string): RouteAnswer => {
      const km = straight * d.routeFactor;
      return {
        meters: Math.round(km * 1000),
        km: Math.round(km * 100) / 100,
        seconds: Math.round((km / FALLBACK_KMH) * 3600),
        path: [origin, dest],
        estimated: true,
        provider: m.provider,
        note,
      };
    };

    let found: RouteResult | null = null;
    let note = 'no road route found';
    try {
      if (!(await this.spend('route'))) {
        note = 'the daily map limit was reached';
      } else {
        found = await (await this.provider()).route(origin, dest);
      }
    } catch (e) {
      note = e instanceof MapConfigError ? e.message : `the map service failed (${e instanceof Error ? e.message : String(e)})`;
      if (!(e instanceof MapConfigError)) this.logger.warn(`Route failed: ${note}`);
    }

    if (!found) return estimate(note);
    const answer: RouteAnswer = {
      meters: found.meters,
      km: Math.round((found.meters / 1000) * 100) / 100,
      seconds: found.seconds,
      path: found.path,
      estimated: false,
      provider: m.provider,
    };
    this.cache.set(cacheKey, answer, 3600);
    return answer;
  }

  /** A readable place name for a point (cached for a month: places do not move). */
  async placeName(point: LatLng, lang: Lang): Promise<string | null> {
    const m = await this.settings.get('maps');
    const cacheKey = `maps:place:${m.provider}:${lang}:${key5(point)}`;
    const cached = this.cache.get<string>(cacheKey);
    if (cached) return cached;
    try {
      if (!(await this.spend('geocode'))) return null;
      const name = await (await this.provider()).reverseGeocode(point, lang);
      if (name) this.cache.set(cacheKey, name, (30 * DAY_MS) / 1000);
      return name;
    } catch (e) {
      this.logger.warn(`Place name failed: ${e instanceof Error ? e.message : String(e)}`);
      return null;
    }
  }

  async search(query: string, lang: Lang, near?: LatLng): Promise<PlaceResult[]> {
    const q = query.trim();
    if (q.length < 3) return [];
    const m = await this.settings.get('maps');
    const cacheKey = `maps:search:${m.provider}:${lang}:${q.toLowerCase()}`;
    const cached = this.cache.get<PlaceResult[]>(cacheKey);
    if (cached) return cached;
    try {
      if (!(await this.spend('search'))) return [];
      const rows = await (await this.provider()).search(q, lang, near);
      this.cache.set(cacheKey, rows, 3600);
      return rows;
    } catch (e) {
      this.logger.warn(`Search failed: ${e instanceof Error ? e.message : String(e)}`);
      return [];
    }
  }

  /** For the "Test connection" button: one real route and one place name, with the reason when something fails. */
  async test() {
    const m = await this.settings.get('maps');
    const d = await this.settings.get('delivery');
    const a: LatLng = d.originLat !== null && d.originLng !== null ? { lat: d.originLat, lng: d.originLng } : { lat: 23.2, lng: 90.9 };
    const b: LatLng = { lat: a.lat + 0.02, lng: a.lng + 0.02 };
    const provider = await this.provider();
    const out: { provider: string; route: { ok: boolean; km?: number; error?: string }; place: { ok: boolean; name?: string; error?: string } } = {
      provider: m.provider,
      route: { ok: false },
      place: { ok: false },
    };
    try {
      const r = await provider.route(a, b);
      out.route = r ? { ok: true, km: Math.round((r.meters / 1000) * 100) / 100 } : { ok: false, error: 'No route found' };
    } catch (e) {
      out.route = { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
    try {
      const n = await provider.reverseGeocode(a, 'en');
      out.place = n ? { ok: true, name: n } : { ok: false, error: 'No place name found' };
    } catch (e) {
      out.place = { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
    return out;
  }
}

import type { LatLng } from '../delivery/fee';
import {
  decodePolyline,
  getJson,
  Lang,
  MapConfigError,
  MapProvider,
  PlaceResult,
  RouteResult,
  thin,
} from './map-provider';

/** Google: Routes API for the road, Geocoding for place names and address search. */
export class GoogleProvider implements MapProvider {
  readonly name = 'google' as const;

  constructor(private serverKey: string | null) {}

  private key(): string {
    if (!this.serverKey) throw new MapConfigError('Google server key is not set');
    return this.serverKey;
  }

  async route(origin: LatLng, dest: LatLng): Promise<RouteResult | null> {
    const key = this.key();
    const json = (await getJson('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        // only what we use: this keeps the call in the cheaper "Essentials" tier
        'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline',
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
        destination: { location: { latLng: { latitude: dest.lat, longitude: dest.lng } } },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_UNAWARE',
      }),
    })) as { routes?: { distanceMeters?: number; duration?: string; polyline?: { encodedPolyline?: string } }[] };
    const r = json.routes?.[0];
    if (!r?.distanceMeters) return null;
    return {
      meters: r.distanceMeters,
      seconds: r.duration ? parseInt(r.duration, 10) || 0 : 0, // "930s"
      path: thin(r.polyline?.encodedPolyline ? decodePolyline(r.polyline.encodedPolyline) : []),
    };
  }

  async reverseGeocode(point: LatLng, lang: Lang): Promise<string | null> {
    const url =
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${point.lat},${point.lng}` +
      `&language=${lang}&result_type=street_address|route|neighborhood|sublocality|locality&key=${this.key()}`;
    const json = (await getJson(url)) as { status?: string; error_message?: string; results?: { formatted_address: string }[] };
    if (json.status && !['OK', 'ZERO_RESULTS'].includes(json.status)) {
      throw new Error(`${json.status} ${json.error_message ?? ''}`.trim());
    }
    const first = json.results?.[0]?.formatted_address;
    // "Kalibari Bazar, Shahrasti, Chandpur, Bangladesh" → the first three parts
    return first ? first.split(',').slice(0, 3).join(',').trim() : null;
  }

  async search(query: string, lang: Lang): Promise<PlaceResult[]> {
    const url =
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}` +
      `&region=bd&language=${lang}&key=${this.key()}`;
    const json = (await getJson(url)) as {
      status?: string;
      error_message?: string;
      results?: { formatted_address: string; geometry: { location: { lat: number; lng: number } } }[];
    };
    if (json.status && !['OK', 'ZERO_RESULTS'].includes(json.status)) {
      throw new Error(`${json.status} ${json.error_message ?? ''}`.trim());
    }
    return (json.results ?? []).slice(0, 6).map((r) => ({ name: r.formatted_address, lat: r.geometry.location.lat, lng: r.geometry.location.lng }));
  }
}

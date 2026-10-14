// The delivery fee: pure functions, so the rule can be tested to the paisa.

export interface LatLng {
  lat: number;
  lng: number;
}

export interface FeeRule {
  baseKm: number;
  baseCharge: number;
  perKmRate: number;
  stepKm: number;
}

const round = (n: number, places: number) => {
  const f = 10 ** places;
  return Math.round((n + Number.EPSILON) * f) / f;
};

/** Straight-line distance between two points on the earth, in km (haversine). */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371.0088;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * distance <= baseKm  -> baseCharge
 * otherwise           -> baseCharge + perKmRate * ceil((distance - baseKm) / stepKm)
 * The distance is rounded to 2 decimals first, so 2.0000001 km is not charged as "just over 2 km".
 *
 *   0 – 2 km  -> 20      2.01 – 3 km -> 30      3.01 – 4 km -> 40   … (+10 per started km)
 */
export function feeForDistance(distanceKm: number, rule: FeeRule): number {
  const d = round(Math.max(0, distanceKm), 2);
  if (d <= rule.baseKm) return rule.baseCharge;
  const step = rule.stepKm > 0 ? rule.stepKm : 1;
  // the 6-place rounding stops (3.0 - 2) / 1 from becoming 1.0000000000000002
  const steps = Math.ceil(round((d - rule.baseKm) / step, 6));
  return round(rule.baseCharge + rule.perKmRate * steps, 2);
}

/** Is the point inside the service circle? (straight line from the centre) */
export function withinRadius(
  centre: LatLng,
  point: LatLng,
  radiusKm: number,
): { ok: boolean; km: number } {
  const km = haversineKm(centre, point);
  return { ok: km <= radiusKm + 1e-9, km: round(km, 2) };
}

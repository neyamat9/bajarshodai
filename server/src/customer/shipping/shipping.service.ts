import { Injectable } from '@nestjs/common';
import { SettingsService, DeliverySettings } from '../../common/settings';
import { MapsService } from '../../common/maps';
import { feeForDistance, haversineKm, withinRadius, isWithinShahrastiZone, isAbroadPoint, type LatLng } from '../../common/delivery/fee';

export type DeliveryBlock =
  | 'DISABLED' // the shop is not taking delivery orders
  | 'ORIGIN_NOT_SET' // the admin has not dropped the origin pin yet
  | 'NO_LOCATION' // the customer has not shared a location yet
  | 'OUT_OF_AREA'; // farther than the service radius

export interface ShippingQuote {
  // false when an order cannot be delivered: see `block`
  available: boolean;
  block: DeliveryBlock | null;
  // Road or direct distance from the shop's origin to the customer's pin (null until a location is known)
  distanceKm: number | null;
  directDistanceKm?: number | null;
  roadDistanceKm?: number | null;
  distanceCalculation?: 'direct' | 'road';
  durationSec: number | null;
  // true when no road route was found and the distance is the straight line times a factor
  estimated: boolean;
  estimateNote: string | null;
  // What the formula says for this distance
  calculatedFee: number | null;
  // What the customer pays after free delivery
  cost: number;
  isFree: boolean;
  freeDeliveryThreshold: number | null;
  // How much more to add for free delivery (null if not applicable)
  amountForFreeDelivery: number | null;
  // Straight-line distance from the centre of the service area, and the limit
  straightKm: number | null;
  radiusKm: number;
  // Detected overseas location or manual delivery fee pending
  isAbroad?: boolean;
  isPendingFee?: boolean;
}

export interface ShippingInput {
  lat?: number | null;
  lng?: number | null;
  // True when every product in the cart is marked "free shipping".
  allItemsFreeShipping?: boolean;
  // True when customer is ordering from abroad or remote without pin
  skipLocation?: boolean;
}

/** The delivery settings a customer's browser may know (no secrets here: those live in the maps group). */
export function publicDelivery(d: DeliverySettings) {
  const originSet = d.originLat !== null && d.originLng !== null;
  return {
    enabled: d.enabled,
    shopOpen: d.shopOpen,
    openFrom: d.openFrom,
    openTo: d.openTo,
    originSet,
    origin: originSet ? { lat: d.originLat, lng: d.originLng, label: d.originLabel, labelBn: d.originLabelBn } : null,
    serviceRadiusKm: d.serviceRadiusKm,
    baseKm: d.baseKm,
    baseCharge: d.baseCharge,
    perKmRate: d.perKmRate,
    stepKm: d.stepKm,
    minOrderAmount: d.minOrderAmount,
    freeDeliveryThreshold: d.freeDeliveryThreshold,
    slots: d.slots,
    restrictToZone: d.restrictToZone ?? true,
    distanceCalculation: d.distanceCalculation ?? 'direct',
  };
}

@Injectable()
export class ShippingService {
  constructor(
    private settings: SettingsService,
    private maps: MapsService,
  ) {}

  /** The point distances are measured from, or null until the admin sets it. */
  origin(d: DeliverySettings): LatLng | null {
    return d.originLat !== null && d.originLng !== null ? { lat: d.originLat, lng: d.originLng } : null;
  }

  async getOptions() {
    return publicDelivery(await this.settings.get('delivery'));
  }

  async quote(subtotal: number, input: ShippingInput = {}): Promise<ShippingQuote> {
    const d = await this.settings.get('delivery');
    const threshold = d.freeDeliveryThreshold;
    const base: ShippingQuote = {
      available: false,
      block: null,
      distanceKm: null,
      directDistanceKm: null,
      roadDistanceKm: null,
      distanceCalculation: d.distanceCalculation ?? 'direct',
      durationSec: null,
      estimated: false,
      estimateNote: null,
      calculatedFee: null,
      cost: 0,
      isFree: false,
      freeDeliveryThreshold: threshold,
      amountForFreeDelivery: null,
      straightKm: null,
      radiusKm: d.serviceRadiusKm,
    };
    if (!d.enabled) return { ...base, block: 'DISABLED' };
    const origin = this.origin(d);
    if (!origin) return { ...base, block: 'ORIGIN_NOT_SET' };

    // When customer is ordering from abroad or skipping location pin
    if (input.skipLocation) {
      return {
        ...base,
        available: true,
        block: null,
        calculatedFee: null,
        cost: 0,
        isFree: false,
        isPendingFee: true,
      };
    }

    if (input.lat == null || input.lng == null) return { ...base, block: 'NO_LOCATION' };

    const dest = { lat: input.lat, lng: input.lng };
    const centre = d.centerLat !== null && d.centerLng !== null ? { lat: d.centerLat, lng: d.centerLng } : origin;
    const inside = withinRadius(centre, dest, d.serviceRadiusKm);
    const inZone = isWithinShahrastiZone(dest);
    const enforceZone = d.restrictToZone !== false;

    if (!inside.ok || (enforceZone && !inZone)) {
      const abroad = isAbroadPoint(dest);
      return { ...base, block: 'OUT_OF_AREA', straightKm: inside.km, isAbroad: abroad };
    }

    const straight = haversineKm(origin, dest);
    const directKm = Math.round(straight * 100) / 100;

    const route = await this.maps.route(origin, dest);
    const roadKm = Math.max(route.km, directKm);

    const isDirect = (d.distanceCalculation ?? 'direct') === 'direct';
    const chargedKm = isDirect ? directKm : roadKm;
    const fee = feeForDistance(chargedKm, d);

    const qualifiesForFree = !!input.allItemsFreeShipping || (threshold !== null && subtotal >= threshold);
    return {
      ...base,
      available: true,
      distanceKm: chargedKm,
      directDistanceKm: directKm,
      roadDistanceKm: roadKm,
      distanceCalculation: isDirect ? 'direct' : 'road',
      durationSec: route.seconds,
      estimated: isDirect ? false : route.estimated,
      estimateNote: isDirect ? null : (route.note ?? null),
      calculatedFee: fee,
      cost: qualifiesForFree ? 0 : fee,
      isFree: qualifiesForFree,
      amountForFreeDelivery: threshold !== null && !qualifiesForFree ? round2(threshold - subtotal) : null,
      straightKm: inside.km,
    };
  }
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

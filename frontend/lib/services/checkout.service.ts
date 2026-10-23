import { api } from '../api/client';
import { assetUrl } from '../api/client';
import type { DeliveryQuote } from '../types/index';

export interface LoyaltyQuote {
  enabled: boolean;
  pointsEarned: number;
  userPoints: number;
  pointsRedeemed: number;
  pointsDiscountAmount: number;
  minOrderAmountToRedeem: number;
  minPointsToRedeem: number;
  canRedeem: boolean;
  redemptionError?: string;
  milestone: {
    enabled: boolean;
    eligible: boolean;
    freeShippingApplied: boolean;
    weightExceeded: boolean;
    orderWeightKg: number;
    maxWeightKg: number;
    deliveredCount: number;
    interval: number;
  };
}

export interface CheckoutSummary {
  items: { cartItemId: string; productId: string; variantId: string | null; name: string; slug: string; image: string | null; variantName: string | null; unitPrice: number; quantity: number; lineTotal: number; availableStock: number; issue: string | null }[];
  itemCount: number;
  subtotal: number;
  shipping: DeliveryQuote;
  coupon: { applied: boolean; code: string; description: string | null; discountType: string; discount: number; shippingDiscount: number } | null;
  discountAmount: number;
  pointsDiscountAmount?: number;
  pointsRedeemed?: number;
  pointsEarned?: number;
  orderWeightKg?: number;
  loyalty?: LoyaltyQuote;
  shippingCost: number;
  taxAmount: number;
  total: number;
  paymentMethods: ('CASH_ON_DELIVERY' | 'BKASH' | 'NAGAD' | 'ROCKET')[];
  minOrderAmount: number;
  minOrderOk: boolean;
  shopOpen: boolean;
  canPlaceOrder: boolean;
  issues: string[];
}

export interface SummaryInput {
  couponCode?: string;
  /** the delivery pin: the delivery charge comes from it */
  lat?: number;
  lng?: number;
  phone?: string;
  redeemPoints?: number;
}

export async function getCheckoutSummary(input: SummaryInput = {}): Promise<CheckoutSummary> {
  const s = await api.post<CheckoutSummary>('/customer/checkout/summary', input);
  return { ...s, items: s.items.map((i) => ({ ...i, image: assetUrl(i.image) })) };
}

export async function applyCoupon(couponCode: string, input: SummaryInput = {}): Promise<CheckoutSummary> {
  const s = await api.post<CheckoutSummary>('/customer/coupons/apply', { ...input, couponCode });
  return { ...s, items: s.items.map((i) => ({ ...i, image: assetUrl(i.image) })) };
}

// Locations (division → district → area)
export interface Place {
  id: string;
  name: string;
  bnName?: string;
}
export const getDivisions = () => api.get<Place[]>('/customer/locations/divisions', { revalidate: 3600 });
export const getDistricts = (division: string) => api.get<Place[]>(`/customer/locations/divisions/${encodeURIComponent(division)}/districts`, { revalidate: 3600 });
export const getUpazilas = (district: string) => api.get<Place[]>(`/customer/locations/districts/${encodeURIComponent(district)}/upazilas`, { revalidate: 3600 });

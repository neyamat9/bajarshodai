import { api, clean, type Paged } from "./client";

export const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "RETURNED", "REFUNDED", "ON_HOLD"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";
export type PaymentMethod = "CASH_ON_DELIVERY" | "BKASH" | "NAGAD" | "ROCKET";
export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = { CASH_ON_DELIVERY: "Cash on delivery", BKASH: "bKash", NAGAD: "Nagad", ROCKET: "Rocket" };
export const isMobileBanking = (m: string) => m === "BKASH" || m === "NAGAD" || m === "ROCKET";

export interface OrderItem {
  id: string;
  quantity: number;
  price: string;
  total: string;
  productName: string;
  productSlug: string;
  productImage: string | null;
  variantName: string | null;
  variantSku: string | null;
  productId: string;
  variantId: string | null;
}
export interface Address {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  city: string;
  state: string | null;
  division: string | null;
  district: string | null;
  upazila: string | null;
  postalCode: string | null;
  country: string;
  isDefault?: boolean;
  label?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  placeName?: string | null;
  landmark?: string | null;
}
export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  source: "WEB" | "ADMIN";
  subtotal: string;
  shippingCost: string;
  discountAmount: string;
  couponCode: string | null;
  total: string;
  paidAmount: string;
  dueAmount: string;
  placedAt: string;
  guestName: string | null;
  guestPhone: string | null;
  guestEmail: string | null;
  trackingNumber: string | null;
  courierName: string | null;
  user: { id: string; name: string; email: string; phone: string | null } | null;
  items: OrderItem[];
  shippingAddress: Address | null;
  delivery?: { id: string; status: string; assignee: { id: string; name: string } } | null;
}
export interface Payment {
  id: string;
  method: PaymentMethod;
  status: string;
  amount: string;
  transactionId: string | null;
  referenceId: string | null;
  paidAt: string | null;
  createdAt: string;
  refunds: Refund[];
}
export interface Refund {
  id: string;
  amount: string;
  reason: string;
  method: string;
  status: string;
  processedBy: string | null;
  processedAt: string | null;
  createdAt: string;
  returnRequestId: string | null;
}
export interface OrderDetail extends OrderSummary {
  bkashTransactionId: string | null;
  bkashSenderNumber: string | null;
  paymentVerifiedAt: string | null;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  estimatedDelivery: string | null;
  trackingUrl: string | null;
  deliveryNote: string | null;
  internalNote: string | null;
  staffNote: string | null;
  customerNote: string | null;
  deliveryLat: number | null;
  deliveryLng: number | null;
  deliveryPlaceName: string | null;
  deliveryLandmark: string | null;
  deliveryDistanceKm: string | null;
  deliveryDurationSec: number | null;
  distanceEstimated: boolean;
  /** the charge the distance gives; shippingCost is what is charged */
  deliveryFee: string | null;
  deliveryFeeOverride: string | null;
  deliveryFeeOverrideReason: string | null;
  deliverySlot: string | null;
  delivery: {
    id: string;
    status: "ASSIGNED" | "ACCEPTED" | "PICKED_UP" | "ON_THE_WAY" | "DELIVERED" | "FAILED" | "CANCELLED";
    attempts: number;
    failedReason: string | null;
    cashCollected: string | null;
    cashHandedOverAt: string | null;
    assignee: { id: string; name: string; phone: string; staffTitle: string | null };
    events: { id: string; status: "ASSIGNED" | "ACCEPTED" | "PICKED_UP" | "ON_THE_WAY" | "DELIVERED" | "FAILED" | "CANCELLED"; actorName: string | null; note: string | null; createdAt: string }[];
  } | null;
  statusHistory: { id: string; fromStatus: OrderStatus | null; toStatus: OrderStatus; note: string | null; changedBy: string | null; createdAt: string }[];
  payments: Payment[];
  refundTransactions: Refund[];
  returnRequests: { id: string; status: string; createdAt: string }[];
  warnings?: string[];
}

export interface OrderStats {
  total: number;
  today: number;
  pending: number;
  toShip: number;
  inDelivery: number;
  delivered: number;
  onHold: number;
  ended: number;
  paymentToVerify: number;
  revenue: number;
  revenueToday: number;
}

export interface OrderFilters {
  status?: string;
  /** a group of statuses: pending · toShip · inDelivery · delivered · onHold · ended */
  stage?: string;
  /** "true" = mobile payments still to verify */
  toVerify?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  source?: string;
  from?: string;
  to?: string;
  search?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}

export interface OrderLineInput {
  itemId?: string;
  productId?: string;
  variantId?: string;
  quantity: number;
  price?: number;
}
export interface AddressInput {
  fullName: string;
  phone: string;
  address: string;
  division?: string;
  district?: string;
  upazila?: string;
  city?: string;
  postalCode?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  placeName?: string;
}
export interface CreateOrderInput {
  customer?: { userId?: string; email?: string };
  /** over-the-counter sale: no delivery, no address */
  walkIn?: boolean;
  walkInName?: string;
  walkInPhone?: string;
  shippingAddress?: AddressInput;
  items: OrderLineInput[];
  paymentMethod: PaymentMethod;
  couponCode?: string;
  discountAmount?: number;
  shippingCost?: number;
  amountPaid?: number;
  transactionId?: string;
  status?: "PENDING" | "CONFIRMED";
  deliveryNote?: string;
  internalNote?: string;
  notifyCustomer?: boolean;
}

export interface ShippingQuote {
  available: boolean;
  block: "DISABLED" | "ORIGIN_NOT_SET" | "NO_LOCATION" | "OUT_OF_AREA" | null;
  distanceKm: number | null;
  durationSec: number | null;
  estimated: boolean;
  estimateNote: string | null;
  calculatedFee: number | null;
  cost: number;
  isFree: boolean;
  freeDeliveryThreshold: number | null;
  amountForFreeDelivery: number | null;
  straightKm: number | null;
  radiusKm: number;
}

export interface OrderRoute {
  available: boolean;
  origin?: { lat: number; lng: number; label?: string };
  destination?: { lat: number; lng: number };
  km?: number;
  seconds?: number;
  path?: { lat: number; lng: number }[];
  estimated?: boolean;
  note?: string;
}

export interface LocationRequest {
  id: string;
  token: string;
  url: string;
  phone: string | null;
  name: string | null;
  orderId: string | null;
  status: "PENDING" | "SHARED" | "EXPIRED";
  expiresAt: string;
  lat: number | null;
  lng: number | null;
  accuracyM: number | null;
  placeName: string | null;
  placeNameBn: string | null;
  distanceKm: number | null;
  deliveryFee: number | null;
  sharedAt: string | null;
  createdAt: string;
}

export const ordersApi = {
  stats: (f: OrderFilters) => api.get<OrderStats>("/admin/orders/stats", { params: clean({ ...f }) }).then((r) => r.data),
  shippingQuote: (p: { subtotal: number; lat?: number; lng?: number; productIds?: string[] }) =>
    api.get<ShippingQuote>("/admin/orders/shipping-quote", { params: clean({ subtotal: p.subtotal, lat: p.lat, lng: p.lng, productIds: p.productIds?.join(",") }) }).then((r) => r.data),
  route: (id: string) => api.get<OrderRoute>(`/admin/orders/${id}/route`).then((r) => r.data),
  setPin: (id: string, body: { latitude: number; longitude: number; placeName?: string; landmark?: string; recalculateShipping?: boolean }) =>
    api.put<OrderDetail>(`/admin/orders/${id}/delivery-pin`, body).then((r) => r.data),
  overrideFee: (id: string, body: { fee: number | null; reason?: string }) => api.put<OrderDetail>(`/admin/orders/${id}/delivery-fee`, body).then((r) => r.data),
  requestLocation: (body: { phone?: string; name?: string; orderId?: string }) => api.post<LocationRequest>("/admin/location-requests", body).then((r) => r.data),
  locationRequests: (orderId: string) => api.get<LocationRequest[]>("/admin/location-requests", { params: { orderId } }).then((r) => r.data),
  list: (f: OrderFilters) => api.get<Paged<OrderSummary>>("/admin/orders", { params: clean({ ...f }) }).then((r) => r.data),
  get: (id: string) => api.get<OrderDetail>(`/admin/orders/${id}`).then((r) => r.data),
  create: (body: CreateOrderInput) => api.post<OrderDetail>("/admin/orders", body).then((r) => r.data),
  setStatus: (id: string, status: OrderStatus, note?: string) => api.patch<unknown>(`/admin/orders/${id}/status`, { status, note: note || undefined }).then((r) => r.data),
  bulkStatus: (ids: string[], status: OrderStatus, note?: string) =>
    api.patch<{ updated: number; failed: number; results: { id: string; orderNumber?: string; ok: boolean; error?: string }[] }>("/admin/orders/bulk-status", { ids, status, note: note || undefined }).then((r) => r.data),
  shipping: (id: string, body: { courierName?: string | null; trackingNumber?: string | null; trackingUrl?: string | null; notifyCustomer?: boolean }) =>
    api.patch<OrderDetail>(`/admin/orders/${id}/shipping`, body).then((r) => r.data),
  notes: (id: string, body: { internalNote?: string | null; staffNote?: string | null; deliveryNote?: string | null }) => api.patch<OrderDetail>(`/admin/orders/${id}/notes`, body).then((r) => r.data),
  address: (id: string, body: AddressInput & { recalculateShipping?: boolean }) => api.put<OrderDetail>(`/admin/orders/${id}/address`, body).then((r) => r.data),
  items: (id: string, body: { items: OrderLineInput[]; discountAmount?: number; shippingCost?: number; recalculateShipping?: boolean; reason?: string }) =>
    api.put<OrderDetail>(`/admin/orders/${id}/items`, body).then((r) => r.data),
  verifyPayment: (id: string, paymentStatus: "PAID" | "FAILED", note?: string) => api.patch<unknown>(`/admin/orders/${id}/verify-payment`, { paymentStatus, note: note || undefined }).then((r) => r.data),
  recordPayment: (id: string, body: { amount: number; method: PaymentMethod; transactionId?: string; note?: string }) => api.post(`/admin/orders/${id}/payments`, body).then((r) => r.data),
  refund: (id: string, body: { paymentId?: string; amount: number; method: "ORIGINAL_PAYMENT" | "STORE_CREDIT" | "BANK_TRANSFER"; reason: string }) => api.post(`/admin/orders/${id}/refunds`, body).then((r) => r.data),
};

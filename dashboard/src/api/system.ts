import { api, clean, type Paged } from "./client";
import { tr } from "@/i18n";

// ---------- reports ----------
export interface ReportTable {
  title: string;
  meta?: Record<string, unknown>;
  columns: { key: string; header: string; type?: "text" | "int" | "number" | "money" | "percent" | "date" }[];
  rows: Record<string, unknown>[];
  totals?: Record<string, unknown>;
}
export const REPORTS = [
  { id: "sales", label: tr("Sales"), hint: tr("Orders and revenue over time"), path: "/admin/reports/sales", range: true, gran: true },
  { id: "products", label: tr("Product performance"), hint: tr("Units, revenue and profit per product"), path: "/admin/reports/product-performance", range: true },
  { id: "stock", label: tr("Stock valuation"), hint: tr("What your stock on hand is worth"), path: "/admin/reports/stock-valuation", range: false },
  { id: "coupons", label: tr("Coupon performance"), hint: tr("Uses and discount per coupon"), path: "/admin/reports/coupon-performance", range: true },
  { id: "customers", label: tr("Customers"), hint: tr("Who ordered and how much they spent"), path: "/admin/reports/customers", range: true },
  { id: "deliveries-rider", label: tr("Deliveries per rider"), hint: tr("Delivered, not delivered, time and cash for each rider"), path: "/admin/reports/deliveries-by-rider", range: true },
  { id: "deliveries-day", label: tr("Deliveries per day"), hint: tr("How many orders reached customers each day"), path: "/admin/reports/deliveries-by-day", range: true },
  { id: "cod", label: tr("Cash on delivery"), hint: tr("Cash the order said, cash the rider took, cash handed to the shop"), path: "/admin/reports/cod-reconciliation", range: true },
] as const;
export const reportsApi = {
  run: (path: string, params: Record<string, unknown>) => api.get<ReportTable>(path, { params: clean({ ...params, format: "json" }) }).then((r) => r.data),
};

// ---------- settings ----------
export interface DeliverySlot { id: string; label: string; labelBn: string; from: string; to: string }
export interface DeliverySettings {
  enabled: boolean;
  originLat: number | null;
  originLng: number | null;
  originLabel: string;
  originLabelBn: string;
  centerLat: number | null;
  centerLng: number | null;
  serviceRadiusKm: number;
  baseKm: number;
  baseCharge: number;
  perKmRate: number;
  stepKm: number;
  minOrderAmount: number;
  freeDeliveryThreshold: number | null;
  slots: DeliverySlot[];
  openFrom: string;
  openTo: string;
  shopOpen: boolean;
  routeFactor: number;
  restrictToZone?: boolean;
  distanceCalculation?: "direct" | "road";
}
/** Secrets never come back: only a flag saying whether one is stored. */
export interface MapsSettings {
  provider: "osm" | "google";
  googleBrowserKey: string | null;
  googleServerKeySet: boolean;
  osmTileUrl: string;
  orsApiKeySet: boolean;
  contactEmail: string | null;
  dailyRequestCap: number;
  enableMapSearch?: boolean;
  dynamicPlaceNames?: boolean;
}
export interface MapsTestResult { provider: string; route: { ok: boolean; km?: number; error?: string }; place: { ok: boolean; name?: string; error?: string } }
export interface MapsUsage { day: string; route: number; geocode: number; search: number; cap: number; provider: string }
export interface LoyaltySettings {
  enabled: boolean;
  pointsPerHundredSpent: number;
  pointsPerCurrencyUnit: number;
  minOrderAmountToRedeem: number;
  minPointsToRedeem: number;
  maxDiscountPercent: number;
  freeShippingMilestoneEnabled: boolean;
  freeShippingOrderInterval: number;
  freeShippingMaxWeightKg: number;
}
export type HeroLayoutMode = "SLIDER_AND_SIDE" | "SLIDER_ONLY";
export interface HeroConfig {
  layout?: HeroLayoutMode;
  maxSlides?: number;
  autoplayIntervalSec?: number;
}

export interface Settings {
  site: {
    storeName: string;
    tagline: string;
    logoUrl: string | null;
    faviconUrl: string | null;
    contactEmail: string | null;
    hotline: string | null;
    whatsapp: string | null;
    address: string | null;
    businessHours: string | null;
    currency: string;
    currencySymbol: string;
    metaTitle: string | null;
    metaDescription: string | null;
    socialLinks: Record<string, string>;
    hero?: HeroConfig;
    productNameLanguage?: "auto" | "bn" | "en";
  };
  payment: { codEnabled: boolean; bkashEnabled: boolean; bkashNumber: string | null; bkashAccountType: "personal" | "merchant" | "agent"; bkashInstructions: string | null; nagadEnabled: boolean; nagadNumber: string | null; nagadAccountType: "personal" | "merchant" | "agent"; nagadInstructions: string | null; rocketEnabled: boolean; rocketNumber: string | null; rocketAccountType: "personal" | "merchant" | "agent"; rocketInstructions: string | null };
  delivery: DeliverySettings;
  maps: MapsSettings;
  returns: { returnsEnabled: boolean; returnWindowDays: number; policyText: string | null };
  email: {
    provider: "none" | "smtp" | "resend"; fromName: string; fromEmail: string; replyTo: string | null; smtpHost: string | null; smtpPort: number | null; smtpSecure: boolean; smtpUser: string | null; smtpPassSet: boolean; resendApiKeySet: boolean;
    adminNotificationEmail: string | null; notifyCustomerOrderPlaced: boolean; notifyCustomerOrderStatus: boolean; notifyAdminNewOrder: boolean; notifyAdminContactMessage: boolean; notifyAdminSupportTicket: boolean; notifyCustomerTicketReply: boolean; sendNewsletterWelcome: boolean;
  };
  loyalty: LoyaltySettings;
}
export type SettingsGroup = keyof Settings;
export const settingsApi = {
  get: () => api.get<Settings>("/admin/settings").then((r) => r.data),
  save: (group: SettingsGroup, body: Record<string, unknown>) => api.put<Record<string, unknown>>(`/admin/settings/${group}`, body).then((r) => r.data),
  testMaps: () => api.post<MapsTestResult>("/admin/settings/maps/test").then((r) => r.data),
  mapsUsage: () => api.get<MapsUsage>("/admin/settings/maps/usage").then((r) => r.data),
  testEmail: (to: string, overrides: Record<string, unknown>) => api.post<{ message?: string }>("/admin/settings/email/test", { to, ...overrides }).then((r) => r.data),
};

// ---------- logs ----------
export interface ActivityLog {
  id: string;
  createdAt: string;
  actorType: "ADMIN" | "CUSTOMER" | "GUEST" | "SYSTEM";
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  category: string;
  summary: string;
  entityType: string | null;
  entityId: string | null;
  entityLabel: string | null;
  method: string | null;
  path: string | null;
  statusCode: number | null;
  success: boolean;
  errorMessage: string | null;
  changes: unknown;
  ip: string | null;
  userAgent: string | null;
  durationMs: number | null;
}
export interface ActivityStats {
  total: number;
  failed: number;
  byCategory: { category: string; count: number }[];
  byActorType: { actorType: string; count: number }[];
  topActions: { action: string; count: number }[];
}
export interface AuditLog {
  id: string;
  at: string;
  action: string;
  entity: string;
  entityId: string | null;
  admin: { id: string; name: string; email: string } | null;
  changes: { field: string; from: unknown; to: unknown }[] | null;
  ip: string | null;
}
export const logsApi = {
  // the server calls the free-text filter `q`
  activity: ({ search, ...f }: Record<string, unknown>) => api.get<Paged<ActivityLog>>("/admin/activity-logs", { params: clean({ ...f, q: search }) }).then((r) => r.data),
  activityStats: (f: Record<string, unknown>) => api.get<ActivityStats>("/admin/activity-logs/stats", { params: clean(f) }).then((r) => r.data),
  // the server calls the free-text filter `q`
  audit: ({ search, ...f }: Record<string, unknown>) => api.get<Paged<AuditLog>>("/admin/audit-logs", { params: clean({ ...f, q: search }) }).then((r) => r.data),
  auditTypes: () => api.get<{ types: Record<string, string[]>; actions: string[] }>("/admin/audit-logs/types").then((r) => r.data),
};

// ---------- account ----------
export interface Profile { id: string; email: string; name: string; phone: string | null; role: string; avatarUrl: string | null; createdAt: string }
export const accountApi = {
  me: () => api.get<Profile>("/admin/auth/me").then((r) => r.data),
  update: (b: { name?: string; phone?: string }) => api.patch<Profile>("/admin/auth/me", b).then((r) => r.data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<{ accessToken: string; refreshToken: string }>("/admin/auth/change-password", { currentPassword, newPassword }).then((r) => r.data),
};

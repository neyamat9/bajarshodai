// Store-wide settings managed from the admin dashboard. Each group is stored
// as one JSON row in the SiteSetting table (key = group name) and merged over
// these defaults on read, so a missing row or a newly added field always has
// a sane value.

export type SettingsGroup =
  | 'site'
  | 'payment'
  | 'delivery'
  | 'maps'
  | 'returns'
  | 'email'
  | 'loyalty';

export const SETTINGS_GROUPS: SettingsGroup[] = [
  'site',
  'payment',
  'delivery',
  'maps',
  'returns',
  'email',
  'loyalty',
];

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  twitter?: string;
  linkedin?: string;
}

export type HeroLayoutMode = 'SLIDER_AND_SIDE' | 'SLIDER_ONLY';

export interface HeroConfig {
  layout?: HeroLayoutMode;
  maxSlides?: number;
  autoplayIntervalSec?: number;
}

export interface SiteSettings {
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
  socialLinks: SocialLinks;
  hero: HeroConfig;
}

export type MobileBankingMethod = 'BKASH' | 'NAGAD' | 'ROCKET';
export const MOBILE_BANKING_METHODS: readonly MobileBankingMethod[] = [
  'BKASH',
  'NAGAD',
  'ROCKET',
];
export const PAYMENT_LABEL: Record<string, string> = {
  CASH_ON_DELIVERY: 'Cash on Delivery',
  BKASH: 'bKash',
  NAGAD: 'Nagad',
  ROCKET: 'Rocket',
};
export const isMobileBanking = (m: string): m is MobileBankingMethod =>
  (MOBILE_BANKING_METHODS as readonly string[]).includes(m);

export interface PaymentSettings {
  codEnabled: boolean;
  bkashEnabled: boolean;
  bkashNumber: string | null;
  // personal | merchant | agent — shown to the customer so they pick the
  // right option ("Send Money" vs "Payment") in the bKash app.
  bkashAccountType: 'personal' | 'merchant' | 'agent';
  bkashInstructions: string | null;
  nagadEnabled: boolean;
  nagadNumber: string | null;
  nagadAccountType: 'personal' | 'merchant' | 'agent';
  nagadInstructions: string | null;
  rocketEnabled: boolean;
  rocketNumber: string | null;
  rocketAccountType: 'personal' | 'merchant' | 'agent';
  rocketInstructions: string | null;
}

/** The shop's account for one mobile-banking method, or null when it is off / has no number yet. */
export function mobileAccount(
  p: PaymentSettings,
  m: MobileBankingMethod,
  fallbackNumber?: string | null,
) {
  const k = m.toLowerCase() as 'bkash' | 'nagad' | 'rocket';
  const enabled = p[`${k}Enabled`];
  if (!enabled) return null;
  const number = p[`${k}Number`] || fallbackNumber || null;
  if (!number) return null;
  return {
    number,
    accountType: p[`${k}AccountType`] || 'personal',
    instructions: p[`${k}Instructions`] || null,
  };
}

export interface DeliverySlot {
  id: string;
  label: string;
  labelBn: string;
  /** "09:00" (Bangladesh time) */
  from: string;
  to: string;
}

// Delivery is priced by road distance from ONE point (the shop's origin: Kalibari Bazar,
// by the Kalibari High School field / Sonali Bank Kalibari), not by zone:
//   distance <= baseKm  -> baseCharge
//   otherwise           -> baseCharge + perKmRate * ceil((distance - baseKm) / stepKm)
export interface DeliverySettings {
  // Taking orders for delivery at all
  enabled: boolean;
  // Where distances are measured from. null until the admin drops the pin once.
  originLat: number | null;
  originLng: number | null;
  originLabel: string;
  originLabelBn: string;
  // Centre of the service area. null = the origin.
  centerLat: number | null;
  centerLng: number | null;
  // Nothing is delivered beyond this straight-line distance from the centre.
  serviceRadiusKm: number;
  baseKm: number;
  baseCharge: number;
  perKmRate: number;
  stepKm: number;
  minOrderAmount: number;
  // Subtotal at or above which delivery is free. null = never free.
  freeDeliveryThreshold: number | null;
  slots: DeliverySlot[];
  // Shop hours (Bangladesh time) and a manual open/closed switch
  openFrom: string;
  openTo: string;
  shopOpen: boolean;
  // When no road route can be found: straight-line distance times this
  routeFactor: number;
  // Restrict delivery strictly to Shahrasti Upazila delivery zone
  restrictToZone: boolean;
  // Direct distance from Kalibari Hub (free, straight-line) or Road distance (driving route)
  distanceCalculation: 'direct' | 'road';
}

export type MapProviderName = 'osm' | 'google';

export interface MapsSettings {
  provider: MapProviderName;
  // Public: sent to the browser to draw the map
  googleBrowserKey: string | null;
  // Secret: routes and place names, used by the server only
  googleServerKey: string | null;
  // Where the OpenStreetMap tiles come from (the public server is for light use only)
  osmTileUrl: string;
  // Secret: OpenRouteService key for road distances with OpenStreetMap
  orsApiKey: string | null;
  // Nominatim asks for a contact in the User-Agent
  contactEmail: string | null;
  // Stops a bug or a bot from running up the bill: routes and place names per day
  dailyRequestCap: number;
  // Show or hide address search bar on the map picker
  enableMapSearch: boolean;
  // Whether to dynamically reverse geocode place names or let customer fill them manually
  dynamicPlaceNames: boolean;
}

export interface ReturnSettings {
  returnsEnabled: boolean;
  // Days after delivery during which a customer can request a return.
  returnWindowDays: number;
  policyText: string | null;
}

// none:   emails are not sent (they are written to the server log instead)
// smtp:   any SMTP server (Gmail, Zoho, cPanel mail, Amazon SES SMTP...)
// resend: Resend HTTP API (https://resend.com)
export type EmailProvider = 'none' | 'smtp' | 'resend';

export interface EmailSettings {
  provider: EmailProvider;
  fromName: string;
  fromEmail: string | null;
  replyTo: string | null;

  smtpHost: string | null;
  smtpPort: number;
  // true for port 465 (implicit TLS); false for 587/25 (STARTTLS)
  smtpSecure: boolean;
  smtpUser: string | null;
  smtpPass: string | null; // secret — encrypted at rest, never returned

  resendApiKey: string | null; // secret — encrypted at rest, never returned

  // Where admin alerts (new order, contact message) are sent.
  adminNotificationEmail: string | null;

  // Which emails are sent
  notifyCustomerOrderPlaced: boolean;
  notifyCustomerOrderStatus: boolean;
  notifyAdminNewOrder: boolean;
  notifyAdminContactMessage: boolean;
  notifyAdminSupportTicket: boolean;
  notifyCustomerTicketReply: boolean;
  sendNewsletterWelcome: boolean;
}

// Fields encrypted in the database and masked in admin responses.
export const SECRET_FIELDS: { [G in SettingsGroup]?: string[] } = {
  email: ['smtpPass', 'resendApiKey'],
  maps: ['googleServerKey', 'orsApiKey'],
};

export interface LoyaltySettings {
  // Points & Discount
  enabled: boolean;
  pointsPerHundredSpent: number; // e.g. 5 points per 100 BDT spent
  pointsPerCurrencyUnit: number; // e.g. 10 points = 1 BDT discount (100 pts = 10 BDT)
  minOrderAmountToRedeem: number; // e.g. 500 BDT minimum order subtotal to redeem points
  minPointsToRedeem: number; // e.g. 50 points required to be able to redeem
  maxDiscountPercent: number; // e.g. 30 (max 30% discount of subtotal via points)

  // Milestone Free Shipping (Order Count & Weight limit)
  freeShippingMilestoneEnabled: boolean;
  freeShippingOrderInterval: number; // e.g. 5 (every 5th delivered order)
  freeShippingMaxWeightKg: number; // e.g. 5.0 (free shipping covers orders up to this weight in kg)
}

export interface SettingsMap {
  site: SiteSettings;
  payment: PaymentSettings;
  delivery: DeliverySettings;
  maps: MapsSettings;
  returns: ReturnSettings;
  email: EmailSettings;
  loyalty: LoyaltySettings;
}

export const DEFAULT_SETTINGS: SettingsMap = {
  site: {
    storeName: 'Bazar Shodai',
    tagline: '',
    logoUrl: null,
    faviconUrl: null,
    contactEmail: null,
    hotline: null,
    whatsapp: null,
    address: null,
    businessHours: null,
    currency: 'BDT',
    currencySymbol: '৳',
    metaTitle: null,
    metaDescription: null,
    socialLinks: {},
    hero: {
      layout: 'SLIDER_AND_SIDE',
      maxSlides: 5,
      autoplayIntervalSec: 6,
    },
  },
  payment: {
    codEnabled: true,
    bkashEnabled: true,
    bkashNumber: '01834529197',
    bkashAccountType: 'personal',
    bkashInstructions:
      'Send money to this personal bKash number and enter the transaction ID at checkout.',
    nagadEnabled: false,
    nagadNumber: null,
    nagadAccountType: 'personal',
    nagadInstructions: null,
    rocketEnabled: false,
    rocketNumber: null,
    rocketAccountType: 'personal',
    rocketInstructions: null,
  },
  delivery: {
    enabled: true,
    // Kalibari Bazar, beside Kalibari High School field / Sonali Bank Kalibari, Shahrasti
    originLat: 23.2452,
    originLng: 90.9422,
    originLabel: 'Kalibari Bazar, beside Kalibari High School field / Sonali Bank Kalibari, Shahrasti',
    originLabelBn: 'কালীবাড়ী বাজার, হাই স্কুল মাঠ সংলগ্ন / সোনালী ব্যাংক কালীবাড়ী, শাহরাস্তি',
    centerLat: 23.2452,
    centerLng: 90.9422,
    serviceRadiusKm: 20,
    baseKm: 2,
    baseCharge: 20,
    perKmRate: 10,
    stepKm: 1,
    minOrderAmount: 0,
    freeDeliveryThreshold: null,
    slots: [
      { id: 'morning', label: 'Morning (9am–12pm)', labelBn: 'সকাল (৯টা–১২টা)', from: '09:00', to: '12:00' },
      { id: 'afternoon', label: 'Afternoon (12pm–4pm)', labelBn: 'দুপুর (১২টা–৪টা)', from: '12:00', to: '16:00' },
      { id: 'evening', label: 'Evening (4pm–8pm)', labelBn: 'সন্ধ্যা (৪টা–৮টা)', from: '16:00', to: '20:00' },
    ],
    openFrom: '08:00',
    openTo: '22:00',
    shopOpen: true,
    routeFactor: 1.3,
    restrictToZone: true,
    distanceCalculation: 'direct',
  },
  maps: {
    provider: 'osm',
    googleBrowserKey: null,
    googleServerKey: null,
    osmTileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    orsApiKey: null,
    contactEmail: null,
    dailyRequestCap: 2000,
    enableMapSearch: true,
    dynamicPlaceNames: false,
  },
  returns: {
    returnsEnabled: true,
    returnWindowDays: 7,
    policyText: null,
  },
  email: {
    provider: 'none',
    fromName: 'Bazar Shodai',
    fromEmail: null,
    replyTo: null,
    smtpHost: null,
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: null,
    smtpPass: null,
    resendApiKey: null,
    adminNotificationEmail: null,
    notifyCustomerOrderPlaced: true,
    notifyCustomerOrderStatus: true,
    notifyAdminNewOrder: true,
    notifyAdminContactMessage: true,
    notifyAdminSupportTicket: true,
    notifyCustomerTicketReply: true,
    sendNewsletterWelcome: true,
  },
  loyalty: {
    enabled: true,
    pointsPerHundredSpent: 5,
    pointsPerCurrencyUnit: 10,
    minOrderAmountToRedeem: 500,
    minPointsToRedeem: 50,
    maxDiscountPercent: 30,
    freeShippingMilestoneEnabled: true,
    freeShippingOrderInterval: 5,
    freeShippingMaxWeightKg: 5,
  },
};

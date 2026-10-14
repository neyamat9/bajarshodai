import { api, assetUrl } from '../api/client';

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface SiteSettings {
  site: {
    storeName: string;
    tagline: string;
    logoUrl: string | null;
    contactEmail: string | null;
    hotline: string | null;
    whatsapp: string | null;
    address: string | null;
    businessHours: string | null;
    socialLinks: Record<string, string>;
  };
  payment: { methods: ('CASH_ON_DELIVERY' | 'BKASH' | 'NAGAD' | 'ROCKET')[]; bkash: MobileAccount | null; nagad: MobileAccount | null; rocket: MobileAccount | null };
  delivery: DeliveryConfig;
  maps: MapsConfig;
  returns: { returnsEnabled: boolean; returnWindowDays: number; policyText: string | null };
}
/** Where to send money for one mobile-banking method (set by the admin in the dashboard) */
export interface MobileAccount {
  number: string;
  accountType: 'personal' | 'merchant' | 'agent';
  instructions: string | null;
}
export interface DeliverySlot {
  id: string;
  label: string;
  labelBn: string;
  from: string;
  to: string;
}
/** The delivery rules the shop set: where we deliver from, how far, what it costs. */
export interface DeliveryConfig {
  enabled: boolean;
  shopOpen: boolean;
  openFrom: string;
  openTo: string;
  originSet: boolean;
  origin: { lat: number; lng: number; label: string; labelBn: string } | null;
  serviceRadiusKm: number;
  baseKm: number;
  baseCharge: number;
  perKmRate: number;
  stepKm: number;
  minOrderAmount: number;
  freeDeliveryThreshold: number | null;
  slots: DeliverySlot[];
}
/** What the browser needs to draw the map (the secret server keys never reach it). */
export interface MapsConfig {
  provider: 'osm' | 'google';
  googleBrowserKey: string | null;
  osmTileUrl: string;
}

const FALLBACK: SiteSettings = {
  site: { storeName: 'Bazar Shodai', tagline: 'Fresh daily needs, delivered to your door', logoUrl: null, contactEmail: null, hotline: null, whatsapp: null, address: null, businessHours: null, socialLinks: {} },
  payment: { methods: ['CASH_ON_DELIVERY'], bkash: null, nagad: null, rocket: null },
  delivery: { enabled: true, shopOpen: true, openFrom: '08:00', openTo: '22:00', originSet: false, origin: null, serviceRadiusKm: 20, baseKm: 2, baseCharge: 20, perKmRate: 10, stepKm: 1, minOrderAmount: 0, freeDeliveryThreshold: null, slots: [] },
  maps: { provider: 'osm', googleBrowserKey: null, osmTileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png' },
  returns: { returnsEnabled: true, returnWindowDays: 7, policyText: null },
};

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const s = await api.get<any>('/customer/settings', { revalidate: 300 });
    return { ...FALLBACK, ...s, site: { ...FALLBACK.site, ...s.site, logoUrl: s.site?.logoUrl ? assetUrl(s.site.logoUrl) : null } };
  } catch {
    return FALLBACK;
  }
}

export interface Banner {
  id: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  imageUrl: string;
  mobileImageUrl: string | null;
  href: string | null;
  position: string;
  bgColor: string | null;
  textColor: string | null;
}
export async function getBanners(position?: string): Promise<Banner[]> {
  try {
    const rows = await api.get<any[]>(`/customer/banners${position ? `?position=${position}` : ''}`, { revalidate: 300 });
    return rows.map((b) => ({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle,
      description: b.description,
      imageUrl: assetUrl(b.imageUrl),
      mobileImageUrl: b.mobileImageUrl ? assetUrl(b.mobileImageUrl) : null,
      href: b.linkType === 'PRODUCT' && b.linkResourceId ? `/products/${b.linkResourceId}` : b.linkType === 'CATEGORY' && b.linkResourceId ? `/category/${b.linkResourceId}` : b.linkUrl || null,
      position: b.position,
      bgColor: b.bgColor,
      textColor: b.textColor,
    }));
  } catch {
    return [];
  }
}



import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';

export interface MobileSiteSettings {
  site?: {
    storeName?: string;
    tagline?: string;
    hotline?: string | null;
    whatsapp?: string | null;
    whatsappOrderTemplate?: string | null;
    contactEmail?: string | null;
    address?: string | null;
  };
}

export async function fetchSiteSettingsApi(): Promise<MobileSiteSettings> {
  try {
    return await api.get<MobileSiteSettings>('/customer/settings');
  } catch {
    return {};
  }
}

export function useSiteSettings() {
  return useQuery({
    queryKey: ['site-settings'],
    queryFn: fetchSiteSettingsApi,
    staleTime: 1000 * 60 * 10, // 10 minutes cache
  });
}


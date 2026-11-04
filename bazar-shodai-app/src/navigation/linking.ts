import * as Linking from 'expo-linking';

export const LINKING_PREFIXES = [
  'bajarshodai://',
  'bazarshodai://',
  'https://bajarshodai.com',
  'https://www.bajarshodai.com',
  'https://bazarshodai.com',
  'https://www.bazarshodai.com',
  'https://bazar-shodai-api.onrender.com',
];

export const linkingConfig = {
  prefixes: LINKING_PREFIXES,
  config: {
    screens: {
      '(tabs)': {
        screens: {
          index: '',
          categories: 'categories',
          cart: 'cart',
          wishlist: 'wishlist',
          account: 'account',
        },
      },
      'product/[slug]': 'product/:slug',
      'category/[slug]': 'category/:slug',
      'orders/index': 'orders',
      'orders/[id]': 'orders/:id',
      'search/index': 'search',
      'modal/quick-view': 'modal/quick-view',
      'modal/address-picker': 'modal/address-picker',
      'modal/prescription': 'modal/prescription',
      '(auth)/login': 'auth/login',
      '(auth)/reset-password': 'auth/reset-password',
    },
  },
};

export function createProductDeepLink(slug: string): string {
  return Linking.createURL(`product/${slug}`);
}

export function createCategoryDeepLink(slug: string): string {
  return Linking.createURL(`category/${slug}`);
}

export function createOrderDeepLink(orderId: string): string {
  return Linking.createURL(`orders/${orderId}`);
}

export async function openAppUrl(url: string): Promise<boolean> {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function parseDeepLink(url: string): {
  path: string | null;
  queryParams: Record<string, string | undefined> | null;
} {
  const parsed = Linking.parse(url);
  return {
    path: parsed.path,
    queryParams: parsed.queryParams as Record<string, string | undefined> | null,
  };
}

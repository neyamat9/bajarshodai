import { Alert, Linking, Platform } from 'react-native';
import { api } from '@/api/client';

export const APP_VERSION = '1.0.0';
export const APP_BUILD = 58;

export interface RemoteVersionConfig {
  minVersion: string;
  latestVersion: string;
  forceUpdate: boolean;
  updateUrlAndroid?: string;
  updateUrlIos?: string;
  releaseNotes?: string;
}

/**
 * Compare semver strings (e.g. "1.0.0" vs "1.1.0").
 * Returns 1 if a > b, -1 if a < b, 0 if equal.
 */
export function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

export async function checkAppVersion(): Promise<void> {
  try {
    const res = await api.get<RemoteVersionConfig>('/customer/settings/version');
    if (!res) return;

    const { minVersion, latestVersion, forceUpdate, updateUrlAndroid, updateUrlIos, releaseNotes } =
      res;
    const storeUrl =
      Platform.OS === 'ios'
        ? updateUrlIos || 'https://apps.apple.com'
        : updateUrlAndroid || 'https://play.google.com/store/apps/details?id=com.bazarshodai.app';

    // 1. Mandatory hard update check
    if (forceUpdate || (minVersion && compareSemver(minVersion, APP_VERSION) > 0)) {
      Alert.alert(
        'Update Required',
        'A critical new version of Bazar Shodai is available. Please update the app to continue shopping safely.',
        [
          {
            text: 'Update Now',
            onPress: () => {
              void Linking.openURL(storeUrl);
            },
          },
        ],
        { cancelable: false },
      );
      return;
    }

    // 2. Recommended soft update check
    if (latestVersion && compareSemver(latestVersion, APP_VERSION) > 0) {
      Alert.alert(
        'New Version Available',
        releaseNotes ||
          'A new version with performance improvements and new features is available.',
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Update',
            onPress: () => {
              void Linking.openURL(storeUrl);
            },
          },
        ],
      );
    }
  } catch {
    // Offline or version endpoint omitted
  }
}

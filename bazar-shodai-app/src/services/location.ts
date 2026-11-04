import * as Location from 'expo-location';

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
}

export interface GeocodedAddress {
  formattedAddress: string;
  name?: string | null;
  street?: string | null;
  district?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  postalCode?: string | null;
}

// Fallback to default operational hub: Shahrasti / Chandpur
export const DEFAULT_COORDINATES: Coordinates = {
  latitude: 23.2185,
  longitude: 90.9525,
  accuracy: 10,
};

export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function getCurrentCoordinates(): Promise<Coordinates> {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      return DEFAULT_COORDINATES;
    }

    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
    };
  } catch {
    return DEFAULT_COORDINATES;
  }
}

export async function reverseGeocodeCoordinates(
  lat: number,
  lng: number,
): Promise<GeocodedAddress> {
  try {
    const results = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lng,
    });

    if (results && results.length > 0) {
      const first = results[0];
      const parts = [
        first?.name,
        first?.street,
        first?.district || first?.city,
        first?.region,
      ].filter(Boolean);

      return {
        formattedAddress: parts.join(', ') || 'Selected Location, Bangladesh',
        name: first?.name,
        street: first?.street,
        district: first?.district,
        city: first?.city,
        region: first?.region,
        country: first?.country,
        postalCode: first?.postalCode,
      };
    }
  } catch {
    // fallback
  }

  return {
    formattedAddress: 'Shahrasti, Chandpur, Bangladesh',
    city: 'Shahrasti',
    district: 'Chandpur',
    country: 'Bangladesh',
  };
}


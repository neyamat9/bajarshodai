import {
  useFonts as useOutfitFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import {
  useFonts as useInterFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

export interface UseAppFontsReturn {
  fontsLoaded: boolean;
  fontError: Error | null;
}

/**
 * Loads all required Brand and System Typography fonts
 */
export function useAppFonts(): UseAppFontsReturn {
  const [outfitLoaded, outfitError] = useOutfitFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  const [interLoaded, interError] = useInterFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const fontsLoaded = Boolean(outfitLoaded && interLoaded);
  const fontError = (outfitError ?? interError) as Error | null;

  return { fontsLoaded, fontError };
}


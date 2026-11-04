import * as SplashScreen from 'expo-splash-screen';

// Instruct native splash screen to remain visible while initial assets load
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore reload warnings in dev */
});

/**
 * Gracefully dismisses the native splash screen
 */
export async function hideSplashScreen(): Promise<void> {
  try {
    await SplashScreen.hideAsync();
  } catch (err) {
    console.warn('[SplashScreen] Error dismissing native splash:', err);
  }
}


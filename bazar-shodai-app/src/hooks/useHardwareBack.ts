import { useEffect, useRef } from 'react';
import { BackHandler, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { toast } from '@/store/useToastStore';

/**
 * Intercept Android hardware back button with a custom handler.
 * If handler returns true, standard back navigation is prevented.
 */
export function useHardwareBack(onBackPress?: () => boolean) {
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onBackPress) {
        return onBackPress();
      }
      return false;
    });

    return () => subscription.remove();
  }, [onBackPress]);
}

/**
 * Double-tap back button to exit app on root screen.
 * Shows toast warning on 1st tap; exits app if pressed again within exitTimeoutMs.
 */
export function useRootDoubleTapToExit(
  isRootScreen = true,
  exitMessage = 'Press back again to exit Bazar Shodai',
  exitTimeoutMs = 2000,
) {
  const router = useRouter();
  const lastBackPressTimeRef = useRef<number>(0);

  useEffect(() => {
    if (Platform.OS !== 'android' || !isRootScreen) return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (router.canGoBack()) {
        router.back();
        return true;
      }

      const now = Date.now();
      if (now - lastBackPressTimeRef.current < exitTimeoutMs) {
        BackHandler.exitApp();
        return true;
      }

      lastBackPressTimeRef.current = now;
      toast.info('Exit App', exitMessage);
      return true;
    });

    return () => subscription.remove();
  }, [isRootScreen, exitMessage, exitTimeoutMs, router]);
}

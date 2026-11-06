import '../global.css';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ThemeProvider, useAppTheme } from '@/components/theme/ThemeProvider';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { ToastContainer } from '@/components/ui/Toast';
import { NetworkBanner } from '@/components/ui/NetworkBanner';
import { ProductQuickViewModal } from '@/components/product/ProductQuickViewModal';
import { useAppFonts } from '@/hooks/useFonts';
import { hideSplashScreen } from '@/utils/splash';
import { getOrCreateGuestToken } from '@/utils/guestToken';
import { useAuthStore } from '@/store/useAuthStore';
import { registerForPushNotificationsAsync } from '@/services/notifications';
import { setupNotificationListeners } from '@/services/notificationHandlers';
import { checkAppVersion } from '@/services/versionCheck';

function RootNavigationLayout() {
  const { isDark, colors } = useAppTheme();

  useEffect(() => {
    // Warm up anonymous guest identity for persistent cart and location
    getOrCreateGuestToken();
    // Restore persistent authenticated customer session from SecureStore
    useAuthStore.getState().restoreSession();

    // Register push notification token & configure event listeners
    void registerForPushNotificationsAsync();
    const cleanupNotifications = setupNotificationListeners();

    // Check version compatibility
    void checkAppVersion();

    return () => {
      cleanupNotifications();
    };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NetworkBanner />
      <ToastContainer />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        {/* Main Tab Shell */}
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />

        {/* Dynamic Product Detail Route */}
        <Stack.Screen
          name="product/[slug]"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />

        {/* Product Catalog Listing */}
        <Stack.Screen
          name="products/index"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />

        {/* Dynamic Category Drilldown Route */}
        <Stack.Screen
          name="category/[slug]"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />

        {/* Dedicated Search Screen */}
        <Stack.Screen
          name="search/index"
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        />

        {/* Dedicated Pharmacy & Medicine Catalog */}
        <Stack.Screen
          name="pharmacy/index"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="medicine/index"
          options={{
            headerShown: false,
          }}
        />

        {/* Order History & Tracking */}
        <Stack.Screen
          name="orders/index"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="orders/[id]"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />

        {/* Authentication Flow */}
        <Stack.Screen
          name="(auth)/login"
          options={{
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="(auth)/register"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="(auth)/forgot-password"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="(auth)/reset-password"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />

        {/* Account Flow */}
        <Stack.Screen
          name="(account)/change-password"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="(account)/edit-profile"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="(account)/addresses"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="(account)/rewards"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="(account)/settings"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="(account)/returns"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="returns/new"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />

        {/* Customer Care & Support Flow */}
        <Stack.Screen
          name="(account)/support"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="support/new"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="support/[id]"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="contact"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="notifications/index"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />

        {/* Delivery Rider Staff Portal */}
        <Stack.Screen
          name="(rider)/deliveries"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="(rider)/order/[id]"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="(rider)/settlements"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />

        {/* Native Slide-up Modals */}
        <Stack.Screen
          name="modal/quick-view"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="modal/address-picker"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="modal/prescription"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
      </Stack>
      <ProductQuickViewModal />
    </View>
  );
}

export { ErrorBoundary } from '@/components/shared/ErrorBoundary';

export default function RootLayout() {
  const { fontsLoaded, fontError } = useAppFonts();

  useEffect(() => {
    if (fontsLoaded || fontError) {
      hideSplashScreen();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <SafeAreaProvider>
          <QueryProvider>
            <ThemeProvider>
              <RootNavigationLayout />
            </ThemeProvider>
          </QueryProvider>
        </SafeAreaProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

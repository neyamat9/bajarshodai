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
import { useAppFonts } from '@/hooks/useFonts';
import { hideSplashScreen } from '@/utils/splash';
import { getOrCreateGuestToken } from '@/utils/guestToken';

function RootNavigationLayout() {
  const { isDark, colors } = useAppTheme();

  useEffect(() => {
    // Warm up anonymous guest identity for persistent cart and location
    getOrCreateGuestToken();
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
    </View>
  );
}

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


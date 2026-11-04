import './global.css';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { ThemeProvider, useAppTheme } from '@/components/theme/ThemeProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { NetworkBanner } from '@/components/ui/NetworkBanner';
import { useAppFonts } from '@/hooks/useFonts';
import { hideSplashScreen } from '@/utils/splash';
import { getOrCreateGuestToken } from '@/utils/guestToken';
import { api } from '@/api/client';
import { ENV } from '@/config/env';

function AppContent() {
  const { isDark, themeMode, toggleTheme } = useAppTheme();
  const guestToken = getOrCreateGuestToken();

  const {
    data: pingData,
    isLoading: pingLoading,
    isError: pingError,
    refetch: refetchPing,
  } = useQuery({
    queryKey: ['api-ping'],
    queryFn: () => api.ping(),
  });

  return (
    <SafeAreaView className="flex-1 bg-background">
      <NetworkBanner />
      <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center' }}>
        {/* Brand Header */}
        <Text className="text-3xl font-bold text-brand-deep dark:text-brand-fresh mt-4 mb-1">
          বাজার সদাই
        </Text>
        <Text className="text-base text-foreground font-medium mb-1">Bazar Shodai Mobile</Text>
        <Text className="text-xs text-muted-foreground mb-6 text-center">
          Fresh grocery delivered directly to your doorstep in Shahrasti
        </Text>

        {/* Live Backend Connection Card */}
        <View className="w-full bg-card border border-border rounded-brand p-4 mb-4">
          <Text className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
            Backend API Target
          </Text>
          <Text
            className="text-sm font-semibold text-brand-fresh dark:text-accent-text mb-3"
            numberOfLines={1}
          >
            {ENV.API_BASE_URL}
          </Text>

          <View className="flex-row items-center justify-between pt-2 border-t border-border">
            <Text className="text-xs text-muted-foreground">Server Status:</Text>
            {pingLoading ? (
              <ActivityIndicator size="small" color="#059669" />
            ) : pingError ? (
              <Text className="text-xs font-semibold text-destructive">Offline / Connecting</Text>
            ) : (
              <Text className="text-xs font-semibold text-brand-fresh">
                ✓ {pingData?.message ?? 'Online'}
              </Text>
            )}
          </View>
        </View>

        {/* Guest Session Identity Card */}
        <View className="w-full bg-card border border-border rounded-brand p-4 mb-4">
          <Text className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
            Anonymous Cart Session
          </Text>
          <Text className="text-xs font-mono text-muted-foreground mb-1" numberOfLines={1}>
            UUID: {guestToken}
          </Text>
          <Text className="text-[11px] text-muted-foreground">
            Synchronizes with cart items before customer sign-in.
          </Text>
        </View>

        {/* Theme Status & Actions */}
        <View className="w-full bg-card border border-border rounded-brand p-4 mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-sm text-foreground font-medium">Active Theme</Text>
            <Text className="text-xs font-semibold px-2 py-1 rounded bg-secondary text-secondary-foreground">
              {themeMode.toUpperCase()} ({isDark ? 'Dark Mode' : 'Light Mode'})
            </Text>
          </View>
          <Button
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            variant="outline"
            onPress={toggleTheme}
            className="w-full"
          />
        </View>

        {/* Action Buttons */}
        <View className="w-full space-y-3 gap-3">
          <Button
            title="Ping Backend API"
            variant="secondary"
            size="lg"
            loading={pingLoading}
            onPress={() => refetchPing()}
          />
        </View>
      </ScrollView>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </SafeAreaView>
  );
}

export default function App() {
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
    <SafeAreaProvider>
      <QueryProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}

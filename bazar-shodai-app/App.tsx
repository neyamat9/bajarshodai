import './global.css';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Price } from '@/components/ui/Price';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Icon } from '@/components/ui/Icon';
import { ToastContainer } from '@/components/ui/Toast';
import { toast } from '@/store/useToastStore';
import { ThemeProvider, useAppTheme } from '@/components/theme/ThemeProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { NetworkBanner } from '@/components/ui/NetworkBanner';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { useAppFonts } from '@/hooks/useFonts';
import { hideSplashScreen } from '@/utils/splash';
import { getOrCreateGuestToken } from '@/utils/guestToken';
import { api } from '@/api/client';
import { ENV } from '@/config/env';

function AppContent() {
  const { isDark, themeMode, toggleTheme } = useAppTheme();
  const guestToken = getOrCreateGuestToken();
  const [phoneNumber, setPhoneNumber] = useState('');

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
      <ToastContainer />

      <ScrollView contentContainerStyle={{ padding: 20, alignItems: 'center' }}>
        {/* Brand Header */}
        <View className="items-center mt-2 mb-6">
          <View className="flex-row items-center gap-2 mb-1">
            <Icon name="ShoppingBag" size={28} color={isDark ? '#6fcf4e' : '#0b6234'} />
            <Text className="text-3xl font-bold text-brand-deep dark:text-brand-fresh">
              বাজার সদাই
            </Text>
          </View>
          <Text className="text-base text-foreground font-semibold">Bazar Shodai Mobile</Text>
          <Text className="text-xs text-muted-foreground mt-0.5 text-center">
            Fresh grocery delivered directly to your doorstep in Shahrasti
          </Text>
        </View>

        {/* Live Backend Connection Card */}
        <Card className="w-full mb-4">
          <CardHeader className="flex-row items-center justify-between mb-1">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Live API Gateway
            </CardTitle>
            <Badge
              label={pingLoading ? 'CHECKING' : pingError ? 'OFFLINE' : 'ONLINE'}
              variant={pingLoading ? 'neutral' : pingError ? 'tomato' : 'fresh'}
              size="sm"
            />
          </CardHeader>
          <Text
            className="text-sm font-semibold text-brand-fresh dark:text-accent-text mb-3"
            numberOfLines={1}
          >
            {ENV.API_BASE_URL}
          </Text>
          <View className="flex-row items-center justify-between pt-2 border-t border-border">
            <Text className="text-xs text-muted-foreground">Ping Response:</Text>
            {pingLoading ? (
              <ActivityIndicator size="small" color="#059669" />
            ) : pingError ? (
              <Text className="text-xs font-semibold text-destructive">Connection timeout</Text>
            ) : (
              <Text className="text-xs font-semibold text-brand-fresh">
                ✓ {pingData?.message ?? 'Alive'}
              </Text>
            )}
          </View>
        </Card>

        {/* Guest Session Identity Card */}
        <Card className="w-full mb-4">
          <CardHeader className="flex-row items-center justify-between mb-1">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Guest Cart Session
            </CardTitle>
            <Badge label="ACTIVE" variant="fish" size="sm" />
          </CardHeader>
          <Text className="text-xs font-mono text-muted-foreground mb-1" numberOfLines={1}>
            {guestToken}
          </Text>
          <Text className="text-[11px] text-muted-foreground">
            Synchronizes with cart items before customer sign-in.
          </Text>
        </Card>

        {/* UI Atoms Demo: Price & Badges */}
        <Card className="w-full mb-4">
          <CardTitle className="text-sm font-bold text-foreground mb-3">
            Design System Atoms Showcase
          </CardTitle>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs text-muted-foreground">Bengali Currency:</Text>
            <Price amount={450} originalAmount={600} unit="kg" locale="bn" />
          </View>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs text-muted-foreground">English Currency:</Text>
            <Price amount={1250} unit="pc" locale="en" />
          </View>
          <View className="flex-row flex-wrap gap-2 pt-2 border-t border-border">
            <Badge label="100% ORGANIC" variant="fresh" size="sm" />
            <Badge label="DISCOUNT" variant="tomato" size="sm" />
            <Badge label="BEST SELLER" variant="carrot" size="sm" />
            <Badge label="FRESH FISH" variant="fish" size="sm" />
          </View>
        </Card>

        {/* Bangladeshi Phone Input Demo */}
        <Card className="w-full mb-4">
          <CardTitle className="text-sm font-bold text-foreground mb-3">
            Bangladeshi Phone Input
          </CardTitle>
          <PhoneInput
            value={phoneNumber}
            onChangePhone={(raw) => setPhoneNumber(raw)}
            helperText="Enter 10-digit mobile number"
          />
        </Card>

        {/* Interactive Triggers: Toasts & Haptics */}
        <Card className="w-full mb-6">
          <CardTitle className="text-sm font-bold text-foreground mb-3">
            Tactile Haptics & Notification Toasts
          </CardTitle>
          <View className="flex-row gap-2 mb-3">
            <Button
              title="Success Toast"
              variant="secondary"
              size="sm"
              className="flex-1"
              onPress={() => toast.success('Added to Cart', 'Fresh Cauliflower added to your bag')}
            />
            <Button
              title="Error Toast"
              variant="danger"
              size="sm"
              className="flex-1"
              onPress={() => toast.error('Out of Stock', 'This item is temporarily unavailable')}
            />
          </View>
          <Button
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode (${themeMode.toUpperCase()})`}
            variant="outline"
            size="md"
            onPress={toggleTheme}
            className="w-full"
          />
        </Card>

        {/* API Re-fetch Trigger */}
        <Button
          title="Re-ping Backend API"
          variant="primary"
          size="lg"
          loading={pingLoading}
          onPress={() => {
            refetchPing();
            toast.info('Pinging Backend', 'Connecting to Render live API...');
          }}
          className="w-full"
        />
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
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryProvider>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

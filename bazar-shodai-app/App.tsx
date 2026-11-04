import './global.css';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View, ScrollView } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { ThemeProvider, useAppTheme } from '@/components/theme/ThemeProvider';
import { useAppFonts } from '@/hooks/useFonts';
import { hideSplashScreen } from '@/utils/splash';
import { ENV } from '@/config/env';

function AppContent() {
  const { isDark, themeMode, toggleTheme } = useAppTheme();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center' }}>
        {/* Brand Header */}
        <Text className="text-3xl font-bold text-brand-deep dark:text-brand-fresh mt-4 mb-1">
          বাজার সদাই
        </Text>
        <Text className="text-base text-foreground font-medium mb-1">Bazar Shodai Mobile</Text>
        <Text className="text-xs text-muted-foreground mb-6">
          Fresh grocery delivered directly to your doorstep in Shahrasti
        </Text>

        {/* Live Backend Connection Card */}
        <View className="w-full bg-card border border-border rounded-brand p-4 mb-6">
          <Text className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
            Backend API Target
          </Text>
          <Text
            className="text-sm font-semibold text-brand-fresh dark:text-accent-text"
            numberOfLines={1}
          >
            {ENV.API_BASE_URL}
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

        {/* Buttons Design Tokens Showcase */}
        <View className="w-full space-y-3 gap-3">
          <Button
            title="Primary CTA (বাজার Deep Green)"
            variant="primary"
            size="lg"
            onPress={() => console.log('Primary CTA pressed')}
          />
          <Button
            title="Fresh Accent CTA (সদাই Fresh Green)"
            variant="secondary"
            size="lg"
            onPress={() => console.log('Secondary CTA pressed')}
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
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAppTheme } from '@/components/theme/ThemeProvider';
import { getOrCreateGuestToken } from '@/utils/guestToken';
import { haptics } from '@/services/haptics';
import { toast } from '@/store/useToastStore';

export default function AccountScreen() {
  const router = useRouter();
  const { isDark, themeMode, toggleTheme } = useAppTheme();
  const guestToken = getOrCreateGuestToken();

  const handleAction = (title: string, action: () => void) => {
    haptics.light();
    action();
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 py-3 border-b border-border bg-card">
        <Text className="text-xl font-bold text-foreground">My Account</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Profile / Guest Card */}
        <Card className="w-full mb-4 p-4">
          <View className="flex-row items-center gap-3 mb-3">
            <View className="w-12 h-12 rounded-full bg-brand-fresh/20 items-center justify-center">
              <Icon name="User" size={24} color={isDark ? '#45a22c' : '#0b6234'} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-foreground">Guest Customer</Text>
              <Text className="text-xs text-muted-foreground font-mono" numberOfLines={1}>
                ID: {guestToken.slice(0, 16)}...
              </Text>
            </View>
          </View>
          <Button
            title="Sign In / Register"
            variant="primary"
            size="md"
            onPress={() => router.push('/(auth)/login')}
          />
        </Card>

        {/* Quick Menu Options */}
        <View className="bg-card rounded-brand border border-border mb-4 overflow-hidden">
          <TouchableOpacity
            onPress={() => handleAction('Orders', () => router.push('/orders'))}
            className="flex-row items-center justify-between p-4 border-b border-border"
          >
            <View className="flex-row items-center gap-3">
              <Icon name="Package" size={18} color="#0b6234" />
              <Text className="text-sm font-medium text-foreground">Order History</Text>
            </View>
            <Icon name="ChevronRight" size={16} color="#94a3b8" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleAction('Address', () => router.push('/modal/address-picker'))}
            className="flex-row items-center justify-between p-4 border-b border-border"
          >
            <View className="flex-row items-center gap-3">
              <Icon name="MapPin" size={18} color="#0b6234" />
              <Text className="text-sm font-medium text-foreground">Saved Delivery Addresses</Text>
            </View>
            <Icon name="ChevronRight" size={16} color="#94a3b8" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleAction('Prescription', () => router.push('/modal/prescription'))}
            className="flex-row items-center justify-between p-4"
          >
            <View className="flex-row items-center gap-3">
              <Icon name="FileText" size={18} color="#0b6234" />
              <Text className="text-sm font-medium text-foreground">
                Upload Medicine Prescription
              </Text>
            </View>
            <Icon name="ChevronRight" size={16} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Preferences Section */}
        <View className="bg-card rounded-brand border border-border mb-4 overflow-hidden">
          <TouchableOpacity
            onPress={() => {
              toggleTheme();
              haptics.light();
              toast.info('Theme Changed', `Switched mode to ${isDark ? 'light' : 'dark'}`);
            }}
            className="flex-row items-center justify-between p-4 border-b border-border"
          >
            <View className="flex-row items-center gap-3">
              <Icon name={isDark ? 'Moon' : 'Sun'} size={18} color="#e53e3e" />
              <Text className="text-sm font-medium text-foreground">Appearance</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-xs text-muted-foreground uppercase font-semibold">
                {themeMode}
              </Text>
              <Icon name="ChevronRight" size={16} color="#94a3b8" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              haptics.light();
              toast.info('Language', 'Bengali & English both supported');
            }}
            className="flex-row items-center justify-between p-4"
          >
            <View className="flex-row items-center gap-3">
              <Icon name="Languages" size={18} color="#3b82f6" />
              <Text className="text-sm font-medium text-foreground">Language</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-xs text-muted-foreground font-semibold">বাংলা / EN</Text>
              <Icon name="ChevronRight" size={16} color="#94a3b8" />
            </View>
          </TouchableOpacity>
        </View>

        {/* App Version Info */}
        <View className="items-center py-4">
          <Text className="text-xs text-muted-foreground">Bazar Shodai Mobile • v1.0.0</Text>
          <Text className="text-[11px] text-muted-foreground mt-0.5">
            Designed for Shahrasti, Chandpur
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

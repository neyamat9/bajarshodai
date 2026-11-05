import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Icon } from '@/components/ui/Icon';
import { haptics } from '@/services/haptics';
import { Radius } from '@/constants/layout';

export interface HomeHeaderProps {
  location?: string;
  deliveryTimeEstimate?: string;
  onLocationPress?: () => void;
  onSearchPress?: () => void;
  onNotificationPress?: () => void;
}

export function HomeHeader({
  location = 'Shahrasti Sadar, Chandpur',
  deliveryTimeEstimate = '৩০-৬০ মিনিট ডেলিভারি',
  onLocationPress,
  onSearchPress,
  onNotificationPress,
}: HomeHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleLocationPress = () => {
    haptics.light();
    if (onLocationPress) {
      onLocationPress();
    } else {
      router.push('/location/picker');
    }
  };

  const handleSearchPress = () => {
    haptics.light();
    if (onSearchPress) {
      onSearchPress();
    } else {
      router.push('/search');
    }
  };

  const handleNotificationPress = () => {
    haptics.light();
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      router.push('/notifications');
    }
  };

  return (
    <View
      style={[styles.container, { paddingTop: Math.max(insets.top, 10) }]}
      className="bg-card border-b border-border"
    >
      {/* Top Identity & Action Row */}
      <View style={styles.topRow}>
        {/* Brand Logo & Location Column */}
        <View style={styles.leftCol}>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)')}
            activeOpacity={0.8}
            style={styles.logoWrapper}
          >
            <Image
              source={require('../../../../assets/images/logo-wide.webp')}
              style={styles.logoImage}
              contentFit="contain"
              accessibilityLabel="Bazar Shodai Logo"
            />
          </TouchableOpacity>

          {/* Delivery Zone Pill */}
          <TouchableOpacity
            onPress={handleLocationPress}
            activeOpacity={0.7}
            style={styles.locationPill}
            accessibilityRole="button"
            accessibilityLabel={`Delivering to ${location}`}
          >
            <Icon name="MapPin" size={11} color="#e53e3e" />
            <Text
              className="text-[11px] font-semibold text-foreground ml-1 mr-0.5"
              numberOfLines={1}
            >
              {location}
            </Text>
            <Text className="text-[10px] text-brand-fresh font-medium mr-0.5">
              • {deliveryTimeEstimate}
            </Text>
            <Icon name="ChevronDown" size={12} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Right Header Buttons: Notification Bell (No duplicate cart icon) */}
        <View style={styles.rightActions}>
          <TouchableOpacity
            onPress={handleNotificationPress}
            activeOpacity={0.7}
            style={styles.actionBtn}
            className="bg-muted/30 border border-border"
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Icon name="Bell" size={18} color="#0b6234" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sleek Search Trigger */}
      <TouchableOpacity
        onPress={handleSearchPress}
        activeOpacity={0.8}
        style={styles.searchBar}
        className="bg-background border border-border"
        accessibilityRole="search"
        accessibilityLabel="Search products in Bazar Shodai"
      >
        <Icon name="Search" size={16} color="#64748b" style={styles.searchIcon} />
        <Text className="text-xs text-muted-foreground flex-1">
          Search vegetables, fish, meat, dairy...
        </Text>
        <View className="px-2 py-1 rounded bg-brand-fresh/15">
          <Text className="text-[10px] font-bold text-brand-deep dark:text-brand-fresh">
            খুঁজুন
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  leftCol: {
    flex: 1,
    marginRight: 8,
  },
  logoWrapper: {
    height: 30,
    width: 130,
    justifyContent: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    maxWidth: '95%',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.brand,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: Radius.brand,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
});

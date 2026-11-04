import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { useAppTheme } from '@/components/theme/ThemeProvider';
import { haptics } from '@/services/haptics';
import { Radius } from '@/constants/layout';

export interface AppHeaderProps {
  location?: string;
  unreadNotificationsCount?: number;
  onLocationPress?: () => void;
  onSearchPress?: () => void;
  onNotificationPress?: () => void;
  showSearchBar?: boolean;
}

export function AppHeader({
  location = 'Shahrasti, Chandpur',
  unreadNotificationsCount = 0,
  onLocationPress,
  onSearchPress,
  onNotificationPress,
  showSearchBar = true,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const router = useRouter();

  const handleLocationPress = () => {
    haptics.light();
    if (onLocationPress) {
      onLocationPress();
    } else {
      router.push('/modal/address-picker');
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
      // Future notifications route
    }
  };

  return (
    <View
      style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 12) }]}
      className="bg-card border-b border-border"
    >
      {/* Top Row: Brand & Location & Notifications */}
      <View style={styles.topRow}>
        {/* Left: Brand Identity */}
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge} className="bg-brand-fresh/15">
            <Icon name="ShoppingBag" size={18} color={isDark ? '#45a22c' : '#0b6234'} />
          </View>
          <View>
            <Text className="text-base font-extrabold text-brand-deep dark:text-brand-fresh leading-tight">
              বাজার সদাই
            </Text>
            {/* Delivery Location Pill */}
            <TouchableOpacity
              onPress={handleLocationPress}
              activeOpacity={0.7}
              style={styles.locationPill}
              accessibilityRole="button"
              accessibilityLabel={`Delivering to ${location}`}
            >
              <Icon name="MapPin" size={11} color="#e53e3e" />
              <Text
                className="text-[11px] text-muted-foreground font-medium ml-1 mr-0.5"
                numberOfLines={1}
              >
                {location}
              </Text>
              <Icon name="ChevronDown" size={12} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Right: Notification Bell */}
        <TouchableOpacity
          onPress={handleNotificationPress}
          activeOpacity={0.7}
          style={styles.iconButton}
          className="bg-muted/40 border border-border"
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Icon name="Bell" size={18} color={isDark ? '#f1f5f9' : '#1e293b'} />
          {unreadNotificationsCount > 0 && (
            <View style={styles.unreadDot} className="bg-destructive" />
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom Row: Search Bar Trigger */}
      {showSearchBar && (
        <View style={styles.searchRow}>
          <TouchableOpacity
            onPress={handleSearchPress}
            activeOpacity={0.8}
            style={styles.searchButton}
            className="bg-background border border-border"
            accessibilityRole="search"
            accessibilityLabel="Search products"
          >
            <Icon name="Search" size={16} color="#64748b" style={styles.searchIcon} />
            <Text className="text-xs text-muted-foreground flex-1">
              Search fresh vegetables, meat, fish...
            </Text>
            <View style={styles.searchTag} className="bg-brand-fresh/10">
              <Text className="text-[10px] font-semibold text-brand-deep dark:text-brand-fresh">
                Search
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: Radius.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    maxWidth: 200,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.brand,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  searchRow: {
    marginTop: 4,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: Radius.brand,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
});

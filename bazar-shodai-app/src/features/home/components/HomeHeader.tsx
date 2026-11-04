import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { useAppTheme } from '@/components/theme/ThemeProvider';
import { useCartStore } from '@/store/useCartStore';
import { haptics } from '@/services/haptics';
import { Radius } from '@/constants/layout';

export interface HomeHeaderProps {
  location?: string;
  deliveryTimeEstimate?: string;
  onLocationPress?: () => void;
  onSearchPress?: () => void;
  onCartPress?: () => void;
}

export function HomeHeader({
  location = 'Shahrasti Sadar, Chandpur',
  deliveryTimeEstimate = '৩০-৬০ মিনিট ডেলিভারি',
  onLocationPress,
  onSearchPress,
  onCartPress,
}: HomeHeaderProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const router = useRouter();
  const cartCount = useCartStore((s) => s.items.reduce((sum, item) => sum + item.quantity, 0));

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

  const handleCartPress = () => {
    haptics.selection();
    if (onCartPress) {
      onCartPress();
    } else {
      router.push('/(tabs)/cart');
    }
  };

  return (
    <View
      style={[styles.container, { paddingTop: Math.max(insets.top, 10) }]}
      className="bg-card border-b border-border"
    >
      {/* Top Identity & Action Row */}
      <View style={styles.topRow}>
        {/* Brand & Location Column */}
        <View style={styles.leftCol}>
          <View className="flex-row items-center gap-1.5">
            <Text className="text-lg font-black text-brand-deep dark:text-brand-fresh tracking-tight">
              বাজার সদাই
            </Text>
            <View className="px-1.5 py-0.5 rounded bg-brand-fresh/15">
              <Text className="text-[10px] font-bold text-brand-fresh">FRESH</Text>
            </View>
          </View>

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

        {/* Right Header Buttons */}
        <View style={styles.rightActions}>
          <TouchableOpacity
            onPress={handleCartPress}
            activeOpacity={0.7}
            style={styles.actionBtn}
            className="bg-muted/30 border border-border"
            accessibilityRole="button"
            accessibilityLabel="Shopping Cart"
          >
            <Icon name="ShoppingBag" size={18} color={isDark ? '#45a22c' : '#0b6234'} />
            {cartCount > 0 && (
              <View style={styles.cartBadge} className="bg-destructive">
                <Text style={styles.cartBadgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
              </View>
            )}
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
    width: 38,
    height: 38,
    borderRadius: Radius.brand,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
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

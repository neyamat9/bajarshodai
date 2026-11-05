import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { Icon, IconName } from '@/components/ui/Icon';
import { useAppTheme } from '@/components/theme/ThemeProvider';
import { haptics } from '@/services/haptics';
import { useCartStore } from '@/store/useCartStore';
import { useTranslation } from '@/i18n';

interface TabConfig {
  icon: IconName;
  fallbackLabel: string;
}

const TAB_CONFIG: Record<string, TabConfig> = {
  index: { icon: 'Home', fallbackLabel: 'Home' },
  categories: { icon: 'Store', fallbackLabel: 'Shop' },
  cart: { icon: 'ShoppingBag', fallbackLabel: 'Cart' },
  wishlist: { icon: 'Heart', fallbackLabel: 'Wishlist' },
  account: { icon: 'User', fallbackLabel: 'Account' },
};

export function TabBar({ state, descriptors, navigateToTab, emitter }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { t } = useTranslation();
  const cartItemCount = useCartStore((s) => s.items.reduce((sum, item) => sum + item.quantity, 0));

  const activeColor = isDark ? '#45a22c' : '#0b6234';
  const inactiveColor = isDark ? '#94a3b8' : '#64748b';

  const getTabLabel = (routeName: string, fallback: string): string => {
    switch (routeName) {
      case 'index':
        return t('nav.home');
      case 'categories':
        return t('nav.shop');
      case 'cart':
        return t('nav.cart');
      case 'wishlist':
        return t('nav.wishlist');
      case 'account':
        return t('nav.account');
      default:
        return fallback;
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 12),
        },
      ]}
      className="bg-card border-t border-border"
    >
      <View style={styles.content}>
        {state.routes.map((route, index) => {
          const descriptor = descriptors[route.key];
          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name] || {
            icon: 'Circle' as IconName,
            fallbackLabel: descriptor?.options?.title || route.name,
          };
          const label = getTabLabel(route.name, config.fallbackLabel);

          const isCart = route.name === 'cart';

          const onPress = () => {
            haptics.selection();
            const event = emitter?.emit?.({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && (!event || !event.defaultPrevented)) {
              navigateToTab(route.key);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              delayPressIn={0}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={descriptor?.options?.tabBarAccessibilityLabel || label}
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.tabButton}
            >
              <View style={styles.iconWrapper}>
                <Icon
                  name={config.icon}
                  size={22}
                  color={isFocused ? activeColor : inactiveColor}
                />
                {isCart && cartItemCount > 0 && (
                  <View style={styles.badge} className="bg-destructive">
                    <Text style={styles.badgeText}>
                      {cartItemCount > 99 ? '99+' : cartItemCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.label,
                  {
                    color: isFocused ? activeColor : inactiveColor,
                    fontWeight: isFocused ? '700' : '500',
                  },
                ]}
              >
                {label}
              </Text>
              {isFocused && <View style={[styles.indicator, { backgroundColor: activeColor }]} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minHeight: 44,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  label: {
    fontSize: 10,
    marginTop: 3,
    letterSpacing: 0.2,
  },
  indicator: {
    width: 16,
    height: 2,
    borderRadius: 1,
    marginTop: 2,
  },
});

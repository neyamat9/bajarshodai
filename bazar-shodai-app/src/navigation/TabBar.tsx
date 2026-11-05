import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
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

const BAR_HEIGHT = 60;
const BUBBLE_SIZE = 50;

export function TabBar({ state, descriptors, navigateToTab, emitter }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { isDark } = useAppTheme();
  const { t } = useTranslation();
  const cartItemCount = useCartStore((s) => s.items.reduce((sum, item) => sum + item.quantity, 0));

  const routesCount = state.routes.length;
  const tabWidth = width / routesCount;

  // Active tab spring animator (runs 100% on Native Driver)
  const [activeAnim] = useState(() => new Animated.Value(state.index));

  useEffect(() => {
    Animated.spring(activeAnim, {
      toValue: state.index,
      damping: 18,
      stiffness: 180,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  }, [state.index, activeAnim]);

  const activeColor = isDark ? '#45a22c' : '#0b6234';
  const inactiveColor = isDark ? '#94a3b8' : '#64748b';
  const barBgColor = isDark ? '#1e293b' : '#ffffff';

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

  // Dimensions for SVG notch
  const SVG_WIDTH = width * 3;
  const C = width;
  const totalBarHeight = BAR_HEIGHT + Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 12);

  // Exact cubic bezier curved notch matching reference design
  const notchPath = `
    M 0 0
    L ${C - 44} 0
    C ${C - 28} 0, ${C - 22} 28, ${C} 28
    C ${C + 22} 28, ${C + 28} 0, ${C + 44} 0
    L ${SVG_WIDTH} 0
    L ${SVG_WIDTH} ${totalBarHeight + 20}
    L 0 ${totalBarHeight + 20}
    Z
  `;

  const notchTranslateX = activeAnim.interpolate({
    inputRange: [0, Math.max(1, routesCount - 1)],
    outputRange: [
      tabWidth / 2 - width,
      (routesCount - 1) * tabWidth + tabWidth / 2 - width,
    ],
  });

  const bubbleTranslateX = activeAnim.interpolate({
    inputRange: [0, Math.max(1, routesCount - 1)],
    outputRange: [
      tabWidth / 2 - BUBBLE_SIZE / 2,
      (routesCount - 1) * tabWidth + tabWidth / 2 - BUBBLE_SIZE / 2,
    ],
  });

  const activeRoute = state.routes[state.index];
  const activeRouteName = activeRoute?.name;
  const activeConfig = (activeRouteName ? TAB_CONFIG[activeRouteName] : undefined) || {
    icon: 'Home' as IconName,
    fallbackLabel: 'Home',
  };
  const isCartActive = activeRouteName === 'cart';

  return (
    <View style={styles.container}>
      {/* ── Background Curved Bar with Moving Notch ── */}
      <View style={[styles.svgContainer, { height: totalBarHeight }]}>
        <Animated.View style={{ transform: [{ translateX: notchTranslateX }] }}>
          <Svg width={SVG_WIDTH} height={totalBarHeight + 20}>
            <Path d={notchPath} fill={barBgColor} />
          </Svg>
        </Animated.View>
      </View>

      {/* ── Elevated Floating Active Bubble ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.floatingBubble,
          {
            backgroundColor: activeColor,
            shadowColor: activeColor,
            transform: [{ translateX: bubbleTranslateX }],
          },
        ]}
      >
        <Icon name={activeConfig.icon} size={22} color="#ffffff" />
        {isCartActive && cartItemCount > 0 && (
          <View style={styles.bubbleBadge}>
            <Text style={styles.badgeText}>{cartItemCount > 99 ? '99+' : cartItemCount}</Text>
          </View>
        )}
      </Animated.View>

      {/* ── Tab Buttons Row ── */}
      <View
        style={[
          styles.tabsRow,
          {
            paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 12),
          },
        ]}
      >
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
            void haptics.selection().catch(() => {});
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
              style={[styles.tabButton, { width: tabWidth }]}
            >
              {/* Inactive Icon sits in the bar; hides when active as it elevates into bubble */}
              <View style={[styles.iconWrapper, { opacity: isFocused ? 0 : 1 }]}>
                <Icon
                  name={config.icon}
                  size={21}
                  color={inactiveColor}
                />
                {isCart && cartItemCount > 0 && !isFocused && (
                  <View style={styles.badge} className="bg-destructive">
                    <Text style={styles.badgeText}>
                      {cartItemCount > 99 ? '99+' : cartItemCount}
                    </Text>
                  </View>
                )}
              </View>

              {/* Minimal Clean Label */}
              <Text
                numberOfLines={1}
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
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: 'transparent',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
  svgContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  floatingBubble: {
    position: 'absolute',
    top: -16,
    left: 0,
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },
  bubbleBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: BAR_HEIGHT + 14,
    paddingTop: 8,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 26,
    height: 26,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 15,
    height: 15,
    borderRadius: 7.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2.5,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  label: {
    fontSize: 9.5,
    marginTop: 3,
    letterSpacing: 0.1,
  },
});

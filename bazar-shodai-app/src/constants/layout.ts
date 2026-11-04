import { Platform, ViewStyle } from 'react-native';

/**
 * Standard Spacing Scale (in density-independent pixels)
 */
export const Spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

/**
 * Standard Border Radii
 * Note: Bazar Shodai uses a unified 4px radius across the web storefront.
 */
export const Radius = {
  none: 0,
  xs: 2,
  sm: 4,
  brand: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  full: 9999,
} as const;

/**
 * Accessibility Touch Target Standards
 */
export const TouchTarget = {
  /**
   * WCAG Minimum Touch Target
   */
  min: 44,
  /**
   * Comfortable thumb target for lists and navigation
   */
  comfortable: 48,
  /**
   * Large call-to-action primary buttons
   */
  prominent: 56,
} as const;

/**
 * Elevation and Shadows across Android and iOS
 */
export const Shadows: Record<'none' | 'sm' | 'md' | 'lg' | 'xl', ViewStyle> = {
  none: {
    ...Platform.select({
      ios: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  sm: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  md: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  lg: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  xl: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
    }),
  },
};

/**
 * Layout dimensions and constraints
 */
export const Layout = {
  headerHeight: 56,
  tabBarHeight: 64,
  maxContentWidth: 480,
  cardAspectRatio: 1.35,
} as const;

import { PixelRatio, TextStyle } from 'react-native';

/**
 * Font Families used in Bazar Shodai Mobile
 * Outfit is used for Brand & Headings, Inter for Body & Numerics
 */
export const FontFamilies = {
  // Heading & Brand: Outfit
  outfit: {
    regular: 'Outfit_400Regular',
    medium: 'Outfit_500Medium',
    semiBold: 'Outfit_600SemiBold',
    bold: 'Outfit_700Bold',
  },
  // Body & UI: Inter
  inter: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semiBold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
} as const;

/**
 * Accessible dynamic font scaler with upper clamp to preserve layout integrity
 */
export function scaleFont(size: number, maxScale: number = 1.3): number {
  const currentScale = PixelRatio.getFontScale();
  const clampedScale = Math.min(Math.max(currentScale, 1), maxScale);
  return Math.round(size * clampedScale);
}

/**
 * Standard Typography Scale
 */
export const Typography: Record<string, TextStyle> = {
  display: {
    fontFamily: FontFamilies.outfit.bold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h1: {
    fontFamily: FontFamilies.outfit.bold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.4,
  },
  h2: {
    fontFamily: FontFamilies.outfit.semiBold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: FontFamilies.outfit.semiBold,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  h4: {
    fontFamily: FontFamilies.outfit.medium,
    fontSize: 18,
    lineHeight: 24,
  },
  bodyLarge: {
    fontFamily: FontFamilies.inter.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyLargeBold: {
    fontFamily: FontFamilies.inter.bold,
    fontSize: 16,
    lineHeight: 24,
  },
  body: {
    fontFamily: FontFamilies.inter.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  bodyMedium: {
    fontFamily: FontFamilies.inter.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  bodySemiBold: {
    fontFamily: FontFamilies.inter.semiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily: FontFamilies.inter.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  caption: {
    fontFamily: FontFamilies.inter.medium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.3,
  },
  price: {
    fontFamily: FontFamilies.inter.bold,
    fontSize: 18,
    lineHeight: 22,
  },
};


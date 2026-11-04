/**
 * Bazar Shodai Mobile Design System - Color Tokens
 * Faithfully ported from the web storefront (`frontend/app/globals.css`).
 * Brand roots: Deep green (বাজার: #0b6234) and Fresh green (সদাই: #45a22c).
 */

export const LightColors = {
  // Brand identity
  brandDeep: '#0b6234',
  brandDeepLight: '#1a7d46',
  brandFresh: '#45a22c',
  brandFreshDark: '#368a21',
  accentText: '#2a7a1a',
  onFresh: '#05260f',
  surface: '#eaf1e5',

  // Produce accents
  tomato: '#e0261b',
  carrot: '#f57c00',
  fish: '#1e88b5',

  // Surfaces & Base
  background: '#f4f8f1',
  foreground: '#12301f',
  card: '#fcfefb',
  cardForeground: '#12301f',
  popover: '#fcfefb',
  popoverForeground: '#12301f',

  // UI Interactive
  primary: '#0b6234',
  primaryForeground: '#f7fbf4',
  secondary: '#e7f0e1',
  secondaryForeground: '#12301f',
  muted: '#edf3e8',
  mutedForeground: '#587263',
  accent: '#def0d3',
  accentForeground: '#12301f',
  destructive: '#d92d20',
  destructiveForeground: '#ffffff',
  border: '#d3e0cb',
  input: '#c3d4b9',
  ring: '#45a22c',

  // Rider & Status indicators
  success: '#45a22c',
  warning: '#f57c00',
  error: '#d92d20',
  info: '#1e88b5',
} as const;

export const DarkColors = {
  // Brand identity
  brandDeep: '#0a2e18',
  brandDeepLight: '#14502c',
  brandFresh: '#6fcf4e',
  brandFreshDark: '#58b83a',
  accentText: '#86d96a',
  onFresh: '#05260f',
  surface: '#12311f',

  // Produce accents
  tomato: '#f0594e',
  carrot: '#ff9a3d',
  fish: '#4db3dd',

  // Surfaces & Base
  background: '#09160e',
  foreground: '#e8f5e1',
  card: '#0f2417',
  cardForeground: '#e8f5e1',
  popover: '#0f2417',
  popoverForeground: '#e8f5e1',

  // UI Interactive
  primary: '#2a7f1c',
  primaryForeground: '#ffffff',
  secondary: '#153221',
  secondaryForeground: '#e8f5e1',
  muted: '#112a1b',
  mutedForeground: '#9dbba6',
  accent: '#1c3f29',
  accentForeground: '#e8f5e1',
  destructive: '#f97066',
  destructiveForeground: '#ffffff',
  border: '#1f4129',
  input: '#285233',
  ring: '#6fcf4e',

  // Rider & Status indicators
  success: '#6fcf4e',
  warning: '#ff9a3d',
  error: '#f97066',
  info: '#4db3dd',
} as const;

export type ColorTokenKey = keyof typeof LightColors;

export type ThemeColors = {
  [K in ColorTokenKey]: string;
};

export const Colors: {
  light: ThemeColors;
  dark: ThemeColors;
} = {
  light: LightColors,
  dark: DarkColors,
};

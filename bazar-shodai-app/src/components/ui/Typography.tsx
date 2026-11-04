import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';

export interface BaseTypographyProps extends RNTextProps {
  className?: string;
  children: React.ReactNode;
}

const MAX_FONT_SCALE = 1.3;

/**
 * Brand Heading Component (Levels 1-4) using Outfit font
 */
export interface HeadingProps extends BaseTypographyProps {
  level?: 1 | 2 | 3 | 4;
}

export function Heading({ level = 1, className = '', children, ...rest }: HeadingProps) {
  const levelClasses = {
    1: 'text-2xl font-bold text-foreground',
    2: 'text-xl font-bold text-foreground',
    3: 'text-lg font-semibold text-foreground',
    4: 'text-base font-semibold text-foreground',
  }[level];

  return (
    <RNText
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      className={`${levelClasses} ${className}`}
      {...rest}
    >
      {children}
    </RNText>
  );
}

/**
 * Standard Body Text Component using Inter font
 */
export interface BodyTextProps extends BaseTypographyProps {
  size?: 'xs' | 'sm' | 'base' | 'lg';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  muted?: boolean;
}

export function BodyText({
  size = 'base',
  weight = 'normal',
  muted = false,
  className = '',
  children,
  ...rest
}: BodyTextProps) {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
  }[size];

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  }[weight];

  const colorClass = muted ? 'text-muted-foreground' : 'text-foreground';

  return (
    <RNText
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      className={`${sizeClasses} ${weightClasses} ${colorClass} ${className}`}
      {...rest}
    >
      {children}
    </RNText>
  );
}

/**
 * Subtle Caption Text
 */
export function Caption({ className = '', children, ...rest }: BaseTypographyProps) {
  return (
    <RNText
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      className={`text-xs text-muted-foreground ${className}`}
      {...rest}
    >
      {children}
    </RNText>
  );
}

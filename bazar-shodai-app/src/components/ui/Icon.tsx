/* eslint-disable import/namespace */
import React from 'react';
import * as LucideIcons from 'lucide-react-native';
import { LucideProps } from 'lucide-react-native';
import { useAppTheme } from '@/components/theme/ThemeProvider';

export type IconName = keyof typeof LucideIcons;
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;

export interface IconProps extends Omit<LucideProps, 'size' | 'color'> {
  name: IconName;
  size?: IconSize;
  color?: string;
  className?: string;
}

const SIZE_MAP: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', number> = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

export function Icon({ name, size = 'md', color, style, ...rest }: IconProps) {
  const { colors } = useAppTheme();

  const IconComponent = (LucideIcons[name] ??
    LucideIcons.HelpCircle) as React.ComponentType<LucideProps>;

  const numericSize = typeof size === 'number' ? size : SIZE_MAP[size];
  const iconColor = color ?? colors.foreground;

  return <IconComponent size={numericSize} color={iconColor} style={style} {...rest} />;
}

import React from 'react';
import { View, Text, ViewProps } from 'react-native';

export type BadgeVariant = 'fresh' | 'tomato' | 'carrot' | 'fish' | 'neutral' | 'outline';

export interface BadgeProps extends ViewProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
  textClassName?: string;
}

export function Badge({
  label,
  variant = 'fresh',
  size = 'md',
  icon,
  className = '',
  textClassName = '',
  style,
  ...rest
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, { container: string; text: string }> = {
    fresh: {
      container: 'bg-brand-fresh/15 border border-brand-fresh/30',
      text: 'text-brand-fresh-dark dark:text-brand-fresh font-bold',
    },
    tomato: {
      container: 'bg-tomato/15 border border-tomato/30',
      text: 'text-tomato font-bold',
    },
    carrot: {
      container: 'bg-carrot/15 border border-carrot/30',
      text: 'text-carrot font-bold',
    },
    fish: {
      container: 'bg-fish/15 border border-fish/30',
      text: 'text-fish font-bold',
    },
    neutral: {
      container: 'bg-secondary border border-border',
      text: 'text-secondary-foreground font-medium',
    },
    outline: {
      container: 'bg-transparent border border-border',
      text: 'text-foreground font-medium',
    },
  };

  const sizeStyles = {
    sm: { container: 'px-1.5 py-0.5 rounded', text: 'text-[10px]' },
    md: { container: 'px-2 py-1 rounded', text: 'text-xs' },
  }[size];

  const currentVariant = variantStyles[variant];

  return (
    <View
      style={style}
      className={`flex-row items-center self-start ${currentVariant.container} ${sizeStyles.container} ${className}`}
      {...rest}
    >
      {icon && <View className="mr-1">{icon}</View>}
      <Text className={`${currentVariant.text} ${sizeStyles.text} ${textClassName}`}>{label}</Text>
    </View>
  );
}

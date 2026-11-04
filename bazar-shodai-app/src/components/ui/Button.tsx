import React from 'react';
import {
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  ActivityIndicator,
  View,
} from 'react-native';
import { TouchTarget, Radius } from '@/constants/layout';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  textClassName?: string;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  className = '',
  textClassName = '',
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  // Base dimension styles ensuring WCAG min touch targets
  const sizeStyles = {
    sm: { minHeight: TouchTarget.min, paddingHorizontal: 12, paddingVertical: 8 },
    md: { minHeight: TouchTarget.comfortable, paddingHorizontal: 16, paddingVertical: 12 },
    lg: { minHeight: TouchTarget.prominent, paddingHorizontal: 24, paddingVertical: 14 },
  }[size];

  // Tailwind class mapping
  const variantClassMap: Record<ButtonVariant, string> = {
    primary: 'bg-brand-deep active:bg-brand-deep-light border-transparent',
    secondary: 'bg-brand-fresh active:bg-brand-fresh-dark border-transparent',
    outline: 'bg-transparent border border-border active:bg-muted',
    ghost: 'bg-transparent border-transparent active:bg-muted',
  };

  const textVariantClassMap: Record<ButtonVariant, string> = {
    primary: 'text-primary-foreground font-semibold',
    secondary: 'text-on-fresh font-semibold',
    outline: 'text-foreground font-medium',
    ghost: 'text-foreground font-medium',
  };

  const textSizeClassMap: Record<ButtonSize, string> = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      activeOpacity={0.75}
      disabled={isDisabled}
      style={[
        {
          borderRadius: Radius.brand,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isDisabled ? 0.6 : 1,
        },
        sizeStyles,
        style,
      ]}
      className={`${variantClassMap[variant]} ${className}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === 'secondary' ? '#05260f' : variant === 'primary' ? '#ffffff' : '#0b6234'
          }
        />
      ) : (
        <>
          {leftIcon && <View style={{ marginRight: 8 }}>{leftIcon}</View>}
          <Text
            className={`${textVariantClassMap[variant]} ${textSizeClassMap[size]} ${textClassName}`}
          >
            {title}
          </Text>
          {rightIcon && <View style={{ marginLeft: 8 }}>{rightIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
}

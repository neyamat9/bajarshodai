import React from 'react';
import {
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  ActivityIndicator,
  View,
  GestureResponderEvent,
} from 'react-native';
import { TouchTarget, Radius } from '@/constants/layout';
import { haptics } from '@/services/haptics';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
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
  enableHaptics?: boolean;
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
  enableHaptics = true,
  disabled,
  onPress,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const handlePress = (e: GestureResponderEvent) => {
    if (isDisabled) return;
    if (enableHaptics) {
      if (variant === 'danger') {
        haptics.warning();
      } else if (variant === 'primary' || variant === 'secondary') {
        haptics.medium();
      } else {
        haptics.light();
      }
    }
    onPress?.(e);
  };

  const sizeStyles = {
    sm: { minHeight: TouchTarget.min, paddingHorizontal: 12, paddingVertical: 8 },
    md: { minHeight: TouchTarget.comfortable, paddingHorizontal: 16, paddingVertical: 12 },
    lg: { minHeight: TouchTarget.prominent, paddingHorizontal: 24, paddingVertical: 14 },
  }[size];

  const variantClassMap: Record<ButtonVariant, string> = {
    primary: 'bg-brand-deep active:bg-brand-deep-light border-transparent',
    secondary: 'bg-brand-fresh active:bg-brand-fresh-dark border-transparent',
    outline: 'bg-transparent border border-border active:bg-muted',
    ghost: 'bg-transparent border-transparent active:bg-muted',
    danger: 'bg-destructive active:opacity-90 border-transparent',
  };

  const textVariantClassMap: Record<ButtonVariant, string> = {
    primary: 'text-primary-foreground font-semibold',
    secondary: 'text-on-fresh font-semibold',
    outline: 'text-foreground font-medium',
    ghost: 'text-foreground font-medium',
    danger: 'text-white font-semibold',
  };

  const textSizeClassMap: Record<ButtonSize, string> = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const spinnerColor = {
    primary: '#ffffff',
    secondary: '#05260f',
    outline: '#0b6234',
    ghost: '#0b6234',
    danger: '#ffffff',
  }[variant];

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      activeOpacity={0.75}
      disabled={isDisabled}
      onPress={handlePress}
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
        <ActivityIndicator size="small" color={spinnerColor} />
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

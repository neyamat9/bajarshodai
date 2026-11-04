import React from 'react';
import { View, ViewProps, TouchableOpacity, TouchableOpacityProps, Text } from 'react-native';
import { Radius, Shadows } from '@/constants/layout';

export interface CardProps extends ViewProps {
  onPress?: TouchableOpacityProps['onPress'];
  elevation?: 'none' | 'sm' | 'md';
  className?: string;
  children: React.ReactNode;
}

export function Card({
  onPress,
  elevation = 'sm',
  className = '',
  children,
  style,
  ...rest
}: CardProps) {
  const shadowStyle = Shadows[elevation];

  const content = (
    <View
      style={[{ borderRadius: Radius.brand }, shadowStyle, style]}
      className={`bg-card border border-border p-4 ${className}`}
      {...rest}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress} accessibilityRole="button">
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

export function CardHeader({ className = '', children, ...rest }: ViewProps) {
  return (
    <View className={`mb-3 ${className}`} {...rest}>
      {children}
    </View>
  );
}

export function CardTitle({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <Text className={`text-base font-bold text-foreground ${className}`}>{children}</Text>;
}

export function CardContent({ className = '', children, ...rest }: ViewProps) {
  return (
    <View className={`${className}`} {...rest}>
      {children}
    </View>
  );
}

export function CardFooter({ className = '', children, ...rest }: ViewProps) {
  return (
    <View
      className={`mt-3 pt-3 border-t border-border flex-row items-center justify-between ${className}`}
      {...rest}
    >
      {children}
    </View>
  );
}

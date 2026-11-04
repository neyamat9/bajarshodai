import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { Button } from './Button';

export interface EmptyStateProps extends ViewProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className = '',
  style,
  ...rest
}: EmptyStateProps) {
  return (
    <View
      style={style}
      className={`items-center justify-center p-8 text-center ${className}`}
      {...rest}
    >
      {icon && <View className="mb-4 items-center justify-center">{icon}</View>}

      <Text className="text-lg font-bold text-foreground text-center mb-1">{title}</Text>

      {description && (
        <Text className="text-xs text-muted-foreground text-center mb-6 max-w-xs leading-relaxed">
          {description}
        </Text>
      )}

      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} variant="primary" size="md" />
      )}
    </View>
  );
}

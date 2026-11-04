import React from 'react';
import { View, Text } from 'react-native';
import { formatBdt } from '@/utils/format';

export interface PriceProps {
  amount: number;
  originalAmount?: number;
  unit?: string;
  locale?: 'en' | 'bn';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Price({
  amount,
  originalAmount,
  unit,
  locale = 'bn',
  size = 'md',
  className = '',
}: PriceProps) {
  const hasDiscount = Boolean(originalAmount && originalAmount > amount);
  const discountPercent = hasDiscount
    ? Math.round((((originalAmount ?? 0) - amount) / (originalAmount ?? 1)) * 100)
    : 0;

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  }[size];

  return (
    <View className={`flex-row items-baseline flex-wrap ${className}`}>
      {/* Current Price */}
      <Text className={`font-bold text-brand-deep dark:text-brand-fresh ${sizeClasses}`}>
        {formatBdt(amount, { locale })}
      </Text>

      {/* Unit */}
      {unit && <Text className="text-xs text-muted-foreground ml-1 font-normal">/ {unit}</Text>}

      {/* Strikethrough Original Price */}
      {hasDiscount && originalAmount && (
        <Text className="text-xs text-muted-foreground line-through ml-2">
          {formatBdt(originalAmount, { locale })}
        </Text>
      )}

      {/* Discount Badge */}
      {hasDiscount && discountPercent > 0 && (
        <View className="ml-2 bg-tomato/10 dark:bg-tomato/20 px-1.5 py-0.5 rounded">
          <Text className="text-[10px] font-bold text-tomato">-{discountPercent}%</Text>
        </View>
      )}
    </View>
  );
}

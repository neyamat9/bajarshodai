import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { haptics } from '@/services/haptics';
import { toBengaliNumerals } from '@/utils/format';
import { TouchTarget, Radius } from '@/constants/layout';

export interface QuantityStepperProps {
  quantity: number;
  onQuantityChange: (newQuantity: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  locale?: 'en' | 'bn';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function QuantityStepper({
  quantity,
  onQuantityChange,
  min = 1,
  max = 99,
  step = 1,
  unit,
  locale = 'bn',
  size = 'md',
  className = '',
}: QuantityStepperProps) {
  const canDecrement = quantity > min;
  const canIncrement = quantity < max;

  const handleDecrement = () => {
    if (!canDecrement) return;
    haptics.light();
    const nextVal = Math.max(min, Math.round((quantity - step) * 100) / 100);
    onQuantityChange(nextVal);
  };

  const handleIncrement = () => {
    if (!canIncrement) return;
    haptics.light();
    const nextVal = Math.min(max, Math.round((quantity + step) * 100) / 100);
    onQuantityChange(nextVal);
  };

  const displayQuantity = locale === 'bn' ? toBengaliNumerals(quantity) : String(quantity);

  const sizeStyles = {
    sm: { buttonSize: 28, fontSize: 13, paddingH: 6 },
    md: { buttonSize: 34, fontSize: 14, paddingH: 10 },
    lg: { buttonSize: 42, fontSize: 16, paddingH: 14 },
  }[size];

  return (
    <View
      style={[styles.container, { minHeight: Math.max(sizeStyles.buttonSize, TouchTarget.min) }]}
      className={`flex-row items-center bg-secondary border border-border rounded-brand ${className}`}
    >
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        disabled={!canDecrement}
        onPress={handleDecrement}
        style={[
          styles.button,
          { width: sizeStyles.buttonSize, height: sizeStyles.buttonSize },
          !canDecrement && styles.disabledButton,
        ]}
      >
        <Text style={[styles.buttonText, !canDecrement && styles.disabledText]}>−</Text>
      </TouchableOpacity>

      <View style={[styles.textSlot, { paddingHorizontal: sizeStyles.paddingH }]}>
        <Text className="font-bold text-foreground" style={{ fontSize: sizeStyles.fontSize }}>
          {displayQuantity}
          {unit && <Text className="text-xs font-normal text-muted-foreground"> {unit}</Text>}
        </Text>
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        disabled={!canIncrement}
        onPress={handleIncrement}
        style={[
          styles.button,
          { width: sizeStyles.buttonSize, height: sizeStyles.buttonSize },
          !canIncrement && styles.disabledButton,
        ]}
      >
        <Text style={[styles.buttonText, !canIncrement && styles.disabledText]}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.brand,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0b6234',
  },
  disabledButton: {
    opacity: 0.3,
  },
  disabledText: {
    color: '#9dbba6',
  },
  textSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32,
  },
});

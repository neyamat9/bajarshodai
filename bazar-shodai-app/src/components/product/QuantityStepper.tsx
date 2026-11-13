import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
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

  const [inputText, setInputText] = useState(() =>
    locale === 'bn' ? toBengaliNumerals(quantity) : String(quantity),
  );

  useEffect(() => {
    setInputText(locale === 'bn' ? toBengaliNumerals(quantity) : String(quantity));
  }, [quantity, locale]);

  const commitInput = (text: string) => {
    const raw = text.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d))).replace(',', '.').trim();
    if (!raw) {
      setInputText(locale === 'bn' ? toBengaliNumerals(quantity) : String(quantity));
      return;
    }
    const val = parseFloat(raw);
    if (isNaN(val) || val < 0) {
      setInputText(locale === 'bn' ? toBengaliNumerals(quantity) : String(quantity));
      return;
    }
    const clamped = Math.max(min, Math.min(max, Math.round(val * 100) / 100));
    setInputText(locale === 'bn' ? toBengaliNumerals(clamped) : String(clamped));
    if (Math.abs(clamped - quantity) > 1e-4) {
      onQuantityChange(clamped);
    }
  };

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
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          onBlur={() => commitInput(inputText)}
          onSubmitEditing={() => commitInput(inputText)}
          keyboardType="numeric"
          selectTextOnFocus
          style={[styles.input, { fontSize: sizeStyles.fontSize }]}
          accessibilityLabel="Quantity"
        />
        {unit && <Text className="text-xs font-normal text-muted-foreground"> {unit}</Text>}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32,
  },
  input: {
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    padding: 0,
    minWidth: 20,
  },
});

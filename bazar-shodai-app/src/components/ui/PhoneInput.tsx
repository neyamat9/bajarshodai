import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Input, InputProps } from './Input';

export interface PhoneInputProps extends Omit<InputProps, 'onChangeText'> {
  value: string;
  onChangePhone: (rawNumber: string, isValid: boolean) => void;
}

// BD mobile operators: 013, 014, 015, 016, 017, 018, 019 followed by 8 digits
export const BD_PHONE_REGEX = /^(1[3-9]\d{8})$/;

export function isValidBdPhone(phone: string): boolean {
  const sanitized = phone.replace(/\D/g, '');
  // Accepts either 10 digits (without leading 0) or 11 digits (with leading 0)
  if (sanitized.length === 11 && sanitized.startsWith('0')) {
    return BD_PHONE_REGEX.test(sanitized.substring(1));
  }
  return BD_PHONE_REGEX.test(sanitized);
}

export function formatBdPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 10)}`;
}

export function PhoneInput({
  value,
  onChangePhone,
  label = 'Phone Number',
  error,
  ...rest
}: PhoneInputProps) {
  const handleTextChange = (text: string) => {
    // Only accept numeric digits
    let cleaned = text.replace(/\D/g, '');
    // If user starts typing with 0 (e.g. 017...), strip leading 0
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    // Limit to 10 digits
    cleaned = cleaned.slice(0, 10);

    const valid = isValidBdPhone(cleaned);
    onChangePhone(cleaned, valid);
  };

  const formattedDisplay = formatBdPhone(value);

  const prefixComponent = (
    <View style={styles.prefixContainer}>
      <Text style={styles.flagText}>🇧🇩</Text>
      <Text style={styles.prefixText}>+880</Text>
      <View style={styles.divider} />
    </View>
  );

  return (
    <Input
      label={label}
      value={formattedDisplay}
      onChangeText={handleTextChange}
      keyboardType="phone-pad"
      maxLength={12} // 10 digits + 2 spaces
      placeholder="1712 345 678"
      leftIcon={prefixComponent}
      error={error}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  prefixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 6,
  },
  flagText: {
    fontSize: 16,
    marginRight: 4,
  },
  prefixText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#12301f',
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: '#d3e0cb',
    marginLeft: 8,
  },
});


import React, { useState } from 'react';
import { View, TextInput, TextInputProps, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TouchTarget, Radius } from '@/constants/layout';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
  clearable?: boolean;
  onClear?: () => void;
  className?: string;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  isPassword = false,
  clearable = false,
  onClear,
  value,
  onChangeText,
  className = '',
  containerClassName = '',
  style,
  ...rest
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(isPassword);

  const hasError = Boolean(error);
  const hasValue = Boolean(value && value.length > 0);

  const handleClear = () => {
    onChangeText?.('');
    onClear?.();
  };

  return (
    <View className={`w-full mb-3 ${containerClassName}`}>
      {label && <Text className="text-xs font-semibold text-foreground mb-1.5">{label}</Text>}

      <View
        style={[
          styles.inputContainer,
          isFocused ? styles.focusedBorder : styles.defaultBorder,
          hasError && styles.errorBorder,
        ]}
        className="bg-card"
      >
        {leftIcon && <View style={styles.iconSlot}>{leftIcon}</View>}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isSecure}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor="#9dbba6"
          style={[styles.input, style]}
          className={`text-foreground ${className}`}
          {...rest}
        />

        {clearable && hasValue && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Clear text"
            onPress={handleClear}
            style={styles.actionSlot}
          >
            <Text style={styles.actionText}>✕</Text>
          </TouchableOpacity>
        )}

        {isPassword && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={isSecure ? 'Show password' : 'Hide password'}
            onPress={() => setIsSecure(!isSecure)}
            style={styles.actionSlot}
          >
            <Text style={styles.passwordToggleText}>{isSecure ? '👁' : '👁‍🗨'}</Text>
          </TouchableOpacity>
        )}

        {rightIcon && !isPassword && <View style={styles.iconSlot}>{rightIcon}</View>}
      </View>

      {hasError ? (
        <Text className="text-xs text-destructive mt-1 font-medium">{error}</Text>
      ) : helperText ? (
        <Text className="text-xs text-muted-foreground mt-1">{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    minHeight: TouchTarget.comfortable,
    borderWidth: 1,
    borderRadius: Radius.brand,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  defaultBorder: {
    borderColor: '#d3e0cb',
  },
  focusedBorder: {
    borderColor: '#45a22c', // brand-fresh
  },
  errorBorder: {
    borderColor: '#d92d20', // destructive
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 10,
  },
  iconSlot: {
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSlot: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 12,
    color: '#9dbba6',
    fontWeight: 'bold',
  },
  passwordToggleText: {
    fontSize: 14,
  },
});

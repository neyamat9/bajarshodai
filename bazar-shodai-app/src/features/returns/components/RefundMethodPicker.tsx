import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { Radius } from '@/constants/layout';
import { RefundMethodType } from '../types';
import { haptics } from '@/services/haptics';

export interface RefundMethodPickerProps {
  selectedMethod: RefundMethodType;
  onSelectMethod: (method: RefundMethodType) => void;
  accountNumber: string;
  onChangeAccountNumber: (num: string) => void;
}

interface MethodOpt {
  id: RefundMethodType;
  label: string;
  desc: string;
  icon: string;
}

const METHODS: MethodOpt[] = [
  {
    id: 'BKASH',
    label: 'bKash (বিকাশ)',
    desc: 'Instant refund to your bKash personal number',
    icon: 'Smartphone',
  },
  {
    id: 'NAGAD',
    label: 'Nagad (নগদ)',
    desc: 'Instant refund to your Nagad personal number',
    icon: 'Smartphone',
  },
  {
    id: 'WALLET',
    label: 'Bazar Shodai Wallet',
    desc: 'Immediate store credits for your next grocery purchase',
    icon: 'CreditCard',
  },
  {
    id: 'ORIGINAL_PAYMENT',
    label: 'Original Payment Method',
    desc: 'Refund returned via same source channel',
    icon: 'RotateCcw',
  },
];

export function RefundMethodPicker({
  selectedMethod,
  onSelectMethod,
  accountNumber,
  onChangeAccountNumber,
}: RefundMethodPickerProps) {
  const needsAccount =
    selectedMethod === 'BKASH' || selectedMethod === 'NAGAD' || selectedMethod === 'ROCKET';

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Preferred Refund Method</Text>

      <View style={styles.methodsList}>
        {METHODS.map((m) => {
          const isSelected = selectedMethod === m.id;

          return (
            <TouchableOpacity
              key={m.id}
              onPress={() => {
                haptics.selection();
                onSelectMethod(m.id);
              }}
              style={[styles.methodCard, isSelected && styles.methodCardActive]}
              activeOpacity={0.8}
            >
              <View style={styles.radio}>{isSelected && <View style={styles.radioDot} />}</View>

              <View style={styles.methodInfoCol}>
                <Text style={[styles.methodLabel, isSelected && styles.methodLabelActive]}>
                  {m.label}
                </Text>
                <Text style={styles.methodDesc}>{m.desc}</Text>
              </View>

              <Icon name={m.icon as any} size={18} color={isSelected ? '#0b6234' : '#9ca3af'} />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Account Number Input */}
      {needsAccount && (
        <View style={styles.accountInputBox}>
          <Text style={styles.accountLabel}>Your {selectedMethod} Mobile Number *</Text>
          <TextInput
            style={styles.accountInput}
            placeholder="017XXXXXXXX (11-digit BD number)"
            placeholderTextColor="#9ca3af"
            keyboardType="phone-pad"
            value={accountNumber}
            onChangeText={onChangeAccountNumber}
            maxLength={11}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  methodsList: {
    gap: 8,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    padding: 12,
    gap: 12,
  },
  methodCardActive: {
    borderColor: '#0b6234',
    backgroundColor: '#f0fdf4',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#9ca3af',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0b6234',
  },
  methodInfoCol: {
    flex: 1,
  },
  methodLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  methodLabelActive: {
    color: '#0b6234',
  },
  methodDesc: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  accountInputBox: {
    marginTop: 6,
    gap: 4,
  },
  accountLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  accountInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#111827',
  },
});

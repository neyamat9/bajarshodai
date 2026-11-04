import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { Radius } from '@/constants/layout';
import { PaymentMethod } from '../types';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';

export interface MobileBankingFormProps {
  method: PaymentMethod;
  senderNumber: string;
  onChangeSenderNumber: (num: string) => void;
  trxId: string;
  onChangeTrxId: (trx: string) => void;
}

const MERCHANT_NUMBERS: Record<PaymentMethod, { number: string; type: string; color: string }> = {
  BKASH: { number: '01886123456', type: 'Merchant (Make Payment)', color: '#e2136e' },
  NAGAD: { number: '01886123456', type: 'Merchant / Send Money', color: '#f7941d' },
  ROCKET: { number: '01886123456-8', type: 'Merchant', color: '#8c3494' },
  CASH_ON_DELIVERY: { number: '', type: '', color: '#0b6234' },
};

export function MobileBankingForm({
  method,
  senderNumber,
  onChangeSenderNumber,
  trxId,
  onChangeTrxId,
}: MobileBankingFormProps) {
  if (method === 'CASH_ON_DELIVERY') return null;

  const config = MERCHANT_NUMBERS[method];

  const handleCopyNumber = () => {
    haptics.light();
    toast.success('Copied to Clipboard', `${config.number} copied`);
  };

  return (
    <View style={styles.container}>
      {/* Merchant Number Card */}
      <View style={[styles.merchantCard, { borderColor: config.color }]}>
        <View style={styles.merchantHeader}>
          <Text style={[styles.methodTitle, { color: config.color }]}>
            {method} Payment Instructions
          </Text>
          <Text style={styles.accountType}>{config.type}</Text>
        </View>

        <View style={styles.numberRow}>
          <Text style={styles.numberText}>{config.number}</Text>
          <TouchableOpacity
            onPress={handleCopyNumber}
            style={styles.copyBtn}
            accessibilityRole="button"
            accessibilityLabel="Copy merchant phone number"
          >
            <Icon name="Copy" size={14} color="#0b6234" />
            <Text style={styles.copyBtnText}>Copy</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.stepsText}>
          1. Go to your {method} app → Select {config.type}.{'\n'}
          2. Enter merchant number above and confirm total payable amount.{'\n'}
          3. Enter your sender number and Transaction ID (TrxID) below:
        </Text>
      </View>

      {/* Input Fields */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Your Sender Mobile Number / Last 4 Digits *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. 01712345678 or last 4 digits (e.g. 5678)"
          placeholderTextColor="#9ca3af"
          keyboardType="phone-pad"
          value={senderNumber}
          onChangeText={onChangeSenderNumber}
          maxLength={11}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Transaction ID (TrxID) (Optional)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. 9K72B8XQ"
          placeholderTextColor="#9ca3af"
          autoCapitalize="characters"
          value={trxId}
          onChangeText={(txt) => onChangeTrxId(txt.toUpperCase())}
          maxLength={20}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
  },
  merchantCard: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    padding: 14,
    gap: 8,
  },
  merchantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  methodTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  accountType: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  numberText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 1,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0b6234',
  },
  stepsText: {
    fontSize: 11,
    lineHeight: 16,
    color: '#4b5563',
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  textInput: {
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

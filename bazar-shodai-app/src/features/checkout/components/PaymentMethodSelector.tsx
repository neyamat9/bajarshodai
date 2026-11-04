import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { Radius } from '@/constants/layout';
import { PaymentMethod } from '../types';
import { haptics } from '@/services/haptics';

export interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
}

interface MethodOption {
  id: PaymentMethod;
  name: string;
  subtitle: string;
  icon: string;
  badge?: string;
  themeColor: string;
}

const METHODS: MethodOption[] = [
  {
    id: 'CASH_ON_DELIVERY',
    name: 'Cash on Delivery (COD)',
    subtitle: 'Pay cash when you receive fresh groceries',
    icon: 'Banknote',
    badge: 'POPULAR',
    themeColor: '#0b6234',
  },
  {
    id: 'BKASH',
    name: 'bKash (বিকাশ)',
    subtitle: 'Send money to official bKash merchant number',
    icon: 'Smartphone',
    themeColor: '#e2136e',
  },
  {
    id: 'NAGAD',
    name: 'Nagad (নগদ)',
    subtitle: 'Send money to official Nagad merchant number',
    icon: 'Smartphone',
    themeColor: '#f7941d',
  },
  {
    id: 'ROCKET',
    name: 'Rocket (রকেট)',
    subtitle: 'Dutch-Bangla Bank Rocket transfer',
    icon: 'Smartphone',
    themeColor: '#8c3494',
  },
];

export function PaymentMethodSelector({
  selectedMethod,
  onSelectMethod,
}: PaymentMethodSelectorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Icon name="CreditCard" size={18} color="#0b6234" />
        <Text style={styles.sectionTitle}>Payment Method</Text>
      </View>

      <View style={styles.list}>
        {METHODS.map((method) => {
          const isSelected = selectedMethod === method.id;

          return (
            <TouchableOpacity
              key={method.id}
              onPress={() => {
                haptics.selection();
                onSelectMethod(method.id);
              }}
              style={[
                styles.methodCard,
                isSelected && { borderColor: method.themeColor, backgroundColor: '#ffffff' },
              ]}
              activeOpacity={0.8}
            >
              <View style={[styles.radioCircle, isSelected && { borderColor: method.themeColor }]}>
                {isSelected && (
                  <View style={[styles.radioDot, { backgroundColor: method.themeColor }]} />
                )}
              </View>

              <View style={styles.methodInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.methodName}>{method.name}</Text>
                  {method.badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{method.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.methodSubtitle}>{method.subtitle}</Text>
              </View>

              <Icon
                name={method.id === 'CASH_ON_DELIVERY' ? 'Banknote' : 'Smartphone'}
                size={20}
                color={isSelected ? method.themeColor : '#9ca3af'}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    paddingHorizontal: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  list: {
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
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#9ca3af',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  methodInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  methodName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  badge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0b6234',
  },
  methodSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
});

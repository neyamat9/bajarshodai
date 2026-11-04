import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { Radius } from '@/constants/layout';
import { useCartStore } from '@/store/useCartStore';
import { useApplyCoupon } from '../api/cartApi';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';

export function CouponInput() {
  const [code, setCode] = useState('');
  const coupon = useCartStore((s) => s.coupon);
  const setCoupon = useCartStore((s) => s.setCoupon);

  const applyMutation = useApplyCoupon();

  const handleApply = async () => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      toast.warning('Coupon code required', 'Please enter a voucher or discount code');
      return;
    }

    try {
      await applyMutation.mutateAsync({
        couponCode: cleanCode,
      });

      haptics.success();
      toast.success('Coupon Applied', `Code "${cleanCode}" applied to your order!`);
      setCode('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid or expired coupon code';
      toast.error('Coupon Error', msg);
    }
  };

  const handleRemove = () => {
    haptics.light();
    setCoupon(null);
    toast.info('Coupon Removed', 'Discount removed from your cart');
  };

  if (coupon) {
    return (
      <View style={styles.appliedCard}>
        <View style={styles.appliedLeft}>
          <View style={styles.appliedIconBox}>
            <Icon name="Tag" size={16} color="#0b6234" />
          </View>
          <View>
            <Text style={styles.appliedCode}>{coupon.code}</Text>
            <Text style={styles.appliedDiscount}>
              -৳{coupon.discount.toFixed(0)} Discount Applied
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleRemove}
          style={styles.removeBtn}
          accessibilityRole="button"
          accessibilityLabel="Remove coupon"
        >
          <Icon name="X" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <Icon name="Tag" size={18} color="#9ca3af" />
        <TextInput
          style={styles.input}
          placeholder="Enter Promo or Voucher Code"
          placeholderTextColor="#9ca3af"
          value={code}
          onChangeText={(txt) => setCode(txt.toUpperCase())}
          autoCapitalize="characters"
          returnKeyType="done"
        />
        <TouchableOpacity
          onPress={handleApply}
          style={[styles.applyBtn, !code.trim() && styles.applyBtnDisabled]}
          disabled={!code.trim() || applyMutation.isPending}
          accessibilityRole="button"
          accessibilityLabel="Apply coupon"
        >
          {applyMutation.isPending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.applyBtnText}>Apply</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: Radius.md,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 5,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
    paddingVertical: 6,
  },
  applyBtn: {
    backgroundColor: '#0b6234',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnDisabled: {
    backgroundColor: '#9ca3af',
  },
  applyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  appliedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: Radius.md,
    padding: 12,
    marginVertical: 4,
  },
  appliedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  appliedIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appliedCode: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0b6234',
    letterSpacing: 0.5,
  },
  appliedDiscount: {
    fontSize: 12,
    color: '#15803d',
    fontWeight: '600',
  },
  removeBtn: {
    padding: 6,
  },
});

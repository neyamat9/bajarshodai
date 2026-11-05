import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { Radius } from '@/constants/layout';
import { formatBdt } from '@/utils/format';

export interface FreeShippingProgressBarProps {
  subtotal: number;
  threshold?: number;
}

export function FreeShippingProgressBar({
  subtotal,
  threshold = 500,
}: FreeShippingProgressBarProps) {
  const safeSubtotal = typeof subtotal === 'number' && !isNaN(subtotal) ? subtotal : 0;
  const safeThreshold = typeof threshold === 'number' && !isNaN(threshold) ? threshold : 500;
  const isUnlocked = safeSubtotal >= safeThreshold;
  const remaining = Math.max(0, safeThreshold - safeSubtotal);
  const percentage = Math.min(100, Math.round((safeSubtotal / (safeThreshold || 1)) * 100));

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Icon
            name={isUnlocked ? 'CheckCircle' : 'Truck'}
            size={16}
            color={isUnlocked ? '#059669' : '#0b6234'}
          />
        </View>
        <View style={styles.textCol}>
          {isUnlocked ? (
            <Text style={styles.unlockedText}>
              ফ্রি ডেলিভারি আনলক হয়েছে! (Free Delivery Unlocked)
            </Text>
          ) : (
            <Text style={styles.progressText}>
              ফ্রি ডেলিভারির জন্য আরও <Text style={styles.highlightText}>{formatBdt(remaining)}</Text> টাকার পণ্য যোগ করুন
            </Text>
          )}
        </View>
      </View>

      <View style={styles.track}>
        <View
          style={[styles.fill, { width: `${percentage}%` }, isUnlocked && styles.fillComplete]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: Radius.md,
    padding: 12,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
  },
  unlockedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  highlightText: {
    fontWeight: '800',
    color: '#0b6234',
  },
  track: {
    height: 6,
    backgroundColor: '#dcfce7',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  fillComplete: {
    backgroundColor: '#059669',
  },
});

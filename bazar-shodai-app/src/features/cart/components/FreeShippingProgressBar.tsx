import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { Radius } from '@/constants/layout';

export interface FreeShippingProgressBarProps {
  subtotal: number;
  threshold?: number;
}

export function FreeShippingProgressBar({
  subtotal,
  threshold = 500,
}: FreeShippingProgressBarProps) {
  const isUnlocked = subtotal >= threshold;
  const remaining = Math.max(0, threshold - subtotal);
  const percentage = Math.min(100, Math.round((subtotal / threshold) * 100));

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
              Free Delivery Unlocked! / আপনি ফ্রি ডেলিভারি পাচ্ছেন!
            </Text>
          ) : (
            <Text style={styles.progressText}>
              Add <Text style={styles.highlightText}>৳{remaining.toFixed(0)}</Text> more for Free
              Delivery
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

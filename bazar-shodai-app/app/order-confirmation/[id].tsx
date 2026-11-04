import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Radius } from '@/constants/layout';
import { haptics } from '@/services/haptics';

export default function OrderConfirmationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = typeof id === 'string' ? id : 'ORD-SUCCESS';

  useEffect(() => {
    haptics.success();
  }, []);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <View style={styles.content}>
        {/* Celebration Circle */}
        <View style={styles.iconCircle}>
          <Icon name="CheckCircle" size={64} color="#059669" />
        </View>

        <Text style={styles.title}>Thank You!</Text>
        <Text style={styles.banglaTitle}>আপনার অর্ডার সফলভাবে গৃহীত হয়েছে</Text>

        <View style={styles.orderNumberCard}>
          <Text style={styles.orderNumberLabel}>Order Reference</Text>
          <Text style={styles.orderNumberText}>#{orderId}</Text>
          <Badge label="ORDER PLACED" variant="fresh" size="sm" />
        </View>

        <View style={styles.timelineBox}>
          <View style={styles.timelineRow}>
            <Icon name="Truck" size={18} color="#0b6234" />
            <View style={{ flex: 1 }}>
              <Text style={styles.timelineTitle}>Estimated Delivery</Text>
              <Text style={styles.timelineDesc}>১-২ ঘণ্টার মধ্যে আপনার ঠিকানায় পৌঁছাবে</Text>
            </View>
          </View>

          <View style={styles.timelineRow}>
            <Icon name="PhoneCall" size={18} color="#0b6234" />
            <View style={{ flex: 1 }}>
              <Text style={styles.timelineTitle}>Delivery Updates</Text>
              <Text style={styles.timelineDesc}>
                We will send live SMS and rider details to your phone.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title="Track Order Live"
            variant="primary"
            size="lg"
            onPress={() => router.replace(`/orders/${orderId}` as any)}
            leftIcon={<Icon name="Navigation" size={18} color="#ffffff" />}
          />

          <Button
            title="Continue Shopping"
            variant="outline"
            size="md"
            onPress={() => router.replace('/')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
  },
  banglaTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#059669',
    textAlign: 'center',
  },
  orderNumberCard: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: Radius.md,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
    marginVertical: 8,
    width: '100%',
  },
  orderNumberLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  orderNumberText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.5,
  },
  timelineBox: {
    width: '100%',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: Radius.md,
    padding: 16,
    gap: 14,
    marginVertical: 10,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  timelineTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0b6234',
  },
  timelineDesc: {
    fontSize: 12,
    color: '#166534',
    marginTop: 2,
    lineHeight: 17,
  },
  actions: {
    width: '100%',
    gap: 10,
    marginTop: 14,
  },
});

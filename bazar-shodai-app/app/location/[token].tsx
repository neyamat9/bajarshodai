import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Radius } from '@/constants/layout';
import {
  fetchLocationTokenInfoApi,
  submitLocationTokenApi,
} from '@/features/location/api/myLocation';
import { getCurrentCoordinates } from '@/services/location';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';

export default function LocationShareTokenScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const tokenStr = typeof token === 'string' ? token : '';

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { data: info, isLoading } = useQuery({
    queryKey: ['location-token-info', tokenStr],
    queryFn: () => fetchLocationTokenInfoApi(tokenStr),
    enabled: Boolean(tokenStr),
    staleTime: 1000 * 60 * 5,
  });

  const handleShareCurrentLocation = async () => {
    setSubmitting(true);
    try {
      const pos = await getCurrentCoordinates();
      await submitLocationTokenApi(tokenStr, {
        lat: pos.latitude,
        lng: pos.longitude,
        accuracyM: pos.accuracy ?? 10,
      });

      haptics.success();
      setSubmitted(true);
      toast.success('Location Shared', 'Rider has received your exact doorstep GPS coordinates!');
    } catch {
      toast.error('Sharing failed', 'Could not share location. Please check GPS permissions.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Icon name="ArrowLeft" size={22} color="#0b6234" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Location Request</Text>
        <View style={{ width: 34 }} />
      </View>

      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#0b6234" />
            <Text style={styles.loadingText}>Reading location share link...</Text>
          </View>
        ) : submitted ? (
          <View style={styles.successCard}>
            <View style={styles.successIconBox}>
              <Icon name="CheckCircle" size={48} color="#059669" />
            </View>
            <Text style={styles.successTitle}>Location Sent Successfully!</Text>
            <Text style={styles.successDesc}>
              The delivery rider now has your exact doorstep pin and is navigating towards you.
            </Text>
            <Button
              title="Return to Home"
              variant="primary"
              size="lg"
              onPress={() => router.replace('/')}
              className="mt-4"
            />
          </View>
        ) : (
          <View style={styles.mainCard}>
            <View style={styles.heroIconBox}>
              <Icon name="MapPin" size={36} color="#0b6234" />
            </View>

            <Text style={styles.cardTitle}>
              {info?.shopName || 'Bazar Shodai'} Delivery Request
            </Text>
            <Text style={styles.cardSubtitle}>
              {info?.requesterName
                ? `${info.requesterName} is delivering your order`
                : 'Help our courier find your exact building or house without making phone calls.'}
            </Text>

            {info?.orderNumber && (
              <View style={styles.orderBadge}>
                <Text style={styles.orderBadgeText}>Order #{info.orderNumber}</Text>
              </View>
            )}

            <View style={styles.benefitBox}>
              <View style={styles.benefitRow}>
                <Icon name="Zap" size={16} color="#0b6234" />
                <Text style={styles.benefitText}>
                  1-Tap GPS Share (One-time, no continuous tracking)
                </Text>
              </View>
              <View style={styles.benefitRow}>
                <Icon name="Shield" size={16} color="#0b6234" />
                <Text style={styles.benefitText}>
                  Privacy protected: shared only with your assigned rider
                </Text>
              </View>
            </View>

            <View style={styles.actionSection}>
              <Button
                title="Share Current GPS Location"
                variant="primary"
                size="lg"
                onPress={handleShareCurrentLocation}
                loading={submitting}
                disabled={submitting}
                leftIcon={<Icon name="Navigation" size={18} color="#ffffff" />}
              />
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  centerBox: {
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  mainCard: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  heroIconBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  orderBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  orderBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  benefitBox: {
    width: '100%',
    backgroundColor: '#f0fdf4',
    borderRadius: Radius.md,
    padding: 12,
    gap: 8,
    marginVertical: 10,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '500',
    flex: 1,
  },
  actionSection: {
    width: '100%',
    marginTop: 6,
  },
  successCard: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  successIconBox: {
    marginBottom: 4,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#059669',
    textAlign: 'center',
  },
  successDesc: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
  },
});

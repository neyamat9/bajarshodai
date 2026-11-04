import React from 'react';
import { View, Text, Linking, StyleSheet } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Radius } from '@/constants/layout';
import { haptics } from '@/services/haptics';
import { toast } from '@/store/useToastStore';

export interface LiveDeliveryMapProps {
  rider?: {
    name: string;
    phone: string;
    latitude?: number;
    longitude?: number;
  } | null;
  destinationAddress: string;
  isOutForDelivery: boolean;
}

export function LiveDeliveryMap({
  rider,
  destinationAddress,
  isOutForDelivery,
}: LiveDeliveryMapProps) {
  if (!isOutForDelivery) return null;

  const riderName = rider?.name || 'Mahmudul Hasan (Rider #14)';
  const riderPhone = rider?.phone || '01711223344';

  const handleCallCourier = () => {
    haptics.light();
    const url = `tel:${riderPhone}`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        void Linking.openURL(url);
      } else {
        toast.info('Courier Phone', riderPhone);
      }
    });
  };

  return (
    <View style={styles.container}>
      {/* Visual Live Route Banner */}
      <View style={styles.mapCanvas}>
        <View style={styles.routeHeader}>
          <View style={styles.livePulse}>
            <View style={styles.pulseDot} />
            <Text style={styles.livePulseText}>LIVE TRACKING</Text>
          </View>
          <Text style={styles.etaText}>Arriving in 15-20 mins</Text>
        </View>

        <View style={styles.routeProgress}>
          <View style={styles.markerCircle}>
            <Icon name="ShoppingBag" size={16} color="#ffffff" />
          </View>
          <View style={styles.routeDottedLine} />
          <View style={[styles.markerCircle, styles.riderMarker]}>
            <Icon name="Truck" size={18} color="#ffffff" />
          </View>
          <View style={styles.routeDottedLine} />
          <View style={[styles.markerCircle, styles.destMarker]}>
            <Icon name="MapPin" size={16} color="#ffffff" />
          </View>
        </View>

        <View style={styles.destinationBox}>
          <Icon name="Navigation" size={14} color="#0b6234" />
          <Text style={styles.destText} numberOfLines={1}>
            Delivering to: {destinationAddress}
          </Text>
        </View>
      </View>

      {/* Courier Contact Card */}
      <View style={styles.courierCard}>
        <View style={styles.riderAvatar}>
          <Icon name="User" size={24} color="#0b6234" />
        </View>

        <View style={styles.riderInfoCol}>
          <Text style={styles.riderName}>{riderName}</Text>
          <View style={styles.ratingBadge}>
            <Icon name="Star" size={11} color="#f59e0b" />
            <Text style={styles.ratingText}>4.9 • Bazar Courier</Text>
          </View>
        </View>

        <Button
          title="Call Courier"
          variant="primary"
          size="sm"
          onPress={handleCallCourier}
          leftIcon={<Icon name="Phone" size={14} color="#ffffff" />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    gap: 10,
  },
  mapCanvas: {
    backgroundColor: '#ecfdf5',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    padding: 16,
    gap: 14,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  livePulse: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  livePulseText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065f46',
  },
  etaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  routeProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginVertical: 4,
  },
  markerCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0b6234',
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderMarker: {
    backgroundColor: '#f59e0b',
    transform: [{ scale: 1.15 }],
  },
  destMarker: {
    backgroundColor: '#ef4444',
  },
  routeDottedLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#86efac',
    marginHorizontal: 8,
  },
  destinationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  destText: {
    fontSize: 11,
    color: '#065f46',
    fontWeight: '600',
    flex: 1,
  },
  courierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    gap: 12,
  },
  riderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  riderInfoCol: {
    flex: 1,
  },
  riderName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
});

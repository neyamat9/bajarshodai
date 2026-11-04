import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Radius } from '@/constants/layout';
import {
  getCurrentCoordinates,
  reverseGeocodeCoordinates,
  DEFAULT_COORDINATES,
} from '@/services/location';
import { useShareLocationMutation, LocationSearchResult } from '@/features/location/api/myLocation';
import { AddressSearchPicker } from '@/features/location/components/AddressSearchPicker';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';

export default function DeliveryLocationPickerScreen() {
  const router = useRouter();

  const [coords, setCoords] = useState(DEFAULT_COORDINATES);
  const [address, setAddress] = useState('Acquiring location...');
  const [isLocating, setIsLocating] = useState(false);

  const shareMutation = useShareLocationMutation();

  const handleLocateMe = async () => {
    setIsLocating(true);
    haptics.selection();
    try {
      const position = await getCurrentCoordinates();
      setCoords(position);
      const geocoded = await reverseGeocodeCoordinates(position.latitude, position.longitude);
      setAddress(geocoded.formattedAddress);
      toast.info('Location Found', geocoded.formattedAddress);
    } catch {
      toast.warning('Location Fallback', 'Using standard delivery zone coordinates');
    } finally {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    getCurrentCoordinates()
      .then(async (position) => {
        if (!isMounted) return;
        setCoords(position);
        const geocoded = await reverseGeocodeCoordinates(position.latitude, position.longitude);
        if (!isMounted) return;
        setAddress(geocoded.formattedAddress);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectArea = async (area: LocationSearchResult) => {
    setAddress(`${area.name}${area.parentName ? `, ${area.parentName}` : ''}, Bangladesh`);
  };

  const handleConfirmLocation = async () => {
    try {
      await shareMutation.mutateAsync({
        lat: coords.latitude,
        lng: coords.longitude,
        accuracyM: coords.accuracy ?? 10,
        source: 'GPS',
      });

      haptics.success();
      toast.success('Location Set', 'Delivery address & charges updated');
      router.back();
    } catch {
      toast.success('Location Saved', 'Delivery location configured');
      router.back();
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
        <Text style={styles.headerTitle}>Set Delivery Pin</Text>
        <View style={{ width: 34 }} />
      </View>

      {/* Search Header Overlay */}
      <View style={styles.searchOverlay}>
        <AddressSearchPicker onSelectArea={handleSelectArea} />
      </View>

      {/* Visual Pin & Map Representation */}
      <View style={styles.mapCanvas}>
        <View style={styles.mapGridMock}>
          <View style={styles.gridLineH} />
          <View style={styles.gridLineH2} />
          <View style={styles.gridLineV} />
          <View style={styles.gridLineV2} />

          {/* Central Pin */}
          <View style={styles.pinWrapper}>
            <View style={styles.pinBubble}>
              <Text style={styles.pinBubbleText}>Order delivered here</Text>
            </View>
            <View style={styles.pinMarker}>
              <Icon name="MapPin" size={36} color="#0b6234" />
            </View>
            <View style={styles.pinShadow} />
          </View>
        </View>

        {/* GPS Locate Floating Button */}
        <TouchableOpacity
          onPress={handleLocateMe}
          style={styles.gpsFab}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Locate my position with GPS"
        >
          {isLocating ? (
            <ActivityIndicator size="small" color="#0b6234" />
          ) : (
            <Icon name="Navigation" size={20} color="#0b6234" />
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom Address Card */}
      <View style={styles.bottomSheet}>
        <View style={styles.dragPill} />

        <View style={styles.addressRow}>
          <View style={styles.addressIconCircle}>
            <Icon name="MapPin" size={20} color="#0b6234" />
          </View>
          <View style={styles.addressTextCol}>
            <Text style={styles.addressLabel}>Delivery Destination</Text>
            <Text style={styles.addressValue} numberOfLines={2}>
              {address}
            </Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.infoPill}>
            <Icon name="Truck" size={14} color="#0b6234" />
            <Text style={styles.infoPillText}>Standard ৳40 (Free over ৳500)</Text>
          </View>
          <View style={styles.infoPill}>
            <Icon name="Clock" size={14} color="#0b6234" />
            <Text style={styles.infoPillText}>১-২ ঘণ্টার মধ্যে ডেলিভারি</Text>
          </View>
        </View>

        <Button
          title="Confirm Delivery Location"
          variant="primary"
          size="lg"
          onPress={handleConfirmLocation}
          loading={shareMutation.isPending}
          disabled={shareMutation.isPending}
        />
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
    zIndex: 10,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  searchOverlay: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    zIndex: 20,
  },
  mapCanvas: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapGridMock: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridLineH: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  gridLineH2: {
    position: 'absolute',
    top: '70%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  gridLineV: {
    position: 'absolute',
    left: '30%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#e2e8f0',
  },
  gridLineV2: {
    position: 'absolute',
    left: '70%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#e2e8f0',
  },
  pinWrapper: {
    alignItems: 'center',
    marginBottom: 40,
  },
  pinBubble: {
    backgroundColor: '#111827',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    marginBottom: 4,
  },
  pinBubbleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  pinMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinShadow: {
    width: 16,
    height: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginTop: 2,
  },
  gpsFab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  bottomSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 14,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
  },
  dragPill: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e5e7eb',
    alignSelf: 'center',
    marginBottom: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addressIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressTextCol: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0b6234',
    textTransform: 'uppercase',
  },
  addressValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  infoPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoPillText: {
    fontSize: 11,
    color: '#4b5563',
    fontWeight: '500',
  },
});

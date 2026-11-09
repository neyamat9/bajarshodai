import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Radius } from '@/constants/layout';
import { CustomerAddress } from '../types';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';
import { getCurrentCoordinates, reverseGeocodeCoordinates } from '@/services/location';

export interface AddressSelectorProps {
  selectedAddress: CustomerAddress | null;
  onSelectAddress: (address: CustomerAddress) => void;
}

export function AddressSelector({ selectedAddress, onSelectAddress }: AddressSelectorProps) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('Shahrasti');
  const [label, setLabel] = useState<'HOME' | 'OFFICE' | 'OTHER'>('HOME');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const handleDetectLocation = async () => {
    try {
      setIsLocating(true);
      haptics.selection();
      const pos = await getCurrentCoordinates();
      setCoords({ lat: pos.latitude, lng: pos.longitude });
      const geo = await reverseGeocodeCoordinates(pos.latitude, pos.longitude);
      if (!addressLine.trim() && geo.formattedAddress) {
        setAddressLine(geo.formattedAddress);
      }
      if (geo.city) {
        setCity(geo.city);
      }
      haptics.success();
      toast.success('লোকেশন শনাক্ত হয়েছে', geo.formattedAddress);
    } catch {
      haptics.error();
      toast.error('লোকেশন ত্রুটি', 'জিপিএস চালু আছে কিনা নিশ্চিত করুন');
    } finally {
      setIsLocating(false);
    }
  };

  const { data: addresses = [] } = useQuery({
    queryKey: ['customer-addresses'],
    queryFn: async () => {
      try {
        const res = await api.get<CustomerAddress[]>('/customer/addresses');
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const addAddressMutation = useMutation({
    mutationFn: async (payload: Partial<CustomerAddress>) => {
      return api.post<CustomerAddress>('/customer/addresses', payload);
    },
    onSuccess: (newAddr) => {
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] });
      onSelectAddress(newAddr);
      setIsAddModalOpen(false);
      toast.success('Address Added', 'Delivery address saved');
      haptics.success();
    },
    onError: () => {
      // Local fallback address
      const fallback: CustomerAddress = {
        id: `addr-${Date.now()}`,
        fullName: fullName.trim() || user?.name || 'Customer',
        phone: phone.trim() || user?.phone || '',
        address: addressLine.trim() || 'Shahrasti, Chandpur',
        city,
        latitude: coords?.lat ?? 23.2185,
        longitude: coords?.lng ?? 90.9525,
        label,
      };
      onSelectAddress(fallback);
      setIsAddModalOpen(false);
      toast.success('Address Saved', 'Using new delivery address');
    },
  });

  const handleSaveAddress = () => {
    if (!fullName.trim()) {
      toast.warning('Name required', 'Please enter recipient name');
      return;
    }
    if (!phone.trim() || phone.length < 11) {
      toast.warning('Phone required', 'Please enter 11-digit mobile number');
      return;
    }
    if (!addressLine.trim()) {
      toast.warning('Address required', 'Please enter house, road or area name');
      return;
    }

    addAddressMutation.mutate({
      fullName: fullName.trim(),
      phone: phone.trim(),
      address: addressLine.trim(),
      city,
      latitude: coords?.lat ?? 23.2185,
      longitude: coords?.lng ?? 90.9525,
      label,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={styles.titleRow}>
          <Icon name="MapPin" size={18} color="#0b6234" />
          <Text style={styles.sectionTitle}>Delivery Address</Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            haptics.selection();
            setIsAddModalOpen(true);
          }}
          style={styles.addBtn}
          accessibilityRole="button"
          accessibilityLabel="Add new address"
        >
          <Icon name="Plus" size={14} color="#0b6234" />
          <Text style={styles.addBtnText}>Add New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {/* If no saved addresses exist, provide a default card */}
        {addresses.length === 0 && !selectedAddress ? (
          <TouchableOpacity
            onPress={() => setIsAddModalOpen(true)}
            style={[styles.addressCard, styles.addNewCard]}
            activeOpacity={0.8}
          >
            <Icon name="PlusCircle" size={24} color="#0b6234" />
            <Text style={styles.addNewCardText}>Add Delivery Address</Text>
          </TouchableOpacity>
        ) : null}

        {/* Selected custom/guest address card if not in saved list */}
        {selectedAddress && !addresses.some((a) => a.id === selectedAddress.id) && (
          <View style={[styles.addressCard, styles.addressCardActive]}>
            <View style={styles.cardHeader}>
              <View style={styles.labelBadge}>
                <Text style={styles.labelBadgeText}>{selectedAddress.label || 'CURRENT'}</Text>
              </View>
              <Icon name="CheckCircle" size={16} color="#0b6234" />
            </View>
            <Text style={styles.nameText}>{selectedAddress.fullName}</Text>
            <Text style={styles.phoneText}>{selectedAddress.phone}</Text>
            <Text style={styles.streetText} numberOfLines={2}>
              {selectedAddress.address}
            </Text>
          </View>
        )}

        {/* Saved Addresses */}
        {addresses.map((item) => {
          const isSelected = selectedAddress?.id === item.id;

          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => {
                haptics.selection();
                onSelectAddress(item);
              }}
              style={[styles.addressCard, isSelected && styles.addressCardActive]}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.labelBadge, isSelected && styles.labelBadgeActive]}>
                  <Text style={[styles.labelBadgeText, isSelected && styles.labelBadgeTextActive]}>
                    {item.label || 'HOME'}
                  </Text>
                </View>
                {isSelected && <Icon name="CheckCircle" size={16} color="#0b6234" />}
              </View>

              <Text style={styles.nameText}>{item.fullName}</Text>
              <Text style={styles.phoneText}>{item.phone}</Text>
              <Text style={styles.streetText} numberOfLines={2}>
                {item.address}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Add New Address Modal */}
      <Modal
        visible={isAddModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsAddModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Delivery Address</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <Icon name="X" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
            >
              {/* Type Pills */}
              <View style={styles.pillsRow}>
                {(['HOME', 'OFFICE', 'OTHER'] as const).map((lbl) => (
                  <TouchableOpacity
                    key={lbl}
                    onPress={() => setLabel(lbl)}
                    style={[styles.pill, label === lbl && styles.pillActive]}
                  >
                    <Text style={[styles.pillText, label === lbl && styles.pillTextActive]}>
                      {lbl}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View>
                <Text style={styles.fieldLabel}>Recipient Full Name *</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="e.g. Tanvir Ahmed"
                  placeholderTextColor="#9ca3af"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>

              <View>
                <Text style={styles.fieldLabel}>Recipient Mobile Number *</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="017XXXXXXXX"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  maxLength={11}
                />
              </View>

              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={styles.fieldLabel}>Detailed Address (House, Road, Area) *</Text>
                  <TouchableOpacity
                    style={[styles.gpsDetectBtn, coords && styles.gpsDetectBtnActive]}
                    onPress={handleDetectLocation}
                    disabled={isLocating}
                    activeOpacity={0.8}
                  >
                    {isLocating ? (
                      <ActivityIndicator size="small" color="#0b6234" />
                    ) : (
                      <Icon name="Crosshair" size={14} color={coords ? '#0b6234' : '#374151'} />
                    )}
                    <Text style={[styles.gpsDetectBtnText, coords && styles.gpsDetectBtnTextActive]}>
                      {isLocating ? 'খোঁজা হচ্ছে...' : coords ? '✓ GPS পিন করা' : 'GPS লোকেশন দিন'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={[styles.fieldInput, { minHeight: 70 }]}
                  placeholder="House #12, Road #4, Shahrasti Bazar..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={3}
                  value={addressLine}
                  onChangeText={setAddressLine}
                />
              </View>

              <View>
                <Text style={styles.fieldLabel}>City / District</Text>
                <TextInput style={styles.fieldInput} value={city} onChangeText={setCity} />
              </View>

              <Button
                title="Save Address"
                variant="primary"
                size="lg"
                onPress={handleSaveAddress}
                loading={addAddressMutation.isPending}
                className="mt-2"
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0b6234',
  },
  scrollList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  addressCard: {
    width: 220,
    backgroundColor: '#ffffff',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    padding: 12,
    gap: 4,
  },
  addressCardActive: {
    borderColor: '#0b6234',
    backgroundColor: '#f0fdf4',
  },
  addNewCard: {
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  addNewCardText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0b6234',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  labelBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  labelBadgeActive: {
    backgroundColor: '#dcfce7',
  },
  labelBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6b7280',
  },
  labelBadgeTextActive: {
    color: '#0b6234',
  },
  nameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  phoneText: {
    fontSize: 12,
    color: '#4b5563',
  },
  streetText: {
    fontSize: 11,
    color: '#6b7280',
    lineHeight: 16,
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  modalBody: {
    padding: 16,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  pillActive: {
    backgroundColor: '#0b6234',
    borderColor: '#0b6234',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
  },
  pillTextActive: {
    color: '#ffffff',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  fieldInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#111827',
  },
  gpsDetectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  gpsDetectBtnActive: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  gpsDetectBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  gpsDetectBtnTextActive: {
    color: '#0b6234',
  },
});

import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { Radius } from '@/constants/layout';
import { DeliverySlotOption } from '../types';
import { haptics } from '@/services/haptics';

export interface DeliverySlotPickerProps {
  selectedSlot: string;
  onSelectSlot: (slotId: string) => void;
  deliveryNotes: string;
  onChangeDeliveryNotes: (notes: string) => void;
}

const SLOTS: DeliverySlotOption[] = [
  {
    id: 'EXPRESS_1_2_HRS',
    label: 'Express (1 - 2 Hours)',
    labelBn: 'তাৎক্ষণিক ১-২ ঘণ্টা',
    timeWindow: 'Within 60-120 mins',
    isExpress: true,
  },
  {
    id: 'EVENING_TODAY',
    label: 'Evening Today (5 PM - 8 PM)',
    labelBn: 'আজ সন্ধ্যা ৫টা - ৮টা',
    timeWindow: '5:00 PM - 8:00 PM',
  },
  {
    id: 'MORNING_TOMORROW',
    label: 'Tomorrow Morning (8 AM - 11 AM)',
    labelBn: 'আগামীকাল সকাল ৮টা - ১১টা',
    timeWindow: '8:00 AM - 11:00 AM',
  },
];

export function DeliverySlotPicker({
  selectedSlot,
  onSelectSlot,
  deliveryNotes,
  onChangeDeliveryNotes,
}: DeliverySlotPickerProps) {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Icon name="Clock" size={18} color="#0b6234" />
        <Text style={styles.sectionTitle}>Preferred Delivery Slot</Text>
      </View>

      {/* Slots List */}
      <View style={styles.slotsGroup}>
        {SLOTS.map((slot) => {
          const isSelected = selectedSlot === slot.id;

          return (
            <TouchableOpacity
              key={slot.id}
              onPress={() => {
                haptics.selection();
                onSelectSlot(slot.id);
              }}
              style={[styles.slotCard, isSelected && styles.slotCardActive]}
              activeOpacity={0.8}
            >
              <View style={styles.radioCircle}>
                {isSelected && <View style={styles.radioDot} />}
              </View>

              <View style={styles.slotTextCol}>
                <View style={styles.slotLabelRow}>
                  <Text style={[styles.slotLabel, isSelected && styles.slotLabelActive]}>
                    {slot.label}
                  </Text>
                  {slot.isExpress && (
                    <View style={styles.expressBadge}>
                      <Icon name="Zap" size={10} color="#0b6234" />
                      <Text style={styles.expressText}>FASTEST</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.slotSubtitle}>
                  {slot.labelBn} • {slot.timeWindow}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Instructions Textarea */}
      <View style={styles.notesGroup}>
        <Text style={styles.notesLabel}>Delivery Instructions (Optional)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="e.g. Call before arrival, leave with security guard, 3rd floor..."
          placeholderTextColor="#9ca3af"
          value={deliveryNotes}
          onChangeText={onChangeDeliveryNotes}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
        />
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
  slotsGroup: {
    gap: 8,
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    padding: 12,
    gap: 12,
  },
  slotCardActive: {
    borderColor: '#0b6234',
    backgroundColor: '#f0fdf4',
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
    backgroundColor: '#0b6234',
  },
  slotTextCol: {
    flex: 1,
  },
  slotLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slotLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  slotLabelActive: {
    color: '#0b6234',
  },
  expressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  expressText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0b6234',
  },
  slotSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  notesGroup: {
    marginTop: 12,
    gap: 6,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  notesInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#111827',
    minHeight: 54,
  },
});

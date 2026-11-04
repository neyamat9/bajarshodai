import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Radius } from '@/constants/layout';
import { RiderFailReason } from '../types';
import { haptics } from '@/services/haptics';

export interface DeliveryFailedModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: RiderFailReason, note: string) => void;
  loading?: boolean;
}

const REASONS: { id: RiderFailReason; label: string; desc: string }[] = [
  {
    id: 'CUSTOMER_NOT_REACHABLE',
    label: 'Customer Unreachable',
    desc: 'Customer phone rang with no answer / switched off',
  },
  {
    id: 'CUSTOMER_REFUSED',
    label: 'Customer Refused Delivery',
    desc: 'Customer cancelled at doorstep or refused items',
  },
  {
    id: 'WRONG_ADDRESS',
    label: 'Wrong / Incomplete Address',
    desc: 'Location could not be found or incorrect house info',
  },
  {
    id: 'NOBODY_HOME',
    label: 'Nobody Available at Location',
    desc: 'House locked or recipient unavailable to receive',
  },
  {
    id: 'PAYMENT_PROBLEM',
    label: 'Payment / Cash Issue',
    desc: 'Insufficient cash in hand or mobile payment failure',
  },
  {
    id: 'OTHER',
    label: 'Other Delay / Emergency',
    desc: 'Severe weather, traffic roadblock or transport breakdown',
  },
];

export function DeliveryFailedModal({
  visible,
  onClose,
  onSubmit,
  loading = false,
}: DeliveryFailedModalProps) {
  const [selectedReason, setSelectedReason] = useState<RiderFailReason>('CUSTOMER_NOT_REACHABLE');
  const [note, setNote] = useState('');

  const handleConfirm = () => {
    haptics.warning();
    onSubmit(selectedReason, note.trim());
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Icon name="AlertTriangle" size={20} color="#dc2626" />
              <Text style={styles.headerTitle}>Record Delivery Failure</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="X" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.instruction}>
              Please select the exact reason why this delivery could not be completed:
            </Text>

            {/* Reasons List */}
            <View style={styles.reasonsList}>
              {REASONS.map((r) => {
                const isSelected = selectedReason === r.id;
                return (
                  <TouchableOpacity
                    key={r.id}
                    onPress={() => {
                      haptics.selection();
                      setSelectedReason(r.id);
                    }}
                    style={[styles.reasonItem, isSelected && styles.reasonItemActive]}
                    activeOpacity={0.7}
                  >
                    <Icon
                      name={isSelected ? 'CheckCircle2' : 'Circle'}
                      size={18}
                      color={isSelected ? '#dc2626' : '#9ca3af'}
                    />
                    <View style={styles.reasonTextWrap}>
                      <Text style={[styles.reasonLabel, isSelected && styles.reasonLabelActive]}>
                        {r.label}
                      </Text>
                      <Text style={styles.reasonDesc}>{r.desc}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Additional Note */}
            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Additional Notes (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Explain attempts made to reach customer..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                value={note}
                onChangeText={setNote}
                textAlignVertical="top"
              />
            </View>

            {/* Submit button */}
            <View style={styles.actionRow}>
              <Button
                title="Confirm Delivery Failed"
                variant="danger"
                size="lg"
                loading={loading}
                onPress={handleConfirm}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 20,
    gap: 16,
  },
  instruction: {
    fontSize: 13,
    color: '#475569',
  },
  reasonsList: {
    gap: 8,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    gap: 10,
  },
  reasonItemActive: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  reasonTextWrap: {
    flex: 1,
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  reasonLabelActive: {
    color: '#dc2626',
  },
  reasonDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  inputWrap: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    minHeight: 70,
  },
  actionRow: {
    marginTop: 4,
    marginBottom: 16,
  },
});

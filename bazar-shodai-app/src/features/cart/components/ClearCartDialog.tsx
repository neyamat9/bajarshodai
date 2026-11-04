import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Radius } from '@/constants/layout';
import { haptics } from '@/services/haptics';

export interface ClearCartDialogProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ClearCartDialog({ visible, onConfirm, onCancel }: ClearCartDialogProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Icon name="Trash2" size={24} color="#ef4444" />
          </View>

          <Text style={styles.title}>Clear Entire Bag?</Text>
          <Text style={styles.message}>
            Are you sure you want to remove all items from your shopping bag? This action cannot be
            undone.
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => {
                haptics.light();
                onCancel();
              }}
              style={styles.cancelBtn}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.cancelText}>Keep Items</Text>
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Button
                title="Clear Bag"
                variant="danger"
                size="md"
                onPress={() => {
                  haptics.warning();
                  onConfirm();
                }}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    color: '#6b7280',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    width: '100%',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    backgroundColor: '#f3f4f6',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
  },
});

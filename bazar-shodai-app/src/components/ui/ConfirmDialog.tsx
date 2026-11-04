import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Button } from './Button';
import { Radius, Shadows } from '@/constants/layout';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <TouchableOpacity activeOpacity={1} onPress={onCancel} style={StyleSheet.absoluteFill} />
        <View style={[styles.dialogCard, Shadows.lg]} className="bg-card border border-border">
          <Text className="text-base font-bold text-foreground mb-2">{title}</Text>
          <Text className="text-xs text-muted-foreground mb-6 leading-relaxed">{message}</Text>

          <View className="flex-row gap-3 justify-end">
            <Button title={cancelLabel} variant="outline" size="sm" onPress={onCancel} />
            <Button
              title={confirmLabel}
              variant={isDestructive ? 'danger' : 'primary'}
              size="sm"
              onPress={onConfirm}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: Radius.brand,
    padding: 20,
  },
});

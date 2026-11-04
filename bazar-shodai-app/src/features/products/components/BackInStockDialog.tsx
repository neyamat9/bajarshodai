import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, StyleSheet } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { api } from '@/api/client';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';
import { Radius } from '@/constants/layout';

export interface BackInStockDialogProps {
  visible: boolean;
  productId: string;
  productName: string;
  onClose: () => void;
}

export function BackInStockDialog({
  visible,
  productId,
  productName,
  onClose,
}: BackInStockDialogProps) {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async () => {
    const trimmed = emailOrPhone.trim();
    if (!trimmed) {
      toast.error('Required', 'Please enter your email or mobile phone');
      return;
    }

    try {
      setIsSubmitting(true);
      haptics.light();
      await api.post('/customer/back-in-stock', {
        productId,
        email: trimmed.includes('@') ? trimmed : undefined,
        phone: !trimmed.includes('@') ? trimmed : undefined,
      });

      haptics.success();
      toast.success(
        'Alert Subscribed!',
        `We will notify you as soon as ${productName} is back in stock.`,
      );
      onClose();
    } catch {
      toast.error('Subscription Failed', 'Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity activeOpacity={1} onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={styles.dialogCard} className="bg-card border border-border">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Icon name="BellRing" size={20} color="#0b6234" />
              <Text className="text-base font-bold text-foreground">Back in Stock Alert</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Icon name="X" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          <Text className="text-xs text-muted-foreground mb-4 leading-relaxed">
            <Text className="font-semibold text-foreground">{productName}</Text> is currently sold
            out. Leave your contact info and we&apos;ll alert you immediately when it arrives!
          </Text>

          <View className="mb-4">
            <Text className="text-xs font-semibold text-foreground mb-1.5">
              Email or Mobile Number
            </Text>
            <TextInput
              value={emailOrPhone}
              onChangeText={setEmailOrPhone}
              placeholder="e.g. 01712345678 or user@mail.com"
              placeholderTextColor="#94a3b8"
              className="p-3 rounded-brand border border-border bg-background text-sm text-foreground"
            />
          </View>

          <View className="flex-row gap-2 justify-end">
            <Button title="Cancel" variant="outline" size="sm" onPress={onClose} />
            <Button
              title="Notify Me"
              variant="primary"
              size="sm"
              loading={isSubmitting}
              onPress={handleSubscribe}
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
    backgroundColor: 'rgba(0,0,0,0.5)',
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

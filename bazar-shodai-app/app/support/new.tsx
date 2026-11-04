import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Radius } from '@/constants/layout';
import { useCreateTicket } from '@/features/support/api/supportApi';
import { useCustomerOrders } from '@/features/orders/api/ordersApi';
import { TicketCategory } from '@/features/support/types';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';

const CATEGORIES: { id: TicketCategory; label: string; desc: string }[] = [
  { id: 'ORDER', label: 'Order Issue', desc: 'Missing item, wrong items, or order status' },
  {
    id: 'DELIVERY',
    label: 'Delivery & Rider',
    desc: 'Late delivery, address finding or rider contact',
  },
  {
    id: 'PAYMENT',
    label: 'Payment & Billing',
    desc: 'bKash/Nagad issues, duplicate charge or refund',
  },
  {
    id: 'RETURN_WARRANTY',
    label: 'Return / Replacement',
    desc: 'Damaged fresh products or return pickup',
  },
  { id: 'PRODUCT', label: 'Product Quality', desc: 'Fish, meat or vegetable quality feedback' },
  { id: 'OTHER', label: 'General Inquiry', desc: 'Account or general assistance' },
];

export default function NewSupportTicketScreen() {
  const router = useRouter();
  const { data: customerOrders = [] } = useCustomerOrders();
  const { mutate: createTicket, isPending } = useCreateTicket();

  const [category, setCategory] = useState<TicketCategory>('ORDER');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (subject.trim().length < 3) {
      toast.error('Validation Error', 'Subject must be at least 3 characters long');
      return;
    }
    if (message.trim().length < 10) {
      toast.error('Validation Error', 'Please describe your problem in at least 10 characters');
      return;
    }

    createTicket(
      {
        category,
        orderId: selectedOrderId || undefined,
        subject: subject.trim(),
        message: message.trim(),
      },
      {
        onSuccess: (newTicket) => {
          haptics.success();
          toast.success('Ticket Created', 'Your support ticket has been opened.');
          router.replace(`/support/${newTicket.id}` as any);
        },
        onError: (err: unknown) => {
          haptics.error();
          const msg =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            'Failed to open support ticket';
          toast.error('Creation Failed', msg);
        },
      },
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
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
          <Text style={styles.headerTitle}>Open Support Ticket</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Category Selection */}
          <Text style={styles.sectionTitle}>1. Select Category</Text>
          <View style={styles.catGrid}>
            {CATEGORIES.map((c) => {
              const isSelected = category === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => {
                    haptics.selection();
                    setCategory(c.id);
                  }}
                  style={[styles.catCard, isSelected && styles.catCardActive]}
                  activeOpacity={0.7}
                >
                  <View style={styles.catHeader}>
                    <Icon
                      name={isSelected ? 'CheckCircle2' : 'Circle'}
                      size={16}
                      color={isSelected ? '#0b6234' : '#9ca3af'}
                    />
                    <Text style={[styles.catLabel, isSelected && styles.catLabelActive]}>
                      {c.label}
                    </Text>
                  </View>
                  <Text style={styles.catDesc}>{c.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Optional Order Selection */}
          {customerOrders.length > 0 && (
            <View style={styles.fieldSection}>
              <Text style={styles.sectionTitle}>2. Related Order (Optional)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.ordersScroll}
              >
                <TouchableOpacity
                  onPress={() => {
                    haptics.selection();
                    setSelectedOrderId('');
                  }}
                  style={[styles.orderChip, !selectedOrderId && styles.orderChipActive]}
                >
                  <Text
                    style={[styles.orderChipText, !selectedOrderId && styles.orderChipTextActive]}
                  >
                    None / Not Order Related
                  </Text>
                </TouchableOpacity>

                {customerOrders.slice(0, 5).map((ord) => {
                  const isSelected = selectedOrderId === ord.id;
                  return (
                    <TouchableOpacity
                      key={ord.id}
                      onPress={() => {
                        haptics.selection();
                        setSelectedOrderId(ord.id);
                      }}
                      style={[styles.orderChip, isSelected && styles.orderChipActive]}
                    >
                      <Text
                        style={[styles.orderChipText, isSelected && styles.orderChipTextActive]}
                      >
                        #{ord.orderNumber || ord.id.slice(0, 8)} (৳{ord.totalAmount})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Subject & Description */}
          <View style={styles.fieldSection}>
            <Text style={styles.sectionTitle}>3. Subject & Details</Text>
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Subject *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Summary of what you need help with"
                  placeholderTextColor="#9ca3af"
                  value={subject}
                  onChangeText={setSubject}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Detailed Description *</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Explain the problem in detail so our agents can resolve it immediately..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={5}
                  value={message}
                  onChangeText={setMessage}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <View style={styles.btnRow}>
            <Button
              title="Submit Support Ticket"
              variant="primary"
              size="lg"
              loading={isPending}
              onPress={handleSubmit}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  catGrid: {
    gap: 8,
  },
  catCard: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  catCardActive: {
    borderColor: '#0b6234',
    backgroundColor: '#f0fdf4',
  },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  catLabelActive: {
    color: '#0b6234',
  },
  catDesc: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 24,
    marginTop: 2,
  },
  fieldSection: {
    gap: 8,
  },
  ordersScroll: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  orderChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    marginRight: 8,
  },
  orderChipActive: {
    borderColor: '#0b6234',
    backgroundColor: '#f0fdf4',
  },
  orderChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  orderChipTextActive: {
    color: '#0b6234',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    minHeight: 100,
  },
  btnRow: {
    marginTop: 8,
  },
});

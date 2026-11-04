import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Radius } from '@/constants/layout';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';
import { useCustomerOrders, useOrderDetail } from '@/features/orders/api/ordersApi';
import { useCreateReturn } from '@/features/returns/api/returnsApi';
import { ReturnPhotoUploader } from '@/features/returns/components/ReturnPhotoUploader';
import { RefundMethodPicker } from '@/features/returns/components/RefundMethodPicker';
import { ReturnReason, RefundMethodType } from '@/features/returns/types';

const RETURN_REASONS: { id: ReturnReason; label: string; desc: string }[] = [
  {
    id: 'DEFECTIVE',
    label: 'Damaged or Spoiled',
    desc: 'Item is rotten, leaking, broken or stale',
  },
  {
    id: 'WRONG_ITEM',
    label: 'Wrong Item Delivered',
    desc: 'Received a different brand, weight or product',
  },
  {
    id: 'NOT_AS_DESCRIBED',
    label: 'Not as Described',
    desc: 'Product does not match photos or specifications',
  },
  {
    id: 'DAMAGED_IN_TRANSIT',
    label: 'Damaged in Transit',
    desc: 'Packaging torn, crushed or wet during ride',
  },
  {
    id: 'SIZE_ISSUE',
    label: 'Incorrect Weight or Size',
    desc: 'Item weighment was under expected amount',
  },
  { id: 'NO_LONGER_NEEDED', label: 'Changed Mind', desc: 'Item in original unopened state' },
];

export default function NewReturnClaimScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ orderId?: string }>();

  // Orders fetching
  const { data: customerOrders = [], isLoading: isLoadingOrders } = useCustomerOrders();
  const [selectedOrderId, setSelectedOrderId] = useState<string>(params.orderId || '');

  // Detail for currently selected order
  const { data: activeOrder, isLoading: isLoadingDetail } = useOrderDetail(selectedOrderId);

  // Form State
  const [selectedReason, setSelectedReason] = useState<ReturnReason>('DEFECTIVE');
  const [explanation, setExplanation] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [refundMethod, setRefundMethod] = useState<RefundMethodType>('BKASH');
  const [refundAccount, setRefundAccount] = useState('');
  const [evidenceImages, setEvidenceImages] = useState<string[]>([]);

  // Selected items with return quantities: Map orderItemId -> returnQuantity
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});

  const { mutate: submitReturn, isPending } = useCreateReturn();

  // Delivered/eligible orders to return
  const eligibleOrders = useMemo(() => {
    return customerOrders.filter((ord) => ord.status === 'DELIVERED');
  }, [customerOrders]);

  // Set default pickup address from active order
  React.useEffect(() => {
    if (activeOrder && activeOrder.shippingAddress && !pickupAddress) {
      const addr = activeOrder.shippingAddress;
      const addrStr = `${addr.address}${addr.city ? `, ${addr.city}` : ''}`.trim();
      Promise.resolve().then(() => {
        setPickupAddress(addrStr);
      });
    }
  }, [activeOrder, pickupAddress]);

  const handleToggleItem = (itemId: string, maxQty: number) => {
    haptics.selection();
    setItemQuantities((prev) => {
      const current = prev[itemId] || 0;
      if (current > 0) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: Math.min(1, maxQty) };
    });
  };

  const handleUpdateQty = (itemId: string, maxQty: number, delta: number) => {
    haptics.light();
    setItemQuantities((prev) => {
      const current = prev[itemId] || 0;
      const updated = current + delta;
      if (updated <= 0) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: Math.min(updated, maxQty) };
    });
  };

  const handleSubmit = () => {
    if (!selectedOrderId) {
      toast.error('Missing Order', 'Please select which order you want to claim a return for.');
      return;
    }

    const itemsToReturn = Object.entries(itemQuantities)
      .filter(([, qty]) => qty > 0)
      .map(([orderItemId, quantity]) => ({
        orderItemId,
        quantity,
      }));

    if (itemsToReturn.length === 0) {
      toast.error('No Items Selected', 'Please select at least one item from the order to return.');
      return;
    }

    if (!explanation.trim()) {
      toast.error('Explanation Required', 'Please describe the reason for return.');
      return;
    }

    if (refundMethod !== 'ORIGINAL_PAYMENT' && refundMethod !== 'WALLET' && !refundAccount.trim()) {
      toast.error(
        'Refund Account Required',
        'Please enter your account number to receive your refund.',
      );
      return;
    }

    submitReturn(
      {
        orderId: selectedOrderId,
        reason: selectedReason,
        detail: explanation.trim(),
        pickupAddress: pickupAddress.trim() || undefined,
        items: itemsToReturn,
        refundMethod,
        refundAccountNumber: refundAccount.trim() || undefined,
        evidenceImages,
      },
      {
        onSuccess: () => {
          haptics.success();
          toast.success(
            'Claim Submitted!',
            'Our customer care team will review your claim within 2-4 business hours.',
          );
          router.replace('/(account)/returns');
        },
        onError: (err: unknown) => {
          haptics.error();
          const msg =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            'Failed to submit return claim. Please try again.';
          toast.error('Submission Failed', msg);
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
          <Text style={styles.headerTitle}>New Return Claim</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Section: Select Order */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>1. Select Delivered Order</Text>
            {isLoadingOrders ? (
              <ActivityIndicator color="#0b6234" style={{ marginVertical: 12 }} />
            ) : eligibleOrders.length === 0 && !selectedOrderId ? (
              <Text style={styles.emptyOrderText}>
                No delivered orders found eligible for return.
              </Text>
            ) : (
              <View style={styles.ordersList}>
                {eligibleOrders.map((ord) => {
                  const isSelected = selectedOrderId === ord.id;
                  return (
                    <TouchableOpacity
                      key={ord.id}
                      onPress={() => {
                        haptics.selection();
                        setSelectedOrderId(ord.id);
                        setItemQuantities({});
                      }}
                      style={[styles.orderOption, isSelected && styles.orderOptionActive]}
                      activeOpacity={0.7}
                    >
                      <View style={styles.orderOptRow}>
                        <Icon
                          name={isSelected ? 'CheckCircle2' : 'Circle'}
                          size={18}
                          color={isSelected ? '#0b6234' : '#9ca3af'}
                        />
                        <View style={styles.orderOptInfo}>
                          <Text
                            style={[styles.orderOptNum, isSelected && styles.orderOptNumActive]}
                          >
                            Order #{ord.orderNumber || ord.id.slice(0, 8)}
                          </Text>
                          <Text style={styles.orderOptMeta}>
                            ৳{ord.totalAmount} • {new Date(ord.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Section: Select Items to Return */}
          {selectedOrderId ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>2. Items to Return</Text>
              {isLoadingDetail ? (
                <ActivityIndicator color="#0b6234" style={{ marginVertical: 12 }} />
              ) : activeOrder?.items && activeOrder.items.length > 0 ? (
                <View style={styles.itemsList}>
                  {activeOrder.items.map((it) => {
                    const isSelected = Boolean(itemQuantities[it.id]);
                    const currentQty = itemQuantities[it.id] || 0;

                    return (
                      <View key={it.id} style={styles.itemRow}>
                        <TouchableOpacity
                          onPress={() => handleToggleItem(it.id, it.quantity)}
                          style={styles.itemCheckbox}
                          activeOpacity={0.7}
                        >
                          <Icon
                            name={isSelected ? 'CheckSquare' : 'Square'}
                            size={20}
                            color={isSelected ? '#0b6234' : '#9ca3af'}
                          />
                          <View style={styles.itemLabelBox}>
                            <Text style={styles.itemName} numberOfLines={1}>
                              {it.productName || 'Product Item'}
                            </Text>
                            <Text style={styles.itemSub}>
                              Ordered: {it.quantity}x • ৳{it.unitPrice} each
                            </Text>
                          </View>
                        </TouchableOpacity>

                        {isSelected && (
                          <View style={styles.qtyBox}>
                            <TouchableOpacity
                              onPress={() => handleUpdateQty(it.id, it.quantity, -1)}
                              style={styles.qtyBtn}
                            >
                              <Icon name="Minus" size={14} color="#0b6234" />
                            </TouchableOpacity>
                            <Text style={styles.qtyNum}>{currentQty}</Text>
                            <TouchableOpacity
                              onPress={() => handleUpdateQty(it.id, it.quantity, 1)}
                              disabled={currentQty >= it.quantity}
                              style={[
                                styles.qtyBtn,
                                currentQty >= it.quantity && styles.qtyBtnDisabled,
                              ]}
                            >
                              <Icon
                                name="Plus"
                                size={14}
                                color={currentQty >= it.quantity ? '#d1d5db' : '#0b6234'}
                              />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.emptyOrderText}>No items found for this order.</Text>
              )}
            </View>
          ) : null}

          {/* Section: Reason for Return */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>3. Reason for Return</Text>
            <View style={styles.reasonsGrid}>
              {RETURN_REASONS.map((r) => {
                const isSelected = selectedReason === r.id;
                return (
                  <TouchableOpacity
                    key={r.id}
                    onPress={() => {
                      haptics.selection();
                      setSelectedReason(r.id);
                    }}
                    style={[styles.reasonCard, isSelected && styles.reasonCardActive]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.reasonHeader}>
                      <Icon
                        name={isSelected ? 'CheckCircle2' : 'Circle'}
                        size={16}
                        color={isSelected ? '#0b6234' : '#9ca3af'}
                      />
                      <Text style={[styles.reasonTitle, isSelected && styles.reasonTitleActive]}>
                        {r.label}
                      </Text>
                    </View>
                    <Text style={styles.reasonDesc}>{r.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Section: Problem Details */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>4. Detailed Description</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe what is wrong with the item(s)..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              value={explanation}
              onChangeText={setExplanation}
              textAlignVertical="top"
            />
          </View>

          {/* Section: Photo Proof */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>5. Photo Proof (Optional)</Text>
            <Text style={styles.helperText}>
              Upload up to 4 clear photos showing the damaged or incorrect item and its packaging.
            </Text>
            <ReturnPhotoUploader
              images={evidenceImages}
              onChangeImages={setEvidenceImages}
              maxImages={4}
            />
          </View>

          {/* Section: Pickup Address */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>6. Pickup Address</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Address where delivery agent can pick up return..."
              placeholderTextColor="#9ca3af"
              value={pickupAddress}
              onChangeText={setPickupAddress}
            />
          </View>

          {/* Section: Refund Method */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>7. Preferred Refund Channel</Text>
            <RefundMethodPicker
              selectedMethod={refundMethod}
              onSelectMethod={setRefundMethod}
              accountNumber={refundAccount}
              onChangeAccountNumber={setRefundAccount}
            />
          </View>

          {/* Action button */}
          <View style={styles.submitSection}>
            <Button
              variant="primary"
              size="lg"
              title="Submit Return Claim"
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
  card: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  emptyOrderText: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
  },
  ordersList: {
    gap: 8,
  },
  orderOption: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: Radius.md,
    padding: 12,
  },
  orderOptionActive: {
    borderColor: '#0b6234',
    backgroundColor: '#f0fdf4',
  },
  orderOptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  orderOptInfo: {
    flex: 1,
  },
  orderOptNum: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  orderOptNumActive: {
    color: '#0b6234',
  },
  orderOptMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  itemsList: {
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  itemCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  itemLabelBox: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  itemSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  qtyBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f1f5f9',
  },
  qtyBtnDisabled: {
    opacity: 0.4,
  },
  qtyNum: {
    paddingHorizontal: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  reasonsGrid: {
    gap: 8,
  },
  reasonCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: Radius.md,
    padding: 12,
  },
  reasonCardActive: {
    borderColor: '#0b6234',
    backgroundColor: '#f0fdf4',
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reasonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  reasonTitleActive: {
    color: '#0b6234',
  },
  reasonDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    marginLeft: 24,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: Radius.md,
    padding: 12,
    fontSize: 14,
    color: '#0f172a',
    minHeight: 90,
  },
  helperText: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  submitSection: {
    marginTop: 8,
  },
});

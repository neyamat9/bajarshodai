import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Radius } from '@/constants/layout';
import { useRiderDeliveryDetail, useUpdateDeliveryStatus } from '@/features/rider/api/riderApi';
import { DeliveryFailedModal } from '@/features/rider/components/DeliveryFailedModal';
import { RiderDeliveryStatus, RiderFailReason } from '@/features/rider/types';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';

export default function RiderOrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: delivery, isLoading, refetch } = useRiderDeliveryDetail(id || '');
  const { acceptMutation, pickedUpMutation, onTheWayMutation, completeMutation, failMutation } =
    useUpdateDeliveryStatus();

  const [showFailedModal, setShowFailedModal] = useState(false);
  const [cashCollectedInput, setCashCollectedInput] = useState<string>('');
  const [notes, setNotes] = useState('');

  if (isLoading || !delivery) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Icon name="ArrowLeft" size={22} color="#0b6234" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Delivery Order</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color="#0b6234" />
        </View>
      </SafeAreaView>
    );
  }

  const order = delivery.order;
  const isCOD = order.paymentMethod === 'COD';
  const cashDue = isCOD ? order.totalAmount : 0;
  const customerPhone = order.shippingAddress?.phone;
  const address = order.shippingAddress;

  const getStatusBadgeVariant = (status: RiderDeliveryStatus): BadgeVariant => {
    switch (status) {
      case 'DELIVERED':
        return 'fresh';
      case 'ON_THE_WAY':
        return 'fish';
      case 'PICKED_UP':
      case 'ACCEPTED':
        return 'carrot';
      case 'FAILED':
      case 'CANCELLED':
        return 'tomato';
      case 'ASSIGNED':
      default:
        return 'neutral';
    }
  };

  const handleCallCustomer = () => {
    if (!customerPhone) {
      toast.error('No Phone', 'No customer contact number available');
      return;
    }
    haptics.selection();
    Linking.openURL(`tel:${customerPhone}`).catch(() => {
      toast.error('Call Error', 'Could not open phone dialer');
    });
  };

  const handleOpenMaps = () => {
    haptics.selection();
    const lat = address?.latitude;
    const lng = address?.longitude;
    const addrQuery = encodeURIComponent(
      `${address?.address || ''}, ${address?.city || ''}, Bangladesh`,
    );

    const url =
      lat && lng
        ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
        : `https://www.google.com/maps/search/?api=1&query=${addrQuery}`;

    Linking.openURL(url).catch(() => {
      toast.error('Navigation Error', 'Could not launch Google Maps');
    });
  };

  const handleStepAccept = () => {
    haptics.selection();
    acceptMutation.mutate(delivery.id, {
      onSuccess: () => {
        haptics.success();
        toast.success('Accepted', 'Delivery assigned to you');
        void refetch();
      },
    });
  };

  const handleStepPickedUp = () => {
    haptics.selection();
    pickedUpMutation.mutate(
      { id: delivery.id, note: notes || undefined },
      {
        onSuccess: () => {
          haptics.success();
          toast.success('Picked Up', 'Order collected from shop');
          void refetch();
        },
      },
    );
  };

  const handleStepOnTheWay = () => {
    haptics.selection();
    onTheWayMutation.mutate(
      { id: delivery.id, note: notes || undefined },
      {
        onSuccess: () => {
          haptics.success();
          toast.success('On The Way', 'Customer notified of departure');
          void refetch();
        },
      },
    );
  };

  const handleStepComplete = () => {
    haptics.success();
    const collected = isCOD ? (cashCollectedInput ? parseFloat(cashCollectedInput) : cashDue) : 0;

    completeMutation.mutate(
      {
        id: delivery.id,
        cashCollected: collected,
        note: notes || undefined,
      },
      {
        onSuccess: () => {
          haptics.success();
          toast.success('Delivered!', 'Delivery marked as complete');
          router.replace('/(rider)/deliveries');
        },
        onError: () => {
          toast.error('Error', 'Failed to update delivery');
        },
      },
    );
  };

  const handleStepFailed = (reason: RiderFailReason, failNote: string) => {
    failMutation.mutate(
      {
        id: delivery.id,
        reason,
        note: failNote,
      },
      {
        onSuccess: () => {
          setShowFailedModal(false);
          haptics.warning();
          toast.info('Delivery Failed', 'Marked as failed. Shop management notified.');
          router.replace('/(rider)/deliveries');
        },
        onError: () => {
          toast.error('Error', 'Failed to record failure status');
        },
      },
    );
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
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Order #{order.orderNumber || order.id.slice(0, 8)}</Text>
        </View>
        <Badge
          label={delivery.status.replace('_', ' ')}
          variant={getStatusBadgeVariant(delivery.status)}
          size="sm"
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Customer & Call Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>Customer Contact</Text>
          <View style={styles.customerRow}>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{address?.fullName || 'Customer'}</Text>
              <Text style={styles.customerPhone}>{customerPhone || 'No number'}</Text>
            </View>
            <TouchableOpacity
              onPress={handleCallCustomer}
              style={styles.callBtn}
              activeOpacity={0.8}
            >
              <Icon name="PhoneCall" size={18} color="#ffffff" />
              <Text style={styles.callBtnText}>Call</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Address & Navigation Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeaderTitle}>Delivery Destination</Text>
            <TouchableOpacity onPress={handleOpenMaps} style={styles.navLink}>
              <Icon name="Navigation" size={14} color="#0b6234" />
              <Text style={styles.navLinkText}>Google Maps</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.addressText}>{address?.address}</Text>
          {address?.city && <Text style={styles.cityText}>{address.city}</Text>}

          <Button
            title="Start Turn-by-Turn Navigation"
            variant="outline"
            size="sm"
            onPress={handleOpenMaps}
            style={{ marginTop: 10 }}
          />
        </View>

        {/* Payment & Cash Collection Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>Payment Information</Text>
          <View style={styles.paymentInfoRow}>
            <Text style={styles.paymentMethodLabel}>
              Method: <Text style={{ fontWeight: '700' }}>{order.paymentMethod}</Text>
            </Text>
            <Badge
              label={isCOD ? `Cash Due: ৳${cashDue}` : 'Prepaid (Paid)'}
              variant={isCOD ? 'carrot' : 'fresh'}
              size="md"
            />
          </View>

          {isCOD && delivery.status === 'ON_THE_WAY' && (
            <View style={styles.cashInputWrap}>
              <Text style={styles.cashInputLabel}>Cash Collected Amount (৳)</Text>
              <TextInput
                style={styles.cashInput}
                keyboardType="numeric"
                placeholder={String(cashDue)}
                placeholderTextColor="#9ca3af"
                value={cashCollectedInput}
                onChangeText={setCashCollectedInput}
              />
            </View>
          )}
        </View>

        {/* Parcel Items */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>Parcel Items ({order.items?.length || 0})</Text>
          <View style={styles.itemsList}>
            {order.items?.map((it) => (
              <View key={it.id} style={styles.itemRow}>
                <View style={styles.itemQtyBadge}>
                  <Text style={styles.itemQtyText}>{it.quantity}x</Text>
                </View>
                <Text style={styles.itemName} numberOfLines={1}>
                  {it.productName}
                </Text>
                <Text style={styles.itemPrice}>৳{it.unitPrice * it.quantity}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Delivery Note Input */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>Delivery Note (Optional)</Text>
          <TextInput
            style={styles.cashInput}
            placeholder="e.g. Handed to security guard"
            placeholderTextColor="#9ca3af"
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Action Controls */}
        <View style={styles.actionControls}>
          {delivery.status === 'ASSIGNED' && (
            <Button
              title="Accept Delivery"
              variant="primary"
              size="lg"
              loading={acceptMutation.isPending}
              onPress={handleStepAccept}
            />
          )}

          {delivery.status === 'ACCEPTED' && (
            <Button
              title="Confirm Picked Up from Shop"
              variant="primary"
              size="lg"
              loading={pickedUpMutation.isPending}
              onPress={handleStepPickedUp}
            />
          )}

          {delivery.status === 'PICKED_UP' && (
            <Button
              title="Depart to Customer (On The Way)"
              variant="primary"
              size="lg"
              loading={onTheWayMutation.isPending}
              onPress={handleStepOnTheWay}
            />
          )}

          {delivery.status === 'ON_THE_WAY' && (
            <View style={styles.twoBtnRow}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Delivered"
                  variant="primary"
                  size="lg"
                  loading={completeMutation.isPending}
                  onPress={handleStepComplete}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="Delivery Failed"
                  variant="danger"
                  size="lg"
                  onPress={() => setShowFailedModal(true)}
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Failure Reason Modal */}
      <DeliveryFailedModal
        visible={showFailedModal}
        loading={failMutation.isPending}
        onClose={() => setShowFailedModal(false)}
        onSubmit={handleStepFailed}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  loaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  customerPhone: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0b6234',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    gap: 6,
  },
  callBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  navLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0b6234',
  },
  addressText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  cityText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  paymentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentMethodLabel: {
    fontSize: 14,
    color: '#334155',
  },
  cashInputWrap: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 6,
  },
  cashInputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  cashInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  itemsList: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  itemQtyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    backgroundColor: '#f0fdf4',
    marginRight: 8,
  },
  itemQtyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0b6234',
  },
  itemName: {
    flex: 1,
    fontSize: 13,
    color: '#1e293b',
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  actionControls: {
    marginTop: 8,
  },
  twoBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
});

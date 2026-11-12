import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { toast } from '@/store/useToastStore';
import { Icon } from '@/components/ui/Icon';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { Price } from '@/components/ui/Price';
import { Button } from '@/components/ui/Button';
import { Radius } from '@/constants/layout';
import { haptics } from '@/services/haptics';
import { useOrderDetail } from '@/features/orders/api/ordersApi';
import { CustomerOrderRecord, OrderStatus } from '@/features/orders/types';
import { LiveDeliveryMap } from '@/features/orders/components/LiveDeliveryMap';
import { CancelOrderDialog } from '@/features/orders/components/CancelOrderDialog';
import { OrderInvoiceButton } from '@/features/orders/components/OrderInvoiceButton';
import { executeReorder } from '@/features/orders/api/reorder';
import { formatDeliveryWindow } from '@/utils/format';
import { useTranslation } from '@/i18n';

interface StepMilestone {
  key: OrderStatus;
  title: string;
  titleBn: string;
  description: string;
}

const TIMELINE_STEPS: StepMilestone[] = [
  {
    key: 'PENDING',
    title: 'Order Placed',
    titleBn: 'অর্ডার গৃহীত হয়েছে',
    description: 'We have received your order and sent confirmation.',
  },
  {
    key: 'CONFIRMED',
    title: 'Order Confirmed',
    titleBn: 'অর্ডার নিশ্চিত হয়েছে',
    description: 'Our team verified the items and stock availability.',
  },
  {
    key: 'PROCESSING',
    title: 'Processing & Sorting',
    titleBn: 'প্রস্তুতকরণ শুরু হয়েছে',
    description: 'Fresh farm produce is being sorted and inspected.',
  },
  {
    key: 'PACKED',
    title: 'Packed & Bagged',
    titleBn: 'প্যাকেজিং সম্পন্ন',
    description: 'Hygienically packed in temperature-controlled bag.',
  },
  {
    key: 'OUT_FOR_DELIVERY',
    title: 'Out for Delivery',
    titleBn: 'ডেলিভারিম্যান বের হয়েছে',
    description: 'Your assigned courier is on the road to your location.',
  },
  {
    key: 'DELIVERED',
    title: 'Delivered',
    titleBn: 'ডেলিভারি সম্পন্ন',
    description: 'Package handed over successfully. Enjoy your groceries!',
  },
];

const ORDER_STATUS_ORDER: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'PACKED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

export default function OrderDetailScreen() {
  const router = useRouter();
  const { isBn } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = typeof id === 'string' ? id : '';

  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { data: serverOrder, isLoading, refetch } = useOrderDetail(orderId);

  const getStatusBadgeVariant = (status: OrderStatus): BadgeVariant => {
    switch (status) {
      case 'DELIVERED':
        return 'fresh';
      case 'OUT_FOR_DELIVERY':
        return 'fish';
      case 'CANCELLED':
        return 'tomato';
      case 'PROCESSING':
      case 'PACKED':
      case 'CONFIRMED':
      case 'PENDING':
      default:
        return 'carrot';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0b6234" />
        <Text style={styles.loadingText}>Loading order status...</Text>
      </SafeAreaView>
    );
  }

  if (!serverOrder) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Icon name="ArrowLeft" size={22} color="#0b6234" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Icon name="Package" size={56} color="#94a3b8" />
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1e293b', marginTop: 16 }}>
            অর্ডারটি পাওয়া যায়নি
          </Text>
          <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 8, marginBottom: 24 }}>
            এই অর্ডার নম্বরে কোনো তথ্য খুঁজে পাওয়া যায়নি অথবা আপনি লগইন করেননি।
          </Text>
          <Button
            title="সকল অর্ডার দেখুন"
            onPress={() => router.replace('/(account)/orders')}
            variant="primary"
          />
        </View>
      </SafeAreaView>
    );
  }

  const order: CustomerOrderRecord = serverOrder;
  const currentStepIndex = ORDER_STATUS_ORDER.indexOf(order.status);
  const isCancelled = order.status === 'CANCELLED';
  const canCancel = order.status === 'PENDING' || order.status === 'CONFIRMED';
  const isOutForDelivery = order.status === 'OUT_FOR_DELIVERY';

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Icon name="ArrowLeft" size={22} color="#0b6234" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order.orderNumber}</Text>
        <OrderInvoiceButton orderId={order.id} orderNumber={order.orderNumber} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Summary Banner */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View>
              <Text style={styles.statusLabel}>Order Status</Text>
              <Text style={styles.statusText}>{order.status.replace(/_/g, ' ')}</Text>
            </View>
            <Badge
              label={order.status.replace(/_/g, ' ')}
              variant={getStatusBadgeVariant(order.status)}
              size="md"
            />
          </View>

          <Text style={styles.orderDateText}>
            Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
            {new Date(order.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>

          {/* Estimated Delivery Time Window */}
          {formatDeliveryWindow(order.estimatedDelivery, order.deliverySlot, isBn ? 'bn' : 'en') ? (
            <View style={styles.deliveryEstimateBanner}>
              <Icon name="Clock" size={16} color="#0b6234" />
              <View style={{ flex: 1 }}>
                <Text style={styles.deliveryEstimateLabel}>
                  {isBn ? 'সম্ভাব্য ডেলিভারি সময়' : 'Estimated Delivery Time'}
                </Text>
                <Text style={styles.deliveryEstimateValue}>
                  {formatDeliveryWindow(order.estimatedDelivery, order.deliverySlot, isBn ? 'bn' : 'en')}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Live Delivery Map & Rider Contact (if out for delivery) */}
        <LiveDeliveryMap
          rider={order.rider}
          destinationAddress={order.shippingAddress.address}
          isOutForDelivery={isOutForDelivery}
        />

        {/* 7-Step Timeline Stepper */}
        {!isCancelled && (
          <View style={styles.timelineCard}>
            <Text style={styles.cardHeaderTitle}>Delivery Progression Timeline</Text>

            <View style={styles.stepperContainer}>
              {TIMELINE_STEPS.map((step, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <View key={step.key} style={styles.stepRow}>
                    {/* Left node & connector line */}
                    <View style={styles.nodeColumn}>
                      <View
                        style={[
                          styles.nodeCircle,
                          isPassed && styles.nodeCirclePassed,
                          isCurrent && styles.nodeCircleCurrent,
                        ]}
                      >
                        {isPassed ? (
                          <Icon name="Check" size={12} color="#ffffff" />
                        ) : (
                          <View style={styles.nodeDot} />
                        )}
                      </View>
                      {idx < TIMELINE_STEPS.length - 1 && (
                        <View
                          style={[
                            styles.connectorLine,
                            currentStepIndex > idx && styles.connectorLineActive,
                          ]}
                        />
                      )}
                    </View>

                    {/* Step description */}
                    <View style={styles.stepInfoCol}>
                      <Text style={[styles.stepTitle, isPassed && styles.stepTitlePassed]}>
                        {step.title} <Text style={styles.stepTitleBn}>({step.titleBn})</Text>
                      </Text>
                      <Text style={styles.stepDesc}>{step.description}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Cancelled Banner */}
        {isCancelled && (
          <View style={styles.cancelledBanner}>
            <Icon name="AlertTriangle" size={20} color="#dc2626" />
            <View style={{ flex: 1 }}>
              <Text style={styles.cancelledTitle}>This order has been cancelled</Text>
              <Text style={styles.cancelledDesc}>
                No charges were deducted. You can re-order any item with 1 tap below.
              </Text>
            </View>
          </View>
        )}

        {/* Dynamic Family Location Sharing Card */}
        {(order.deliveryFeePending || (order.locationToken && !order.shippingAddress.latitude)) && (
          <View style={styles.familyShareCard}>
            <View style={styles.familyShareHeader}>
              <View style={styles.familyShareIconCircle}>
                <Icon name="MapPin" size={18} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={styles.familyShareTitle}>
                    {isBn ? 'ডেলিভারি লোকেশন এখনও নিশ্চিত করা হয়নি' : 'Delivery Location Needed'}
                  </Text>
                  <View style={styles.feePendingBadge}>
                    <Text style={styles.feePendingText}>
                      {isBn ? 'ফি যাচাই সাপেক্ষে' : 'Fee Pending'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.familyShareDesc}>
                  {order.isAbroadOrder
                    ? (isBn
                        ? 'আপনার বাংলাদেশে থাকা পরিবারের সাথে (যেমন: স্ত্রী, বাবা-মা) এই লিংকটি শেয়ার করুন, যাতে তারা এক ক্লিকেই সঠিক ডেলিভারি লোকেশন শেয়ার করতে পারেন।'
                        : 'Share this link with your family member (e.g. wife, parents) in Bangladesh so they can tap once to pin the exact delivery door.')
                    : (isBn
                        ? 'আপনার পরিবারের সাথে এই লিংকটি শেয়ার করুন অথবা নিচের বাটনে ক্লিক করে আপনার ডেলিভারি লোকেশন যুক্ত করুন।'
                        : 'Share this link with your family member so they can tap once to pin the exact delivery door, or tap below to share your location.')}
                </Text>
              </View>
            </View>

            {order.locationToken && (
              <View style={styles.familyShareActions}>
                <TouchableOpacity
                  style={styles.urlCopyBox}
                  onPress={async () => {
                    const url = `https://bazarshodai.com/l/${order.locationToken}`;
                    await Clipboard.setStringAsync(url);
                    haptics.success();
                    toast.success(
                      isBn ? 'লিংক কপি করা হয়েছে' : 'Link Copied',
                      isBn ? 'পরিবারের সাথে লিংকটি শেয়ার করুন' : 'Share this link with your family'
                    );
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.urlCopyText} numberOfLines={1}>
                    https://bazarshodai.com/l/{order.locationToken}
                  </Text>
                  <View style={styles.copyPill}>
                    <Icon name="Copy" size={12} color="#0b6234" />
                    <Text style={styles.copyPillText}>{isBn ? 'কপি' : 'Copy'}</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.shareBtnRow}>
                  <TouchableOpacity
                    style={styles.whatsappBtn}
                    onPress={() => {
                      const shareUrl = `https://bazarshodai.com/l/${order.locationToken}`;
                      const text = isBn
                        ? `আসসালামু আলাইকুম, বাজার সদাই থেকে অর্ডারের (${order.orderNumber}) সঠিক ডেলিভারির জন্য অনুগ্রহ করে এই লিংকে ক্লিক করে বাসার লোকেশন পিন করুন: ${shareUrl}`
                        : `Hello! Please click this link to pin our exact delivery location for our Bazar Shodai order (${order.orderNumber}): ${shareUrl}`;
                      const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
                      Linking.canOpenURL(url).then((supported) => {
                        if (supported) {
                          Linking.openURL(url);
                        } else {
                          Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`);
                        }
                      });
                    }}
                    activeOpacity={0.8}
                  >
                    <Icon name="MessageCircle" size={15} color="#ffffff" />
                    <Text style={styles.whatsappBtnText}>
                      {isBn ? 'হোয়াটসঅ্যাপে পাঠান' : 'Send via WhatsApp'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.pinNowBtn}
                    onPress={() => Linking.openURL(`https://bazarshodai.com/l/${order.locationToken}`)}
                    activeOpacity={0.8}
                  >
                    <Icon name="Navigation" size={14} color="#0b6234" />
                    <Text style={styles.pinNowBtnText}>
                      {isBn ? 'নিজে পিন দিন' : 'Pin Location'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Delivery Address Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeaderRow}>
            <Icon name="MapPin" size={16} color="#0b6234" />
            <Text style={styles.cardHeaderTitle}>Delivery Destination</Text>
          </View>
          <Text style={styles.recipientName}>{order.shippingAddress.fullName}</Text>
          <Text style={styles.recipientPhone}>{order.shippingAddress.phone}</Text>
          <Text style={styles.recipientAddress}>{order.shippingAddress.address}</Text>
          {formatDeliveryWindow(order.estimatedDelivery, order.deliverySlot, isBn ? 'bn' : 'en') ? (
            <View style={styles.slotInAddressRow}>
              <Icon name="Clock" size={13} color="#0b6234" />
              <Text style={styles.slotInAddressText}>
                {formatDeliveryWindow(order.estimatedDelivery, order.deliverySlot, isBn ? 'bn' : 'en')}
              </Text>
            </View>
          ) : null}

          {order.isAbroadOrder && (
            <View style={styles.abroadRecipientCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name="Globe" size={14} color="#0369a1" />
                <Text style={styles.abroadRecipientTitle}>
                  {isBn ? 'প্রবাসী ক্রেতার তথ্য' : 'Overseas Buyer Details'}
                </Text>
              </View>
              {order.senderCountry && (
                <Text style={styles.abroadRecipientText}>
                  {isBn ? 'দেশ' : 'Country'}: <Text style={{ fontWeight: '700' }}>{order.senderCountry}</Text>
                </Text>
              )}
              {order.senderContactNumber && (
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}
                  onPress={() => {
                    const clean = order.senderContactNumber!.replace(/[^0-9+]/g, '');
                    Linking.openURL(`https://wa.me/${clean.replace(/^\+/, '')}`);
                  }}
                >
                  <Icon name="MessageCircle" size={13} color="#059669" />
                  <Text style={styles.abroadRecipientLink}>
                    {order.senderContactMethod || 'WhatsApp'}: {order.senderContactNumber}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Order Items Breakdown */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeaderRow}>
            <Icon name="ShoppingBag" size={16} color="#0b6234" />
            <Text style={styles.cardHeaderTitle}>
              Items in this Order ({order.items?.length || 0})
            </Text>
          </View>

          {order.items?.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.itemProductName}>{item.productName}</Text>
                {item.productNameBn && (
                  <Text style={styles.itemProductNameBn}>{item.productNameBn}</Text>
                )}
                <Text style={styles.itemUnitDetails}>
                  {item.quantity} {item.unit || 'unit'} x ৳{item.unitPrice}
                </Text>
              </View>
              <Price amount={item.totalPrice} size="sm" />
            </View>
          ))}
        </View>

        {/* Payment Summary */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeaderRow}>
            <Icon name="Receipt" size={16} color="#0b6234" />
            <Text style={styles.cardHeaderTitle}>Payment Summary</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Price amount={order.subtotal} size="sm" />
          </View>

          {order.discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.discountLabel}>Discount / Coupon</Text>
              <Text style={styles.discountValue}>-৳{order.discountAmount.toFixed(0)}</Text>
            </View>
          )}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            {order.deliveryFeePending ? (
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#d97706' }}>
                দোকান থেকে যাচাই সাপেক্ষে
              </Text>
            ) : order.deliveryFee === 0 ? (
              <Text style={styles.freeText}>FREE</Text>
            ) : (
              <Price amount={order.deliveryFee} size="sm" />
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Price amount={order.totalAmount} size="lg" />
          </View>

          <View style={styles.methodRow}>
            <Text style={styles.methodLabel}>Payment Method:</Text>
            <Text style={styles.methodValue}>
              {order.paymentMethod === 'CASH_ON_DELIVERY'
                ? 'Cash on Delivery'
                : order.paymentMethod}
            </Text>
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <Button
            title="Re-order All Items"
            variant="primary"
            size="lg"
            onPress={() => executeReorder(order, () => router.push('/(tabs)/cart'))}
            leftIcon={<Icon name="RotateCcw" size={18} color="#ffffff" />}
          />

          {canCancel && (
            <Button
              title="Cancel Order"
              variant="danger"
              size="md"
              onPress={() => setShowCancelDialog(true)}
              leftIcon={<Icon name="XCircle" size={16} color="#ef4444" />}
            />
          )}
        </View>
      </ScrollView>

      {/* Cancel Order Dialog */}
      <CancelOrderDialog
        visible={showCancelDialog}
        orderId={order.id}
        orderNumber={order.orderNumber}
        onClose={() => setShowCancelDialog(false)}
        onSuccess={() => {
          void refetch();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
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
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    gap: 6,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2,
  },
  orderDateText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  deliveryEstimateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: Radius.sm,
    padding: 10,
    marginTop: 8,
  },
  deliveryEstimateLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
    textTransform: 'uppercase',
  },
  deliveryEstimateValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0b6234',
    marginTop: 2,
  },
  slotInAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    borderRadius: Radius.xs,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#dcfce7',
    alignSelf: 'flex-start',
  },
  slotInAddressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0b6234',
  },
  timelineCard: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    gap: 14,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  stepperContainer: {
    marginTop: 4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  nodeColumn: {
    alignItems: 'center',
    width: 24,
  },
  nodeCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeCirclePassed: {
    backgroundColor: '#059669',
  },
  nodeCircleCurrent: {
    backgroundColor: '#0b6234',
    transform: [{ scale: 1.15 }],
  },
  nodeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9ca3af',
  },
  connectorLine: {
    width: 2,
    height: 38,
    backgroundColor: '#e5e7eb',
    marginVertical: 2,
  },
  connectorLineActive: {
    backgroundColor: '#059669',
  },
  stepInfoCol: {
    flex: 1,
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  stepTitlePassed: {
    color: '#111827',
    fontWeight: '700',
  },
  stepTitleBn: {
    fontSize: 11,
    fontWeight: '500',
  },
  stepDesc: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
    lineHeight: 15,
  },
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: Radius.md,
    padding: 14,
  },
  cancelledTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#dc2626',
  },
  cancelledDesc: {
    fontSize: 11,
    color: '#991b1b',
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    gap: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  recipientName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  recipientPhone: {
    fontSize: 12,
    color: '#4b5563',
  },
  recipientAddress: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 17,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemProductName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  itemProductNameBn: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 1,
  },
  itemUnitDetails: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  discountLabel: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  discountValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  freeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  methodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  methodLabel: {
    fontSize: 11,
    color: '#9ca3af',
  },
  methodValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  bottomActions: {
    gap: 10,
    marginTop: 6,
  },
  familyShareCard: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1.5,
    borderColor: '#6ee7b7',
    borderRadius: Radius.lg,
    padding: 16,
    gap: 12,
  },
  familyShareHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  familyShareIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  familyShareTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065f46',
  },
  feePendingBadge: {
    backgroundColor: '#fef3c7',
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  feePendingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b45309',
  },
  familyShareDesc: {
    fontSize: 12,
    color: '#047857',
    marginTop: 4,
    lineHeight: 18,
  },
  familyShareActions: {
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#a7f3d0',
  },
  urlCopyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
  },
  urlCopyText: {
    flex: 1,
    fontSize: 11,
    color: '#4b5563',
    fontFamily: 'monospace',
  },
  copyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  copyPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0b6234',
  },
  shareBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  whatsappBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    borderRadius: Radius.md,
    paddingVertical: 10,
  },
  whatsappBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  pinNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#059669',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pinNowBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  abroadRecipientCard: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: Radius.md,
    gap: 3,
  },
  abroadRecipientTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369a1',
  },
  abroadRecipientText: {
    fontSize: 11,
    color: '#334155',
  },
  abroadRecipientLink: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700',
  },
});

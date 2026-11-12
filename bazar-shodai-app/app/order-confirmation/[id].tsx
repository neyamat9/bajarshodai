import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Radius } from '@/constants/layout';
import { haptics } from '@/services/haptics';
import { toast } from '@/store/useToastStore';
import { useOrderDetail } from '@/features/orders/api/ordersApi';
import { useTranslation } from '@/i18n';

export default function OrderConfirmationScreen() {
  const router = useRouter();
  const { isBn } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = typeof id === 'string' ? id : 'ORD-SUCCESS';

  const { data: order } = useOrderDetail(orderId);

  useEffect(() => {
    haptics.success();
  }, []);

  const shareUrl = order?.locationToken
    ? `https://bazarshodai.com/l/${order.locationToken}`
    : `https://bazarshodai.com/orders/${orderId}`;

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(shareUrl);
    haptics.success();
    toast.success(
      isBn ? 'লিংক কপি করা হয়েছে' : 'Link Copied',
      isBn ? 'পরিবারের সাথে লিংকটি শেয়ার করুন' : 'Share this link with your family'
    );
  };

  const handleShareWhatsApp = () => {
    const text = isBn
      ? `আসসালামু আলাইকুম, বাজার সদাই থেকে অর্ডারের (${order?.orderNumber || orderId}) সঠিক ডেলিভারির জন্য অনুগ্রহ করে এই লিংকে ক্লিক করে বাসার লোকেশন পিন করুন: ${shareUrl}`
      : `Hello! Please click this link to pin our exact delivery location for our Bazar Shodai order (${order?.orderNumber || orderId}): ${shareUrl}`;
    const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`);
      }
    });
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Celebration Circle */}
        <View style={styles.iconCircle}>
          <Icon name="CheckCircle" size={64} color="#059669" />
        </View>

        <Text style={styles.title}>Thank You!</Text>
        <Text style={styles.banglaTitle}>আপনার অর্ডার সফলভাবে গৃহীত হয়েছে</Text>

        <View style={styles.orderNumberCard}>
          <Text style={styles.orderNumberLabel}>Order Reference</Text>
          <Text style={styles.orderNumberText}>#{order?.orderNumber || orderId}</Text>
          <Badge label="ORDER PLACED" variant="fresh" size="sm" />
        </View>

        {/* Dynamic Family Location Sharing Card */}
        {(order?.deliveryFeePending || (order?.locationToken && !order?.shippingAddress?.latitude)) && (
          <View style={styles.familyShareCard}>
            <View style={styles.familyShareHeader}>
              <View style={styles.familyShareIconCircle}>
                <Icon name="MapPin" size={20} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={styles.familyShareTitle}>
                    {isBn ? 'ডেলিভারি লোকেশন বাকি আছে' : 'Delivery Location Needed'}
                  </Text>
                  <View style={styles.feePendingBadge}>
                    <Text style={styles.feePendingText}>
                      {isBn ? 'ফি যাচাই সাপেক্ষে' : 'Fee Pending'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.familyShareDesc}>
                  {order?.isAbroadOrder
                    ? (isBn
                        ? 'আপনার বাংলাদেশে থাকা পরিবারের সাথে (যেমন: স্ত্রী, বাবা-মা) এই লিংকটি শেয়ার করুন, যাতে তারা এক ক্লিকেই সঠিক ডেলিভারি লোকেশন শেয়ার করতে পারেন।'
                        : 'Share this link with your family member (e.g. wife, parents) in Bangladesh so they can tap once to pin the exact delivery door.')
                    : (isBn
                        ? 'আপনার পরিবারের সাথে এই লিংকটি শেয়ার করুন অথবা নিচের বাটনে ক্লিক করে আপনার ডেলিভারি লোকেশন যুক্ত করুন।'
                        : 'Share this link with your family member so they can tap once to pin the exact delivery door, or tap below to share your location.')}
                </Text>
              </View>
            </View>

            {order?.locationToken && (
              <View style={styles.familyShareActions}>
                <TouchableOpacity
                  style={styles.urlCopyBox}
                  onPress={handleCopyLink}
                  activeOpacity={0.8}
                >
                  <Text style={styles.urlCopyText} numberOfLines={1}>
                    {shareUrl}
                  </Text>
                  <View style={styles.copyPill}>
                    <Icon name="Copy" size={13} color="#0b6234" />
                    <Text style={styles.copyPillText}>{isBn ? 'কপি' : 'Copy'}</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.shareBtnRow}>
                  <TouchableOpacity
                    style={styles.whatsappBtn}
                    onPress={handleShareWhatsApp}
                    activeOpacity={0.8}
                  >
                    <Icon name="MessageCircle" size={16} color="#ffffff" />
                    <Text style={styles.whatsappBtnText}>
                      {isBn ? 'হোয়াটসঅ্যাপে পাঠান' : 'Send via WhatsApp'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.pinNowBtn}
                    onPress={() => Linking.openURL(shareUrl)}
                    activeOpacity={0.8}
                  >
                    <Icon name="Navigation" size={15} color="#0b6234" />
                    <Text style={styles.pinNowBtnText}>
                      {isBn ? 'নিজে পিন দিন' : 'Pin Location'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        <View style={styles.timelineBox}>
          <View style={styles.timelineRow}>
            <Icon name="Truck" size={18} color="#0b6234" />
            <View style={{ flex: 1 }}>
              <Text style={styles.timelineTitle}>Estimated Delivery</Text>
              <Text style={styles.timelineDesc}>১-২ ঘণ্টার মধ্যে আপনার ঠিকানায় পৌঁছাবে</Text>
            </View>
          </View>

          <View style={styles.timelineRow}>
            <Icon name="PhoneCall" size={18} color="#0b6234" />
            <View style={{ flex: 1 }}>
              <Text style={styles.timelineTitle}>Delivery Updates</Text>
              <Text style={styles.timelineDesc}>
                We will send live updates and rider details to your phone.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title="Track Order Live"
            variant="primary"
            size="lg"
            onPress={() => router.replace(`/orders/${orderId}` as any)}
            leftIcon={<Icon name="Navigation" size={18} color="#ffffff" />}
          />

          <Button
            title="Continue Shopping"
            variant="outline"
            size="md"
            onPress={() => router.replace('/')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  banglaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    textAlign: 'center',
  },
  orderNumberCard: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: Radius.md,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 6,
    marginVertical: 4,
    width: '100%',
  },
  orderNumberLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  orderNumberText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.5,
  },
  familyShareCard: {
    width: '100%',
    backgroundColor: '#ecfdf5',
    borderWidth: 1.5,
    borderColor: '#6ee7b7',
    borderRadius: Radius.lg,
    padding: 16,
    gap: 12,
    marginVertical: 4,
  },
  familyShareHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  familyShareIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  timelineBox: {
    width: '100%',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: Radius.md,
    padding: 14,
    gap: 12,
    marginVertical: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  timelineTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0b6234',
  },
  timelineDesc: {
    fontSize: 12,
    color: '#166534',
    marginTop: 2,
    lineHeight: 17,
  },
  actions: {
    width: '100%',
    gap: 10,
    marginTop: 10,
  },
});

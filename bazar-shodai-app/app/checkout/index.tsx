import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Icon } from '@/components/ui/Icon';
import { Price } from '@/components/ui/Price';
import { Button } from '@/components/ui/Button';
import { Radius } from '@/constants/layout';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { CustomerAddress, PaymentMethod } from '@/features/checkout/types';
import { AddressSelector } from '@/features/checkout/components/AddressSelector';
import { DeliverySlotPicker } from '@/features/checkout/components/DeliverySlotPicker';
import { PaymentMethodSelector } from '@/features/checkout/components/PaymentMethodSelector';
import { MobileBankingForm } from '@/features/checkout/components/MobileBankingForm';
import { useSubmitOrder } from '@/features/checkout/api/useSubmitOrder';
import { shareLocationApi } from '@/features/location/api/myLocation';
import { getCurrentCoordinates } from '@/services/location';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';

export default function CheckoutScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const { items, subtotal, coupon, deliveryCharge, freeDeliveryThreshold } =
    useCartStore();

  // Guest details state
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestAddress, setGuestAddress] = useState('');
  const [guestCity, setGuestCity] = useState('Shahrasti');

  // GPS Location & Real-time Quote state
  const [gpsLocation, setGpsLocation] = useState<{
    lat: number;
    lng: number;
    placeName?: string;
    placeNameBn?: string;
    distanceKm?: number;
    accuracyM?: number;
  } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationBlock, setLocationBlock] = useState<string | null>(null);
  const [dynamicDeliveryFee, setDynamicDeliveryFee] = useState<number | null>(null);
  const [skipLocation, setSkipLocation] = useState(false);
  const [isAbroadOrder, setIsAbroadOrder] = useState(false);
  const [senderCountry, setSenderCountry] = useState('');
  const [senderContactMethod, setSenderContactMethod] = useState<'WHATSAPP' | 'IMO' | 'PHONE'>('WHATSAPP');
  const [senderContactNumber, setSenderContactNumber] = useState('');

  const [selectedAddress, setSelectedAddress] = useState<CustomerAddress | null>(null);

  const { data: addresses = [] } = useQuery({
    queryKey: ['customer-addresses'],
    queryFn: async () => {
      try {
        const res = await api.get<CustomerAddress[]>('/customer/addresses');
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });

  const handleShareLocation = async () => {
    try {
      setIsLocating(true);
      haptics.selection();
      const coords = await getCurrentCoordinates();
      const sub = subtotal();
      const res = await shareLocationApi({
        lat: coords.latitude,
        lng: coords.longitude,
        accuracyM: coords.accuracy ?? undefined,
        source: 'GPS',
        phone: isAuthenticated ? user?.phone : guestPhone.trim() || undefined,
        subtotal: sub,
      });

      const blockReason = res.quote?.block;
      if (blockReason === 'OUT_OF_AREA') {
        if (res.quote?.isAbroad) {
          setIsAbroadOrder(true);
          setSkipLocation(true);
          setLocationBlock(null);
          haptics.success();
          toast.info(
            'আপনি দেশের বাইরে থেকে অর্ডার করছেন!',
            'লোকেশন পিন ছাড়াই অর্ডার সম্পন্ন করতে পারেন। আমাদের টিম সরাসরি আপনার সাথে যোগাযোগ করবে।',
          );
          return;
        }
        setLocationBlock('OUT_OF_AREA');
        haptics.error();
        toast.error(
          'ডেলিভারি সীমার বাইরে',
          'দুঃখিত, এই এলাকাটি আমাদের ডেলিভারি সীমার বাইরে। আমাদের কেন্দ্র থেকে সর্বোচ্চ ডেলিভারি সীমা অতিক্রম করেছে।',
        );
        return;
      } else if (blockReason === 'DISABLED' || blockReason === 'ORIGIN_NOT_SET') {
        setLocationBlock(blockReason);
        toast.warning('ডেলিভারি অনুপলব্ধ', 'বর্তমানে এই এরিয়ায় ডেলিভারি সাময়িকভাবে বন্ধ আছে।');
        return;
      }

      setLocationBlock(null);
      const placeName = res.location?.placeName || res.placeName || res.location?.placeNameBn || res.placeNameBn || '';
      const distance = res.quote?.distanceKm ?? res.distanceKm;
      setGpsLocation({
        lat: coords.latitude,
        lng: coords.longitude,
        placeName,
        placeNameBn: res.location?.placeNameBn || res.placeNameBn,
        distanceKm: distance,
        accuracyM: coords.accuracy ?? undefined,
      });

      if (res.quote?.calculatedFee !== undefined) {
        setDynamicDeliveryFee(res.quote.calculatedFee);
      }

      if (!isAuthenticated && (!guestAddress.trim() || guestAddress === 'Shahrasti') && placeName) {
        setGuestAddress(placeName);
      }

      haptics.success();
      toast.success(
        'লোকেশন যুক্ত হয়েছে',
        placeName ? `${placeName} (${distance !== undefined ? distance.toFixed(1) : ''} কিমি)` : 'আপনার সঠিক অবস্থান যুক্ত হয়েছে',
      );
    } catch {
      haptics.error();
      toast.error('লোকেশন ত্রুটি', 'আপনার বর্তমান অবস্থান পাওয়া যায়নি। মোবাইলের GPS চালু আছে কিনা নিশ্চিত করুন।');
    } finally {
      setIsLocating(false);
    }
  };

  const effectiveAddress = useMemo<CustomerAddress | null>(() => {
    if (!isAuthenticated) {
      return {
        id: 'guest-address',
        fullName: guestName.trim(),
        phone: guestPhone.trim(),
        address: guestAddress.trim(),
        city: guestCity,
        district: 'Chandpur',
        latitude: gpsLocation?.lat ?? 23.2185,
        longitude: gpsLocation?.lng ?? 90.9525,
        label: 'HOME',
      };
    }

    if (selectedAddress) {
      return {
        ...selectedAddress,
        latitude: gpsLocation?.lat ?? selectedAddress.latitude,
        longitude: gpsLocation?.lng ?? selectedAddress.longitude,
      };
    }
    if (addresses.length > 0) {
      const def = addresses.find((a) => a.isDefault) || addresses[0];
      if (def) {
        return {
          ...def,
          latitude: gpsLocation?.lat ?? def.latitude,
          longitude: gpsLocation?.lng ?? def.longitude,
        };
      }
    }
    if (user?.phone) {
      return {
        id: 'user-profile-default',
        fullName: user.name || '',
        phone: user.phone,
        address: (user as any).address || 'Shahrasti Sadar, Chandpur',
        city: 'Shahrasti',
        district: 'Chandpur',
        latitude: gpsLocation?.lat ?? 23.2185,
        longitude: gpsLocation?.lng ?? 90.9525,
        label: 'HOME',
      };
    }
    return null;
  }, [isAuthenticated, guestName, guestPhone, guestAddress, guestCity, gpsLocation, selectedAddress, addresses, user]);

  const [deliverySlot, setDeliverySlot] = useState('EXPRESS_1_2_HRS');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH_ON_DELIVERY');
  const [senderNumber, setSenderNumber] = useState(user?.phone || '');
  const [trxId, setTrxId] = useState('');

  const submitOrderMutation = useSubmitOrder();

  const sub = subtotal();
  const isFreeDelivery = sub >= freeDeliveryThreshold;
  const baseDelivery = dynamicDeliveryFee !== null ? dynamicDeliveryFee : deliveryCharge;
  const currentDelivery = skipLocation ? 0 : (sub > 0 ? (isFreeDelivery ? 0 : baseDelivery) : 0);
  const discount = coupon?.discount ?? 0;
  const grandTotal = Math.max(0, sub - discount + currentDelivery);

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      toast.warning('Empty Bag', 'Please add items to your cart before checkout');
      router.replace('/(tabs)/cart');
      return;
    }

    if (!skipLocation && locationBlock === 'OUT_OF_AREA') {
      toast.error('ডেলিভারি সীমার বাইরে', 'আপনার নির্বাচিত লোকেশন আমাদের ডেলিভারি সীমার বাইরে।');
      return;
    }

    if (skipLocation && isAbroadOrder) {
      if (!senderCountry.trim()) {
        toast.warning('দেশ উল্লেখ করুন', 'অনুগ্রহ করে আপনার বর্তমান দেশ লিখুন (যেমন: সৌদি আরব, দুবাই)');
        return;
      }
      if (!senderContactNumber.trim()) {
        toast.warning('নম্বর আবশ্যক', 'অনুগ্রহ করে কান্ট্রি কোড সহ আপনার হোয়াটসঅ্যাপ/ইমো নম্বর দিন');
        return;
      }
    }

    if (!effectiveAddress || !effectiveAddress.fullName.trim() || !effectiveAddress.phone.trim() || !effectiveAddress.address.trim()) {
      if (!isAuthenticated) {
        if (!guestName.trim()) {
          toast.warning('নাম আবশ্যক', 'অনুগ্রহ করে গ্রাহকের পুরো নাম লিখুন');
          return;
        }
        const cleanPhone = guestPhone.trim();
        if (!cleanPhone || cleanPhone.length !== 11 || !/^01[3-9]\d{8}$/.test(cleanPhone)) {
          toast.warning('সঠিক মোবাইল নম্বর দিন', '১১ ডিজিটের সঠিক মোবাইল নম্বর লিখুন (যেমন: 017XXXXXXXX)');
          return;
        }
        if (!guestAddress.trim()) {
          toast.warning('ঠিকানা আবশ্যক', 'অনুগ্রহ করে ডেলিভারি ঠিকানা লিখুন অথবা "আমার বর্তমান লোকেশন দিন" চাপুন');
          return;
        }
      }
      toast.warning('ঠিকানা আবশ্যক', 'অনুগ্রহ করে ডেলিভারি ঠিকানা সঠিকভাবে দিন');
      return;
    }

    if (!isAuthenticated) {
      const cleanPhone = effectiveAddress.phone.trim();
      if (!cleanPhone || cleanPhone.length !== 11 || !/^01[3-9]\d{8}$/.test(cleanPhone)) {
        toast.warning('সঠিক মোবাইল নম্বর দিন', '১১ ডিজিটের সঠিক মোবাইল নম্বর লিখুন (যেমন: 017XXXXXXXX)');
        return;
      }
    }

    if (paymentMethod !== 'CASH_ON_DELIVERY' && (!senderNumber.trim() || senderNumber.length < 4)) {
      toast.warning(
        'Sender number required',
        'Please enter the mobile number or last 4 digits you made the transfer from',
      );
      return;
    }

    try {
      const order = await submitOrderMutation.mutateAsync({
        paymentMethod,
        shippingAddress: {
          fullName: effectiveAddress.fullName,
          phone: effectiveAddress.phone,
          address: effectiveAddress.address,
          latitude: effectiveAddress.latitude,
          longitude: effectiveAddress.longitude,
          city: effectiveAddress.city || 'Shahrasti',
          district: effectiveAddress.district || 'Chandpur',
          locationSource: gpsLocation ? 'GPS' : 'PIN',
        },
        deliverySlot,
        deliveryNote: deliveryNotes.trim() || undefined,
        couponCode: coupon?.code || undefined,
        bkashSenderNumber: paymentMethod !== 'CASH_ON_DELIVERY' ? senderNumber.trim() : undefined,
        bkashTransactionId:
          paymentMethod !== 'CASH_ON_DELIVERY' && trxId.trim() ? trxId.trim() : undefined,
        skipLocation,
        isAbroadOrder,
        senderCountry: isAbroadOrder ? senderCountry.trim() : undefined,
        senderContactMethod: isAbroadOrder ? senderContactMethod : undefined,
        senderContactNumber: isAbroadOrder ? senderContactNumber.trim() : undefined,
      });

      haptics.success();
      toast.success('Order Placed!', `Your order #${order.orderNumber} has been received.`);
      router.replace(`/order-confirmation/${order.id || order.orderNumber}` as any);
    } catch (err: any) {
      haptics.error();
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'অর্ডার সম্পন্ন করা সম্ভব হয়নি। অনুগ্রহ করে আপনার তথ্য যাচাই করে আবার চেষ্টা করুন।';
      toast.error('Order Failed', message);
    }
  };

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
        <Text style={styles.headerTitle}>Order Checkout</Text>
        <View style={{ width: 34 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Guest Checkout Notice Banner */}
          {!isAuthenticated && (
            <View style={styles.guestNoticeCard}>
              <View style={styles.guestNoticeContent}>
                <Icon name="UserCheck" size={18} color="#0b6234" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.guestNoticeTitle}>গেস্ট চেকআউট (লগইন ঐচ্ছিক)</Text>
                  <Text style={styles.guestNoticeSub}>
                    সংরক্ষিত ঠিকানা ও পয়েন্ট পেতে চান?{' '}
                    <Text
                      style={styles.guestNoticeLink}
                      onPress={() => router.push('/(auth)/login?redirect=/checkout')}
                    >
                      লগইন করুন
                    </Text>
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Section 1: Address Selector (Logged In) or Guest Address Form */}
          {isAuthenticated ? (
            <AddressSelector selectedAddress={effectiveAddress} onSelectAddress={setSelectedAddress} />
          ) : (
            <View style={styles.guestFormContainer}>
              <View style={styles.guestFormHeader}>
                <Icon name="MapPin" size={18} color="#0b6234" />
                <Text style={styles.sectionTitle}>ডেলিভারি তথ্য (Delivery Information)</Text>
              </View>

              <View style={styles.guestFieldGroup}>
                <Text style={styles.guestFieldLabel}>আপনার নাম (Full Name) *</Text>
                <TextInput
                  style={styles.guestInput}
                  placeholder="উদা: তানভির আহমেদ"
                  placeholderTextColor="#9ca3af"
                  value={guestName}
                  onChangeText={setGuestName}
                />
              </View>

              <View style={styles.guestFieldGroup}>
                <Text style={styles.guestFieldLabel}>মোবাইল নম্বর (Phone Number) *</Text>
                <TextInput
                  style={styles.guestInput}
                  placeholder="017XXXXXXXX"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                  maxLength={11}
                  value={guestPhone}
                  onChangeText={setGuestPhone}
                />
              </View>

              <View style={styles.guestFieldGroup}>
                <Text style={styles.guestFieldLabel}>বিস্তারিত ঠিকানা (House, Road, Area) *</Text>
                <TextInput
                  style={[styles.guestInput, { minHeight: 64 }]}
                  placeholder="উদা: বাড়ি ১২, রোড ৪, শাহরাস্তি বাজার..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={2}
                  value={guestAddress}
                  onChangeText={setGuestAddress}
                />
              </View>

              <View style={styles.guestFieldGroup}>
                <Text style={styles.guestFieldLabel}>শহর / উপজেলা (City / Upazila)</Text>
                <TextInput
                  style={styles.guestInput}
                  value={guestCity}
                  onChangeText={setGuestCity}
                />
              </View>
            </View>
          )}

          {/* Section 1.5: Share My Location Feature (Web Parity) */}
          <View style={styles.locationSection}>
            <TouchableOpacity
              style={[
                styles.shareLocationBtn,
                gpsLocation && styles.shareLocationBtnActive,
                isLocating && styles.shareLocationBtnLoading,
              ]}
              onPress={handleShareLocation}
              disabled={isLocating}
              activeOpacity={0.8}
            >
              {isLocating ? (
                <ActivityIndicator size="small" color="#0b6234" />
              ) : (
                <Icon
                  name="Crosshair"
                  size={20}
                  color={gpsLocation ? '#0b6234' : '#0b6234'}
                />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.shareLocationBtnText}>
                  {isLocating
                    ? 'আপনার অবস্থান অনুসন্ধান করা হচ্ছে...'
                    : gpsLocation
                      ? '✓ বর্তমান অবস্থান যুক্ত হয়েছে (GPS)'
                      : 'আমার বর্তমান লোকেশন দিন'}
                </Text>
                <Text style={styles.shareLocationBtnSub}>
                  {gpsLocation
                    ? `${gpsLocation.placeName || 'শাহরাস্তি'} • কেন্দ্র থেকে ${gpsLocation.distanceKm !== undefined ? gpsLocation.distanceKm.toFixed(1) : '0'} কিমি`
                    : 'ডেলিভারি চার্জ ও সঠিক অবস্থান নিশ্চিত করতে প্রেস করুন'}
                </Text>
              </View>
              <Icon
                name={gpsLocation ? 'Check' : 'ChevronRight'}
                size={18}
                color={gpsLocation ? '#0b6234' : '#9ca3af'}
              />
            </TouchableOpacity>

            {locationBlock === 'OUT_OF_AREA' && (
              <View style={styles.outOfAreaAlert}>
                <Icon name="AlertTriangle" size={18} color="#dc2626" />
                <Text style={styles.outOfAreaAlertText}>
                  দুঃখিত, এই এলাকাটি আমাদের ডেলিভারি সীমার বাইরে। আমাদের কেন্দ্র থেকে সর্বোচ্চ ডেলিভারি সীমা অতিক্রম করেছে।
                </Text>
              </View>
            )}

            {/* Skip Location / Abroad Card: only show when out of area */}
            {!skipLocation && locationBlock === 'OUT_OF_AREA' && (
              <TouchableOpacity
                style={styles.skipPinBtn}
                onPress={() => setSkipLocation(true)}
                activeOpacity={0.8}
              >
                <Icon name="Globe" size={18} color="#0b6234" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.skipPinBtnTitle}>
                    প্রবাসী অথবা দূর থেকে অর্ডার? লোকেশন পিন ছাড়া অর্ডার করুন
                  </Text>
                  <Text style={styles.skipPinBtnSub}>
                    ডেলিভারি চার্জ পরে দোকান থেকে যাচাই সাপেক্ষে (৳—)
                  </Text>
                </View>
                <Icon name="ChevronRight" size={16} color="#0b6234" />
              </TouchableOpacity>
            )}

            {skipLocation && (
              <View style={styles.skipPinCard}>
                <View style={styles.skipPinHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <Icon name="Globe" size={18} color="#0b6234" />
                    <Text style={styles.skipPinTitle}>
                      {isAbroadOrder ? 'প্রবাসী অর্ডার (লোকেশন পিন ছাড়া)' : 'লোকেশন পিন ছাড়া অর্ডার'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setSkipLocation(false)}>
                    <Text style={styles.skipPinCancel}>GPS দিন</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.skipPinFeeNotice}>
                  ডেলিভারি ফি: দোকান থেকে যাচাই সাপেক্ষে (৳—)
                </Text>

                <TouchableOpacity
                  style={styles.abroadCheckRow}
                  onPress={() => setIsAbroadOrder(!isAbroadOrder)}
                  activeOpacity={0.8}
                >
                  <Icon
                    name={isAbroadOrder ? 'CheckSquare' : 'Square'}
                    size={18}
                    color="#0b6234"
                  />
                  <Text style={styles.abroadCheckText}>
                    আমি দেশের বাইরে (প্রবাসী) থেকে অর্ডার করছি
                  </Text>
                </TouchableOpacity>

                {isAbroadOrder && (
                  <View style={styles.abroadFields}>
                    <View style={styles.guestFieldGroup}>
                      <Text style={styles.guestFieldLabel}>আপনার বর্তমান দেশ *</Text>
                      <TextInput
                        style={styles.guestInput}
                        value={senderCountry}
                        onChangeText={setSenderCountry}
                        placeholder="যেমন: সৌদি আরব, দুবাই, কাতার, মালয়েশিয়া"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>

                    <View style={styles.guestFieldGroup}>
                      <Text style={styles.guestFieldLabel}>যোগাযোগের মাধ্যম *</Text>
                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                        <TouchableOpacity
                          style={[
                            styles.platformBtn,
                            senderContactMethod === 'WHATSAPP' && styles.platformBtnActive,
                          ]}
                          onPress={() => setSenderContactMethod('WHATSAPP')}
                        >
                          <Text
                            style={[
                              styles.platformBtnText,
                              senderContactMethod === 'WHATSAPP' && styles.platformBtnTextActive,
                            ]}
                          >
                            WhatsApp
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.platformBtn,
                            senderContactMethod === 'IMO' && styles.platformBtnActive,
                          ]}
                          onPress={() => setSenderContactMethod('IMO')}
                        >
                          <Text
                            style={[
                              styles.platformBtnText,
                              senderContactMethod === 'IMO' && styles.platformBtnTextActive,
                            ]}
                          >
                            IMO
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.guestFieldGroup}>
                      <Text style={styles.guestFieldLabel}>
                        {senderContactMethod === 'IMO' ? 'ইমো' : 'হোয়াটসঅ্যাপ'} নম্বর (কান্ট্রি কোড সহ) *
                      </Text>
                      <TextInput
                        style={styles.guestInput}
                        value={senderContactNumber}
                        onChangeText={setSenderContactNumber}
                        placeholder="+966 50 123 4567"
                        placeholderTextColor="#9ca3af"
                        keyboardType="phone-pad"
                      />
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.sectionDivider} />

          {/* Section 2: Delivery Slot */}
          <DeliverySlotPicker
            selectedSlot={deliverySlot}
            onSelectSlot={setDeliverySlot}
            deliveryNotes={deliveryNotes}
            onChangeDeliveryNotes={setDeliveryNotes}
          />

          <View style={styles.sectionDivider} />

          {/* Section 3: Payment Method */}
          <PaymentMethodSelector selectedMethod={paymentMethod} onSelectMethod={setPaymentMethod} />

          {/* Section 4: Mobile Banking Form (if applicable) */}
          <MobileBankingForm
            method={paymentMethod}
            senderNumber={senderNumber}
            onChangeSenderNumber={setSenderNumber}
            trxId={trxId}
            onChangeTrxId={setTrxId}
          />

          <View style={styles.sectionDivider} />

          {/* Section 5: Order Items Preview */}
          <View style={styles.itemsSummaryBox}>
            <View style={styles.itemsHeader}>
              <Text style={styles.itemsTitle}>Order Items ({items.length})</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/cart')}>
                <Text style={styles.editBagText}>Edit Bag</Text>
              </TouchableOpacity>
            </View>

            {items.map((it) => (
              <View key={it.productId} style={styles.itemRow}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {it.quantity}x {it.name}
                </Text>
                <Price amount={it.price * it.quantity} size="sm" />
              </View>
            ))}
          </View>

          {/* Section 6: Price Breakdown */}
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Items Subtotal</Text>
              <Price amount={sub} size="sm" />
            </View>

            {discount > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={styles.discountLabel}>Coupon ({coupon?.code})</Text>
                <Text style={styles.discountValue}>-৳{discount.toFixed(0)}</Text>
              </View>
            )}

            <View style={styles.breakdownRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.breakdownLabel}>Delivery Fee</Text>
                {dynamicDeliveryFee !== null && !skipLocation && (
                  <Text style={styles.calculatedTag}>(লাইভ দূরত্বভিত্তিক)</Text>
                )}
              </View>
              {skipLocation ? (
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#d97706' }}>দোকান থেকে যাচাই সাপেক্ষে</Text>
              ) : isFreeDelivery ? (
                <Text style={styles.freeText}>FREE</Text>
              ) : (
                <Price amount={currentDelivery} size="sm" />
              )}
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Grand Total</Text>
              <Price amount={grandTotal} size="lg" />
            </View>
          </View>
        </ScrollView>

        {/* Sticky Confirm Order Footer */}
        <View style={styles.footerBar}>
          <View style={styles.footerPriceCol}>
            <Text style={styles.footerPriceLabel}>Total Amount</Text>
            <Price amount={grandTotal} size="lg" />
          </View>

          <View style={{ flex: 1 }}>
            <Button
              title={locationBlock === 'OUT_OF_AREA' ? 'ডেলিভারি সীমার বাইরে' : 'Confirm Order'}
              variant="primary"
              size="lg"
              onPress={handlePlaceOrder}
              loading={submitOrderMutation.isPending}
              disabled={submitOrderMutation.isPending || locationBlock === 'OUT_OF_AREA'}
              rightIcon={<Icon name="ArrowRight" size={18} color="#ffffff" />}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
    paddingBottom: 24,
  },
  guestNoticeCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: Radius.md,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
  },
  guestNoticeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  guestNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0b6234',
  },
  guestNoticeSub: {
    fontSize: 12,
    color: '#374151',
    marginTop: 2,
  },
  guestNoticeLink: {
    fontWeight: '700',
    color: '#0b6234',
    textDecorationLine: 'underline',
  },
  guestFormContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    gap: 10,
  },
  guestFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  guestFieldGroup: {
    gap: 4,
  },
  guestFieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  guestInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#111827',
  },
  locationSection: {
    marginHorizontal: 16,
    marginTop: 10,
    gap: 6,
  },
  shareLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  shareLocationBtnActive: {
    backgroundColor: '#f0fdf4',
    borderColor: '#0b6234',
  },
  shareLocationBtnLoading: {
    opacity: 0.8,
  },
  shareLocationBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0b6234',
  },
  shareLocationBtnSub: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  outOfAreaAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: Radius.md,
    padding: 10,
  },
  outOfAreaAlertText: {
    flex: 1,
    fontSize: 12,
    color: '#b91c1c',
    lineHeight: 16,
  },
  sectionDivider: {
    height: 8,
    backgroundColor: '#f3f4f6',
    marginVertical: 4,
  },
  itemsSummaryBox: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  editBagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0b6234',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 13,
    color: '#4b5563',
    flex: 1,
    marginRight: 10,
  },
  breakdownCard: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  calculatedTag: {
    fontSize: 10,
    color: '#0b6234',
    fontWeight: '600',
  },
  discountLabel: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
  },
  discountValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  freeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  cardDivider: {
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
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  footerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  footerPriceCol: {
    justifyContent: 'center',
  },
  footerPriceLabel: {
    fontSize: 11,
    color: '#9ca3af',
  },
  skipPinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 6,
  },
  skipPinBtnTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  skipPinBtnSub: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  skipPinCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: Radius.md,
    padding: 14,
    marginTop: 6,
    gap: 10,
  },
  skipPinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipPinTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0b6234',
  },
  skipPinCancel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0b6234',
    textDecorationLine: 'underline',
  },
  skipPinFeeNotice: {
    fontSize: 11,
    fontWeight: '600',
    color: '#d97706',
  },
  abroadCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  abroadCheckText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  abroadFields: {
    gap: 10,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  platformBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: Radius.sm,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  platformBtnActive: {
    borderColor: '#0b6234',
    backgroundColor: '#f0fdf4',
  },
  platformBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
  },
  platformBtnTextActive: {
    color: '#0b6234',
    fontWeight: '700',
  },
});

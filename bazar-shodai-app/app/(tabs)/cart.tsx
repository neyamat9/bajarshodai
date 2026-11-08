import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { Price } from '@/components/ui/Price';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Radius } from '@/constants/layout';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useServerCart, clearServerCartApi } from '@/features/cart/api/cartApi';
import { FreeShippingProgressBar } from '@/features/cart/components/FreeShippingProgressBar';
import { CouponInput } from '@/features/cart/components/CouponInput';
import { SwipeableCartItem } from '@/features/cart/components/SwipeableCartItem';
import { ClearCartDialog } from '@/features/cart/components/ClearCartDialog';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';
import { formatBdt } from '@/utils/format';

export default function CartScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [showClearDialog, setShowClearDialog] = useState(false);

  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    totalPrice,
    coupon,
    deliveryCharge,
    freeDeliveryThreshold,
  } = useCartStore();

  const { refetch, isRefetching } = useServerCart();

  const rawSub = subtotal();
  const sub = typeof rawSub === 'number' && !isNaN(rawSub) ? rawSub : 0;
  const rawTotal = totalPrice();
  const grandTotal = typeof rawTotal === 'number' && !isNaN(rawTotal) ? rawTotal : 0;
  const isFreeDelivery = sub >= freeDeliveryThreshold;
  const currentDeliveryFee = sub > 0 ? (isFreeDelivery ? 0 : deliveryCharge) : 0;
  const discountAmount = Number(coupon?.discount) || 0;

  const handleClearConfirm = async () => {
    try {
      clearCart();
      void clearServerCartApi().catch(() => {});
      setShowClearDialog(false);
      toast.info('Bag Cleared', 'All items have been removed');
      haptics.selection();
    } catch {
      clearCart();
      setShowClearDialog(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Shopping Bag</Text>
          {items.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{items.length}</Text>
            </View>
          )}
        </View>

        {items.length > 0 && (
          <TouchableOpacity
            onPress={() => setShowClearDialog(true)}
            style={styles.clearBtn}
            accessibilityRole="button"
            accessibilityLabel="Clear cart"
          >
            <Icon name="Trash2" size={18} color="#ef4444" />
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id || item.productId}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              void refetch();
            }}
            colors={['#0b6234']}
            tintColor="#0b6234"
          />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          items.length > 0 ? (
            <View style={styles.listHeader}>
              <FreeShippingProgressBar subtotal={sub} threshold={freeDeliveryThreshold} />
            </View>
          ) : undefined
        }
        renderItem={({ item }) => (
          <SwipeableCartItem
            item={item}
            onUpdateQuantity={(newQty) => updateQuantity(item.id || item.productId, newQty)}
            onRemove={() => {
              removeItem(item.id || item.productId);
              toast.info('Removed', `${item.name} removed`);
            }}
          />
        )}
        ListFooterComponent={
          items.length > 0 ? (
            <View style={styles.listFooter}>
              <CouponInput />
            </View>
          ) : undefined
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <EmptyState
              title="Your Shopping Bag is Empty"
              description="Explore thousands of fresh vegetables, daily groceries, fish, and authentic spices!"
              actionLabel="Start Shopping"
              onAction={() => router.push('/')}
            />
          </View>
        }
      />

      {/* Sticky Bottom Order Summary */}
      {items.length > 0 && (
        <View style={styles.footerSummary}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Subtotal ({items.length} items)</Text>
            <Price amount={sub} size="sm" />
          </View>

          {discountAmount > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={styles.discountLabel}>Coupon Discount ({coupon?.code})</Text>
              <Text style={styles.discountValue}>-৳{discountAmount.toFixed(0)}</Text>
            </View>
          )}

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Estimated Delivery</Text>
            {isFreeDelivery ? (
              <Text style={styles.freeText}>FREE</Text>
            ) : (
              <Price amount={currentDeliveryFee} size="sm" />
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>Total Payable</Text>
              <Text style={styles.vatNote}>VAT / Taxes Included</Text>
            </View>
            <Price amount={grandTotal} size="lg" />
          </View>

          <Button
            title={`Checkout • ${formatBdt(grandTotal)}`}
            variant="primary"
            size="lg"
            onPress={() => {
              haptics.selection();
              if (!isAuthenticated) {
                toast.warning(
                  'লগইন প্রয়োজন',
                  'অর্ডার সম্পন্ন করতে প্রথমে আপনার অ্যাকাউন্টে লগইন করুন',
                );
                router.push('/(auth)/login?redirect=/checkout');
                return;
              }
              router.push('/checkout');
            }}
            rightIcon={<Icon name="ArrowRight" size={18} color="#ffffff" />}
          />
        </View>
      )}

      {/* Clear Cart Confirmation Dialog */}
      <ClearCartDialog
        visible={showClearDialog}
        onConfirm={handleClearConfirm}
        onCancel={() => setShowClearDialog(false)}
      />
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  countBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0b6234',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  listHeader: {
    marginBottom: 12,
  },
  listFooter: {
    marginTop: 8,
    marginBottom: 16,
  },
  emptyWrap: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerSummary: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    padding: 16,
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
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  vatNote: {
    fontSize: 10,
    color: '#9ca3af',
  },
});

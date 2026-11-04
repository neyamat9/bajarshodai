import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Radius } from '@/constants/layout';
import {
  useRiderDeliveries,
  useRiderSummary,
  useUpdateDeliveryStatus,
} from '@/features/rider/api/riderApi';
import { RiderDelivery, RiderDeliveryStatus } from '@/features/rider/types';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';

export default function RiderDeliveriesScreen() {
  const router = useRouter();
  const [scope, setScope] = useState<'active' | 'done'>('active');

  const { data: deliveries = [], isLoading, refetch, isRefetching } = useRiderDeliveries(scope);
  const { data: summary, refetch: refetchSummary } = useRiderSummary();

  const { acceptMutation, pickedUpMutation, onTheWayMutation } = useUpdateDeliveryStatus();

  const handleRefreshAll = () => {
    void refetch();
    void refetchSummary();
  };

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

  const handleQuickStep = (item: RiderDelivery) => {
    haptics.selection();
    if (item.status === 'ASSIGNED') {
      acceptMutation.mutate(item.id, {
        onSuccess: () => {
          haptics.success();
          toast.success('Accepted', `Order #${item.order.orderNumber} accepted`);
        },
      });
    } else if (item.status === 'ACCEPTED') {
      pickedUpMutation.mutate(
        { id: item.id },
        {
          onSuccess: () => {
            haptics.success();
            toast.success('Picked Up', `Parcel collected from shop`);
          },
        },
      );
    } else if (item.status === 'PICKED_UP') {
      onTheWayMutation.mutate(
        { id: item.id },
        {
          onSuccess: () => {
            haptics.success();
            toast.success('On The Way', `Customer notified of your departure`);
          },
        },
      );
    } else {
      router.push(`/(rider)/order/${item.id}` as any);
    }
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
          <Text style={styles.headerTitle}>Rider Delivery Portal</Text>
          <Text style={styles.headerSub}>Live Task Board</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/(rider)/settlements')}
          style={styles.settleBtn}
          accessibilityRole="button"
          accessibilityLabel="Cash settlements"
        >
          <Icon name="DollarSign" size={20} color="#0b6234" />
        </TouchableOpacity>
      </View>

      {/* Summary KPI Strip */}
      <View style={styles.kpiContainer}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiNum}>{summary?.activeCount ?? deliveries.length}</Text>
          <Text style={styles.kpiLabel}>To Deliver</Text>
        </View>

        <View style={styles.kpiDivider} />

        <View style={styles.kpiCard}>
          <Text style={[styles.kpiNum, { color: '#0b6234' }]}>{summary?.deliveredToday ?? 0}</Text>
          <Text style={styles.kpiLabel}>Delivered</Text>
        </View>

        <View style={styles.kpiDivider} />

        <View style={styles.kpiCard}>
          <Text style={[styles.kpiNum, { color: '#b45309' }]}>৳{summary?.cashInHand ?? 0}</Text>
          <Text style={styles.kpiLabel}>Cash in Hand</Text>
        </View>
      </View>

      {/* Scope Filter Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => {
            haptics.selection();
            setScope('active');
          }}
          style={[styles.tabItem, scope === 'active' && styles.tabItemActive]}
        >
          <Text style={[styles.tabText, scope === 'active' && styles.tabTextActive]}>
            Active Tasks
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            haptics.selection();
            setScope('done');
          }}
          style={[styles.tabItem, scope === 'done' && styles.tabItemActive]}
        >
          <Text style={[styles.tabText, scope === 'done' && styles.tabTextActive]}>
            Past 7 Days
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color="#0b6234" />
        </View>
      ) : (
        <FlatList
          data={deliveries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefreshAll}
              colors={['#0b6234']}
              tintColor="#0b6234"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Icon name="CheckCircle" size={48} color="#94a3b8" />
              <Text style={styles.emptyTitle}>
                {scope === 'active' ? 'All Deliveries Done!' : 'No Past Deliveries'}
              </Text>
              <Text style={styles.emptyDesc}>
                {scope === 'active'
                  ? 'You have completed all active deliveries assigned to you. New orders will appear here automatically.'
                  : 'Completed drop-offs from the last 7 days will be listed here.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isCOD = item.order.paymentMethod === 'COD';

            return (
              <TouchableOpacity
                onPress={() => router.push(`/(rider)/order/${item.id}` as any)}
                style={styles.deliveryCard}
                activeOpacity={0.8}
              >
                <View style={styles.cardTop}>
                  <View style={styles.orderIdBox}>
                    <Text style={styles.orderNumber}>
                      #{item.order.orderNumber || item.order.id.slice(0, 8)}
                    </Text>
                    <Text style={styles.customerName}>
                      {item.order.shippingAddress?.fullName || 'Customer'}
                    </Text>
                  </View>

                  <Badge
                    label={item.status.replace('_', ' ')}
                    variant={getStatusBadgeVariant(item.status)}
                    size="sm"
                  />
                </View>

                {/* Address */}
                <View style={styles.addressRow}>
                  <Icon name="MapPin" size={16} color="#0b6234" style={{ marginTop: 2 }} />
                  <Text style={styles.addressText} numberOfLines={2}>
                    {item.order.shippingAddress?.address || 'No address provided'}
                    {item.order.shippingAddress?.city ? `, ${item.order.shippingAddress.city}` : ''}
                  </Text>
                </View>

                {/* Payment & Amount */}
                <View style={styles.paymentRow}>
                  <View style={styles.paymentBadge}>
                    <Icon
                      name={isCOD ? 'Banknote' : 'CreditCard'}
                      size={14}
                      color={isCOD ? '#b45309' : '#0b6234'}
                    />
                    <Text style={[styles.paymentText, { color: isCOD ? '#b45309' : '#0b6234' }]}>
                      {isCOD ? `Cash on Delivery: ৳${item.order.totalAmount}` : 'Paid Online'}
                    </Text>
                  </View>

                  <Text style={styles.itemsCount}>{item.order.items?.length || 0} item(s)</Text>
                </View>

                {/* Quick Action Button for Active Deliveries */}
                {scope === 'active' && item.status !== 'DELIVERED' && item.status !== 'FAILED' && (
                  <View style={styles.cardActions}>
                    <Button
                      title={
                        item.status === 'ASSIGNED'
                          ? 'Accept Delivery'
                          : item.status === 'ACCEPTED'
                            ? 'Confirm Picked Up'
                            : item.status === 'PICKED_UP'
                              ? 'Start Route (On The Way)'
                              : 'View Order & Deliver'
                      }
                      variant="primary"
                      size="sm"
                      loading={
                        acceptMutation.isPending ||
                        pickedUpMutation.isPending ||
                        onTheWayMutation.isPending
                      }
                      onPress={() => handleQuickStep(item)}
                    />
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
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
  headerTitleWrap: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748b',
  },
  settleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  kpiCard: {
    flex: 1,
    alignItems: 'center',
  },
  kpiNum: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  kpiLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  kpiDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabItem: {
    paddingVertical: 12,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#0b6234',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#0b6234',
  },
  loaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 16,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  deliveryCard: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderIdBox: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  customerName: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 1,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paymentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  itemsCount: {
    fontSize: 12,
    color: '#64748b',
  },
  cardActions: {
    marginTop: 6,
  },
});

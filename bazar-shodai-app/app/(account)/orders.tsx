import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { Price } from '@/components/ui/Price';
import { Button } from '@/components/ui/Button';
import { Radius } from '@/constants/layout';
import { useCustomerOrders } from '@/features/orders/api/ordersApi';
import { CustomerOrderRecord, OrderStatus } from '@/features/orders/types';
import { executeReorder } from '@/features/orders/api/reorder';
import { haptics } from '@/services/haptics';

type OrderFilter = 'ALL' | 'ACTIVE' | 'DELIVERED' | 'CANCELLED';

const MOCK_ORDERS: CustomerOrderRecord[] = [
  {
    id: 'ord-1',
    orderNumber: 'BS-20261104-0012',
    status: 'OUT_FOR_DELIVERY',
    paymentMethod: 'CASH_ON_DELIVERY',
    paymentStatus: 'PENDING',
    totalAmount: 620,
    subtotal: 580,
    deliveryFee: 40,
    discountAmount: 0,
    shippingAddress: {
      fullName: 'Tanvir Ahmed',
      phone: '01712345678',
      address: 'House #12, Road #4, Shahrasti Bazar',
      city: 'Shahrasti',
    },
    items: [
      {
        id: 'oi-1',
        productId: 'fresh-tomatoes',
        productName: 'Deshi Fresh Tomatoes',
        productNameBn: 'দেশি পাকা টমেটো',
        quantity: 2,
        unitPrice: 60,
        totalPrice: 120,
        unit: 'kg',
      },
      {
        id: 'oi-2',
        productId: 'rui-fish',
        productName: 'Meghna River Rui Fish',
        productNameBn: 'মেঘনার রুই মাছ',
        quantity: 1,
        unitPrice: 500,
        totalPrice: 500,
        unit: 'kg',
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ord-2',
    orderNumber: 'BS-20261101-0089',
    status: 'DELIVERED',
    paymentMethod: 'BKASH',
    paymentStatus: 'PAID',
    totalAmount: 350,
    subtotal: 350,
    deliveryFee: 0,
    discountAmount: 50,
    shippingAddress: {
      fullName: 'Tanvir Ahmed',
      phone: '01712345678',
      address: 'House #12, Road #4, Shahrasti Bazar',
      city: 'Shahrasti',
    },
    items: [
      {
        id: 'oi-3',
        productId: 'deshi-potatoes',
        productName: 'Deshi Red Potatoes (লাল আলু)',
        quantity: 5,
        unitPrice: 70,
        totalPrice: 350,
        unit: 'kg',
      },
    ],
    createdAt: '2026-11-01T14:20:00Z',
    deliveredAt: '2026-11-01T15:45:00Z',
  },
];

export default function OrderHistoryScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<OrderFilter>('ALL');

  const { data: serverOrders = [], isLoading, refetch, isRefetching } = useCustomerOrders();

  // Combine server orders with mock fallback if empty
  const ordersList = React.useMemo(() => {
    const list = serverOrders.length > 0 ? serverOrders : MOCK_ORDERS;

    return list.filter((order) => {
      if (activeFilter === 'ACTIVE') {
        return (
          order.status === 'PENDING' ||
          order.status === 'CONFIRMED' ||
          order.status === 'PROCESSING' ||
          order.status === 'PACKED' ||
          order.status === 'OUT_FOR_DELIVERY'
        );
      }
      if (activeFilter === 'DELIVERED') {
        return order.status === 'DELIVERED';
      }
      if (activeFilter === 'CANCELLED') {
        return order.status === 'CANCELLED';
      }
      return true;
    });
  }, [serverOrders, activeFilter]);

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
        <Text style={styles.headerTitle}>Order History</Text>
        <View style={{ width: 34 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        {(['ALL', 'ACTIVE', 'DELIVERED', 'CANCELLED'] as OrderFilter[]).map((tab) => {
          const isSelected = activeFilter === tab;

          return (
            <TouchableOpacity
              key={tab}
              onPress={() => {
                haptics.selection();
                setActiveFilter(tab);
              }}
              style={[styles.tabBtn, isSelected && styles.tabBtnActive]}
            >
              <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                {tab === 'ALL' && 'All'}
                {tab === 'ACTIVE' && 'Active'}
                {tab === 'DELIVERED' && 'Delivered'}
                {tab === 'CANCELLED' && 'Cancelled'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={ordersList}
        keyExtractor={(item) => item.id}
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
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/orders/${item.id}` as any)}
            style={styles.orderCard}
            activeOpacity={0.85}
          >
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
                <Text style={styles.orderDate}>
                  {new Date(item.createdAt).toLocaleDateString()} at{' '}
                  {new Date(item.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <Badge
                label={item.status.replace(/_/g, ' ')}
                variant={getStatusBadgeVariant(item.status)}
                size="sm"
              />
            </View>

            {/* Items summary */}
            <View style={styles.itemsSummary}>
              <Text style={styles.itemsText} numberOfLines={2}>
                {item.items && item.items.length > 0
                  ? item.items.map((i) => `${i.quantity}x ${i.productName}`).join(' • ')
                  : 'Groceries package'}
              </Text>
            </View>

            {/* Price & Action Row */}
            <View style={styles.cardBottom}>
              <View>
                <Price amount={item.totalAmount} size="md" />
                <Text style={styles.paymentMethod}>
                  {item.paymentMethod === 'CASH_ON_DELIVERY'
                    ? 'Cash on Delivery'
                    : item.paymentMethod}
                </Text>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  onPress={() => executeReorder(item, () => router.push('/(tabs)/cart'))}
                  style={styles.reorderBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Re-order items"
                >
                  <Icon name="RotateCcw" size={14} color="#0b6234" />
                  <Text style={styles.reorderBtnText}>Re-order</Text>
                </TouchableOpacity>

                <Button
                  title="View Details"
                  variant="primary"
                  size="sm"
                  onPress={() => router.push(`/orders/${item.id}` as any)}
                  rightIcon={<Icon name="ChevronRight" size={14} color="#ffffff" />}
                />
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator color="#0b6234" size="small" />
              <Text style={styles.emptyText}>Loading your orders...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="Package" size={44} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No Orders Found</Text>
              <Text style={styles.emptyText}>
                You haven&apos;t placed any orders in this category yet.
              </Text>
              <Button
                title="Start Shopping"
                variant="primary"
                size="md"
                onPress={() => router.push('/')}
                className="mt-4"
              />
            </View>
          )
        }
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
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: Radius.full,
    backgroundColor: '#f3f4f6',
  },
  tabBtnActive: {
    backgroundColor: '#0b6234',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    gap: 10,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  orderDate: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  itemsSummary: {
    backgroundColor: '#f9fafb',
    borderRadius: Radius.sm,
    padding: 10,
  },
  itemsText: {
    fontSize: 12,
    color: '#4b5563',
    lineHeight: 17,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  paymentMethod: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    backgroundColor: '#f0fdf4',
  },
  reorderBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0b6234',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  emptyText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
  },
});

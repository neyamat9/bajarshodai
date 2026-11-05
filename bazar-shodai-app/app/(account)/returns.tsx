import React from 'react';
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
import { Button } from '@/components/ui/Button';
import { Radius } from '@/constants/layout';
import { useCustomerReturns } from '@/features/returns/api/returnsApi';
import { ReturnStatus } from '@/features/returns/types';

export default function ReturnsListScreen() {
  const router = useRouter();
  const { data: serverReturns = [], isLoading, refetch, isRefetching } = useCustomerReturns();

  const returnsList = serverReturns;

  const getStatusBadgeVariant = (status: ReturnStatus): BadgeVariant => {
    switch (status) {
      case 'COMPLETED':
      case 'APPROVED':
        return 'fresh';
      case 'REJECTED':
      case 'CANCELLED':
        return 'tomato';
      case 'PICKUP_SCHEDULED':
      case 'PICKED_UP':
        return 'fish';
      case 'REQUESTED':
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
        <Text style={styles.headerTitle}>Return & Refund Claims</Text>
        <TouchableOpacity
          onPress={() => router.push('/returns/new')}
          style={styles.addBtn}
          accessibilityRole="button"
          accessibilityLabel="Create return claim"
        >
          <Icon name="Plus" size={22} color="#0b6234" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={returnsList}
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
          <View style={styles.claimCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.claimId}>CLAIM #{item.id.slice(0, 8).toUpperCase()}</Text>
                {item.orderNumber && (
                  <Text style={styles.orderRef}>Order: #{item.orderNumber}</Text>
                )}
              </View>
              <Badge
                label={item.status.replace(/_/g, ' ')}
                variant={getStatusBadgeVariant(item.status)}
                size="sm"
              />
            </View>

            <View style={styles.reasonRow}>
              <Icon name="AlertCircle" size={14} color="#0b6234" />
              <Text style={styles.reasonText}>Reason: {item.reason.replace(/_/g, ' ')}</Text>
            </View>

            {item.detail && <Text style={styles.detailText}>{item.detail}</Text>}

            {/* Returned Items */}
            <View style={styles.itemsBox}>
              {item.items.map((it) => (
                <View key={it.id} style={styles.itemRow}>
                  <Text style={styles.itemName}>
                    {it.quantity}x {it.productName}
                  </Text>
                  <Text style={styles.itemPrice}>৳{it.unitPrice * it.quantity}</Text>
                </View>
              ))}
            </View>

            {item.adminNote && (
              <View style={styles.adminNoteBox}>
                <Text style={styles.adminNoteLabel}>Resolution Update:</Text>
                <Text style={styles.adminNoteText}>{item.adminNote}</Text>
              </View>
            )}

            <View style={styles.cardFooter}>
              <Text style={styles.dateText}>
                Submitted {new Date(item.createdAt).toLocaleDateString()}
              </Text>
              {item.refundAmount ? (
                <Text style={styles.refundAmountText}>Refund: ৳{item.refundAmount.toFixed(0)}</Text>
              ) : null}
            </View>
          </View>
        )}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator color="#0b6234" size="small" />
              <Text style={styles.emptyText}>Loading return claims...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="RotateCcw" size={44} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No Return Claims</Text>
              <Text style={styles.emptyText}>
                All your orders are delivered in peak condition. If you ever receive damaged or
                unsatisfactory goods, request a refund here.
              </Text>
              <Button
                title="Create Return Claim"
                variant="primary"
                size="md"
                onPress={() => router.push('/returns/new')}
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
  addBtn: {
    padding: 4,
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  claimCard: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  claimId: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  orderRef: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reasonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0b6234',
  },
  detailText: {
    fontSize: 12,
    color: '#4b5563',
    lineHeight: 17,
  },
  itemsBox: {
    backgroundColor: '#f9fafb',
    borderRadius: Radius.sm,
    padding: 10,
    gap: 4,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 12,
    color: '#374151',
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  adminNoteBox: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: Radius.sm,
    padding: 10,
  },
  adminNoteLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065f46',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  adminNoteText: {
    fontSize: 12,
    color: '#047857',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  dateText: {
    fontSize: 11,
    color: '#9ca3af',
  },
  refundAmountText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
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

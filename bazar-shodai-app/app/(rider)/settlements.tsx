import React from 'react';
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
import { Badge } from '@/components/ui/Badge';
import { Radius } from '@/constants/layout';
import { useRiderSettlements, useRiderSummary } from '@/features/rider/api/riderApi';

export default function RiderSettlementsScreen() {
  const router = useRouter();
  const { data: settlements = [], isLoading, refetch, isRefetching } = useRiderSettlements();
  const { data: summary } = useRiderSummary();

  const cashInHand = summary?.cashInHand ?? 0;
  const cashCollectedToday = summary?.cashCollectedToday ?? 0;

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
        <Text style={styles.headerTitle}>Cash Settlements</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Summary Highlight */}
      <View style={styles.summaryContainer}>
        <View style={styles.cashCard}>
          <Text style={styles.cashLabel}>Cash in Hand (To Hand Over)</Text>
          <Text style={styles.cashAmount}>৳{cashInHand}</Text>
          <Text style={styles.cashSub}>
            {"Today's COD Collections: ৳"}
            {cashCollectedToday}
          </Text>
        </View>
      </View>

      {/* Settlement Protocol Instruction */}
      <View style={styles.instructionBanner}>
        <Icon name="Info" size={16} color="#0b6234" />
        <Text style={styles.instructionText}>
          Hand over all collected cash to the Shahrasti hub manager at the end of your shift to
          reconcile your settlement ledger.
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color="#0b6234" />
        </View>
      ) : (
        <FlatList
          data={settlements}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
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
          ListHeaderComponent={<Text style={styles.sectionHeader}>Settlement History</Text>}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Icon name="FileCheck" size={42} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No Previous Settlements</Text>
              <Text style={styles.emptyDesc}>
                Your verified daily cash reconciliation records with store management will appear
                here.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isSettled = item.status === 'SETTLED';
            return (
              <View style={styles.settlementCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardDate}>
                    {new Date(item.date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                  <Badge
                    label={isSettled ? 'SETTLED' : 'PENDING'}
                    variant={isSettled ? 'fresh' : 'carrot'}
                    size="sm"
                  />
                </View>

                <View style={styles.settleDetails}>
                  <View style={styles.settleCol}>
                    <Text style={styles.settleColLabel}>Deliveries</Text>
                    <Text style={styles.settleColValue}>{item.deliveriesCount} orders</Text>
                  </View>

                  <View style={styles.settleCol}>
                    <Text style={styles.settleColLabel}>COD Collected</Text>
                    <Text style={styles.settleColValue}>৳{item.totalCodCollected}</Text>
                  </View>

                  <View style={styles.settleCol}>
                    <Text style={styles.settleColLabel}>Handed Over</Text>
                    <Text style={[styles.settleColValue, { color: '#0b6234' }]}>
                      ৳{item.amountSettled}
                    </Text>
                  </View>
                </View>
              </View>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  summaryContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  cashCard: {
    backgroundColor: '#0b6234',
    borderRadius: Radius.lg,
    padding: 18,
  },
  cashLabel: {
    fontSize: 12,
    color: '#bef264',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  cashAmount: {
    fontSize: 34,
    fontWeight: '800',
    color: '#ffffff',
    marginVertical: 4,
  },
  cashSub: {
    fontSize: 13,
    color: '#e2e8f0',
  },
  instructionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  instructionText: {
    flex: 1,
    fontSize: 12,
    color: '#166534',
    lineHeight: 16,
  },
  loaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
  },
  settlementCard: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  settleDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  settleCol: {
    alignItems: 'flex-start',
  },
  settleColLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
  },
  settleColValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
});

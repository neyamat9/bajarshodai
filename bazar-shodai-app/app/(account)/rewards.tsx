import React from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { Radius } from '@/constants/layout';
import { useLoyaltySummary } from '@/features/account/api/accountApi';

export default function RewardsScreen() {
  const router = useRouter();
  const { data: loyalty, isLoading, refetch, isRefetching } = useLoyaltySummary();

  const points = loyalty?.points ?? 0;
  const pointsValue = loyalty?.pointsValue ?? Math.floor(points / 10);
  const transactions = loyalty?.transactions ?? [];
  const milestone = loyalty?.milestone;

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
        <Text style={styles.headerTitle}>Loyalty Rewards</Text>
        <View style={styles.backBtn} />
      </View>

      {isLoading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color="#0b6234" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Points Card */}
          <View style={styles.pointsCard}>
            <View style={styles.pointsCardTop}>
              <View>
                <Text style={styles.pointsSubTitle}>Available Balance</Text>
                <Text style={styles.pointsLarge}>{points}</Text>
                <Text style={styles.pointsCurrency}>Equivalent to ৳{pointsValue} discount</Text>
              </View>
              <View style={styles.coinIconCircle}>
                <Icon name="Award" size={36} color="#ffffff" />
              </View>
            </View>

            <View style={styles.pointsCardFooter}>
              <Icon name="Sparkles" size={16} color="#bef264" />
              <Text style={styles.footerNote}>Redeem points directly on the checkout screen</Text>
            </View>
          </View>

          {/* Milestone Free Shipping Card */}
          {milestone && (
            <View style={styles.milestoneCard}>
              <View style={styles.milestoneHeader}>
                <Icon name="Truck" size={22} color="#0b6234" />
                <Text style={styles.milestoneTitle}>Free Shipping Milestone</Text>
              </View>
              <Text style={styles.milestoneDesc}>
                {milestone.ordersUntilNextMilestone === 0
                  ? '🎉 Congratulations! You have unlocked Free Shipping on your next order!'
                  : `Complete ${milestone.ordersUntilNextMilestone} more order(s) to unlock 100% Free Shipping!`}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(
                        100,
                        ((milestone.interval - milestone.ordersUntilNextMilestone) /
                          milestone.interval) *
                          100,
                      )}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.milestoneStat}>
                {milestone.deliveredCount} lifetime orders delivered
              </Text>
            </View>
          )}

          {/* How to Earn & Redeem Guide */}
          <View style={styles.guideCard}>
            <Text style={styles.guideTitle}>How Loyalty Points Work</Text>

            <View style={styles.guideRow}>
              <View style={styles.guideBullet}>
                <Icon name="ShoppingBag" size={18} color="#0b6234" />
              </View>
              <View style={styles.guideTextWrap}>
                <Text style={styles.guideStepTitle}>Earn on every grocery order</Text>
                <Text style={styles.guideStepDesc}>
                  Earn reward points for every ৳100 spent across all grocery & fresh items.
                </Text>
              </View>
            </View>

            <View style={styles.guideRow}>
              <View style={styles.guideBullet}>
                <Icon name="Zap" size={18} color="#0b6234" />
              </View>
              <View style={styles.guideTextWrap}>
                <Text style={styles.guideStepTitle}>Redeem at checkout</Text>
                <Text style={styles.guideStepDesc}>
                  Every 10 points equals ৳1 instant discount off your grocery cart total.
                </Text>
              </View>
            </View>
          </View>

          {/* Points Transaction Ledger */}
          <View style={styles.ledgerHeader}>
            <Text style={styles.ledgerTitle}>Points History</Text>
            <TouchableOpacity
              onPress={() => {
                void refetch();
              }}
            >
              <Text style={styles.refreshLink}>{isRefetching ? 'Refreshing...' : 'Refresh'}</Text>
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyLedger}>
              <Icon name="Clock" size={32} color="#94a3b8" />
              <Text style={styles.emptyLedgerText}>No points transactions recorded yet</Text>
            </View>
          ) : (
            <FlatList
              data={transactions}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const isEarned = item.points > 0;
                return (
                  <View style={styles.txItem}>
                    <View style={styles.txIconBox}>
                      <Icon
                        name={isEarned ? 'ArrowDownLeft' : 'ArrowUpRight'}
                        size={18}
                        color={isEarned ? '#0b6234' : '#dc2626'}
                      />
                    </View>
                    <View style={styles.txDetails}>
                      <Text style={styles.txTitle}>{item.description}</Text>
                      <Text style={styles.txMeta}>
                        {new Date(item.createdAt).toLocaleDateString()}
                        {item.order?.orderNumber ? ` • Order #${item.order.orderNumber}` : ''}
                      </Text>
                    </View>
                    <View style={styles.txPointsBox}>
                      <Text
                        style={[
                          styles.txPointsText,
                          isEarned ? styles.txEarned : styles.txRedeemed,
                        ]}
                      >
                        {isEarned ? `+${item.points}` : `${item.points}`}
                      </Text>
                      <Badge
                        label={isEarned ? 'EARNED' : 'REDEEMED'}
                        variant={isEarned ? 'fresh' : 'tomato'}
                        size="sm"
                      />
                    </View>
                  </View>
                );
              }}
            />
          )}
        </ScrollView>
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
    gap: 16,
  },
  pointsCard: {
    backgroundColor: '#0b6234',
    borderRadius: Radius.xl,
    padding: 20,
    shadowColor: '#0b6234',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  pointsCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pointsSubTitle: {
    fontSize: 13,
    color: '#bef264',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pointsLarge: {
    fontSize: 42,
    fontWeight: '800',
    color: '#ffffff',
    marginVertical: 4,
  },
  pointsCurrency: {
    fontSize: 14,
    color: '#e2e8f0',
  },
  coinIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  footerNote: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
  },
  milestoneCard: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  milestoneTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  milestoneDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0b6234',
    borderRadius: 4,
  },
  milestoneStat: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'right',
  },
  guideCard: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 14,
  },
  guideTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  guideRow: {
    flexDirection: 'row',
    gap: 12,
  },
  guideBullet: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideTextWrap: {
    flex: 1,
  },
  guideStepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  guideStepDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 16,
  },
  ledgerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  ledgerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  refreshLink: {
    fontSize: 13,
    color: '#0b6234',
    fontWeight: '600',
  },
  emptyLedger: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyLedgerText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 8,
  },
  txItem: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  txIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  txDetails: {
    flex: 1,
  },
  txTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  txMeta: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  txPointsBox: {
    alignItems: 'flex-end',
    gap: 4,
  },
  txPointsText: {
    fontSize: 14,
    fontWeight: '700',
  },
  txEarned: {
    color: '#0b6234',
  },
  txRedeemed: {
    color: '#dc2626',
  },
});

import React, { useState, useMemo } from 'react';
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
import { useSupportTickets } from '@/features/support/api/supportApi';
import { TicketStatus } from '@/features/support/types';
import { haptics } from '@/services/haptics';

export default function SupportTicketsScreen() {
  const router = useRouter();
  const [filterTab, setFilterTab] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');

  const { data, isLoading, refetch, isRefetching } = useSupportTickets();
  const tickets = useMemo(() => data?.items || [], [data?.items]);

  const filteredTickets = useMemo(() => {
    if (filterTab === 'ACTIVE') {
      return tickets.filter((t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED');
    }
    if (filterTab === 'RESOLVED') {
      return tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED');
    }
    return tickets;
  }, [tickets, filterTab]);

  const getStatusBadgeVariant = (status: TicketStatus): BadgeVariant => {
    switch (status) {
      case 'OPEN':
        return 'fresh';
      case 'IN_PROGRESS':
        return 'carrot';
      case 'WAITING_CUSTOMER':
        return 'carrot';
      case 'RESOLVED':
        return 'fresh';
      case 'CLOSED':
      default:
        return 'neutral';
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
        <Text style={styles.headerTitle}>Customer Support</Text>
        <TouchableOpacity
          onPress={() => router.push('/support/new')}
          style={styles.addBtn}
          accessibilityRole="button"
          accessibilityLabel="New ticket"
        >
          <Icon name="Plus" size={22} color="#0b6234" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => {
            haptics.selection();
            setFilterTab('ALL');
          }}
          style={[styles.tabItem, filterTab === 'ALL' && styles.tabItemActive]}
        >
          <Text style={[styles.tabText, filterTab === 'ALL' && styles.tabTextActive]}>
            All ({tickets.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            haptics.selection();
            setFilterTab('ACTIVE');
          }}
          style={[styles.tabItem, filterTab === 'ACTIVE' && styles.tabItemActive]}
        >
          <Text style={[styles.tabText, filterTab === 'ACTIVE' && styles.tabTextActive]}>
            Active
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            haptics.selection();
            setFilterTab('RESOLVED');
          }}
          style={[styles.tabItem, filterTab === 'RESOLVED' && styles.tabItemActive]}
        >
          <Text style={[styles.tabText, filterTab === 'RESOLVED' && styles.tabTextActive]}>
            Resolved
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color="#0b6234" />
        </View>
      ) : (
        <FlatList
          data={filteredTickets}
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
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Icon name="LifeBuoy" size={48} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No Support Tickets</Text>
              <Text style={styles.emptyDesc}>
                Need help with an order, delivery or refund? Open a ticket and our support team will
                respond promptly.
              </Text>
              <Button
                title="Create Support Ticket"
                variant="primary"
                size="md"
                onPress={() => router.push('/support/new')}
                style={{ marginTop: 16 }}
              />
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/support/${item.id}` as any)}
              style={styles.ticketCard}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <Badge label={item.category.replace('_', ' ')} variant="neutral" size="sm" />
                <Badge
                  label={item.status.replace('_', ' ')}
                  variant={getStatusBadgeVariant(item.status)}
                  size="sm"
                />
              </View>

              <Text style={styles.ticketSubject} numberOfLines={2}>
                {item.subject}
              </Text>

              {item.order?.orderNumber && (
                <Text style={styles.orderRef}>Related Order #{item.order.orderNumber}</Text>
              )}

              <View style={styles.cardFooter}>
                <Text style={styles.dateText}>
                  {new Date(item.lastMessageAt || item.createdAt).toLocaleDateString()} •{' '}
                  {new Date(item.lastMessageAt || item.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                <View style={styles.replyRow}>
                  <Text style={styles.viewThreadText}>View Thread</Text>
                  <Icon name="ChevronRight" size={14} color="#0b6234" />
                </View>
              </View>
            </TouchableOpacity>
          )}
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
  addBtn: {
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabItem: {
    paddingVertical: 12,
    marginRight: 20,
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
    paddingVertical: 60,
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
  ticketCard: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ticketSubject: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 20,
  },
  orderRef: {
    fontSize: 12,
    color: '#0b6234',
    fontWeight: '600',
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  dateText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  replyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewThreadText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0b6234',
  },
});

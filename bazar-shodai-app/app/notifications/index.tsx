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
import { Radius } from '@/constants/layout';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/features/support/api/supportApi';
import { AppNotification } from '@/features/support/types';
import { haptics } from '@/services/haptics';
import { toast } from '@/store/useToastStore';

export default function NotificationsScreen() {
  const router = useRouter();
  const { data: notifications = [], isLoading, refetch, isRefetching } = useNotifications();
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllNotificationsRead();

  const handleNotificationPress = (notif: AppNotification) => {
    haptics.selection();
    if (!notif.read) {
      markRead(notif.id);
    }

    // Deep link routing if notification specifies order or return
    if (notif.data?.orderId) {
      router.push(`/orders/${notif.data.orderId}` as any);
    } else if (notif.data?.returnId) {
      router.push('/(account)/returns');
    } else if (notif.data?.url) {
      router.push(notif.data.url as any);
    }
  };

  const handleMarkAllRead = () => {
    haptics.light();
    markAllRead(undefined, {
      onSuccess: () => {
        haptics.success();
        toast.info('Marked as Read', 'All notifications marked as read');
      },
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ORDER_STATUS':
      case 'ORDER_DELIVERED':
        return 'Package';
      case 'DELIVERY_DISPATCHED':
      case 'RIDER_ASSIGNED':
        return 'Truck';
      case 'PROMOTION':
      case 'DISCOUNT':
        return 'Tag';
      case 'SUPPORT_REPLY':
        return 'MessageSquare';
      default:
        return 'Bell';
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
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity
          onPress={handleMarkAllRead}
          disabled={isMarkingAll || notifications.length === 0}
          style={styles.markAllBtn}
          accessibilityRole="button"
          accessibilityLabel="Mark all as read"
        >
          <Icon name="CheckCheck" size={20} color="#0b6234" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color="#0b6234" />
        </View>
      ) : (
        <FlatList
          data={notifications}
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
              <Icon name="BellOff" size={48} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptyDesc}>
                You will receive updates here about order tracking, delivery dispatches, and
                exclusive grocery discounts.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleNotificationPress(item)}
              style={[styles.itemCard, !item.read && styles.itemCardUnread]}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, !item.read && styles.iconBoxUnread]}>
                <Icon
                  name={getNotificationIcon(item.type)}
                  size={18}
                  color={!item.read ? '#0b6234' : '#64748b'}
                />
              </View>

              <View style={styles.contentBox}>
                <View style={styles.titleRow}>
                  <Text style={[styles.title, !item.read && styles.titleUnread]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {!item.read && <View style={styles.unreadDot} />}
                </View>

                <Text style={styles.body} numberOfLines={2}>
                  {item.body}
                </Text>

                <Text style={styles.timeText}>
                  {new Date(item.createdAt).toLocaleDateString()} •{' '}
                  {new Date(item.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
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
  markAllBtn: {
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
  listContent: {
    padding: 16,
    gap: 10,
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
  itemCard: {
    flexDirection: 'row',
    padding: 14,
    backgroundColor: '#ffffff',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  itemCardUnread: {
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxUnread: {
    backgroundColor: '#dcfce7',
  },
  contentBox: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  titleUnread: {
    fontWeight: '700',
    color: '#0f172a',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0b6234',
    marginLeft: 8,
  },
  body: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 3,
    lineHeight: 18,
  },
  timeText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 6,
  },
});

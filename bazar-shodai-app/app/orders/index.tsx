import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { Price } from '@/components/ui/Price';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCustomerOrders } from '@/features/orders/api/ordersApi';
import { useAuthStore } from '@/store/useAuthStore';
import { haptics } from '@/services/haptics';

export default function OrdersListScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: orders = [], isLoading, refetch, isRefetching } = useCustomerOrders();

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'fresh';
      case 'CANCELLED':
        return 'destructive';
      case 'OUT_FOR_DELIVERY':
        return 'warning';
      default:
        return 'carrot';
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border bg-card">
        <TouchableOpacity
          onPress={() => router.back()}
          delayPressIn={0}
          className="p-1"
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Icon name="ArrowLeft" size={22} color="#0b6234" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-foreground">My Order History</Text>
        <View className="w-8" />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0b6234" />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                haptics.light();
                void refetch();
              }}
              colors={['#0b6234']}
              tintColor="#0b6234"
            />
          }
          renderItem={({ item }) => {
            const itemCount =
              item.items?.length ??
              (item as any).itemCount ??
              (item.items?.reduce((sum: number, i: any) => sum + (i.quantity || 1), 0) || 1);
            const total = Number(item.totalAmount ?? (item as any).total ?? 0);
            const dateStr = item.createdAt
              ? new Date(item.createdAt).toLocaleDateString('bn-BD', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : (item as any).date || '';

            return (
              <TouchableOpacity
                onPress={() => router.push(`/orders/${item.id}`)}
                delayPressIn={0}
                activeOpacity={0.8}
                className="p-4 rounded-brand bg-card border border-border mb-3"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm font-bold text-foreground font-mono">
                    {item.orderNumber || item.id}
                  </Text>
                  <Badge
                    label={item.status}
                    variant={getStatusVariant(item.status) as any}
                    size="sm"
                  />
                </View>

                {dateStr ? (
                  <Text className="text-xs text-muted-foreground mb-3">{dateStr}</Text>
                ) : null}

                <View className="flex-row items-center justify-between pt-2 border-t border-border">
                  <Text className="text-xs text-muted-foreground">{itemCount} items</Text>
                  <Price amount={total} size="sm" />
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              title={!isAuthenticated ? 'অনুগ্রহ করে লগইন করুন' : 'কোনো অর্ডার নেই'}
              description={
                !isAuthenticated
                  ? 'আপনার পূর্ববর্তী অর্ডার দেখতে অ্যাকাউন্টে লগইন করুন।'
                  : 'আপনি এখনও কোনো অর্ডার করেননি। তাজা বাজার কেনাকাটা শুরু করুন!'
              }
              actionLabel={!isAuthenticated ? 'লগইন করুন' : 'কেনাকাটা শুরু করুন'}
              onAction={() => {
                if (!isAuthenticated) {
                  router.push('/(auth)/login?redirect=/orders');
                } else {
                  router.push('/(tabs)/categories');
                }
              }}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

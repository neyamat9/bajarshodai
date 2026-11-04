import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { Price } from '@/components/ui/Price';
import { EmptyState } from '@/components/ui/EmptyState';

const SAMPLE_ORDERS = [
  {
    id: 'BS-84912',
    date: 'Today, 2:30 PM',
    status: 'DELIVERED',
    itemCount: 4,
    total: 890,
  },
  {
    id: 'BS-79341',
    date: 'Yesterday, 11:15 AM',
    status: 'PROCESSING',
    itemCount: 2,
    total: 450,
  },
];

export default function OrdersListScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border bg-card">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-1"
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Icon name="ArrowLeft" size={22} color="#0b6234" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-foreground">My Order History</Text>
        <View className="w-8" />
      </View>

      <FlatList
        data={SAMPLE_ORDERS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/orders/${item.id}`)}
            activeOpacity={0.8}
            className="p-4 rounded-brand bg-card border border-border mb-3"
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-bold text-foreground font-mono">{item.id}</Text>
              <Badge
                label={item.status}
                variant={item.status === 'DELIVERED' ? 'fresh' : 'carrot'}
                size="sm"
              />
            </View>

            <Text className="text-xs text-muted-foreground mb-3">{item.date}</Text>

            <View className="flex-row items-center justify-between pt-2 border-t border-border">
              <Text className="text-xs text-muted-foreground">{item.itemCount} items</Text>
              <Price amount={item.total} size="sm" />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState
            title="No Past Orders"
            description="You haven't placed any orders yet. Start your grocery journey today!"
            actionLabel="Start Shopping"
            onAction={() => router.push('/')}
          />
        }
      />
    </SafeAreaView>
  );
}

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { Price } from '@/components/ui/Price';
import { Button } from '@/components/ui/Button';
import { toast } from '@/store/useToastStore';

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

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
        <Text className="text-base font-bold text-foreground">Order #{id}</Text>
        <View className="w-8" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Status Card */}
        <View className="p-4 rounded-brand bg-card border border-border mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-bold text-foreground">Delivery Status</Text>
            <Badge label="IN TRANSIT" variant="fish" size="sm" />
          </View>
          <Text className="text-xs text-muted-foreground leading-relaxed">
            Your rider is on the way to Shahrasti Sadar with your fresh groceries. Estimated arrival
            in 15-20 minutes.
          </Text>
        </View>

        {/* Order Items */}
        <View className="p-4 rounded-brand bg-card border border-border mb-4">
          <Text className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
            Items in Order
          </Text>
          <View className="flex-row items-center justify-between py-2 border-b border-border">
            <Text className="text-xs text-foreground">Fresh Deshi Tomato (2kg)</Text>
            <Price amount={120} size="sm" />
          </View>
          <View className="flex-row items-center justify-between py-2 border-b border-border">
            <Text className="text-xs text-foreground">River Rui Fish Whole (1.5kg)</Text>
            <Price amount={630} size="sm" />
          </View>
          <View className="flex-row items-center justify-between pt-3">
            <Text className="text-sm font-bold text-foreground">Total Paid (Cash on Delivery)</Text>
            <Price amount={750} size="md" />
          </View>
        </View>

        <Button
          title="Track Live Rider on Map"
          variant="primary"
          size="lg"
          onPress={() => toast.info('Rider Tracking', 'Connecting to rider GPS...')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

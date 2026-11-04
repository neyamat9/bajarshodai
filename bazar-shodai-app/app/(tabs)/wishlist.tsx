import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { EmptyState } from '@/components/ui/EmptyState';

export default function WishlistScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 py-3 border-b border-border bg-card">
        <Text className="text-xl font-bold text-foreground">My Wishlist (0)</Text>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <EmptyState
          title="No Saved Items"
          description="Tap the heart icon on any product to save it to your wishlist for quick future orders."
          actionLabel="Explore Groceries"
          onAction={() => router.push('/')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

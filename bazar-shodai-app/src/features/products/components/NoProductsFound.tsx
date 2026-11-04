import React from 'react';
import { View, Text } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';

export interface NoProductsFoundProps {
  message?: string;
  onResetFilters?: () => void;
  className?: string;
}

export function NoProductsFound({
  message = 'No products matched your search or active filters.',
  onResetFilters,
  className = '',
}: NoProductsFoundProps) {
  return (
    <View className={`items-center justify-center p-8 ${className}`}>
      <View className="w-16 h-16 rounded-full bg-muted/40 items-center justify-center mb-3">
        <Icon name="SearchX" size={32} color="#64748b" />
      </View>
      <Text className="text-base font-bold text-foreground text-center mb-1">
        No Products Found
      </Text>
      <Text className="text-xs text-muted-foreground text-center mb-6 leading-relaxed max-w-xs">
        {message} Try modifying your filters or searching for another keyword.
      </Text>
      {onResetFilters && (
        <Button title="Clear All Filters" variant="outline" size="md" onPress={onResetFilters} />
      )}
    </View>
  );
}

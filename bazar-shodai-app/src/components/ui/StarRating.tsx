import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from './Icon';
import { haptics } from '@/services/haptics';

export interface StarRatingProps {
  rating: number; // 0 to 5
  maxStars?: number;
  size?: number;
  count?: number; // Optional review count
  interactive?: boolean;
  onRate?: (rating: number) => void;
  className?: string;
}

export function StarRating({
  rating,
  maxStars = 5,
  size = 16,
  count,
  interactive = false,
  onRate,
  className = '',
}: StarRatingProps) {
  const handlePress = (index: number) => {
    if (!interactive || !onRate) return;
    haptics.selection();
    onRate(index + 1);
  };

  return (
    <View className={`flex-row items-center ${className}`}>
      <View style={styles.starsRow}>
        {Array.from({ length: maxStars }).map((_, index) => {
          const isFilled = index + 1 <= Math.floor(rating);
          const isHalf = !isFilled && index < rating;

          const starIcon = (
            <Icon
              name="Star"
              size={size}
              color={isFilled || isHalf ? '#f59e0b' : '#d3e0cb'}
              style={isFilled ? styles.filledStar : undefined}
            />
          );

          if (interactive) {
            return (
              <TouchableOpacity
                key={index}
                activeOpacity={0.7}
                onPress={() => handlePress(index)}
                style={styles.touchableStar}
              >
                {starIcon}
              </TouchableOpacity>
            );
          }

          return (
            <View key={index} style={styles.starSlot}>
              {starIcon}
            </View>
          );
        })}
      </View>

      {rating > 0 && (
        <Text className="text-xs font-bold text-foreground ml-1.5">{rating.toFixed(1)}</Text>
      )}

      {count !== undefined && <Text className="text-xs text-muted-foreground ml-1">({count})</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starSlot: {
    marginRight: 2,
  },
  touchableStar: {
    padding: 3,
  },
  filledStar: {
    // Fill effect
  },
});

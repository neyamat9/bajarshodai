import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon, IconName } from '@/components/ui/Icon';
import { Radius } from '@/constants/layout';
import { haptics } from '@/services/haptics';

interface QuickPill {
  id: string;
  name: string;
  slug: string;
  icon: IconName;
}

const QUICK_PILLS: QuickPill[] = [
  { id: '1', name: 'সবজি', slug: 'vegetables', icon: 'Carrot' },
  { id: '2', name: 'মাছ', slug: 'fish', icon: 'Fish' },
  { id: '3', name: 'মাংস', slug: 'meat', icon: 'Beef' },
  { id: '4', name: 'ফলমূল', slug: 'fruits', icon: 'Apple' },
  { id: '5', name: 'দুধ ও ডিম', slug: 'dairy', icon: 'Egg' },
  { id: '6', name: 'মসলা', slug: 'spices', icon: 'Flame' },
];

export interface QuickJumpBarProps {
  activeSlug?: string;
  onSelectCategory?: (slug: string) => void;
  className?: string;
}

export function QuickJumpBar({ activeSlug, onSelectCategory, className = '' }: QuickJumpBarProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(activeSlug ?? null);

  const handlePress = (pill: QuickPill) => {
    haptics.selection();
    setSelected(pill.slug);
    if (onSelectCategory) {
      onSelectCategory(pill.slug);
    } else {
      router.push(`/category/${pill.slug}`);
    }
  };

  return (
    <View className={`py-2 px-4 bg-background border-b border-border ${className}`}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2">
          {QUICK_PILLS.map((pill) => {
            const isCurrent = selected === pill.slug;
            return (
              <TouchableOpacity
                key={pill.id}
                onPress={() => handlePress(pill)}
                activeOpacity={0.7}
                style={[styles.pill, isCurrent && styles.pillActive]}
                className={`flex-row items-center gap-1.5 border ${
                  isCurrent ? 'bg-brand-fresh border-brand-fresh' : 'bg-card border-border'
                }`}
              >
                <Icon name={pill.icon} size={14} color={isCurrent ? '#ffffff' : '#0b6234'} />
                <Text
                  style={[styles.pillLabel, isCurrent ? styles.pillLabelActive : null]}
                  className={isCurrent ? 'text-white' : 'text-foreground'}
                >
                  {pill.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  pillActive: {
    backgroundColor: '#0b6234',
  },
  pillLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  pillLabelActive: {
    color: '#ffffff',
  },
});

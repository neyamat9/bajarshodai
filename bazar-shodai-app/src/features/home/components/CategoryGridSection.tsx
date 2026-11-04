import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { CategoryTile } from '@/components/category/CategoryTile';
import { HomeCategoryData } from '../types';
import { haptics } from '@/services/haptics';

export interface CategoryGridSectionProps {
  categories: HomeCategoryData[];
  className?: string;
}

const DEFAULT_CATEGORIES: HomeCategoryData[] = [
  { id: 'c1', name: 'Vegetables', nameBn: 'সবজি', slug: 'vegetables', productCount: 48 },
  { id: 'c2', name: 'Fresh Fish', nameBn: 'তাজা মাছ', slug: 'fish', productCount: 26 },
  { id: 'c3', name: 'Halal Meat', nameBn: 'মাংস', slug: 'meat', productCount: 19 },
  { id: 'c4', name: 'Fruits', nameBn: 'ফলমূল', slug: 'fruits', productCount: 34 },
  { id: 'c5', name: 'Dairy & Eggs', nameBn: 'দুধ ও ডিম', slug: 'dairy', productCount: 16 },
  { id: 'c6', name: 'Cooking Oil', nameBn: 'তেল ও ঘি', slug: 'oil', productCount: 22 },
  { id: 'c7', name: 'Spices', nameBn: 'মসলা', slug: 'spices', productCount: 45 },
  { id: 'c8', name: 'Rice & Dal', nameBn: 'চাল ও ডাল', slug: 'grains', productCount: 30 },
];

export function CategoryGridSection({ categories, className = '' }: CategoryGridSectionProps) {
  const router = useRouter();
  const displayList = categories.length > 0 ? categories.slice(0, 16) : DEFAULT_CATEGORIES;

  const handleViewAll = () => {
    haptics.light();
    router.push('/(tabs)/categories');
  };

  return (
    <View className={`px-4 mb-5 ${className}`}>
      {/* Section Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View>
          <Text className="text-base font-bold text-foreground">ক্যাটাগরি সমূহ</Text>
          <Text className="text-[11px] text-muted-foreground">Shop by Category</Text>
        </View>

        <TouchableOpacity onPress={handleViewAll} activeOpacity={0.7} className="py-1 px-2">
          <Text className="text-xs font-bold text-brand-deep dark:text-brand-fresh">
            সব দেখুন ›
          </Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal Scroll List */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-3">
          {displayList.map((cat) => (
            <CategoryTile
              key={cat.id}
              category={{
                id: cat.id,
                name: cat.nameBn || cat.name,
                banglaName: cat.nameBn ?? undefined,
                slug: cat.slug,
                iconUrl: cat.image || cat.icon || undefined,
                productCount: cat.productCount,
              }}
              onPress={() => router.push(`/category/${cat.slug}`)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

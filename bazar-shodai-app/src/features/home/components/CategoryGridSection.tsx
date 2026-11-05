import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { CategoryTile } from '@/components/category/CategoryTile';
import { CategoryDrawerModal } from '@/components/category/CategoryDrawerModal';
import { HomeCategoryData } from '../types';
import { haptics } from '@/services/haptics';

export interface CategoryGridSectionProps {
  categories: HomeCategoryData[];
  className?: string;
}

export function CategoryGridSection({ categories, className = '' }: CategoryGridSectionProps) {
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const displayList = Array.isArray(categories) ? categories.slice(0, 16) : [];

  const handleOpenDrawer = () => {
    haptics.light();
    setDrawerVisible(true);
  };

  if (displayList.length === 0) {
    return null;
  }

  return (
    <View className={`px-4 mb-5 ${className}`}>
      {/* Section Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View>
          <Text className="text-base font-bold text-foreground">ক্যাটাগরি সমূহ</Text>
          <Text className="text-[11px] text-muted-foreground">Shop by Category</Text>
        </View>

        <TouchableOpacity onPress={handleOpenDrawer} activeOpacity={0.7} className="py-1 px-2">
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
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/categories',
                  params: { category: cat.slug },
                })
              }
            />
          ))}
        </View>
      </ScrollView>

      {/* Side Drawer Modal */}
      <CategoryDrawerModal
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />
    </View>
  );
}

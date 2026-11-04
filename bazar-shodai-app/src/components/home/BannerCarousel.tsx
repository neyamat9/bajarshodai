import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { AppImage } from '@/components/ui/AppImage';
import { Radius } from '@/constants/layout';

export interface BannerItem {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
}

export interface BannerCarouselProps {
  banners: BannerItem[];
  onBannerPress?: (banner: BannerItem) => void;
  autoPlayIntervalMs?: number;
  className?: string;
}

export function BannerCarousel({
  banners,
  onBannerPress,
  autoPlayIntervalMs = 4000,
  className = '',
}: BannerCarouselProps) {
  const { width } = useWindowDimensions();
  const flatListRef = useRef<FlatList<BannerItem>>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const bannerWidth = width - 32; // 16px margins on each side

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollPosition = event.nativeEvent.contentOffset.x;
      const index = Math.round(scrollPosition / bannerWidth);
      if (index !== activeIndex && index >= 0 && index < banners.length) {
        setActiveIndex(index);
      }
    },
    [bannerWidth, activeIndex, banners.length],
  );

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      const nextIndex = (activeIndex + 1) % banners.length;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setActiveIndex(nextIndex);
    }, autoPlayIntervalMs);

    return () => clearInterval(timer);
  }, [activeIndex, banners.length, autoPlayIntervalMs]);

  if (banners.length === 0) return null;

  return (
    <View className={`w-full ${className}`}>
      <FlatList
        ref={flatListRef}
        data={banners}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToInterval={bannerWidth}
        decelerationRate="fast"
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onBannerPress?.(item)}
            style={{ width: bannerWidth, marginRight: 8 }}
          >
            <AppImage source={item.imageUrl} aspectRatio={2.2} borderRadius={Radius.brand} />
          </TouchableOpacity>
        )}
      />

      {/* Pagination Dots */}
      {banners.length > 1 && (
        <View style={styles.paginationDots}>
          {banners.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, index === activeIndex ? styles.activeDot : styles.inactiveDot]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  paginationDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  dot: {
    height: 4,
    borderRadius: 2,
    marginHorizontal: 3,
  },
  activeDot: {
    width: 16,
    backgroundColor: '#0b6234', // brand-deep
  },
  inactiveDot: {
    width: 6,
    backgroundColor: '#d3e0cb',
  },
});

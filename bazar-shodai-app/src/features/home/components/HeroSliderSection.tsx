import React from 'react';
import { View } from 'react-native';
import { BannerCarousel, BannerItem } from '@/components/home/BannerCarousel';
import { BannerItemData } from '../types';
import { openAppUrl } from '@/navigation/linking';

export interface HeroSliderSectionProps {
  banners: BannerItemData[];
  className?: string;
}

const DEFAULT_FALLBACK_BANNERS: BannerItem[] = [
  {
    id: 'hero-1',
    title: 'আজকের তাজা বাজার',
    imageUrl:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
    linkUrl: 'bazarshodai://category/vegetables',
  },
  {
    id: 'hero-2',
    title: 'চাঁদপুরের তাজা ইলিশ ও দেশি মাছ',
    imageUrl:
      'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fit=crop&w=800&q=80',
    linkUrl: 'bazarshodai://category/fish',
  },
];

export function HeroSliderSection({ banners, className = '' }: HeroSliderSectionProps) {
  const formattedBanners: BannerItem[] =
    banners.length > 0
      ? banners.map((b) => ({
          id: b.id,
          title: b.title,
          imageUrl: b.mobileImageUrl || b.imageUrl,
          linkUrl: b.linkUrl || undefined,
        }))
      : DEFAULT_FALLBACK_BANNERS;

  const handleBannerPress = (banner: BannerItem) => {
    if (banner.linkUrl) {
      openAppUrl(banner.linkUrl);
    }
  };

  return (
    <View className={`my-3 ${className}`}>
      <BannerCarousel banners={formattedBanners} onBannerPress={handleBannerPress} />
    </View>
  );
}

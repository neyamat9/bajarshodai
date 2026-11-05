import React from 'react';
import { View } from 'react-native';
import { BannerCarousel, BannerItem } from '@/components/home/BannerCarousel';
import { BannerItemData } from '../types';
import { openAppUrl } from '@/navigation/linking';

export interface HeroSliderSectionProps {
  banners: BannerItemData[];
  className?: string;
}

export function HeroSliderSection({ banners, className = '' }: HeroSliderSectionProps) {
  // Only display verified HERO_MAIN banners from the public store
  const mainBanners = (Array.isArray(banners) ? banners : []).filter(
    (b) => !b.position || b.position === 'HERO_MAIN',
  );

  if (mainBanners.length === 0) {
    return null;
  }

  const formattedBanners: BannerItem[] = mainBanners.map((b) => ({
    id: b.id,
    title: b.title || '',
    imageUrl: b.mobileImageUrl || b.imageUrl,
    linkUrl: b.linkUrl || undefined,
  }));

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

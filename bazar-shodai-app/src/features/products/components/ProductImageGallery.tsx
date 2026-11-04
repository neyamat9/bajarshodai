import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { AppImage } from '@/components/ui/AppImage';
import { Icon } from '@/components/ui/Icon';
import { Radius } from '@/constants/layout';
import { haptics } from '@/services/haptics';

export interface ProductImageGalleryProps {
  images: string[];
  aspectRatio?: number;
}

export function ProductImageGallery({ images, aspectRatio = 1.2 }: ProductImageGalleryProps) {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);

  const displayImages = images.length > 0 ? images : [''];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveIndex(index);
        }}
      >
        {displayImages.map((uri, idx) => (
          <TouchableOpacity
            key={idx}
            activeOpacity={0.95}
            onPress={() => {
              haptics.light();
              setFullscreenVisible(true);
            }}
            style={{ width }}
          >
            <AppImage source={uri} aspectRatio={aspectRatio} borderRadius={0} resizeMode="cover" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      {displayImages.length > 1 && (
        <View style={styles.pagination}>
          {displayImages.map((_, idx) => (
            <View
              key={idx}
              style={[styles.dot, activeIndex === idx ? styles.activeDot : null]}
              className={activeIndex === idx ? 'bg-brand-fresh' : 'bg-muted-foreground/40'}
            />
          ))}
        </View>
      )}

      {/* Fullscreen Zoom Modal */}
      <Modal
        visible={fullscreenVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreenVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            onPress={() => setFullscreenVisible(false)}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Close image viewer"
          >
            <Icon name="X" size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.modalImageContainer}>
            <AppImage source={displayImages[activeIndex]} aspectRatio={1} resizeMode="contain" />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
  },
  pagination: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 16,
    borderRadius: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radius.full,
  },
  modalImageContainer: {
    width: '100%',
    padding: 16,
  },
});

import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Image, ImageProps } from 'expo-image';
import { Radius } from '@/constants/layout';
import { assetUrl } from '@/utils/format';
import { Icon } from '@/components/ui/Icon';

// Soft neutral brand blurhash
const DEFAULT_BLURHASH = 'L5H2EC=PM+yV0g-mq.wG9c010J}Z';

export interface AppImageProps extends Omit<ImageProps, 'source'> {
  source: string | { uri: string } | number | null | undefined;
  aspectRatio?: number;
  borderRadius?: number;
  className?: string;
}

export function AppImage({
  source,
  aspectRatio,
  borderRadius = Radius.brand,
  contentFit = 'cover',
  transition = 300,
  placeholder = DEFAULT_BLURHASH,
  className = '',
  style,
  ...rest
}: AppImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Normalize and qualify image URI through assetUrl
  let normalizedSource: ImageProps['source'] = undefined;
  if (typeof source === 'string') {
    const qualified = assetUrl(source);
    normalizedSource = qualified ? { uri: qualified } : undefined;
  } else if (source && typeof source === 'object' && 'uri' in source) {
    const qualified = assetUrl(source.uri);
    normalizedSource = qualified ? { uri: qualified } : undefined;
  } else if (typeof source === 'number') {
    normalizedSource = source;
  }

  return (
    <View
      style={[styles.container, { borderRadius }, aspectRatio ? { aspectRatio } : undefined]}
      className={`bg-muted overflow-hidden ${className}`}
    >
      {normalizedSource && !hasError ? (
        <Image
          source={normalizedSource}
          contentFit={contentFit}
          transition={transition}
          placeholder={placeholder}
          cachePolicy="memory-disk"
          onLoadStart={() => setIsLoading(true)}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          style={[StyleSheet.absoluteFill, style]}
          {...rest}
        />
      ) : (
        <View style={styles.fallbackContainer}>
          <Icon name="ShoppingBag" size={24} color="#0b6234" />
        </View>
      )}

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#0b6234" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  fallbackContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#edf3e8',
  },
});

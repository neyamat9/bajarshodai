import React, { useEffect } from 'react';
import { ViewProps, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Radius } from '@/constants/layout';

export interface SkeletonProps extends ViewProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  className?: string;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = Radius.brand,
  className = '',
  style,
  ...rest
}: SkeletonProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.9, {
        duration: 800,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
        },
        animatedStyle,
        style,
      ]}
      className={`bg-muted ${className}`}
      {...rest}
    />
  );
}

/**
 * Convenience composite skeleton for text lines
 */
export function SkeletonText({
  lines = 2,
  lineHeight = 14,
  gap = 6,
}: {
  lines?: number;
  lineHeight?: number;
  gap?: number;
}) {
  return (
    <Animated.View style={{ gap }}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} height={lineHeight} width={index === lines - 1 ? '60%' : '100%'} />
      ))}
    </Animated.View>
  );
}

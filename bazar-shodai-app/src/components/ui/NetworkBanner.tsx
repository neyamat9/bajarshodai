import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function NetworkBanner() {
  const insets = useSafeAreaInsets();
  const [isOffline, setIsOffline] = useState(false);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let wasDisconnected = false;

    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = state.isConnected === false;
      setIsOffline(offline);

      if (offline) {
        wasDisconnected = true;
        setShowRestored(false);
      } else if (wasDisconnected && state.isConnected === true) {
        setShowRestored(true);
        wasDisconnected = false;
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          setShowRestored(false);
        }, 3000);
      }
    });

    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!isOffline && !showRestored) {
    return null;
  }

  const isRestored = !isOffline && showRestored;

  return (
    <View
      style={[
        styles.banner,
        { paddingTop: Math.max(insets.top, 8) },
        isRestored ? styles.bannerRestored : styles.bannerOffline,
      ]}
    >
      <Text style={styles.text}>
        {isRestored ? '✓ Internet connection restored' : '⚡ Offline Mode - Showing cached catalog'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingBottom: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerOffline: {
    backgroundColor: '#d92d20', // tomato / destructive
  },
  bannerRestored: {
    backgroundColor: '#0b6234', // brand-deep / success
  },
  text: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

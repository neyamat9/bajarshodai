import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function CategoryDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  useEffect(() => {
    if (slug === 'medicine' || slug?.includes('medicine')) {
      router.replace('/pharmacy');
    } else {
      router.replace({
        pathname: '/(tabs)/categories',
        params: { category: slug || '' },
      });
    }
  }, [router, slug]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
      <ActivityIndicator size="large" color="#0b6234" />
    </View>
  );
}

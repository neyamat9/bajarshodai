import React from 'react';
import { Tabs } from 'expo-router/tabs';
import { TabBar } from '@/navigation/TabBar';
import { useAppTheme } from '@/components/theme/ThemeProvider';

export default function TabsLayout() {
  const { colors } = useAppTheme();

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarAccessibilityLabel: 'Home Tab',
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarAccessibilityLabel: 'Categories Tab',
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarAccessibilityLabel: 'Cart Tab',
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'Wishlist',
          tabBarAccessibilityLabel: 'Wishlist Tab',
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarAccessibilityLabel: 'Account Tab',
        }}
      />
    </Tabs>
  );
}


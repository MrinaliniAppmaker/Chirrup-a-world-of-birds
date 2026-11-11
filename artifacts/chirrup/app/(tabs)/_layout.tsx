import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { sans } from '@/constants/fonts';

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="create">
        <NativeTabs.Trigger.Icon sf={{ default: 'pencil.and.outline', selected: 'pencil.and.outline' }} />
        <NativeTabs.Trigger.Label>Create</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="library">
        <NativeTabs.Trigger.Icon sf={{ default: 'books.vertical', selected: 'books.vertical.fill' }} />
        <NativeTabs.Trigger.Label>Library</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';
  return (
    <Tabs
      screenListeners={{ tabPress: () => { Haptics.selectionAsync().catch(() => {}); } }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarLabelStyle: { fontFamily: sans.medium, fontSize: 11 },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          ),
      }}
    >
      <Tabs.Screen name="index" options={{
        title: 'Home',
        tabBarButtonTestID: 'tab-home',
        tabBarAccessibilityLabel: 'Home',
        tabBarIcon: ({ color }) => isIOS ? <SymbolView name="house" tintColor={color as string} size={24} /> : <Feather name="home" size={22} color={color as string} />,
      }} />
      <Tabs.Screen name="create" options={{
        title: 'Create',
        tabBarButtonTestID: 'tab-create',
        tabBarAccessibilityLabel: 'Create a bird',
        tabBarIcon: ({ color }) => isIOS ? <SymbolView name="pencil.and.outline" tintColor={color as string} size={24} /> : <Feather name="feather" size={22} color={color as string} />,
      }} />
      <Tabs.Screen name="library" options={{
        title: 'Library',
        tabBarButtonTestID: 'tab-library',
        tabBarAccessibilityLabel: 'Library, your saved birds',
        tabBarIcon: ({ color }) => isIOS ? <SymbolView name="books.vertical" tintColor={color as string} size={24} /> : <Feather name="book-open" size={22} color={color as string} />,
      }} />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) return <NativeTabLayout />;
  return <ClassicTabLayout />;
}

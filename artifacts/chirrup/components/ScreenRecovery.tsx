import React from 'react';
import { Platform, Text, View } from 'react-native';
import type { ErrorBoundaryProps } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { sans, serif } from '@/constants/fonts';

/** Retry just the failed route, leaving the auth and journal providers mounted. */
export function ScreenRecovery({ retry }: ErrorBoundaryProps) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const retryScreen = async () => {
    if (__DEV__) {
      try {
        const { default: LogBox } = await import('@expo/log-box/LogBox');
        // Dismiss the error the user just acknowledged, not future errors.
        LogBox.clearAllLogs();
      } catch {
        // Development-overlay cleanup must never prevent route recovery.
      }
    }
    await retry();
  };
  return (
    <View testID="screen-recovery" style={{ flex: 1, justifyContent: 'center', backgroundColor: c.background, paddingHorizontal: 24, paddingTop: Platform.OS === 'web' ? 67 : insets.top, paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom }}>
      <Text style={{ fontFamily: serif, fontSize: 26, color: c.foreground }}>This screen hit a problem</Text>
      <Text style={{ fontFamily: sans.regular, fontSize: 15, lineHeight: 22, color: c.mutedForeground, marginTop: 12, marginBottom: 20 }}>Try this screen again without restarting Chirrup. You do not need to log out.</Text>
      <Button testID="screen-recovery-retry" label="Try this screen again" icon="refresh-cw" onPress={() => { void retryScreen(); }} />
    </View>
  );
}

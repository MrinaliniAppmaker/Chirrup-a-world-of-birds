import React, { useState } from 'react';
import { Linking, Platform, StyleSheet, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Button } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { sans } from '@/constants/fonts';

export function LegalLinks() {
  const c = useColors();
  const [error, setError] = useState<string | null>(null);
  const open = async (page: 'privacy' | 'delete-account') => {
    setError(null);
    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      if (!domain) throw new Error('Missing backend domain');
      const url = `https://${domain}/api/legal/${page}`;
      if (Platform.OS === 'web') await Linking.openURL(url);
      else await WebBrowser.openBrowserAsync(url);
    } catch {
      setError('Could not open this page. Check your connection and try again.');
    }
  };
  return (
    <View style={[s.container, { borderTopColor: c.border }]}>
      <Button testID="legal-privacy" label="Privacy policy" icon="shield" variant="ghost" onPress={() => { void open('privacy'); }} />
      <Button testID="legal-delete-account" label="Request account deletion" icon="user-x" variant="ghost" onPress={() => { void open('delete-account'); }} />
      {error ? <Text accessibilityRole="alert" style={[s.error, { color: c.destructive }]}>{error}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  container: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, marginTop: 24 },
  error: { fontFamily: sans.regular, fontSize: 13, lineHeight: 19, textAlign: 'center' },
});

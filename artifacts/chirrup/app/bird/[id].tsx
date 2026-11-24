import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BirdProfile, Button } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { useCollection } from '@/context/CollectionContext';
export { ScreenRecovery as ErrorBoundary } from '@/components/ScreenRecovery';
import { Feather } from '@expo/vector-icons';
import { sans, serif } from '@/constants/fonts';

export default function BirdDetail() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { get, remove, loaded, error, syncError, syncing } = useCollection();
  const [deleting, setDeleting] = useState<boolean>(false);
  const bird = get(String(id));

  const doDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await remove(String(id));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      router.navigate('/library');
    } catch { /* syncError is displayed below the profile. */ }
    finally { setDeleting(false); }
  };
  const confirmDelete = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Remove this bird from your account journal on all devices? This cannot be undone.')) doDelete();
      return;
    }
    Alert.alert('Remove this bird?', 'It will be deleted from your account journal on all devices. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: doDelete },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <Stack.Screen options={{ title: bird?.name ?? 'Journal entry', headerRight: () => (
        <Pressable testID="detail-home" accessibilityRole="button" accessibilityLabel="Back to home" hitSlop={10} onPress={() => router.navigate('/')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, paddingHorizontal: 4 }}>
          <Feather name="home" size={18} color={c.primary} />
          <Text style={{ fontFamily: sans.medium, fontSize: 14, color: c.primary }}>Home</Text>
        </Pressable>
      ) }} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }} contentInsetAdjustmentBehavior="automatic">
        {bird ? (
          <>
            <BirdProfile bird={bird} />
            {error || syncError ? <Text accessibilityRole="alert" style={{ color: c.destructive, marginTop: 16 }}>{error ?? syncError}</Text> : null}
            <Button testID="detail-back-library" label="Back to library" icon="arrow-left" variant="outline" onPress={() => router.navigate('/library')} style={{ marginTop: 28 }} />
            <Button testID="delete-bird" label={deleting ? 'Removing…' : 'Remove from journal'} icon="trash-2" variant="danger" disabled={deleting} onPress={confirmDelete} style={{ marginTop: 10 }} />
          </>
        ) : loaded && !syncing ? (
          <View style={s.missing}>
            <Text style={[s.title, { color: c.foreground }]}>This page is missing.</Text>
            <Button testID="missing-back" label="Back to home" icon="home" variant="outline" onPress={() => router.navigate('/')} style={{ marginTop: 16 }} />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  missing: { alignItems: 'center', paddingTop: 80 },
  title: { fontFamily: serif, fontSize: 22 },
});

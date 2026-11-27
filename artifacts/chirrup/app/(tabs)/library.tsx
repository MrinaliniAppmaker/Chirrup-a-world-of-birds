import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button, Eyebrow, tap } from '@/components/ui';
import { ChirrupBrand } from '@/components/ChirrupBrand';
import { useColors } from '@/hooks/useColors';
import { useCollection } from '@/context/CollectionContext';
import { sans, serif } from '@/constants/fonts';
import { MAX_BIRDS } from '@/lib/collectionStorage';
import { FieldInput } from '@/components/FieldInput';
export { ScreenRecovery as ErrorBoundary } from '@/components/ScreenRecovery';

export const displayName = (n?: string) => (n && n.trim() ? n.trim() : 'Unnamed bird');

export default function LibraryScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { birds, loaded, error, syncing, syncError, retrySync } = useCollection();
  const [q, setQ] = useState<string>('');
  // Tabs retain their screens. Clear the filter when this route loses focus,
  // not on typing, collection refreshes or ordinary component rerenders.
  useFocusEffect(useCallback(() => {
    return () => setQ('');
  }, []));
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 + 84 : insets.bottom + 90;

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return birds;
    return birds.filter((b) => [b.name, b.scientificName, b.habitat, b.tagline].join(' ').toLowerCase().includes(t));
  }, [birds, q]);

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <View style={[s.header, { paddingTop: topPad + 8, borderBottomColor: c.border }]}>
        <ChirrupBrand size={24} />
        <Eyebrow style={{ marginTop: 18 }}>Your library</Eyebrow>
        <Text accessibilityRole="header" style={[s.h1, { color: c.foreground }]}>Field journal</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          <Button testID="library-interactions" label="Interactions" icon="users" variant="outline" onPress={() => router.push('/interactions')} style={{ flex: 1, paddingHorizontal: 10 }} />
          <Button testID="library-share-birds" label="Share birds" icon="share-2" variant="outline" onPress={() => router.push('/share-birds')} style={{ flex: 1, paddingHorizontal: 10 }} />
        </View>
        <View style={s.filterRow}>
          <View style={[s.countPill, { backgroundColor: c.primary }]}>
            <Text testID="library-count" style={{ fontFamily: sans.medium, fontSize: 12, color: c.primaryForeground }}>{'All birds \u00b7 ' + birds.length}</Text>
          </View>
          <Text testID="library-capacity" style={{ fontFamily: sans.regular, fontSize: 12, color: c.mutedForeground }}>{`${birds.length} / ${MAX_BIRDS} birds`}</Text>
        </View>
        <View style={[s.search, { backgroundColor: c.card, borderColor: c.input, borderRadius: c.radius }]}>
          <Feather name="search" size={16} color={c.mutedForeground} />
          <FieldInput testID="search" value={q} onChangeText={setQ} placeholder="Find a bird in your collection" accessibilityLabel="Search your collection" placeholderTextColor={c.mutedForeground}
            style={[s.searchInput, { color: c.foreground }]} returnKeyType="search" clearButtonMode="while-editing" />
        </View>
        <View testID="journal-sync-status" style={s.syncRow} accessibilityLiveRegion="polite">
          <Feather name={syncError ? 'cloud-off' : 'cloud'} size={14} color={syncError ? c.destructive : c.mutedForeground} />
          <Text style={[s.syncText, { color: syncError ? c.destructive : c.mutedForeground }]}>
            {syncing ? 'Syncing your account journal…' : syncError ?? 'Private journal, saved to your account.'}
          </Text>
          <Pressable testID="retry-journal-sync" accessibilityRole="button"
            accessibilityLabel={syncing ? 'Journal sync in progress' : 'Retry journal sync'}
            disabled={syncing} onPress={() => { void retrySync(); }}
            style={[s.syncAction, { opacity: syncing ? 0.4 : 1 }]}>
            <Feather name="refresh-cw" size={17} color={c.primary} />
          </Pressable>
        </View>
      </View>
      {error ? <Text style={[s.err, { color: c.destructive }]}>{error}</Text> : null}
      {!loaded ? (
        <View style={{ padding: 20, gap: 12 }}>
          {[0, 1, 2].map((i) => <View key={i} style={{ height: 96, backgroundColor: c.muted, borderRadius: c.radius }} />)}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ padding: 20, paddingBottom: bottomPad, gap: 12, flexGrow: 1 }}
          keyboardDismissMode="none"
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable testID={'bird-' + item.id} accessibilityRole="button" accessibilityLabel={'Open ' + displayName(item.name)}
              onPress={() => { tap(); router.push({ pathname: '/bird/[id]', params: { id: item.id } }); }}
              style={({ pressed }) => [s.row, { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius + 2, opacity: pressed ? 0.85 : 1 }]}>
              <Image source={{ uri: item.imageUri }} style={[s.thumb, { borderRadius: c.radius, backgroundColor: c.secondary }]} resizeMode="cover" />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={[s.name, { color: c.foreground }]}>{displayName(item.name)}</Text>
                <Text numberOfLines={1} style={[s.sci, { color: c.mutedForeground }]}>{item.scientificName}</Text>
                <Text numberOfLines={2} style={[s.tag, { color: c.mutedForeground }]}>{item.tagline}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={c.mutedForeground} />
            </Pressable>
          )}
          ListEmptyComponent={
            birds.length === 0 ? (
              <View style={s.empty}>
                <View style={[s.emptyIcon, { backgroundColor: c.secondary }]}><Feather name="book-open" size={28} color={c.primary} /></View>
                <Text style={[s.emptyTitle, { color: c.foreground }]}>No birds yet. Who will you discover first?</Text>
                <Text style={[s.emptyBody, { color: c.mutedForeground }]}>Start with a body shape, then bring a new bird to life, feather by feather.</Text>
                <Button testID="empty-create" label="Create a bird" icon="arrow-right" onPress={() => router.navigate('/create')} style={{ marginTop: 16, alignSelf: 'stretch' }} />
              </View>
            ) : (
              <View style={s.empty}>
                <Text style={[s.emptyTitle, { color: c.foreground }]}>{'No birds match "' + q + '".'}</Text>
                <Button testID="clear-search" label="Clear search" variant="ghost" onPress={() => setQ('')} />
              </View>
            )
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  h1: { fontFamily: serif, fontSize: 30, lineHeight: 36, marginTop: 4 },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  countPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, paddingHorizontal: 12, marginTop: 12, minHeight: 44 },
  searchInput: { flex: 1, fontFamily: sans.regular, fontSize: 15, paddingVertical: 10 },
  syncRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  syncText: { flex: 1, fontFamily: sans.regular, fontSize: 12, lineHeight: 17 },
  syncAction: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  err: { fontFamily: sans.medium, fontSize: 13, paddingHorizontal: 20, paddingTop: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, padding: 10 },
  thumb: { width: 76, height: 76 },
  name: { fontFamily: serif, fontSize: 18 },
  sci: { fontFamily: serif, fontStyle: 'italic', fontSize: 13, marginTop: 1 },
  tag: { fontFamily: sans.regular, fontSize: 12, lineHeight: 16, marginTop: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 12 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontFamily: serif, fontSize: 22, textAlign: 'center' },
  emptyBody: { fontFamily: sans.regular, fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 8 },
});

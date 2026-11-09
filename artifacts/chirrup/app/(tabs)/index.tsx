import React, { useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Button, Eyebrow, tap } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { useCollection } from '@/context/CollectionContext';
import { sans, serif } from '@/constants/fonts';

export default function HomeScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { birds, loaded, error } = useCollection();
  const [q, setQ] = useState<string>('');
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
        <View style={s.brandRow}>
          <Feather name="feather" size={18} color={c.primary} />
          <Text style={[s.brand, { color: c.foreground }]}>Chirrup</Text>
          <Text style={[s.brandSub, { color: c.mutedForeground }]}>FIELD STUDIO</Text>
        </View>
        <Eyebrow style={{ marginTop: 18 }}>Your living collection</Eyebrow>
        <Text accessibilityRole="header" style={[s.h1, { color: c.foreground }]}>A world of birds of your creation</Text>
        <Text style={[s.intro, { color: c.mutedForeground }]}>Dream up a bird. Discover its world. Every species you imagine is kept here, on this device.</Text>
        <Button testID="home-create" label="Create a bird" icon="plus" onPress={() => { tap(); router.navigate('/create'); }} style={{ marginTop: 16 }} />
        <View style={s.filterRow}>
          <View style={[s.countPill, { backgroundColor: c.primary }]}>
            <Text style={{ fontFamily: sans.medium, fontSize: 12, color: c.primaryForeground }}>{`All birds · ${birds.length}`}</Text>
          </View>
          <Text style={{ fontFamily: sans.regular, fontSize: 12, color: c.mutedForeground }}>Recently created</Text>
        </View>
        <View style={[s.search, { backgroundColor: c.card, borderColor: c.input, borderRadius: c.radius }]}>
          <Feather name="search" size={16} color={c.mutedForeground} />
          <TextInput testID="search" value={q} onChangeText={setQ} placeholder="Find a bird in your collection" accessibilityLabel="Search your collection" placeholderTextColor={c.mutedForeground}
            style={[s.searchInput, { color: c.foreground }]} returnKeyType="search" clearButtonMode="while-editing" />
        </View>
      </View>
      {error && <Text style={[s.err, { color: c.destructive }]}>{error}</Text>}
      {!loaded ? (
        <View style={{ padding: 20, gap: 12 }}>
          {[0, 1, 2].map((i) => <View key={i} style={{ height: 96, backgroundColor: c.muted, borderRadius: c.radius }} />)}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ padding: 20, paddingBottom: bottomPad, gap: 12, flexGrow: 1 }}
          keyboardDismissMode="on-drag"
          renderItem={({ item }) => (
            <Pressable testID={`bird-${item.id}`} accessibilityRole="button" accessibilityLabel={`Open ${item.name}`}
              onPress={() => { tap(); router.push(`/bird/${item.id}`); }}
              style={({ pressed }) => [s.row, { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius + 2, opacity: pressed ? 0.85 : 1 }]}>
              <Image source={{ uri: item.imageUri }} style={[s.thumb, { borderRadius: c.radius, backgroundColor: c.secondary }]} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={[s.name, { color: c.foreground }]}>{item.name}</Text>
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
                <Text style={[s.emptyTitle, { color: c.foreground }]}>No birds match "{q}".</Text>
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
  h1: { fontFamily: serif, fontSize: 32, lineHeight: 38, marginTop: 6 },
  intro: { fontFamily: sans.regular, fontSize: 15, lineHeight: 22, marginTop: 8 },
  brandRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  brand: { fontFamily: serif, fontSize: 24 },
  brandSub: { fontFamily: sans.medium, fontSize: 9, letterSpacing: 1.2 },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  countPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, paddingHorizontal: 12, marginTop: 12, minHeight: 44 },
  searchInput: { flex: 1, fontFamily: sans.regular, fontSize: 15, paddingVertical: 10 },
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

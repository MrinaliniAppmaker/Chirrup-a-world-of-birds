import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCollection } from '@/context/CollectionContext';
import { useColors } from '@/hooks/useColors';
import { sans, serif } from '@/constants/fonts';
import { tap } from '@/components/ui';

const nameOf = (n?: string) => (n && n.trim() ? n.trim() : 'Unnamed bird');

export function LibraryShelf() {
  const c = useColors();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { birds, loaded } = useCollection();
  const [open, setOpen] = useState(false);
  const edge = Math.round(Math.min(width, height) / 10);
  const count = birds.length;
  const label = !loaded ? 'Opening library...' : count + (count === 1 ? ' bird' : ' birds') + ' in library';
  return (
    <View style={[s.wrap, { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius + 2 }]}>
      <Pressable testID="profile-library-toggle" accessibilityRole="button" accessibilityState={{ expanded: open }}
        accessibilityLabel={label + (open ? ', hide list' : ', show list')} disabled={!loaded || count === 0}
        onPress={() => { tap(); setOpen((o) => !o); }} style={({ pressed }) => [s.head, { opacity: pressed ? 0.8 : 1 }]}>
        <View style={[s.icon, { backgroundColor: c.secondary }]}><Feather name="book-open" size={16} color={c.primary} /></View>
        <Text testID="profile-library-count" style={[s.count, { color: c.foreground }]}>{label}</Text>
        {loaded && count > 0 ? <Feather name={open ? 'chevron-up' : 'chevron-down'} size={18} color={c.mutedForeground} /> : null}
      </Pressable>
      {open && count > 0 ? (
        <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }}>
          {birds.map((b) => (
            <Pressable key={b.id} testID={'profile-library-bird-' + b.id} accessibilityRole="button" accessibilityLabel={'Open ' + nameOf(b.name)}
              onPress={() => { tap(); router.push({ pathname: '/bird/[id]', params: { id: b.id } }); }}
              style={({ pressed }) => [s.row, { backgroundColor: pressed ? c.muted : 'transparent' }]}>
              <Image source={{ uri: b.imageUri }} style={{ width: edge, height: edge, borderRadius: 4, backgroundColor: c.secondary }} resizeMode="cover" />
              <Text numberOfLines={1} style={[s.name, { color: c.foreground }]}>{nameOf(b.name)}</Text>
              <Feather name="chevron-right" size={16} color={c.mutedForeground} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingHorizontal: 14 },
  icon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  count: { flex: 1, fontFamily: serif, fontSize: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44, paddingHorizontal: 14, paddingVertical: 4 },
  name: { flex: 1, fontFamily: sans.medium, fontSize: 15 },
});

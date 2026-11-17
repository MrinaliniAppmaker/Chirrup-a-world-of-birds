import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { TraitOption } from '@/constants/traits';
import { sans } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import { TraitTile, tap } from './ui';

export function TraitChoiceGrid({ options, selected, onSelect, trait, detailed, onMore, moreOpen }: {
  options: TraitOption[];
  selected: string;
  onSelect: (id: string) => void;
  trait: string;
  detailed?: boolean;
  onMore?: () => void;
  moreOpen?: boolean;
}) {
  const c = useColors();
  const cells: (TraitOption | null)[] = [...options, ...(onMore ? [null] : [])];
  const rows = Array.from({ length: Math.ceil(cells.length / 3) }, (_, row) => cells.slice(row * 3, row * 3 + 3));
  return <View style={{ gap: 8 }}>
    {rows.map((row, i) => <View key={i} style={styles.row}>
      {row.map((option) => option ? (
        <TraitTile key={option.id} option={option} selected={selected === option.id} detailed={detailed}
          testID={`trait-${trait}-${option.id}`} onPress={() => onSelect(option.id)} />
      ) : (
        <Pressable key="waterbirds" testID="more-waterbird-beaks" accessibilityRole="button"
          accessibilityLabel="Waterbird beaks" accessibilityState={{ expanded: moreOpen }}
          onPress={() => { tap(); onMore?.(); }}
          style={({ pressed }) => [styles.more, { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius, opacity: pressed ? 0.8 : 1 }]}>
          <Feather name={moreOpen ? 'minus' : 'plus'} size={25} color={c.primary} />
          <Text style={[styles.label, { color: c.foreground }]}>Waterbird beaks</Text>
          <Text style={[styles.description, { color: c.mutedForeground }]}>{moreOpen ? 'Hide specialist profiles' : 'Open specialist profiles'}</Text>
        </Pressable>
      ))}
      {Array.from({ length: 3 - row.length }, (_, empty) => <View key={`empty-${empty}`} style={{ flex: 1 }} />)}
    </View>)}
  </View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  more: { flex: 1, minHeight: 122, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 10, gap: 7, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: sans.regular, fontSize: 12, textAlign: 'center' },
  description: { fontFamily: sans.regular, fontSize: 10, lineHeight: 14, textAlign: 'center' },
});

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Chip, tap } from './ui';
import type { TraitOption } from '@/constants/traits';
import { useColors } from '@/hooks/useColors';
import { sans } from '@/constants/fonts';
import { FootDiagram, FOOT_CAPTIONS } from './FootDiagram';

function FootCard({ option, selected, onPress, testID }: { option: TraitOption; selected: boolean; onPress: () => void; testID: string }) {
  const c = useColors();
  const info = FOOT_CAPTIONS[option.id];
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${option.label}${info ? `. ${info.a11y}` : ''}`}
      onPress={() => { tap(); onPress(); }}
      style={({ pressed }) => [s.card, {
        borderRadius: c.radius,
        backgroundColor: selected ? c.accent : c.card,
        borderColor: selected ? c.primary : c.border,
        opacity: pressed ? 0.85 : 1,
      }]}
    >
      <FootDiagram id={option.id} selected={selected} />
      <Text numberOfLines={1} style={[s.label, { color: selected ? c.primary : c.foreground, fontFamily: selected ? sans.semibold : sans.medium }]}>{option.label}</Text>
      {info ? <Text numberOfLines={2} style={[s.caption, { color: c.mutedForeground }]}>{info.caption}</Text> : null}
    </Pressable>
  );
}

export function TraitOptionStrip({ trait, options, selected, onSelect }: {
  trait: 'legs' | 'feet';
  options: TraitOption[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const c = useColors();
  return (
    <View>
      {trait === 'feet' ? <Text style={[s.guide, { color: c.mutedForeground }]}>View from below · forward is up</Text> : null}
    <ScrollView
      testID={`${trait}-options`}
      horizontal
      nestedScrollEnabled
      directionalLockEnabled
      showsHorizontalScrollIndicator
      persistentScrollbar
      keyboardShouldPersistTaps="handled"
      style={s.strip}
      contentContainerStyle={s.options}
    >
      {options.map((option) => trait === 'feet' ? (
        <FootCard key={option.id} testID={`trait-${trait}-${option.id}`} option={option}
          selected={selected === option.id} onPress={() => onSelect(option.id)} />
      ) : (
        <Chip key={option.id} testID={`trait-${trait}-${option.id}`}
          label={option.label} selected={selected === option.id} onPress={() => onSelect(option.id)} />
      ))}
    </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  strip: { minWidth: 0 },
  options: { gap: 8, alignItems: 'center', minHeight: 64, paddingVertical: 12, paddingHorizontal: 2 },
  guide: { fontFamily: sans.regular, fontSize: 12, lineHeight: 17 },
  card: { width: 124, minHeight: 135, borderWidth: 1, alignItems: 'center', justifyContent: 'flex-start', gap: 3, paddingHorizontal: 6, paddingTop: 8, paddingBottom: 8 },
  label: { fontSize: 12, textAlign: 'center' },
  caption: { fontFamily: sans.regular, fontSize: 11, lineHeight: 14, textAlign: 'center' },
});

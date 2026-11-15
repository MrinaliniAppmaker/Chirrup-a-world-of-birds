import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Chip } from './ui';
import type { TraitOption } from '@/constants/traits';

export function TraitOptionStrip({ trait, options, selected, onSelect }: {
  trait: 'legs' | 'feet';
  options: TraitOption[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
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
      {options.map((option) => (
        <Chip key={option.id} testID={`trait-${trait}-${option.id}`}
          label={option.label} selected={selected === option.id} onPress={() => onSelect(option.id)} />
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  strip: { minWidth: 0 },
  options: { gap: 8, alignItems: 'center', minHeight: 64, paddingVertical: 12, paddingHorizontal: 2 },
});

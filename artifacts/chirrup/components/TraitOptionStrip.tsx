import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Chip } from './ui';
import { useColors } from '@/hooks/useColors';
import type { TraitOption } from '@/constants/traits';

export function TraitOptionStrip({ trait, options, selected, onSelect }: {
  trait: 'legs' | 'feet';
  options: TraitOption[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const c = useColors();
  const scroll = useRef<ScrollViewInstance>(null);
  const [layout, setLayout] = useState({ width: 0, content: 0, offset: 0 });
  const end = Math.max(0, layout.content - layout.width);
  const move = (direction: number) => {
    const x = Math.max(0, Math.min(end, layout.offset + direction * Math.max(120, layout.width * 0.85)));
    scroll.current?.scrollTo({ x, animated: true });
  };
  return (
    <View style={s.row}>
      {([-1, 1] as const).map((direction) => {
        const disabled = direction === -1 ? layout.offset <= 2 : layout.offset >= end - 2;
        const button = (
          <Pressable
            key={direction}
            testID={`${trait}-scroll-${direction === -1 ? 'back' : 'forward'}`}
            accessibilityRole="button"
            accessibilityLabel={`Scroll ${trait} options ${direction === -1 ? 'left' : 'right'}`}
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={() => move(direction)}
            style={({ pressed }) => [s.arrow, {
              borderRadius: c.radius, borderColor: c.border, backgroundColor: c.card,
              opacity: disabled ? 0.3 : pressed ? 0.65 : 1,
            }]}
          >
            <Feather name={direction === -1 ? 'chevron-left' : 'chevron-right'} size={22} color={c.primary} />
          </Pressable>
        );
        return direction === -1 ? (
          <React.Fragment key={direction}>
            {button}
            <ScrollView
              ref={scroll}
              testID={`${trait}-options`}
              horizontal
              nestedScrollEnabled
              directionalLockEnabled
              showsHorizontalScrollIndicator
              keyboardShouldPersistTaps="handled"
              scrollEventThrottle={32}
              onLayout={(event) => {
                const width = event.nativeEvent.layout.width;
                setLayout((current) => ({ ...current, width }));
              }}
              onContentSizeChange={(content) => setLayout((current) => ({ ...current, content }))}
              onScroll={(event) => {
                const offset = event.nativeEvent.contentOffset.x;
                setLayout((current) => ({ ...current, offset }));
              }}
              style={s.strip}
              contentContainerStyle={s.options}
            >
              {options.map((option) => (
                <Chip key={option.id} testID={`trait-${trait}-${option.id}`}
                  label={option.label} selected={selected === option.id} onPress={() => onSelect(option.id)} />
              ))}
            </ScrollView>
          </React.Fragment>
        ) : button;
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  arrow: { width: 44, height: 48, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  strip: { flex: 1, minWidth: 0 },
  options: { gap: 8, alignItems: 'center', minHeight: 64, paddingVertical: 12, paddingHorizontal: 2 },
});

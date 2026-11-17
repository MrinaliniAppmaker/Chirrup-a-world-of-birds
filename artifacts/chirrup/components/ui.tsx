import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { GeneratedBird } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { sans, serif } from '@/constants/fonts';
import { TRAIT_LABELS, TraitKey, TraitOption } from '@/constants/traits';
import { TraitIllustration } from './TraitIllustration';
import { VISUAL_TRAIT_IMAGES } from '@/constants/visualTraits';

export const tap = () => { Haptics.selectionAsync().catch(() => {}); };

export function Eyebrow({ children, style }: { children: React.ReactNode; style?: object }) {
  const c = useColors();
  return <Text style={[{ fontFamily: sans.semibold, fontSize: 11, letterSpacing: 1.2, color: c.primary, textTransform: 'uppercase' }, style]}>{children}</Text>;
}

export function Button({ label, onPress, variant = 'primary', icon, loading, disabled, testID, style }: {
  label: string; onPress: () => void; variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  icon?: keyof typeof Feather.glyphMap; loading?: boolean; disabled?: boolean; testID?: string; style?: ViewStyle;
}) {
  const c = useColors();
  const bg = variant === 'primary' ? c.primary : variant === 'danger' ? c.destructive : 'transparent';
  const fg = variant === 'primary' || variant === 'danger' ? c.primaryForeground : c.primary;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled || !!loading }}
      disabled={disabled || loading}
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); onPress(); }}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: bg, borderRadius: c.radius, borderColor: variant === 'outline' ? c.primary : 'transparent', opacity: disabled ? 0.45 : pressed ? 0.8 : 1 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : (
        <>
          <Text style={[s.btnText, { color: fg }]}>{label}</Text>
          {icon ? <Feather name={icon} size={16} color={fg} /> : null}
        </>
      )}
    </Pressable>
  );
}

export function TraitTile({ option, selected, onPress, testID, detailed = false }: { option: TraitOption; selected: boolean; onPress: () => void; testID?: string; detailed?: boolean }) {
  const c = useColors();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${option.label}${option.description ? `. ${option.description}` : ''}`}
      onPress={() => { tap(); onPress(); }}
      style={({ pressed }) => [s.tile, detailed && { minHeight: 122, paddingHorizontal: 7 }, {
        borderRadius: c.radius,
        backgroundColor: selected ? c.accent : c.card,
        borderColor: selected ? c.primary : c.border,
        opacity: pressed ? 0.85 : 1,
      }]}
    >
      {option.swatch ? (
        <View style={s.swatches}>
          {option.swatch.map((h) => <View key={h} style={[s.swatch, { backgroundColor: h }]} />)}
        </View>
      ) : VISUAL_TRAIT_IMAGES[option.illustration ?? ''] ? (
        <Image source={VISUAL_TRAIT_IMAGES[option.illustration ?? '']} resizeMode="contain" tintColor={c.primary} style={{ width: 72, height: 44 }} />
      ) : (
        <TraitIllustration name={option.illustration ?? ''} />
      )}
      <View style={[s.tileLabelRow, { justifyContent: 'center' }]}>
        {selected ? <Feather name="check" size={11} color={c.primary} /> : null}
        <Text numberOfLines={2} style={[s.tileLabel, { flexShrink: 1, textAlign: 'center', color: selected ? c.primary : c.foreground, fontFamily: selected ? sans.semibold : sans.regular }]}>{option.label}</Text>
      </View>
      {detailed && option.description ? <Text style={{ fontFamily: sans.regular, fontSize: 10, lineHeight: 14, textAlign: 'center', color: c.mutedForeground }}>{option.description}</Text> : null}
    </Pressable>
  );
}

export function Chip({ label, selected, onPress, testID }: { label: string; selected: boolean; onPress: () => void; testID?: string }) {
  const c = useColors();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={() => { tap(); onPress(); }}
      style={[s.chip, { borderRadius: c.radius, backgroundColor: selected ? c.primary : c.secondary, borderColor: selected ? c.primary : c.secondary }]}
    >
      <Text style={{ fontFamily: sans.medium, fontSize: 13, color: selected ? c.primaryForeground : c.secondaryForeground }}>{label}</Text>
    </Pressable>
  );
}

export function BirdProfile({ bird }: { bird: GeneratedBird }) {
  const c = useColors();
  const sections: [string, string][] = [
    ['Appearance', bird.appearance],
    ['Habitat', bird.habitat],
    ['Diet', bird.diet],
    ['Behaviour', bird.behavior],
  ];
  return (
    <View>
      <View style={[s.photoWrap, { borderRadius: c.radius + 4, backgroundColor: c.secondary }]}>
        <Image source={{ uri: bird.imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" accessibilityLabel={bird.name ? `Generated illustration of ${bird.name}` : 'Your generated bird illustration'} />
        <View style={[s.badge, { backgroundColor: 'rgba(31,42,34,0.78)' }]}>
          <Text style={[s.badgeText, { color: c.primaryForeground }]}>AI-generated image of an imagined species</Text>
        </View>
      </View>
      {bird.name ? <Text style={[s.name, { color: c.foreground }]}>{bird.name}</Text> : null}
      {bird.scientificName ? <Text style={[s.sci, { color: c.mutedForeground }]}>{bird.scientificName}</Text> : null}
      {bird.tagline ? <Text style={[s.tagline, { color: c.foreground }]}>{bird.tagline}</Text> : null}

      <View style={[s.notice, { backgroundColor: c.secondary, borderRadius: c.radius }]}>
        <Feather name="info" size={14} color={c.secondaryForeground} />
        <Text style={[s.noticeText, { color: c.secondaryForeground }]}>An imagined bird. These field notes are invention, not scientific fact.</Text>
      </View>

      {sections.map(([title, body]) => (
        <View key={title} style={[s.section, { borderTopColor: c.border }]}>
          <Eyebrow>{title}</Eyebrow>
          <Text style={[s.body, { color: c.foreground }]}>{body}</Text>
        </View>
      ))}

      <View style={[s.section, { borderTopColor: c.border }]}>
        <Eyebrow>Built from</Eyebrow>
        <View style={{ marginTop: 8, gap: 6 }}>
          {(Object.keys(TRAIT_LABELS) as TraitKey[]).map((k) => (
            <View key={k} style={s.traitRow}>
              <Text style={[s.traitKey, { color: c.mutedForeground }]}>{TRAIT_LABELS[k]}</Text>
              <Text style={[s.traitVal, { color: c.foreground }]}>{bird.traits[k]}</Text>
            </View>
          ))}
          {bird.traits.extra ? (
            <View style={s.traitRow}>
              <Text style={[s.traitKey, { color: c.mutedForeground }]}>Extra</Text>
              <Text style={[s.traitVal, { color: c.foreground }]}>{bird.traits.extra}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  btn: { minHeight: 50, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1 },
  btnText: { fontFamily: sans.semibold, fontSize: 15 },
  tile: { flex: 1, minHeight: 84, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 4, paddingVertical: 10 },
  tileLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  tileLabel: { fontSize: 12 },
  swatches: { flexDirection: 'row', gap: 3 },
  swatch: { width: 16, height: 16, borderRadius: 2 },
  chip: { paddingHorizontal: 14, minHeight: 40, justifyContent: 'center', borderWidth: 1 },
  photoWrap: { width: '100%', aspectRatio: 1, overflow: 'hidden' },
  badge: { position: 'absolute', left: 10, top: 10, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 4 },
  badgeText: { fontFamily: sans.medium, fontSize: 11 },
  name: { fontFamily: serif, fontSize: 30, marginTop: 18, lineHeight: 36 },
  sci: { fontFamily: serif, fontStyle: 'italic', fontSize: 16, marginTop: 2 },
  tagline: { fontFamily: sans.regular, fontSize: 15, lineHeight: 22, marginTop: 10 },
  notice: { flexDirection: 'row', gap: 8, padding: 12, marginTop: 16, alignItems: 'flex-start' },
  noticeText: { flex: 1, fontFamily: sans.medium, fontSize: 13, lineHeight: 18 },
  section: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14, marginTop: 16 },
  body: { fontFamily: sans.regular, fontSize: 15, lineHeight: 23, marginTop: 6 },
  traitRow: { flexDirection: 'row', gap: 12 },
  traitKey: { width: 72, fontFamily: sans.medium, fontSize: 13 },
  traitVal: { flex: 1, fontFamily: sans.regular, fontSize: 13, lineHeight: 18 },
});

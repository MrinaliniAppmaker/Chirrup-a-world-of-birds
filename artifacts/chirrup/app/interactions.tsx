import React, { useMemo, useState } from 'react';
import { Image, ImageSourcePropType, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSimulateEncounter } from '@workspace/api-client-react';
import type { EncounterBird, GeneratedEncounter } from '@workspace/api-client-react';
import { Button, Eyebrow, tap } from '@/components/ui';
import { ChirrupBrand } from '@/components/ChirrupBrand';
import { useColors } from '@/hooks/useColors';
import { useCollection } from '@/context/CollectionContext';
import { sans, serif } from '@/constants/fonts';
import { DEFAULT_BIRD_ID, DEFAULT_MALLARD, MALLARD_IMAGE } from '@/constants/defaultBird';
import { portraitReference } from '@/lib/portraitReference';
import type { PortraitSource } from '@/lib/portraitReference';

const MIN = 2;
const MAX = 6;

type Candidate = { id: string; name: string; sub: string; image: ImageSourcePropType; portrait: PortraitSource; isReference: boolean; payload: Omit<EncounterBird, 'referenceImage'> };

export default function InteractionsScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { birds, loaded } = useCollection();
  const sim = useSimulateEncounter();
  const [picked, setPicked] = useState<string[]>([]);
  const [result, setResult] = useState<GeneratedEncounter | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom + 24;

  const candidates = useMemo<Candidate[]>(() => {
    const ref: Candidate = { id: DEFAULT_BIRD_ID, name: DEFAULT_MALLARD.name, sub: 'Reference species \u00b7 ' + DEFAULT_MALLARD.scientificName, image: MALLARD_IMAGE, portrait: MALLARD_IMAGE, isReference: true,
      payload: { id: DEFAULT_MALLARD.id, name: DEFAULT_MALLARD.name, traits: DEFAULT_MALLARD.traits, appearance: DEFAULT_MALLARD.appearance, habitat: DEFAULT_MALLARD.habitat, diet: DEFAULT_MALLARD.diet, behavior: DEFAULT_MALLARD.behavior } };
    const mine: Candidate[] = birds.map((b) => {
      const name = b.name && b.name.trim() ? b.name.trim() : 'Unnamed bird';
      return { id: b.id, name, sub: b.scientificName, image: { uri: b.imageUri }, portrait: b.imageUri, isReference: false,
        payload: { id: b.id, name, traits: b.traits, appearance: b.appearance, habitat: b.habitat, diet: b.diet, behavior: b.behavior } };
    });
    return [ref, ...mine];
  }, [birds]);

  // Derived reconciliation: ids no longer in the collection drop out without effects.
  const valid = useMemo(() => picked.filter((id) => candidates.some((x) => x.id === id)), [picked, candidates]);
  const selected = useMemo(() => valid.map((id) => candidates.find((x) => x.id === id)!).filter(Boolean), [valid, candidates]);
  const pending = preparing || sim.isPending;
  const canRun = loaded && !pending && valid.length >= MIN && valid.length <= MAX;

  const toggle = (id: string) => {
    if (pending) return;
    tap();
    setPicked((prev) => {
      const cur = prev.filter((p) => candidates.some((x) => x.id === p));
      if (cur.includes(id)) return cur.filter((p) => p !== id);
      if (cur.length >= MAX) return cur;
      return [...cur, id];
    });
  };

  const run = async () => {
    if (!canRun) return;
    setError(null);
    setPreparing(true);
    try {
      const birds: EncounterBird[] = [];
      for (const candidate of selected) {
        birds.push({ ...candidate.payload, referenceImage: await portraitReference(candidate.portrait) });
      }
      const out = await sim.mutateAsync({ data: { birds } });
      setResult(out);
    } catch {
      setError('The encounter could not be imagined just now. Your birds are still selected; try again.');
    } finally {
      setPreparing(false);
    }
  };

  const changeBirds = () => { tap(); setResult(null); setError(null); };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.background }} contentContainerStyle={{ paddingTop: topPad + 8, paddingHorizontal: 20, paddingBottom: bottomPad }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <ChirrupBrand size={24} />
        <Button testID="interactions-library" label="Library" icon="arrow-left" variant="ghost" onPress={() => router.navigate('/library')} />
      </View>
      <Eyebrow style={{ marginTop: 18 }}>Interactions</Eyebrow>
      <Text accessibilityRole="header" style={[s.h1, { color: c.foreground }]}>{result ? result.title : 'Let their worlds meet.'}</Text>

      {result ? (
        <View testID="encounter-result">
          <View style={[s.notice, { backgroundColor: c.accent, borderRadius: c.radius }]}>
            <Feather name="info" size={14} color={c.primary} />
            <Text style={[s.noticeText, { color: c.accentForeground }]}>Imagined scene. Not a real observation or prediction of behavior.</Text>
          </View>
          <Image testID="encounter-image" source={{ uri: result.imageUri }} style={[s.scene, { borderRadius: c.radius + 2, backgroundColor: c.secondary }]} resizeMode="cover" accessibilityLabel={'Illustrated scene: ' + result.title} />
          <Text style={[s.meta, { color: c.mutedForeground }]}>{'Setting \u00b7 ' + result.habitat}</Text>
          <Text style={[s.body, { color: c.foreground }]}>{result.summary}</Text>
          <Text style={[s.meta, { color: c.mutedForeground, marginTop: 14 }]}>{'With ' + selected.map((x) => x.name).join(', ')}</Text>
          <Eyebrow style={{ marginTop: 22, marginBottom: 8 }}>Five imagined minutes</Eyebrow>
          {result.minutes.slice(0, 5).map((m, i) => (
            <View key={m.minute + '-' + i} testID={'minute-' + m.minute} style={[s.minute, { borderLeftColor: c.primary }]}>
              <Text style={[s.minuteNo, { color: c.primary }]}>{'Minute ' + m.minute}</Text>
              <Text style={[s.minuteTitle, { color: c.foreground }]}>{m.title}</Text>
              <Text style={[s.minuteBody, { color: c.mutedForeground }]}>{m.description}</Text>
            </View>
          ))}
          {error ? <Text style={[s.err, { color: c.destructive }]}>{error}</Text> : null}
          <View style={{ gap: 10, marginTop: 20 }}>
            <Button testID="simulate-again" label="Imagine again" icon="refresh-cw" loading={pending} disabled={!canRun} onPress={run} />
            <Button testID="change-birds" label="Change birds" variant="outline" disabled={pending} onPress={changeBirds} />
            <Button testID="back-library" label="Back to library" variant="ghost" onPress={() => router.navigate('/library')} />
          </View>
        </View>
      ) : (
        <View>
          <Text style={[s.body, { color: c.mutedForeground }]}>Choose two to six birds. The Mallard is a real reference species and is never added to your library.</Text>
          <View style={s.countRow}>
            <View style={[s.pill, { backgroundColor: c.primary }]}><Text testID="selected-count" style={[s.pillText, { color: c.primaryForeground }]}>{valid.length + ' of ' + MAX + ' selected'}</Text></View>
            {valid.length > 0 ? <Pressable testID="clear-selection" accessibilityRole="button" disabled={pending} onPress={() => { tap(); setPicked([]); }}><Text style={[s.link, { color: c.primary }]}>Clear</Text></Pressable> : null}
          </View>
          {!loaded ? (
            <View style={{ gap: 10, marginTop: 14 }}>{[0, 1, 2].map((i) => <View key={i} style={{ height: 72, backgroundColor: c.muted, borderRadius: c.radius }} />)}</View>
          ) : (
            <View style={{ gap: 10, marginTop: 14 }}>
              {candidates.map((x) => {
                const on = valid.includes(x.id);
                const full = !on && valid.length >= MAX;
                return (
                  <Pressable key={x.id} testID={'pick-' + x.id} accessibilityRole="checkbox" accessibilityState={{ checked: on, disabled: full || pending }} accessibilityLabel={x.name}
                    disabled={full || pending} onPress={() => toggle(x.id)}
                    style={({ pressed }) => [s.row, { backgroundColor: on ? c.accent : c.card, borderColor: on ? c.primary : c.border, borderRadius: c.radius + 2, opacity: full ? 0.45 : pressed ? 0.85 : 1 }]}>
                    <Image source={x.image} style={[s.thumb, { borderRadius: c.radius, backgroundColor: c.secondary }]} resizeMode="cover" />
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={[s.name, { color: c.foreground }]}>{x.name}</Text>
                      <Text numberOfLines={1} style={[s.sub, { color: c.mutedForeground }]}>{x.sub}</Text>
                      {x.isReference ? <View style={[s.refTag, { borderColor: c.chestnut }]}><Text style={[s.refText, { color: c.chestnut }]}>REFERENCE BIRD</Text></View> : null}
                    </View>
                    <View style={[s.check, { borderColor: on ? c.primary : c.input, backgroundColor: on ? c.primary : 'transparent' }]}>
                      {on ? <Feather name="check" size={14} color={c.primaryForeground} /> : null}
                    </View>
                  </Pressable>
                );
              })}
              {birds.length === 0 ? (
                <View style={[s.emptyBox, { borderColor: c.border, borderRadius: c.radius + 2 }]}>
                  <Text style={[s.body, { color: c.mutedForeground, marginTop: 0 }]}>Your library is empty. Create a bird to bring it alongside the Mallard.</Text>
                  <Button testID="interactions-create" label="Create a bird" variant="outline" icon="plus" onPress={() => router.navigate('/create')} style={{ marginTop: 12 }} />
                </View>
              ) : null}
            </View>
          )}
          {error ? (
            <View testID="encounter-error" style={[s.errBox, { borderColor: c.destructive, borderRadius: c.radius }]}>
              <Text style={[s.err, { color: c.destructive, marginTop: 0 }]}>{error}</Text>
            </View>
          ) : null}
          <Button testID="simulate" label={pending ? 'Imagining the encounter' : error ? 'Retry encounter' : 'Imagine five minutes'} icon="play" loading={pending} disabled={!canRun} onPress={run} style={{ marginTop: 18 }} />
          {valid.length < MIN ? <Text style={[s.meta, { color: c.mutedForeground, textAlign: 'center' }]}>{'Select ' + (MIN - valid.length) + ' more to begin.'}</Text> : null}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  h1: { fontFamily: serif, fontSize: 30, lineHeight: 36, marginTop: 4 },
  body: { fontFamily: sans.regular, fontSize: 15, lineHeight: 22, marginTop: 8 },
  meta: { fontFamily: sans.medium, fontSize: 12, marginTop: 10 },
  countRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  pillText: { fontFamily: sans.medium, fontSize: 12 },
  link: { fontFamily: sans.semibold, fontSize: 13, padding: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, padding: 10 },
  thumb: { width: 56, height: 56 },
  name: { fontFamily: serif, fontSize: 17 },
  sub: { fontFamily: serif, fontStyle: 'italic', fontSize: 12, marginTop: 1 },
  refTag: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 99, paddingHorizontal: 6, paddingVertical: 1, marginTop: 4 },
  refText: { fontFamily: sans.semibold, fontSize: 9, letterSpacing: 1 },
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  emptyBox: { borderWidth: 1, borderStyle: 'dashed', padding: 14 },
  errBox: { borderWidth: 1, padding: 12, marginTop: 14 },
  err: { fontFamily: sans.medium, fontSize: 13, lineHeight: 18, marginTop: 10 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, marginTop: 12 },
  noticeText: { flex: 1, fontFamily: sans.medium, fontSize: 12, lineHeight: 16 },
  scene: { width: '100%', aspectRatio: 4 / 3, marginTop: 14 },
  minute: { borderLeftWidth: 2, paddingLeft: 12, paddingVertical: 6, marginBottom: 10 },
  minuteNo: { fontFamily: sans.semibold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  minuteTitle: { fontFamily: serif, fontSize: 17, marginTop: 2 },
  minuteBody: { fontFamily: sans.regular, fontSize: 14, lineHeight: 20, marginTop: 2 },
});

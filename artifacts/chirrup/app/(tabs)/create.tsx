import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Image } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useGenerateBird, type BirdTraits, type GeneratedBird } from '@workspace/api-client-react';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { BirdProfile, Button, Chip, Eyebrow, TraitTile, tap } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { useCollection } from '@/context/CollectionContext';
import { sans, serif } from '@/constants/fonts';
import { FEET_OPTIONS, LEG_OPTIONS, TRAIT_GROUPS, TRAIT_LABELS, TraitKey } from '@/constants/traits';

type Step = 'build' | 'review' | 'result';
type Mode = 'visual' | 'typed';
const KEYS: TraitKey[] = ['body', 'beak', 'colors', 'feathers', 'legs', 'feet'];
const DEFAULT_SEL: Record<TraitKey, string> = { body: 'songbird', beak: 'conical', colors: 'olive', feathers: 'flight', legs: 'short-pink', feet: 'perching' };
const EMPTY_TYPED: Record<TraitKey, string> = { body: '', beak: '', colors: '', feathers: '', legs: '', feet: '' };

function optionFor(key: TraitKey, id: string) {
  if (key === 'legs') return LEG_OPTIONS.find((o) => o.id === id);
  if (key === 'feet') return FEET_OPTIONS.find((o) => o.id === id);
  return TRAIT_GROUPS.find((g) => g.key === key)?.options.find((o) => o.id === id);
}

export default function CreateScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { save, isSaved } = useCollection();
  const generate = useGenerateBird();

  const [step, setStep] = useState<Step>('build');
  const [mode, setMode] = useState<Mode>('visual');
  const [sel, setSel] = useState<Record<TraitKey, string>>(DEFAULT_SEL);
  const [typed, setTyped] = useState<Record<TraitKey, string>>(EMPTY_TYPED);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showExtra, setShowExtra] = useState<boolean>(false);
  const [extra, setExtra] = useState<string>('');
  const [bird, setBird] = useState<GeneratedBird | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 + 84 : insets.bottom + 90;

  const traits: BirdTraits = Object.fromEntries(
    KEYS.map((k) => [k, mode === 'typed' ? typed[k].trim() : optionFor(k, sel[k])?.value ?? '']),
  ) as unknown as BirdTraits;
  if (extra.trim()) traits.extra = extra.trim();
  const filled = KEYS.filter((k) => (traits[k] as string).length > 0).length;
  const ready = filled === 6;

  const goTo = (s: Step) => { setStep(s);  };

  const runGenerate = async () => {
    setSaveError(null);
    goTo('result');
    try {
      const result = await generate.mutateAsync({ data: traits });
      setBird(result);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  };

  const reset = () => {
    setSel(DEFAULT_SEL); setTyped(EMPTY_TYPED); setExtra(''); setShowExtra(false);
    setBird(null); generate.reset(); goTo('build');
  };

  const onSave = async () => {
    if (!bird) return;
    setSaving(true); setSaveError(null);
    try {
      await save(bird);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {
      setSaveError('Could not save to your journal. Try again.');
    } finally { setSaving(false); }
  };

  const stepIndex = step === 'build' ? 0 : step === 'review' ? 1 : 2;

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <View style={[st.header, { paddingTop: topPad + 8, borderBottomColor: c.border, backgroundColor: c.background }]}>
        <View style={st.topRow}>
          <Pressable testID="back-home" accessibilityRole="button" accessibilityLabel="Back to home" hitSlop={8}
            onPress={() => { tap(); router.navigate('/'); }}
            style={({ pressed }) => [st.homeBtn, { borderColor: c.border, borderRadius: c.radius, opacity: pressed ? 0.7 : 1 }]}>
            <Feather name="arrow-left" size={16} color={c.foreground} />
            <Text style={{ fontFamily: sans.medium, fontSize: 13, color: c.foreground }}>Home</Text>
          </Pressable>
          <View style={st.brandRow}>
            <Text style={[st.brand, { color: c.foreground }]}>Chirrup</Text>
            <Text style={[st.brandSub, { color: c.mutedForeground }]}>FIELD STUDIO</Text>
          </View>
        </View>
        <View style={st.steps}>
          {['Shape & features', 'Review', 'Meet your bird'].map((label, i) => (
            <View key={label} style={[st.stepItem, { borderBottomColor: i <= stepIndex ? c.primary : c.border }]}>
              <View style={[st.stepDot, { backgroundColor: i <= stepIndex ? c.primary : c.muted }]}>
                <Text style={{ fontFamily: sans.semibold, fontSize: 10, color: i <= stepIndex ? c.primaryForeground : c.mutedForeground }}>{i + 1}</Text>
              </View>
              <Text numberOfLines={1} style={{ flexShrink: 1, fontFamily: i === stepIndex ? sans.semibold : sans.regular, fontSize: 12, color: i === stepIndex ? c.foreground : c.mutedForeground }}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      <KeyboardAwareScrollViewCompat
        key={step}
        contentContainerStyle={{ padding: 20, paddingBottom: bottomPad }}
        bottomOffset={24}
        contentInsetAdjustmentBehavior="never"
      >
        {step === 'build' && (
          <View>
            <Eyebrow>Create / Visual builder</Eyebrow>
            <Text style={[st.h1, { color: c.foreground }]}>Begin with a shape. Make it yours.</Text>
            <Text style={[st.lede, { color: c.mutedForeground }]}>Build a believable bird, from its silhouette to the smallest feather.</Text>

            <View style={[st.refWrap, { borderRadius: c.radius + 4 }]}>
              <Image source={require('@/assets/images/woodland-bird.jpeg')} style={{ width: '100%', height: '100%' }} resizeMode="cover" accessibilityLabel="Reference photograph of a woodland songbird" />
              <View style={st.refBadge}>
                <Text style={st.refBadgeText}>Reference bird · not your creation</Text>
              </View>
            </View>
            <View style={st.refCaption}>
              <Text style={[st.refTitle, { color: c.foreground }]}>A woodland bird, for scale.</Text>
              <View style={[st.pill, { backgroundColor: c.secondary }]}>
                <Text style={{ fontFamily: sans.medium, fontSize: 12, color: c.secondaryForeground }}>{filled} of 6 traits</Text>
              </View>
            </View>
            <Text style={[st.small, { color: c.mutedForeground }]}>A real photograph to think with. Your bird is drawn only after you generate.</Text>

            <View style={[st.segment, { backgroundColor: c.muted, borderRadius: c.radius + 2 }]}>
              {(['visual', 'typed'] as Mode[]).map((m) => (
                <Pressable key={m} testID={`mode-${m}`} accessibilityRole="tab" accessibilityState={{ selected: mode === m }}
                  onPress={() => { tap(); setMode(m); }}
                  style={[st.segBtn, { borderRadius: c.radius, backgroundColor: mode === m ? c.card : 'transparent' }]}>
                  <Text style={{ fontFamily: mode === m ? sans.semibold : sans.regular, fontSize: 14, color: mode === m ? c.foreground : c.mutedForeground }}>
                    {m === 'visual' ? 'Choose visually' : 'Type your traits'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {mode === 'visual' ? (
              <View>
                {TRAIT_GROUPS.map((g, gi) => {
                  const open = !!expanded[g.key];
                  const opts = open ? g.options : g.options.slice(0, 3);
                  const rows: typeof opts[] = [];
                  for (let i = 0; i < opts.length; i += 3) rows.push(opts.slice(i, i + 3));
                  return (
                    <View key={g.key} style={st.group}>
                      <View style={st.groupHead}>
                        <Text style={[st.groupTitle, { color: c.foreground }]}>
                          <Text style={{ color: c.mutedForeground }}>{`0${gi + 1}  `}</Text>{g.title}
                          <Text style={{ color: c.mutedForeground, fontFamily: sans.regular }}>{`  ·  ${g.hint}`}</Text>
                        </Text>
                        <Pressable testID={`more-${g.key}`} hitSlop={12} onPress={() => { tap(); setExpanded({ ...expanded, [g.key]: !open }); }}>
                          <Text style={[st.more, { color: c.primary }]}>{open ? 'Less' : 'More +'}</Text>
                        </Pressable>
                      </View>
                      <View style={{ gap: 8 }}>
                        {rows.map((row, ri) => (
                          <View key={ri} style={st.tileRow}>
                            {row.map((o) => (
                              <TraitTile key={o.id} testID={`trait-${g.key}-${o.id}`} option={o} selected={sel[g.key] === o.id} onPress={() => setSel({ ...sel, [g.key]: o.id })} />
                            ))}
                          </View>
                        ))}
                      </View>
                    </View>
                  );
                })}
                {([['legs', 'Legs', LEG_OPTIONS], ['feet', 'Feet', FEET_OPTIONS]] as const).map(([key, title, opts], i) => (
                  <View key={key} style={st.group}>
                    <Text style={[st.groupTitle, { color: c.foreground, marginBottom: 10 }]}>
                      <Text style={{ color: c.mutedForeground }}>{`0${i + 5}  `}</Text>{title}
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                      {opts.map((o) => (
                        <Chip key={o.id} testID={`trait-${key}-${o.id}`} label={o.label} selected={sel[key] === o.id} onPress={() => setSel({ ...sel, [key]: o.id })} />
                      ))}
                    </ScrollView>
                  </View>
                ))}
              </View>
            ) : (
              <View style={{ marginTop: 18, gap: 14 }}>
                {KEYS.map((k, i) => (
                  <View key={k}>
                    <Text style={[st.label, { color: c.foreground }]}>{`0${i + 1}  ${TRAIT_LABELS[k]}`}</Text>
                    <TextInput
                      testID={`input-${k}`}
                      value={typed[k]}
                      onChangeText={(t) => setTyped({ ...typed, [k]: t })}
                      placeholder={optionFor(k, DEFAULT_SEL[k])?.value}
                      placeholderTextColor={c.mutedForeground}
                      maxLength={120}
                      returnKeyType="next"
                      style={[st.input, { borderColor: c.input, backgroundColor: c.card, color: c.foreground, borderRadius: c.radius }]}
                    />
                  </View>
                ))}
              </View>
            )}

            <View style={[st.extraRow, { borderTopColor: c.border }]}>
              <Pressable testID="toggle-extra" hitSlop={10} onPress={() => { tap(); setShowExtra(!showExtra); }}>
                <Text style={[st.more, { color: c.primary }]}>{showExtra ? '− Hide extra traits' : '+ More traits: tail, wings & markings'}</Text>
              </Pressable>
              <Pressable testID="reset" hitSlop={10} onPress={() => { tap(); setSel(DEFAULT_SEL); setTyped(EMPTY_TYPED); setExtra(''); }}>
                <Text style={[st.more, { color: c.mutedForeground }]}>Reset</Text>
              </Pressable>
            </View>
            {showExtra && (
              <TextInput
                testID="input-extra"
                value={extra}
                onChangeText={setExtra}
                placeholder="e.g. forked tail, white wing bars, a faint eye-ring"
                placeholderTextColor={c.mutedForeground}
                multiline
                maxLength={500}
                style={[st.input, st.textarea, { borderColor: c.input, backgroundColor: c.card, color: c.foreground, borderRadius: c.radius }]}
              />
            )}

            <Button testID="to-review" label="Review chosen details" icon="arrow-right" disabled={!ready} onPress={() => goTo('review')} style={{ marginTop: 24 }} />
            {!ready && <Text style={[st.small, { color: c.mutedForeground, textAlign: 'center', marginTop: 8 }]}>Fill all six traits to continue.</Text>}
          </View>
        )}

        {step === 'review' && (
          <View>
            <Eyebrow>Step 2 / Review details</Eyebrow>
            <Text style={[st.h1, { color: c.foreground }]}>Your field sketch, in words.</Text>
            <Text style={[st.lede, { color: c.mutedForeground }]}>Check each trait. We will imagine a species that could plausibly carry them all.</Text>
            <View style={[st.reviewCard, { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius + 2 }]}>
              {KEYS.map((k, i) => (
                <View key={k} style={[st.reviewRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}>
                  <Text style={[st.reviewKey, { color: c.mutedForeground }]}>{TRAIT_LABELS[k]}</Text>
                  <Text style={[st.reviewVal, { color: c.foreground }]}>{traits[k] as string}</Text>
                </View>
              ))}
              {traits.extra ? (
                <View style={[st.reviewRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}>
                  <Text style={[st.reviewKey, { color: c.mutedForeground }]}>Extra</Text>
                  <Text style={[st.reviewVal, { color: c.foreground }]}>{traits.extra}</Text>
                </View>
              ) : null}
            </View>
            <Button testID="generate" label="Imagine this bird" icon="feather" onPress={runGenerate} style={{ marginTop: 24 }} />
            <Button testID="back-to-build" label="Adjust traits" variant="ghost" onPress={() => goTo('build')} style={{ marginTop: 6 }} />
          </View>
        )}

        {step === 'result' && (
          <View>
            {generate.isPending && <GeneratingState />}
            {generate.isError && (
              <View style={[st.errorBox, { borderColor: c.destructive, borderRadius: c.radius + 2, backgroundColor: c.card }]}>
                <Feather name="cloud-off" size={26} color={c.destructive} />
                <Text style={[st.h2, { color: c.foreground }]}>The sketch didn't come through.</Text>
                <Text style={[st.lede, { color: c.mutedForeground, textAlign: 'center' }]}>Something went wrong while imagining your bird. Your traits are kept.</Text>
                <Button testID="retry" label="Try again" icon="refresh-cw" onPress={runGenerate} style={{ alignSelf: 'stretch', marginTop: 8 }} />
                <Button testID="error-back" label="Back to review" variant="ghost" onPress={() => { generate.reset(); goTo('review'); }} style={{ alignSelf: 'stretch' }} />
              </View>
            )}
            {generate.isSuccess && bird && (
              <View>
                <Eyebrow style={{ marginBottom: 12 }}>Step 3 / Meet your bird</Eyebrow>
                <BirdProfile bird={bird} />
                {saveError && <Text style={[st.small, { color: c.destructive, marginTop: 16 }]}>{saveError}</Text>}
                {isSaved(bird.id) ? (
                  <Button testID="view-library" label="Saved · open in journal" icon="book-open" variant="outline" onPress={() => router.push(`/bird/${bird.id}`)} style={{ marginTop: 24 }} />
                ) : (
                  <Button testID="save-bird" label="Save to my journal" icon="bookmark" loading={saving} onPress={onSave} style={{ marginTop: 24 }} />
                )}
                <Button testID="regenerate" label="Imagine again with same traits" variant="outline" onPress={runGenerate} style={{ marginTop: 10 }} />
                <Button testID="start-over" label="Start a new bird" variant="ghost" onPress={reset} style={{ marginTop: 4 }} />
              </View>
            )}
          </View>
        )}
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

function GeneratingState() {
  const c = useColors();
  const pulse = useRef(new Animated.Value(0.4)).current;
  const [line, setLine] = useState<number>(0);
  const lines = ['Sketching the silhouette', 'Mixing feather pigments', 'Writing field notes', 'Naming the species'];
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(pulse, { toValue: 0.4, duration: 900, useNativeDriver: Platform.OS !== 'web' }),
    ]));
    loop.start();
    const t = setInterval(() => setLine((l) => (l + 1) % 4), 3200);
    return () => { loop.stop(); clearInterval(t); };
  }, [pulse]);
  return (
    <View accessibilityLabel="Generating your bird" accessibilityLiveRegion="polite">
      <Eyebrow style={{ marginBottom: 12 }}>Imagining</Eyebrow>
      <Animated.View style={[st.skelImg, { backgroundColor: c.secondary, borderRadius: c.radius + 4, opacity: pulse }]}>
        <Feather name="feather" size={34} color={c.primary} />
      </Animated.View>
      <Text style={[st.h2, { color: c.foreground, marginTop: 18 }]}>{lines[line]}…</Text>
      <Text style={[st.small, { color: c.mutedForeground }]}>Drawing and describing can take up to a minute.</Text>
      {[0.9, 0.6, 0.75].map((w, i) => (
        <Animated.View key={i} style={{ height: 12, width: `${w * 100}%`, backgroundColor: c.muted, borderRadius: 3, marginTop: 12, opacity: pulse }} />
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  header: { paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  homeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, paddingHorizontal: 12, minHeight: 44 },
  brandRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  brand: { fontFamily: serif, fontSize: 24 },
  brandSub: { fontFamily: sans.medium, fontSize: 9, letterSpacing: 1.2 },
  steps: { flexDirection: 'row', marginTop: 10 },
  stepItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 10, borderBottomWidth: 2 },
  stepDot: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  h1: { fontFamily: serif, fontSize: 30, lineHeight: 36, marginTop: 8 },
  h2: { fontFamily: serif, fontSize: 22, lineHeight: 28, textAlign: 'center' },
  lede: { fontFamily: sans.regular, fontSize: 15, lineHeight: 22, marginTop: 8 },
  small: { fontFamily: sans.regular, fontSize: 12, lineHeight: 17, marginTop: 4 },
  refWrap: { width: '100%', aspectRatio: 4 / 3, overflow: 'hidden', marginTop: 20 },
  refBadge: { position: 'absolute', left: 10, top: 10, backgroundColor: 'rgba(31,42,34,0.8)', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 4 },
  refBadgeText: { fontFamily: sans.medium, fontSize: 11, color: '#F7F4EC' },
  refCaption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, gap: 8 },
  refTitle: { fontFamily: serif, fontSize: 18, flexShrink: 1 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  segment: { flexDirection: 'row', padding: 4, marginTop: 22 },
  segBtn: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  group: { marginTop: 22 },
  groupHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  groupTitle: { fontFamily: sans.semibold, fontSize: 14, flexShrink: 1 },
  more: { fontFamily: sans.medium, fontSize: 13 },
  tileRow: { flexDirection: 'row', gap: 8 },
  label: { fontFamily: sans.semibold, fontSize: 14, marginBottom: 6 },
  input: { borderWidth: 1, minHeight: 48, paddingHorizontal: 14, fontFamily: sans.regular, fontSize: 15 },
  textarea: { minHeight: 96, paddingTop: 12, textAlignVertical: 'top', marginTop: 10 },
  extraRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, gap: 12 },
  reviewCard: { borderWidth: 1, marginTop: 20 },
  reviewRow: { flexDirection: 'row', padding: 14, gap: 12 },
  reviewKey: { width: 76, fontFamily: sans.medium, fontSize: 13 },
  reviewVal: { flex: 1, fontFamily: sans.regular, fontSize: 14, lineHeight: 20 },
  errorBox: { borderWidth: 1, padding: 20, alignItems: 'center', gap: 8, marginTop: 20 },
  skelImg: { width: '100%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
});

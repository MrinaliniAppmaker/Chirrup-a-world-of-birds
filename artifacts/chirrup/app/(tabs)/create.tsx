import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Image } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { discardCreateRecoveryDraft, discardGuestSignInBird, getCreateRecoveryDraft, keepCreateRecoveryDraft, parkGuestBirdForSignIn, takeGuestBirdSignInReturn } from '@/lib/createRecovery';
import { SymbolView } from 'expo-symbols';
import { useCheckBirdTraits, useGenerateBird, type BirdTraitCheck, type BirdTraitIssue, type BirdTraits, type GeneratedBird } from '@workspace/api-client-react';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { FieldInput } from '@/components/FieldInput';
import { TraitValidationFeedback } from '@/components/TraitValidationFeedback';
import { traitInputRanges } from '@/lib/traitHighlights';
import { stageInteractionBird } from '@/lib/interactionDraft';
import { BirdNameDialog } from '@/components/BirdNameDialog';
import { BirdProfile, Button, Eyebrow, tap } from '@/components/ui';
import { TraitChoiceGrid } from '@/components/TraitChoiceGrid';
import { TraitOptionStrip } from '@/components/TraitOptionStrip';
import { ChirrupBrand } from '@/components/ChirrupBrand';
import { ReportContent } from '@/components/ReportContent';
import { birdReportContent } from '@/lib/reportContent';
import { useColors } from '@/hooks/useColors';
import { useCollection } from '@/context/CollectionContext';
import { sans, serif } from '@/constants/fonts';
import { FEET_OPTIONS, LEG_OPTIONS, TRAIT_GROUPS, TRAIT_LABELS, TraitKey, WATERBIRD_BEAK_OPTIONS } from '@/constants/traits';

type Step = 'build' | 'review' | 'result';
export { ScreenRecovery as ErrorBoundary } from '@/components/ScreenRecovery';
type Mode = 'visual' | 'typed';
const KEYS: TraitKey[] = ['body', 'beak', 'colors', 'feathers', 'legs', 'feet'];
const DEFAULT_SEL: Record<TraitKey, string> = { body: 'songbird', beak: 'conical', colors: 'olive', feathers: 'flight', legs: 'short-pink', feet: 'perching' };
const EMPTY_TYPED: Record<TraitKey, string> = { body: '', beak: '', colors: '', feathers: '', legs: '', feet: '' };

function generationFailure(error: unknown) {
  const fallback = 'Something went wrong while imagining your bird. Your traits are kept.';
  if (!error || typeof error !== 'object') return { invalid: false, message: fallback };
  const invalid = 'status' in error && error.status === 400;
  const data: unknown = 'data' in error ? error.data : null;
  const message = data && typeof data === 'object' && 'error' in data && typeof data.error === 'string' ? data.error : fallback;
  return { invalid, message };
}

function optionFor(key: TraitKey, id: string) {
  if (key === 'legs') return LEG_OPTIONS.find((o) => o.id === id);
  if (key === 'feet') return FEET_OPTIONS.find((o) => o.id === id);
  if (key === 'beak') return [...(TRAIT_GROUPS.find((g) => g.key === key)?.options ?? []), ...WATERBIRD_BEAK_OPTIONS].find((o) => o.id === id);
  return TRAIT_GROUPS.find((g) => g.key === key)?.options.find((o) => o.id === id);
}

export default function CreateScreen() {
  const { width } = useWindowDimensions();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const { userId } = useAuth();
  const owner = userId ?? 'guest';
  const recovered = useRef(getCreateRecoveryDraft(owner)).current;
  const { save, isSaved } = useCollection();
  const generate = useGenerateBird();
  const checkTraits = useCheckBirdTraits();
  const { invalid: invalidTraits, message: generationErrorMessage } = generationFailure(generate.error);

  const [step, setStep] = useState<Step>(recovered?.step ?? 'build');
  const [mode, setMode] = useState<Mode>(recovered?.mode ?? 'visual');
  const [sel, setSel] = useState<Record<TraitKey, string>>(recovered?.sel ?? DEFAULT_SEL);
  const [typed, setTyped] = useState<Record<TraitKey, string>>(recovered?.typed ?? EMPTY_TYPED);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(recovered?.expanded ?? {});
  const [showExtra, setShowExtra] = useState<boolean>(recovered?.showExtra ?? false);
  const [extra, setExtra] = useState<string>(recovered?.extra ?? '');
  const [bird, setBird] = useState<GeneratedBird | null>(recovered?.bird ?? null);
  const [birdName, setBirdName] = useState<string>(recovered?.birdName ?? '');
  const [nameDraft, setNameDraft] = useState<string>(recovered?.nameDraft ?? '');
  const [editingName, setEditingName] = useState<boolean>(recovered?.editingName ?? true);
  const [showNameDialog, setShowNameDialog] = useState<boolean>(recovered?.showNameDialog ?? false);
  const [popupName, setPopupName] = useState<string>(recovered?.popupName ?? '');
  const [saving, setSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [traitCheck, setTraitCheck] = useState<{ input: BirdTraits; result: BirdTraitCheck } | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [checkingTraits, setCheckingTraits] = useState(false);
  const checkingLock = useRef<number | null>(null);
  const checkVersion = useRef(0);
  const generationId = useRef(0);
  useLayoutEffect(() => {
    keepCreateRecoveryDraft(owner, {
      step: step === 'result' && !bird ? 'review' : step,
      mode, sel, typed, expanded, showExtra, extra, bird, birdName, nameDraft,
      editingName, showNameDialog, popupName,
    });
  }, [owner, step, mode, sel, typed, expanded, showExtra, extra, bird, birdName, nameDraft, editingName, showNameDialog, popupName]);
  useFocusEffect(useCallback(() => {
    const draft = takeGuestBirdSignInReturn(owner);
    if (!draft) return;
    setStep(draft.step); setMode(draft.mode); setSel(draft.sel); setTyped(draft.typed);
    setExpanded(draft.expanded); setShowExtra(draft.showExtra); setExtra(draft.extra);
    setBird(draft.bird); setBirdName(draft.birdName); setNameDraft(draft.nameDraft);
    setEditingName(draft.editingName); setShowNameDialog(false); setPopupName(draft.popupName);
    setSaveError(null);
  }, [owner]));

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 + 84 : insets.bottom + 90;

  const traits: BirdTraits = Object.fromEntries(
    KEYS.map((k) => [k, mode === 'typed' ? typed[k].trim() : optionFor(k, sel[k])?.value ?? '']),
  ) as unknown as BirdTraits;
  if (extra.trim()) traits.extra = extra.trim();
  const ready = KEYS.every((k) => (traits[k] as string).length > 0);
  const currentIssues = (traitCheck?.result.issues ?? []).filter(
    (issue) => traitCheck?.input[issue.field] === traits[issue.field],
  );
  const issuesFor = (field: BirdTraitIssue['field']) => currentIssues.filter((issue) => issue.field === field);
  const editedTraits = () => { checkVersion.current += 1; setCheckError(null); };

  const goTo = (s: Step) => { setStep(s);  };

  const reviewTraits = async () => {
    if (!ready || checkingLock.current !== null) return;
    setCheckingTraits(true); setCheckError(null);
    const version = ++checkVersion.current;
    checkingLock.current = version;
    const input = { ...traits };
    try {
      const result = await checkTraits.mutateAsync({ data: input });
      if (version !== checkVersion.current) return;
      setTraitCheck({ input, result });
      if (result.valid) goTo('review');
      else if (result.issues.some((issue) => issue.field === 'extra')) setShowExtra(true);
    } catch (error) {
      if (version !== checkVersion.current) return;
      const data = error && typeof error === 'object' && 'data' in error ? error.data : null;
      setCheckError(data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
        ? data.error : "We couldn't check these features. Your text is kept; please try again.");
    } finally {
      if (checkingLock.current === version) {
        checkingLock.current = null;
        setCheckingTraits(false);
      }
    }
  };

  const runGenerate = async () => {
    const requestId = ++generationId.current;
    setSaveError(null);
    setBird(null);
    setBirdName('');
    setNameDraft(''); setEditingName(true); setShowNameDialog(false); setPopupName('');
    goTo('result');
    try {
      const result = await generate.mutateAsync({ data: traits });
      if (requestId !== generationId.current) return;
      setBird({ ...result, name: '' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {
      if (requestId === generationId.current) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  };

  const resetMutation = generate.reset;
  const reset = useCallback(() => {
    if (owner === 'guest') discardGuestSignInBird();
    generationId.current += 1;
    checkVersion.current += 1;
    checkingLock.current = null; setCheckingTraits(false);
    setTraitCheck(null); setCheckError(null);
    setSel(DEFAULT_SEL); setTyped(EMPTY_TYPED); setExtra(''); setShowExtra(false);
    setMode('visual'); setExpanded({}); setSaveError(null); setSaving(false);
    setBird(null); setBirdName(''); setNameDraft(''); setEditingName(true);
    setShowNameDialog(false); setPopupName(''); resetMutation(); setStep('build');
  }, [owner, resetMutation]);

  // Ordinary exits still reset. A completed guest bird alone can be parked for
  // Home -> sign in; it is adopted as the new account's screen mounts.
  const resetOnExit = useRef(reset);
  resetOnExit.current = reset;
  useEffect(() => navigation.addListener('blur', () => {
    const draft = getCreateRecoveryDraft(owner);
    const state = navigation.getState();
    const destination = state?.routes[state.index ?? 0]?.name;
    discardCreateRecoveryDraft(owner);
    resetOnExit.current();
    parkGuestBirdForSignIn(owner, destination, draft);
  }), [navigation, owner]);
  useEffect(() => () => { generationId.current += 1; checkVersion.current += 1; checkingLock.current = null; }, []);

  const commitName = () => {
    const name = nameDraft.trim();
    setBirdName(name);
    if (name) setEditingName(false);
  };

  const onSave = async (requestedName?: string) => {
    if (!bird || saving || isSaved(bird.id)) return;
    const name = (requestedName ?? (editingName ? nameDraft : birdName)).trim();
    if (!name) { setSaveError(null); setShowNameDialog(true); return; }
    setBirdName(name); setNameDraft(name); setEditingName(false);
    const requestId = generationId.current;
    setSaving(true); setSaveError(null);
    try {
      await save({ ...bird, name });
      if (requestId === generationId.current) setShowNameDialog(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (err) {
      if (requestId === generationId.current) setSaveError(err instanceof Error ? err.message : 'Could not save to your journal. Try again.');
    } finally { if (requestId === generationId.current) setSaving(false); }
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
          <ReportContent compact surface="creation" content={bird ? birdReportContent(bird, birdName) : undefined} />
          <ChirrupBrand size={24} showSubtitle={width >= 360} />
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
        keyboardDismissMode="none"
        keyboardShouldPersistTaps="handled"
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
            </View>
            <Text style={[st.small, { color: c.mutedForeground }]}>A real photograph to think with. Your bird is drawn only after you generate.</Text>

            <View style={[st.segment, { backgroundColor: c.muted, borderRadius: c.radius + 2 }]}>
              {(['visual', 'typed'] as Mode[]).map((m) => (
                <Pressable key={m} testID={`mode-${m}`} accessibilityRole="tab" accessibilityState={{ selected: mode === m }}
                  onPress={() => { tap(); editedTraits(); setMode(m); }}
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
                  const waterbirdsOpen = !!expanded['waterbird-beaks'];
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
                      <TraitChoiceGrid trait={g.key} options={opts} selected={sel[g.key]}
                        detailed={open && (g.key === 'body' || g.key === 'beak')}
                        onSelect={(id) => { editedTraits(); setSel((current) => ({ ...current, [g.key]: id })); }}
                        onMore={g.key === 'beak' && open ? () => setExpanded((current) => ({ ...current, 'waterbird-beaks': !current['waterbird-beaks'] })) : undefined}
                        moreOpen={waterbirdsOpen} />
                      {g.key === 'beak' && WATERBIRD_BEAK_OPTIONS.some((o) => o.id === sel.beak) ? (
                        <Text style={[st.small, { marginTop: 8, color: c.primary }]}>Selected: {optionFor('beak', sel.beak)?.label}</Text>
                      ) : null}
                      {g.key === 'beak' && open && waterbirdsOpen ? (
                        <View testID="waterbird-beak-options" style={{ marginTop: 16, gap: 10 }}>
                          <Eyebrow>Waterbird beaks</Eyebrow>
                          <TraitChoiceGrid trait="beak" options={WATERBIRD_BEAK_OPTIONS} selected={sel.beak} detailed
                            onSelect={(id) => { editedTraits(); setSel((current) => ({ ...current, beak: id })); }} />
                        </View>
                      ) : null}
                    </View>
                  );
                })}
                {([['legs', 'Legs', LEG_OPTIONS], ['feet', 'Feet', FEET_OPTIONS]] as const).map(([key, title, opts], i) => (
                  <View key={key} style={st.group}>
                    <Text style={[st.groupTitle, { color: c.foreground, marginBottom: 10 }]}>
                      <Text style={{ color: c.mutedForeground }}>{`0${i + 5}  `}</Text>{title}
                    </Text>
                    <TraitOptionStrip trait={key} options={opts} selected={sel[key]}
                      onSelect={(id) => { editedTraits(); setSel((current) => ({ ...current, [key]: id })); }} />
                  </View>
                ))}
              </View>
            ) : (
              <View style={{ marginTop: 18, gap: 14 }}>
                {KEYS.map((k, i) => (
                  <View key={k}>
                    <Text style={[st.label, { color: c.foreground }]}>{`0${i + 1}  ${TRAIT_LABELS[k]}`}</Text>
                    <FieldInput
                      testID={`input-${k}`}
                      value={typed[k]}
                      highlightRanges={traitInputRanges(typed[k], issuesFor(k))}
                      onChangeText={(t) => { editedTraits(); setTyped((current) => ({ ...current, [k]: t })); }}
                      placeholder={optionFor(k, DEFAULT_SEL[k])?.value}
                      placeholderTextColor={c.mutedForeground}
                      maxLength={120}
                      returnKeyType="next"
                      style={[st.input, { borderColor: issuesFor(k).length ? c.destructive : c.input, backgroundColor: c.card, color: c.foreground, borderRadius: c.radius }]}
                    />
                    <TraitValidationFeedback field={k} issues={issuesFor(k)} />
                  </View>
                ))}
              </View>
            )}

            <View style={[st.extraRow, { borderTopColor: c.border }]}>
              <Pressable testID="toggle-extra" hitSlop={10} onPress={() => { tap(); setShowExtra(!showExtra); }}>
                <Text style={[st.more, { color: c.primary }]}>{showExtra ? '− Hide extra traits' : '+ More traits: tail, wings & markings'}</Text>
              </Pressable>
              <Pressable testID="reset" hitSlop={10} onPress={() => { tap(); editedTraits(); setTraitCheck(null); setSel(DEFAULT_SEL); setTyped(EMPTY_TYPED); setExtra(''); }}>
                <Text style={[st.more, { color: c.mutedForeground }]}>Reset</Text>
              </Pressable>
            </View>
            {showExtra && (
              <FieldInput
                testID="input-extra"
                value={extra}
                highlightRanges={traitInputRanges(extra, issuesFor('extra'))}
                onChangeText={(text) => { editedTraits(); setExtra(text); }}
                placeholder="e.g. forked tail, white wing bars, a faint eye-ring"
                placeholderTextColor={c.mutedForeground}
                multiline
                maxLength={500}
                style={[st.input, st.textarea, { borderColor: issuesFor('extra').length ? c.destructive : c.input, backgroundColor: c.card, color: c.foreground, borderRadius: c.radius }]}
              />
            )}
            {showExtra && <TraitValidationFeedback field="extra" issues={issuesFor('extra')} />}

            {currentIssues.length > 0 && <Text testID="traits-invalid" accessibilityRole="alert" style={[st.small, { color: c.destructive, marginTop: 16 }]}>Please change the highlighted non-bird features before reviewing. Rare bird features and unusual combinations are welcome.</Text>}
            {traitCheck && !traitCheck.result.valid && !traitCheck.result.issues.length && JSON.stringify(traitCheck.input) === JSON.stringify(traits)
              && <Text accessibilityRole="alert" style={[st.small, { color: c.destructive, marginTop: 16 }]}>{traitCheck.result.message}</Text>}
            {checkError && <Text testID="trait-check-error" accessibilityRole="alert" style={[st.small, { color: c.destructive, marginTop: 16 }]}>{checkError}</Text>}
            <Button testID="to-review" label={checkingTraits ? 'Checking bird features…' : 'Review chosen details'} loading={checkingTraits} icon="arrow-right" disabled={!ready} onPress={reviewTraits} style={{ marginTop: 24 }} />
            {!ready && <Text style={[st.small, { color: c.mutedForeground, textAlign: 'center', marginTop: 8 }]}>Fill all six traits to continue.</Text>}
          </View>
        )}

        {step === 'review' && (
          <View>
            <Eyebrow>Step 2 / Review details</Eyebrow>
            <Text style={[st.h1, { color: c.foreground }]}>Your field sketch, in words.</Text>
            <Text style={[st.lede, { color: c.mutedForeground }]}>Check each trait. Unusual combinations are welcome: your choices define this bird, not a real-world species.</Text>
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
                <Feather name={invalidTraits ? 'alert-circle' : 'cloud-off'} size={26} color={c.destructive} />
                <Text style={[st.h2, { color: c.foreground }]}>{invalidTraits ? 'Please change these features.' : "The sketch didn't come through."}</Text>
                <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[st.lede, { color: c.mutedForeground, textAlign: 'center' }]}>{generationErrorMessage}</Text>
                {!invalidTraits && <Button testID="retry" label="Try again" icon="refresh-cw" onPress={runGenerate} style={{ alignSelf: 'stretch', marginTop: 8 }} />}
                <Button testID="error-back" label={invalidTraits ? 'Edit traits' : 'Back to review'} variant="ghost" onPress={() => { generate.reset(); goTo(invalidTraits ? 'build' : 'review'); }} style={{ alignSelf: 'stretch' }} />
              </View>
            )}
            {bird && (
              <View>
                <Eyebrow style={{ marginBottom: 12 }}>Step 3 / Meet your bird</Eyebrow>
                <BirdProfile bird={{ ...bird, name: editingName ? '' : birdName }}
                  onNamePress={!editingName && !isSaved(bird.id) ? () => { setNameDraft(birdName); setEditingName(true); } : undefined}
                  afterImage={editingName && !isSaved(bird.id) ? (
                  <View style={{ marginTop: 18 }}>
                    <Eyebrow style={{ marginBottom: 8 }}>Name your bird</Eyebrow>
                    <FieldInput testID="bird-name" accessibilityLabel="Name your bird" value={nameDraft} onChangeText={setNameDraft}
                      onEditingComplete={commitName} autoFocus={!!birdName}
                      editable={!saving} maxLength={100} placeholderTextColor={c.mutedForeground}
                      style={[st.input, { borderColor: c.input, backgroundColor: c.card, color: c.foreground, borderRadius: c.radius, marginBottom: 16 }]} />
                  </View>
                ) : undefined} />
                {saveError && !showNameDialog && (
                  <View style={{ marginTop: 16 }}>
                    <Text accessibilityRole="alert" style={[st.small, { color: c.destructive }]}>{saveError}</Text>
                    {!userId && <Text testID="guest-bird-reassurance" style={[st.small, { color: c.mutedForeground, marginTop: 6 }]}>Don't worry: This bird won't fly away</Text>}
                  </View>
                )}
                {isSaved(bird.id) ? (
                  <Button testID="view-library" label="Saved · open in journal" icon="book-open" variant="outline" onPress={() => router.push(`/bird/${bird.id}`)} style={{ marginTop: 24 }} />
                ) : (
                  <Button testID="save-bird" label="Save to my journal" icon="bookmark" loading={saving} onPress={() => { void onSave(); }} style={{ marginTop: 24 }} />
                )}
                <Button testID="interact-bird" label="Interact bird" icon="users" variant="outline" disabled={saving}
                  onPress={() => {
                    const token = stageInteractionBird(owner, { ...bird, name: (editingName ? nameDraft : birdName).trim() });
                    router.push({ pathname: '/interactions', params: { draft: token } });
                  }} style={{ marginTop: 10 }} />
                <Button testID="regenerate" label="Imagine again with same traits" variant="outline" onPress={runGenerate} style={{ marginTop: 10 }} />
                <Button testID="start-over" label="Start a new bird" variant="ghost" onPress={reset} style={{ marginTop: 4 }} />
              </View>
            )}
          </View>
        )}
      </KeyboardAwareScrollViewCompat>
      <BirdNameDialog visible={showNameDialog} value={popupName} onChange={setPopupName}
        onCancel={() => { setShowNameDialog(false); setSaveError(null); }}
        onSave={() => { void onSave(popupName); }} saving={saving} error={saveError}
        reassurance={!userId && saveError ? "Don't worry: This bird won't fly away" : undefined} />
    </View>
  );
}

function GeneratingState() {
  const c = useColors();
  const pulse = useRef(new Animated.Value(0.4)).current;
  const [line, setLine] = useState<number>(0);
  const lines = ['Sketching the silhouette', 'Combining your chosen features', 'Mixing feather pigments', 'Writing field notes'];
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
        {Platform.OS === 'ios'
          ? <SymbolView name="pencil.and.outline" tintColor={c.primary} size={34} />
          : <Feather name="feather" size={34} color={c.primary} />}
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

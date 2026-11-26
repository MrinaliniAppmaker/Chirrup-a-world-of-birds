import React, { useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { randomUUID } from 'expo-crypto';
import { useSubmitContentReport, type ContentReportInput } from '@workspace/api-client-react';
import { FieldInput } from './FieldInput';
import { Button } from './ui';
import { useColors } from '@/hooks/useColors';
import { sans, serif } from '@/constants/fonts';
import { noteInputTouch } from '@/lib/inputFocus';
import { portraitReference } from '@/lib/portraitReference';

export type ReportableContent = { id: string; title: string; text: string; imageUri?: string };
const reasons: { value: ContentReportInput['reason']; label: string }[] = [
  { value: 'unsafe', label: 'Unsafe or offensive' },
  { value: 'inaccurate', label: 'Wrong traits or information' },
  { value: 'privacy', label: 'Privacy concern' },
  { value: 'other', label: 'Something else' },
];

export function ReportContent({ content, surface, compact = false }: {
  content?: ReportableContent; surface: ContentReportInput['surface']; compact?: boolean;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const submit = useSubmitContentReport();
  const [snapshot, setSnapshot] = useState<ReportableContent | null>(null);
  const [reason, setReason] = useState<ContentReportInput['reason']>('unsafe');
  const [details, setDetails] = useState('');
  const [includeImage, setIncludeImage] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<string | null>(null);
  const submissionId = useRef('');
  const pending = useRef<ContentReportInput | null>(null);
  const lock = useRef(false);
  const start = () => {
    if (!content || lock.current) return;
    submissionId.current = randomUUID();
    pending.current = null;
    setReason('unsafe'); setDetails(''); setIncludeImage(!!content.imageUri);
    setError(null); setReceipt(null); setSnapshot({ ...content });
  };
  const close = () => { if (!lock.current) setSnapshot(null); };
  const send = async () => {
    if (!snapshot || lock.current) return;
    lock.current = true; setBusy(true); setError(null);
    try {
      // Retry the exact same immutable request after an uncertain network result.
      if (!pending.current) {
        let image: string | undefined;
        if (includeImage && snapshot.imageUri) {
          try { image = await portraitReference(snapshot.imageUri); }
          catch { setError('Could not attach the picture. Retry, or turn off “Include picture” to report the text.'); return; }
        }
        pending.current = {
          submissionId: submissionId.current, surface, reason, details: details.trim(),
          content: { id: snapshot.id.slice(0, 128), title: snapshot.title.slice(0, 200), text: snapshot.text.slice(0, 12000), image },
        };
      }
      const result = await submit.mutateAsync({ data: pending.current });
      if (!result.received) throw new Error('No receipt');
      setReceipt(result.id);
    } catch (err) {
      const data = (err as { data?: { error?: string } })?.data;
      setError(data?.error ?? 'Your report was not confirmed. Your text is kept. Please retry.');
    } finally { lock.current = false; setBusy(false); }
  };
  const retryLocked = !!pending.current;
  return (
    <>
      <Pressable testID={`report-${surface}`} accessibilityRole="button" accessibilityLabel="Report generated content"
        disabled={!content} onPress={start}
        style={({ pressed }) => [s.trigger, { borderColor: c.border, borderRadius: c.radius, opacity: !content ? 0.35 : pressed ? 0.65 : 1 }]}>
        <Feather name="flag" size={16} color={c.primary} />
        {!compact ? <Text style={[s.triggerLabel, { color: c.primary }]}>Report</Text> : null}
      </Pressable>
      <Modal visible={!!snapshot} transparent animationType="fade" onRequestClose={close}>
        <KeyboardAvoidingView enabled={Platform.OS !== 'web'} behavior="padding" style={{ flex: 1 }}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: c.foreground, opacity: 0.45 }]} />
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[s.overlay, {
            paddingTop: Platform.OS === 'web' ? 67 : insets.top + 16,
            paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 16,
          }]}>
            <View testID="content-report-dialog" accessibilityViewIsModal onStartShouldSetResponderCapture={noteInputTouch}
              style={[s.card, { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius + 4 }]}>
              <Text accessibilityRole="header" style={[s.heading, { color: c.foreground }]}>{receipt ? 'Report received' : 'Report this content'}</Text>
              {receipt ? <>
                <Text testID="content-report-receipt" style={[s.body, { color: c.foreground }]}>Thank you. Your report was saved privately for developer review.</Text>
                <Text selectable style={[s.small, { color: c.mutedForeground }]}>Reference: {receipt}</Text>
                <Button testID="report-done" label="Done" onPress={close} />
              </> : <>
                <Text style={[s.body, { color: c.mutedForeground }]}>No sign-in is needed. Please do not include your email, password, sign-in code, or other personal information.</Text>
                {reasons.map(option => <Pressable key={option.value} testID={`report-reason-${option.value}`}
                  accessibilityRole="radio" accessibilityState={{ checked: reason === option.value, disabled: busy || retryLocked }}
                  disabled={busy || retryLocked} onPress={() => setReason(option.value)}
                  style={[s.option, { borderColor: reason === option.value ? c.primary : c.border, backgroundColor: reason === option.value ? c.accent : c.card, borderRadius: c.radius }]}>
                  <Feather name={reason === option.value ? 'check-circle' : 'circle'} size={18} color={c.primary} />
                  <Text style={[s.body, { color: c.foreground, flex: 1 }]}>{option.label}</Text>
                </Pressable>)}
                <Text style={[s.body, { color: c.foreground }]}>Anything else? (optional)</Text>
                <FieldInput testID="report-details" accessibilityLabel="Report details" value={details} onChangeText={setDetails}
                  editable={!busy && !retryLocked} maxLength={1500} multiline placeholder="Describe the issue without personal information"
                  placeholderTextColor={c.mutedForeground}
                  style={[s.input, { color: c.foreground, borderColor: c.input, borderRadius: c.radius, backgroundColor: c.card }]} />
                {snapshot?.imageUri ? <View style={s.picture}>
                  <Text style={[s.body, { color: c.foreground }]}>Include picture</Text>
                  <Switch testID="report-include-picture" accessibilityLabel="Include picture" value={includeImage}
                    disabled={busy || retryLocked} onValueChange={setIncludeImage} trackColor={{ true: c.primary }} />
                </View> : null}
                <Text style={[s.small, { color: c.mutedForeground }]}>The displayed text{includeImage ? ' and picture' : ''} will be attached. Reporting does not remove your bird or change your library.</Text>
                {retryLocked && error ? <Text style={[s.small, { color: c.mutedForeground }]}>Retry sends the same report to avoid duplicates. Close and reopen to change it.</Text> : null}
                {error ? <Text accessibilityRole="alert" testID="report-error" style={[s.small, { color: c.destructive }]}>{error}</Text> : null}
                <Button testID="report-submit" label="Send report" icon="flag" loading={busy} onPress={() => { void send(); }} />
                <Button testID="report-cancel" label="Cancel" variant="ghost" disabled={busy} onPress={close} />
              </>}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  trigger: { minWidth: 44, minHeight: 44, flexDirection: 'row', gap: 5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 9, borderWidth: 1 },
  triggerLabel: { fontFamily: sans.medium, fontSize: 12 },
  overlay: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20 },
  card: { width: '100%', maxWidth: 420, alignSelf: 'center', borderWidth: 1, padding: 20, gap: 12 },
  heading: { fontFamily: serif, fontSize: 25 },
  body: { fontFamily: sans.regular, fontSize: 14, lineHeight: 20 },
  small: { fontFamily: sans.regular, fontSize: 12, lineHeight: 18 },
  option: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, padding: 10 },
  input: { minHeight: 88, maxHeight: 180, borderWidth: 1, padding: 12, fontFamily: sans.regular, fontSize: 16, textAlignVertical: 'top' },
  picture: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
});

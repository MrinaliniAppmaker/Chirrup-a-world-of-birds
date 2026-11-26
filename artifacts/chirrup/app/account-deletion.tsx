import React, { useRef, useState } from 'react';
import { Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { useCancelAccountDeletion, useGetAccountDeletion, useRequestAccountDeletion } from '@workspace/api-client-react';
import { Button, Eyebrow } from '@/components/ui';
import { FieldInput } from '@/components/FieldInput';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useColors } from '@/hooks/useColors';
import { sans, serif } from '@/constants/fonts';

export { ScreenRecovery as ErrorBoundary } from '@/components/ScreenRecovery';

export default function AccountDeletionScreen() {
  const c = useColors();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const insets = useSafeAreaInsets();
  const query = useGetAccountDeletion({ query: { enabled: !!isSignedIn, retry: false } });
  const request = useRequestAccountDeletion();
  const cancel = useCancelAccountDeletion();
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const state = query.data?.request;
  const change = async (action: 'request' | 'cancel') => {
    if (lock.current || !isSignedIn || (action === 'request' && confirmation !== 'DELETE')) return;
    lock.current = true; setBusy(true); setError(null);
    try {
      if (action === 'request') await request.mutateAsync({ data: { confirmation: 'DELETE' } });
      else await cancel.mutateAsync();
      setConfirmation('');
      const refreshed = await query.refetch();
      if (refreshed.error) throw new Error('refresh failed');
    } catch (err) {
      setError((err as { data?: { error?: string } })?.data?.error ?? 'Could not confirm the current request status. Check your connection and retry; no immediate deletion is performed.');
    } finally { lock.current = false; setBusy(false); }
  };
  const openInstructions = async () => {
    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      if (!domain) throw new Error('Missing domain');
      const url = `https://${domain}/api/legal/delete-account`;
      if (Platform.OS === 'web') await Linking.openURL(url);
      else await WebBrowser.openBrowserAsync(url);
    } catch { setError('Could not open the instructions. Please try again when connected.'); }
  };
  return (
    <>
      <Stack.Screen options={{ title: 'Account deletion' }} />
      <KeyboardAwareScrollViewCompat keyboardShouldPersistTaps="handled" bottomOffset={24} style={{ flex: 1, backgroundColor: c.background }}
        contentContainerStyle={{ padding: 22, paddingBottom: insets.bottom + 40 }}>
        <Eyebrow>Your account & data</Eyebrow>
        <Text accessibilityRole="header" style={[s.title, { color: c.foreground }]}>Request account deletion</Text>
        <Text style={[s.body, { color: c.foreground }]}>This requests permanent removal of your Chirrup account, profile photo, saved birds, stored portraits and active sharing links. Copies already imported by other people remain in their libraries.</Text>
        <Text style={[s.body, { color: c.mutedForeground }]}>A developer reviews the request before processing. This is not immediate deletion. Once processing starts, you will lose account access and the deletion cannot be undone. You can cancel here before processing starts.</Text>
        <View style={[s.notice, { backgroundColor: c.accent, borderColor: c.border, borderRadius: c.radius }]}>
          <Text style={[s.body, { color: c.foreground }]}>Save any copies you want to keep first. Provider backups and legally required records may have separate retention periods. Anonymous content reports are separate review records; contact support with the report reference about a report-related privacy concern.</Text>
        </View>
        {!isSignedIn ? <View style={s.actions}>
          <Text style={[s.body, { color: c.foreground }]}>Sign in from Home to submit a request for your own account here. You can also use the public email instructions without signing in or keeping the app installed.</Text>
          <Button label="Back to Home" icon="home" onPress={() => router.navigate('/')} />
        </View> : query.isPending ? <Text style={[s.body, { color: c.mutedForeground }]}>Checking your request…</Text>
          : query.isError ? <View style={s.actions}>
            <Text accessibilityRole="alert" style={[s.body, { color: c.destructive }]}>Could not load your request. Please retry before making changes.</Text>
            <Button testID="deletion-retry" label="Retry" variant="outline" onPress={() => { void query.refetch(); }} />
          </View> : state ? <View style={s.actions}>
            <Text testID="deletion-status" accessibilityRole="header" style={[s.status, { color: c.primary }]}>
              {state.status === 'requested' ? 'Request received' : state.status === 'processing' ? 'Deletion is being processed' : 'Deletion completed'}
            </Text>
            <Text selectable style={[s.body, { color: c.foreground }]}>Reference: {state.id}</Text>
            {state.status === 'requested' ? <>
              <Text style={[s.body, { color: c.mutedForeground }]}>Your account and birds have not been deleted. You can cancel this request until processing begins.</Text>
              <Button testID="deletion-cancel-request" label="Cancel deletion request" variant="outline" loading={busy} onPress={() => { void change('cancel'); }} />
            </> : null}
          </View> : <View style={s.actions}>
            <Text style={[s.body, { color: c.foreground }]}>Type DELETE to confirm that you want to request deletion.</Text>
            <FieldInput testID="deletion-confirmation" accessibilityLabel="Type DELETE to confirm account deletion request"
              value={confirmation} onChangeText={setConfirmation} editable={!busy} maxLength={6} autoCapitalize="characters" autoCorrect={false}
              placeholder="DELETE" placeholderTextColor={c.mutedForeground}
              style={[s.input, { color: c.foreground, borderColor: c.input, backgroundColor: c.card, borderRadius: c.radius }]} />
            <Button testID="deletion-submit" label="Request account & data deletion" icon="user-x" variant="outline"
              disabled={confirmation !== 'DELETE'} loading={busy} onPress={() => { void change('request'); }} />
          </View>}
        {error ? <Text accessibilityRole="alert" style={[s.body, { color: c.destructive }]}>{error}</Text> : null}
        <View style={s.actions}>
          <Button testID="deletion-public-instructions" label="Email and deletion instructions" icon="external-link" variant="ghost" onPress={() => { void openInstructions(); }} />
        </View>
      </KeyboardAwareScrollViewCompat>
    </>
  );
}
const s = StyleSheet.create({
  title: { fontFamily: serif, fontSize: 30, marginVertical: 14 },
  body: { fontFamily: sans.regular, fontSize: 14, lineHeight: 22, marginBottom: 12 },
  notice: { borderWidth: 1, padding: 14, marginVertical: 8 },
  actions: { gap: 12, marginTop: 18 },
  status: { fontFamily: sans.semibold, fontSize: 19 },
  input: { minHeight: 50, borderWidth: 1, padding: 14, fontFamily: sans.regular, fontSize: 16 },
});

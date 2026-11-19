import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@clerk/expo';
import type { GeneratedBird } from '@workspace/api-client-react';
import { getPreviewBirdShareQueryKey, usePreviewBirdShare } from '@workspace/api-client-react';
import { BirdProfile, Button, Eyebrow } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { useCollection } from '@/context/CollectionContext';
import { sans, serif } from '@/constants/fonts';
import { journalErrorMessage } from '@/lib/journalBackend';
import { parseBirdShareToken, rememberSharedBird } from '@/lib/birdSharing';

export default function ReceiveBirdScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const raw = typeof params.token === 'string' ? params.token : '';
  return <ReceiveBirdContent key={raw} raw={raw} />;
}

function ReceiveBirdContent({ raw }: { raw: string }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const validToken = raw ? parseBirdShareToken(raw) : null;
  const token = validToken ?? '';
  const { isSignedIn } = useAuth();
  const { importShared } = useCollection();
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [added, setAdded] = useState<GeneratedBird | null>(null);
  const [remembering, setRemembering] = useState(false);
  const bottom = (Platform.OS === 'web' ? 34 : insets.bottom) + 32;

  const preview = usePreviewBirdShare({ token }, {
    query: { enabled: !!validToken, retry: false, queryKey: getPreviewBirdShareQueryKey({ token }) },
    request: {},
  });

  const box = [s.card, { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius + 2 }];

  if (!validToken) {
    return (
      <View testID="receive-invalid" style={[s.center, { backgroundColor: c.background }]}>
        <Feather name="link-2" size={26} color={c.destructive} />
        <Text style={[s.title, { color: c.foreground }]}>This sharing link is not valid</Text>
        <Text style={[s.body, { color: c.mutedForeground }]}>Check that the whole link was copied, then paste it again.</Text>
        <Button testID="receive-paste-again" label="Paste a link" icon="clipboard" variant="outline" onPress={() => router.replace('/share-birds')} style={{ marginTop: 16, alignSelf: 'stretch' }} />
      </View>
    );
  }

  const add = async () => {
    setAdding(true); setAddError(null);
    try { setAdded(await importShared(token)); }
    catch (err) { setAddError(journalErrorMessage(err)); }
    finally { setAdding(false); }
  };

  const preview_ = preview.data;
  const expiry = preview_ ? new Date(preview_.expiresAt).toLocaleString(undefined, { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';

  return (
    <ScrollView testID="receive-bird-screen" style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: bottom, maxWidth: 520, width: '100%', alignSelf: 'center' }}>
      <Eyebrow>A bird was shared with you</Eyebrow>
      {preview.isLoading ? (
        <View testID="receive-loading" style={{ gap: 12, marginTop: 14 }}>
          <View style={{ width: '100%', aspectRatio: 1, backgroundColor: c.muted, borderRadius: c.radius + 4 }} />
          <View style={{ height: 28, width: '60%', backgroundColor: c.muted, borderRadius: c.radius }} />
          <View style={{ height: 14, width: '90%', backgroundColor: c.muted, borderRadius: c.radius }} />
        </View>
      ) : preview.isError || !preview_ ? (
        <View testID="receive-error" style={box}>
          <Feather name="alert-circle" size={22} color={c.destructive} />
          <Text style={[s.title, { color: c.foreground }]}>This bird cannot be opened</Text>
          <Text style={[s.body, { color: c.mutedForeground }]}>{preview.error ? journalErrorMessage(preview.error) : 'The link may have expired after 7 days, or the original bird may have been deleted by its keeper.'}</Text>
          <Button testID="receive-retry" label="Try again" icon="refresh-cw" variant="outline" loading={preview.isFetching} onPress={() => { void preview.refetch(); }} style={{ marginTop: 14 }} />
        </View>
      ) : (
        <View style={{ marginTop: 12 }}>
          <BirdProfile bird={preview_.bird} />
          <View testID="receive-actions" style={box}>
            <Text style={[s.meta, { color: c.mutedForeground }]}>Link expires {expiry}. If the keeper deletes this bird, the link stops working.</Text>
            {addError && !added ? <Text accessibilityLiveRegion="polite" style={[s.err, { color: c.destructive }]}>{addError}</Text> : null}
            {added ? (
              <View testID="receive-success" accessibilityLiveRegion="polite" style={{ marginTop: 10 }}>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <Feather name="check-circle" size={18} color={c.primary} />
                  <Text style={[s.ok, { color: c.primary }]}>Added to your library.</Text>
                </View>
                <Button testID="receive-view-bird" label="View bird" icon="arrow-right" onPress={() => router.replace({ pathname: '/bird/[id]', params: { id: added.id } })} style={{ marginTop: 12 }} />
              </View>
            ) : isSignedIn ? (
              <>
                <Button testID="receive-add" label={addError ? 'Try again' : 'Add to my library'} icon="plus" loading={adding} onPress={() => { void add(); }} style={{ marginTop: 12 }} />
              </>
            ) : (
              <>
                <Text style={[s.body, { color: c.foreground }]}>Sign in to keep this bird in your own journal.</Text>
                <Button testID="receive-sign-in" label="Sign in to add" icon="log-in" loading={remembering} style={{ marginTop: 12 }}
                  onPress={async () => {
                    setRemembering(true); setAddError(null);
                    try {
                      await rememberSharedBird(token);
                      router.push('/(auth)/sign-in');
                    } catch {
                      setAddError('Could not keep this link for sign-in. Copy it first, sign in from Home, then paste it on Share birds.');
                    }
                    finally { setRemembering(false); }
                  }} />
              </>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { borderWidth: 1, padding: 16, marginTop: 18 },
  title: { fontFamily: serif, fontSize: 22, lineHeight: 28, marginTop: 8, textAlign: 'center' },
  body: { fontFamily: sans.regular, fontSize: 14, lineHeight: 20, marginTop: 6 },
  meta: { fontFamily: sans.regular, fontSize: 12, lineHeight: 17 },
  ok: { fontFamily: sans.semibold, fontSize: 15 },
  err: { fontFamily: sans.medium, fontSize: 13, lineHeight: 18, marginTop: 10 },
});

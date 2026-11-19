import React, { useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { createBirdShare } from '@workspace/api-client-react';
import { Button, Eyebrow, tap } from '@/components/ui';
import { FieldInput } from '@/components/FieldInput';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useColors } from '@/hooks/useColors';
import { useCollection } from '@/context/CollectionContext';
import { sans, serif } from '@/constants/fonts';
import { journalErrorMessage } from '@/lib/journalBackend';
import { buildBirdShareUrl, copyBirdShareLink, openBirdShareEmail, parseBirdShareToken } from '@/lib/birdSharing';

const nameOf = (n?: string) => (n && n.trim() ? n.trim() : 'Unnamed bird');

export default function ShareBirdsScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSignedIn, getToken } = useAuth();
  const { birds, loaded } = useCollection();
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<{ url: string; expiresAt: string; birdName: string } | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [paste, setPaste] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);
  const bottom = (Platform.OS === 'web' ? 34 : insets.bottom) + 32;
  const bird = birds.find((b) => b.id === selected);

  const create = async () => {
    if (!bird) return;
    setBusy(true); setError(null); setStatus(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('Sign in again to share a bird.');
      const res = await createBirdShare({ birdId: bird.id }, { headers: { Authorization: 'Bearer ' + token } });
      setLink({ url: buildBirdShareUrl(res.token), expiresAt: res.expiresAt, birdName: nameOf(bird.name) });
    } catch (err) {
      setError(journalErrorMessage(err));
    } finally { setBusy(false); }
  };

  const openShared = () => {
    const token = parseBirdShareToken(paste);
    if (!token) { setPasteError('That does not look like a CHIRRUP sharing link.'); return; }
    setPasteError(null);
    router.push({ pathname: '/receive-bird', params: { token } });
  };

  const expiry = link ? new Date(link.expiresAt).toLocaleString(undefined, { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';

  return (
    <KeyboardAwareScrollViewCompat testID="share-birds-screen" style={{ flex: 1, backgroundColor: c.background }} bottomOffset={20}
      contentContainerStyle={{ padding: 20, paddingBottom: bottom, maxWidth: 520, width: '100%', alignSelf: 'center' }}>
      <Eyebrow>Share a bird</Eyebrow>
      <Text accessibilityRole="header" style={[s.h1, { color: c.foreground }]}>Send one bird to a friend</Text>
      <Text style={[s.body, { color: c.mutedForeground }]}>Anyone with the link can import that one bird into their own journal for 7 days. Nothing else in your library is shared. Deleting the bird from your library disables the link.</Text>

      {link ? (
        <View testID="share-result" style={[s.card, { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius + 2 }]}>
          <Eyebrow>Link for {link.birdName}</Eyebrow>
          <Text testID="share-link" selectable style={[s.link, { color: c.foreground, backgroundColor: c.muted, borderRadius: c.radius }]}>{link.url}</Text>
          <Text style={[s.meta, { color: c.mutedForeground }]}>Expires in 7 days, on {expiry}.</Text>
          {process.env.EXPO_PUBLIC_DOMAIN?.endsWith('.replit.dev') ? (
            <Text style={[s.meta, { color: c.destructive }]}>Preview link: recipients outside this workspace may not be able to open it. Publish Chirrup and its backend before sharing publicly.</Text>
          ) : null}
          <Text style={[s.meta, { color: c.mutedForeground }]}>Open Gmail prepares a message for you to address and send. It does not send automatically.</Text>
          <View style={{ gap: 10, marginTop: 12 }}>
            <Button testID="share-copy" label="Copy link" icon="copy" onPress={async () => {
              try { await copyBirdShareLink(link.url); setStatus('Link copied.'); } catch { setStatus('Could not copy. Select the link above and copy it by hand.'); }
            }} />
            <Button testID="share-gmail" label="Open Gmail" icon="mail" variant="outline" onPress={async () => {
              try { await openBirdShareEmail(link.birdName, link.url); setStatus(null); } catch { setStatus('Could not open Gmail. Copy the link and paste it into any message.'); }
            }} />
            <Button testID="share-another" label="Share a different bird" variant="ghost" onPress={() => { setLink(null); setSelected(null); setStatus(null); }} />
          </View>
          {status ? <Text accessibilityLiveRegion="polite" style={[s.meta, { color: c.primary, textAlign: 'center' }]}>{status}</Text> : null}
        </View>
      ) : !isSignedIn ? (
        <View style={[s.card, { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius + 2 }]}>
          <Text style={[s.body, { color: c.foreground, marginTop: 0 }]}>Sign in to share birds from your journal.</Text>
          <Button testID="share-sign-in" label="Sign in" icon="log-in" onPress={() => router.push('/(auth)/sign-in')} style={{ marginTop: 12 }} />
        </View>
      ) : !loaded ? (
        <View style={{ gap: 8, marginTop: 16 }}>{[0, 1, 2].map((i) => <View key={i} style={{ height: 56, backgroundColor: c.muted, borderRadius: c.radius }} />)}</View>
      ) : birds.length === 0 ? (
        <View style={[s.card, { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius + 2, alignItems: 'center' }]}>
          <Feather name="feather" size={22} color={c.primary} />
          <Text style={[s.emptyTitle, { color: c.foreground }]}>No birds to share yet</Text>
          <Button testID="share-create" label="Create a bird" icon="arrow-right" variant="outline" onPress={() => router.navigate('/create')} style={{ marginTop: 12, alignSelf: 'stretch' }} />
        </View>
      ) : (
        <View style={{ marginTop: 18 }}>
          <Eyebrow>Choose one bird</Eyebrow>
          <View accessibilityRole="radiogroup" style={[s.list, { borderColor: c.border, borderRadius: c.radius + 2, backgroundColor: c.card }]}>
            {birds.map((b, i) => {
              const on = b.id === selected;
              return (
                <Pressable key={b.id} testID={'share-pick-' + b.id} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={nameOf(b.name)}
                  onPress={() => { tap(); setSelected(b.id); setError(null); }}
                  style={[s.pick, { backgroundColor: on ? c.accent : 'transparent', borderTopWidth: i ? StyleSheet.hairlineWidth : 0, borderTopColor: c.border }]}>
                  <Image source={{ uri: b.imageUri }} style={{ width: 44, height: 44, borderRadius: 4, backgroundColor: c.secondary }} />
                  <Text numberOfLines={1} style={[s.pickName, { color: c.foreground, fontFamily: on ? sans.semibold : sans.regular }]}>{nameOf(b.name)}</Text>
                  <Feather name={on ? 'check-circle' : 'circle'} size={18} color={on ? c.primary : c.mutedForeground} />
                </Pressable>
              );
            })}
          </View>
          {error ? <Text accessibilityLiveRegion="polite" style={[s.err, { color: c.destructive }]}>{error}</Text> : null}
          <Button testID="share-create-link" label={error ? 'Try again' : 'Create sharing link'} icon="link" loading={busy} disabled={!bird} onPress={() => { void create(); }} style={{ marginTop: 14 }} />
        </View>
      )}

      <View style={[s.receive, { borderTopColor: c.border }]}>
        <Eyebrow>Received a link?</Eyebrow>
        <Text style={[s.body, { color: c.mutedForeground }]}>Paste a CHIRRUP sharing link to preview the bird.</Text>
        <View style={[s.input, { backgroundColor: c.card, borderColor: pasteError ? c.destructive : c.input, borderRadius: c.radius }]}>
          <FieldInput testID="share-paste" value={paste} onChangeText={(t) => { setPaste(t); setPasteError(null); }} placeholder="Paste sharing link"
            placeholderTextColor={c.mutedForeground} accessibilityLabel="Sharing link" autoCapitalize="none" autoCorrect={false}
            returnKeyType="go" onSubmitEditing={openShared} style={[s.inputText, { color: c.foreground }]} />
        </View>
        {pasteError ? <Text style={[s.err, { color: c.destructive }]}>{pasteError}</Text> : null}
        <Button testID="share-open-shared" label="Open shared bird" icon="download" variant="outline" disabled={!paste.trim()} onPress={openShared} style={{ marginTop: 10 }} />
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const s = StyleSheet.create({
  h1: { fontFamily: serif, fontSize: 28, lineHeight: 34, marginTop: 4 },
  body: { fontFamily: sans.regular, fontSize: 14, lineHeight: 20, marginTop: 8 },
  card: { borderWidth: 1, padding: 16, marginTop: 18 },
  link: { fontFamily: sans.medium, fontSize: 13, lineHeight: 18, padding: 10, marginTop: 8, overflow: 'hidden' },
  meta: { fontFamily: sans.regular, fontSize: 12, lineHeight: 17, marginTop: 8 },
  emptyTitle: { fontFamily: serif, fontSize: 20, marginTop: 8 },
  list: { borderWidth: 1, marginTop: 8, overflow: 'hidden' },
  pick: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 12, paddingVertical: 6 },
  pickName: { flex: 1, fontSize: 15 },
  err: { fontFamily: sans.medium, fontSize: 13, lineHeight: 18, marginTop: 10 },
  receive: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 28, paddingTop: 18 },
  input: { borderWidth: 1, marginTop: 10, minHeight: 48, paddingHorizontal: 12, justifyContent: 'center' },
  inputText: { fontFamily: sans.regular, fontSize: 15, paddingVertical: 10, borderWidth: 0 },
});

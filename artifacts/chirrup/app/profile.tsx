import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, useClerk, useUser } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { Avatar, Notice, RenameDialog, displayNameOf, useProfileActions } from '@/components/AuthKit';
import { signOutToHome } from '@/components/AccountMenu';
import { Button, Eyebrow } from '@/components/ui';
import { LibraryShelf } from '@/components/LibraryShelf';
import { useColors } from '@/hooks/useColors';
import { sans, serif } from '@/constants/fonts';
export { ScreenRecovery as ErrorBoundary } from '@/components/ScreenRecovery';

export default function ProfileScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { rename, changePhoto, photoBusy, photoError } = useProfileActions();
  const [renaming, setRenaming] = useState(false);
  const [confirmOut, setConfirmOut] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const bottom = (Platform.OS === 'web' ? 34 : insets.bottom) + 32;

  if (!isSignedIn || !user) {
    return (
      <View testID="profile-signed-out" style={[s.empty, { backgroundColor: c.background }]}>
        <Avatar size={72} />
        <Text style={[s.name, { color: c.foreground, textAlign: 'center' }]}>You are browsing as a guest</Text>
        <Text style={[s.body, { color: c.mutedForeground, textAlign: 'center' }]}>Sign in to keep your journal with your account.</Text>
        <Button testID="profile-sign-in" label="Sign in" icon="log-in" onPress={() => router.push('/(auth)/sign-in')} style={{ marginTop: 18, alignSelf: 'stretch' }} />
        <Button testID="profile-home" label="Back to Home" icon="home" variant="ghost" onPress={() => router.replace('/')} />
      </View>
    );
  }

  const name = displayNameOf(user);
  const joined = user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : null;

  return (
    <ScrollView testID="profile-screen" style={{ flex: 1, backgroundColor: c.background }} contentContainerStyle={{ padding: 20, paddingBottom: bottom, maxWidth: 520, width: '100%', alignSelf: 'center' }}>
      <View style={[s.card, { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius + 4 }]}>
        <Avatar size={96} testID="profile-avatar" />
        <Eyebrow style={{ marginTop: 16 }}>Field naturalist</Eyebrow>
        <Text style={[s.name, { color: c.foreground }]} testID="profile-name">{name}</Text>
        <Text style={[s.body, { color: c.mutedForeground }]} testID="profile-email">{user.primaryEmailAddress?.emailAddress}</Text>
        {joined ? <Text style={[s.meta, { color: c.mutedForeground }]}>Keeping a journal since {joined}</Text> : null}
      </View>
      <LibraryShelf />
      <Button testID="profile-share-birds" label="Share birds" icon="share-2" variant="outline" onPress={() => router.push('/share-birds')} style={{ marginBottom: 8 }} />
      <Notice text={photoError} />
      <Notice text={logoutError} />
      <View style={{ gap: 10, marginTop: 6 }}>
        <Button testID="profile-rename" label="Rename" icon="edit-2" variant="outline" onPress={() => setRenaming(true)} />
        <Button testID="profile-change-photo" label={user.hasImage ? 'Change photo' : 'Choose a photo'} icon="camera" variant="outline" loading={photoBusy} onPress={() => { void changePhoto(); }} />
      </View>
      <View style={[s.out, { borderTopColor: c.border }]}>
        <Text style={[s.body, { color: c.mutedForeground }]}>Logging out keeps every bird safe in your account. They return when you sign back in.</Text>
        {confirmOut ? (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <Button testID="profile-logout-cancel" label="Stay" variant="outline" onPress={() => setConfirmOut(false)} style={{ flex: 1 }} />
            <Button testID="profile-logout-confirm" label="Log out" variant="danger" loading={leaving} style={{ flex: 1 }}
              onPress={async () => {
                setLeaving(true); setLogoutError(null);
                try { await signOutToHome(signOut, router); }
                catch { setLogoutError('Could not log out. Check your connection and try again.'); }
                finally { setLeaving(false); }
              }} />
          </View>
        ) : <Button testID="profile-logout" label="Log out" icon="log-out" variant="ghost" onPress={() => setConfirmOut(true)} style={{ marginTop: 8 }} />}
      </View>
      <Button testID="profile-home" label="Back to Home" icon="home" variant="ghost" onPress={() => router.replace('/')} style={{ marginTop: 12 }} />
      <RenameDialog visible={renaming} initial={user.firstName ?? ''} onClose={() => setRenaming(false)} onSave={rename} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 6 },
  card: { borderWidth: 1, padding: 22, alignItems: 'center', marginBottom: 16 },
  name: { fontFamily: serif, fontSize: 28, lineHeight: 34, marginTop: 4, textAlign: 'center' },
  body: { fontFamily: sans.regular, fontSize: 14, lineHeight: 20, marginTop: 4, textAlign: 'center' },
  meta: { fontFamily: sans.medium, fontSize: 12, marginTop: 10 },
  out: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 24, paddingTop: 16 },
});

import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Image, Modal, Platform, Pressable, StyleSheet, Text, View, type TextInputInstance, type TextInputProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as ImagePicker from 'expo-image-picker';
import { useClerk, useSignIn, useSignUp, useSSO, useUser } from '@clerk/expo';
import { waitForGooglePopup } from '@/lib/googlePopup';
import { useFocusEffect, useRouter } from 'expo-router';
import { goAfterSignIn } from '@/lib/birdSharing';
import { hasGuestBirdSignInReturn } from '@/lib/createRecovery';
import { noteInputTouch } from '@/lib/inputFocus';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { FieldInput } from '@/components/FieldInput';
import { ChirrupLogo } from '@/components/ChirrupBrand';
import { Button, Eyebrow, tap } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { sans, serif } from '@/constants/fonts';
import { renameAccountProfile } from '@workspace/api-client-react';

WebBrowser.maybeCompleteAuthSession();

/** Turn a Clerk error (or anything thrown) into one readable sentence. */
export function readableError(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const e = err as { errors?: { longMessage?: string; message?: string }[]; longMessage?: string; message?: string } | null;
  if (!e) return fallback;
  const first = e.errors?.[0];
  return first?.longMessage || first?.message || e.longMessage || e.message || fallback;
}

export function taskMessage(task: { key?: string } | null | undefined): string {
  if (!task) return '';
  if (task.key === 'reset-password') return 'Your account needs a new password before you can continue. Use "Forgot password" to set one.';
  if (task.key === 'choose-organization') return 'Your account has a pending setup step that this app does not support yet.';
  return 'Your account has one more setup step to finish before signing in.';
}

export function AuthShell({ eyebrow, title, subtitle, children, testID }: { eyebrow: string; title: string; subtitle?: string; children: React.ReactNode; testID?: string }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  useFocusEffect(useCallback(() => {
    if (Platform.OS !== 'android') return;
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!hasGuestBirdSignInReturn()) return false;
      router.replace('/create');
      return true;
    });
    return () => listener.remove();
  }, [router]));
  const top = Platform.OS === 'web' ? 67 : insets.top + 8;
  return (
    <View style={{ flex: 1, backgroundColor: c.background }} testID={testID}>
      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        bottomOffset={80}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: top, paddingHorizontal: 20, paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 32, maxWidth: 480, width: '100%', alignSelf: 'center' }}
      >
        <View style={s.topRow}>
          <Pressable testID="auth-close" accessibilityRole="button" accessibilityLabel="Close"
            onPress={() => {
              tap();
              if (hasGuestBirdSignInReturn()) router.replace('/create');
              else if (router.canGoBack()) router.back();
              else router.replace('/');
            }}
            style={[s.iconBtn, { borderColor: c.border, backgroundColor: c.card }]}>
            <Feather name="x" size={18} color={c.foreground} />
          </Pressable>
        </View>
        <View style={[s.mark, { backgroundColor: c.secondary }]}><ChirrupLogo size={40} /></View>
        <Eyebrow style={{ marginTop: 18 }}>{eyebrow}</Eyebrow>
        <Text accessibilityRole="header" style={[s.title, { color: c.foreground }]}>{title}</Text>
        {subtitle ? <Text style={[s.subtitle, { color: c.mutedForeground }]}>{subtitle}</Text> : null}
        <View style={[s.card, { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius + 4 }]}>{children}</View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

export const AuthField = forwardRef<TextInputInstance, TextInputProps & { label: string; error?: string | null }>(function AuthField({ label, error, style, ...props }, ref) {
  const c = useColors();
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[s.label, { color: c.foreground }]}>{label}</Text>
      <FieldInput
        ref={ref}
        placeholderTextColor={c.mutedForeground}
        {...props}
        style={[s.input, { borderColor: error ? c.destructive : c.input, backgroundColor: c.background, color: c.foreground, borderRadius: c.radius }, style]}
      />
      {error ? <Text style={[s.fieldErr, { color: c.destructive }]}>{error}</Text> : null}
    </View>
  );
});

export function Notice({ text, tone = 'error', testID }: { text?: string | null; tone?: 'error' | 'info'; testID?: string }) {
  const c = useColors();
  if (!text) return null;
  const err = tone === 'error';
  return (
    <View testID={testID} accessibilityLiveRegion="polite" style={[s.notice, { backgroundColor: c.secondary, borderRadius: c.radius }]}>
      <Feather name={err ? 'alert-circle' : 'info'} size={15} color={err ? c.destructive : c.secondaryForeground} />
      <Text style={[s.noticeText, { color: err ? c.destructive : c.secondaryForeground }]}>{text}</Text>
    </View>
  );
}

export function LinkText({ label, onPress, testID }: { label: string; onPress: () => void; testID: string }) {
  const c = useColors();
  return (
    <Pressable testID={testID} accessibilityRole="link" onPress={() => { tap(); onPress(); }} hitSlop={6} style={s.linkBtn}>
      <Text style={[s.link, { color: c.primary }]}>{label}</Text>
    </Pressable>
  );
}

export function Divider() {
  const c = useColors();
  return (
    <View style={s.divider}>
      <View style={[s.rule, { backgroundColor: c.border }]} />
      <Text style={[s.or, { color: c.mutedForeground }]}>or</Text>
      <View style={[s.rule, { backgroundColor: c.border }]} />
    </View>
  );
}

function useWarmUpBrowser() {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void WebBrowser.warmUpAsync();
    return () => { void WebBrowser.coolDownAsync(); };
  }, []);
}

export function GoogleButton({ onError, onBusyChange, disabled, testID }: { onError: (msg: string | null) => void; onBusyChange?: (busy: boolean) => void; disabled?: boolean; testID: string }) {
  useWarmUpBrowser();
  const c = useColors();
  const router = useRouter();
  const { startSSOFlow } = useSSO();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const clerk = useClerk();
  const [busy, setBusy] = useState(false);
  const requestLock = useRef(false);
  const cancelPopup = useRef<(() => void) | null>(null);
  useEffect(() => () => cancelPopup.current?.(), []);
  const onPress = async () => {
    if (requestLock.current || disabled) return;
    requestLock.current = true;
    tap(); onError(null); setBusy(true); onBusyChange?.(true);
    let popup: Window | null = null;
    try {
      if (Platform.OS === 'web') {
        // Open synchronously in the click gesture. The native useSSO flow waits
        // for a network request before opening its browser; Chrome can block
        // that popup in an embedded preview. Use Clerk's web popup API instead.
        popup = window.open('about:blank', 'chirrup-google-sign-in', 'popup=yes,width=520,height=720');
        if (!popup) {
          onError('Chrome blocked the Google sign-in window. Allow pop-ups for this preview, then try again. Email-code sign-in is also available.');
          return;
        }
        const callback = `${window.location.origin}/sso-callback`;
        const controller = new AbortController();
        cancelPopup.current = () => { popup?.close(); controller.abort(); };
        const completion = await waitForGooglePopup(signIn.sso({
          strategy: 'oauth_google', popup, redirectUrl: callback, redirectCallbackUrl: callback,
        }), () => !!popup?.closed, controller.signal);
        if (completion.kind === 'completed' && completion.value.error) throw completion.value.error;
        if (completion.kind !== 'completed' && !clerk.session && signIn.status !== 'complete' && signUp.status !== 'complete') {
          popup.close();
          // Clear SDK-local fetching state as well as this button's spinner.
          // Otherwise the email fields also remain read-only after cancellation.
          const reset = await signIn.reset();
          if (reset.error) throw reset.error;
          await signUp.reset();
          if (completion.kind === 'timeout') onError('Google sign-in timed out. Please try again, or use an emailed sign-in code.');
          return;
        }
        if (clerk.session) { await goAfterSignIn(router); return; }
        const flow = signIn.status === 'complete' ? signIn : signUp.status === 'complete' ? signUp : null;
        if (flow) {
          await flow.finalize({ navigate: async ({ session }) => {
            if (session?.currentTask) { onError(taskMessage(session.currentTask)); return; }
            await goAfterSignIn(router);
          } });
        }
        return;
      }
      const { createdSessionId, setActive, authSessionResult } = await startSSOFlow({ strategy: 'oauth_google', redirectUrl: AuthSession.makeRedirectUri() });
      if (createdSessionId && setActive) {
        await setActive({
          session: createdSessionId,
          navigate: async ({ session }) => {
            if (session?.currentTask) { onError(taskMessage(session.currentTask)); return; }
            void goAfterSignIn(router);
          },
        });
      } else if (authSessionResult?.type !== 'cancel' && authSessionResult?.type !== 'dismiss') {
        onError('Google sign-in needs another verification step. You can use an emailed sign-in code instead.');
      }
    } catch (err) {
      popup?.close();
      onError(readableError(err, 'Google sign-in did not finish. Please try again.'));
    } finally { cancelPopup.current = null; requestLock.current = false; setBusy(false); onBusyChange?.(false); }
  };
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel="Continue with Google" disabled={busy || disabled} onPress={onPress}
      style={({ pressed }) => [s.google, { borderColor: c.input, backgroundColor: c.background, borderRadius: c.radius, opacity: pressed ? 0.8 : 1 }]}>
      {busy ? <ActivityIndicator color={c.primary} /> : (
        <>
          <Text style={[s.gMark, { color: c.chestnut }]}>G</Text>
          <Text style={[s.gText, { color: c.foreground }]}>Continue with Google</Text>
        </>
      )}
    </Pressable>
  );
}

export function displayNameOf(user: { firstName?: string | null; fullName?: string | null; primaryEmailAddress?: { emailAddress: string } | null } | null | undefined) {
  if (!user) return '';
  return user.firstName?.trim() || user.fullName?.trim() || user.primaryEmailAddress?.emailAddress.split('@')[0] || 'Field naturalist';
}

export function Avatar({ size = 40, testID }: { size?: number; testID?: string }) {
  const c = useColors();
  const { user } = useUser();
  const name = displayNameOf(user);
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
  const uploaded = user?.hasImage && user.imageUrl;
  return (
    <View testID={testID} style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border }}>
      {uploaded ? <Image source={{ uri: user!.imageUrl }} style={{ width: size, height: size }} accessibilityLabel="Your profile photo" />
        : initials ? <Text style={{ fontFamily: serif, fontSize: size * 0.42, color: c.primary }}>{initials}</Text>
        : <Feather name="user" size={size * 0.5} color={c.primary} />}
    </View>
  );
}

/** Rename + change-photo actions shared by the Home menu and the profile screen. */
export function useProfileActions() {
  const { user } = useUser();
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoNotice, setPhotoNotice] = useState<string | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<{ owner: string; uri: string; file: string } | null>(null);
  const photoLock = useRef(false);
  const rename = async (raw: string): Promise<string | null> => {
    const name = raw.trim();
    if (name.length < 1) return 'Please enter a name.';
    if (name.length > 60) return 'Keep your name to 60 characters or fewer.';
    try {
      if (!user) return 'Sign in again to rename your profile.';
      await renameAccountProfile({ displayName: name });
      await user.reload();
      return null;
    }
    catch (err) { return readableError(err, 'Could not save your name. Please try again.'); }
  };
  const changePhoto = async () => {
    if (photoLock.current || !user) return;
    photoLock.current = true;
    setPhotoError(null); setPhotoNotice(null);
    try {
      // Android's system picker grants access to the selected image only.
      // Do not request broad storage access (also keep the web picker in the
      // original click gesture). Retain iOS's existing permission handling.
      if (Platform.OS === 'ios') {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) { setPhotoError('Photo access is off. Allow photo access in Settings to choose a profile picture.'); return; }
      }
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7, base64: true });
      if (res.canceled || !res.assets[0]) return;
      const a = res.assets[0];
      if (!a.base64) { setPhotoError('Could not read that photo. Try another one.'); return; }
      setPendingPhoto({ owner: user.id, uri: a.uri, file: `data:${a.mimeType ?? 'image/jpeg'};base64,${a.base64}` });
    } catch (err) {
      setPhotoError(readableError(err, 'Could not choose that photo. Please try again.'));
    } finally { photoLock.current = false; }
  };
  const savePhoto = async () => {
    if (photoLock.current || !pendingPhoto) return;
    if (!user || pendingPhoto.owner !== user.id) {
      setPendingPhoto(null); setPhotoError('Sign in again to change your profile photo.'); return;
    }
    photoLock.current = true;
    setPhotoBusy(true);
    setPhotoError(null); setPhotoNotice(null);
    try {
      await user.setProfileImage({ file: pendingPhoto.file });
      setPendingPhoto(null);
      try { await user.reload(); setPhotoNotice('Profile photo saved.'); }
      catch { setPhotoNotice('Your photo was saved. Reopen your profile to refresh its preview.'); }
    } catch (err) {
      // Retain the draft so a failed upload can be retried without picking again.
      setPhotoError(readableError(err, 'Could not confirm the photo was saved. Your selected photo is kept; please try again.'));
    } finally { photoLock.current = false; setPhotoBusy(false); }
  };
  const cancelPhoto = () => {
    if (photoLock.current) return;
    setPendingPhoto(null); setPhotoError(null); setPhotoNotice(null);
  };
  return { rename, changePhoto, savePhoto, cancelPhoto, pendingPhoto: pendingPhoto?.owner === user?.id ? pendingPhoto : null, photoBusy, photoError, photoNotice, setPhotoError };
}

export function RenameDialog({ visible, initial, onClose, onSave }: { visible: boolean; initial: string; onClose: () => void; onSave: (name: string) => Promise<string | null> }) {
  const c = useColors();
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (visible) { setValue(initial); setError(null); } }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps
  const save = async () => {
    setBusy(true);
    const err = await onSave(value);
    setBusy(false);
    if (err) setError(err); else onClose();
  };
  const len = value.trim().length;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.scrim} onStartShouldSetResponderCapture={noteInputTouch}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Dismiss" testID="rename-scrim" />
        <View style={[s.sheet, { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius + 4 }]}>
          <Eyebrow>Rename</Eyebrow>
          <Text style={[s.sheetTitle, { color: c.foreground }]}>What should the journal call you?</Text>
          <AuthField testID="rename-input" label="Display name" value={value} onChangeText={(t) => { setValue(t); setError(null); }}
            maxLength={60} autoFocus autoCapitalize="words" returnKeyType="done" onSubmitEditing={save} error={error} />
          <Text style={{ fontFamily: sans.regular, fontSize: 12, color: c.mutedForeground, marginTop: -8, marginBottom: 12 }}>{len}/60</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button testID="rename-cancel" label="Cancel" variant="outline" onPress={onClose} style={{ flex: 1 }} />
            <Button testID="rename-save" label="Save" onPress={save} loading={busy} disabled={len < 1 || len > 60} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  iconBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  mark: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  title: { fontFamily: serif, fontSize: 30, lineHeight: 36, marginTop: 6 },
  subtitle: { fontFamily: sans.regular, fontSize: 15, lineHeight: 22, marginTop: 8 },
  card: { borderWidth: 1, padding: 18, marginTop: 22 },
  label: { fontFamily: sans.semibold, fontSize: 13, marginBottom: 6 },
  input: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontFamily: sans.regular, minHeight: 48 },
  fieldErr: { fontFamily: sans.medium, fontSize: 12, marginTop: 5 },
  notice: { flexDirection: 'row', gap: 8, padding: 12, marginBottom: 14, alignItems: 'flex-start' },
  noticeText: { flex: 1, fontFamily: sans.medium, fontSize: 13, lineHeight: 18 },
  linkBtn: { minHeight: 44, justifyContent: 'center', alignSelf: 'center', paddingHorizontal: 8 },
  link: { fontFamily: sans.semibold, fontSize: 14 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14 },
  rule: { flex: 1, height: StyleSheet.hairlineWidth },
  or: { fontFamily: sans.medium, fontSize: 12 },
  google: { minHeight: 50, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  gMark: { fontFamily: serif, fontSize: 20, fontWeight: '700' },
  gText: { fontFamily: sans.semibold, fontSize: 15 },
  scrim: { flex: 1, backgroundColor: 'rgba(31,42,34,0.45)', justifyContent: 'center', padding: 20 },
  sheet: { borderWidth: 1, padding: 20, width: '100%', maxWidth: 420, alignSelf: 'center' },
  sheetTitle: { fontFamily: serif, fontSize: 22, lineHeight: 28, marginTop: 4, marginBottom: 14 },
});

import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth, useClerk, useUser } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { Avatar, Notice, RenameDialog, displayNameOf, useProfileActions } from '@/components/AuthKit';
import { tap } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { sans, serif } from '@/constants/fonts';
import { ProfilePhotoReview } from '@/components/ProfilePhotoReview';

export async function signOutToHome(signOut: () => Promise<unknown>, router: { replace: (h: '/') => void }) {
  await signOut();
  router.replace('/');
}

/** Home header chip: avatar + name when signed in, Sign in invite when not. */
export function AccountChip() {
  const c = useColors();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { rename, changePhoto, savePhoto, cancelPhoto, pendingPhoto, photoBusy, photoError, photoNotice, setPhotoError } = useProfileActions();
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [confirmOut, setConfirmOut] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  if (!isSignedIn) {
    return (
      <Pressable testID="home-sign-in" accessibilityRole="button" accessibilityLabel="Sign in"
        onPress={() => { tap(); router.push('/(auth)/sign-in'); }}
        style={({ pressed }) => [s.signIn, { borderColor: c.primary, borderRadius: 22, opacity: pressed ? 0.8 : 1 }]}>
        <Feather name="log-in" size={15} color={c.primary} />
        <Text style={[s.signInText, { color: c.primary }]}>Sign in</Text>
      </Pressable>
    );
  }

  const name = displayNameOf(user);
  const close = () => { if (photoBusy) return; cancelPhoto(); setOpen(false); setConfirmOut(false); setPhotoError(null); setLogoutError(null); };
  const items: { id: string; label: string; icon: keyof typeof Feather.glyphMap; onPress: () => void; danger?: boolean }[] = [
    { id: 'view', label: 'View profile', icon: 'user', onPress: () => { close(); router.push('/profile'); } },
    { id: 'rename', label: 'Rename', icon: 'edit-2', onPress: () => { setOpen(false); setRenaming(true); } },
    { id: 'photo', label: photoBusy ? 'Uploading photo' : 'Change photo', icon: 'camera', onPress: () => { void changePhoto(); } },
    { id: 'logout', label: 'Log out', icon: 'log-out', danger: true, onPress: () => setConfirmOut(true) },
  ];

  return (
    <>
      <Pressable testID="home-account" accessibilityRole="button" accessibilityLabel={'Account menu for ' + name}
        onPress={() => { tap(); setOpen(true); }}
        style={({ pressed }) => [s.chip, { backgroundColor: c.card, borderColor: c.border, opacity: pressed ? 0.85 : 1 }]}>
        <Avatar size={34} />
        <Text numberOfLines={1} style={[s.chipName, { color: c.foreground }]}>{name}</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <View style={s.scrim}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close account menu" testID="account-menu-scrim" />
          <View testID="account-menu" style={[s.menu, { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius + 4 }]}>
            <View style={s.menuHead}>
              <Avatar size={52} />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={[s.menuName, { color: c.foreground }]}>{name}</Text>
                <Text numberOfLines={1} style={[s.menuEmail, { color: c.mutedForeground }]}>{user?.primaryEmailAddress?.emailAddress}</Text>
              </View>
            </View>
            <Notice text={photoError} />
            <Notice text={photoNotice} tone="info" />
            <Notice text={logoutError} />
            {pendingPhoto ? <ProfilePhotoReview uri={pendingPhoto.uri} busy={photoBusy} onSave={() => { void savePhoto(); }} onCancel={cancelPhoto} /> : confirmOut ? (
              <View style={[s.confirm, { backgroundColor: c.secondary, borderRadius: c.radius }]}>
                <Text style={[s.confirmText, { color: c.secondaryForeground }]}>Log out of Chirrup? Your birds stay safe in your account and return when you sign back in.</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  <Pressable testID="account-logout-cancel" accessibilityRole="button" onPress={() => setConfirmOut(false)} style={[s.confirmBtn, { borderColor: c.primary }]}>
                    <Text style={[s.itemText, { color: c.primary }]}>Stay</Text>
                  </Pressable>
                  <Pressable testID="account-logout-confirm" accessibilityRole="button" disabled={leaving}
                    onPress={async () => {
                      setLeaving(true); setLogoutError(null);
                      try { await signOutToHome(signOut, router); close(); }
                      catch { setLogoutError('Could not log out. Check your connection and try again.'); }
                      finally { setLeaving(false); }
                    }}
                    style={[s.confirmBtn, { backgroundColor: c.destructive, borderColor: c.destructive }]}>
                    {leaving ? <ActivityIndicator color={c.destructiveForeground} /> : <Text style={[s.itemText, { color: c.destructiveForeground }]}>Log out</Text>}
                  </Pressable>
                </View>
              </View>
            ) : items.map((it) => (
              <Pressable key={it.id} testID={'account-menu-' + it.id} accessibilityRole="button" accessibilityLabel={it.label}
                disabled={it.id === 'photo' && photoBusy}
                onPress={() => { tap(); it.onPress(); }}
                style={({ pressed }) => [s.item, { borderTopColor: c.border, backgroundColor: pressed ? c.muted : 'transparent' }]}>
                {it.id === 'photo' && photoBusy ? <ActivityIndicator size="small" color={c.primary} /> : <Feather name={it.icon} size={18} color={it.danger ? c.destructive : c.primary} />}
                <Text style={[s.itemText, { color: it.danger ? c.destructive : c.foreground }]}>{it.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
      <RenameDialog visible={renaming} initial={user?.firstName ?? ''} onClose={() => setRenaming(false)} onSave={rename} />
    </>
  );
}

const s = StyleSheet.create({
  signIn: { minHeight: 44, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1 },
  signInText: { fontFamily: sans.semibold, fontSize: 14 },
  chip: { minHeight: 44, maxWidth: 150, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 4, paddingRight: 12, paddingVertical: 4, borderRadius: 24, borderWidth: 1 },
  chipName: { fontFamily: sans.semibold, fontSize: 13, flexShrink: 1 },
  scrim: { flex: 1, backgroundColor: 'rgba(31,42,34,0.4)', justifyContent: 'center', padding: 20 },
  menu: { borderWidth: 1, padding: 16, width: '100%', maxWidth: 380, alignSelf: 'center' },
  menuHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  menuName: { fontFamily: serif, fontSize: 20 },
  menuEmail: { fontFamily: sans.regular, fontSize: 13, marginTop: 2 },
  item: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 4 },
  itemText: { fontFamily: sans.semibold, fontSize: 15 },
  confirm: { padding: 12 },
  confirmText: { fontFamily: sans.medium, fontSize: 13, lineHeight: 19 },
  confirmBtn: { flex: 1, minHeight: 44, borderWidth: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
});

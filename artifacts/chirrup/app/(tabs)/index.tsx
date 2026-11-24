import React from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button, Eyebrow, tap } from '@/components/ui';
import { CHIRRUP_TAGLINE, ChirrupBrand, ChirrupLogo } from '@/components/ChirrupBrand';
import { AccountChip } from '@/components/AccountMenu';
import { useColors } from '@/hooks/useColors';
import { useCollection } from '@/context/CollectionContext';
export { ScreenRecovery as ErrorBoundary } from '@/components/ScreenRecovery';
import { sans, serif } from '@/constants/fonts';

export default function HomeScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const illustrationSize = Math.min(380, Math.max(0, width - 40));
  const illustrationGap = Math.round(illustrationSize * 0.09);
  const { birds, loaded } = useCollection();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 + 84 : insets.bottom + 90;

  const entries: { id: string; title: string; body: string; icon: keyof typeof Feather.glyphMap; href: '/create' | '/library' | '/interactions' }[] = [
    { id: 'create', title: 'Create', body: 'Choose a body, beak, colors and feet. Bring a new species to life and give it a name.', icon: 'feather', href: '/create' },
    { id: 'library', title: 'Library', body: loaded ? (birds.length === 1 ? '1 bird kept in your field journal.' : birds.length + ' birds kept in your field journal.') : 'Opening your field journal.', icon: 'book-open', href: '/library' },
    { id: 'interactions', title: 'Interactions', body: 'Make two to six of your birds meet in an imagined location for five minutes', icon: 'users', href: '/interactions' },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.background }} contentContainerStyle={{ paddingTop: topPad + 8, paddingHorizontal: 20, paddingBottom: bottomPad }}>
      <View style={s.header}>
        <ChirrupBrand testID="home-brand" style={{ flexShrink: 1 }} />
        <AccountChip />
      </View>
      <View style={[s.hero, { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius + 4 }]}>
        <View style={[s.mark, { backgroundColor: c.secondary }]}><ChirrupLogo size={44} /></View>
        <Eyebrow style={{ marginTop: 18 }}>{CHIRRUP_TAGLINE}</Eyebrow>
        <Text accessibilityRole="header" style={[s.h1, { color: c.foreground }]}>A world of birds of your creation</Text>
        <Text style={[s.intro, { color: c.mutedForeground }]}>Invent a bird from its anatomy, name it yourself, keep it in your library, and imagine who it meets.</Text>
        <Button testID="home-create" label="Create a bird" icon="plus" onPress={() => { tap(); router.navigate('/create'); }} style={{ marginTop: 18 }} />
      </View>
      <Image testID="home-waiting-bird" source={require('../../assets/images/waiting-to-be-generated.png')}
        accessibilityRole="image" accessibilityLabel="A dashed-outline bird holding a phone and thinking: Waiting to be generated..."
        resizeMode="contain" style={[s.waitingBird, { height: illustrationSize, marginTop: illustrationGap }]} />
      <Eyebrow style={{ marginTop: illustrationGap, marginBottom: 10 }}>Where to next</Eyebrow>
      <View style={{ gap: 10 }}>
        {entries.map((e) => (
          <Pressable key={e.id} testID={'home-entry-' + e.id} accessibilityRole="button" accessibilityLabel={e.title}
            onPress={() => { tap(); router.navigate(e.href); }}
            style={({ pressed }) => [s.entry, { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius + 2, opacity: pressed ? 0.85 : 1 }]}>
            <View style={[s.entryIcon, { backgroundColor: c.accent, borderRadius: c.radius }]}><Feather name={e.icon} size={20} color={c.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={[s.entryTitle, { color: c.foreground }]}>{e.title}</Text>
              <Text style={[s.entryBody, { color: c.mutedForeground }]}>{e.body}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={c.mutedForeground} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  hero: { marginTop: 18, padding: 20, borderWidth: 1 },
  mark: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  h1: { fontFamily: serif, fontSize: 32, lineHeight: 38, marginTop: 6 },
  intro: { fontFamily: sans.regular, fontSize: 15, lineHeight: 22, marginTop: 8 },
  waitingBird: { width: '100%', maxWidth: 380, alignSelf: 'center' },
  entry: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, padding: 14 },
  entryIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  entryTitle: { fontFamily: serif, fontSize: 19 },
  entryBody: { fontFamily: sans.regular, fontSize: 13, lineHeight: 18, marginTop: 2 },
});

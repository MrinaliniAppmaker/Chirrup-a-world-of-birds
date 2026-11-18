import React from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { FieldInput } from './FieldInput';
import { Button, Eyebrow } from './ui';
import { useColors } from '@/hooks/useColors';
import { sans, serif } from '@/constants/fonts';

export function BirdNameDialog({ visible, value, onChange, onCancel, onSave, saving, error }: {
  visible: boolean;
  value: string;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  error: string | null;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => { if (!saving) onCancel(); }}>
      <KeyboardAvoidingView enabled={Platform.OS !== 'web'} behavior="padding" style={s.fill}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: c.foreground, opacity: 0.45 }]} />
        <ScrollView keyboardShouldPersistTaps="handled"
          contentContainerStyle={[s.content, {
            paddingTop: Platform.OS === 'web' ? 67 : insets.top + 20,
            paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 20,
          }]}>
          <View testID="bird-name-dialog" accessibilityViewIsModal
            style={[s.card, { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius + 4 }]}>
            <View style={s.heading}>
              <Text accessibilityRole="header" style={[s.title, { color: c.foreground }]}>Name your bird</Text>
              <Pressable testID="cancel-bird-name" accessibilityRole="button" accessibilityLabel="Cancel naming"
                disabled={saving} onPress={onCancel} hitSlop={8} style={s.close}>
                <Feather name="x" size={22} color={c.foreground} />
              </Pressable>
            </View>
            <Eyebrow>Give your creation a name</Eyebrow>
            <FieldInput testID="popup-bird-name" accessibilityLabel="Name your bird" autoFocus
              value={value} onChangeText={onChange} editable={!saving} maxLength={100}
              placeholderTextColor={c.mutedForeground} returnKeyType="done"
              style={[s.input, { borderColor: c.input, backgroundColor: c.card, color: c.foreground, borderRadius: c.radius }]} />
            {error ? <Text accessibilityRole="alert" style={[s.error, { color: c.destructive }]}>{error}</Text> : null}
            <Button testID="confirm-bird-name" label="Save to my journal" icon="bookmark"
              disabled={!value.trim()} loading={saving} onPress={onSave} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20 },
  card: { width: '100%', maxWidth: 420, alignSelf: 'center', borderWidth: 1, padding: 22, gap: 16 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { fontFamily: serif, fontSize: 26, flexShrink: 1 },
  close: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  input: { borderWidth: 1, minHeight: 48, paddingHorizontal: 14, fontFamily: sans.regular, fontSize: 16 },
  error: { fontFamily: sans.regular, fontSize: 13, lineHeight: 19 },
});

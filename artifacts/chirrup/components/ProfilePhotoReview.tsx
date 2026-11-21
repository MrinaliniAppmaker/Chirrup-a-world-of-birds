import React from 'react';
import { Image, Text, View } from 'react-native';
import { Button, Eyebrow } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { sans } from '@/constants/fonts';

export function ProfilePhotoReview({ uri, busy, onSave, onCancel }: {
  uri: string; busy: boolean; onSave: () => void; onCancel: () => void;
}) {
  const c = useColors();
  return (
    <View testID="profile-photo-review" style={{ padding: 16, gap: 12, borderWidth: 1, borderColor: c.border, borderRadius: c.radius, backgroundColor: c.card }}>
      <Eyebrow>Preview your photo</Eyebrow>
      <Image testID="profile-photo-preview" source={{ uri }} accessibilityLabel="New profile photo, not saved yet"
        style={{ width: 112, height: 112, borderRadius: 56, alignSelf: 'center', backgroundColor: c.secondary }} />
      <Text style={{ fontFamily: sans.regular, fontSize: 14, lineHeight: 20, color: c.mutedForeground }}>
        Cropping does not save your photo. Choose Save photo to update your profile.
      </Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button testID="profile-photo-cancel" label="Cancel" variant="outline" disabled={busy} onPress={onCancel} style={{ flex: 1 }} />
        <Button testID="profile-photo-save" label="Save photo" loading={busy} onPress={onSave} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

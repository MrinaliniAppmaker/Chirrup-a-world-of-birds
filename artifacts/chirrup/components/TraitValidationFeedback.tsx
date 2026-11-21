import React from 'react';
import { Text, View } from 'react-native';
import type { BirdTraitIssue } from '@workspace/api-client-react';
import { sans } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';

export function TraitValidationFeedback({ field, issues }: {
  field: BirdTraitIssue['field']; issues: BirdTraitIssue[];
}) {
  const c = useColors();
  if (!issues.length) return null;
  return (
    <View testID={`trait-error-${field}`} style={{ marginTop: 6, gap: 4 }}>
      <Text accessibilityRole="alert" style={{ fontFamily: sans.medium, fontSize: 12, color: c.destructive }}>
        Edit the non-bird features highlighted in this text box.
      </Text>
    </View>
  );
}

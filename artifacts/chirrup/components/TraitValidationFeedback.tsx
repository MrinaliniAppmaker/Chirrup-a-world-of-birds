import React from 'react';
import { Text, View } from 'react-native';
import type { BirdTraitIssue } from '@workspace/api-client-react';
import { sans } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import { traitHighlightParts } from '@/lib/traitHighlights';

/** Keep highlighting outside the editable control: no overlay or input remount. */
export function TraitValidationFeedback({ field, value, issues }: {
  field: BirdTraitIssue['field']; value: string; issues: BirdTraitIssue[];
}) {
  const c = useColors();
  if (!issues.length) return null;
  return (
    <View testID={`trait-error-${field}`} style={{ marginTop: 6, gap: 4 }}>
      <Text accessibilityRole="alert" style={{ fontFamily: sans.medium, fontSize: 12, color: c.destructive }}>
        Non-bird features highlighted below. Edit the box above.
      </Text>
      <Text style={{ fontFamily: sans.regular, fontSize: 14, lineHeight: 21, color: c.mutedForeground }}>
        {traitHighlightParts(value, issues).map((part, i) => (
          <Text key={i} testID={part.invalid ? `invalid-${field}-${i}` : undefined}
            style={part.invalid ? { color: c.destructive, backgroundColor: c.muted, fontFamily: sans.semibold, textDecorationLine: 'underline' } : undefined}>
            {part.text}
          </Text>
        ))}
      </Text>
    </View>
  );
}

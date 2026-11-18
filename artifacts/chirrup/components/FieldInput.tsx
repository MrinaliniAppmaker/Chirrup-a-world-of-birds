import React, { forwardRef, useState } from 'react';
import { Platform, StyleSheet, TextInput, type TextInputInstance, type TextInputProps } from 'react-native';
import { useColors } from '@/hooks/useColors';

// Stable component identity across edits; focus styling never replaces the input.
// Enter submits without blurring. Only normal user focus changes dismiss it.
export const FieldInput = forwardRef<TextInputInstance, TextInputProps & { onEditingComplete?: () => void }>(function FieldInput(
  { style, onFocus, onBlur, onEditingComplete, submitBehavior, blurOnSubmit = false, ...props }, ref,
) {
  const c = useColors();
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      {...props}
      ref={ref}
      submitBehavior={submitBehavior ?? (props.multiline ? 'newline' : 'submit')}
      // RN Web 0.21 still uses this flag rather than submitBehavior.
      blurOnSubmit={blurOnSubmit}
      selectionColor={c.primary}
      cursorColor={c.primary}
      onFocus={(event) => { setFocused(true); onFocus?.(event); }}
      onBlur={(event) => { setFocused(false); onBlur?.(event); onEditingComplete?.(); }}
      style={[
        style,
        { fontSize: Math.max(16, StyleSheet.flatten(style)?.fontSize ?? 16), minHeight: 44 },
        focused && { borderColor: c.primary, backgroundColor: c.secondary },
        Platform.OS === 'web' && { outlineWidth: 0 },
      ]}
    />
  );
});

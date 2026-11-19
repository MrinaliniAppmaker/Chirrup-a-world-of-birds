import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, TextInput, type TextInputInstance, type TextInputProps } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { allowInputBlur, inputBlurWasRequested, noteInputFocus, recoverInputBlur, releaseInputFocus, resumeInputEditing, stillOwnsInputFocus } from '@/lib/inputFocus';

// Stable component identity across edits; focus styling never replaces the input.
// Enter submits without blurring. Only normal user focus changes dismiss it.
export const FieldInput = forwardRef<TextInputInstance, TextInputProps & { onEditingComplete?: () => void }>(function FieldInput(
  { style, onFocus, onBlur, onKeyPress, onSubmitEditing, onChangeText, onTouchStart, onEditingComplete, submitBehavior, blurOnSubmit = false, ...props }, ref,
) {
  const c = useColors();
  const [focused, setFocused] = useState(false);
  const input = useRef<TextInputInstance | null>(null);
  const owner = useRef({}).current;
  const attach = useCallback((node: TextInputInstance | null) => {
    input.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  }, [ref]);
  useEffect(() => () => releaseInputFocus(owner), [owner]);
  return (
    <TextInput
      {...props}
      ref={attach}
      submitBehavior={submitBehavior ?? (props.multiline ? 'newline' : 'submit')}
      // RN Web 0.21 still uses this flag rather than submitBehavior.
      blurOnSubmit={blurOnSubmit}
      selectionColor={c.primary}
      cursorColor={c.primary}
      onTouchStart={(event) => { resumeInputEditing(owner); onTouchStart?.(event); }}
      onChangeText={(text) => { resumeInputEditing(owner); onChangeText?.(text); }}
      onFocus={(event) => {
        noteInputFocus(owner, event.nativeEvent.target);
        setFocused(true);
        onFocus?.(event);
      }}
      onKeyPress={(event) => {
        if (event.nativeEvent.key === 'Tab' || event.nativeEvent.key === 'Escape') allowInputBlur(owner);
        onKeyPress?.(event);
      }}
      onSubmitEditing={(event) => {
        if (onSubmitEditing) allowInputBlur(owner);
        onSubmitEditing?.(event);
      }}
      onBlur={(event) => {
        const intentional = inputBlurWasRequested(owner);
        if (props.editable !== false && recoverInputBlur(owner)) {
          // Recover only an unrequested blur. Outside touches, another input,
          // screen unmounts and backgrounding explicitly cancel this recovery.
          queueMicrotask(() => {
            if (stillOwnsInputFocus(owner) && input.current && !input.current.isFocused()) input.current.focus();
          });
          return;
        }
        releaseInputFocus(owner);
        setFocused(false);
        onBlur?.(event);
        if (intentional) onEditingComplete?.();
      }}
      style={[
        style,
        { fontSize: Math.max(16, StyleSheet.flatten(style)?.fontSize ?? 16), minHeight: 44 },
        focused && { borderColor: c.primary, backgroundColor: c.secondary },
        Platform.OS === 'web' && { outlineWidth: 0 },
      ]}
    />
  );
});

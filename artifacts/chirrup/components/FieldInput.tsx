import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View, type TextInputInstance } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { allowInputBlur, inputBlurWasRequested, noteInputFocus, recoverInputBlur, releaseInputFocus, resumeInputEditing, stillOwnsInputFocus } from '@/lib/inputFocus';
import type { FieldInputProps } from './FieldInput.types';
import { traitHighlightParts } from '@/lib/traitHighlights';

// Stable component identity across edits; focus styling never replaces the input.
// Enter submits without blurring. Only normal user focus changes dismiss it.
export const FieldInput = forwardRef<TextInputInstance, FieldInputProps>(function FieldInput(
  { style, onFocus, onBlur, onKeyPress, onSubmitEditing, onChangeText, onTouchStart, onEditingComplete, submitBehavior, blurOnSubmit = false, highlightRanges, onScroll, ...props }, ref,
) {
  const c = useColors();
  const [focused, setFocused] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const highlighted = highlightRanges !== undefined;
  const flat = StyleSheet.flatten(style) ?? {};
  const border = flat.borderWidth ?? 0;
  const padLeft = flat.paddingLeft ?? flat.paddingHorizontal ?? flat.padding ?? 0;
  const padRight = flat.paddingRight ?? flat.paddingHorizontal ?? flat.padding ?? 0;
  const padTop = props.multiline ? flat.paddingTop ?? flat.paddingVertical ?? 12 : 11;
  const padBottom = props.multiline ? flat.paddingBottom ?? flat.paddingVertical ?? 12 : 11;
  const input = useRef<TextInputInstance | null>(null);
  const owner = useRef({}).current;
  const attach = useCallback((node: TextInputInstance | null) => {
    input.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  }, [ref]);
  useEffect(() => () => releaseInputFocus(owner), [owner]);
  const control = (
    <TextInput
      {...props}
      ref={attach}
      submitBehavior={submitBehavior ?? (props.multiline ? 'newline' : 'submit')}
      // RN Web 0.21 still uses this flag rather than submitBehavior.
      blurOnSubmit={blurOnSubmit}
      selectionColor={c.primary}
      cursorColor={c.primary}
      onScroll={(event) => {
        if (highlighted) setOffset(event.nativeEvent.contentOffset);
        onScroll?.(event);
      }}
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
        highlighted && {
          backgroundColor: 'transparent', marginTop: 0, marginBottom: 0,
          marginLeft: 0, marginRight: 0, lineHeight: 24, includeFontPadding: false,
          paddingTop: padTop, paddingBottom: padBottom,
        },
      ]}
    />
  );
  if (!highlighted) return control;
  return (
    <View style={{
      position: 'relative', overflow: 'hidden', borderRadius: flat.borderRadius,
      marginTop: flat.marginTop, marginBottom: flat.marginBottom,
      marginLeft: flat.marginLeft, marginRight: flat.marginRight,
      backgroundColor: focused ? c.secondary : flat.backgroundColor,
    }}>
      <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
        testID={`${props.testID}-highlights`} style={{
          position: 'absolute', overflow: 'hidden', opacity: 0.24,
          top: Number(padTop) + Number(border), bottom: Number(padBottom) + Number(border),
          left: Number(padLeft) + Number(border), right: Number(padRight) + Number(border),
        }}>
        <View style={{
          flexDirection: props.multiline ? 'column' : 'row',
          transform: [{ translateX: -offset.x }, { translateY: -offset.y }],
        }}>
          <Text style={{
            fontFamily: flat.fontFamily, fontWeight: flat.fontWeight, fontStyle: flat.fontStyle,
            fontSize: Math.max(16, flat.fontSize ?? 16), lineHeight: 24, includeFontPadding: false,
            letterSpacing: flat.letterSpacing, textAlign: flat.textAlign, color: 'transparent', flexShrink: 0,
          }}>
            {traitHighlightParts(props.value ?? '', highlightRanges ?? []).map((part, i) => (
              <Text key={i} style={part.invalid ? { backgroundColor: c.destructive } : undefined}>{part.text}</Text>
            ))}
          </Text>
        </View>
      </View>
      {control}
    </View>
  );
});

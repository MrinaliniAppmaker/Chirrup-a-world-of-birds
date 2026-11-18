import React, { useEffect, useRef, useState, type CSSProperties } from 'react';
import { StyleSheet, type TextInputProps } from 'react-native';
import { useColors } from '@/hooks/useColors';

// A real DOM input bypasses RN Web's TextInput responder/blur bookkeeping.
// Its DOM identity does not change while typing. Native builds continue to use
// FieldInput.tsx. Never recover focus with a timer or trap deliberate dismissal.
export function FieldInput({
  value, defaultValue, onChangeText, style, multiline = false, editable = true,
  testID, accessibilityLabel, placeholder, placeholderTextColor, maxLength,
  autoCapitalize = 'sentences', autoCorrect = true, keyboardType, returnKeyType,
  autoFocus, secureTextEntry, selectTextOnFocus,
}: TextInputProps) {
  const c = useColors();
  const element = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    let tap: { x: number; y: number; outside: boolean } | null = null;
    const start = (event: PointerEvent) => {
      tap = { x: event.clientX, y: event.clientY, outside: event.target instanceof Node && !element.current?.contains(event.target) };
    };
    const end = (event: PointerEvent) => {
      if (tap?.outside && Math.hypot(event.clientX - tap.x, event.clientY - tap.y) < 8 && document.activeElement === element.current) {
        element.current?.blur();
      }
      tap = null;
    };
    document.addEventListener('pointerdown', start, true);
    document.addEventListener('pointerup', end, true);
    return () => {
      document.removeEventListener('pointerdown', start, true);
      document.removeEventListener('pointerup', end, true);
    };
  }, []);

  const flat = StyleSheet.flatten(style) ?? {};
  const {
    paddingHorizontal, paddingVertical, marginHorizontal, marginVertical,
    textAlignVertical, ...rest
  } = flat;
  const css = {
    ...rest,
    paddingLeft: flat.paddingLeft ?? paddingHorizontal,
    paddingRight: flat.paddingRight ?? paddingHorizontal,
    paddingTop: flat.paddingTop ?? paddingVertical,
    paddingBottom: flat.paddingBottom ?? paddingVertical,
    marginLeft: flat.marginLeft ?? marginHorizontal,
    marginRight: flat.marginRight ?? marginHorizontal,
    marginTop: flat.marginTop ?? marginVertical,
    marginBottom: flat.marginBottom ?? marginVertical,
    // Safari zooms small input text when its keyboard opens. Do not disable
    // browser zoom; keep the actual editable text at least 16px instead.
    fontSize: Math.max(16, typeof flat.fontSize === 'number' ? flat.fontSize : 16),
    minHeight: Math.max(44, typeof flat.minHeight === 'number' ? flat.minHeight : 44),
    lineHeight: typeof flat.lineHeight === 'number' ? `${flat.lineHeight}px` : '1.5',
    boxSizing: 'border-box',
    borderStyle: 'solid',
    outline: 'none',
    minWidth: 0,
    maxWidth: '100%',
    resize: 'none',
    color: flat.color ?? c.foreground,
    caretColor: c.primary,
    backgroundColor: focused ? c.secondary : flat.backgroundColor ?? c.card,
    borderColor: focused ? c.primary : flat.borderColor,
    '--chirrup-placeholder': placeholderTextColor ?? c.mutedForeground,
  } as CSSProperties;
  const common = {
    ref: (node: HTMLInputElement | HTMLTextAreaElement | null) => { element.current = node; },
    'data-testid': testID,
    'aria-label': accessibilityLabel ?? placeholder,
    className: 'chirrup-field',
    value: value ?? undefined,
    defaultValue,
    placeholder,
    maxLength,
    readOnly: !editable,
    autoFocus,
    autoCapitalize,
    autoCorrect: autoCorrect ? 'on' : 'off',
    spellCheck: autoCorrect,
    style: css,
    onFocus: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFocused(true);
      if (selectTextOnFocus) event.currentTarget.select();
    },
    onBlur: () => setFocused(false),
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChangeText?.(event.currentTarget.value),
  };
  return <>
    <style>{'.chirrup-field::placeholder { color: var(--chirrup-placeholder); opacity: 1; }'}</style>
    {multiline ? <textarea {...common} rows={3} /> : <input {...common}
      type={secureTextEntry ? 'password' : keyboardType === 'email-address' ? 'email' : 'text'}
      inputMode={keyboardType === 'numeric' || keyboardType === 'number-pad' ? 'numeric' : keyboardType === 'decimal-pad' ? 'decimal' : undefined}
      enterKeyHint={returnKeyType === 'next' ? 'next' : returnKeyType === 'search' ? 'search' : undefined} />}
  </>;
}

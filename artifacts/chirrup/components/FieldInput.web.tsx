import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { StyleSheet, type TextInputInstance, type TextInputProps } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { externalBrowserInputValue, type BrowserInputValueState } from '@/lib/browserInputValue';

// A real DOM input bypasses RN Web's TextInput responder/blur bookkeeping.
// Its DOM identity does not change while typing. Native builds continue to use
// FieldInput.tsx. Recover only unintended blurs, never deliberate navigation.
export const FieldInput = forwardRef<TextInputInstance, TextInputProps & { onEditingComplete?: () => void }>(function FieldInput({
  value, defaultValue, onChangeText, style, multiline = false, editable = true,
  testID, accessibilityLabel, placeholder, placeholderTextColor, maxLength,
  autoCapitalize = 'sentences', autoCorrect = true, keyboardType, returnKeyType,
  autoFocus, secureTextEntry, selectTextOnFocus, onEditingComplete,
  onFocus, onBlur, onSubmitEditing, onKeyPress, autoComplete,
}, ref) {
  const c = useColors();
  const element = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const initialValue = useRef(value ?? defaultValue ?? '');
  const valueState = useRef<BrowserInputValueState>({ prop: value, reported: initialValue.current });
  const synchronizedNode = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const [focused, setFocused] = useState(false);
  const mounted = useRef(false);
  const deliberateBlur = useRef(false);
  const restoring = useRef(false);
  const restorations = useRef(0);
  const lastRestore = useRef(0);
  const attach = useCallback((node: HTMLInputElement | HTMLTextAreaElement | null) => { element.current = node; }, []);

  useLayoutEffect(() => {
    const node = element.current;
    // The browser owns an active edit. Echoing each keystroke back through
    // React's value property can disturb selection during concurrent renders.
    // Only apply a genuinely external change (reset, prefilling, restored draft).
    if (!node) return;
    if (synchronizedNode.current !== node) {
      synchronizedNode.current = node;
      valueState.current = { prop: undefined, reported: node.value };
    }
    const external = externalBrowserInputValue(valueState.current, value, node.value);
    if (external === undefined) return;
    const start = node.selectionStart;
    const end = node.selectionEnd;
    node.value = external;
    if (document.activeElement === node && start !== null && end !== null) {
      node.setSelectionRange(Math.min(start, external.length), Math.min(end, external.length));
    }
  }, [value]);

  useImperativeHandle(ref, () => ({
    focus: () => { deliberateBlur.current = false; element.current?.focus(); },
    blur: () => { deliberateBlur.current = true; element.current?.blur(); },
    clear: () => {
      if (element.current) element.current.value = '';
      valueState.current.reported = '';
      onChangeText?.('');
    },
    isFocused: () => document.activeElement === element.current,
  }) as TextInputInstance, [onChangeText]);

  useEffect(() => {
    mounted.current = true;
    let tap: { x: number; y: number; outside: boolean } | null = null;
    const start = (event: PointerEvent) => {
      if (document.activeElement !== element.current) { tap = null; return; }
      tap = { x: event.clientX, y: event.clientY, outside: event.target instanceof Node && !element.current?.contains(event.target) };
      deliberateBlur.current = tap.outside;
      if (!tap.outside) restorations.current = 0;
    };
    const end = (event: PointerEvent) => {
      if (tap && Math.hypot(event.clientX - tap.x, event.clientY - tap.y) >= 8) {
        tap = null;
        deliberateBlur.current = false;
      }
    };
    const click = () => {
      // Click, not pointer-up: touch scrolling and keyboard/viewport changes
      // must not be mistaken for a request to finish editing.
      if (tap?.outside && document.activeElement === element.current) {
        deliberateBlur.current = true;
        element.current?.blur();
      }
      tap = null;
    };
    const cancel = () => {
      tap = null;
      deliberateBlur.current = false;
    };
    const key = (event: KeyboardEvent) => {
      if (document.activeElement === element.current && (event.key === 'Tab' || event.key === 'Escape')) deliberateBlur.current = true;
    };
    document.addEventListener('pointerdown', start, true);
    document.addEventListener('pointerup', end, true);
    document.addEventListener('pointercancel', cancel, true);
    document.addEventListener('click', click, true);
    document.addEventListener('keydown', key, true);
    return () => {
      mounted.current = false;
      document.removeEventListener('pointerdown', start, true);
      document.removeEventListener('pointerup', end, true);
      document.removeEventListener('pointercancel', cancel, true);
      document.removeEventListener('click', click, true);
      document.removeEventListener('keydown', key, true);
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
    ref: attach,
    'data-testid': testID,
    'aria-label': accessibilityLabel ?? placeholder,
    className: 'chirrup-field',
    defaultValue: initialValue.current,
    placeholder,
    maxLength,
    readOnly: !editable,
    autoFocus,
    autoComplete: autoComplete === 'off' ? 'off' : autoComplete,
    autoCapitalize,
    autoCorrect: autoCorrect ? 'on' : 'off',
    spellCheck: autoCorrect,
    style: css,
    onFocus: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      deliberateBlur.current = false;
      if (!restoring.current) restorations.current = 0;
      restoring.current = false;
      setFocused(true);
      if (selectTextOnFocus) event.currentTarget.select();
      onFocus?.(event as unknown as Parameters<NonNullable<TextInputProps['onFocus']>>[0]);
    },
    onBlur: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const node = event.currentTarget;
      const next = event.relatedTarget;
      // Styling must reflect actual focus, including failed/cancelled recovery.
      // A green border alone is never evidence that keyboard events reach us.
      setFocused(false);
      const nextIsEditor = next instanceof HTMLElement
        && (next.matches('input, textarea, select') || next.isContentEditable);
      if (nextIsEditor) deliberateBlur.current = true;
      const finish = () => {
        if (!mounted.current) return;
        setFocused(false);
        onBlur?.(event as unknown as Parameters<NonNullable<TextInputProps['onBlur']>>[0]);
        if (deliberateBlur.current) onEditingComplete?.();
      };
      const unexpected = !deliberateBlur.current && editable && document.visibilityState === 'visible' && document.hasFocus();
      // A delayed screen/dialog focus change is not the same as clicking away.
      // Bound immediate focus loops, not separate interruptions during an edit.
      const now = Date.now();
      if (now - lastRestore.current > 250) restorations.current = 0;
      if (!unexpected || restorations.current >= 2) { finish(); return; }
      const start = node.selectionStart;
      const end = node.selectionEnd;
      restorations.current += 1;
      lastRestore.current = now;
      queueMicrotask(() => {
        if (!mounted.current || !node.isConnected) return;
        if (deliberateBlur.current || !document.hasFocus() || document.visibilityState !== 'visible'
          || (document.activeElement !== document.body && document.activeElement !== node && document.activeElement !== next)) { finish(); return; }
        restoring.current = true;
        node.focus({ preventScroll: true });
        // Email inputs do not support selection ranges.
        if (start !== null && end !== null) node.setSelectionRange(start, end);
      });
    },
    onKeyDown: (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onKeyPress?.(event as unknown as Parameters<NonNullable<TextInputProps['onKeyPress']>>[0]);
      if (!multiline && event.key === 'Enter' && !event.nativeEvent.isComposing) {
        event.preventDefault();
        if (onSubmitEditing) {
          deliberateBlur.current = true;
          onSubmitEditing({ ...event, nativeEvent: { text: event.currentTarget.value } } as unknown as Parameters<NonNullable<TextInputProps['onSubmitEditing']>>[0]);
        }
      }
    },
    // This control is browser-owned, not a React-controlled value. Native input
    // events must reach form state even when autofill/IME or another browser
    // integration updated React's value tracker before dispatching the event.
    onInput: (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      deliberateBlur.current = false;
      restorations.current = 0;
      valueState.current.reported = event.currentTarget.value;
      onChangeText?.(event.currentTarget.value);
    },
  };
  return <>
    <style>{'.chirrup-field::placeholder { color: var(--chirrup-placeholder); opacity: 1; }'}</style>
    {multiline ? <textarea {...common} rows={3} /> : <input {...common}
      type={secureTextEntry ? 'password' : keyboardType === 'email-address' ? 'email' : 'text'}
      inputMode={keyboardType === 'numeric' || keyboardType === 'number-pad' ? 'numeric' : keyboardType === 'decimal-pad' ? 'decimal' : undefined}
      enterKeyHint={returnKeyType === 'next' ? 'next' : returnKeyType === 'search' ? 'search' : undefined} />}
  </>;
});

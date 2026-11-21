import type { TextInputProps } from 'react-native';

export type InputHighlightRange = { start: number; end: number };
export type FieldInputProps = TextInputProps & {
  onEditingComplete?: () => void;
  highlightRanges?: readonly InputHighlightRange[];
};

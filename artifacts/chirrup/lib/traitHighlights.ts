import type { BirdTraitIssue } from '@workspace/api-client-react';

/** Render exact source slices; merge overlapping model ranges without repeating text. */
export function traitHighlightParts(value: string, issues: Pick<BirdTraitIssue, 'start' | 'end'>[]) {
  const ranges: { start: number; end: number }[] = [];
  for (const issue of [...issues].sort((a, b) => a.start - b.start)) {
    const start = Math.max(0, Math.min(value.length, issue.start));
    const end = Math.max(start, Math.min(value.length, issue.end));
    if (end === start) continue;
    const previous = ranges[ranges.length - 1];
    if (previous && start <= previous.end) previous.end = Math.max(previous.end, end);
    else ranges.push({ start, end });
  }
  const parts: { text: string; invalid: boolean }[] = [];
  let from = 0;
  for (const range of ranges) {
    if (range.start > from) parts.push({ text: value.slice(from, range.start), invalid: false });
    parts.push({ text: value.slice(range.start, range.end), invalid: true });
    from = range.end;
  }
  if (from < value.length) parts.push({ text: value.slice(from), invalid: false });
  return parts;
}

import type { GeneratedBird } from '@workspace/api-client-react';

// A navigation handoff, not a journal save. Keep images out of route URLs and
// scope the temporary bird to its owner, including guest sessions.
let draft: { owner: string; token: string; bird: GeneratedBird; expires: number } | null = null;
let sequence = 0;
export function stageInteractionBird(owner: string, bird: GeneratedBird): string {
  const token = `${Date.now().toString(36)}-${++sequence}`;
  draft = { owner, token, bird: { ...bird }, expires: Date.now() + 30 * 60 * 1000 };
  return token;
}
export function readInteractionBird(owner: string, token: string | undefined): GeneratedBird | undefined {
  if (!draft || !token || draft.owner !== owner || draft.token !== token || draft.expires <= Date.now()) return undefined;
  return draft.bird;
}

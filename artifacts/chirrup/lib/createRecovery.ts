import type { GeneratedBird } from '@workspace/api-client-react';
import type { TraitKey } from '@/constants/traits';

export interface CreateRecoveryDraft {
  step: 'build' | 'review' | 'result';
  mode: 'visual' | 'typed';
  sel: Record<TraitKey, string>;
  typed: Record<TraitKey, string>;
  expanded: Record<string, boolean>;
  showExtra: boolean;
  extra: string;
  bird: GeneratedBird | null;
  birdName: string;
  nameDraft: string;
  editingName: boolean;
  showNameDialog: boolean;
  popupName: string;
}

// Session-only recovery, not a second journal. Deliberately leaving Create or
// changing accounts still discards the draft as before.
const drafts = new Map<string, CreateRecoveryDraft>();
export const getCreateRecoveryDraft = (owner: string) => drafts.get(owner);
export const keepCreateRecoveryDraft = (owner: string, draft: CreateRecoveryDraft) => { drafts.set(owner, draft); };
export const clearCreateRecoveryDrafts = () => { drafts.clear(); };
export const discardCreateRecoveryDraft = (owner: string) => { drafts.delete(owner); };

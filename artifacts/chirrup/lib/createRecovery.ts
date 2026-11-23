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

// Session-only recovery, not a second journal. One generated guest bird can
// cross the Home -> sign-in detour. Never transfer a signed-in user's draft.
const drafts = new Map<string, CreateRecoveryDraft>();
let guestSignInDraft: CreateRecoveryDraft | undefined;
let claimedGuestOwner: string | undefined;
export function getCreateRecoveryDraft(owner: string) {
  // An account-keyed navigator can mount Create before the parent's auth
  // effect. Claim once, synchronously, without blanking/unmounting navigation.
  if (owner !== 'guest' && guestSignInDraft && !claimedGuestOwner) {
    claimedGuestOwner = owner;
    drafts.set(owner, guestSignInDraft);
    guestSignInDraft = undefined;
  }
  return drafts.get(owner);
}
export const keepCreateRecoveryDraft = (owner: string, draft: CreateRecoveryDraft) => { drafts.set(owner, draft); };
export const clearCreateRecoveryDrafts = () => { drafts.clear(); guestSignInDraft = undefined; claimedGuestOwner = undefined; };
export const discardCreateRecoveryDraft = (owner: string) => { drafts.delete(owner); };

export function parkGuestBirdForSignIn(owner: string, destination: string | undefined, draft: CreateRecoveryDraft | undefined) {
  if (owner === 'guest' && destination === 'index' && draft?.step === 'result' && draft.bird) {
    guestSignInDraft = { ...draft, showNameDialog: false };
  }
}

export const discardGuestSignInBird = () => { guestSignInDraft = undefined; claimedGuestOwner = undefined; };

export function changeCreateRecoveryOwner(previous: string, next: string) {
  if (previous === next) return;
  const transferable = previous === 'guest' && next !== 'guest'
    ? guestSignInDraft ?? (claimedGuestOwner === next ? drafts.get(next) : undefined)
    : undefined;
  clearCreateRecoveryDrafts();
  if (transferable) drafts.set(next, transferable);
}

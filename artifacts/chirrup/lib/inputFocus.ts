import { AppState, type GestureResponderEvent } from 'react-native';

type FocusOwner = { owner: object; target: unknown; allowBlur: boolean; restorations: number; lastRestore: number };
let active: FocusOwner | null = null;

export function noteInputFocus(owner: object, target: unknown) {
  const restorations = active?.owner === owner ? active.restorations : 0;
  const lastRestore = active?.owner === owner ? active.lastRestore : 0;
  active = { owner, target, allowBlur: false, restorations, lastRestore };
}

/** Observe touches without taking the responder or interfering with scrolling. */
export function noteInputTouch(event: GestureResponderEvent): false {
  if (active) {
    active.allowBlur = event.nativeEvent.target !== active.target;
    if (!active.allowBlur) active.restorations = 0;
  }
  return false;
}

export function allowInputBlur(owner: object) {
  if (active?.owner === owner) active.allowBlur = true;
}

export function resumeInputEditing(owner: object) {
  if (active?.owner === owner) { active.allowBlur = false; active.restorations = 0; }
}
export const inputBlurWasRequested = (owner: object) => active?.owner !== owner || active.allowBlur;

export function recoverInputBlur(owner: object): boolean {
  if (active?.owner !== owner || active.allowBlur || AppState.currentState !== 'active') return false;
  const now = Date.now();
  if (now - active.lastRestore > 250) active.restorations = 0;
  if (active.restorations >= 2) return false;
  active.restorations += 1;
  active.lastRestore = now;
  return true;
}

export const stillOwnsInputFocus = (owner: object) =>
  active?.owner === owner && !active.allowBlur && AppState.currentState === 'active';
export function releaseInputFocus(owner: object) {
  if (active?.owner === owner) active = null;
}

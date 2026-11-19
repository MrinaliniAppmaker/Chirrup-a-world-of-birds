export type BrowserInputValueState = { prop: string | undefined; reported: string };

/**
 * Ignore parent echoes and identical prop replays (including development hot
 * updates). The browser may already contain the user's next, uncommitted edit.
 */
export function externalBrowserInputValue(state: BrowserInputValueState, incoming: string | undefined, current: string): string | undefined {
  if (incoming === state.prop) return undefined;
  state.prop = incoming;
  if (incoming === undefined) return undefined;
  if (current === incoming) { state.reported = incoming; return undefined; }
  if (incoming === state.reported) return undefined;
  state.reported = incoming;
  return incoming;
}

type PopupCompletion<T> =
  | { kind: 'completed'; value: T }
  | { kind: 'closed' | 'aborted' | 'timeout' };

// Some Clerk/browser combinations leave sso() pending when a user closes its
// popup. Do not make restoring the form depend on that promise settling.
export async function waitForGooglePopup<T>(
  operation: Promise<T>,
  isClosed: () => boolean,
  signal: AbortSignal,
  { pollMs = 250, closeGraceMs = 1000, maxWaitMs = 10 * 60 * 1000 } = {},
): Promise<PopupCompletion<T>> {
  let timer: ReturnType<typeof setInterval> | undefined;
  let onAbort: (() => void) | undefined;
  const started = Date.now();
  let closedAt: number | null = null;
  const stopped = new Promise<PopupCompletion<T>>((resolve) => {
    onAbort = () => resolve({ kind: 'aborted' });
    if (signal.aborted) { onAbort(); return; }
    signal.addEventListener('abort', onAbort, { once: true });
    timer = setInterval(() => {
      const now = Date.now();
      if (now - started >= maxWaitMs) { resolve({ kind: 'timeout' }); return; }
      try {
        if (!isClosed()) { closedAt = null; return; }
      } catch { return; }
      closedAt ??= now;
      // Let a successful callback's message arrive before treating close as cancel.
      if (now - closedAt >= closeGraceMs) resolve({ kind: 'closed' });
    }, pollMs);
  });
  try {
    return await Promise.race([
      operation.then((value): PopupCompletion<T> => ({ kind: 'completed', value })),
      stopped,
    ]);
  } finally {
    if (timer !== undefined) clearInterval(timer);
    if (onAbort) signal.removeEventListener('abort', onAbort);
  }
}

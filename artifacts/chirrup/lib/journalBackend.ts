import AsyncStorage from '@react-native-async-storage/async-storage';
import type { QueryClient } from '@tanstack/react-query';
import {
  deleteJournalBird, getListJournalBirdsQueryOptions, registerJournalInstallation,
  requestJournalPortrait, saveJournalBird,
  getAccountJournal, claimJournal,
  type GeneratedBird, type JournalInstallation,
} from '@workspace/api-client-react';
import { prepareJournalPortrait } from './journalPortraitUpload';
import { loadCollection } from './collectionStorage';

const DEVICE_KEY = 'chirrup.journal.installation.v1';
const CLAIM_KEY = 'chirrup.journal.claimed-account.v1';
let installationPromise: Promise<JournalInstallation> | undefined;
export type AccountJournalSession = JournalInstallation & { getToken?: () => Promise<string | null> };
export const legacyJournalWasClaimed = async () => Boolean(await AsyncStorage.getItem(CLAIM_KEY));

// Only the signed-in account can obtain this journal identity; never persist a JWT.
export async function openAccountJournal(userId: string, getToken: () => Promise<string | null>): Promise<AccountJournalSession> {
  const token = await getToken();
  if (!token) throw new Error('Sign in to open your account journal.');
  const options = { headers: { Authorization: `Bearer ${token}` } };
  const result = await timed(signal => getAccountJournal({ ...options, signal }));
  return { ...result, token: '', getToken };
}

export async function importLegacyJournal(userId: string, session: AccountJournalSession): Promise<void> {
  if (await AsyncStorage.getItem(CLAIM_KEY)) return;
  const local = await loadCollection();
  const existingKey = await AsyncStorage.getItem(DEVICE_KEY);
  if (!existingKey && local.length === 0) return;
  const legacy = await getJournalInstallation();
  // Reconcile unsynced local birds before transferring the original objects.
  // An already-claimed token can occur if the app closed after the server commit;
  // the idempotent claim below recovers that case.
  try {
    const remote = await timed(signal => import('@workspace/api-client-react').then(api =>
      api.listJournalBirds({ headers: { Authorization: `Bearer ${legacy.token}` }, signal })));
    const missing = local.filter(bird => !remote.some(saved => saved.id === bird.id));
    if (remote.length + missing.length > 100) throw new Error('Your journal has more than 100 birds to import. No birds were removed.');
    for (const bird of missing) await saveBackendBird(legacy, bird);
  } catch (error) {
    if ((error as { status?: number })?.status !== 401) throw error;
  }
  await timed(async signal => claimJournal({ token: legacy.token }, { headers: await headers(session), signal }));
  // This also prevents a second account on a shared device importing these birds.
  await AsyncStorage.setItem(CLAIM_KEY, userId);
}

// Browsers with Web Locks also serialize first registration/import across tabs.
// Native apps already serialize journal operations in their shared provider.
export async function withJournalLock<T>(work: () => Promise<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks?.request) {
    return navigator.locks.request('chirrup-private-journal', work);
  }
  return work();
}

async function timed<T>(request: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try { return await request(controller.signal); }
  finally { clearTimeout(timeout); }
}

export function getJournalInstallation(): Promise<JournalInstallation> {
  if (!installationPromise) {
    installationPromise = (async () => {
      const raw = await AsyncStorage.getItem(DEVICE_KEY);
      if (raw !== null) {
        const session: JournalInstallation = JSON.parse(raw);
        if (typeof session.installationId !== 'string' || typeof session.token !== 'string') {
          // Never silently replace a credential and disconnect an existing journal.
          throw new Error('This phone’s journal key could not be read. Your local birds are unchanged.');
        }
        return session;
      }
      const session = await timed(signal => registerJournalInstallation({ signal }));
      await AsyncStorage.setItem(DEVICE_KEY, JSON.stringify(session));
      return session;
    })().catch(error => { installationPromise = undefined; throw error; });
  }
  return installationPromise;
}

const headers = async (session: AccountJournalSession) => {
  const token = session.getToken ? await session.getToken() : session.token;
  if (!token) throw new Error('Sign in again to access your journal.');
  return { Authorization: `Bearer ${token}` };
};
const migrationKey = (session: JournalInstallation) => `chirrup.journal.imported.${session.installationId}`;
export const hasImportedJournal = async (session: JournalInstallation) => (await AsyncStorage.getItem(migrationKey(session))) === 'yes';
export const markJournalImported = (session: JournalInstallation) => AsyncStorage.setItem(migrationKey(session), 'yes');

export async function loadBackendBirds(session: AccountJournalSession, queryClient: QueryClient) {
  const auth = await headers(session);
  return timed(signal => queryClient.fetchQuery(getListJournalBirdsQueryOptions({
    query: { queryKey: ['private-journal', session.installationId], staleTime: 0, retry: false },
    request: { headers: auth, signal },
  })));
}

export async function saveBackendBird(session: AccountJournalSession, bird: GeneratedBird) {
  const portrait = await prepareJournalPortrait(bird.imageUri);
  try {
    const upload = await timed(async signal => requestJournalPortrait({
      birdId: bird.id, contentType: portrait.contentType, byteLength: portrait.byteLength,
    }, { headers: await headers(session), signal }));
    await portrait.put(upload.uploadUrl);
    return await timed(async signal => saveJournalBird({
      bird: { ...bird, imageUri: '' }, portraitPath: upload.portraitPath,
    }, { headers: await headers(session), signal }));
  } finally { await portrait.dispose(); }
}

export async function removeBackendBird(session: AccountJournalSession, id: string) {
  await timed(async signal => deleteJournalBird(id, { headers: await headers(session), signal }));
}

export function journalErrorMessage(error: unknown): string {
  const apiError = error as { data?: { error?: unknown }; message?: string };
  if (typeof apiError?.data?.error === 'string') return apiError.data.error;
  if (error instanceof Error && /portrait|journal key|birds to import|sign in/i.test(error.message)) return error.message;
  return 'Could not reach your private journal. Your on-device birds are unchanged. Check your connection and retry.';
}

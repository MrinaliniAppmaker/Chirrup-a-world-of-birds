import AsyncStorage from '@react-native-async-storage/async-storage';
import type { QueryClient } from '@tanstack/react-query';
import {
  deleteJournalBird, getListJournalBirdsQueryOptions, registerJournalInstallation,
  requestJournalPortrait, saveJournalBird,
  type GeneratedBird, type JournalInstallation,
} from '@workspace/api-client-react';
import { prepareJournalPortrait } from './journalPortraitUpload';

const DEVICE_KEY = 'chirrup.journal.installation.v1';
let installationPromise: Promise<JournalInstallation> | undefined;

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

const headers = (session: JournalInstallation) => ({ Authorization: `Bearer ${session.token}` });
const migrationKey = (session: JournalInstallation) => `chirrup.journal.imported.${session.installationId}`;
export const hasImportedJournal = async (session: JournalInstallation) => (await AsyncStorage.getItem(migrationKey(session))) === 'yes';
export const markJournalImported = (session: JournalInstallation) => AsyncStorage.setItem(migrationKey(session), 'yes');

export async function loadBackendBirds(session: JournalInstallation, queryClient: QueryClient) {
  return timed(signal => queryClient.fetchQuery(getListJournalBirdsQueryOptions({
    query: { queryKey: ['private-journal', session.installationId], staleTime: 0, retry: false },
    request: { headers: headers(session), signal },
  })));
}

export async function saveBackendBird(session: JournalInstallation, bird: GeneratedBird) {
  const portrait = await prepareJournalPortrait(bird.imageUri);
  try {
    const upload = await timed(signal => requestJournalPortrait({
      birdId: bird.id, contentType: portrait.contentType, byteLength: portrait.byteLength,
    }, { headers: headers(session), signal }));
    await portrait.put(upload.uploadUrl);
    return await timed(signal => saveJournalBird({
      bird: { ...bird, imageUri: '' }, portraitPath: upload.portraitPath,
    }, { headers: headers(session), signal }));
  } finally { await portrait.dispose(); }
}

export async function removeBackendBird(session: JournalInstallation, id: string) {
  await timed(signal => deleteJournalBird(id, { headers: headers(session), signal }));
}

export function journalErrorMessage(error: unknown): string {
  const apiError = error as { data?: { error?: unknown }; message?: string };
  if (typeof apiError?.data?.error === 'string') return apiError.data.error;
  if (error instanceof Error && /portrait|journal key|birds to import/i.test(error.message)) return error.message;
  return 'Could not reach your private journal. Your on-device birds are unchanged. Check your connection and retry.';
}

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { GeneratedBird } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { hasLocalPortrait, loadCollection, saveCollectionBird, removeCollectionBird, replaceCollection, MAX_BIRDS } from '@/lib/collectionStorage';
import {
  getJournalInstallation, hasImportedJournal, journalErrorMessage, loadBackendBirds,
  markJournalImported, removeBackendBird, saveBackendBird, withJournalLock,
} from '@/lib/journalBackend';

interface CollectionValue {
  birds: GeneratedBird[];
  loaded: boolean;
  error: string | null;
  syncing: boolean;
  syncError: string | null;
  retrySync: () => Promise<void>;
  isSaved: (id: string) => boolean;
  save: (bird: GeneratedBird) => Promise<void>;
  remove: (id: string) => Promise<void>;
  get: (id: string) => GeneratedBird | undefined;
}

const CollectionContext = createContext<CollectionValue | null>(null);

export function CollectionProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [birds, setBirds] = useState<GeneratedBird[]>([]);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);
  const current = useRef<GeneratedBird[]>([]);
  const operations = useRef<Promise<void>>(Promise.resolve());
  const storageReady = useRef(false);
  const backendReady = useRef(false);

  const enqueue = useCallback(<T,>(work: () => Promise<T>): Promise<T> => {
    const result = operations.current.then(() => withJournalLock(work));
    operations.current = result.then(() => {}, () => {});
    return result;
  }, []);

  const synchronize = useCallback(async () => {
    setSyncing(true);
    try {
      const session = await getJournalInstallation();
      let remote = await loadBackendBirds(session, queryClient);
      if (!await hasImportedJournal(session)) {
        const missing = current.current.filter(bird => !remote.some(saved => saved.id === bird.id));
        if (remote.length + missing.length > MAX_BIRDS) throw new Error('Your journal has more than 100 birds to import. No local birds were removed.');
        // Every upload is idempotent; a failed import resumes without duplicates.
        for (const bird of missing) await saveBackendBird(session, bird);
        remote = await loadBackendBirds(session, queryClient);
        // Once imported, server deletions must never be resurrected from the cache.
        await markJournalImported(session);
      }
      const recovered = await Promise.all(remote.map(async bird => {
        const cached = current.current.find(saved => saved.id === bird.id);
        return cached && await hasLocalPortrait(cached) ? { ...bird, imageUri: cached.imageUri } : bird;
      }));
      const stored = await replaceCollection(recovered);
      current.current = stored;
      setBirds(stored);
      backendReady.current = true;
      setSyncError(null);
      setError(null);
    } catch (err) {
      backendReady.current = false;
      setSyncError(journalErrorMessage(err));
      throw err;
    } finally { setSyncing(false); }
  }, [queryClient]);

  const retrySync = useCallback(() => enqueue(async () => {
    try {
      if (!storageReady.current) {
        const saved = await loadCollection();
        current.current = saved; setBirds(saved); storageReady.current = true;
      }
      await synchronize();
    } catch (err) {
      setSyncError(journalErrorMessage(err));
    } finally { setLoaded(true); }
  }), [enqueue, synchronize]);

  useEffect(() => {
    void enqueue(async () => {
      try {
        const saved = await loadCollection();
        current.current = saved; storageReady.current = true; setBirds(saved);
        setLoaded(true);
        await synchronize();
      } catch (err) {
        if (!storageReady.current) setError('Could not open your on-device journal. No birds were changed.');
        else setSyncError(journalErrorMessage(err));
      } finally { setLoaded(true); }
    });
  }, [enqueue, synchronize]);

  const save = useCallback((bird: GeneratedBird) => enqueue(async () => {
    if (!loaded) throw new Error('Your journal is still opening.');
    if (!storageReady.current) throw new Error('Your journal could not be opened. Reopen the app before saving.');
    if (!backendReady.current) {
      try { await synchronize(); } catch (err) { throw new Error(journalErrorMessage(err)); }
    }
    if (current.current.some((b) => b.id === bird.id)) return;
    if (current.current.length >= MAX_BIRDS) {
      const message = `Your library holds up to ${MAX_BIRDS} birds. Remove a bird before saving another.`;
      setError(message);
      throw new Error(message);
    }
    try {
      const session = await getJournalInstallation();
      const remote = await saveBackendBird(session, bird);
      let stored = remote;
      try {
        stored = await saveCollectionBird({ ...remote, imageUri: bird.imageUri }, current.current);
        setSyncError(null);
      } catch {
        // The server already committed. Do not claim the save failed or lose it.
        setSyncError('Saved to your private journal, but the offline copy could not be stored. Free device space, then retry sync.');
      }
      current.current = [stored, ...current.current];
      setBirds(current.current);
      setError(null);
    } catch (err) {
      const message = journalErrorMessage(err);
      setSyncError(message);
      throw new Error(message, { cause: err });
    }
  }), [enqueue, loaded, synchronize]);

  const remove = useCallback((id: string) => enqueue(async () => {
    if (!loaded) throw new Error('Your journal is still opening.');
    if (!storageReady.current) throw new Error('Your journal could not be opened. Reopen the app before making changes.');
    try {
      if (!backendReady.current) await synchronize();
      const session = await getJournalInstallation();
      await removeBackendBird(session, id);
      try {
        await removeCollectionBird(id, current.current);
        setSyncError(null);
      } catch {
        setSyncError('Removed from your private journal. Retry sync to update the offline copy.');
      }
      current.current = current.current.filter((bird) => bird.id !== id);
      setBirds(current.current);
      setError(null);
    } catch (err) {
      const message = journalErrorMessage(err);
      setSyncError(message);
      throw new Error(message, { cause: err });
    }
  }), [enqueue, loaded, synchronize]);

  const value = useMemo<CollectionValue>(() => ({
    birds, loaded, error, syncing, syncError, retrySync, save, remove,
    isSaved: (id) => birds.some((b) => b.id === id),
    get: (id) => birds.find((b) => b.id === id),
  }), [birds, loaded, error, syncing, syncError, retrySync, save, remove]);

  return <CollectionContext.Provider value={value}>{children}</CollectionContext.Provider>;
}

export function useCollection() {
  const ctx = useContext(CollectionContext);
  if (!ctx) throw new Error('useCollection must be used within CollectionProvider');
  return ctx;
}

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { importBirdShareBatch, type GeneratedBird } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/expo';
import { hasLocalPortrait, loadCollection, saveCollectionBird, removeCollectionBird, replaceCollection, MAX_BIRDS } from '@/lib/collectionStorage';
import {
  journalErrorMessage, loadBackendBirds, openAccountJournal, importLegacyJournal,
  legacyJournalWasClaimed, removeBackendBird, saveBackendBird, withJournalLock,
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
  importShared: (token: string) => Promise<GeneratedBird[]>;
  remove: (id: string) => Promise<void>;
  get: (id: string) => GeneratedBird | undefined;
}

const CollectionContext = createContext<CollectionValue | null>(null);

export function CollectionProvider({ children }: { children: React.ReactNode }) {
  const { userId, getToken } = useAuth();
  const owner = userId ?? undefined;
  const auth = useRef({ userId, getToken });
  auth.current = { userId, getToken };
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const ensureOwner = useCallback(() => {
    if (!mounted.current || auth.current.userId !== userId) throw new Error('Sign in again to access your journal.');
  }, [userId]);
  const getSession = useCallback(async () => {
    ensureOwner();
    if (!userId) throw new Error('Sign in to save birds to your account journal.');
    const session = await openAccountJournal(userId, async () => {
      ensureOwner();
      return auth.current.getToken();
    });
    ensureOwner();
    return session;
  }, [userId, ensureOwner]);
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
  const migrationWarning = useRef<string | null>(null);

  const enqueue = useCallback(<T,>(work: () => Promise<T>): Promise<T> => {
    const result = operations.current.then(() => withJournalLock(work));
    operations.current = result.then(() => {}, () => {});
    return result;
  }, []);

  const synchronize = useCallback(async () => {
    ensureOwner();
    if (!userId) {
      backendReady.current = false;
      setSyncError('Sign in from Home to save and sync your journal.');
      return;
    }
    setSyncing(true);
    try {
      const session = await getSession();
      migrationWarning.current = null;
      try {
        await importLegacyJournal(userId, session);
      } catch (err) {
        // A full account or interrupted legacy transfer must not prevent opening
        // the existing account journal (including removing birds to free space).
        migrationWarning.current = `Some birds from this phone have not transferred. The original phone journal is preserved. ${journalErrorMessage(err)}`;
      }
      const remote = await loadBackendBirds(session, queryClient);
      ensureOwner();
      const recovered = await Promise.all(remote.map(async bird => {
        const cached = current.current.find(saved => saved.id === bird.id);
        return cached && await hasLocalPortrait(cached) ? { ...bird, imageUri: cached.imageUri } : bird;
      }));
      ensureOwner();
      const stored = await replaceCollection(recovered, owner);
      ensureOwner();
      current.current = stored;
      setBirds(stored);
      backendReady.current = true;
      setSyncError(migrationWarning.current);
      setError(null);
    } catch (err) {
      backendReady.current = false;
      setSyncError(journalErrorMessage(err));
      throw err;
    } finally { setSyncing(false); }
  }, [queryClient, userId, owner, getSession, ensureOwner]);

  const retrySync = useCallback(() => enqueue(async () => {
    try {
      if (!storageReady.current) {
        const saved = !owner && await legacyJournalWasClaimed() ? [] : await loadCollection(owner);
        current.current = saved; setBirds(saved); storageReady.current = true;
      }
      await synchronize();
    } catch (err) {
      setSyncError(journalErrorMessage(err));
    } finally { setLoaded(true); }
  }), [enqueue, synchronize, owner]);

  useEffect(() => {
    void enqueue(async () => {
      try {
        const saved = !owner && await legacyJournalWasClaimed() ? [] : await loadCollection(owner);
        ensureOwner();
        current.current = saved; storageReady.current = true; setBirds(saved);
        setLoaded(true);
        await synchronize();
      } catch (err) {
        if (!storageReady.current) setError('Could not open your on-device journal. No birds were changed.');
        else setSyncError(journalErrorMessage(err));
      } finally { setLoaded(true); }
    });
  }, [enqueue, synchronize, owner, ensureOwner]);

  const save = useCallback((bird: GeneratedBird) => enqueue(async () => {
    ensureOwner();
    if (!userId) throw new Error('Sign in from Home to save birds to your account journal.');
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
      const session = await getSession();
      const remote = await saveBackendBird(session, bird);
      ensureOwner();
      let stored = remote;
      try {
        stored = await saveCollectionBird({ ...remote, imageUri: bird.imageUri }, current.current, owner);
        setSyncError(migrationWarning.current);
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
  }), [enqueue, loaded, synchronize, userId, owner, getSession, ensureOwner]);

  const importShared = useCallback((token: string) => enqueue(async () => {
    ensureOwner();
    if (!userId) throw new Error('Sign in to add this shared bird.');
    const session = await getSession();
    const accessToken = await session.getToken!();
    if (!accessToken) throw new Error('Sign in again to add this shared bird.');
    const remote = await importBirdShareBatch({ token }, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    ensureOwner();
    // The server already saved the copy. An offline-cache failure must not tell
    // the user to re-import or suggest that their committed bird was lost.
    const merged = [
      ...remote.map(bird => current.current.find(cached => cached.id === bird.id) ?? bird),
      ...current.current.filter(bird => !remote.some(imported => imported.id === bird.id)),
    ];
    try {
      if (!storageReady.current) throw new Error('Offline storage not ready.');
      const stored = await replaceCollection(merged, owner);
      current.current = stored;
      setBirds(current.current);
      setError(null);
      setSyncError(migrationWarning.current);
      return remote.map(bird => stored.find(cached => cached.id === bird.id)!);
    } catch {
      current.current = merged;
      setBirds(current.current);
      setSyncError('The shared birds are saved to your account. Retry sync to keep offline copies.');
      return remote;
    }
  }), [enqueue, ensureOwner, userId, getSession, owner]);

  const remove = useCallback((id: string) => enqueue(async () => {
    ensureOwner();
    if (!userId) throw new Error('Sign in from Home before changing this journal.');
    if (!loaded) throw new Error('Your journal is still opening.');
    if (!storageReady.current) throw new Error('Your journal could not be opened. Reopen the app before making changes.');
    try {
      if (!backendReady.current) await synchronize();
      const session = await getSession();
      await removeBackendBird(session, id);
      ensureOwner();
      try {
        await removeCollectionBird(id, current.current, owner);
        setSyncError(migrationWarning.current);
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
  }), [enqueue, loaded, synchronize, userId, owner, getSession, ensureOwner]);

  const value = useMemo<CollectionValue>(() => ({
    birds, loaded, error, syncing, syncError, retrySync, save, remove, importShared,
    isSaved: (id) => birds.some((b) => b.id === id),
    get: (id) => birds.find((b) => b.id === id),
  }), [birds, loaded, error, syncing, syncError, retrySync, save, remove, importShared]);

  return <CollectionContext.Provider value={value}>{children}</CollectionContext.Provider>;
}

export function useCollection() {
  const ctx = useContext(CollectionContext);
  if (!ctx) throw new Error('useCollection must be used within CollectionProvider');
  return ctx;
}

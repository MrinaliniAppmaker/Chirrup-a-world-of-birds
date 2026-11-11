import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { GeneratedBird } from '@workspace/api-client-react';
import { loadCollection, saveCollectionBird, removeCollectionBird, MAX_BIRDS } from '@/lib/collectionStorage';

interface CollectionValue {
  birds: GeneratedBird[];
  loaded: boolean;
  error: string | null;
  isSaved: (id: string) => boolean;
  save: (bird: GeneratedBird) => Promise<void>;
  remove: (id: string) => Promise<void>;
  get: (id: string) => GeneratedBird | undefined;
}

const CollectionContext = createContext<CollectionValue | null>(null);

export function CollectionProvider({ children }: { children: React.ReactNode }) {
  const [birds, setBirds] = useState<GeneratedBird[]>([]);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const current = useRef<GeneratedBird[]>([]);
  const operations = useRef<Promise<void>>(Promise.resolve());
  const storageReady = useRef(false);

  const enqueue = useCallback(<T,>(work: () => Promise<T>): Promise<T> => {
    const result = operations.current.then(work);
    operations.current = result.then(() => {}, () => {});
    return result;
  }, []);

  useEffect(() => {
    loadCollection()
      .then((saved) => { current.current = saved; storageReady.current = true; setBirds(saved); })
      .catch(() => setError('Could not open your journal.'))
      .finally(() => setLoaded(true));
  }, []);

  const save = useCallback((bird: GeneratedBird) => enqueue(async () => {
    if (!loaded) throw new Error('Your journal is still opening.');
    if (!storageReady.current) throw new Error('Your journal could not be opened. Reopen the app before saving.');
    if (current.current.some((b) => b.id === bird.id)) return;
    if (current.current.length >= MAX_BIRDS) {
      const message = `Your library holds up to ${MAX_BIRDS} birds. Remove a bird before saving another.`;
      setError(message);
      throw new Error(message);
    }
    try {
      const stored = await saveCollectionBird(bird, current.current);
      current.current = [stored, ...current.current];
      setBirds(current.current);
      setError(null);
    } catch (err) {
      const message = 'Could not save this bird to device storage. Your existing library is unchanged.';
      setError(message);
      throw new Error(message, { cause: err });
    }
  }), [enqueue, loaded]);

  const remove = useCallback((id: string) => enqueue(async () => {
    if (!loaded) throw new Error('Your journal is still opening.');
    if (!storageReady.current) throw new Error('Your journal could not be opened. Reopen the app before making changes.');
    try {
      await removeCollectionBird(id, current.current);
      current.current = current.current.filter((bird) => bird.id !== id);
      setBirds(current.current);
      setError(null);
    } catch (err) {
      setError('Could not remove this bird. Your library is unchanged.');
      throw err;
    }
  }), [enqueue, loaded]);

  const value = useMemo<CollectionValue>(() => ({
    birds, loaded, error, save, remove,
    isSaved: (id) => birds.some((b) => b.id === id),
    get: (id) => birds.find((b) => b.id === id),
  }), [birds, loaded, error, save, remove]);

  return <CollectionContext.Provider value={value}>{children}</CollectionContext.Provider>;
}

export function useCollection() {
  const ctx = useContext(CollectionContext);
  if (!ctx) throw new Error('useCollection must be used within CollectionProvider');
  return ctx;
}

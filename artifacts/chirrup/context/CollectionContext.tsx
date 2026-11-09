import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import type { GeneratedBird } from '@workspace/api-client-react';

const KEY = 'chirrup.collection.v1';

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

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => { if (raw) setBirds(JSON.parse(raw) as GeneratedBird[]); })
      .catch(() => setError('Could not open your journal.'))
      .finally(() => setLoaded(true));
  }, []);

  const persist = useCallback(async (next: GeneratedBird[]) => {
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
      setBirds(next);
      setError(null);
    } catch {
      setError('Storage is full or unavailable. This bird may not be kept.');
      throw new Error('persist failed');
    }
  }, []);

  const save = useCallback(async (bird: GeneratedBird) => {
    if (birds.some((b) => b.id === bird.id)) return;
    if (!loaded) throw new Error('Your journal is still opening.');
    let storedBird = bird;
    let fileUri: string | null = null;
    if (Platform.OS !== 'web' && bird.imageUri.startsWith('data:')) {
      if (!FileSystem.documentDirectory) throw new Error('Device storage is unavailable.');
      const match = bird.imageUri.match(/^data:image\/(png|jpeg|webp);base64,(.+)$/s);
      if (!match) throw new Error('The portrait could not be saved.');
      fileUri = `${FileSystem.documentDirectory}chirrup-${bird.id}.${match[1]}`;
      await FileSystem.writeAsStringAsync(fileUri, match[2], { encoding: FileSystem.EncodingType.Base64 });
      storedBird = { ...bird, imageUri: fileUri };
    }
    try {
      await persist([storedBird, ...birds]);
    } catch (err) {
      if (fileUri) await FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => {});
      throw err;
    }
  }, [birds, loaded, persist]);

  const remove = useCallback(async (id: string) => {
    const bird = birds.find((b) => b.id === id);
    await persist(birds.filter((b) => b.id !== id));
    if (Platform.OS !== 'web' && bird?.imageUri.startsWith('file:')) {
      await FileSystem.deleteAsync(bird.imageUri, { idempotent: true }).catch(() => {});
    }
  }, [birds, persist]);

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

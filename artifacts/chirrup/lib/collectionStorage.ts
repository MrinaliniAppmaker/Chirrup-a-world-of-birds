import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import type { GeneratedBird } from '@workspace/api-client-react';

const KEY = 'chirrup.collection.v1';
export const MAX_BIRDS = 100;

export async function hasLocalPortrait(bird: GeneratedBird): Promise<boolean> {
  if (bird.imageUri.startsWith('data:')) return true;
  if (!bird.imageUri.startsWith('file:')) return false;
  const info = await FileSystem.getInfoAsync(bird.imageUri);
  return info.exists && !info.isDirectory;
}

export async function loadCollection(): Promise<GeneratedBird[]> {
  const raw = await AsyncStorage.getItem(KEY);
  const birds = raw ? JSON.parse(raw) : [];
  if (!Array.isArray(birds)) throw new Error('The saved journal could not be read.');
  return birds;
}

export async function saveCollectionBird(bird: GeneratedBird, current: GeneratedBird[]): Promise<GeneratedBird> {
  let stored = bird;
  let fileUri: string | null = null;
  try {
    if (bird.imageUri.startsWith('data:')) {
      if (!FileSystem.documentDirectory) throw new Error('Device storage is unavailable.');
      const match = bird.imageUri.match(/^data:image\/(png|jpeg|webp);base64,(.+)$/s);
      if (!match) throw new Error('The portrait could not be saved.');
      fileUri = `${FileSystem.documentDirectory}chirrup-${encodeURIComponent(bird.id)}.${match[1]}`;
      await FileSystem.writeAsStringAsync(fileUri, match[2], { encoding: FileSystem.EncodingType.Base64 });
      stored = { ...bird, imageUri: fileUri };
    }
    await AsyncStorage.setItem(KEY, JSON.stringify([stored, ...current]));
    return stored;
  } catch (err) {
    if (fileUri) await FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => {});
    throw err;
  }
}

export async function replaceCollection(birds: GeneratedBird[]): Promise<GeneratedBird[]> {
  const stored: GeneratedBird[] = [];
  const newFiles: string[] = [];
  try {
    for (const bird of birds) {
      if (!bird.imageUri.startsWith('https:')) { stored.push(bird); continue; }
      if (!FileSystem.documentDirectory) throw new Error('Device storage is unavailable.');
      const uri = `${FileSystem.documentDirectory}chirrup-cloud-${encodeURIComponent(bird.id)}-${Date.now()}.img`;
      newFiles.push(uri);
      const result = await FileSystem.downloadAsync(bird.imageUri, uri);
      if (result.status !== 200) throw new Error('The saved portrait could not be downloaded.');
      stored.push({ ...bird, imageUri: uri });
    }
    // Do not replace the old journal until all recovered portraits are local.
    await AsyncStorage.setItem(KEY, JSON.stringify(stored));
    return stored;
  } catch (error) {
    await Promise.all(newFiles.map(uri => FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {})));
    throw error;
  }
}

export async function removeCollectionBird(id: string, current: GeneratedBird[]): Promise<void> {
  const bird = current.find((item) => item.id === id);
  await AsyncStorage.setItem(KEY, JSON.stringify(current.filter((item) => item.id !== id)));
  if (bird?.imageUri.startsWith('file:')) {
    await FileSystem.deleteAsync(bird.imageUri, { idempotent: true }).catch(() => {});
  }
}

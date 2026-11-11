import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import type { GeneratedBird } from '@workspace/api-client-react';

const KEY = 'chirrup.collection.v1';
export const MAX_BIRDS = 100;

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

export async function removeCollectionBird(id: string, current: GeneratedBird[]): Promise<void> {
  const bird = current.find((item) => item.id === id);
  await AsyncStorage.setItem(KEY, JSON.stringify(current.filter((item) => item.id !== id)));
  if (bird?.imageUri.startsWith('file:')) {
    await FileSystem.deleteAsync(bird.imageUri, { idempotent: true }).catch(() => {});
  }
}

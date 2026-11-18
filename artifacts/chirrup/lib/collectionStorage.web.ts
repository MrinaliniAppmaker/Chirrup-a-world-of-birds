import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GeneratedBird } from '@workspace/api-client-react';

export const MAX_BIRDS = 100;
const LEGACY_KEY = 'chirrup.collection.v1';
const DB_NAME = 'chirrup-collection';
type StoredBird = GeneratedBird & { imageBlob?: Blob };
let database: Promise<IDBDatabase> | undefined;
const imageUrls = new Map<string, string>();

export async function hasLocalPortrait(bird: GeneratedBird): Promise<boolean> {
  return /^(data:|blob:)/.test(bird.imageUri);
}

function openDatabase(): Promise<IDBDatabase> {
  if (!database) {
    database = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('Browser image storage is unavailable. Enable site storage to save birds.'));
        return;
      }
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('birds', { keyPath: 'id' });
        request.result.createObjectStore('settings');
      };
      request.onsuccess = () => {
        request.result.onversionchange = () => { request.result.close(); database = undefined; };
        resolve(request.result);
      };
      request.onerror = () => reject(request.error ?? new Error('Could not open browser image storage.'));
      request.onblocked = () => reject(new Error('Close other CHIRRUP tabs and try opening the library again.'));
    }).catch((error) => { database = undefined; throw error; });
  }
  return database;
}

function complete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Browser storage could not save your birds.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Saving was interrupted. Your existing birds are unchanged.'));
  });
}

function read<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function encodeBird(bird: GeneratedBird): Promise<StoredBird> {
  if (!/^(data:|blob:|https:)/.test(bird.imageUri)) return bird;
  const response = await fetch(bird.imageUri);
  if (!response.ok) throw new Error('The bird portrait could not be read for saving.');
  return { ...bird, imageUri: '', imageBlob: await response.blob() };
}

function decodeBird(row: StoredBird): GeneratedBird {
  const { imageBlob, ...bird } = row;
  if (!imageBlob) return bird;
  const previous = imageUrls.get(bird.id);
  if (previous) URL.revokeObjectURL(previous);
  const imageUri = URL.createObjectURL(imageBlob);
  imageUrls.set(bird.id, imageUri);
  return { ...bird, imageUri };
}

export async function loadCollection(): Promise<GeneratedBird[]> {
  const db = await openDatabase();
  const transaction = db.transaction(['birds', 'settings'], 'readonly');
  const [existing, migrated] = await Promise.all([
    read<StoredBird[]>(transaction.objectStore('birds').getAll()),
    read(transaction.objectStore('settings').get('legacy-migrated')),
  ]);
  let rows = existing;
  if (!migrated) {
    const raw = await AsyncStorage.getItem(LEGACY_KEY);
    const legacy: GeneratedBird[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(legacy)) throw new Error('The existing journal could not be read. No birds were changed.');
    const missing = legacy.filter((bird) => !existing.some((entry) => entry.id === bird.id));
    const imported = await Promise.all(missing.map(encodeBird));
    // Images and migration marker commit together. Keep the old journal intact on failure.
    const migration = db.transaction(['birds', 'settings'], 'readwrite');
    const committed = complete(migration);
    imported.forEach((bird) => migration.objectStore('birds').put(bird));
    migration.objectStore('settings').put(true, 'legacy-migrated');
    await committed;
    rows = [...existing, ...imported];
    // The committed migration marker prevents deleted legacy birds being reimported.
    if (raw) await AsyncStorage.removeItem(LEGACY_KEY);
  }
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(decodeBird);
}

export async function saveCollectionBird(bird: GeneratedBird, _current: GeneratedBird[]): Promise<GeneratedBird> {
  const row = await encodeBird(bird);
  const db = await openDatabase();
  const transaction = db.transaction('birds', 'readwrite');
  const committed = complete(transaction);
  transaction.objectStore('birds').put(row);
  await committed;
  return decodeBird(row);
}

export async function removeCollectionBird(id: string, _current: GeneratedBird[]): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction('birds', 'readwrite');
  const committed = complete(transaction);
  transaction.objectStore('birds').delete(id);
  await committed;
  const uri = imageUrls.get(id);
  if (uri) URL.revokeObjectURL(uri);
  imageUrls.delete(id);
}

export async function replaceCollection(birds: GeneratedBird[]): Promise<GeneratedBird[]> {
  const rows: StoredBird[] = [];
  // Limit downloads when recovering portraits into an empty local cache.
  for (let start = 0; start < birds.length; start += 4) {
    rows.push(...await Promise.all(birds.slice(start, start + 4).map(encodeBird)));
  }
  const db = await openDatabase();
  const transaction = db.transaction('birds', 'readwrite');
  const committed = complete(transaction);
  transaction.objectStore('birds').clear();
  rows.forEach(row => transaction.objectStore('birds').put(row));
  await committed;
  for (const [id, uri] of imageUrls) {
    if (!rows.some(row => row.id === id)) { URL.revokeObjectURL(uri); imageUrls.delete(id); }
  }
  return rows.map(decodeBird);
}

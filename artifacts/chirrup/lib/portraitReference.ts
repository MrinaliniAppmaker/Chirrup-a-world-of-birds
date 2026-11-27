import { Asset } from 'expo-asset';
import Constants from 'expo-constants';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

// Local file, browser blob/data URL and bundled reference assets all become the
// same bounded inline payload. Never send device-only URIs to the server.
export type PortraitSource = Parameters<typeof Asset.fromModule>[0];

export async function portraitReference(source: PortraitSource): Promise<string> {
  const asset = typeof source !== 'string' ? Asset.fromModule(source) : null;
  if (asset) await asset.downloadAsync();
  let uri = asset ? asset.localUri ?? asset.uri : source as string;
  // A store build can resolve require(image) to a bare Android drawable name.
  // RN Image understands that name, but the manipulator's Glide string loader
  // treats it as a file path. Give it an actual Android resource URI instead.
  // Expo Go/web usually return HTTP URLs, so preview alone cannot catch this.
  if (asset && Platform.OS === 'android' && /^[a-z0-9_]+$/.test(uri)) {
    const packageName = Constants.expoConfig?.android?.package;
    if (!packageName) throw new Error('The Android app package is missing; the bundled portrait cannot be opened.');
    uri = `android.resource://${packageName}/drawable/${uri}`;
  }
  const image = await manipulateAsync(uri, [{ resize: { width: 768 } }], {
    format: SaveFormat.JPEG, compress: 0.85, base64: true,
  });
  try {
    if (!image.base64) throw new Error('The saved portrait could not be prepared.');
    const inline = `data:image/jpeg;base64,${image.base64}`;
    if (inline.length > 1_400_000) throw new Error('The portrait is too large for this scene.');
    return inline;
  } finally {
    // The original journal image is unchanged; only discard the temporary copy.
    if (Platform.OS !== 'web' && image.uri.startsWith('file:')) {
      await FileSystem.deleteAsync(image.uri, { idempotent: true }).catch(() => {});
    }
  }
}

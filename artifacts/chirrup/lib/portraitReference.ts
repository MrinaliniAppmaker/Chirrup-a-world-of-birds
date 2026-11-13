import { Asset } from 'expo-asset';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

// Local file, browser blob/data URL and bundled reference assets all become the
// same bounded inline payload. Never send device-only URIs to the server.
export type PortraitSource = Parameters<typeof Asset.fromModule>[0];

export async function portraitReference(source: PortraitSource): Promise<string> {
  const asset = typeof source !== 'string' ? Asset.fromModule(source) : null;
  if (asset) await asset.downloadAsync();
  const uri = asset ? asset.localUri ?? asset.uri : source as string;
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

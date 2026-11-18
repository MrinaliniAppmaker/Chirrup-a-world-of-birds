import * as FileSystem from 'expo-file-system/legacy';

export interface PreparedJournalPortrait {
  contentType: 'image/png' | 'image/jpeg' | 'image/webp';
  byteLength: number;
  put: (url: string) => Promise<void>;
  dispose: () => Promise<void>;
}

export async function prepareJournalPortrait(uri: string): Promise<PreparedJournalPortrait> {
  let fileUri = uri;
  let temporary = false;
  try {
    if (uri.startsWith('data:')) {
      const match = uri.match(/^data:image\/(png|jpeg|webp);base64,(.+)$/s);
      if (!match || !FileSystem.cacheDirectory) throw new Error('The bird portrait could not be prepared.');
      fileUri = `${FileSystem.cacheDirectory}chirrup-upload-${Date.now()}.${match[1]}`;
      temporary = true;
      await FileSystem.writeAsStringAsync(fileUri, match[2], { encoding: FileSystem.EncodingType.Base64 });
    } else if (uri.startsWith('https:')) {
      if (!FileSystem.cacheDirectory) throw new Error('Portrait storage is unavailable.');
      fileUri = `${FileSystem.cacheDirectory}chirrup-upload-${Date.now()}.img`;
      temporary = true;
      const downloaded = await FileSystem.downloadAsync(uri, fileUri);
      if (downloaded.status !== 200) throw new Error('The bird portrait could not be downloaded.');
    }
    const info = await FileSystem.getInfoAsync(fileUri);
    if (!info.exists || info.isDirectory || info.size < 1 || info.size > 8 * 1024 * 1024) {
      throw new Error('The portrait is missing or larger than 8 MB.');
    }
    const header = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64, position: 0, length: 16,
    });
    const contentType = header.startsWith('iVBORw0KGgo') ? 'image/png'
      : header.startsWith('/9j/') ? 'image/jpeg' : header.startsWith('UklGR') ? 'image/webp' : null;
    if (!contentType) throw new Error('The portrait must be a PNG, JPEG or WebP image.');
    return {
      contentType, byteLength: info.size,
      async put(url) {
        const uploaded = await FileSystem.uploadAsync(url, fileUri, {
          httpMethod: 'PUT', uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          headers: { 'Content-Type': contentType },
        });
        if (uploaded.status < 200 || uploaded.status >= 300) throw new Error('The portrait upload did not finish. Please retry.');
      },
      async dispose() {
        if (temporary) await FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => {});
      },
    };
  } catch (error) {
    if (temporary) await FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => {});
    throw error;
  }
}

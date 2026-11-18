export async function prepareJournalPortrait(uri: string) {
  const response = await fetch(uri);
  if (!response.ok) throw new Error('The bird portrait could not be read.');
  const blob = await response.blob();
  const contentType = blob.type.split(';')[0];
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(contentType) || blob.size < 1 || blob.size > 8 * 1024 * 1024) {
    throw new Error('The portrait must be a PNG, JPEG or WebP image smaller than 8 MB.');
  }
  return {
    contentType: contentType as 'image/png' | 'image/jpeg' | 'image/webp',
    byteLength: blob.size,
    async put(url: string) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90_000);
      try {
        const uploaded = await fetch(url, {
          method: 'PUT', headers: { 'Content-Type': contentType }, body: blob, signal: controller.signal,
        });
        if (!uploaded.ok) throw new Error('The portrait upload did not finish. Please retry.');
      } finally { clearTimeout(timeout); }
    },
    async dispose() {},
  };
}

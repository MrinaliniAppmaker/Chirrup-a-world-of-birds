import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import type { Href } from 'expo-router';

const PENDING_SHARE_KEY = 'chirrup.pending-bird-share.v1';
const validToken = (token: string) => /^[A-Za-z0-9_-]{43}$/.test(token);

export function buildBirdShareUrl(token: string): string {
  if (!validToken(token)) throw new Error('This sharing link could not be read.');
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (!domain) throw new Error('The Chirrup sharing address is not configured.');
  return `https://${domain}/api/bird-shares/open?token=${encodeURIComponent(token)}`;
}

export function parseBirdShareToken(input: string): string | null {
  const value = input.trim();
  if (validToken(value)) return value;
  try {
    const url = new URL(value);
    if (!['https:', 'http:', 'chirrup:'].includes(url.protocol)) return null;
    const token = url.searchParams.get('token') ?? '';
    return validToken(token) ? token : null;
  } catch { return null; }
}

export async function copyBirdShareLink(url: string): Promise<void> {
  const copied = await Clipboard.setStringAsync(url);
  if (!copied) throw new Error('Copy is unavailable here. Select and copy the sharing link instead.');
}

export async function openBirdShareEmail(name: string, url: string): Promise<void> {
  const subject = `A bird for your Chirrup library: ${name}`;
  const body = `I'd like to share ${name} with you in CHIRRUP.\n\nOpen this link, sign in to Chirrup, and choose “Add to my library” to keep its original photo, traits and field notes:\n\n${url}\n\nIf the link doesn't open Chirrup, copy it into “Open a shared bird” on the Share birds page in your Library or Your Profile.\n\nThe link lasts seven days, unless I remove the original bird sooner.`;
  // Gmail composes a draft under the sender's own account. Nothing is sent by the server.
  await Linking.openURL(`https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
}

export async function rememberSharedBird(token: string): Promise<void> {
  if (!validToken(token)) throw new Error('This sharing link could not be read.');
  await AsyncStorage.setItem(PENDING_SHARE_KEY, token);
}

/** Keep an intentional shared-bird destination through email or Google sign-in. */
export async function goAfterSignIn(router: { replace: (href: Href) => void }): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(PENDING_SHARE_KEY);
    if (token && validToken(token)) {
      await AsyncStorage.removeItem(PENDING_SHARE_KEY);
      router.replace({ pathname: '/receive-bird', params: { token } });
      return;
    }
  } catch {
    // Sign-in succeeded even if this optional navigation hint could not be read.
  }
  router.replace('/');
}

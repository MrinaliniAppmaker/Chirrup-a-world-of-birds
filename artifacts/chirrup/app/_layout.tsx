import React, { useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ClerkLoaded, ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { setAuthTokenGetter, setBaseUrl } from '@workspace/api-client-react';
import { CollectionProvider } from '@/context/CollectionContext';
import { clearCreateRecoveryDrafts } from '@/lib/createRecovery';
import { noteInputTouch } from '@/lib/inputFocus';
import colors from '@/constants/colors';
import { serif } from '@/constants/fonts';

setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
const proxyUrl = process.env.EXPO_PUBLIC_CLERK_PROXY_URL || undefined;

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

// Native startup/reload must start in the app, not the alphabetically first
// authentication group. Auth remains an explicitly opened modal.
export const unstable_settings = { anchor: '(tabs)' };

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: 'Back',
        headerTintColor: colors.light.primary,
        headerStyle: { backgroundColor: colors.light.background },
        headerTitleStyle: { fontFamily: serif, color: colors.light.foreground },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.light.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="bird/[id]" options={{ title: 'Journal entry' }} />
      <Stack.Screen name="interactions" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="profile" options={{ title: 'Your profile' }} />
      <Stack.Screen name="share-birds" options={{ title: 'Share birds' }} />
      <Stack.Screen name="receive-bird" options={{ title: 'Shared bird' }} />
    </Stack>
  );
}

/** Wires bearer tokens into the API client and isolates per-identity memory. */
function AuthBoundary({ children }: { children: React.ReactNode }) {
  const { getToken, userId, isLoaded } = useAuth();
  const qc = useQueryClient();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const prevUser = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    setAuthTokenGetter(() => getTokenRef.current());
    return () => setAuthTokenGetter(null);
  }, []);

  const current = isLoaded ? (userId ?? null) : undefined;
  useEffect(() => {
    if (current === undefined) return;
    if (prevUser.current !== undefined && prevUser.current !== current) {
      qc.clear();
      clearCreateRecoveryDrafts();
    }
    prevUser.current = current;
  }, [current, qc]);

  return <CollectionProvider key={userId ?? 'guest'}>{children}</CollectionProvider>;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache} proxyUrl={proxyUrl}>
            <ClerkLoaded>
              <GestureHandlerRootView onStartShouldSetResponderCapture={noteInputTouch}>
                <KeyboardProvider>
                  <AuthBoundary>
                    <RootLayoutNav />
                  </AuthBoundary>
                </KeyboardProvider>
              </GestureHandlerRootView>
            </ClerkLoaded>
          </ClerkProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

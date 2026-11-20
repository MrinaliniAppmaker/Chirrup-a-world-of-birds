import React, { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { HandleSSOCallback } from '@clerk/react';
import { useRouter } from 'expo-router';
import { AuthShell, Notice, taskMessage } from '@/components/AuthKit';
import { Button } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { goAfterSignIn } from '@/lib/birdSharing';

export default function GoogleOAuthCallback() {
  const router = useRouter();
  const c = useColors();
  const [error, setError] = useState<string | null>(null);
  return (
    <AuthShell eyebrow="Your account" title="Finishing Google sign-in" subtitle="Returning you to Chirrup and your field journal.">
      <View testID="google-callback" style={{ gap: 16 }}>
        {error ? <>
          <Notice text={error} />
          <Button testID="google-back-sign-in" label="Back to sign in" onPress={() => router.replace('/sign-in')} />
        </> : <ActivityIndicator color={c.primary} />}
        <HandleSSOCallback
          navigateToApp={({ session }) => {
            if (session?.currentTask) { setError(taskMessage(session.currentTask)); return; }
            void goAfterSignIn(router);
          }}
          navigateToSignIn={() => setError('Google requires another verification step. Return to sign in to continue with your email code.')}
          navigateToSignUp={() => router.replace('/sign-up')}
        />
      </View>
    </AuthShell>
  );
}

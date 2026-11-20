import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@clerk/expo';

// Native useSSO finishes through its auth session. Keep direct deep links safe.
export default function GoogleOAuthCallback() {
  const { isSignedIn } = useAuth();
  return <Redirect href={isSignedIn ? '/' : '/sign-in'} />;
}

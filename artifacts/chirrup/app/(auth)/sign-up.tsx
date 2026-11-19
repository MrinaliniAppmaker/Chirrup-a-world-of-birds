import React, { useRef, useState } from 'react';
import { View, type TextInputInstance } from 'react-native';
import { useAuth, useSignUp } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { AuthField, AuthShell, Divider, GoogleButton, LinkText, Notice, readableError, taskMessage } from '@/components/AuthKit';
import { Button } from '@/components/ui';
import { goAfterSignIn } from '@/lib/birdSharing';

export default function SignUpScreen() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const emailRef = useRef<TextInputInstance>(null);
  const pwRef = useRef<TextInputInstance>(null);
  const busy = fetchStatus === 'fetching';

  const submit = async () => {
    setMessage(null);
    const { error } = await signUp.password({ emailAddress: email.trim(), password });
    if (error) { if (!errors.fields.emailAddress && !errors.fields.password) setMessage(readableError(error)); return; }
    const sent = await signUp.verifications.sendEmailCode();
    if (sent.error) setMessage(readableError(sent.error)); else setInfo('We sent a 6-digit code to ' + email.trim() + '.');
  };

  const verify = async () => {
    setMessage(null);
    const { error } = await signUp.verifications.verifyEmailCode({ code: code.trim() });
    if (error) { if (!errors.fields.code) setMessage(readableError(error)); return; }
    if (signUp.status === 'complete') {
      await signUp.finalize({
        navigate: ({ session }) => {
          if (session?.currentTask) { setMessage(taskMessage(session.currentTask)); return; }
          void goAfterSignIn(router);
        },
      });
    } else if (signUp.missingFields?.length) {
      setMessage('Your account needs more details than this app collects: ' + signUp.missingFields.join(', ').replace(/_/g, ' ') + '.');
    } else {
      setMessage('Verification did not complete. Request a new code and try again.');
    }
  };

  if (signUp.status === 'complete' || isSignedIn) return null;

  if (signUp.status === 'missing_requirements' && signUp.unverifiedFields.includes('email_address') && signUp.missingFields.length === 0) {
    return (
      <AuthShell testID="sign-up-verify-screen" eyebrow="Verify your email" title="Check your inbox" subtitle="Enter the code to open your new field journal.">
        <Notice text={info} tone="info" />
        <Notice text={message} testID="sign-up-error" />
        <AuthField testID="sign-up-code" label="Verification code" value={code} onChangeText={setCode} keyboardType="number-pad"
          autoComplete="one-time-code" textContentType="oneTimeCode" maxLength={8} onSubmitEditing={verify} error={errors.fields.code?.message} />
        <Button testID="sign-up-verify" label="Verify email" onPress={verify} loading={busy} disabled={!code.trim()} />
        <LinkText testID="sign-up-resend" label="Send a new code" onPress={async () => { const r = await signUp.verifications.sendEmailCode(); if (r.error) setMessage(readableError(r.error)); else setInfo('A new code is on its way.'); }} />
        <LinkText testID="sign-up-start-over" label="Use a different email" onPress={() => { setCode(''); setInfo(null); setMessage(null); signUp.reset(); }} />
      </AuthShell>
    );
  }

  return (
    <AuthShell testID="sign-up-screen" eyebrow="Open a field journal" title="Keep every bird you imagine" subtitle="An account keeps your journal safe and lets you find it again on any device.">
      <Notice text={message} testID="sign-up-error" />
      <GoogleButton testID="sign-up-google" onError={setMessage} />
      <Divider />
      <AuthField ref={emailRef} testID="sign-up-email" label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false}
        keyboardType="email-address" autoComplete="email" textContentType="emailAddress" returnKeyType="next"
        onSubmitEditing={() => pwRef.current?.focus()} error={errors.fields.emailAddress?.message} />
      <AuthField ref={pwRef} testID="sign-up-password" label="Password" value={password} onChangeText={setPassword} secureTextEntry
        autoComplete="new-password" textContentType="newPassword" returnKeyType="go" onSubmitEditing={submit} error={errors.fields.password?.message} />
      <Button testID="sign-up-submit" label="Create account" onPress={submit} loading={busy} disabled={!email.trim() || !password} />
      <View nativeID="clerk-captcha" />
      <LinkText testID="sign-up-to-sign-in" label="Already have an account? Sign in" onPress={() => router.replace('/(auth)/sign-in')} />
    </AuthShell>
  );
}

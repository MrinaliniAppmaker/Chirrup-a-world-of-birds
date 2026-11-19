import React, { useRef, useState } from 'react';
import { View, type TextInputInstance } from 'react-native';
import { useSignIn } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { AuthField, AuthShell, Divider, GoogleButton, LinkText, Notice, readableError, taskMessage } from '@/components/AuthKit';
import { Button } from '@/components/ui';

export default function SignInScreen() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const pwRef = useRef<TextInputInstance>(null);
  const busy = fetchStatus === 'fetching';

  const finish = async () => {
    await signIn.finalize({
      navigate: ({ session }) => {
        if (session?.currentTask) { setMessage(taskMessage(session.currentTask)); return; }
        router.replace('/');
      },
    });
  };

  const handleStatus = async () => {
    if (signIn.status === 'complete') return finish();
    if (signIn.status === 'needs_client_trust' || signIn.status === 'needs_second_factor') {
      const emailFactor = signIn.supportedSecondFactors?.find((f) => f.strategy === 'email_code');
      if (emailFactor) {
        const { error } = await signIn.mfa.sendEmailCode();
        if (error) setMessage(readableError(error)); else setInfo('We sent a code to your email to confirm it is you.');
      } else {
        setMessage('This account needs a second verification method this app does not support yet.');
      }
      return;
    }
    setMessage('Sign-in could not be completed. Please try again.');
  };

  const submit = async () => {
    setMessage(null); setInfo(null);
    const { error } = await signIn.password({ emailAddress: email.trim(), password });
    if (error) { if (!errors.fields.identifier && !errors.fields.password) setMessage(readableError(error)); return; }
    await handleStatus();
  };

  const verify = async () => {
    setMessage(null);
    const { error } = await signIn.mfa.verifyEmailCode({ code: code.trim() });
    if (error) { if (!errors.fields.code) setMessage(readableError(error)); return; }
    if (signIn.status === 'complete') await finish(); else setMessage('That code did not finish sign-in. Request a new one.');
  };

  if (signIn.status === 'needs_client_trust' || signIn.status === 'needs_second_factor') {
    return (
      <AuthShell testID="sign-in-verify-screen" eyebrow="One more step" title="Check your email" subtitle="Enter the code we just sent to confirm this device.">
        <Notice text={info} tone="info" />
        <Notice text={message} testID="sign-in-error" />
        <AuthField testID="sign-in-code" label="Verification code" value={code} onChangeText={setCode} keyboardType="number-pad"
          autoComplete="one-time-code" textContentType="oneTimeCode" maxLength={8} onSubmitEditing={verify} error={errors.fields.code?.message} />
        <Button testID="sign-in-verify" label="Verify and continue" onPress={verify} loading={busy} disabled={!code.trim()} />
        <LinkText testID="sign-in-resend" label="Send a new code" onPress={async () => { const { error } = await signIn.mfa.sendEmailCode(); if (error) setMessage(readableError(error)); else setInfo('A new code is on its way.'); }} />
        <LinkText testID="sign-in-start-over" label="Start over" onPress={() => { setCode(''); setMessage(null); setInfo(null); signIn.reset(); }} />
      </AuthShell>
    );
  }

  return (
    <AuthShell testID="sign-in-screen" eyebrow="Return to the field studio" title="Welcome back" subtitle="Sign in to open your journal. Every bird you have kept stays with your account.">
      <Notice text={message} testID="sign-in-error" />
      <GoogleButton testID="sign-in-google" onError={setMessage} />
      <Divider />
      <AuthField testID="sign-in-email" label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false}
        keyboardType="email-address" autoComplete="email" textContentType="emailAddress" returnKeyType="next"
        onSubmitEditing={() => pwRef.current?.focus()} error={errors.fields.identifier?.message} />
      <AuthField ref={pwRef} testID="sign-in-password" label="Password" value={password} onChangeText={setPassword} secureTextEntry
        autoComplete="current-password" textContentType="password" returnKeyType="go" onSubmitEditing={submit} error={errors.fields.password?.message} />
      <Button testID="sign-in-submit" label="Sign in" onPress={submit} loading={busy} disabled={!email.trim() || !password} />
      <LinkText testID="sign-in-forgot" label="Forgot password?" onPress={() => router.push('/(auth)/reset-password')} />
      <View style={{ height: 4 }} />
      <LinkText testID="sign-in-to-sign-up" label="New here? Create an account" onPress={() => router.replace('/(auth)/sign-up')} />
    </AuthShell>
  );
}

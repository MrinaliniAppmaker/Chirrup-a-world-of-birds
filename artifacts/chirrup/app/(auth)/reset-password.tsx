import React, { useState } from 'react';
import { useSignIn } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { AuthField, AuthShell, LinkText, Notice, readableError, taskMessage } from '@/components/AuthKit';
import { Button } from '@/components/ui';
import { goAfterSignIn } from '@/lib/birdSharing';

export default function ResetPasswordScreen() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [stage, setStage] = useState<'email' | 'code' | 'password'>('email');
  const [message, setMessage] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const busy = fetchStatus === 'fetching';

  const sendCode = async () => {
    setMessage(null);
    const created = await signIn.create({ identifier: email.trim() });
    if (created.error) { setMessage(readableError(created.error)); return; }
    const { error } = await signIn.resetPasswordEmailCode.sendCode();
    if (error) { setMessage(readableError(error)); return; }
    setInfo('We sent a reset code to ' + email.trim() + '.');
    setStage('code');
  };

  const verify = async () => {
    setMessage(null);
    const { error } = await signIn.resetPasswordEmailCode.verifyCode({ code: code.trim() });
    if (error) { if (!errors.fields.code) setMessage(readableError(error)); return; }
    setInfo(null);
    setStage('password');
  };

  const save = async () => {
    setMessage(null);
    const { error } = await signIn.resetPasswordEmailCode.submitPassword({ password });
    if (error) { if (!errors.fields.password) setMessage(readableError(error)); return; }
    if (signIn.status === 'complete') {
      await signIn.finalize({
        navigate: ({ session }) => {
          if (session?.currentTask) { setMessage(taskMessage(session.currentTask)); return; }
          void goAfterSignIn(router);
        },
      });
    } else {
      setMessage('Your password was updated, but sign-in needs another step. Please sign in again.');
    }
  };

  return (
    <AuthShell testID="reset-screen" eyebrow="Reset password"
      title={stage === 'email' ? 'Forgot your password?' : stage === 'code' ? 'Enter your code' : 'Choose a new password'}
      subtitle={stage === 'email' ? 'We will email you a code to set a new one. Your journal is untouched.' : undefined}>
      <Notice text={info} tone="info" />
      <Notice text={message} testID="reset-error" />
      {stage === 'email' ? (
        <>
          <AuthField testID="reset-email" label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false}
            keyboardType="email-address" autoComplete="email" onSubmitEditing={sendCode} error={errors.fields.identifier?.message} />
          <Button testID="reset-send" label="Send reset code" onPress={sendCode} loading={busy} disabled={!email.trim()} />
        </>
      ) : stage === 'code' ? (
        <>
          <AuthField testID="reset-code" label="Reset code" value={code} onChangeText={setCode} keyboardType="number-pad"
            autoComplete="one-time-code" textContentType="oneTimeCode" maxLength={8} onSubmitEditing={verify} error={errors.fields.code?.message} />
          <Button testID="reset-verify" label="Verify code" onPress={verify} loading={busy} disabled={!code.trim()} />
          <LinkText testID="reset-resend" label="Send a new code" onPress={async () => { const r = await signIn.resetPasswordEmailCode.sendCode(); if (r.error) setMessage(readableError(r.error)); else setInfo('A new code is on its way.'); }} />
        </>
      ) : (
        <>
          <AuthField testID="reset-new-password" label="New password" value={password} onChangeText={setPassword} secureTextEntry
            autoComplete="new-password" textContentType="newPassword" onSubmitEditing={save} error={errors.fields.password?.message} />
          <Button testID="reset-save" label="Save and sign in" onPress={save} loading={busy} disabled={!password} />
        </>
      )}
      <LinkText testID="reset-back" label="Back to sign in" onPress={() => { signIn.reset(); router.replace('/(auth)/sign-in'); }} />
    </AuthShell>
  );
}

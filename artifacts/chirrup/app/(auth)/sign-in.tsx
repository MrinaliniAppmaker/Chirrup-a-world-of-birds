import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useSignIn } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { AuthField, AuthShell, Divider, GoogleButton, LinkText, Notice, readableError, taskMessage } from '@/components/AuthKit';
import { Button } from '@/components/ui';
import { goAfterSignIn } from '@/lib/birdSharing';

export default function SignInScreen() {
  const { signIn, errors } = useSignIn();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sentEmail, setSentEmail] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [googleWorking, setGoogleWorking] = useState(false);
  const [resendWait, setResendWait] = useState(false);
  const [needsRecovery, setNeedsRecovery] = useState(false);
  const requestLock = useRef(false);
  // A cancelled SDK SSO promise can remain fetching. Only requests owned by
  // this form may lock its keyboard or show the email-request spinner.
  const busy = working;
  const secondFactor = signIn.status === 'needs_client_trust' || signIn.status === 'needs_second_factor';

  useEffect(() => {
    if (!resendWait) return;
    const timer = setTimeout(() => setResendWait(false), 30_000);
    return () => clearTimeout(timer);
  }, [resendWait]);

  const run = async (action: () => Promise<void>) => {
    if (requestLock.current) return;
    requestLock.current = true;
    setWorking(true); setMessage(null); setInfo(null);
    try { await action(); }
    catch (err) { setMessage(readableError(err)); }
    finally { requestLock.current = false; setWorking(false); }
  };

  const finish = async () => {
    await signIn.finalize({
      navigate: ({ session }) => {
        if (session?.currentTask) {
          setNeedsRecovery(session.currentTask.key === 'reset-password');
          setMessage(taskMessage(session.currentTask));
          return;
        }
        void goAfterSignIn(router);
      },
    });
  };

  const handleStatus = async () => {
    if (signIn.status === 'complete') return finish();
    if (signIn.status === 'needs_client_trust' || signIn.status === 'needs_second_factor') {
      const emailFactor = signIn.supportedSecondFactors?.find((f) => f.strategy === 'email_code');
      if (emailFactor) {
        const { error } = await signIn.mfa.sendEmailCode();
        if (error) setMessage(readableError(error));
        else { setCode(''); setResendWait(true); setInfo('We sent an additional code to your email to confirm it is you.'); }
      } else {
        setMessage('This account needs a second verification method this app does not support yet.');
      }
      return;
    }
    setMessage('Sign-in could not be completed. Please try again.');
  };

  const submit = () => run(async () => {
    if (googleWorking) {
      setMessage('Finish or close the Google sign-in window first, then request your email code.');
      return;
    }
    const address = email.trim();
    if (!address) { setMessage('Enter your email address first.'); return; }
    const { error } = await signIn.emailCode.sendCode({ emailAddress: address });
    if (error) { setMessage(readableError(error)); return; }
    setSentEmail(address); setCode(''); setStep('code'); setResendWait(true);
    setInfo('We sent a one-time sign-in code to your email. Check your inbox and spam folder.');
  });

  const verify = () => run(async () => {
    if (!code.trim()) return;
    const { error } = secondFactor
      ? await signIn.mfa.verifyEmailCode({ code: code.trim() })
      : await signIn.emailCode.verifyCode({ code: code.trim() });
    if (error) { setMessage(readableError(error)); return; }
    await handleStatus();
  });

  const resend = () => run(async () => {
    if (resendWait) return;
    const { error } = secondFactor
      ? await signIn.mfa.sendEmailCode()
      : await signIn.emailCode.sendCode({ emailAddress: sentEmail });
    if (error) setMessage(readableError(error));
    else { setCode(''); setResendWait(true); setInfo('A new one-time code is on its way. Use the latest code.'); }
  });

  const startOver = () => {
    if (busy) return;
    signIn.reset();
    setStep('email'); setCode(''); setSentEmail(''); setMessage(null); setInfo(null); setResendWait(false); setNeedsRecovery(false);
  };

  if (step === 'code' || secondFactor) {
    return (
      <AuthShell testID="sign-in-verify-screen" eyebrow={secondFactor ? 'One more step' : 'Password-free sign-in'} title="Check your email"
        subtitle={secondFactor ? 'Enter the additional code to confirm this device.' : `Enter the one-time code sent to ${sentEmail}. No password is needed to sign in.`}>
        <Notice text={info} tone="info" />
        <Notice text={message} testID="sign-in-error" />
        <AuthField testID="sign-in-code" label="One-time code" value={code} onChangeText={setCode} keyboardType="number-pad" editable={!busy}
          autoComplete="one-time-code" textContentType="oneTimeCode" maxLength={8} onSubmitEditing={verify} error={errors.fields.code?.message} />
        <Notice tone="info" testID="sign-in-sender-note" text={'The email may show "Bird Forge" as the sender, but this is actually from the Chirrup app.'} />
        <Button testID="sign-in-verify" label="Verify and continue" onPress={verify} loading={busy} disabled={!code.trim()} />
        <Button testID="sign-in-resend" label={resendWait ? 'Wait before resending' : 'Send a new code'} variant="ghost" onPress={resend} disabled={busy || resendWait} />
        <LinkText testID="sign-in-start-over" label="Use a different email" onPress={startOver} />
        {needsRecovery && <LinkText testID="sign-in-account-recovery" label="Forgot password / account recovery" onPress={() => router.push('/(auth)/reset-password')} />}
      </AuthShell>
    );
  }

  return (
    <AuthShell testID="sign-in-screen" eyebrow="Return to the field studio" title="Welcome back" subtitle="Enter your email and we will send a one-time sign-in code. Your journal stays with the same account.">
      <Notice text={message} testID="sign-in-error" />
      <GoogleButton testID="sign-in-google" onError={setMessage} onBusyChange={setGoogleWorking} disabled={busy} />
      <Divider />
      <AuthField testID="sign-in-email" label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false}
        keyboardType="email-address" autoComplete="email" textContentType="emailAddress" returnKeyType="go" editable={!busy}
        onSubmitEditing={submit} error={errors.fields.identifier?.message} />
      <Button testID="sign-in-submit" label="Email me a sign-in code" icon="mail" onPress={submit} loading={busy} disabled={googleWorking || !email.trim()} />
      <View style={{ height: 4 }} />
      <LinkText testID="sign-in-to-sign-up" label="New here? Create an account" onPress={() => router.replace('/(auth)/sign-up')} />
    </AuthShell>
  );
}

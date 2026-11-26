const assert = require('node:assert/strict');
const { verifyProductionAndroid } = require('../scripts/verify-production-android.cjs');
const app = require('../app.json').expo;
const eas = require('../eas.json');

const linkedApp = app;
assert.equal(app.owner, 'mrinaliniappmaker');
assert.equal(app.extra.eas.projectId, 'f3a06196-821b-4ef5-9b84-fa99bdfc72e1');
const env = {
  EAS_BUILD_PLATFORM: 'android',
  EAS_BUILD_PROFILE: 'production',
  EXPO_PUBLIC_DOMAIN: 'birds.example.org',
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_live_test_fixture_not_a_real_key',
};
assert.deepEqual(verifyProductionAndroid(env, linkedApp, eas), { domain: 'birds.example.org' });
assert.deepEqual(Object.keys(eas.build), ['production']);
assert.equal(require('../package.json').scripts['eas-build-pre-install'], 'node scripts/verify-production-android.cjs');
for (const override of [
  { EAS_BUILD_PROFILE: 'development' },
  { EAS_BUILD_PLATFORM: 'ios' },
  { EXPO_PUBLIC_DOMAIN: undefined, REPLIT_INTERNAL_APP_DOMAIN: 'birds.example.org' },
  { EXPO_PUBLIC_DOMAIN: 'workspace.replit.dev' },
  { EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_fixture' },
  { EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: undefined, CLERK_PUBLISHABLE_KEY: env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY },
]) {
  assert.throws(() => verifyProductionAndroid({ ...env, ...override }, linkedApp, eas));
}
for (const override of [
  { owner: 'another-owner' },
  { slug: 'different-app' },
  { extra: {} },
  { extra: { eas: { projectId: 'not-a-project-id' } } },
  { extra: { eas: { projectId: '12345678-1234-4234-9234-123456789abc' } } },
  { android: { ...app.android, package: 'different.package' } },
  { android: { ...app.android, versionCode: 0 } },
]) {
  assert.throws(() => verifyProductionAndroid(env, { ...linkedApp, ...override }, eas));
}
for (const override of [
  { developmentClient: true },
  { distribution: 'internal' },
  { environment: 'preview' },
  { credentialsSource: 'local' },
  { android: { ...eas.build.production.android, buildType: 'apk' } },
  { android: { ...eas.build.production.android, gradleCommand: ':app:assembleDebug' } },
]) {
  const invalid = { build: { production: { ...eas.build.production, ...override } } };
  assert.throws(() => verifyProductionAndroid(env, linkedApp, invalid));
}
console.log('PASS: Production Android profile rejects development builds, wrong identities, missing project links and non-production client services.');

// Standalone Expo-account builds do not run the hosted Replit build script.
// Validate their actual client environment before installing or bundling.
const { productionConfig } = require('./production-config.cjs');

function verifyProductionAndroid(env, app, eas) {
  const fail = (message) => { throw new Error(message); };
  if (env.EAS_BUILD_PLATFORM !== 'android' || env.EAS_BUILD_PROFILE !== 'production') {
    fail('Use the production Android build profile. Development-only builds are not configured.');
  }
  if (app.android?.package !== 'app.chirrupaworldofbirdsgeneratingapp.mrinalinikhetan') {
    fail('The Android package identifier does not match Chirrup’s existing release identity.');
  }
  if (!Number.isInteger(app.android.versionCode) || app.android.versionCode < 1) {
    fail('Android versionCode must be a positive integer.');
  }
  if (
    app.owner !== 'mrinaliniappmaker' || app.slug !== 'chirrup' ||
    app.extra?.eas?.projectId !== 'f3a06196-821b-4ef5-9b84-fa99bdfc72e1'
  ) {
    fail('Link the verified mrinaliniappmaker/chirrup Expo project ID in app.json before building.');
  }
  const profile = eas.build?.production;
  if (
    profile?.developmentClient !== false || profile.distribution !== 'store' ||
    profile.environment !== 'production' || profile.credentialsSource !== 'remote' ||
    profile.android?.buildType !== 'app-bundle' || profile.android.gradleCommand
  ) {
    fail('Production must use store distribution, a release App Bundle, and existing remote signing credentials.');
  }
  // Validate exactly what _layout.tsx bundles, not an unrelated server-side
  // domain/key that could hide missing EXPO_PUBLIC_* client variables.
  return productionConfig({
    EXPO_PUBLIC_DOMAIN: env.EXPO_PUBLIC_DOMAIN,
    CLERK_PUBLISHABLE_KEY: env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
  });
}

if (require.main === module) {
  // This Android-specific guard must not change the hosted Replit build or
  // any future iOS build's behavior.
  if (process.env.EAS_BUILD_PLATFORM === 'ios') {
    console.log('Android production guard does not apply to iOS.');
  } else {
    try {
      const app = require('../app.json').expo;
      const eas = require('../eas.json');
      verifyProductionAndroid(process.env, app, eas);
      console.log('Production Android profile, project identity and client-service configuration passed checks. Signing still requires verified Expo credentials.');
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}

module.exports = { verifyProductionAndroid };

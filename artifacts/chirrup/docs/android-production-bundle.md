# Production Android App Bundle

## Current state

The app uses Expo / React Native SDK 58. The separate Expo-account production
profile in `eas.json` has successfully produced a signed native Android App
Bundle. Replit's hosted publishing flow is unchanged.

- Expo project: https://expo.dev/accounts/mrinaliniappmaker/projects/chirrup
- Linked project ID: `f3a06196-821b-4ef5-9b84-fa99bdfc72e1`
- Package: `app.chirrupaworldofbirdsgeneratingapp.mrinalinikhetan`
- App version: `1.0.0`; Android version code: `1`
- Production backend confirmed by deployment metadata:
  https://chirrup-a-world-of-birds.replit.app
- Successful build: `dcb31ce7-f92c-4fbc-a480-975b8c433691`, platform `ANDROID`,
  distribution `STORE`, profile `production`.
- Built source: `dae26338c1077eb3ed14ba16038cc938d1f69a8a`, verified present on
  GitHub before the build was requested.
- Bundle: https://expo.dev/artifacts/eas/6TImUloWMe41YS2mczXTgsJPr80p7B8gOvgVqNZQHd0.aab
- Downloaded copy: `generated-artifacts/chirrup-1.0.0-1-production.aab`.
- SHA-256: `9425696d0c9d6530b34849f7633fb7ba4b12b105bdf299a4390925c3be10e7e1`.
- Verified ZIP integrity, the CMS/JAR signature, the signed manifest digest and
  all 1,485 signed payload-entry digests, with no unsigned payload entries.
- The owner reported existing signing credentials configured. The build log
  reported remote Android credentials; no new-keystore-generation message was
  found. Matching the certificate against an independently supplied Google Play
  upload-certificate fingerprint has not been performed.
- **No Google Play submission or installed-device functional test was performed.**

## Setup and build sequence

1. **Completed:** the existing project UUID is linked as
   `expo.extra.eas.projectId` in `artifacts/chirrup/app.json`, with
   `expo.owner` set to `mrinaliniappmaker`. Do not create a replacement project.
   The repository-root `app.json` is empty and is not the mobile configuration.
2. **Completed for this build:** connect the Expo GitHub App to the existing
   `MrinaliniAppmaker/Chirrup-a-world-of-birds` repository. Set the application's
   base directory to **`artifacts/chirrup`**, not the repository root.
   The new build configuration and the verified project linkage must be
   committed and pushed to the exact Git reference selected for the build.
3. **Reported configured by the owner; the build succeeded:** keep the Expo
   project's **production** environment configured:
   - `EXPO_PUBLIC_DOMAIN`: `chirrup-a-world-of-birds.replit.app`
   - `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`: the actual live production publishable
     key used by the published app, not the workspace test key.
    - `EXPO_PUBLIC_CLERK_PROXY_URL`:
      `https://chirrup-a-world-of-birds.replit.app/api/__clerk`
   Replit injects managed values for its own publishing flow; that does not
   establish that a separate Expo-account build has those values.
   Never copy Clerk secret keys, AI keys, database credentials or storage
   credentials into the mobile environment.
4. Verify the Android upload-signing credentials associated with this package
   in the Expo account. Reuse the existing keystore if one exists, including
   one previously stored outside Expo. Do not generate or replace a key merely
   because this Expo project is new. If no signing key has ever existed, obtain
   owner approval for first-time key creation. Record and compare certificate
   fingerprints without exposing private keys or passwords.
5. **Completed:** the first native Android build succeeded through the connected
   Expo integration after account-side configuration, without a local native
   build or EAS CLI run by the agent. Expo's generic GitHub guide describes a
   previous platform build as a prerequisite, but that did not prevent this
   configured remote workflow. The connected tools still do not manage signing
   keys or create Expo projects.
6. Once prerequisites are satisfied, request an Expo build using:
   - Project: `@mrinaliniappmaker/chirrup`
   - Platform: `ANDROID`
   - Profile: `production`
   - Base directory: `artifacts/chirrup`
   - Git reference: the verified pushed source revision
   - Automatic store submission: **off**
   Review account build costs before starting billable work.
7. After a successful build, download its **`.aab`** artifact. Confirm store
   distribution, release rather than debug configuration, package ID, version
   code, upload-signing certificate and bundled production-service settings.
   A passing JavaScript check, web publish or Expo Go preview is not equivalent
   to a signed Android release build.

## Build safeguards

Only a `production` build profile is defined. It uses store distribution,
`developmentClient: false`, remote credentials and Android `app-bundle` output.
It preserves the local version code rather than silently changing it. Future
uploads must use a version code not already accepted by Google Play.

The pre-install hook validates the actual `EXPO_PUBLIC_*` variables consumed
by the mobile app, rejects missing project linkage and prevents development
addresses or test authentication keys from being bundled. This guard does
**not** verify that signing credentials exist or match Google Play.

Local configuration checks:

```sh
node artifacts/chirrup/tests/production-android.cjs
node artifacts/chirrup/tests/android-release.cjs
```

Creating a valid bundle is separate from Play release readiness. Child-access,
verified-consent and service-eligibility requirements remain unresolved.

## Sources

- https://docs.expo.dev/build/building-from-github/
- https://docs.expo.dev/app-signing/managed-credentials/
- https://docs.expo.dev/eas/json/

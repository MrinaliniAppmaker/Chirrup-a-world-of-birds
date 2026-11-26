# Production Android App Bundle

## Current state

The app uses Expo / React Native SDK 58. A separate Expo-account build profile
now exists in `eas.json`. This does not change Replit's hosted publishing flow
or create a native binary.

- Expo project: https://expo.dev/accounts/mrinaliniappmaker/projects/chirrup
- Linked project ID: `f3a06196-821b-4ef5-9b84-fa99bdfc72e1`
- Package: `app.chirrupaworldofbirdsgeneratingapp.mrinalinikhetan`
- App version: `1.0.0`; Android version code: `1`
- Production backend confirmed by deployment metadata:
  https://chirrup-a-world-of-birds.replit.app
- No previous Android builds were returned by the connected Expo project.
- The supplied project UUID is linked in the mobile configuration. Expo accepted
  a build-list request specifying both that UUID and the existing account/project
  name without error.
- Signing credentials, GitHub linkage and the Expo production environment still
  require verification. **No signed `.aab` has been created.**

## Setup and build sequence

1. **Completed:** the existing project UUID is linked as
   `expo.extra.eas.projectId` in `artifacts/chirrup/app.json`, with
   `expo.owner` set to `mrinaliniappmaker`. Do not create a replacement project.
   The repository-root `app.json` is empty and is not the mobile configuration.
2. Connect the Expo GitHub App to the existing
   `MrinaliniAppmaker/Chirrup-a-world-of-birds` repository. Set the application's
   base directory to **`artifacts/chirrup`**, not the repository root.
   The new build configuration and the verified project linkage must be
   committed and pushed to the exact Git reference selected for the build.
3. Configure the Expo project's **production** environment:
   - `EXPO_PUBLIC_DOMAIN`: `chirrup-a-world-of-birds.replit.app`
   - `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`: the actual live production publishable
     key used by the published app, not the workspace test key.
   - If production authentication uses a Clerk proxy, also configure
     `EXPO_PUBLIC_CLERK_PROXY_URL` with the same published proxy URL.
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
5. Complete any initial native-build/signing prerequisites required by Expo.
   Expo's GitHub-build documentation requires a previously successful platform
   build. The connected tools can request builds for configured projects but
   cannot create projects or manage signing credentials. Do not treat this
   document as proof that those initial prerequisites can be completed here.
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

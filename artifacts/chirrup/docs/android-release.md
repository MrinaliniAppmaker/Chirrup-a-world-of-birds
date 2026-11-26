# Android release readiness

This checklist is not a signed Android build or a Google Play approval.
Keep the existing Chirrup design, bird artwork and package identity.

## Prepared in code

- Android package: use the exact lowercase identifier in `app.json`.
- Initial Android version code: `1`. Increase this integer for every new
  Google Play upload, including fixes released under the same visible version.
- Visible app version remains `1.0.0`.
- Adaptive launcher icon uses the existing Chirrup icon and background colour.
  Check the actual launcher masks on a release build; do not replace the artwork.
- Exclude unused location, camera, microphone, overlay, and broad media/storage
  permissions. Internet and haptics remain available.
- Android profile photos use the system image picker without a blanket library
  permission request. Cropping still creates a draft; the existing explicit Save
  action still commits the photo. iOS permission handling is retained.
- The hosted production build refuses preview/local domains and development
  Clerk publishable keys. It also refuses to reuse another Metro process whose
  compiled service environment may differ. Normal development stays unchanged.

## Checks performed

- The focused Android release tests and existing focus/link/recovery tests pass.
- Mobile TypeScript passes.
- Expo configuration introspection confirms the version code, adaptive icon,
  and manifest removal directives. Introspection is not a final merged manifest.
- Installed Android tooling defaults to target API 36; verify the actual bundle
  manifest against the Play requirement in effect when submitting.

## Still required

- Publish the backend and verify the public HTTPS address. Do not substitute the
  workspace preview address. No production deployment existed at this review.
- Confirm the published backend uses live Clerk credentials and the intended
  production database, App Storage access, and AI services.
- Verify OTP, Google return-to-app, generation, and a disposable bird's
  save/reopen/delete against production from a signed Android build.
- Ensure the separate Android build pipeline injects the correct public domain
  and live Clerk publishable key. The hosted build guard does not configure or
  prove an external native build pipeline.
- Confirm release signing, the upload-key owner and recovery, and Play App Signing.
  Never commit private signing keys or credentials.
- Add account/data deletion, a public deletion-request resource, an in-app and
  public privacy policy, and in-app AI-content reporting with developer review.
- Complete Play Console verification, Data safety, audience/content rating,
  reviewer access, listing assets, and any account-specific testing requirements.
- Verify native installation, final permissions, icon masks, edge-to-edge layout,
  and native-library/device compatibility from the actual release bundle.

Replit's built-in mobile store submission currently does not support Google Play.
Do not describe an Expo Go preview or JavaScript export as a signed release.

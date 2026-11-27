---
name: Android bundled portrait loading
description: Why a portrait visible in the picker can fail during native release image processing
---
Do not treat successful display of a bundled image as proof it can be passed unchanged into image manipulation.

**Why:** The user reported Mallard encounters failing in Google Play closed testing. The installed Expo Asset implementation can mark a bare Android drawable name as already downloaded. React Native Image accepts that name, but the installed image manipulator delegates string loading to Glide, which needs a resource URI rather than a bare filename. Expo Go and browser previews commonly receive HTTP URLs instead and do not exercise this release-only path.

**How to apply:** Resolve bundled Android drawable names against the active app package before image processing. Preserve ordinary file, data and network URLs and never delete original portraits. Check the packaged Android path, not just the web preview; mocked native-path tests establish conversion behavior but do not establish physical-device or live AI encounter success.

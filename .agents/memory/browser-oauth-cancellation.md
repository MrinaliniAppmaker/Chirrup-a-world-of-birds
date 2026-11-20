---
name: Browser OAuth cancellation
description: Shared Clerk loading state can outlive a closed Google sign-in window
---
Use platform-appropriate OAuth transports, and distinguish each form's own active requests from shared provider loading state.

**Why:** In Chrome preview, the browser-specific Google flow reached Google's login page, but manually closing it left the SDK operation pending. A close watcher released the Google button; resetting the unfinished SDK attempt still did not clear the shared `fetchStatus`. Email fields remained read-only and displayed a spinner until a reload because their loading state depended on that shared flag.

**How to apply:** Open browser popups within the actual user gesture and provide a real callback route; preserve the separate native auth-session flow. Handle close, unmount and timeout without waiting forever on the SDK promise. Email loading and editability should follow email requests the form owns, with an explicit Google-operation flag only to prevent concurrent submissions. Reset only unfinished attempts, never a signed-in session. Verify popup cancellation followed by an actual email-code sign-in without reloading; a reload hides this failure.

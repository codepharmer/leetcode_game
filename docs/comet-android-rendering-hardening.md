# Android Comet Rendering Hardening Plan

Date: February 15, 2026
Scope: General fixes only (no implementation details in this document)

## Problem Summary

When opening the deployed app in the Comet browser on Android, the page appears to load but does not render usable UI.

This failure pattern is most consistent with browser compatibility and startup robustness issues rather than a core CDN outage.

## Most Likely Failure Modes

1. Module bootstrap incompatibility in in-app Android browsers.
2. Startup crash due to blocked/throwing `localStorage` or `sessionStorage`.
3. Stale in-app cached HTML pointing to outdated hashed JS assets.
4. Startup blocked by remote sync/network calls that do not resolve quickly.

## Recommended General Changes

### 1) Add Browser Compatibility Fallbacks

- Move from module-only startup to a compatibility path that supports older/in-app WebViews.
- Ship a legacy fallback entry path so unsupported module environments still get a runnable app shell.
- Set a safer transpile target for startup-critical code.

Why this helps:
- Prevents "HTML loads, app never mounts" when the browser cannot execute the modern bundle.

### 2) Make Storage Access Fully Safe

- Centralize all storage reads/writes behind hardened wrappers.
- Treat storage exceptions (for example, `SecurityError`) as expected conditions.
- Fall back to in-memory defaults when persistent storage is unavailable.

Why this helps:
- Prevents first-render crashes in restricted browser contexts.

### 3) Make Initial Render Non-Blocking

- Render UI immediately from defaults/local state.
- Run cloud sync in the background after first paint.
- Add request timeout/abort behavior so startup cannot wait indefinitely.

Why this helps:
- Eliminates blank or "stuck loading" states caused by slow/failed network paths.

### 4) Add Top-Level Error Recovery UI

- Add a root error boundary and startup failure screen.
- Provide recovery actions: retry load, clear local app data, and open in system browser (Chrome/Samsung Internet).

Why this helps:
- Converts silent blank-page failures into recoverable user flows.

### 5) Harden Cache/Deployment Strategy

- Avoid deleting previous hashed assets immediately after each deploy.
- Keep old hashed bundles for at least one release overlap window.
- Continue force-updating `index.html` and invalidating CloudFront, but allow asset overlap for stale clients.

Why this helps:
- Prevents stale cached HTML from referencing deleted asset files.

### 6) Add Early Runtime Compatibility Detection

- Detect unsupported runtime capabilities before app bootstrap.
- Show a compatibility message when critical features are missing.
- For in-app browsers, show an "Open in system browser" prompt.

Why this helps:
- Reduces silent failures in partially supported environments.

### 7) Add Production Error Telemetry

- Capture startup exceptions and unhandled promise rejections.
- Include app version/build hash, user agent, and top-level error message.
- Track error rates by browser family (especially Android in-app browsers).

Why this helps:
- Confirms real-world root cause mix and validates improvements after rollout.

## Priority Order (Suggested)

1. Storage hardening and root error boundary.
2. Non-blocking startup with sync timeout.
3. Compatibility/legacy bundle path.
4. Cache overlap strategy.
5. Runtime compatibility messaging.
6. Telemetry refinement.

## Validation Checklist (Post-Change)

- Comet on Android: app renders menu on first load.
- Comet on Android: app renders after storage is blocked or cleared.
- Comet on Android: app renders after hard refresh and cached navigation.
- Chrome on Android: no regression in startup time or auth/sync behavior.
- Desktop browsers: no regression in routing, auth, and progress persistence.

## Notes

- This document intentionally avoids implementation details.
- It is intended to guide a follow-up implementation plan and phased rollout.

# Route Settings Single-Source Refactor Plan

## Context

The app currently keeps route settings in two places:

1. URL query params (`location.search`)
2. Local React state in `App` (`gameType`, `filterDifficulty`, `totalQuestions`, `browseFilter`)

This dual ownership requires two-way synchronization effects and has already produced render-loop risk (`Maximum update depth exceeded`) when URL and state updates interact under certain navigation paths.

## Problem Statement

The current model introduces avoidable complexity:

1. Bidirectional sync effects can produce feedback loops.
2. Back/forward history behavior depends on timing between effects.
3. Debugging and testing require reasoning about two sources of truth.
4. `App` has orchestration plus route-sync logic tightly coupled.

## Goal

Make URL query params the single source of truth for route-scoped settings, and remove mirrored local state for those settings from `App`.

## Non-Goals

1. No route schema redesign in this pass.
2. No changes to AWS/deployment stack.
3. No rewrite of gameplay/business logic hooks (`useGameSession`, `useProgressSync`, `useAuthSession`) beyond call-site updates.
4. No UI redesign.

## Target Architecture

## Source of Truth

Route settings are always derived from `location.search` and normalized via `parseRouteSettings`.

## Mutation Path

All setting updates go through one URL writer:

1. Read current settings from URL.
2. Merge patch.
3. Build canonical query with `buildRouteSearch`.
4. Navigate only when the resulting search differs.

## Read Path

Components consume settings derived from URL, not `useState` mirrors.

## Local State Scope After Refactor

Keep local state only for non-route UI concerns:

1. `expandedBrowse`
2. `expandedResult`
3. `showResetConfirm`
4. Other ephemeral screen UI state already owned in leaf screens/hooks

## Proposed API

Create `src/hooks/useRouteSettings.js`:

1. `settings`: normalized object from URL
2. `setSettings(patchOrUpdater, options?)`: updates query params
3. `setMode(nextMode, options?)`: path change preserving current canonical settings
4. `navigateWithSettings(pathname, options?)`: helper for route changes with current settings
5. Optional setters for ergonomics:
   - `setGameType(value)`
   - `setFilterDifficulty(value)`
   - `setTotalQuestions(value)`
   - `setBrowseFilter(value)`

All functions must be stable (`useCallback`) and idempotent (no navigate when no real query change).

## Migration Plan (Phased)

## Phase 0: Safety Baseline

Status:

1. Keep current guard fix in `App` as temporary protection.
2. Confirm strict-mode and route-sync tests remain green.

Exit criteria:

1. Existing guard tests pass.

## Phase 1: Extract Route Settings Hook

Tasks:

1. Add `src/hooks/useRouteSettings.js` with the API above.
2. Reuse existing route helpers in `src/lib/routes.js` (no duplicate normalization logic).
3. Add unit tests `src/hooks/useRouteSettings.test.jsx`:
   - canonicalization of query params
   - no-op updates do not navigate
   - patch/updater behavior
   - preserves settings across mode path changes

Exit criteria:

1. Hook tests pass.
2. No behavior change in app yet.

## Phase 2: Replace App Local Mirrors

Tasks:

1. In `src/App.jsx`, remove local `useState` for:
   - `gameType`
   - `filterDifficulty`
   - `totalQuestions`
   - `browseFilter`
2. Replace reads with `routeSettings.settings` from hook.
3. Replace setters passed to screens with hook setters.
4. Replace route navigation helpers to use hook helpers.
5. Keep temporary guard only if still needed during the transition.

Exit criteria:

1. App behavior unchanged for menu/play/results/browse/templates/blueprint flows.
2. No sync effect needed between URL and local settings state.

## Phase 3: Remove Legacy Sync Effect and Guard

Tasks:

1. Remove the local-to-URL and URL-to-local guard/sync logic from `App`.
2. Keep one canonical URL write path in the hook.

Exit criteria:

1. No route-settings sync effects remain in `App`.
2. No update-depth warning in strict mode or manual navigation.

## Phase 4: Test Hardening

Tasks:

1. Keep and update `src/App.routeSync.test.jsx`.
2. Expand coverage in `src/App.strict.test.jsx` for settings transitions:
   - query changes between modes
   - back/forward navigation
3. Add at least one browser-history scenario starting in blueprint and moving to question/template mode.
4. Validate existing `src/App.test.jsx` still passes.

Exit criteria:

1. Regression tests catch feedback-loop reintroduction.

## Phase 5: Optional Structural Cleanup

Tasks:

1. If `App` remains large, split route concerns into a thin routing shell and mode coordinators.
2. Keep gameplay/session logic in existing hooks.

Exit criteria:

1. Only if needed for maintainability; not required for correctness.

## File-Level Change Map

Expected files:

1. `src/hooks/useRouteSettings.js` (new)
2. `src/hooks/useRouteSettings.test.jsx` (new)
3. `src/App.jsx` (refactor consumers, remove mirror state and sync effects)
4. `src/App.routeSync.test.jsx` (update assertions if needed)
5. `src/App.strict.test.jsx` (possible new cases)
6. `README.md` (document route-setting single-source pattern and new hook)

## Behavioral Invariants to Preserve

1. URL stays canonical (`buildRouteSearch` output).
2. Deep links still work.
3. Back/forward navigates settings predictably.
4. Switching mode preserves relevant settings where intended.
5. No extra history spam from no-op query writes.

## Risk Assessment

## Risk 1: Unintended URL churn

Impact:

1. Extra navigation entries.

Mitigation:

1. No-op comparison before navigate.
2. Use `replace` where behavior previously replaced.

## Risk 2: Missing settings during path changes

Impact:

1. Different defaults on some routes.

Mitigation:

1. Centralize path + query writes in hook helper.
2. Add integration tests for each route transition path.

## Risk 3: Subtle regressions in menu controls

Impact:

1. Controls appear to lag or reset.

Mitigation:

1. UI interaction tests for mode card clicks, difficulty/count toggles, browse filter changes.

## Risk 4: Flaky history tests

Impact:

1. False negatives in CI.

Mitigation:

1. Keep tests deterministic using `MemoryRouter` where possible.
2. Use targeted `BrowserRouter` tests only for true history behavior.

## Rollout Strategy

1. Land Phase 1 first (new hook + tests, no behavior change).
2. Land Phase 2-3 together in one focused PR to avoid mixed ownership state.
3. Land Phase 4 test hardening in same PR or immediately after.
4. Deploy behind normal flow; no infrastructure changes.

## Rollback Strategy

If post-deploy issues appear:

1. Revert refactor commit(s) and redeploy.
2. Temporary guard fix remains known-good fallback.
3. Invalidate CloudFront after rollback deploy.

## Acceptance Criteria

Functional:

1. No `Maximum update depth exceeded` warnings across blueprint and non-blueprint flows.
2. All existing App and menu route tests pass.
3. Added hook tests pass.

Architecture:

1. Route settings have exactly one source of truth (URL).
2. `App` has no route-settings mirror sync effects.

Documentation:

1. README explains the single-source route-setting pattern and where to extend it.

## PR Breakdown

## PR-1 Hook Foundation

1. Add `useRouteSettings` + unit tests.
2. No `App` behavior change.

## PR-2 App Migration

1. Remove route setting mirrors from `App`.
2. Wire screens/actions to hook setters.
3. Keep tests green.

## PR-3 Cleanup + Harden

1. Remove obsolete guard/sync code.
2. Expand route-sync regression tests.
3. Final README update.

## Recommended Execution Order

1. Implement PR-1.
2. Implement PR-2.
3. Implement PR-3.
4. Run full test suite.
5. Deploy.

## Success Definition

The app can no longer enter a render feedback loop from route-setting updates because route settings are URL-owned, updated through one canonical path, and fully covered by regression tests.

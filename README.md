# LeetCode Patterns Game

## Problem This Game Addresses

Interview prep often stalls because people memorize isolated solutions instead of building durable pattern recognition.  
That leads to slower problem selection, weak transfer between questions, and inconsistent execution under time pressure.

## How The Game Solves It

This app trains pattern-first thinking through repeated, structured practice:

- `question -> pattern`: map problem statements to core solution patterns.
- `template -> pattern`: map code snippets to the underlying pattern they represent.
- `blueprint builder`: assemble solution flow cards, validate against tests (with adaptive structural fallback), run traces, and learn invariants through per-card feedback.

The result is faster pattern recall, clearer solving structure, and better interview consistency.

## What This App Is Intended For

This app is built to train LeetCode-style interview skills by reinforcing:

- Fast mapping from problem prompt to core solution pattern.
- Pattern recognition from code templates/snippets.
- Procedural thinking by assembling algorithm "blueprints" step by step and running execution traces.

It is not a full coding judge. It is a pattern-learning and reasoning trainer.

## Game Modes

1. `question -> pattern`
Maps Blind 75-style question prompts to the most likely solving pattern (imported solution-pattern labels where available, canonical fallback otherwise).

2. `template -> pattern`
Maps code snippets/templates to the pattern they represent, using confusion-aware distractors.
Mobile play view keeps code prompts full-width with horizontal scrolling to avoid left/right clipping on small screens.
Template rounds reset the viewport to the top when advancing with `next`, matching question-mode navigation flow.
Tutorial rounds for first-time onboarding use curated snippet IDs and do not increment lifetime quiz stats.

Both quiz modes now feed a persistent post-round review loop:
- Incorrect attempts are stored in mode metadata and viewable in a dedicated `/review` route.
- Menu includes a lower-page accuracy trend chart sourced from per-round snapshots.

3. `blueprint builder`
Card-based algorithm assembly mode with worlds, tiers, daily challenge, adaptive validation (test-run when executable, dependency-aware structural fallback otherwise), execution traces, hints, and star ratings.
Solve flow now auto-selects by problem size: `flat` mode for `<= 10` required blueprint slots (existing all-at-once run flow), and `phased` mode for `> 10` required slots (one phase active at a time with per-phase checks, phase locking, and immediate completion on final phase success).
Mobile build view uses a compact fixed-row slot gutter, a bottom-sheet slot editor, and a bottom-docked stacked card tray.
Tray cards preserve native vertical scroll gestures on mobile, while touch-drag still activates after movement crosses the drag threshold.

Global + per-mode onboarding overlays are now built in:
- First app visit: guided `MenuScreen` onboarding (`global` flow).
- First mode play: guided flow for Match, Template, and Build.
- One-time contextual tips (quiz shortcuts, blueprint drag/tap, blueprint hint penalty) with non-blocking auto-dismiss behavior.
- Replay/reset controls are available from the menu tutorial section and mode settings.

## Live URLs

- `https://patternmatch.nosson.ai` (primary)
- `https://algogame.nosson.ai` (legacy)
- `https://leetcode-game.nosson.ai` (legacy)

## Local Development

### Prerequisites

- Node.js 18+ (or compatible current LTS)
- npm

### Install and run

```powershell
npm install
npm run dev
```

### Build and preview

```powershell
npm run build
npm run preview
```

### Tests

```powershell
npm run test
npm run coverage
npm run blueprint:report
```

### Standalone UI skeleton

For a single-file HTML/CSS/JS mock of the main menu and each mode's opening flow (no real gameplay/data), open:

- `ui-skeleton.html`

## Environment Variables

Create `.env.local` for local development:

- `VITE_GOOGLE_CLIENT_ID`
Google OAuth client id for frontend sign-in.

- `VITE_API_BASE_URL`
Base URL for the storage/session API (Lambda Function URL or equivalent).

- `VITE_ANALYTICS_ENDPOINT`
Optional analytics ingest endpoint used by `trackEvent()` (`src/lib/analytics.js`).  
If unset, analytics events are emitted only to `console.debug` in local dev (non-test mode).

## High-Level Architecture

1. Frontend:
- React app with route-based screens.
- `App` coordinates mode routing, per-mode progress, round session restore, auth, and sync.
- Route settings are URL-owned (`gameType`, `difficulty`, `count`, `browse`) and are read/written through `src/hooks/useRouteSettings.js`.
- Tutorial overlays are rendered through a reusable portal-based component set (`TutorialOverlay`, `TutorialTooltip`, `TutorialSpotlight`) with flow-state control in `src/hooks/useTutorialFlow.js`.

2. Data:
- Canonical question data lives in `src/lib/questions.js` (with imported solution metadata merged from `src/lib/questionSolutions.js`).
- Canonical template/snippet data lives in `src/lib/templates.js` and `src/lib/templateQuestions.js`.
- Canonical blueprint families/contracts live in `src/lib/blueprint/taxonomy.js` and `src/lib/blueprint/contracts.js`.
- `src/lib/content/registry.js` is the composed, single-source read model used by game-mode wiring.
- Progress is stored per game mode (`question`, `template`, `blueprint`) with schema normalization/versioning.
- Progress now also includes a top-level `onboarding` branch with per-flow status/step state (`global`, `question_to_pattern`, `template_to_pattern`, `blueprint_builder`) and one-time tip flags.
- Quiz-mode metadata includes bounded `attemptEvents` (for incorrect review history) and `roundSnapshots` (for trend charts).

3. Persistence:
- Local: browser `localStorage`.
- Optional cloud: Lambda Function URL + S3 per-user object storage.
- Merge logic preserves both local and cloud progress across sign-in transitions.
- Onboarding merge rules use precedence (`completed > skipped > in_progress > not_started`), max `lastStep`, and OR for one-time tip flags.
- In-progress round snapshots are dual-written to `localStorage` and `sessionStorage`, with lifecycle flushes on `visibilitychange` and `pagehide` for stronger resume reliability.

4. Blueprint generation:
- All 87 questions use strategy-driven generation with semantic verification.
- Production fallback is disabled by default and only enabled via explicit dev flag.
- Questions `q-11..q-87` now run problem-specific strategy/oracle paths (no probe placeholders in production contracts).
- CI/reporting enforces: `problemSpecificStrategyCount = 87`, `placeholderContractCount = 0`, `semanticProbeUsageCount = 0`.
- In Blueprint challenge headers, auto-generated questions show objective text instead of exposed solution-code preview lines.
- Auto and tutorial levels now render pattern-family slot flows (for example: array/hash uses `seed -> loop -> probe -> store -> emit`, alongside two pointers, sliding window, binary search, stack/heap, linked list, intervals/greedy, tree/graph, DP-state, backtracking) instead of one universal slot scaffold.
- Campaign includes a `World 0` primitive onboarding lane built from foundational existing levels before the main world track.
- All `World 0` problems are open by default (no tier/stage gating inside that world).
- `World 0` is excluded from daily challenge selection and from core-world unlock counting so existing unlock pacing remains stable.
- `World 0` blueprint cards now avoid placeholder pseudocode/comment markers and ship concrete runnable code steps for each included challenge.

## Content Ownership

- Canonical question catalog: `src/lib/questions.js`
- Imported Blind75 solution metadata snapshot: `src/lib/questionSolutions.js` (one-time copied from `blind75_leetcode_solutions.json`, no runtime file read)
- Canonical template library/snippets: `src/lib/templates.js` and `src/lib/templateQuestions.js`
- Canonical blueprint slot/template families: `src/lib/blueprint/templates.js`
- Canonical blueprint contract + strategy selection: `src/lib/blueprint/contracts.js` and `src/lib/blueprint/strategyRegistry.js`
- Canonical composed read model: `src/lib/content/registry.js`

## Repository Map (Directories)

- `.`
Project root with app code, docs, and deploy artifacts.

- `src`
Frontend source.

- `src/components`
Reusable UI components.

- `src/hooks`
Stateful behavior hooks.

- `src/lib`
Data/content model and pure logic utilities.

- `src/lib/content`
Composed content registry read model + invariants.

- `src/lib/blueprint`
Blueprint templates, contracts, strategy verification pipeline, level/campaign engine.

- `src/screens`
Main route screens.

- `src/screens/blueprint`
Blueprint-specific UI and gameplay hooks.

- `src/test`
Vitest setup.

- `lambda/storage`
Serverless API for auth session exchange and per-user storage in S3.

- `dist`
Generated production build output (do not edit manually).

- `node_modules`
Installed dependencies (generated).

## Repository Map (Files)

### Root files

- `README.md`
This developer guide.

- `README.copy.md`
Local scratch copy of README.

- `package.json`
Scripts/dependencies.

- `package-lock.json`
Dependency lockfile.

- `vite.config.js`
Vite + Vitest + coverage config.

- `index.html`
HTML entry shell that mounts the React app.

- `ui-skeleton.html`
Standalone single-file UI skeleton (menu + opening screens for each game mode).

- `.env.local`
Local environment values (`VITE_*`).

- `.gitignore`
Ignore rules for generated and local-only files.

- `AGENTS.md`
Local ops runbook with account-specific AWS IDs and commands.

- `testpkg.bin`
Local scratch binary artifact.

### Deploy/config JSON artifacts in root

- `bucket-policy-leetcode-game-089614018040-20260209214302-8776.json`
S3 policy allowing only CloudFront distribution reads.

- `cloudfront-config-leetcode-game-089614018040-20260209214302-8776.json`
Initial CloudFront distribution config.

- `cloudfront-update-E3E6E47F8YYFCI.json`
CloudFront update payload (legacy aliases/cert setup).

- `cloudfront-update-patternmatch.json`
CloudFront update payload (current primary cert/aliases).

- `oac-leetcode-game-089614018040-20260209214302-8776.json`
CloudFront Origin Access Control config (SigV4 signing to private S3).

- `lambda-function-url-config.json`
Lambda Function URL config (CORS/auth mode).

- `route53-acm-validation.json`
Route53 change batch for ACM validation.

- `route53-patternmatch-acm-validation.json`
Route53 change batch for current cert SAN validation.

- `route53-patternmatch-alias.json`
Route53 alias record for primary domain to CloudFront.

- `route53-algogame-alias.json`
Route53 alias record for legacy domain.

- `route53-leetcode-game-alias.json`
Route53 alias record for legacy domain.

### `src` entry/style files

- `src/main.jsx`
React mount + `BrowserRouter` + `GoogleOAuthProvider`.

- `src/App.jsx`
Main app orchestrator: route wiring (including quiz review route), mode selection, progress state, round persistence, auth/sync integration, route-settings consumption from URL, quiz meta capture (`attemptEvents`/`roundSnapshots`), blueprint quick-start routing (`Jump In` / `Continue Challenge`), onboarding/tutorial flow wiring, and one-time contextual tip orchestration.

- `src/global.css`
Global theme vars, base element styling, animation keyframes, shared interaction classes.

- `src/styles.js`
Central style object used by all screens/components.

- `src/test/setup.js`
Vitest DOM setup (`jest-dom`), per-test cleanup and local/session storage reset.

### `src/components`

- `src/components/AccuracyDot.jsx`
Shows per-question accuracy percentage and attempt count.

- `src/components/AuthCard.jsx`
Signed-in/out auth UI and Google login widget integration.

- `src/components/CodeBlock.jsx`
Code rendering wrapper.

- `src/components/TemplateViewer.jsx`
Expandable pattern template display in compact/full modes.

- `src/components/tutorial/TutorialOverlay.jsx`, `src/components/tutorial/TutorialTooltip.jsx`, `src/components/tutorial/TutorialSpotlight.jsx`
Portal-based onboarding/tip overlay system with spotlight targeting and step actions (`Next`, `Skip`, `Don't show again`).

### `src/hooks`

- `src/hooks/useAuthSession.js`
Google auth handling, backend session exchange, token migration, signout.

- `src/hooks/useGameSession.js`
Round lifecycle for quiz modes: start, select, score, streaks, keyboard shortcuts, finalize, tutorial round metadata, and tutorial stat isolation.

- `src/hooks/useTutorialFlow.js`
Flow controller for onboarding steps (`not_started | in_progress | completed | skipped`) with resume/replay support and per-step progression.

- `src/hooks/useProgressSync.js`
Local/cloud load and merge, auth error fallback, persistence orchestration.

- `src/hooks/useRouteSettings.js`
Single source of truth for route settings from `location.search`; canonical URL writer + mode/path helpers.

### `src/lib`

- `src/lib/constants.js`
App constants (modes, game types, color maps, storage key).

- `src/lib/routes.js`
Route constants, query parsing/normalization, URL builders.

- `src/lib/questions.js`
Question dataset (id/name/pattern/difficulty/description) plus merged solution metadata fields for matched Blind75 entries.

- `src/lib/questionSolutions.js`
In-repo copied Blind75 solution metadata (answer pattern, specific pattern, intuition, code solution) keyed by local question ID.

- `src/lib/templates.js`
Universal skeleton and per-pattern template catalog.

- `src/lib/templateQuestions.js`
Snippet dataset and confusion map for option generation.

- `src/lib/gameContent.js`
Mode registry and behavior config used by `App`, including curated tutorial ID lists for quiz onboarding rounds.

- `src/lib/content/registry.js`
Single-source composed content read model (`question -> pattern`, `template -> pattern`, blueprint seeds, pattern index, invariants).

- `src/lib/utils.js`
Shuffle and option generation helpers.

- `src/lib/selectors.js`
Derived metrics (round pct, lifetime pct, weak spots, mastery, grouping) plus incorrect-attempt and accuracy-trend selectors.

- `src/lib/progressModel.js`
Progress schema/version handling and per-mode getters/setters, including normalized/capped `meta.attemptEvents` and `meta.roundSnapshots`, plus top-level onboarding flow/tip state.

- `src/lib/progressMerge.js`
Conflict-safe local/cloud merge logic, including onboarding precedence merges and one-time tip flag OR behavior.

- `src/lib/analytics.js`
Minimal event emitter for onboarding/tip analytics (`trackEvent`) with optional endpoint posting and dev diagnostics.

- `src/lib/storage.js`
Storage adapters (local and API) plus read/write helpers.

- `src/lib/auth.js`
JWT decode helpers and token-to-user mapping.

- `src/lib/roundSession.js`
Dual-store (`localStorage` + `sessionStorage`) save/load/clear for in-progress rounds, with snapshot metadata (`savedAt`, `schemaVersion`).

### `src/lib/blueprint`

- `src/lib/blueprint/templates.js`
Blueprint slot template definitions.

- `src/lib/blueprint/contracts.js`
Semantic contracts and randomized trial counts for all 87 questions, including placeholder-shape schema gates.

- `src/lib/blueprint/strategyRegistry.js`
Registry facade for modular strategy families in `src/lib/blueprint/strategies/`.

- `src/lib/blueprint/strategies/wave1Strategies.js` .. `src/lib/blueprint/strategies/wave6Strategies.js`
Problem-specific strategy families for `q-11..q-87` with per-question solve/oracle/case wiring.

- `src/lib/blueprint/taxonomy.js`
Pattern-to-archetype taxonomy with wave assignment and reusable slot-set mapping.

- `src/lib/blueprint/coverageReport.js`
Coverage and quality metrics (`strategy coverage`, `semantic pass`, `problemSpecificStrategyCount`, `placeholderContractCount`, `semanticProbeUsageCount`, `per-wave`, `per-pattern`).

- `src/lib/blueprint/semanticVerifier.js`
Deterministic/random verification gate for strategy solve plans.

- `src/lib/blueprint/ir.js`
Converts verified IR nodes into card payloads and slot limits, and filters standalone comment-only cards.

- `src/lib/blueprint/solutionPipeline.js`
Strategy selection + verification + IR conversion + strict no-fallback default behavior.

- `src/lib/blueprint/levels.js`
Base handcrafted levels + auto-generated levels for all questions.

- `src/lib/blueprint/campaign.js`
World/tier progression model, unlock rules, deterministic daily challenge selection, and primitive onboarding world handling (`World 0` fully open by default and excluded from daily/core-unlock counts).

- `src/lib/blueprint/engine.js`
Blueprint executor, adaptive validator (composed test execution + structural fallback), known-valid ordering cache, trace generation, and divergence detection.

- `src/lib/blueprint/dependencyHints.js`
Card dependency analysis and drag-preview warnings, including runtime helper allowances used by composed execution (for example `isAlphaNum`).

### `src/screens`

- `src/screens/MenuScreen.jsx`
Main menu with a top-level segmented mode selector (`Match`, `Template`, `Build`) and dynamic helper copy, plus contextual progress stats, quiz round settings, blueprint campaign preview, auth entry, and launch actions.
For quiz modes, menu also includes a secondary `review mistakes` entry and a lower-page accuracy trend card sourced from mode metadata.
In blueprint mode, the primary CTA label is provided by app state (`Jump In`, `Continue Challenge`, or `Open Campaign Map`) so players can resume directly.
For `blueprint builder`, the menu progress card derives `levels`, `stars`, `worlds`, and `mastered` values from `byGameType.blueprint_builder.meta.levelStars` plus campaign world completion, instead of quiz history counters.
Menu also exposes onboarding replay/reset controls in a collapsed `tutorials` card below the primary CTA (without a duplicate replay button in the campaign header), plus per-mode `replay tutorial` entries.

- `src/screens/PlayScreen.jsx`
Question/snippet gameplay screen with robust `KeyD` description hotkey handling, a missing-description fallback message, and shared hotkey badges used by tutorial tips.

- `src/screens/ResultsScreen.jsx`
Round results summary with expandable per-item review and template-mode onboarding follow-up actions (`Browse Patterns` / `View Templates`).

- `src/screens/ReviewScreen.jsx`
Dedicated incorrect-attempt review route (`/review`) backed by persisted quiz attempt metadata.

- `src/screens/BrowseScreen.jsx`
Pattern browser with difficulty filters.

- `src/screens/TemplatesScreen.jsx`
Full template reference viewer.

- `src/screens/BlueprintScreen.jsx`
Nested blueprint route shell and challenge completion persistence, with query-setting preservation across blueprint navigation and redirects, plus build onboarding overlay orchestration and blueprint contextual-tip triggers.

### `src/screens/blueprint`

- `src/screens/blueprint/BlueprintMenu.jsx`
Blueprint tab shell (`Map`, `Daily`, placeholder `Stats`).

- `src/screens/blueprint/BlueprintMapView.jsx`
World progression map, continue CTA, daily banner, and tutorial anchor targets for build onboarding.

- `src/screens/blueprint/BlueprintWorldDetailView.jsx`
World stage/tier detail and challenge launch UI. Uses a single world-detail top nav (`Worlds` back to map, centered `World N Set X: Family` title, right-side progress and star meta). Already-unlocked earlier tiers remain replayable after progressing to later tiers.

- `src/screens/blueprint/BlueprintDailyView.jsx`
Daily challenge detail/start screen with a single `Worlds` back button (gameplay-style nav; no duplicate global `back` button on this view).

- `src/screens/blueprint/BlueprintGame.jsx`
Blueprint build/execution UI: compact slot rows, drag/drop/touch support (including moving already placed cards between slots and placing multiple cards in the same step), dependency warnings during placement, per-card failure badges/tooltips (`correct`, `misplaced`, `wrong phase`, phased-check `incorrect`), bottom-sheet slot editing, fixed mobile tray, live countdown timer, and adaptive controls (`Run Blueprint` in flat mode, per-phase `Check [PHASE]` in phased mode). Large problems use phased slot states (`completed`, `active`, `locked`) with interaction restricted to the active phase. Emits tutorial run/pass/hint signals for onboarding and one-time tip logic.
On mobile, tray card gestures allow vertical tray scrolling and only transition into touch-drag after drag-intent movement.

- `src/screens/blueprint/BlueprintExecution.jsx`
Execution trace stepping and feedback display with denser mobile-friendly test/result formatting and tutorial anchors for step navigator/star explanation overlays.

- `src/screens/blueprint/useBlueprintGameSession.js`
Blueprint gameplay state machine (deck/slots/attempts/hints/stars/timing), adaptive flat/phased solve-mode selection, per-phase tray/check progression, dependency analysis, and failed-card feedback state.

- `src/screens/blueprint/shared.js`
Shared utilities for star normalization, hint text, badge colors, duration formatting.

- `src/screens/blueprint/viewShared.js`
Shared world map helpers (accents/icons/unlock calculations/next challenge).

### Test files (`*.test.js|*.test.jsx`)

- `src/App.test.jsx`
App route and mode flow.

- `src/App.routeSync.test.jsx`
Guards against route-settings feedback loops when query params change via browser history navigation.

- `src/components/AccuracyDot.test.jsx`
Accuracy indicator behavior.

- `src/components/AuthCard.test.jsx`
Auth component states and callbacks.

- `src/components/TemplateViewer.test.jsx`
Template panel behavior.

- `src/hooks/useAuthSession.test.jsx`
Auth/session exchange, migration, signout flows.

- `src/hooks/useGameSession.test.jsx`
Quiz round state transitions and shortcuts.

- `src/hooks/useProgressSync.test.jsx`
Sync/merge/fallback behavior.

- `src/hooks/useRouteSettings.test.jsx`
Route-settings canonicalization, idempotent query writes, and mode/path preservation behavior.

- `src/lib/auth.test.js`
JWT decode and user extraction.

- `src/lib/gameContent.test.js`
Mode config and choice generation wiring.

- `src/lib/content/registry.test.js`
Content registry invariant tests (pattern, template, blueprint, orphan checks).

- `src/lib/progressMerge.test.js`
Progress merge correctness.

- `src/lib/progressModel.test.js`
Progress schema normalization.

- `src/lib/selectors.test.js`
Derived metrics/grouping helpers.

- `src/lib/roundSession.test.js`
Round snapshot dual-storage persistence and restore behavior.

- `src/lib/storage.test.js`
Local/API storage adapter behavior.

- `src/lib/utils.test.js`
Shuffle and distractor generation.

- `src/lib/blueprint/campaign.test.js`
Campaign unlock and daily challenge behavior.

- `src/lib/blueprint/engine.test.js`
Executor correctness and divergence detection.

- `src/lib/blueprint/levels.test.js`
Generated level completeness and card quality.

- `src/lib/blueprint/solutionPipeline.test.js`
Strategy pipeline pass/fallback behavior.

- `src/lib/blueprint/templates.test.js`
Blueprint template definitions.

- `src/screens/BlueprintScreen.test.jsx`
Blueprint navigation and drag/touch interactions, including moving placed cards between slots, flat/phased solve-mode behavior, problem-details toggle behavior, and slot-editor/tray overlay flow.

- `src/screens/BrowseScreen.test.jsx`
Browse UI grouping/expansion.

- `src/screens/MenuScreen.test.jsx`
Menu mode controls and reset/auth states.

- `src/screens/PlayScreen.test.jsx`
Play screen behavior for question/code prompts.

- `src/screens/ResultsScreen.test.jsx`
Results expansion and review content.

- `src/screens/ReviewScreen.test.jsx`
Incorrect-attempt review route behavior and empty state.

- `src/screens/TemplatesScreen.test.jsx`
Template screen render/back behavior.

### `lambda/storage`

- `lambda/storage/index.py`
Lambda Function URL handler:
  - `POST /session`: Google ID token -> signed session JWT.
  - `GET /storage/<key>`: read user value from S3.
  - `PUT /storage/<key>`: write/delete user value in S3.

- `lambda/storage/README.md`
Backend API, env vars, CORS notes, and deployment/update commands.

- `lambda/storage/function.bin`
Generated zip artifact for Lambda code updates.

### Generated build output (`dist`)

- `dist/index.html`
Built HTML shell.

- `dist/assets/index-*.js`
Hashed bundled JavaScript.

- `dist/assets/index-*.css`
Hashed bundled CSS.

## Deployment

The production setup is static hosting + CDN + serverless storage API.

### Frontend hosting path

1. Build:

```powershell
npm run build
```

2. Upload to private S3 bucket:
- Sync hashed assets with long immutable cache.
- Upload `index.html` with no-cache semantics.

Example:

```powershell
aws s3 sync dist s3://<APP_BUCKET> `
  --delete `
  --exclude "index.html" `
  --cache-control "public,max-age=31536000,immutable" `
  --profile default

aws s3 cp dist/index.html s3://<APP_BUCKET>/index.html `
  --cache-control "public,max-age=0,must-revalidate" `
  --content-type "text/html; charset=utf-8" `
  --profile default
```

3. CloudFront:
- Origin is S3 REST endpoint with OAC.
- Viewer policy redirects HTTP -> HTTPS.
- SPA routing maps `403`/`404` to `/index.html` with `200`.

4. Invalidate cache:

```powershell
aws cloudfront create-invalidation --distribution-id <DIST_ID> --paths "/*" --profile default
```

### Custom domain path

1. Request ACM cert in `us-east-1`.
2. Add DNS validation CNAMEs in Route53.
3. Wait for cert issuance.
4. Attach cert + aliases to CloudFront.
5. Create Route53 alias `A/AAAA` records to CloudFront (`Z2FDTNDATAQYW2`).

### Lambda storage API deploy/update

1. Package function:

```powershell
python -c "import zipfile; z=zipfile.ZipFile('lambda/storage/function.bin','w',compression=zipfile.ZIP_DEFLATED); z.write('lambda/storage/index.py','index.py'); z.close()"
```

2. Update Lambda code:

```powershell
aws lambda update-function-code --function-name <FUNCTION_NAME> `
  --zip-file fileb://lambda/storage/function.bin `
  --region us-east-1 --profile default
```

3. Verify/update Function URL CORS config:

```powershell
aws lambda get-function-url-config --function-name <FUNCTION_NAME> --region us-east-1 --profile default
aws lambda update-function-url-config --region us-east-1 --profile default --cli-input-json file://lambda-function-url-config.json
```

### Typical current stack (local ops)

For account-specific current IDs/names used on this machine, see local `AGENTS.md` (gitignored).

## Maintenance Patterns To Keep

1. Keep `App` as orchestration, not business logic.
New logic belongs in hooks/lib.

2. Keep mode behavior config-driven.
Update `src/lib/gameContent.js` first when extending game modes.

3. Keep URL query params canonical.
Add params through `src/lib/routes.js` normalization/builders and write route settings through `src/hooks/useRouteSettings.js`.
Use `navigateWithSettings` when changing routes that should preserve current settings.

4. Keep stateful behavior in hooks.
`useGameSession`, `useProgressSync`, `useAuthSession`, `useBlueprintGameSession`.

5. Keep domain logic mostly pure and in `lib`.
This improves testability and reduces UI coupling.

6. Preserve per-mode progress model.
Avoid mixing stats/history across game types.

7. Preserve storage adapter boundaries.
Backend changes should mostly stay inside `src/lib/storage.js`.

8. Preserve explicit local/cloud merge semantics.
`src/lib/progressMerge.js` is critical for avoiding data loss.

9. Keep round-resume behavior intact.
`src/lib/roundSession.js` improves UX and should remain compatible (dual-store snapshots + lifecycle flushes).

10. Keep blueprint semantic gate + fallback model.
Verified strategies first; fallback remains explicit opt-in only for development recovery.

11. Maintain test parity with implementation.
Add/update paired tests for changed modules.

12. Treat deploy JSON artifacts as infrastructure memory.
Update them deliberately and keep naming clear.

13. Keep content registry invariants updated with content edits.
When changing questions/templates/blueprint contracts, update `src/lib/content/registry.js` and `src/lib/content/registry.test.js` in the same change.

14. Keep imported solution metadata aligned with question-mode behavior.
When updating Blind75 answer patterns/solutions, update `src/lib/questionSolutions.js`, `src/lib/questions.js`, and the affected tests in the same change.

## Recommended Feature-Change Sequence

1. Update constants/routes.
2. Update content/config (`gameContent`, templates/questions, etc.).
3. Implement behavior in hooks/lib.
4. Wire UI at screen/component layer.
5. Add/adjust tests.
6. Validate deploy impact if infra/API behavior changed.
7. Update `README.md` in the same change whenever behavior, architecture, setup, or deployment docs are affected.

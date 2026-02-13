# LeetCode Patterns Game

## Problem This Game Addresses

Interview prep often stalls because people memorize isolated solutions instead of building durable pattern recognition.  
That leads to slower problem selection, weak transfer between questions, and inconsistent execution under time pressure.

## How The Game Solves It

This app trains pattern-first thinking through repeated, structured practice:

- `question -> pattern`: map problem statements to core solution patterns.
- `template -> pattern`: map code snippets to the underlying pattern they represent.
- `blueprint builder`: assemble solution flow cards, run execution traces, and learn ordering/invariants through feedback.

The result is faster pattern recall, clearer solving structure, and better interview consistency.

## What This App Is Intended For

This app is built to train LeetCode-style interview skills by reinforcing:

- Fast mapping from problem prompt to core solution pattern.
- Pattern recognition from code templates/snippets.
- Procedural thinking by assembling algorithm "blueprints" step by step and running execution traces.

It is not a full coding judge. It is a pattern-learning and reasoning trainer.

## Game Modes

1. `question -> pattern`
Maps Blind 75-style question prompts to the most likely solving pattern.

2. `template -> pattern`
Maps code snippets/templates to the pattern they represent, using confusion-aware distractors.

3. `blueprint builder`
Card-based algorithm assembly mode with worlds, tiers, daily challenge, test execution traces, hints, and star ratings.

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

## High-Level Architecture

1. Frontend:
- React app with route-based screens.
- `App` coordinates mode routing, per-mode progress, round session restore, auth, and sync.

2. Data:
- Questions/templates are static content in `src/lib`.
- Progress is stored per game mode (`question`, `template`, `blueprint`) with schema normalization/versioning.

3. Persistence:
- Local: browser `localStorage`.
- Optional cloud: Lambda Function URL + S3 per-user object storage.
- Merge logic preserves both local and cloud progress across sign-in transitions.

4. Blueprint generation:
- All 87 questions use strategy-driven generation with semantic verification.
- Production fallback is disabled by default and only enabled via explicit dev flag.
- Auto and tutorial levels now render pattern-family slot flows (for example: two pointers, sliding window, binary search, stack/heap, linked list, intervals/greedy, tree/graph, DP-state, backtracking) instead of one universal slot scaffold.

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
Main app orchestrator: route wiring, mode selection, progress state, round persistence, auth/sync integration.

- `src/global.css`
Global theme vars, base element styling, animation keyframes, shared interaction classes.

- `src/styles.js`
Central style object used by all screens/components.

- `src/test/setup.js`
Vitest DOM setup (`jest-dom`), per-test cleanup and localStorage reset.

### `src/components`

- `src/components/AccuracyDot.jsx`
Shows per-question accuracy percentage and attempt count.

- `src/components/AuthCard.jsx`
Signed-in/out auth UI and Google login widget integration.

- `src/components/CodeBlock.jsx`
Code rendering wrapper.

- `src/components/TemplateViewer.jsx`
Expandable pattern template display in compact/full modes.

### `src/hooks`

- `src/hooks/useAuthSession.js`
Google auth handling, backend session exchange, token migration, signout.

- `src/hooks/useGameSession.js`
Round lifecycle for quiz modes: start, select, score, streaks, keyboard shortcuts, finalize.

- `src/hooks/useProgressSync.js`
Local/cloud load and merge, auth error fallback, persistence orchestration.

### `src/lib`

- `src/lib/constants.js`
App constants (modes, game types, color maps, storage key).

- `src/lib/routes.js`
Route constants, query parsing/normalization, URL builders.

- `src/lib/questions.js`
Question dataset (id/name/pattern/difficulty/description).

- `src/lib/templates.js`
Universal skeleton and per-pattern template catalog.

- `src/lib/templateQuestions.js`
Snippet dataset and confusion map for option generation.

- `src/lib/gameContent.js`
Mode registry and behavior config used by `App`.

- `src/lib/utils.js`
Shuffle and option generation helpers.

- `src/lib/selectors.js`
Derived metrics (round pct, lifetime pct, weak spots, mastery, grouping).

- `src/lib/progressModel.js`
Progress schema/version handling and per-mode getters/setters.

- `src/lib/progressMerge.js`
Conflict-safe local/cloud merge logic.

- `src/lib/storage.js`
Storage adapters (local and API) plus read/write helpers.

- `src/lib/auth.js`
JWT decode helpers and token-to-user mapping.

- `src/lib/roundSession.js`
`sessionStorage` save/load/clear for in-progress rounds.

### `src/lib/blueprint`

- `src/lib/blueprint/templates.js`
Blueprint slot template definitions.

- `src/lib/blueprint/contracts.js`
Semantic contracts and randomized trial counts for all 87 questions.

- `src/lib/blueprint/strategyRegistry.js`
Registry facade for modular strategy families in `src/lib/blueprint/strategies/`.

- `src/lib/blueprint/taxonomy.js`
Pattern-to-archetype taxonomy with wave assignment and reusable slot-set mapping.

- `src/lib/blueprint/coverageReport.js`
Coverage and quality metrics (`strategy coverage`, `semantic pass`, `fallback count`, `per-wave`, `per-pattern`).

- `src/lib/blueprint/semanticVerifier.js`
Deterministic/random verification gate for strategy solve plans.

- `src/lib/blueprint/ir.js`
Converts verified IR nodes into card payloads and slot limits.

- `src/lib/blueprint/solutionPipeline.js`
Strategy selection + verification + IR conversion + strict no-fallback default behavior.

- `src/lib/blueprint/levels.js`
Base handcrafted levels + auto-generated levels for all questions.

- `src/lib/blueprint/campaign.js`
World/tier progression model, unlock rules, deterministic daily challenge selection.

- `src/lib/blueprint/engine.js`
Blueprint executor, test runner, trace generation, divergence detection.

### `src/screens`

- `src/screens/MenuScreen.jsx`
Main menu, settings, progress summary, auth entry, actions.

- `src/screens/PlayScreen.jsx`
Question/snippet gameplay screen.

- `src/screens/ResultsScreen.jsx`
Round results summary with expandable per-item review.

- `src/screens/BrowseScreen.jsx`
Pattern browser with difficulty filters.

- `src/screens/TemplatesScreen.jsx`
Full template reference viewer.

- `src/screens/BlueprintScreen.jsx`
Nested blueprint route shell and challenge completion persistence.

### `src/screens/blueprint`

- `src/screens/blueprint/BlueprintMenu.jsx`
Blueprint tab shell (`Map`, `Daily`, placeholder `Stats`).

- `src/screens/blueprint/BlueprintMapView.jsx`
World progression map, continue CTA, daily banner.

- `src/screens/blueprint/BlueprintWorldDetailView.jsx`
World stage/tier detail and challenge launch UI.

- `src/screens/blueprint/BlueprintDailyView.jsx`
Daily challenge detail/start screen.

- `src/screens/blueprint/BlueprintGame.jsx`
Card deck/slot placement UX, drag/drop/touch support, run/reset controls.

- `src/screens/blueprint/BlueprintExecution.jsx`
Execution trace stepping and feedback display.

- `src/screens/blueprint/useBlueprintGameSession.js`
Blueprint gameplay state machine (deck/slots/attempts/hints/stars/timing).

- `src/screens/blueprint/shared.js`
Shared utilities for star normalization, hint text, badge colors, duration formatting.

- `src/screens/blueprint/viewShared.js`
Shared world map helpers (accents/icons/unlock calculations/next challenge).

### Test files (`*.test.js|*.test.jsx`)

- `src/App.test.jsx`
App route and mode flow.

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

- `src/lib/auth.test.js`
JWT decode and user extraction.

- `src/lib/gameContent.test.js`
Mode config and choice generation wiring.

- `src/lib/progressMerge.test.js`
Progress merge correctness.

- `src/lib/progressModel.test.js`
Progress schema normalization.

- `src/lib/selectors.test.js`
Derived metrics/grouping helpers.

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
Blueprint navigation and drag/touch interactions.

- `src/screens/BrowseScreen.test.jsx`
Browse UI grouping/expansion.

- `src/screens/MenuScreen.test.jsx`
Menu mode controls and reset/auth states.

- `src/screens/PlayScreen.test.jsx`
Play screen behavior for question/code prompts.

- `src/screens/ResultsScreen.test.jsx`
Results expansion and review content.

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
Add params through `src/lib/routes.js` normalization/builders.

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
`src/lib/roundSession.js` improves UX and should remain compatible.

10. Keep blueprint semantic gate + fallback model.
Verified strategies first; fallback remains explicit opt-in only for development recovery.

11. Maintain test parity with implementation.
Add/update paired tests for changed modules.

12. Treat deploy JSON artifacts as infrastructure memory.
Update them deliberately and keep naming clear.

## Recommended Feature-Change Sequence

1. Update constants/routes.
2. Update content/config (`gameContent`, templates/questions, etc.).
3. Implement behavior in hooks/lib.
4. Wire UI at screen/component layer.
5. Add/adjust tests.
6. Validate deploy impact if infra/API behavior changed.
7. Update `README.md` in the same change whenever behavior, architecture, setup, or deployment docs are affected.

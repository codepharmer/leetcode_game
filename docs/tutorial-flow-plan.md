# Tutorial Flow Plan

## 1. Goals

1. Reduce first-session confusion across all three modes: Match, Template, Build.
2. Get a new player to one "success moment" quickly in each mode.
3. Keep tutorials skippable, resumable, and replayable.
4. Use progressive disclosure: only teach what is needed at that moment.

## 2. Tutorial System Shape

1. **Global onboarding** (first app visit) — overlay sequence on `MenuScreen` (`/`).
2. **Mode onboarding** (first play of each mode) — guided round or overlay sequence.
3. **Contextual tips** — one-time micro-hints for specific controls/features, building on the existing hotkey badge system (`1-4`, `Enter`, `D`, `T` chips already rendered in `PlayScreen`).
4. **Replay entry** — "Replay tutorial" button on `MenuScreen`, inside each mode's settings area, so onboarding is never a one-shot.

## 3. Existing Infrastructure to Build On

Before designing new systems, the plan should acknowledge what already exists and avoid duplication.

| Feature | Location | What it provides |
|---|---|---|
| Blueprint tutorial tier | `campaign.js` `TIER_SLOT_META[0]` | `guided: true`, `hintsMode: "full"`, `showPatternLabel: true`, 300 s limit |
| World 0 primitives lane | `campaign.js` `WORLD_DEFINITIONS[0]` | 17 foundational levels designed as the first Build experience |
| Hotkey hint badges | `PlayScreen.jsx` | `D` (description), `T` (template), `1-4` (choice selection), `Enter` (next) |
| Guided card sort | `blueprint/shared.js` `sortCardsForGuided()` | Pre-sorts blueprint cards by slot order in tutorial tier |
| Card-level hint messages | `blueprint/shared.js` `buildHintMessage()` | Contextual hints per card ("belongs in [slot]", "may be a distractor") |
| Dependency warnings | `blueprint/dependencyHints.js` | Placement-order warnings for card dependencies |
| Round session persistence | `roundSession.js` | `sessionStorage`-based save/restore of in-progress quiz rounds |
| Progress model | `progressModel.js` | `{ version, byGameType: { [gameType]: { stats, history, meta } } }` |
| Progress merge | `progressMerge.js` | Max-operation merge across history, stats, and `meta.levelStars` |
| Cloud sync | `storage.js` + `useProgressSync.js` | Lambda API adapter for authenticated users |

New tutorial components should integrate with these systems, not replace or duplicate them.

## 4. State Model

### 4.1 Storage location

Add a new top-level `onboarding` key to the progress object, sibling to `byGameType`:

```js
{
  version: 2,
  byGameType: { /* existing */ },
  onboarding: {
    global:             { status, lastStep },
    question_to_pattern:{ status, lastStep },
    template_to_pattern:{ status, lastStep },
    blueprint_builder:  { status, lastStep },
    tips: {
      quizShortcuts: false,   // true once shown
      blueprintDragTap: false,
      blueprintHintPenalty: false,
    },
  },
}
```

### 4.2 Status values

Each flow tracks: `not_started | in_progress | completed | skipped`.

### 4.3 Resume behavior

`lastStep` is the zero-based index of the last completed step. On re-entry, resume from `lastStep + 1`. If `status` is `completed` or `skipped`, do not auto-trigger.

### 4.4 Integration with existing models

- `normalizeProgress()` in `progressModel.js` gains an `onboarding` branch with defaults (`not_started` everywhere, all tips `false`).
- `normalizeProgress()` must treat a missing `onboarding` key as "all not_started" so existing users are not broken.
- The `PROGRESS_VERSION` stays at 2 — the onboarding key is additive and `normalizeProgress` already uses a tolerant shape.

### 4.5 Merge rule for cloud/local sync

Extend `mergeProgressData()` in `progressMerge.js`:

- **Status**: use a precedence order: `completed` > `skipped` > `in_progress` > `not_started`. Higher precedence wins.
- **`lastStep`**: take `Math.max(remote, local)`.
- **Tip flags**: logical OR (once shown on any device, stay shown).

This mirrors the existing max-operation strategy used for `stats`, `history`, and `levelStars`.

### 4.6 Cloud sync compatibility

The Lambda API stores the full progress JSON blob via `storage.js`. Because onboarding lives inside the same blob, no API changes are needed. Older clients that don't know about `onboarding` will ignore the key; `normalizeProgress` will re-add defaults when they next load.

## 5. Component Architecture

### 5.1 The missing piece: overlay components

The codebase has no modal/tooltip/overlay library. The only dialog pattern is the Blueprint slot editor sheet (`role="dialog"`). The tutorial system needs a small set of purpose-built components.

### 5.2 New components

| Component | Purpose | Mount point |
|---|---|---|
| `TutorialOverlay` | Full-screen semi-transparent backdrop with a spotlight cutout and positioned tooltip | Rendered via React portal at `document.body` so it layers above all screens |
| `TutorialTooltip` | Arrow-pointing tooltip with title, body text, step indicator, `Next` / `Skip` / `Don't show again` buttons | Child of `TutorialOverlay` |
| `TutorialSpotlight` | CSS box-shadow or clip-path cutout that highlights a target DOM element | Child of `TutorialOverlay` |
| `useTutorialFlow` hook | Manages current step index, reads/writes onboarding state, handles next/skip/dismiss/resume logic | Consumed by each screen that hosts a tutorial |

### 5.3 Styling approach

Use the existing `styles.js` inline-style system. Define new entries under an `S.tutorial*` namespace. Use CSS custom properties (`--bg-app`, `--surface-1`, etc.) for theme consistency. Animations can use the existing `fadeIn` / `fadeUp` keyframes defined in global CSS.

### 5.4 Target element resolution

`TutorialOverlay` accepts a `targetRef` (React ref) or a `targetSelector` (CSS selector string). It measures the target's bounding rect on mount and on window resize, then positions the tooltip and spotlight accordingly. This avoids coupling tutorial steps to component internals.

## 6. First-Time User Master Flow (Global Onboarding)

### 6.1 Trigger condition

```js
onboarding.global.status === "not_started"
```

Do not use heuristics like "no meaningful prior progress." The explicit flag is unambiguous, survives progress resets, and decouples the trigger from gameplay data.

### 6.2 Steps

| Step | Screen area | What it does |
|---|---|---|
| A — Welcome | Center overlay | "Welcome to LeetCode Patterns" — one sentence explaining the app's purpose. |
| B — Mode overview | Spotlight on mode selector | Briefly explain the three modes: Match (identify patterns from questions), Template (identify patterns from code), Build (construct algorithm blueprints). |
| C — Pick a mode | Mode selector | Ask the user to pick a mode. Selection triggers navigation to that mode's setup screen. |
| D — Handoff | — | Mark `onboarding.global` as `completed`. Start the selected mode's tutorial immediately. |

### 6.3 Exit rule

Mark global onboarding `completed` once Step D fires. Do not force completion of all three mode tutorials in one session.

## 7. Match Mode Tutorial (`question_to_pattern`)

### 7.1 Trigger

```js
onboarding.question_to_pattern.status === "not_started"
```

Checked when entering `/play` with `gameType=question_to_pattern`.

### 7.2 Tutorial round generation

Use a **hardcoded list of 3-5 Easy question IDs** (curated for clarity, drawn from `QUESTION_ITEMS`), not the normal `generateRound()` pool-and-shuffle path. This guarantees a consistent first experience.

Implementation: add a `TUTORIAL_QUESTION_IDS` constant to `gameContent.js`. When the tutorial is active, `useGameSession.startGame` receives this list instead of building one from `itemsPool`.

### 7.3 Stats isolation

Tutorial rounds should **not** inflate lifetime stats (`gamesPlayed`, `totalCorrect`, etc.). Either:
- Skip the `persistModeProgress` call at round end, or
- Pass a `isTutorial` flag that `nextQuestion` checks before writing stats.

History entries (per-question correct/wrong) **can** be written, since they represent real attempts and help the browse screen show prior exposure.

### 7.4 Teach sequence (overlay steps interleaved with gameplay)

1. **Before Q1**: Spotlight the question title and difficulty badge. Tooltip: "Read the problem — your goal is to identify which algorithm pattern solves it."
2. **Before Q1 choices**: Spotlight the 4 answer buttons. Tooltip: "Pick the pattern. You can click or press 1-4."
3. **After Q1 answer**: Spotlight the correctness feedback. Tooltip: "Green = correct. You'll also see the template for this pattern." (builds on existing `revealTemplateAfterAnswer` behavior).
4. **After Q1 next**: Tooltip explaining `Enter` / `Next` to advance. Mention the `D` key for toggling the description.
5. **On results screen**: Spotlight score and streak. Tooltip: "This is your round summary. Your stats accumulate over time."

### 7.5 Completion

User finishes the tutorial round and reaches the results screen. Mark `onboarding.question_to_pattern` as `completed`.

### 7.6 Skip behavior

"Skip tutorial" at any overlay step should:
- Mark status as `skipped`.
- Start a normal round immediately (full pool, default count of 20).

## 8. Template Mode Tutorial (`template_to_pattern`)

### 8.1 Trigger

```js
onboarding.template_to_pattern.status === "not_started"
```

Checked when entering `/play` with `gameType=template_to_pattern`.

### 8.2 Tutorial round generation

Hardcoded list of 3-5 snippet IDs from `TEMPLATE_ITEMS`, chosen for rising ambiguity: start with a snippet whose pattern is obvious from structure, end with one that has plausible confusions.

### 8.3 Stats isolation

Same rule as Match: skip `persistModeProgress` for the tutorial round.

### 8.4 Teach sequence

1. **Before S1**: Spotlight the code block. Tooltip: "Read the code structure — look for loops, hash maps, window variables."
2. **Before S1 choices**: Tooltip: "Pick the strongest matching pattern. Distractors are chosen to be plausible confusions." (references `genChoicesWithConfusions` behavior).
3. **After S1 answer on mobile**: If viewport is narrow, tooltip: "Scroll the code block horizontally to see long lines." (Mobile horizontal scroll is already implemented in `PlayScreen`; this just calls attention to it.)
4. **On results screen**: Tooltip: "Try Browse (`/browse`) to study patterns grouped by category, or Templates (`/templates`) to see full template code."

### 8.5 Completion

Mark `onboarding.template_to_pattern` as `completed` when the user reaches results.

### 8.6 Suggested next action

On the results screen, show a dismissible card: "Explore more: [Browse Patterns](/browse) or [View Templates](/templates)." These link to the existing `/browse` and `/templates` routes respectively.

## 9. Build Mode Tutorial (`blueprint_builder`)

### 9.1 Trigger

```js
onboarding.blueprint_builder.status === "not_started"
```

Checked when entering `/blueprint`.

### 9.2 Two-phase design

The Build tutorial is split across two route boundaries, matching the user's actual navigation:

**Phase A — Campaign map** (on `/blueprint`):
1. Spotlight World 0 node. Tooltip: "This is your starting world — it covers fundamental patterns."
2. Spotlight the daily challenge banner (if visible). Tooltip: "A new daily challenge unlocks each day from worlds you've reached."
3. Spotlight the "Continue" CTA. Tooltip: "Tap to enter your current world and see its levels."

**Phase B — In-challenge** (on `/blueprint/challenge/:id`, first World 0 tutorial-tier challenge):
1. Spotlight the card tray. Tooltip: "These are your building blocks. Each card is one step in the algorithm."
2. Spotlight a slot row. Tooltip: "Drag a card here, or tap to place it. On mobile, use the bottom sheet."
3. Spotlight the "Run Blueprint" button (disabled state). Tooltip: "Fill all required slots to enable this. Distractor cards can be left in the tray."
4. After first run: Spotlight the step navigator. Tooltip: "Step through the execution trace to see how your blueprint processes each test case."
5. After pass: Tooltip explaining stars: "1 star = correct. 2-3 stars reward speed and not using hints."

### 9.3 Relationship to existing World 0 tutorial tier

Phase B overlays run **on top of** the existing tutorial tier behavior (`guided: true`, `hintsMode: "full"`, `showPatternLabel: true`). The overlays add UI explanation; the tier settings handle gameplay scaffolding. Neither replaces the other.

### 9.4 Completion

Mark `onboarding.blueprint_builder` as `completed` when the user passes the first World 0 tutorial challenge with at least 1 star.

### 9.5 Completion is advisory, not gating

Consistent with §11.2 ("never block core actions"), the tutorial overlays do not prevent the user from interacting with the challenge at any time. Dismissing an overlay does not skip the tutorial — the next overlay appears at its designated trigger point. The user can complete the challenge before all overlays have shown; remaining overlays are skipped and the tutorial is marked `completed`.

## 10. Contextual One-Time Tips

### 10.1 Quiz mode shortcuts

On the first question of the first **non-tutorial** round in either quiz mode, show a small non-blocking chip: "Keyboard: 1-4 to answer, Enter to continue, D for description, T for template." This extends the existing hotkey badge rendering in `PlayScreen` — the tip is a one-time expanded version that collapses to the existing compact badges after dismissal.

Set `tips.quizShortcuts = true` after display.

### 10.2 Blueprint drag/tap

On the first non-tutorial blueprint challenge, show a brief tooltip near the card tray: "Drag cards to slots, or tap a card then tap a slot." Set `tips.blueprintDragTap = true`.

### 10.3 Blueprint hint penalty

The first time the user taps "Hint" on a non-tutorial challenge, show: "Using hints reduces your maximum star rating for this challenge." Set `tips.blueprintHintPenalty = true`.

### 10.4 Behavior rules

- Tips appear at the relevant moment, not up front.
- Tips are dismissible with a tap/click or `Escape`.
- Tips never block interaction — they overlay non-interactively and auto-dismiss after 6 seconds if not manually dismissed.
- Tip flags are synced via the same merge rule as onboarding status (logical OR).

## 11. UX Rules

1. Every tutorial overlay has `Next`, `Skip`, and `Don't show again`.
2. **Never block core actions** behind forced tutorial clicks. The user can always interact with the underlying screen while an overlay is visible.
3. Resume interrupted tutorials from `lastStep + 1` on next visit.
4. Keep tutorial text short and action-oriented — max 2 sentences per tooltip.
5. Overlay tooltips use a semi-transparent backdrop with a spotlight cutout. The cutout element remains fully interactive.

## 12. Accessibility

1. When a tutorial overlay appears, move focus to the tooltip's `Next` button. Ensure the tooltip is in the tab order.
2. `Escape` dismisses the current tooltip (equivalent to `Skip` for that step).
3. Tooltips use `role="dialog"` and `aria-modal="false"` (since the underlying screen remains interactive).
4. Step transitions announce the new tooltip text via `aria-live="polite"` region.
5. Spotlight cutouts must not interfere with screen reader flow — the backdrop should be `aria-hidden="true"` while the tooltip and the target element remain accessible.

## 13. Edge Cases

| Scenario | Behavior |
|---|---|
| Browser back button mid-tutorial | `lastStep` is already persisted; tutorial resumes on re-entry. No special handling needed beyond the normal resume logic. |
| Direct URL navigation to `/play?gameType=question_to_pattern` | The mode tutorial trigger still fires — it checks `onboarding` status, not the entry path. Global onboarding is skipped in this case (it only triggers on `/`). |
| Refresh during tutorial | `onboarding` state is in `localStorage` (persistent). The in-progress quiz round is in `sessionStorage` (per-tab). On refresh, the round restores from session storage and the tutorial resumes from `lastStep + 1`. |
| User completes the challenge before all Build overlays show | Mark tutorial `completed` immediately. Do not show remaining overlays retroactively. |
| Shared device / different user | Each authenticated user gets their own cloud-synced progress blob. For unauthenticated users, `localStorage` is shared — this is an existing limitation, not tutorial-specific. |
| User resets progress | A "reset onboarding" option in the replay menu lets users re-trigger tutorials without clearing gameplay data. Resetting game progress should also reset onboarding to `not_started`. |

## 14. Measurement Plan

### 14.1 Prerequisite: event tracking utility

The codebase currently has **no analytics infrastructure**. Before any tutorial metrics can be collected, build a minimal event emitter:

```js
// lib/analytics.js
export function trackEvent(name, properties = {}) {
  if (import.meta.env.VITE_ANALYTICS_ENDPOINT) {
    // POST to analytics endpoint (future integration)
  }
  if (import.meta.env.DEV) {
    console.debug("[analytics]", name, properties);
  }
}
```

This decouples event emission from the analytics backend. During development, events log to console. Production integration (Mixpanel, Amplitude, etc.) is a future decision.

### 14.2 Events to track

| Event | Properties | Purpose |
|---|---|---|
| `onboarding_started` | `flow` (global / match / template / build) | Funnel entry |
| `onboarding_step_completed` | `flow`, `stepIndex`, `stepName` | Step-by-step drop-off analysis |
| `onboarding_completed` | `flow`, `totalSteps`, `durationMs` | Funnel completion |
| `onboarding_skipped` | `flow`, `atStep` | Where users bail out |
| `tip_shown` | `tipKey` | Tip reach |
| `tip_dismissed` | `tipKey`, `method` (tap / escape / timeout) | Tip engagement |
| `tutorial_replayed` | `flow` | Replay usage |

### 14.3 Activation metrics (derived from gameplay events)

- First round started, first round completed (quiz modes).
- First blueprint challenge cleared, first 3-star.
- Day-1 return and second-mode adoption.

These are already observable from the progress model; the analytics layer just needs to emit events at the right moments in `useGameSession` and `useBlueprintGameSession`.

### 14.4 Tuning

Use step drop-off rates to identify steps with high abandonment. Shorten or remove them. Target: ≥70% of users who start a mode tutorial should complete it.

## 15. Rollout Plan

### 15.1 Dependency graph

```
Phase 0 ──→ Phase 1 ──→ Phase 2
                    ├──→ Phase 3
                    └──→ Phase 4
Phase 0 ──────────────────────────→ Phase 5
```

### 15.2 Phases

| Phase | Contents | Depends on | Deliverables |
|---|---|---|---|
| **0 — Foundation** | `TutorialOverlay` component family, `useTutorialFlow` hook, `trackEvent` utility, `styles.js` tutorial entries | Nothing | Reusable overlay system + dev-mode analytics |
| **1 — State model** | `onboarding` key in progress model, merge logic extension, replay entry point on `MenuScreen` | Phase 0 | Persistent, syncable onboarding state |
| **2 — Global + Match** | Global onboarding flow on `MenuScreen`, Match mode tutorial in `PlayScreen` | Phase 1 | First complete end-to-end tutorial path |
| **3 — Template + Tips** | Template mode tutorial in `PlayScreen`, contextual one-time tips | Phase 1 | Second quiz mode covered, shortcut discoverability |
| **4 — Blueprint overlays** | Campaign map overlays + in-challenge overlays layered on World 0 tutorial tier | Phase 1 | Build mode covered |
| **5 — Polish** | Analytics dashboard integration, A/B copy variants, step pruning based on drop-off data | Phase 0 data + any tutorial phase | Optimization based on real usage |

Phases 2, 3, and 4 are independent of each other and can ship in any order after Phase 1.

## 16. Acceptance Criteria

1. New player can finish a guided success loop in each mode without external docs.
2. Tutorials do not interfere with normal returning-user flow (trigger only on `not_started` status).
3. Skip / resume / replay all work across refresh and sign-in sync.
4. No regressions in existing route, session, or progress behavior.
5. Tutorial rounds do not inflate lifetime stats.
6. All overlay interactions are keyboard-accessible and screen-reader-compatible.
7. `trackEvent` calls fire for all onboarding lifecycle events (at minimum to `console.debug` in dev).

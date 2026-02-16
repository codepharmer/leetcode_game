# Tutorial Plan (No Implementation Yet)

## 1. Goals

1. Reduce first-session confusion across all three modes: `Match`, `Template`, `Build`.
2. Get a new player to one "success moment" quickly in each mode.
3. Keep tutorials skippable, resumable, and replayable.
4. Use progressive disclosure: only teach what is needed at that moment.

## 2. Tutorial System Shape

1. Global onboarding (first app visit) on `MenuScreen`.
2. Mode onboarding (first play of each mode).
3. Contextual tips (one-time micro hints for specific controls/features).
4. "Replay tutorial" entry from menu/help, so onboarding is never a one-shot.

## 3. State Model (Planning)

1. Add persistent onboarding state so it survives refresh and sync.
2. Track `not_started | in_progress | completed | skipped` per flow.
3. Track last completed step for resume behavior.
4. Track one-time tip flags (e.g., keyboard shortcuts shown, hint penalty shown).
5. Merge rule for cloud/local sync: completed flags win, highest step index wins.

## 4. First-Time User Master Flow

1. Trigger condition: no meaningful prior progress across modes and no onboarding completion flags.
2. Step A (menu intro): explain the three mode outcomes in one compact overlay.
3. Step B (mode picker): highlight segmented selector (`Match`, `Template`, `Build`) and ask user to choose one.
4. Step C (start setup): explain round settings for quiz modes, and campaign preview for build mode.
5. Step D (launch): start selected mode tutorial immediately.
6. Exit rule: mark global onboarding complete after first mode tutorial starts; do not force completion of all mode tutorials in one session.

## 5. Match Mode Tutorial (`question -> pattern`)

1. Trigger: first time entering `/play` with `question_to_pattern`.
2. Use a short guided tutorial round (3-5 easy prompts), not a full default round.
3. Teach sequence:
   - Read prompt title/difficulty and optional description toggle.
   - Choose answer from 4 options (click or `1-4`).
   - See immediate correctness feedback.
   - Continue with `Next`/`Enter`.
   - Show post-answer template reveal purpose.
4. End on results screen with a short explanation of score, streak, and lifetime stats.
5. Completion: user finishes tutorial round and reaches results.
6. Optional fast-exit: "Skip tutorial" should jump into normal mode immediately.

## 6. Template Mode Tutorial (`template -> pattern`)

1. Trigger: first time entering `/play` with `template_to_pattern`.
2. Use a short guided snippet round (3-5 snippets with rising ambiguity).
3. Teach sequence:
   - How to scan snippet structure quickly (loop/window/hash cues).
   - Pattern choice under confusion-aware distractors.
   - Mobile behavior: horizontal code scroll.
   - `Next` flow and results interpretation.
4. End with suggested next action: `Browse` or `All Templates` reference.
5. Completion: user finishes tutorial snippet round and reaches results.

## 7. Build Mode Tutorial (`blueprint builder`)

1. Trigger: first time entering blueprint mode.
2. Use existing World 0 as the backbone, plus UI guidance overlays.
3. Teach in order:
   - Map view meaning: world nodes, lock text, daily banner, continue CTA.
   - World detail: tiers, solved count, stars.
   - In-challenge build phase: tray, slot rows, drag/drop/tap placement, slot editor sheet.
   - Constraints: all required cards must be placed before `Run Blueprint`.
   - Hints/timer/attempts and how stars are awarded.
   - Execution phase: step navigation, test results, divergence feedback.
4. Completion target: pass first World 0 tutorial challenge with at least 1 star.
5. Post-completion nudge: explain that 2-3 stars come from time and no-hint bonus.

## 8. Contextual One-Time Tips

1. Quiz modes: show shortcut hint chip (`1-4`, `Enter`, `D`, `T`) once, then collapse.
2. Blueprint: show "drag or tap" helper once, and "hints reduce 3-star chance" once.
3. Show tips only at relevant moments (not up front), with dismiss and never-blocking behavior.

## 9. UX Rules

1. Every tutorial step has `Next`, `Skip`, and `Don't show again`.
2. Never block core actions behind forced tutorial clicks.
3. Resume interrupted tutorial from last saved step.
4. Keep tutorial text short and action-oriented.

## 10. Measurement Plan

1. Track events: onboarding started/completed/skipped, step drop-off, mode tutorial completion.
2. Track activation: first round started, first round completed, first blueprint clear, first 3-star.
3. Track retention proxies: day-1 return and second-mode adoption.
4. Use these to tune step count and copy length.

## 11. Rollout Plan

1. Phase 1: instrumentation + state model + replay entry.
2. Phase 2: global onboarding + Match tutorial.
3. Phase 3: Template tutorial + contextual shortcut hints.
4. Phase 4: Blueprint overlays integrated with World 0 flow.
5. Phase 5: polish based on drop-off analytics.

## 12. Acceptance Criteria

1. New player can finish a guided success loop in each mode without external docs.
2. Tutorials do not interfere with normal returning-user flow.
3. Skip/resume/replay all work across refresh and sign-in sync.
4. No regressions in existing route/session behavior.

No files were changed in the original planning pass, so no `README.md` update was needed at that stage.

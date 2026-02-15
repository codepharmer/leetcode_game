# Content Registry Single-Source Plan Checklist

## Context

Today, game modes share some base data but still assemble content from multiple places:

- `question -> pattern` reads quiz items from `src/lib/questions.js`.
- `template -> pattern` reads snippet quiz items from `src/lib/templateQuestions.js` (which itself depends on `src/lib/templates.js`).
- `blueprint builder` reads levels generated through `src/lib/blueprint/*` pipelines.

This creates drift risk between pattern mappings, question IDs, templates, and blueprint generation metadata.

## Goal

Create a single logical content registry that composes existing modules and becomes the authoritative read model for all game modes.

## Non-Goals

- Replace all existing content files with one monolithic file.
- Rewrite blueprint strategy logic in this effort.
- Change app UX as part of the initial registry introduction.

## Target Ownership Model

- Canonical question catalog: `src/lib/questions.js`
- Canonical template library/snippets: `src/lib/templates.js`
- Canonical blueprint slot/template families: `src/lib/blueprint/templates.js`
- Canonical blueprint contract + strategy selection: `src/lib/blueprint/contracts.js` and `src/lib/blueprint/strategyRegistry.js`
- Canonical composed read model (new): `src/lib/content/registry.js`

## Proposed Registry Surface

- `getQuestionToPatternItems()`
- `getTemplateToPatternItems()`
- `getBlueprintSeedByQuestionId(questionId)`
- `getPatternIndex()`
- `validateContentRegistry()`

## Implementation Plan

### Phase 0 - Inventory and Invariants

- [x] Document existing import graph for mode content sources.
- [x] Define invariant list (question IDs unique, patterns valid, no orphan mappings).
- [x] Define naming normalization policy for pattern keys (exact string match rules).
- [x] Confirm fallback behavior expectations for missing template/blueprint links.

Implementation notes:

- Import graph now converges through `src/lib/content/registry.js` for quiz/game mode reads.
- Invariants are codified in `validateContentRegistry()` and `src/lib/content/registry.test.js`.
- Pattern normalization policy is `exact-trimmed-match` and is exported via `getPatternIndex().normalizationPolicy`.
- Fallback behavior is explicit in `validateContentRegistry().fallbackBehavior` (null-safe template metadata defaults and null seed for unknown question IDs).

Exit criteria:

- [x] Invariants are written and agreed before code migration.

### Phase 1 - Introduce Registry (No Behavior Change)

- [x] Add `src/lib/content/registry.js`.
- [x] Build `questionsById` index from `QUESTIONS`.
- [x] Build `patternIndex` from canonical questions.
- [x] Attach template metadata to each question using existing `templates` + `templateQuestions` inputs.
- [x] Attach blueprint profile metadata to each question using taxonomy/contracts interfaces.
- [x] Keep existing mode code paths unchanged (registry introduced in parallel).

Exit criteria:

- [x] Registry exports are pure/deterministic.
- [x] No runtime behavior changes in app screens.

### Phase 2 - Add Validation and Guard Tests

- [x] Add `src/lib/content/registry.test.js`.
- [x] Assert every canonical question appears in registry.
- [x] Assert every registry question has a valid pattern and difficulty.
- [x] Assert template mappings reference valid canonical patterns.
- [x] Assert blueprint mappings exist for every canonical question ID.
- [x] Assert there are no orphan question IDs in template/blueprint projections.
- [x] Add a strict failure message for each invariant breach.

Exit criteria:

- [x] Tests fail loudly on drift.
- [x] CI catches mismatches before merge.

### Phase 3 - Migrate Game Mode Read Paths

- [x] Update `src/lib/gameContent.js` to consume registry adapter functions.
- [x] Keep game mode output shape unchanged (`items`, `allPatterns`, `buildChoices`).
- [x] Verify `useGameSession` call contract remains unchanged.
- [x] Run unit tests for game content and affected screens.

Exit criteria:

- [x] `question -> pattern` and `template -> pattern` modes read from registry-backed adapters.
- [x] No visual/flow regression in menu/play/results/browse.

### Phase 4 - Migrate Blueprint Read Inputs Carefully

- [x] Introduce registry-backed blueprint seed accessors without changing engine behavior.
- [x] Ensure generated levels still match existing contracts/strategies.
- [x] Verify fallback semantics remain unchanged when strategy selection or semantic gate fails.
- [x] Run blueprint test suite (`levels`, `engine`, `solutionPipeline`, `coverage`, `ciGates`).

Exit criteria:

- [x] Blueprint mode reads canonical question identity from registry paths.
- [x] Existing blueprint quality gates stay green.

### Phase 5 - De-duplicate Legacy Wiring

- [x] Reduce direct cross-imports where registry now provides the same joined data.
- [x] Keep source modules separated by concern (questions/templates/blueprint logic).
- [x] Remove obsolete adapter glue only after tests prove parity.
- [x] Add deprecation comments where immediate cleanup is postponed (N/A in this pass; no deferred adapter cleanup remained).

Exit criteria:

- [x] No duplicated mapping logic remains in mode wiring.

### Phase 6 - Documentation and Follow-through

- [x] Update `README.md` when behavior or developer workflow changes due to registry adoption.
- [x] Add a short "content ownership" section that explains canonical files vs composed registry.
- [x] Add contributor checklist item: update registry invariants/tests with content changes.

Exit criteria:

- [x] Docs explain how to extend content without introducing drift.

## Risk Checklist

- [ ] Pattern key mismatches across modules due to string variance.
- [ ] Hidden coupling between template snippet selection and blueprint template families.
- [ ] Blueprint fallback paths silently masking registry mismatches.
- [ ] Over-eager deduplication causing regressions in established tests.

## Rollout Checklist

- [ ] Merge Phase 1 + 2 first (safe, mostly additive).
- [ ] Ship Phase 3 in a separate PR.
- [ ] Ship Phase 4 in a separate PR with focused regression review.
- [ ] Perform final cleanup/documentation in a follow-up PR.

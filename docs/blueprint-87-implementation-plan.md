# Blueprint 87-Problem Implementation Plan

> Context note (for any developer opening this file fresh):  
> This project auto-generates Blueprint levels from question metadata (`src/lib/questions.js`).  
> We already introduced a new correctness pipeline for questions `q-1` to `q-10`:
> - Contracts: `src/lib/blueprint/contracts.js`
> - Strategy registry: `src/lib/blueprint/strategyRegistry.js`
> - IR renderer: `src/lib/blueprint/ir.js`
> - Semantic verifier: `src/lib/blueprint/semanticVerifier.js`
> - Orchestrator: `src/lib/blueprint/solutionPipeline.js`
> - Wiring in levels: `src/lib/blueprint/levels.js`
>
> Current status:
> - `q-1..q-10` use strategy generation + semantic gate.
> - Remaining questions currently fall back to template generation.
> - Representation is still too uniform in UI (`setup -> loop -> update -> check -> return`) and does not always reflect true pattern abstractions.
>
> Goal:
> Build a scalable, pattern-accurate abstraction layer with semantic correctness for **all 87 questions**, then remove fallback from production generation.

## Primary Outcomes

- [x] All 87 questions use `generationSource = strategy` (no production fallback).
- [x] All 87 pass semantic verification (`verification.passed = true`).
- [x] Blueprint slot structure is pattern-accurate (not one universal phase model).
- [x] CI fails on any regression in coverage, semantic pass rate, or fallback count.

## Non-Goals (For This Rollout)

- [x] No redesign of game UI outside data/slot representation changes required for accurate pattern rendering.
- [x] No change to AWS/deployment infra in this plan.

## Workstream A: Foundation

- [x] Create blueprint taxonomy module with reusable slot sets by archetype.
- [x] Split monolithic strategy registry into family-based modules under `src/lib/blueprint/strategies/`.
- [x] Keep `solutionPipeline` API stable while swapping internals.
- [x] Add coverage report utility (`src/lib/blueprint/coverageReport.js`) for strategy/fallback/verification metrics.
- [x] Add tests for taxonomy and coverage report.

## Workstream B: Contract Coverage (87/87)

- [x] Expand contracts to all 87 questions with deterministic cases and randomized trial counts.
- [x] Add per-question constraints where needed (`disallowTokens`, output normalization mode, etc.).
- [x] Add schema test to ensure all contracts are valid and question IDs are fully covered.

## Workstream C: Strategy + Blueprint Rollout (By Wave)

### Wave 1: Arrays/Hashing + Two Pointers + Sliding Window
- [x] Implement/complete pattern-accurate strategies and blueprints for this wave.
- [x] Add comparators for unordered/variant-valid outputs.
- [x] Gate: all Wave 1 questions must be strategy-generated and semantic-pass.

### Wave 2: Binary Search + Stack/Monotonic Stack + Heap
- [x] Implement family strategies and slot blueprints.
- [x] Add validators for lower-bound/answer-search style outputs as needed.
- [x] Gate: Wave 1-2 questions all strategy-generated + semantic-pass.

### Wave 3: Linked List + Intervals/Sorting + Greedy/Kadane
- [x] Implement mutation/relink strategies and interval-greedy abstractions.
- [x] Add equivalence validators for linked-list outputs where needed.
- [x] Gate: Wave 1-3 questions all strategy-generated + semantic-pass.

### Wave 4: Trees + Trie
- [x] Implement DFS/BFS/inorder/construct/serialize/validate strategies.
- [x] Add tree normalization/comparison helpers for robust assertions.
- [x] Gate: Wave 1-4 questions all strategy-generated + semantic-pass.

### Wave 5: Graphs + Topological Sort + Union-Find
- [x] Implement traversal/topo/DSU strategy families.
- [x] Add comparator support for "any valid topological order" outputs.
- [x] Gate: Wave 1-5 questions all strategy-generated + semantic-pass.

### Wave 6: Dynamic Programming + Bit Manipulation + Matrix
- [x] Implement 1D/2D DP, memoized recursion, bit, and matrix strategy families.
- [x] Add strict and normalized comparators where outputs can vary but remain valid.
- [x] Gate: all 87 questions strategy-generated + semantic-pass.

## Workstream D: De-Fallback and Enforcement

- [x] Keep fallback path only during migration (development safety).
- [x] Add CI gate that fails if fallback count increases.
- [x] After all waves pass, enforce `fallback_count = 0` in CI for shipped questions.
- [x] Keep fallback behind explicit dev flag only (not default production behavior).

## Workstream E: Tooling, Reporting, and Docs

- [x] Add `npm run blueprint:report` to print coverage, pass rates, confidence, and fallback counts.
- [x] Add developer doc for adding a new question end-to-end (`docs/blueprint-pipeline.md`).
- [x] Add final audit checklist for future PR reviewers.

## PR Breakdown (Concrete Sequence)

- [x] PR-1 Foundation hardening (taxonomy, strategy module split, coverage report skeleton).
- [x] PR-2 Contract completion for all 87 (+ schema tests).
- [x] PR-3 Wave 1 implementation + gates.
- [x] PR-4 Wave 2 implementation + gates.
- [x] PR-5 Wave 3 implementation + gates.
- [x] PR-6 Wave 4 implementation + gates.
- [x] PR-7 Wave 5 implementation + gates.
- [x] PR-8 Wave 6 implementation + gates.
- [x] PR-9 Remove production fallback default + strict CI enforcement.
- [x] PR-10 Documentation + final quality pass.

## CI Gates (Must Stay Green)

- [x] `npm test` passes.
- [x] No regression in previously completed wave coverage.
- [x] Semantic pass rate is 100% for all completed-wave questions.
- [x] Fallback count never increases during migration.
- [x] Final state: fallback count is 0 for all 87.

## Tracking Metrics (Weekly)

- [x] `strategy_coverage_pct`
- [x] `semantic_pass_pct`
- [x] `fallback_count`
- [x] `low_confidence_count`
- [x] `per_pattern_completion`

## Pattern Inventory (Current 87-Question Distribution)

- [x] Dynamic Programming (8)
- [x] Backtracking (7)
- [x] Binary Search (6)
- [x] DFS (6)
- [x] Bit Manipulation (5)
- [x] Two Pointers (5)
- [x] Sliding Window (4)
- [x] Hash Map (3)
- [x] Matrix (3)
- [x] Monotonic Stack (3)
- [x] Topological Sort (3)
- [x] Remaining singleton/dual patterns covered in waves above

## Final Release Checklist

- [x] Coverage report confirms 87/87 strategy-generated.
- [x] Verification report confirms 87/87 semantic-pass.
- [ ] UI spot-check confirms pattern-specific slot abstraction is visible and coherent.
- [x] `README`/dev docs updated with current pipeline behavior.
- [ ] Team sign-off recorded.

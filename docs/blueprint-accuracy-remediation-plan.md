# Blueprint Accuracy Remediation Plan (Q11-Q87)

## Objective

Make Blueprint generation for questions `q-11..q-87` problem-accurate, verifiably correct, and maintainable.

## Current Gaps

1. Generic solver path is used for non-first-ten questions.
- `src/lib/blueprint/strategies/waveTemplateStrategies.js` uses `solveSemanticProbe`.
- This validates probe semantics, not the target LeetCode problem semantics.

2. Contracts for non-first-ten questions are placeholder-shaped.
- `src/lib/blueprint/contracts.js` default contracts use `seedProbeCase(...)`.
- Deterministic cases do not match real per-question input/output schemas.

3. Template selection can mismatch problem intent.
- `src/lib/blueprint/templatePlan.js` chooses template variant by difficulty index.
- This can assign incorrect snippet families for specific questions.

4. CI/reporting currently reports semantic pass, but not problem-specific correctness coverage.

## Success Criteria

1. Every question `q-1..q-87` has a problem-specific strategy+oracle path.
2. Every question has realistic deterministic cases aligned to the actual problem schema.
3. Random validation for each question checks real algorithm semantics (not probe semantics).
4. Fallback count remains `0` in production mode.
5. CI fails if any production question uses placeholder probe strategy/cases.
6. Blueprint report includes a new “problem-specific coverage” metric at `100%`.

## Workstreams

## 1) Contract Hardening

Files:
- `src/lib/blueprint/contracts.js`
- `src/lib/blueprint/contracts.test.js`
- `src/lib/blueprint/ciGates.test.js`

Tasks:
1. Replace default probe deterministic cases with real cases for `q-11..q-87`.
2. Add explicit per-question contract metadata:
- `strategyId`
- `complexity`
- `constraints` (`outputMode`, `disallowTokens`) where needed
3. Add contract schema validation for “no placeholder inputs in production questions”.
4. Add CI gate that fails if any contract uses `left/right/text` probe shape.

Acceptance:
1. No production contract uses `seedProbeCase`.
2. Contract tests assert realistic I/O shape by question category.

## 2) Strategy Implementation (Problem-Specific)

Files:
- `src/lib/blueprint/strategies/`
- `src/lib/blueprint/strategyRegistry.js`

Tasks:
1. Keep `firstTenStrategies.js` as reference quality.
2. Add new per-wave modules (or per-pattern modules) with concrete `solve`, `randomCaseFactory`, and `randomOracle`:
- `wave1Strategies.js` (`q-11..q-16`)
- `wave2Strategies.js` (`q-17..q-32`)
- `wave3Strategies.js` (`q-33..q-53`)
- `wave4Strategies.js` (`q-54..q-61`)
- `wave5Strategies.js` (`q-62..q-75`)
- `wave6Strategies.js` (`q-76..q-87`)
3. Keep output normalization/comparators only where equivalence classes are needed (lists/trees/topological order).
4. Remove production dependence on `waveTemplateStrategies.js` probe solver.

Acceptance:
1. `selectBlueprintStrategy(...)` resolves concrete question strategies for all `87`.
2. No non-tutorial question executes `solveSemanticProbe`.

## 3) Template Selection Accuracy

Files:
- `src/lib/blueprint/templatePlan.js`
- `src/lib/templates.js`
- optionally `src/lib/blueprint/taxonomy.js`

Tasks:
1. Replace difficulty-only template index selection with explicit mapping:
- `QUESTION_TEMPLATE_VARIANT_BY_ID` (highest precision), or
- `PATTERN_TEMPLATE_VARIANT_RULES` with per-question overrides.
2. Add overrides for known mismatches:
- Topological Sort questions (`57`, `58`) -> Kahn template
- Union Find / DFS questions (`59`, `60`) -> DSU/graph-valid-tree template
- Matrix questions (`85`, `86`, `87`) -> question-specific matrix variants
- Bit manipulation questions (`80..84`) -> per-question bit template variant
3. Add tests ensuring key questions map to intended template snippets.

Acceptance:
1. Known mismatch set is `0`.
2. Template mapping tests cover at least one representative question per pattern.

## 4) Verifier and Comparator Hardening

Files:
- `src/lib/blueprint/semanticVerifier.js`
- `src/lib/blueprint/strategies/comparators.js`

Tasks:
1. Ensure verifier checks run against realistic problem schemas.
2. Add optional deep-clone guard between oracle and solve inputs where mutation risk exists.
3. Keep comparators strict for:
- linked list structural/value equivalence
- tree structural/value equivalence
- topological order validity
4. Add targeted tests for comparator false-positive prevention.

Acceptance:
1. Comparator tests include adversarial false-positive cases.
2. Verification cannot pass with semantically unrelated outputs.

## 5) Reporting + CI Gates

Files:
- `src/lib/blueprint/coverageReport.js`
- `src/lib/blueprint/coverageReport.test.js`
- `src/lib/blueprint/ciGates.test.js`
- `scripts/blueprint-report.mjs`

Tasks:
1. Add metrics:
- `problemSpecificStrategyCount`
- `placeholderContractCount`
- `semanticProbeUsageCount` (production questions)
2. Fail CI if any of these are non-zero.
3. Print per-wave remediation completion status.

Acceptance:
1. `npm run blueprint:report` shows all new metrics.
2. CI gates enforce zero-placeholder policy.

## Execution Plan (Phased)

## Phase 0: Baseline + Safety Nets

1. Add CI/report metrics first.
2. Add failing tests for known mismatches and placeholder strategy usage.

Deliverable:
- Guardrails in place before large strategy migration.

## Phase 1: Wave 1 Remediation (`q-11..q-16`)

Scope:
- Two pointers + sliding window set.

Deliverable:
- Real strategies + contracts + tests for 6 questions.

## Phase 2: Wave 2 Remediation (`q-17..q-32`)

Scope:
- Stack/monotonic stack/binary search/heap/linked list hybrid set.

Deliverable:
- Real strategies + contracts + tests for 16 questions.

## Phase 3: Wave 3 + Wave 4 Remediation (`q-33..q-61`)

Scope:
- Trees, backtracking, tries, graph/topological/union-find.

Deliverable:
- Real strategies + contracts + tests for 29 questions.

## Phase 4: Wave 5 + Wave 6 Remediation (`q-62..q-87`)

Scope:
- DP, greedy/intervals, bit manipulation, matrix.

Deliverable:
- Real strategies + contracts + tests for 26 questions.

## Phase 5: Cleanup

1. Remove or dev-gate legacy probe-based strategy path.
2. Update docs and finalize report targets.

## Testing Plan

Run on each phase:

```powershell
npm run test
npm run blueprint:report
```

Required additions:
1. Per-wave strategy tests for correctness and constraints.
2. Contract tests for realistic case schema.
3. Template mapping regression tests for known problematic IDs.
4. CI gate tests for placeholder usage = `0`.

## Risks and Mitigations

1. Risk: Large migration introduces regressions.
- Mitigation: Phase-by-phase rollout with CI gates before expansion.

2. Risk: Strategy duplication becomes hard to maintain.
- Mitigation: Shared helpers for common patterns + per-question wrappers.

3. Risk: Overfitting deterministic cases.
- Mitigation: Keep deterministic + randomized oracle checks for every question.

## Definition of Done

1. All 87 questions use problem-specific strategies and realistic contracts.
2. Placeholder probe usage is zero for production questions.
3. Known template mismatch list is zero.
4. `blueprint:report` and CI gates both show full compliance.


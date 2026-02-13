# Blueprint Pipeline

This document defines the current blueprint generation pipeline for all 87 auto-generated question levels.

## Architecture

1. `src/lib/blueprint/contracts.js`
- Declares one semantic contract per question.
- Enforces full question coverage and schema validation.

2. `src/lib/blueprint/taxonomy.js`
- Maps patterns to archetypes, slot sets, wave IDs, and default strategy families.

3. `src/lib/blueprint/strategies/`
- `firstTenStrategies.js`: handcrafted strategy plans for questions `q-1..q-10`.
- `waveTemplateStrategies.js`: family strategies for waves 1-6 (`q-11..q-87`).
- `comparators.js`: output equivalence comparators (`unordered`, `linked-list`, `topological-order`).

4. `src/lib/blueprint/templatePlan.js`
- Converts question templates into IR nodes with template-aware slot classification.

5. `src/lib/blueprint/solutionPipeline.js`
- Contract -> strategy -> semantic verification -> IR -> cards.
- Template fallback is disabled by default and only allowed when explicitly enabled.

6. `src/lib/blueprint/coverageReport.js`
- Computes strategy coverage, semantic pass rate, fallback count, and per-wave/per-pattern completion.

## Fallback Behavior

Fallback is not default production behavior.

- Default: no fallback (`strategy-error` if generation cannot be validated).
- Explicit opt-in: set `VITE_BLUEPRINT_ALLOW_FALLBACK=1` (or pass `allowFallback: true` in pipeline invocation).

## Adding a New Question End-to-End

1. Add the question to `src/lib/questions.js`.
2. Ensure `taxonomy` has a pattern entry for the question's pattern.
3. Add/override contract details in `contracts.js` if needed:
- deterministic cases
- random trial count
- constraints (`disallowTokens`, `outputMode`)
4. If needed, add/adjust comparator logic in `strategies/comparators.js`.
5. If needed, add a custom strategy in `strategies/` and map `strategyId` in contracts.
6. Run checks:
- `npm run test`
- `npm run blueprint:report`

## CI Expectations

- Strategy coverage: `100%`.
- Semantic pass rate: `100%`.
- Fallback count: `0` for shipped questions.
- Per-wave completion remains non-regressive.

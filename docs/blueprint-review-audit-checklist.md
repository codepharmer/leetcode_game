# Blueprint PR Audit Checklist

Use this checklist when reviewing blueprint-pipeline PRs.

- [ ] Strategy coverage remains `87/87` (or current total) and no question regresses to fallback.
- [ ] Semantic verification remains `100%` for shipped questions.
- [ ] Fallback count is `0` in production mode.
- [ ] Contract coverage matches `src/lib/questions.js` exactly.
- [ ] Each contract passes schema validation.
- [ ] New patterns are mapped in taxonomy (wave + archetype + template strategy).
- [ ] Pattern-specific slot structure remains visible (`standard`, `backtracking`, `recursive`).
- [ ] Comparators/normalizers are present when outputs are order-variant.
- [ ] Coverage report output (`npm run blueprint:report`) is included or summarized in PR notes.
- [ ] Tests added/updated for any changed contract, strategy, taxonomy, or gating logic.

# Implementation Checklist

## Critical

- [ ] Add failing regression tests for round restore and description toggle:
  - `src/hooks/useGameSession.test.jsx`
  - `src/screens/PlayScreen.test.jsx`
  - new `src/lib/roundSession.test.js`
- [ ] Fix session persistence for in-progress rounds:
  - Move round snapshot persistence in `src/lib/roundSession.js` to durable storage (`localStorage` or dual-write with `sessionStorage`)
  - Add snapshot metadata (`savedAt`, version)
  - Flush snapshot on lifecycle signals (`visibilitychange`, `pagehide`) in `src/App.jsx`
- [ ] Fix "show description" reliability:
  - Ensure button toggle always works when description exists
  - Support robust hotkey detection (`KeyD`) in `src/hooks/useGameSession.js`
  - Add fallback UI when description is missing in `src/screens/PlayScreen.jsx`

## High Priority 
- [ ] Clarify similar/overlapping pattern names:
  - Add glossary/alias layer in `src/lib/content/registry.js`
  - Update visible labels/confusions in `src/lib/constants.js` and `src/lib/templateQuestions.js`

## Nice To Have

- [ ] Keyboard shortcuts polish (1-4 answers, Enter continue):
  - Keep existing behavior and add visible shortcut hints in `src/screens/PlayScreen.jsx`
  - Add tests for both quiz modes
- [ ] Add interview timer mode:
  - Extend settings in `src/lib/routes.js` and `src/hooks/useRouteSettings.js`
  - Add timer controls in `src/screens/MenuScreen.jsx`
  - Add countdown/end-of-round handling in `src/hooks/useGameSession.js`
- [ ] Link to LeetCode problems from results:
  - Use `sourceLeetcodeId` from `src/lib/questions.js`
  - Render links in `src/screens/ResultsScreen.jsx` with fallback for missing IDs
- [ ] Add past incorrect-answer review:
  - Persist attempt events in mode `meta` via `src/lib/progressModel.js` and `src/App.jsx`
  - Add a review UI (menu section or dedicated screen)
- [ ] Show accuracy trends over time:
  - Persist per-round snapshots (`date`, `answered`, `correct`, `pct`) in mode `meta`
  - Add selectors in `src/lib/selectors.js`
  - Render trend chart in `src/screens/MenuScreen.jsx` or `src/screens/ResultsScreen.jsx`

## Suggested PR Order

- [ ] PR 1: Stability (session persistence + description fix + tests)
- [ ] PR 2: Answer model (  naming clarity)
- [ ] PR 3: UX additions (timer, LeetCode links, incorrect review, accuracy trends)

## Documentation

- [ ] Update `README.md` in each implementation PR that changes behavior, routes, data model, or workflow.

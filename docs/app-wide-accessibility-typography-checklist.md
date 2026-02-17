# App-Wide Accessibility & Typography Pass Checklist

## Scope and Done Criteria
- [ ] Scope locked: app-wide pass across `src/global.css`, `src/styles.js`, all `src/screens/**/*.jsx`, and all `src/components/**/*.jsx`.
- [ ] Done criteria agreed: no hardcoded UI color values outside centralized tokens, no text below 13px, code text at 13.5px with 1.6 line-height, keyboard and ARIA coverage for all interactive controls, and WCAG AA contrast for text.

## 1) Baseline Audit
- [ ] Save baseline search outputs for tracking before/after:
- [ ] `rg -n "<div[^>]*onClick" src`
- [ ] `rg -n "fontSize:\\s*(10(\\.\\d+)?|11(\\.\\d+)?|12(\\.\\d+)?)" src`
- [ ] `rg -n "font-family|DM Sans|DM Mono|Outfit|Source Sans|IBM Plex Mono" src/global.css src/styles.js src/screens src/components`
- [ ] `rg -n "#[0-9a-fA-F]{3,8}|rgba\\(" src/global.css src/styles.js src/screens src/components`

## 2) Typography Foundation
- [ ] Update `src/global.css` font import to load `Source Sans 3` and `IBM Plex Mono` only.
- [ ] Define font tokens in `:root`:
- [ ] `--font-ui: 'Source Sans 3', 'Source Sans Pro', sans-serif`
- [ ] `--font-code: 'IBM Plex Mono', monospace`
- [ ] Apply root smoothing in `:root`:
- [ ] `-webkit-font-smoothing: antialiased`
- [ ] `-moz-osx-font-smoothing: grayscale`
- [ ] Apply `font-family: var(--font-ui)` globally (`body` and inherited controls).
- [ ] Apply minimum body/UI font size floor of `13px`.
- [ ] Apply code typography defaults on `code, pre, kbd, samp`: `font-family: var(--font-code)`, `font-size: 13.5px`, `line-height: 1.6`.
- [ ] Refactor `FONTS` in `src/styles.js` to use token-based families and remove `DM Sans`, `DM Mono`, and `Outfit`.
- [ ] Replace any inline font-family literals in screens/components with token-driven values.

## 3) Color Tokenization and Replacement
- [ ] Set dark background token baseline to `#0f1117`.
- [ ] Set default surface token baseline to `rgba(255,255,255,0.045)`.
- [ ] Define centralized semantic text tokens and map all usage through them.
- [ ] Define centralized accent tokens and map all usage through them.
- [ ] Define shared state tokens (success/info/warn/error/focus) as semantic variables.
- [ ] Ensure global focus ring token exists and equals `#b8a1ff`.

## 4) Required Color Migrations
- [ ] Text: replace `#e2e8f0` with `#edf0f7`.
- [ ] Text: replace `#94a3b8` with `#a8b2c1`.
- [ ] Text: replace `#64748b` with `#8d96a7`.
- [ ] Text: replace `#475569` with `#7a8394`.
- [ ] Text: replace `#c4b5fd` with `#d4c8ff`.
- [ ] Text: replace `#a5b4fc` with `#bcc8ff`.
- [ ] Accent: replace `#a78bfa` with `#b8a1ff`.
- [ ] Accent: replace `#34d399` with `#5ee8b7`.
- [ ] Accent: replace `#60a5fa` with `#7db8ff`.
- [ ] Accent: replace `#fbbf24` with `#ffd057`.
- [ ] Accent: replace `#f472b6` with `#ff8ec8`.
- [ ] Surface bg: replace `#0c0e14` with `#0f1117`.
- [ ] Surface: replace `rgba(255,255,255,0.04)` with `rgba(255,255,255,0.045)`.

## 5) Remove Hardcoded Visual Values
- [ ] Replace hardcoded hex/rgba usages in `src/styles.js` with theme tokens.
- [ ] Replace hardcoded hex/rgba usages in `src/global.css` rules with theme tokens (excluding token definitions).
- [ ] Replace hardcoded hex/rgba usages in `src/screens/MenuScreen.jsx` with shared tokens/theme object.
- [ ] Replace hardcoded hex/rgba usages in `src/screens/PlayScreen.jsx` with shared tokens/theme object.
- [ ] Replace hardcoded hex/rgba usages in `src/screens/ReviewScreen.jsx` with shared tokens/theme object.
- [ ] Replace hardcoded hex/rgba usages in `src/screens/ResultsScreen.jsx` with shared tokens/theme object.
- [ ] Replace hardcoded hex/rgba usages in `src/screens/blueprint/*.jsx` with shared tokens/theme object.
- [ ] Replace hardcoded hex/rgba usages in `src/screens/blueprint/shared.js` and `src/screens/blueprint/viewShared.js` with shared tokens/theme object.
- [ ] Re-run color grep and confirm only token definitions remain as literals.

## 6) Typography Size Floor Enforcement
- [ ] Replace every UI text size below 13px in `src/styles.js` with 13px+ equivalents.
- [ ] Replace every UI text size below 13px in inline styles across screens/components.
- [ ] Ensure all code-like labels/snippets use 13.5px and `line-height: 1.6`.
- [ ] Standardize text size tokens (example: `--text-xs`, `--text-sm`, `--text-code`) and consume in style objects/classes.

## 7) Keyboard and Semantic Interaction Pass
- [ ] Replace clickable `div` rows with semantic `button` in `src/screens/BrowseScreen.jsx`.
- [ ] Replace clickable `div` rows with semantic `button` in `src/screens/ResultsScreen.jsx`.
- [ ] If any non-button interactive element remains, add `role="button"`, `tabIndex={0}`, and Enter/Space key handlers.
- [ ] Add `aria-label` to all icon-only controls and any interactive element without visible text.
- [ ] Ensure every toggle uses `aria-pressed` with a true boolean state.
- [ ] Ensure progress indicators expose `role="progressbar"` + `aria-valuemin`, `aria-valuemax`, `aria-valuenow`.
- [ ] Add `role="timer"` to countdown UI in blueprint build flow.
- [ ] Ensure all modal/sheet/overlay dialogs use `role="dialog"` and `aria-modal` appropriately.
- [ ] Ensure hint/toast/status message surfaces use `role="status"` (or appropriate `aria-live`) for announcements.
- [ ] Add/update global focus rule in `src/global.css`: `*:focus-visible { outline: 2px solid #b8a1ff; outline-offset: 2px; }`.

## 8) Tap Target and Non-Color State Rules
- [ ] Introduce a shared tap-target utility (`min-width: 44px; min-height: 44px`) and use it for all interactive controls.
- [ ] Apply tap target sizing to compact controls in menu, blueprint controls, icon buttons, close buttons, and tiny chips.
- [ ] Ensure state is never color-only: pair color with icon, text, border pattern, or text decoration.
- [ ] Specifically add redundant cues for used/completed/incorrect states (for example icon + label, or strikethrough + marker).

## 9) WCAG AA Contrast Validation
- [ ] Validate all text tokens against `#0f1117` and surface tokens with contrast >= 4.5:1.
- [ ] Validate all tokenized badge/chip/button text on active/inactive backgrounds with contrast >= 4.5:1.
- [ ] Validate dynamic gradient/overlay text contrast in blueprint and menu banners.
- [ ] Resolve any failures by adjusting semantic token values, not ad hoc component literals.

## 10) Test Coverage and QA
- [ ] Add or update tests for keyboard activation on converted interactive rows.
- [ ] Add or update tests asserting ARIA state/roles for toggle, progressbar, timer, dialog, and status regions.
- [ ] Add or update tests for min tap target class/style presence on critical controls.
- [ ] Run `npm run test`.
- [ ] Run `npm run build`.
- [ ] Run manual keyboard-only pass (Tab, Shift+Tab, Enter, Space, Escape).
- [ ] Run manual screen reader smoke pass on Menu, Play, Results, Browse, and Blueprint screens.

## 11) Documentation and Rollout
- [ ] Update `README.md` with the new typography stack, token policy, and accessibility requirements (if implementation changes behavior/styles in shipped UI).
- [ ] Add short developer note on token usage and no-hardcoded-color rule.
- [ ] Confirm completion with before/after grep outputs and test/build results.

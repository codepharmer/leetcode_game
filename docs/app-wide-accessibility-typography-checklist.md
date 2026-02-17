# App-Wide Accessibility & Typography Pass Checklist

## Scope and Done Criteria
- [x] Scope locked: app-wide pass across `src/global.css`, `src/styles.js`, all `src/screens/**/*.jsx`, and all `src/components/**/*.jsx`.
- [x] Done criteria agreed: no hardcoded UI color values outside centralized tokens, no text below 13px, code text at 13.5px with 1.6 line-height, keyboard and ARIA coverage for all interactive controls, and WCAG AA contrast for text.

## 1) Baseline Audit
- [x] Save baseline search outputs for tracking before/after:
- [x] `rg -n "<div[^>]*onClick" src`
- [x] `rg -n "fontSize:\\s*(10(\\.\\d+)?|11(\\.\\d+)?|12(\\.\\d+)?)" src`
- [x] `rg -n "font-family|DM Sans|DM Mono|Outfit|Source Sans|IBM Plex Mono" src/global.css src/styles.js src/screens src/components`
- [x] `rg -n "#[0-9a-fA-F]{3,8}|rgba\\(" src/global.css src/styles.js src/screens src/components`

## 2) Typography Foundation
- [x] Update `src/global.css` font import to load `Source Sans 3` and `IBM Plex Mono` only.
- [x] Define font tokens in `:root`:
- [x] `--font-ui: 'Source Sans 3', 'Source Sans Pro', sans-serif`
- [x] `--font-code: 'IBM Plex Mono', monospace`
- [x] Apply root smoothing in `:root`:
- [x] `-webkit-font-smoothing: antialiased`
- [x] `-moz-osx-font-smoothing: grayscale`
- [x] Apply `font-family: var(--font-ui)` globally (`body` and inherited controls).
- [x] Apply minimum body/UI font size floor of `13px`.
- [x] Apply code typography defaults on `code, pre, kbd, samp`: `font-family: var(--font-code)`, `font-size: 13.5px`, `line-height: 1.6`.
- [x] Refactor `FONTS` in `src/styles.js` to use token-based families and remove `DM Sans`, `DM Mono`, and `Outfit`.
- [x] Replace any inline font-family literals in screens/components with token-driven values.

## 3) Color Tokenization and Replacement
- [x] Set dark background token baseline to `#0f1117`.
- [x] Set default surface token baseline to `rgba(255,255,255,0.045)`.
- [x] Define centralized semantic text tokens and map all usage through them.
- [x] Define centralized accent tokens and map all usage through them.
- [x] Define shared state tokens (success/info/warn/error/focus) as semantic variables.
- [x] Ensure global focus ring token exists and equals `#b8a1ff`.

## 4) Required Color Migrations
- [x] Text: replace `#e2e8f0` with `#edf0f7`.
- [x] Text: replace `#94a3b8` with `#a8b2c1`.
- [x] Text: replace `#64748b` with `#99a2b4`.
- [x] Text: replace `#475569` with `#919bad`.
- [x] Text: replace `#c4b5fd` with `#d4c8ff`.
- [x] Text: replace `#a5b4fc` with `#bcc8ff`.
- [x] Accent: replace `#a78bfa` with `#b8a1ff`.
- [x] Accent: replace `#34d399` with `#5ee8b7`.
- [x] Accent: replace `#60a5fa` with `#7db8ff`.
- [x] Accent: replace `#fbbf24` with `#ffd057`.
- [x] Accent: replace `#f472b6` with `#ff8ec8`.
- [x] Surface bg: replace `#0c0e14` with `#0f1117`.
- [x] Surface: replace `rgba(255,255,255,0.04)` with `rgba(255,255,255,0.045)`.

## 5) Remove Hardcoded Visual Values
- [x] Replace hardcoded hex/rgba usages in `src/styles.js` with theme tokens.
- [x] Replace hardcoded hex/rgba usages in `src/global.css` rules with theme tokens (excluding token definitions).
- [x] Replace hardcoded hex/rgba usages in `src/screens/MenuScreen.jsx` with shared tokens/theme object.
- [x] Replace hardcoded hex/rgba usages in `src/screens/PlayScreen.jsx` with shared tokens/theme object.
- [x] Replace hardcoded hex/rgba usages in `src/screens/ReviewScreen.jsx` with shared tokens/theme object.
- [x] Replace hardcoded hex/rgba usages in `src/screens/ResultsScreen.jsx` with shared tokens/theme object.
- [x] Replace hardcoded hex/rgba usages in `src/screens/blueprint/*.jsx` with shared tokens/theme object.
- [x] Replace hardcoded hex/rgba usages in `src/screens/blueprint/shared.js` and `src/screens/blueprint/viewShared.js` with shared tokens/theme object.
- [x] Re-run color grep and confirm only token definitions remain as literals.

## 6) Typography Size Floor Enforcement
- [x] Replace every UI text size below 13px in `src/styles.js` with 13px+ equivalents.
- [x] Replace every UI text size below 13px in inline styles across screens/components.
- [x] Ensure all code-like labels/snippets use 13.5px and `line-height: 1.6`.
- [x] Standardize text size tokens (example: `--text-xs`, `--text-sm`, `--text-code`) and consume in style objects/classes.

## 7) Keyboard and Semantic Interaction Pass
- [x] Replace clickable `div` rows with semantic `button` in `src/screens/BrowseScreen.jsx`.
- [x] Replace clickable `div` rows with semantic `button` in `src/screens/ResultsScreen.jsx`.
- [x] If any non-button interactive element remains, add `role="button"`, `tabIndex={0}`, and Enter/Space key handlers.
- [x] Add `aria-label` to all icon-only controls and any interactive element without visible text.
- [x] Ensure every toggle uses `aria-pressed` with a true boolean state.
- [x] Ensure progress indicators expose `role="progressbar"` + `aria-valuemin`, `aria-valuemax`, `aria-valuenow`.
- [x] Add `role="timer"` to countdown UI in blueprint build flow.
- [x] Ensure all modal/sheet/overlay dialogs use `role="dialog"` and `aria-modal` appropriately.
- [x] Ensure hint/toast/status message surfaces use `role="status"` (or appropriate `aria-live`) for announcements.
- [x] Add/update global focus rule in `src/global.css`: `*:focus-visible { outline: 2px solid #b8a1ff; outline-offset: 2px; }`.

## 8) Tap Target and Non-Color State Rules
- [x] Introduce a shared tap-target utility (`min-width: 44px; min-height: 44px`) and use it for all interactive controls.
- [x] Apply tap target sizing to compact controls in menu, blueprint controls, icon buttons, close buttons, and tiny chips.
- [x] Ensure state is never color-only: pair color with icon, text, border pattern, or text decoration.
- [x] Specifically add redundant cues for used/completed/incorrect states (for example icon + label, or strikethrough + marker).

## 9) WCAG AA Contrast Validation
- [x] Validate all text tokens against `#0f1117` and surface tokens with contrast >= 4.5:1.
- [x] Validate all tokenized badge/chip/button text on active/inactive backgrounds with contrast >= 4.5:1.
- [x] Validate dynamic gradient/overlay text contrast in blueprint and menu banners.
- [x] Resolve any failures by adjusting semantic token values, not ad hoc component literals.

## 10) Test Coverage and QA
- [x] Add or update tests for keyboard activation on converted interactive rows.
- [x] Add or update tests asserting ARIA state/roles for toggle, progressbar, timer, dialog, and status regions.
- [x] Add or update tests for min tap target class/style presence on critical controls.
- [x] Run `npm run test`.
- [x] Run `npm run build`.
- [ ] Run manual keyboard-only pass (Tab, Shift+Tab, Enter, Space, Escape).
- [ ] Run manual screen reader smoke pass on Menu, Play, Results, Browse, and Blueprint screens.

## 11) Documentation and Rollout
- [x] Update `README.md` with the new typography stack, token policy, and accessibility requirements (if implementation changes behavior/styles in shipped UI).
- [x] Add short developer note on token usage and no-hardcoded-color rule.
- [x] Confirm completion with before/after grep outputs and test/build results.

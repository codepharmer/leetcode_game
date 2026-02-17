# App-Wide Accessibility/Typography After Pass

Captured: 2026-02-17 11:21:56 -05:00

## 1) Clickable div audit
Command:
$ rg -n "<div[^>]*onClick" src

Output:
```text
(no matches)
```

## 2) Sub-13 font size audit
Command:
$ rg -n "fontSize:\s*(10(\\.\\d+)?|11(\\.\\d+)?|12(\\.\\d+)?)" src

Output:
```text
(no matches)
```

## 3) Font family literal audit
Command:
$ rg -n "font-family|DM Sans|DM Mono|Outfit|Source Sans|IBM Plex Mono" src/global.css src/styles.js src/screens src/components

Output:
```text
src/global.css:6:  --font-ui: "Source Sans 3", "Source Sans Pro", sans-serif;
src/global.css:7:  --font-code: "IBM Plex Mono", monospace;
src/global.css:105:  font-family: var(--font-ui);
src/global.css:116:  font-family: var(--font-ui);
src/global.css:141:  font-family: var(--font-code);
src/global.css:335:  font-family: var(--font-ui);
src/global.css:386:  font-family: var(--font-code);
src/global.css:421:  font-family: var(--font-code);
src/global.css:479:  font-family: var(--font-code);
src/global.css:495:  font-family: var(--font-code);
```

## 4) Hardcoded color literal audit
Command:
$ rg -n '#[0-9a-fA-F]{3,8}|rgba\\(' src/global.css src/styles.js src/screens src/components

Output:
```text
src/global.css:15:  --bg-page: #0f1117;
src/global.css:16:  --bg-app: #0f1117;
src/global.css:17:  --surface-1: rgba(255, 255, 255, 0.045);
src/global.css:18:  --surface-2: rgba(255, 255, 255, 0.075);
src/global.css:19:  --surface-hover: rgba(255, 255, 255, 0.08);
src/global.css:20:  --surface-soft: rgba(255, 255, 255, 0.14);
src/global.css:21:  --surface-overlay: rgba(0, 0, 0, 0.56);
src/global.css:22:  --surface-overlay-strong: rgba(0, 0, 0, 0.72);
src/global.css:23:  --surface-shadow-soft: rgba(0, 0, 0, 0.35);
src/global.css:24:  --surface-shadow-strong: rgba(0, 0, 0, 0.45);
src/global.css:26:  --border: #2a3040;
src/global.css:27:  --border-strong: #3a4254;
src/global.css:29:  --text: #edf0f7;
src/global.css:30:  --text-strong: #edf0f7;
src/global.css:31:  --muted: #c7d0df;
src/global.css:32:  --dim: #a8b2c1;
src/global.css:33:  --faint: #99a2b4;
src/global.css:34:  --quiet: #919bad;
src/global.css:35:  --text-accent-soft: #d4c8ff;
src/global.css:36:  --text-accent-cool: #bcc8ff;
src/global.css:38:  --accent: #5ee8b7;
src/global.css:39:  --accent2: #7db8ff;
src/global.css:40:  --accent-warn: #ffd057;
src/global.css:41:  --accent-pink: #ff8ec8;
src/global.css:42:  --accent-focus: #b8a1ff;
src/global.css:48:  --focus-ring: #b8a1ff;
src/global.css:54:  --accent-ring-soft: rgba(184, 161, 255, 0.45);
src/global.css:55:  --accent-ring-mid: rgba(184, 161, 255, 0.55);
src/global.css:56:  --accent-ring-strong: rgba(184, 161, 255, 0.78);
src/global.css:57:  --accent-fill-soft: rgba(184, 161, 255, 0.12);
src/global.css:58:  --accent-fill-mid: rgba(184, 161, 255, 0.18);
src/global.css:59:  --accent-fill-strong: rgba(184, 161, 255, 0.22);
src/global.css:60:  --info-ring-soft: rgba(125, 184, 255, 0.5);
src/global.css:61:  --info-fill-soft: rgba(125, 184, 255, 0.12);
src/global.css:62:  --info-fill-mid: rgba(125, 184, 255, 0.2);
src/global.css:63:  --warn-ring-soft: rgba(255, 208, 87, 0.45);
src/global.css:64:  --warn-fill-soft: rgba(255, 208, 87, 0.08);
src/global.css:65:  --warn-fill-mid: rgba(255, 208, 87, 0.14);
src/global.css:66:  --error-ring-soft: rgba(255, 142, 200, 0.45);
src/global.css:67:  --error-fill-soft: rgba(255, 142, 200, 0.12);
src/global.css:68:  --shimmer-highlight: rgba(255, 255, 255, 0.15);
src/global.css:69:  --selection-bg: rgba(184, 161, 255, 0.22);
src/global.css:70:  --scrollbar-thumb: rgba(255, 255, 255, 0.14);
src/global.css:71:  --panel-stroke-inner: rgba(255, 255, 255, 0.06);
src/global.css:73:  --bg-radial-top: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(94, 232, 183, 0.07), transparent);
src/global.css:74:  --bg-radial-bottom: radial-gradient(ellipse 60% 40% at 80% 100%, rgba(125, 184, 255, 0.05), transparent);
src/global.css:76:  --pulse-shadow-start: 0 0 20px rgba(184, 161, 255, 0.15), 0 0 60px rgba(184, 161, 255, 0.05);
src/global.css:77:  --pulse-shadow-mid: 0 0 25px rgba(184, 161, 255, 0.25), 0 0 80px rgba(184, 161, 255, 0.1);
src/global.css:78:  --blueprint-pulse-start: 0 0 0 0 rgba(184, 161, 255, 0.42);
src/global.css:79:  --blueprint-pulse-mid: 0 0 0 3px rgba(184, 161, 255, 0.18);
```

## 5) Tap-target coverage audit
Command:
$ [script] scan all `src/**/*.jsx` buttons and report those without `tap-target`

Output:
```text
(no missing buttons)
```

## 6) Contrast validation summary
Command:
$ [script] compute WCAG contrast for semantic text tokens against `--bg-page`, `--surface-1`, `--surface-2`, `--surface-soft`, plus active/inactive chip/button and gradient CTA combinations.

Output:
```text
ALL_CONTRAST_CHECKS_PASS
```

Highlights:
- `quiet on surface-soft`: `4.55` (PASS)
- `faint on surface-soft`: `4.97` (PASS)
- `bg-page on accent`: `12.31` (PASS)
- `bg-page on accent2`: `9.14` (PASS)
- `bg-page on danger`: `8.95` (PASS)

## 7) Verification runs
Command:
$ npm run test

Output:
```text
39 test files passed, 195 tests passed
```

Command:
$ npm run build

Output:
```text
vite build succeeded
note: existing chunk-size warning (>500kB) remains
```

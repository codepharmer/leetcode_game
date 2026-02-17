# App-Wide Accessibility/Typography Baseline

Captured: 2026-02-17 10:43:43 -05:00

## 1) Clickable div audit
Command:
$ rg -n "<div[^>]*onClick" src

Output:
```text
src\screens\BrowseScreen.jsx:56:                    <div className="hover-row" onClick={() => setExpandedBrowse((p) => ({ ...p, [item.id]: !p[item.id] }))} style={S.patternQ}>
src\screens\ResultsScreen.jsx:91:              <div className="hover-row" onClick={() => setExpandedResult((p) => ({ ...p, [i]: !p[i] }))} style={S.resultRow}>
```

## 2) Sub-13 font size audit
Command:
$ rg -n "fontSize:\s*(10(\\.\\d+)?|11(\\.\\d+)?|12(\\.\\d+)?)" src

Output:
```text
src\styles.js:63:  menuSignout: { fontFamily: FONTS.mono, fontSize: 11, color: C.faint, background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer" },
src\styles.js:74:  sectionLabel: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: C.faint, marginBottom: 18 },
src\styles.js:88:  syncBannerNote: { fontSize: 12, color: C.dim, lineHeight: 1.45 },
src\styles.js:97:  authEmail: { fontSize: 12, color: C.dim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
src\styles.js:99:  authBtn: { background: "none", border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px", color: C.dim, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", fontFamily: FONTS.mono },
src\styles.js:100:  authError: { fontSize: 12, color: "var(--danger)", textAlign: "center", maxWidth: 340, lineHeight: 1.45 },
src\styles.js:106:  statLabel2: { fontSize: 12, color: C.dim, textTransform: "uppercase", letterSpacing: "0.08em" },
src\styles.js:109:  weakLabel: { fontSize: 11, color: "var(--danger)", textTransform: "uppercase", letterSpacing: "0.5px" },
src\styles.js:115:  configLabel: { fontSize: 11, color: C.faint, minWidth: 86, textTransform: "uppercase", letterSpacing: "1px", fontFamily: FONTS.mono },
src\styles.js:125:    fontSize: 12.5,
src\styles.js:139:    fontSize: 12,
src\styles.js:162:  browseBtn: { padding: "9px 18px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface1, color: C.dim, fontSize: 12, cursor: "pointer", fontFamily: FONTS.mono, letterSpacing: "0.2px" },
src\styles.js:165:  resetBtn: { background: "none", border: "none", padding: "6px 12px", color: C.faint, fontSize: 11, cursor: "pointer", fontFamily: FONTS.ui },
src\styles.js:170:  backBtn: { background: C.surface1, border: `1px solid ${C.border}`, color: C.dim, fontSize: 12, cursor: "pointer", padding: "8px 12px", borderRadius: 10, fontFamily: FONTS.mono, letterSpacing: "0.2px" },
src\styles.js:179:  diffBadge: { fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, border: "1px solid", textTransform: "uppercase", letterSpacing: "0.6px" },
src\styles.js:183:  descHotkey: { fontSize: 11, padding: "1px 6px", borderRadius: 6, border: `1px solid ${C.border}`, color: C.dim, fontWeight: 700 },
src\styles.js:203:    fontSize: 12,
src\styles.js:219:  nextBtn: { padding: "9px 18px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface1, color: C.textStrong, fontSize: 12, cursor: "pointer", fontWeight: 700, fontFamily: FONTS.mono },
src\styles.js:228:  lifetimeLabel: { fontSize: 12, color: C.dim, fontFamily: FONTS.mono },
src\styles.js:236:  resultWrong: { fontSize: 12, color: C.dim, flexShrink: 0 },
src\styles.js:237:  chevron: { fontSize: 11, color: C.faint, flexShrink: 0, marginLeft: 4 },
src\styles.js:249:  patternCount: { fontSize: 12, color: C.dim, fontWeight: 700, fontFamily: FONTS.mono },
src\styles.js:253:  browseDescBox: { padding: "6px 8px 10px 30px", fontSize: 12, lineHeight: 1.6, color: C.dim, overflow: "hidden" },
src\styles.js:279:  templateCount: { fontSize: 11, color: C.faint, marginLeft: "auto" },
src\styles.js:291:  blueprintTopMeta: { fontSize: 11, color: C.dim, fontFamily: FONTS.mono, minWidth: 72, textAlign: "right" },
src\styles.js:318:    fontSize: 11,
src\styles.js:421:    fontSize: 10.5,
src\styles.js:431:  blueprintNodeMeta: { fontSize: 12, color: C.dim, lineHeight: 1.4, fontFamily: FONTS.mono },
src\styles.js:503:    fontSize: 12,
src\styles.js:510:    fontSize: 11,
src\styles.js:533:    fontSize: 12.5,
src\styles.js:547:  blueprintStatsItem: { fontSize: 11, color: C.dim, fontFamily: FONTS.mono, letterSpacing: "0.02em" },
src\styles.js:552:    fontSize: 12,
src\styles.js:579:    fontSize: 10.5,
src\styles.js:620:  blueprintDeckLabel: { fontSize: 10, color: C.faint, textTransform: "uppercase", letterSpacing: "0.11em", fontFamily: FONTS.mono },
src\styles.js:698:    fontSize: 12,
src\styles.js:709:  blueprintSlotName: { fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", fontFamily: FONTS.mono, flexShrink: 0 },
src\styles.js:710:  blueprintSlotDesc: { fontSize: 11, color: C.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
src\styles.js:716:    fontSize: 10.5,
src\styles.js:752:    fontSize: 10,
src\styles.js:770:    fontSize: 12,
src\styles.js:787:    fontSize: 11,
src\styles.js:796:  blueprintHintBubble: { marginTop: 8, fontSize: 11, color: C.dim, lineHeight: 1.45, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 8px" },
src\styles.js:802:    fontSize: 11.5,
src\styles.js:888:    fontSize: 12,
src\styles.js:917:    fontSize: 10.5,
src\styles.js:928:    fontSize: 10.5,
src\styles.js:953:    fontSize: 12,
src\styles.js:957:  blueprintArrayMarker: { fontSize: 10, color: C.faint, minHeight: 14, fontFamily: FONTS.mono },
src\styles.js:964:  blueprintStateLabel: { fontSize: 11, color: C.dim, marginBottom: 6, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: FONTS.mono },
src\styles.js:975:    fontSize: 11.5,
src\styles.js:978:  blueprintResultPill: { marginTop: 10, padding: "8px 10px", borderRadius: 8, border: `1px solid rgba(16, 185, 129, 0.45)`, background: "rgba(16, 185, 129, 0.08)", color: "var(--accent)", fontFamily: FONTS.mono, fontSize: 12.5 },
src\styles.js:992:    fontSize: 11,
src\styles.js:1014:  blueprintTestBody: { flex: 1, fontFamily: FONTS.mono, fontSize: 12, display: "flex", flexDirection: "column", gap: 2 },
src\styles.js:1046:    fontSize: 10.5,
src\styles.js:1107:    fontSize: 10.5,
src\styles.js:1124:    fontSize: 11,
src\styles.js:1135:    fontSize: 11,
src\styles.js:1163:    fontSize: 12.5,
src\styles.js:1168:    fontSize: 12,
src\styles.js:1173:    fontSize: 10.5,
src\components\AccuracyDot.jsx:10:    <span style={{ fontSize: 11, color, flexShrink: 0, marginLeft: 4, fontVariantNumeric: "tabular-nums" }}>
src\components\AccuracyDot.jsx:11:      {pct}%<span style={{ color: "var(--faint)", fontSize: 10 }}> ({total})</span>
src\screens\MenuScreen.jsx:149:        <span style={{ fontSize: 12, color: p === 0 ? "var(--faint)" : color, fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>
src\screens\MenuScreen.jsx:189:      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "var(--faint)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
src\screens\MenuScreen.jsx:217:        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--faint)" }}>local only</span>
src\screens\MenuScreen.jsx:380:        <span style={{ fontSize: 12, color: "var(--dim)", fontFamily: "'DM Mono', monospace" }}>
src\screens\MenuScreen.jsx:606:          fontSize: 11.5,
src\screens\MenuScreen.jsx:671:          <span style={{ fontSize: 12, color: "var(--danger)" }}>erase all progress?</span>
src\screens\ReviewScreen.jsx:26:              fontSize: 10,
src\screens\ReviewScreen.jsx:52:                <div style={{ fontSize: 12.5, color: "var(--dim)", lineHeight: 1.45, marginLeft: 26 }}>
src\screens\blueprint\BlueprintGame.jsx:295:            <div style={{ fontSize: 12, color: "var(--warn)" }}>Boss rush mode: identify the pattern yourself.</div>
src\screens\blueprint\BlueprintExecution.jsx:129:              <span style={{ ...S.blueprintNodeMeta, fontSize: 10.5 }}>case {index + 1}</span>
src\screens\blueprint\BlueprintExecution.jsx:130:              <span style={{ ...S.blueprintNodeMeta, fontSize: 10.5, color: result.passed ? "var(--accent)" : "var(--danger)" }}>
src\screens\blueprint\BlueprintExecution.jsx:168:          <div style={{ fontSize: 12, color: "var(--muted)", display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
src\screens\ResultsScreen.jsx:38:          <div style={{ marginTop: 6, fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--faint)" }}>
src\screens\blueprint\BlueprintMapView.jsx:47:        <span style={{ fontSize: 10, color: "var(--dim)", fontFamily: "'DM Mono', monospace", textTransform: "uppercase" }}>{icon}</span>
src\screens\blueprint\BlueprintMapView.jsx:139:          <span style={{ ...S.blueprintNodeMeta, color: "rgba(15, 17, 23, 0.82)", fontSize: 12.5 }}>
src\screens\TemplatesScreen.jsx:32:          <div style={{ fontSize: 12, color: "var(--dim)", marginBottom: 10 }}>patterns: {g.patterns.join(", ")}</div>
src\screens\blueprint\BlueprintWorldDetailView.jsx:44:              fontSize: 12,
src\screens\blueprint\BlueprintWorldDetailView.jsx:147:                  <span style={{ ...S.blueprintNodeMeta, color: isLocked ? "var(--warn)" : "var(--dim)", fontSize: 12 }}>
```

## 3) Font family literal audit
Command:
$ rg -n "font-family|DM Sans|DM Mono|Outfit|Source Sans|IBM Plex Mono" src/global.css src/styles.js src/screens src/components

Output:
```text
src/styles.js:2:  ui: "'DM Sans', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
src/styles.js:3:  mono: "'DM Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
src/styles.js:4:  display: "'Outfit', 'DM Sans', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
src/global.css:1:@import url("https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700&family=Outfit:wght@300;400;500;600;700;800&display=swap");
src/global.css:46:  font-family: "DM Sans", system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
src/global.css:266:  font-family: "Outfit", sans-serif;
src/global.css:317:  font-family: "DM Mono", monospace;
src/global.css:352:  font-family: "DM Mono", monospace;
src/global.css:410:  font-family: "DM Mono", monospace;
src/global.css:426:  font-family: "DM Mono", monospace;
src/screens\ReviewScreen.jsx:19:            <span style={{ color: "var(--accent)", fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>.</span>
src/screens\ReviewScreen.jsx:25:              fontFamily: "'DM Mono', monospace",
src/screens\ResultsScreen.jsx:35:            <span style={{ color: "var(--accent)", fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>.</span>
src/screens\ResultsScreen.jsx:38:          <div style={{ marginTop: 6, fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--faint)" }}>
src/screens\MenuScreen.jsx:148:        <span style={{ fontSize: 13.5, color: "var(--text)", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>{label}</span>
src/screens\MenuScreen.jsx:149:        <span style={{ fontSize: 12, color: p === 0 ? "var(--faint)" : color, fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>
src/screens\MenuScreen.jsx:180:            fontFamily: "'Outfit', sans-serif",
src/screens\MenuScreen.jsx:189:      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "var(--faint)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
src/screens\MenuScreen.jsx:217:        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--faint)" }}>local only</span>
src/screens\MenuScreen.jsx:229:        <span style={{ color: "var(--accent)", fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>.</span>
src/screens\MenuScreen.jsx:380:        <span style={{ fontSize: 12, color: "var(--dim)", fontFamily: "'DM Mono', monospace" }}>
src/screens\MenuScreen.jsx:417:              fontFamily: "'DM Sans', sans-serif",
src/screens\MenuScreen.jsx:605:          fontFamily: "'DM Mono', monospace",
src/screens\blueprint\BlueprintMapView.jsx:47:        <span style={{ fontSize: 10, color: "var(--dim)", fontFamily: "'DM Mono', monospace", textTransform: "uppercase" }}>{icon}</span>
src/screens\blueprint\BlueprintMapView.jsx:48:        <span style={{ fontSize: 15, color: "var(--text-strong)", fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>{worldId}</span>
src/screens\blueprint\BlueprintDailyView.jsx:30:          <div style={{ ...S.blueprintNodeMeta, color: "var(--warn)", fontFamily: "'DM Mono', monospace" }}>
```

## 4) Hardcoded color literal audit
Command:
$ rg -n '#[0-9a-fA-F]{3,8}|rgba\\(' src/global.css src/styles.js src/screens src/components

Output:
```text
src/styles.js:145:  pillActive: { color: ACCENT, borderColor: "rgba(16, 185, 129, 0.3)", background: "rgba(16, 185, 129, 0.1)" },
src/styles.js:151:    background: "#86efac",
src/styles.js:152:    color: "#0f1117",
src/styles.js:257:    background: "rgba(0,0,0,0.22)",
src/styles.js:275:    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
src/styles.js:284:  templateName: { fontSize: 13, color: "#e5c07b", fontWeight: 700, marginBottom: 6 },
src/styles.js:365:    color: "#0f1117",
src/styles.js:462:    border: "1px solid rgba(245, 158, 11, 0.45)",
src/styles.js:463:    color: "#0f1117",
src/styles.js:477:    background: "linear-gradient(180deg, rgba(10, 10, 18, 0), rgba(10, 10, 18, 0.94))",
src/styles.js:555:    background: "rgba(16, 185, 129, 0.08)",
src/styles.js:556:    borderColor: "rgba(16, 185, 129, 0.32)",
src/styles.js:569:    background: "rgba(148, 163, 184, 0.2)",
src/styles.js:575:    background: "linear-gradient(90deg, #34d399 0%, #22d3ee 100%)",
src/styles.js:655:    border: `1px solid rgba(16, 185, 129, 0.55)`,
src/styles.js:656:    background: "rgba(16, 185, 129, 0.16)",
src/styles.js:764:    background: "rgba(148, 163, 184, 0.04)",
src/styles.js:805:    borderColor: "rgba(245, 158, 11, 0.45)",
src/styles.js:806:    background: "rgba(245, 158, 11, 0.12)",
src/styles.js:824:    background: "rgba(6, 8, 15, 0.74)",
src/styles.js:854:    background: "rgba(0, 0, 0, 0.56)",
src/styles.js:978:  blueprintResultPill: { marginTop: 10, padding: "8px 10px", borderRadius: 8, border: `1px solid rgba(16, 185, 129, 0.45)`, background: "rgba(16, 185, 129, 0.08)", color: "var(--accent)", fontFamily: FONTS.mono, fontSize: 12.5 },
src/styles.js:1062:    background: "rgba(3, 6, 12, 0.62)",
src/styles.js:1068:    border: "1px solid rgba(16, 185, 129, 0.78)",
src/styles.js:1069:    boxShadow: "0 0 0 9999px rgba(3, 6, 12, 0.62)",
src/styles.js:1132:    border: "1px solid rgba(16, 185, 129, 0.55)",
src/styles.js:1133:    background: "rgba(16, 185, 129, 0.18)",
src/styles.js:1153:    background: "rgba(17, 17, 32, 0.96)",
src/styles.js:1154:    borderColor: "rgba(16, 185, 129, 0.44)",
src/global.css:6:  --bg-page: #0a0a12;
src/global.css:7:  --bg-app: #0a0a12;
src/global.css:8:  --surface-1: #111120;
src/global.css:9:  --surface-2: #151528;
src/global.css:10:  --border: #1a1a2a;
src/global.css:11:  --border-strong: #222238;
src/global.css:13:  --text: #f0f1f4;
src/global.css:14:  --text-strong: #f0f1f4;
src/global.css:15:  --muted: #c0c4d0;
src/global.css:16:  --dim: #8b8fa3;
src/global.css:17:  --faint: #60657b;
src/global.css:19:  --accent: #10b981;
src/global.css:20:  --accent2: #0ea5e9;
src/global.css:21:  --info: #3b82f6;
src/global.css:22:  --warn: #f59e0b;
src/global.css:23:  --danger: #ef4444;
src/global.css:25:  --shadow-soft: 0 12px 32px rgba(0, 0, 0, 0.35);
src/global.css:26:  --shadow: 0 18px 60px rgba(0, 0, 0, 0.45);
src/global.css:42:    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16, 185, 129, 0.07), transparent),
src/global.css:43:    radial-gradient(ellipse 60% 40% at 80% 100%, rgba(59, 130, 246, 0.05), transparent),
src/global.css:66:  outline: 2px solid rgba(16, 185, 129, 0.55);
src/global.css:71:  background: rgba(16, 185, 129, 0.22);
src/global.css:144:    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.42);
src/global.css:147:    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.18);
src/global.css:198:      0 0 20px rgba(16, 185, 129, 0.15),
src/global.css:199:      0 0 60px rgba(16, 185, 129, 0.05);
src/global.css:203:      0 0 25px rgba(16, 185, 129, 0.25),
src/global.css:204:      0 0 80px rgba(16, 185, 129, 0.1);
src/global.css:219:    background: rgba(240, 240, 248, 0.04) !important;
src/global.css:223:    background: var(--hover-accent, rgba(240, 240, 248, 0.04)) !important;
src/global.css:241:  background: rgba(240, 240, 248, 0.14);
src/global.css:295:  border-color: rgba(16, 185, 129, 0.45);
src/global.css:296:  background: rgba(16, 185, 129, 0.14);
src/global.css:297:  box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.18);
src/global.css:312:  background: var(--mode-accent-soft, rgba(16, 185, 129, 0.12));
src/global.css:331:  border: 1px solid rgba(245, 158, 11, 0.45);
src/global.css:333:  background: rgba(245, 158, 11, 0.08);
src/global.css:346:  border: 1px solid rgba(245, 158, 11, 0.45);
src/global.css:348:  background: rgba(245, 158, 11, 0.14);
src/screens\PlayScreen.jsx:49:          {streak > 1 && <span style={{ ...S.statItem, color: "#e5c07b", animation: "pulse 1s ease-in-out infinite" }}>?? {streak}</span>}
src/screens\PlayScreen.jsx:97:              bg = "rgba(16, 185, 129, 0.15)";
src/screens\PlayScreen.jsx:101:              bg = "rgba(239, 68, 68, 0.12)";
src/screens\MenuScreen.jsx:16:  if (p === 0) return "#4a4a5a";
src/screens\MenuScreen.jsx:17:  if (p < 50) return "#f59e0b";
src/screens\MenuScreen.jsx:18:  if (p < 80) return "#3b82f6";
src/screens\MenuScreen.jsx:19:  return "#10b981";
src/screens\MenuScreen.jsx:28:    accentSoft: "rgba(16, 185, 129, 0.13)",
src/screens\MenuScreen.jsx:29:    accentRing: "rgba(16, 185, 129, 0.48)",
src/screens\MenuScreen.jsx:30:    accentGlow: "rgba(16, 185, 129, 0.22)",
src/screens\MenuScreen.jsx:37:    accentSoft: "rgba(59, 130, 246, 0.14)",
src/screens\MenuScreen.jsx:38:    accentRing: "rgba(59, 130, 246, 0.5)",
src/screens\MenuScreen.jsx:39:    accentGlow: "rgba(59, 130, 246, 0.2)",
src/screens\MenuScreen.jsx:46:    accentSoft: "rgba(245, 158, 11, 0.16)",
src/screens\MenuScreen.jsx:47:    accentRing: "rgba(245, 158, 11, 0.52)",
src/screens\MenuScreen.jsx:48:    accentGlow: "rgba(245, 158, 11, 0.22)",
src/screens\MenuScreen.jsx:59:      accentSoft: "rgba(16, 185, 129, 0.13)",
src/screens\MenuScreen.jsx:60:      accentRing: "rgba(16, 185, 129, 0.48)",
src/screens\MenuScreen.jsx:61:      accentGlow: "rgba(16, 185, 129, 0.22)",
src/screens\MenuScreen.jsx:249:        <div style={{ ...S.syncBanner, borderColor: "rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.06)", animation: "fadeSlideIn 0.5s ease 0.08s both" }}>
src/screens\MenuScreen.jsx:540:            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
src/screens\blueprint\BlueprintExecution.jsx:18:    setup: "#818CF8",
src/screens\blueprint\BlueprintExecution.jsx:19:    update: "#60A5FA",
src/screens\blueprint\BlueprintExecution.jsx:20:    check: "#FBBF24",
src/screens\blueprint\BlueprintExecution.jsx:21:    return: "#F472B6",
src/screens\blueprint\BlueprintExecution.jsx:22:    loop: "#34D399",
src/screens\blueprint\BlueprintExecution.jsx:23:    error: "#EF4444",
src/screens\blueprint\BlueprintExecution.jsx:39:              <span style={{ ...S.phasePill, background: `${phaseColor[current.phase] || "#64748B"}22`, color: phaseColor[current.phase] || "var(--dim)" }}>
src/screens\blueprint\BlueprintExecution.jsx:65:                          background: hasWindow ? "rgba(16, 185, 129, 0.14)" : "var(--surface-1)",
src/screens\blueprint\BlueprintExecution.jsx:66:                          borderColor: isLeft ? "#818CF8" : isRight ? "#F472B6" : hasWindow ? "rgba(16, 185, 129, 0.45)" : "var(--border)",
src/screens\blueprint\BlueprintExecution.jsx:144:        <div style={{ ...S.feedbackBox, borderColor: "rgba(245, 158, 11, 0.4)", background: "rgba(245, 158, 11, 0.08)" }}>
src/screens\blueprint\BlueprintExecution.jsx:158:          style={{ ...S.feedbackBox, borderColor: "rgba(16, 185, 129, 0.45)", background: "rgba(16, 185, 129, 0.08)" }}
src/screens\blueprint\viewShared.js:6:    ring: "rgba(16, 185, 129, 0.5)",
src/screens\blueprint\viewShared.js:7:    soft: "rgba(16, 185, 129, 0.12)",
src/screens\blueprint\viewShared.js:8:    gradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(14, 165, 233, 0.88))",
src/screens\blueprint\viewShared.js:12:    ring: "rgba(59, 130, 246, 0.5)",
src/screens\blueprint\viewShared.js:13:    soft: "rgba(59, 130, 246, 0.12)",
src/screens\blueprint\viewShared.js:14:    gradient: "linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(16, 185, 129, 0.88))",
src/screens\blueprint\viewShared.js:18:    ring: "rgba(245, 158, 11, 0.52)",
src/screens\blueprint\viewShared.js:19:    soft: "rgba(245, 158, 11, 0.14)",
src/screens\blueprint\viewShared.js:20:    gradient: "linear-gradient(135deg, rgba(245, 158, 11, 0.95), rgba(239, 68, 68, 0.88))",
src/screens\blueprint\viewShared.js:24:    ring: "rgba(239, 68, 68, 0.52)",
src/screens\blueprint\viewShared.js:25:    soft: "rgba(239, 68, 68, 0.13)",
src/screens\blueprint\viewShared.js:26:    gradient: "linear-gradient(135deg, rgba(239, 68, 68, 0.94), rgba(245, 158, 11, 0.85))",
src/screens\blueprint\BlueprintDailyView.jsx:68:            background: "linear-gradient(135deg, rgba(245, 158, 11, 0.95), rgba(234, 179, 8, 0.92))",
src/screens\blueprint\BlueprintMapView.jsx:121:            <span style={{ ...S.blueprintNodeBadge, color: "var(--warn)", borderColor: "rgba(245, 158, 11, 0.45)" }}>D</span>
src/screens\blueprint\BlueprintMapView.jsx:122:            <span style={{ ...S.diffBadge, color: "var(--warn)", borderColor: "rgba(245, 158, 11, 0.45)" }}>Daily Challenge</span>
src/screens\blueprint\BlueprintMapView.jsx:138:          <span style={{ ...S.blueprintNodeTitle, color: "#0f1117" }}>Continue</span>
src/screens\blueprint\BlueprintMapView.jsx:139:          <span style={{ ...S.blueprintNodeMeta, color: "rgba(15, 17, 23, 0.82)", fontSize: 12.5 }}>
src/screens\blueprint\BlueprintGame.jsx:330:                        background: isSelected ? "rgba(16, 185, 129, 0.11)" : "var(--surface-1)",
src/screens\blueprint\BlueprintGame.jsx:419:                            ? "rgba(100, 116, 139, 0.1)"
src/screens\blueprint\shared.js:2:  Tutorial: "#10B981",
src/screens\blueprint\shared.js:3:  Practice: "#F59E0B",
src/screens\blueprint\shared.js:4:  Boss: "#EF4444",
src/screens\blueprint\shared.js:5:  Easy: "#10B981",
src/screens\blueprint\shared.js:6:  Medium: "#F59E0B",
src/screens\blueprint\shared.js:7:  Hard: "#EF4444",
src/screens\blueprint\shared.js:25:  if (challenge?.isBossRush) return "#EF4444";
src/screens\blueprint\shared.js:26:  if (challenge?.tier === 1) return "#10B981";
src/screens\blueprint\shared.js:27:  if (challenge?.tier === 2) return "#F59E0B";
src/screens\blueprint\shared.js:28:  return "#EF4444";
```

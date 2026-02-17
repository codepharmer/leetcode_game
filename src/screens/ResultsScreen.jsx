import { GAME_TYPES, PATTERN_COLORS } from "../lib/constants";
import { S } from "../styles";

import { AccuracyDot } from "../components/AccuracyDot";
import { CodeBlock } from "../components/CodeBlock";
import { TemplateViewer } from "../components/TemplateViewer";

export function ResultsScreen({
  user,
  pct,
  score,
  total,
  bestStreak,
  stats,
  lifetimePct,
  results,
  expandedResult,
  setExpandedResult,
  startGame,
  goMenu,
  history,
  gameType,
  showExploreActions = false,
  onDismissExploreActions = () => {},
  onExploreBrowse = () => {},
  onExploreTemplates = () => {},
}) {
  return (
    <div style={S.resultsContainer}>
      <div data-tutorial-anchor="results-summary" style={S.resultsHeader}>
        <div style={{ textAlign: "center" }}>
          <div style={S.logo}>
            <span style={S.logoAccent}>$</span>
            <span style={{ color: "var(--text-strong)" }}>pattern</span>
            <span style={{ color: "var(--accent)", fontFamily: "var(--font-code)", fontWeight: 500 }}>.</span>
            <span style={S.logoDim}>match</span>
          </div>
          <div style={{ marginTop: 6, fontFamily: "var(--font-code)", fontSize: 13, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--faint)" }}>
            results
          </div>
        </div>
        <div style={S.scoreCircle}>
          <span style={S.scoreNum}>{pct}</span>
          <span style={S.scorePct}>%</span>
        </div>
        <p style={S.scoreSummary}>
          {score}/{total} correct best streak: {bestStreak}
        </p>
        <div style={S.lifetimeBar}>
          <span style={S.lifetimeLabel}>
            lifetime: {stats.gamesPlayed} games {lifetimePct}% accuracy {stats.bestStreak} best streak
          </span>
        </div>
      </div>

      {showExploreActions ? (
        <div style={{ ...S.card, width: "100%", maxWidth: 680, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 14, color: "var(--text-strong)", fontWeight: 700 }}>Explore more</span>
            <button className="tap-target" onClick={onDismissExploreActions} style={S.resetBtn}>
              dismiss
            </button>
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>Study grouped patterns or browse full templates before your next round.</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="tap-target" onClick={onExploreBrowse} style={S.browseBtn}>
              Browse Patterns
            </button>
            <button className="tap-target" onClick={onExploreTemplates} style={S.browseBtn}>
              View Templates
            </button>
          </div>
        </div>
      ) : null}

      {!user && (
        <div role="status" style={{ ...S.syncBanner, maxWidth: 640 }}>
          <div style={S.syncBannerTitle}>Want to keep these results?</div>
          <div style={S.syncBannerText}>Sign in to sync your progress across devices.</div>
          <div style={S.syncBannerNote}>Signed-out progress is saved only in this browser.</div>
        </div>
      )}

      <div style={S.resultsList}>
        {results.map((r, i) => {
          const item = r.item || r.question;
          const isCorrect = !!r.correct;
          if (!item) return null;

          return (
            <div key={i} style={{ ...S.resultRowOuter, animation: `slideIn 0.2s ease-out ${i * 0.03}s both` }}>
              <button
                type="button"
                className="hover-row tap-target"
                aria-expanded={!!expandedResult[i]}
                onClick={() => setExpandedResult((p) => ({ ...p, [i]: !p[i] }))}
                style={{
                  ...S.resultRow,
                  width: "100%",
                  border: "none",
                  textAlign: "left",
                  background: "transparent",
                }}
              >
                <span
                  style={{
                    ...S.resultOutcome,
                    color: isCorrect ? "var(--accent)" : "var(--danger)",
                    borderColor: isCorrect ? "var(--accent-ring-soft)" : "var(--error-ring-soft)",
                    background: isCorrect ? "var(--accent-fill-soft)" : "var(--error-fill-soft)",
                  }}
                >
                  {isCorrect ? "correct" : "incorrect"}
                </span>
                <span style={S.resultName}>{item.title || item.name || item.id}</span>
                <AccuracyDot qId={item.id} history={history} />
                <span style={{ ...S.resultPattern, color: PATTERN_COLORS[item.pattern] || "var(--text)" }}>{item.pattern}</span>
                {!r.correct && <span style={S.resultWrong}>(you: {r.chosen})</span>}
                <span style={S.chevron}>{expandedResult[i] ? "[-]" : "[+]"}</span>
              </button>
              {expandedResult[i] && (
                <div style={{ padding: "0 12px 12px 40px", animation: "descReveal 0.2s ease-out" }}>
                  {item.promptKind === "code" ? (
                    <CodeBlock code={item.code} />
                  ) : (
                    <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--dim)", marginBottom: 10 }}>{item.desc}</div>
                  )}
                  {gameType !== GAME_TYPES.TEMPLATE_TO_PATTERN && (
                    <TemplateViewer pattern={item.templatePattern || item.pattern} compact />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={S.resultsActions}>
        <button className="tap-target" onClick={startGame} style={S.startBtn}>
          play again{" "}
        </button>
        <button className="tap-target" onClick={goMenu} style={S.browseBtn}>
          menu
        </button>
      </div>
    </div>
  );
}

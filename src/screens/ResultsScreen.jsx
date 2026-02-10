import { PATTERN_COLORS } from "../lib/constants";
import { S } from "../styles";

import { AccuracyDot } from "../components/AccuracyDot";
import { TemplateViewer } from "../components/TemplateViewer";

export function ResultsScreen({
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
}) {
  return (
    <div style={S.resultsContainer}>
      <div style={S.resultsHeader}>
        <div style={S.logo}>
          <span style={S.logoAccent}>$</span> results<span style={S.logoCursor}></span>
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

      <div style={S.resultsList}>
        {results.map((r, i) => (
          <div key={i} style={{ ...S.resultRowOuter, animation: `slideIn 0.2s ease-out ${i * 0.03}s both` }}>
            <div className="hover-row" onClick={() => setExpandedResult((p) => ({ ...p, [i]: !p[i] }))} style={S.resultRow}>
              <span style={{ ...S.resultIcon, color: r.correct ? "#98c379" : "#e06c75" }}>{r.correct ? "" : ""}</span>
              <span style={S.resultName}>{r.question.name}</span>
              <AccuracyDot qId={r.question.id} history={history} />
              <span style={{ ...S.resultPattern, color: PATTERN_COLORS[r.question.pattern] || "#a9b1d6" }}>{r.question.pattern}</span>
              {!r.correct && <span style={S.resultWrong}>(you: {r.chosen})</span>}
              <span style={S.chevron}>{expandedResult[i] ? "" : ""}</span>
            </div>
            {expandedResult[i] && (
              <div style={{ padding: "0 12px 12px 40px", animation: "descReveal 0.2s ease-out" }}>
                <div style={{ fontSize: 12, lineHeight: 1.55, color: "#565f89", marginBottom: 8 }}>{r.question.desc}</div>
                <TemplateViewer pattern={r.question.pattern} compact />
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={S.resultsActions}>
        <button onClick={startGame} style={S.startBtn}>
          play again{" "}
        </button>
        <button onClick={goMenu} style={S.browseBtn}>
          menu
        </button>
      </div>
    </div>
  );
}

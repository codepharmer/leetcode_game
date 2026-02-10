import { DIFF_COLORS } from "../lib/constants";
import { S } from "../styles";

import { AuthCard } from "../components/AuthCard";

export function MenuScreen({
  stats,
  lifetimePct,
  masteredCount,
  weakSpots,
  history,
  user,
  authError,
  onGoogleSuccess,
  onGoogleError,
  onSignOut,
  filterDifficulty,
  setFilterDifficulty,
  totalQuestions,
  setTotalQuestions,
  startGame,
  goBrowse,
  goTemplates,
  showResetConfirm,
  setShowResetConfirm,
  resetAllData,
}) {
  return (
    <div style={S.menuContainer}>
      <div style={S.logo}>
        <span style={S.logoAccent}>$</span> pattern<span style={S.logoDim}>.match</span>
        <span style={S.logoCursor}></span>
      </div>
      <p style={S.subtitle}>Map Blind 75 questions to their solution patterns</p>

      <AuthCard user={user} authError={authError} onGoogleSuccess={onGoogleSuccess} onGoogleError={onGoogleError} onSignOut={onSignOut} />

      {stats.gamesPlayed > 0 && (
        <div style={S.statsCard}>
          <div style={S.statsRow}>
            <div style={S.statBlock}>
              <span style={S.statValue}>{stats.gamesPlayed}</span>
              <span style={S.statLabel2}>games</span>
            </div>
            <div style={S.statBlock}>
              <span style={S.statValue}>
                {lifetimePct}
                <span style={{ fontSize: 14, color: "#565f89" }}>%</span>
              </span>
              <span style={S.statLabel2}>accuracy</span>
            </div>
            <div style={S.statBlock}>
              <span style={S.statValue}>{stats.bestStreak}</span>
              <span style={S.statLabel2}>best streak</span>
            </div>
            <div style={S.statBlock}>
              <span style={S.statValue}>
                {masteredCount}
                <span style={{ fontSize: 14, color: "#565f89" }}>/87</span>
              </span>
              <span style={S.statLabel2}>mastered</span>
            </div>
          </div>

          {weakSpots.length > 0 && (
            <div style={S.weakSection}>
              <span style={S.weakLabel}>needs work</span>
              <div style={S.weakList}>
                {weakSpots.slice(0, 5).map((q) => {
                  const h = history[q.id];
                  const wp = Math.round((h.correct / (h.correct + h.wrong)) * 100);
                  return (
                    <span key={q.id} style={S.weakItem}>
                      <span style={{ color: "#e06c75" }}>{wp}%</span> {q.name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={S.configCard}>
        <div style={S.configRow}>
          <span style={S.configLabel}>difficulty</span>
          <div style={S.pillGroup}>
            {["All", "Easy", "Medium", "Hard"].map((d) => (
              <button
                key={d}
                onClick={() => setFilterDifficulty(d)}
                style={{
                  ...S.pill,
                  ...(filterDifficulty === d ? S.pillActive : {}),
                  color: d !== "All" && filterDifficulty === d ? DIFF_COLORS[d] : undefined,
                  borderColor: d !== "All" && filterDifficulty === d ? DIFF_COLORS[d] + "60" : undefined,
                }}
              >
                {d.toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div style={S.configRow}>
          <span style={S.configLabel}>questions</span>
          <div style={S.pillGroup}>
            {[10, 20, 40, 87].map((n) => (
              <button key={n} onClick={() => setTotalQuestions(n)} style={{ ...S.pill, ...(totalQuestions === n ? S.pillActive : {}) }}>
                {n === 87 ? "all" : n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button onClick={startGame} style={S.startBtn}>
        start round{" "}
      </button>

      <div style={S.menuBtnRow}>
        <button onClick={goBrowse} style={S.browseBtn}>
          browse patterns
        </button>
        <button onClick={goTemplates} style={S.browseBtn}>
          view templates
        </button>
      </div>

      {stats.gamesPlayed > 0 && (
        <div style={{ marginTop: 4 }}>
          {!showResetConfirm ? (
            <button onClick={() => setShowResetConfirm(true)} style={S.resetBtn}>
              reset all data
            </button>
          ) : (
            <div style={S.resetConfirm}>
              <span style={{ fontSize: 12, color: "#e06c75" }}>erase all progress?</span>
              <button onClick={resetAllData} style={{ ...S.resetBtn, color: "#e06c75", borderColor: "#e06c7540" }}>
                yes, reset
              </button>
              <button onClick={() => setShowResetConfirm(false)} style={S.resetBtn}>
                cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";

import { S } from "../styles";

import { AuthCard } from "../components/AuthCard";

function clamp(n, a, b) {
  const nn = Number(n);
  if (!Number.isFinite(nn)) return a;
  return Math.min(b, Math.max(a, nn));
}

function getProgressColorHex(percentage) {
  const p = clamp(percentage, 0, 100);
  if (p === 0) return "#4a4a5a";
  if (p < 50) return "#f59e0b";
  if (p < 80) return "#3b82f6";
  return "#10b981";
}

function CircularProgress({ percentage, size = 48, strokeWidth = 3.5 }) {
  const p = clamp(percentage, 0, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (p / 100) * circumference;
  const color = getProgressColorHex(p);

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-2)" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
    </svg>
  );
}

function ProgressBar({ percentage, label, delay = 0 }) {
  const p = clamp(percentage, 0, 100);
  const color = getProgressColorHex(p);
  const bgColor = p === 0 ? "var(--surface-2)" : `${color}15`;

  return (
    <div style={{ animation: `fadeSlideIn 0.5s ease ${delay}s both` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 13.5, color: "var(--text)", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 12, color: p === 0 ? "var(--faint)" : color, fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>
          {p === 0 ? "not started" : `${p}%`}
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: bgColor, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${p}%`,
            borderRadius: 999,
            background: p === 0 ? "transparent" : color,
            transition: "width 1s ease",
            animation: p > 0 ? `barGrow 1s ease ${delay + 0.2}s both` : "none",
          }}
        />
      </div>
    </div>
  );
}

function StatRing({ label, value, percentage, delay = 0 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, animation: `fadeSlideIn 0.5s ease ${delay}s both` }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress percentage={percentage} size={48} />
        <span style={{ position: "absolute", fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 13, color: "var(--text-strong)" }}>{value}</span>
      </div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "var(--faint)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </div>
    </div>
  );
}

export function MenuScreen({
  stats,
  lifetimePct,
  masteredCount,
  totalAvailableQuestions,
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
  const allCount = Number.isFinite(totalAvailableQuestions) ? totalAvailableQuestions : 0;
  const questionCountOptions = Array.from(new Set([10, 20, 40, allCount].filter((n) => n > 0)));
  const [showRoundSettings, setShowRoundSettings] = useState(false);

  const displayName = user?.name || user?.email || "Guest";
  const avatarLetter = (displayName || "G").trim().slice(0, 1).toUpperCase();

  const diffLabel = filterDifficulty === "All" ? "all difficulties" : `${String(filterDifficulty).toLowerCase()} problems`;
  const qLabel = totalQuestions === allCount ? "all available" : totalQuestions;

  const needsWork = weakSpots.slice(0, 5).map((q) => {
    const h = history[q.id];
    const total = (h?.correct || 0) + (h?.wrong || 0);
    const pct = total > 0 ? Math.round((h.correct / total) * 100) : 0;
    return { name: q.name, progress: pct };
  });

  return (
    <div style={S.menuContainer}>
      {/* Top bar */}
      <div style={S.menuTopbar}>
        <div style={S.menuUserInfo}>
          {user?.picture ? (
            <img
              src={user.picture}
              alt=""
              referrerPolicy="no-referrer"
              style={{ width: 32, height: 32, borderRadius: 999, border: "1px solid var(--border)", flexShrink: 0 }}
            />
          ) : (
            <div style={S.menuAvatar}>{avatarLetter}</div>
          )}
          <span style={S.menuUsername}>{displayName}</span>
        </div>
        {user ? (
          <button onClick={onSignOut} style={S.menuSignout}>
            sign out
          </button>
        ) : (
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--faint)" }}>local only</span>
        )}
      </div>

      {/* Brand */}
      <div style={S.brand}>
        <div style={S.logo}>
          <span style={S.logoAccent}>$</span>
          <span style={{ color: "var(--text-strong)" }}>pattern</span>
          <span style={{ color: "var(--accent)", fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>.</span>
          <span style={S.logoDim}>match</span>
        </div>
        <div style={S.subtitle}>Map Blind 75 questions to their solution patterns</div>
      </div>

      <div style={S.content}>
        {!user && (
          <div style={{ ...S.syncBanner, animation: "fadeSlideIn 0.5s ease 0.05s both" }}>
            <div style={S.syncBannerTitle}>Save your results</div>
            <div style={S.syncBannerText}>Sign in to sync your progress across devices.</div>
            <div style={S.syncBannerNote}>If you stay signed out, results are saved only in this browser.</div>
          </div>
        )}

        {authError && (
          <div style={{ ...S.syncBanner, borderColor: "rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.06)", animation: "fadeSlideIn 0.5s ease 0.08s both" }}>
            <div style={{ ...S.syncBannerTitle, color: "var(--danger)" }}>Cloud sync</div>
            <div style={{ ...S.syncBannerText, color: "var(--muted)" }}>{authError}</div>
          </div>
        )}

        {!user && (
          <div style={{ animation: "fadeSlideIn 0.5s ease 0.1s both" }}>
            <AuthCard user={user} authError={null} onGoogleSuccess={onGoogleSuccess} onGoogleError={onGoogleError} onSignOut={onSignOut} />
          </div>
        )}

        {/* Stats card */}
        <div style={{ ...S.card, animation: "fadeSlideIn 0.5s ease 0.15s both" }}>
          <div style={S.sectionLabel}>your progress</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <StatRing label="games" value={stats.gamesPlayed} percentage={(stats.gamesPlayed / 20) * 100} delay={0.15} />
            <StatRing label="accuracy" value={lifetimePct} percentage={lifetimePct} delay={0.2} />
            <StatRing label="best streak" value={stats.bestStreak} percentage={(stats.bestStreak / 20) * 100} delay={0.25} />
            <StatRing
              label={
                <span>
                  mastered <span style={{ color: "var(--faint)" }}>/ {allCount}</span>
                </span>
              }
              value={masteredCount}
              percentage={allCount > 0 ? (masteredCount / allCount) * 100 : 0}
              delay={0.3}
            />
          </div>
        </div>

        {/* Round settings */}
        <div style={{ ...S.card, padding: 0, overflow: "hidden", animation: "fadeSlideIn 0.5s ease 0.2s both" }}>
          <button
            onClick={() => setShowRoundSettings((p) => !p)}
            style={{
              width: "100%",
              background: "none",
              border: "none",
              textAlign: "left",
              padding: "18px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
            }}
          >
            <span style={{ ...S.sectionLabel, marginBottom: 0 }}>round settings</span>
            <span style={{ fontSize: 12, color: "var(--dim)", fontFamily: "'DM Mono', monospace" }}>{showRoundSettings ? "hide" : "show"}</span>
          </button>

          {showRoundSettings && (
            <div style={{ padding: "0 24px 22px", borderTop: "1px solid var(--border)", animation: "descReveal 0.2s ease-out" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={S.configLabel}>Difficulty</span>
                  <div style={S.pillGroup}>
                    {["All", "Easy", "Medium", "Hard"].map((d) => (
                      <button key={d} onClick={() => setFilterDifficulty(d)} style={{ ...S.pill, ...(filterDifficulty === d ? S.pillActive : {}) }}>
                        {d.toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={S.configLabel}>Questions</span>
                  <div style={S.pillGroup}>
                    {questionCountOptions.map((n) => (
                      <button key={n} onClick={() => setTotalQuestions(n)} style={{ ...S.pill, ...(totalQuestions === n ? S.pillActive : {}) }}>
                        {n === allCount ? "all" : n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  color: "var(--faint)",
                  marginTop: 16,
                  paddingTop: 14,
                  borderTop: "1px solid var(--border)",
                  lineHeight: 1.5,
                }}
              >
                Practice <span style={{ color: "var(--muted)" }}>{qLabel} questions</span> across <span style={{ color: "var(--muted)" }}>{diffLabel}</span>
              </div>
            </div>
          )}
        </div>

        {/* Start button */}
        <div style={{ animation: "fadeSlideIn 0.5s ease 0.25s both" }}>
          <button onClick={startGame} style={{ ...S.startBtn, width: "100%", animation: "pulseGlow 3s ease-in-out infinite" }}>
            <span
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
                backgroundSize: "200% 100%",
                animation: "shimmer 3s ease-in-out infinite",
                pointerEvents: "none",
              }}
            />
            <span style={{ position: "relative" }}>Start Round</span>
          </button>
        </div>

        {/* Needs work */}
        <div style={{ ...S.card, animation: "fadeSlideIn 0.5s ease 0.25s both" }}>
          <div style={S.sectionLabel}>needs work</div>
          {needsWork.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {needsWork.map((item, i) => (
                <ProgressBar key={item.name} label={item.name} percentage={item.progress} delay={0.3 + i * 0.08} />
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: "var(--dim)", lineHeight: 1.5 }}>No weak spots yet. Play a few rounds to generate data.</div>
          )}
        </div>

        {/* Secondary actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", animation: "fadeSlideIn 0.5s ease 0.5s both" }}>
          <button onClick={goBrowse} style={S.browseBtn}>
            browse patterns
          </button>
          <button onClick={goTemplates} style={S.browseBtn}>
            view templates
          </button>
        </div>

        {/* Danger zone */}
        {stats.gamesPlayed > 0 && (
          <div style={{ textAlign: "center", marginTop: 8, animation: "fadeSlideIn 0.5s ease 0.55s both" }}>
            {!showResetConfirm ? (
              <button onClick={() => setShowResetConfirm(true)} style={S.resetBtn}>
                reset all data
              </button>
            ) : (
              <div style={{ ...S.resetConfirm, justifyContent: "center" }}>
                <span style={{ fontSize: 12, color: "var(--danger)" }}>erase all progress?</span>
                <button onClick={resetAllData} style={{ ...S.resetBtn, color: "var(--danger)" }}>
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
    </div>
  );
}

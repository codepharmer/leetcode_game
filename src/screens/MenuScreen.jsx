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

function MenuTopBar({ user, displayName, avatarLetter, onSignOut }) {
  return (
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
  );
}

function MenuBrand({ menuSubtitle }) {
  return (
    <div style={S.brand}>
      <div style={S.logo}>
        <span style={S.logoAccent}>$</span>
        <span style={{ color: "var(--text-strong)" }}>pattern</span>
        <span style={{ color: "var(--accent)", fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>.</span>
        <span style={S.logoDim}>match</span>
      </div>
      <div style={S.subtitle}>{menuSubtitle}</div>
    </div>
  );
}

function SyncAndAuthSection({ user, authError, onGoogleSuccess, onGoogleError, onSignOut }) {
  return (
    <>
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
    </>
  );
}

function ProgressSection({ stats, lifetimePct, masteredCount, allCount }) {
  return (
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
  );
}

function RoundSettingsSection({
  showRoundSettings,
  setShowRoundSettings,
  selectedModeLabel,
  gameTypeOptions,
  gameType,
  setGameType,
  supportsDifficultyFilter,
  filterDifficulty,
  setFilterDifficulty,
  supportsQuestionCount,
  noun,
  allCount,
  questionCountOptions,
  totalQuestions,
  setTotalQuestions,
  settingsSummary,
}) {
  return (
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
        <span style={{ fontSize: 12, color: "var(--dim)", fontFamily: "'DM Mono', monospace" }}>
          {selectedModeLabel} | {showRoundSettings ? "hide" : "show"}
        </span>
      </button>

      {showRoundSettings && (
        <div style={{ padding: "0 24px 22px", borderTop: "1px solid var(--border)", animation: "descReveal 0.2s ease-out" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={S.configLabel}>Mode</span>
              <div style={S.pillGroup}>
                {(gameTypeOptions || []).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setGameType(opt.value)}
                    style={{ ...S.pill, ...(gameType === opt.value ? S.pillActive : {}) }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {supportsDifficultyFilter && (
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
            )}

            {supportsQuestionCount && (
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={S.configLabel}>{noun}</span>
                <div style={S.pillGroup}>
                  {questionCountOptions.map((n) => (
                    <button key={n} onClick={() => setTotalQuestions(n)} style={{ ...S.pill, ...(totalQuestions === n ? S.pillActive : {}) }}>
                      {n === allCount ? "all" : n}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
            {settingsSummary}
          </div>
        </div>
      )}
    </div>
  );
}

function StartSection({ startGame, startLabel }) {
  return (
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
        <span style={{ position: "relative" }}>{startLabel}</span>
      </button>
    </div>
  );
}

function NeedsWorkSection({ needsWork }) {
  return (
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
  );
}

function SecondaryActions({ supportsBrowse, supportsTemplates, goBrowse, goTemplates }) {
  if (!supportsBrowse && !supportsTemplates) return null;

  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center", animation: "fadeSlideIn 0.5s ease 0.5s both" }}>
      {supportsBrowse && (
        <button onClick={goBrowse} style={S.browseBtn}>
          browse patterns
        </button>
      )}
      {supportsTemplates && (
        <button onClick={goTemplates} style={S.browseBtn}>
          view templates
        </button>
      )}
    </div>
  );
}

function DangerZone({ stats, showResetConfirm, setShowResetConfirm, resetAllData }) {
  if (stats.gamesPlayed <= 0) return null;

  return (
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
  );
}

export function MenuScreen({
  gameType,
  setGameType,
  gameTypeOptions,
  menuSubtitle,
  roundNoun,
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
  supportsBrowse = true,
  supportsTemplates = true,
  supportsDifficultyFilter = true,
  supportsQuestionCount = true,
  showResetConfirm,
  setShowResetConfirm,
  resetAllData,
  routeNotice,
}) {
  const [showRoundSettings, setShowRoundSettings] = useState(false);

  const allCount = Number.isFinite(totalAvailableQuestions) ? totalAvailableQuestions : 0;
  const questionCountOptions = Array.from(new Set([10, 20, 40, allCount].filter((n) => n > 0)));

  const displayName = user?.name || user?.email || "Guest";
  const avatarLetter = (displayName || "G").trim().slice(0, 1).toUpperCase();

  const noun = roundNoun || "questions";
  const diffLabel = filterDifficulty === "All" ? "all difficulties" : `${String(filterDifficulty).toLowerCase()} ${noun}`;
  const qLabel = totalQuestions === allCount ? "all available" : totalQuestions;
  const selectedModeLabel = (gameTypeOptions || []).find((opt) => opt.value === gameType)?.label || "mode";
  const startLabel = supportsDifficultyFilter || supportsQuestionCount ? "Start Round" : "Open Blueprint Builder";

  const needsWork = weakSpots.slice(0, 5).map((q) => {
    const h = history[q.id];
    const total = (h?.correct || 0) + (h?.wrong || 0);
    const pct = total > 0 ? Math.round((h.correct / total) * 100) : 0;
    return { name: q.title || q.name || q.id, progress: pct };
  });

  const settingsSummary = supportsDifficultyFilter || supportsQuestionCount
    ? (
      <>
        Practice <span style={{ color: "var(--muted)" }}>{qLabel} {noun}</span> across <span style={{ color: "var(--muted)" }}>{diffLabel}</span>
      </>
    )
    : (
      <>
        This mode tracks completion per level with star ratings based on attempt count.
      </>
    );

  return (
    <div style={S.menuContainer}>
      <MenuTopBar user={user} displayName={displayName} avatarLetter={avatarLetter} onSignOut={onSignOut} />
      <MenuBrand menuSubtitle={menuSubtitle} />
      {routeNotice ? (
        <div style={{ ...S.syncBanner, animation: "fadeSlideIn 0.4s ease 0.02s both", maxWidth: 700 }}>
          <div style={S.syncBannerText}>{routeNotice}</div>
        </div>
      ) : null}

      <div style={S.content}>
        <SyncAndAuthSection
          user={user}
          authError={authError}
          onGoogleSuccess={onGoogleSuccess}
          onGoogleError={onGoogleError}
          onSignOut={onSignOut}
        />

        <ProgressSection stats={stats} lifetimePct={lifetimePct} masteredCount={masteredCount} allCount={allCount} />

        <RoundSettingsSection
          showRoundSettings={showRoundSettings}
          setShowRoundSettings={setShowRoundSettings}
          selectedModeLabel={selectedModeLabel}
          gameTypeOptions={gameTypeOptions}
          gameType={gameType}
          setGameType={setGameType}
          supportsDifficultyFilter={supportsDifficultyFilter}
          filterDifficulty={filterDifficulty}
          setFilterDifficulty={setFilterDifficulty}
          supportsQuestionCount={supportsQuestionCount}
          noun={noun}
          allCount={allCount}
          questionCountOptions={questionCountOptions}
          totalQuestions={totalQuestions}
          setTotalQuestions={setTotalQuestions}
          settingsSummary={settingsSummary}
        />

        <StartSection startGame={startGame} startLabel={startLabel} />

        <NeedsWorkSection needsWork={needsWork} />

        <SecondaryActions
          supportsBrowse={supportsBrowse}
          supportsTemplates={supportsTemplates}
          goBrowse={goBrowse}
          goTemplates={goTemplates}
        />

        <DangerZone
          stats={stats}
          showResetConfirm={showResetConfirm}
          setShowResetConfirm={setShowResetConfirm}
          resetAllData={resetAllData}
        />
      </div>
    </div>
  );
}

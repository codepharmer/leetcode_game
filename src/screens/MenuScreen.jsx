import { useState } from "react";

import { GAME_TYPES } from "../lib/constants";
import { S } from "../styles";

import { AuthCard } from "../components/AuthCard";

function clamp(n, a, b) {
  const nn = Number(n);
  if (!Number.isFinite(nn)) return a;
  return Math.min(b, Math.max(a, nn));
}

function getProgressColorHex(percentage) {
  const p = clamp(percentage, 0, 100);
  if (p === 0) return "var(--quiet)";
  if (p < 50) return "var(--warn)";
  if (p < 80) return "var(--info)";
  return "var(--accent)";
}

const MODE_VISUALS = {
  [GAME_TYPES.QUESTION_TO_PATTERN]: {
    title: "Match",
    progressBadge: "Question",
    description: "Match questions to their solution pattern",
    accent: "var(--accent)",
    accentSoft: "var(--accent-fill-soft)",
    accentRing: "var(--accent-ring-mid)",
    accentGlow: "var(--accent-fill-strong)",
  },
  [GAME_TYPES.TEMPLATE_TO_PATTERN]: {
    title: "Template",
    progressBadge: "Template",
    description: "Identify patterns from code templates",
    accent: "var(--info)",
    accentSoft: "var(--info-fill-soft)",
    accentRing: "var(--info-ring-soft)",
    accentGlow: "var(--info-fill-mid)",
  },
  [GAME_TYPES.BLUEPRINT_BUILDER]: {
    title: "Build",
    progressBadge: "Blueprint",
    description: "Build solution blueprints from scratch",
    accent: "var(--warn)",
    accentSoft: "var(--warn-fill-mid)",
    accentRing: "var(--warn-ring-soft)",
    accentGlow: "var(--warn-fill-mid)",
  },
};

function getModeVisual(gameType, fallbackLabel = "Mode") {
  return (
    MODE_VISUALS[gameType] || {
      title: fallbackLabel,
      progressBadge: fallbackLabel,
      description: "Select a mode.",
      accent: "var(--accent)",
      accentSoft: "var(--accent-fill-soft)",
      accentRing: "var(--accent-ring-mid)",
      accentGlow: "var(--accent-fill-strong)",
    }
  );
}

function getModeVars(modeVisual) {
  return {
    "--mode-accent": modeVisual.accent,
    "--mode-accent-soft": modeVisual.accentSoft,
    "--mode-accent-ring": modeVisual.accentRing,
    "--mode-accent-glow": modeVisual.accentGlow,
  };
}

function ModeSegmentIcon({ gameType }) {
  if (gameType === GAME_TYPES.TEMPLATE_TO_PATTERN) {
    return (
      <svg className="menu-mode-segment__icon" viewBox="0 0 16 16" aria-hidden="true">
        <rect x="2.5" y="2.5" width="4" height="4" rx="0.6" />
        <rect x="9.5" y="2.5" width="4" height="4" rx="0.6" />
        <rect x="2.5" y="9.5" width="4" height="4" rx="0.6" />
        <rect x="9.5" y="9.5" width="4" height="4" rx="0.6" />
      </svg>
    );
  }

  if (gameType === GAME_TYPES.BLUEPRINT_BUILDER) {
    return (
      <svg className="menu-mode-segment__icon" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M13.6 4.7a3 3 0 0 1-3.7 2.9L4.6 13a1.6 1.6 0 1 1-2.2-2.2l5.3-5.3a3 3 0 0 1 2.9-3.7L9 3.4 10.6 5 13.6 4.7z" />
        <path d="M10.6 5 12 3.6" />
      </svg>
    );
  }

  return (
    <svg className="menu-mode-segment__icon" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="3" cy="3.5" r="1" />
      <circle cx="3" cy="8" r="1" />
      <circle cx="3" cy="12.5" r="1" />
      <path d="M6 3.5h7" />
      <path d="M6 8h7" />
      <path d="M6 12.5h7" />
    </svg>
  );
}

function CircularProgress({ percentage, size = 48, strokeWidth = 3.5, accentColor = "var(--accent)", ariaLabel = "progress" }) {
  const p = clamp(percentage, 0, 100);
  const stop = `${(p / 100) * 360}deg`;
  const innerSize = Math.max(0, size - strokeWidth * 2);

  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(p)}
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        transform: "rotate(-90deg)",
        background: `conic-gradient(${accentColor} ${stop}, var(--surface-2) ${stop} 360deg)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 0.6s ease",
      }}
    >
      <div
        style={{
          width: innerSize,
          height: innerSize,
          borderRadius: 999,
          background: "var(--surface-1)",
          border: "1px solid var(--border)",
        }}
      />
    </div>
  );
}

function ProgressBar({ percentage, label, delay = 0 }) {
  const p = clamp(percentage, 0, 100);
  const color = getProgressColorHex(p);
  const bgColor = p === 0
    ? "var(--surface-2)"
    : p < 50
      ? "var(--warn-fill-soft)"
      : p < 80
        ? "var(--info-fill-soft)"
        : "var(--accent-fill-soft)";

  return (
    <div style={{ animation: `fadeSlideIn 0.5s ease ${delay}s both` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 13.5, color: "var(--text)", fontFamily: "var(--font-ui)", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 13, color: p === 0 ? "var(--faint)" : color, fontFamily: "var(--font-code)", fontWeight: 500 }}>
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

function StatRing({ label, value, percentage, delay = 0, accentColor }) {
  const valueText = String(value ?? "");

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, animation: `fadeSlideIn 0.5s ease ${delay}s both` }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress percentage={percentage} size={48} accentColor={accentColor} ariaLabel={`${label} progress`} />
        <span
          style={{
            position: "absolute",
            fontFamily: "var(--font-ui)",
            fontWeight: 700,
            fontSize: 11,
            lineHeight: 1,
            padding: "2px 6px",
            borderRadius: 999,
            color: "var(--text-strong)",
            background: "var(--surface-1)",
            border: "1px solid var(--border)",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.18)",
            pointerEvents: "none",
          }}
        >
          {valueText}
        </span>
      </div>
      <div style={{ fontFamily: "var(--font-ui)", fontSize: 13, color: "var(--faint)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
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
        <button className="tap-target" onClick={onSignOut} style={S.menuSignout}>
          sign out
        </button>
      ) : (
        <span style={{ fontFamily: "var(--font-code)", fontSize: 13, color: "var(--faint)" }}>local only</span>
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
        <span style={{ color: "var(--accent)", fontFamily: "var(--font-code)", fontWeight: 500 }}>.</span>
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
        <div role="status" style={{ ...S.syncBanner, animation: "fadeSlideIn 0.5s ease 0.05s both" }}>
          <div style={S.syncBannerTitle}>Save your results</div>
          <div style={S.syncBannerText}>Sign in to sync your progress across devices.</div>
          <div style={S.syncBannerNote}>If you stay signed out, results are saved only in this browser.</div>
        </div>
      )}

      {authError && (
        <div role="status" style={{ ...S.syncBanner, borderColor: "var(--error-ring-soft)", background: "var(--error-fill-soft)", animation: "fadeSlideIn 0.5s ease 0.08s both" }}>
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

function ModeSelectionSection({ gameTypeOptions, gameType, setGameType }) {
  const selectedModeVisual = getModeVisual(gameType, "Mode");

  return (
    <div data-tutorial-anchor="menu-mode-selector" style={{ animation: "fadeSlideIn 0.5s ease 0.13s both" }}>
      <div className="menu-mode-segmented" role="tablist" aria-label="Game mode selector">
        {(gameTypeOptions || []).map((option) => {
          const modeVisual = getModeVisual(option.value, option.label || "Mode");
          const isActive = option.value === gameType;
          return (
            <button
              key={option.value}
              className={`menu-mode-segment pressable-200 tap-target ${isActive ? "is-active" : ""}`}
              aria-pressed={isActive}
              onClick={() => setGameType(option.value)}
            >
              <ModeSegmentIcon gameType={option.value} />
              <span className="menu-mode-segment__label">{modeVisual.title}</span>
            </button>
          );
        })}
      </div>
      <div className="menu-mode-helper" aria-live="polite">
        {selectedModeVisual.description}
      </div>
    </div>
  );
}

function ProgressSection({ stats, lifetimePct, masteredCount, allCount, modeVisual, isBlueprintMode = false, blueprintWorldCount = 0 }) {
  const gamesPlayed = Math.max(0, Number(stats?.gamesPlayed || 0));
  const bestStreak = Math.max(0, Number(stats?.bestStreak || 0));
  const accuracyPct = clamp(lifetimePct, 0, 100);
  const accentColor = modeVisual.accent || "var(--accent)";

  const masteredValue = `${masteredCount}/${allCount}`;

  if (isBlueprintMode) {
    const starsEarned = Math.max(0, Number(stats?.totalCorrect || 0));
    const starsPossible = Math.max(0, Number(stats?.totalAnswered || 0));
    const worldCount = Math.max(0, Number(blueprintWorldCount || 0));
    const levelsPct = allCount > 0 ? (gamesPlayed / allCount) * 100 : 0;
    const worldsValue = `${bestStreak}/${worldCount}`;
    const worldsPct = worldCount > 0 ? (bestStreak / worldCount) * 100 : 0;
    const starsValue = `${starsEarned}/${starsPossible}`;
    const starsPct = starsPossible > 0 ? (starsEarned / starsPossible) * 100 : 0;

    return (
      <div style={{ ...S.card, animation: "fadeSlideIn 0.5s ease 0.15s both" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
          <div style={{ ...S.sectionLabel, marginBottom: 0 }}>your progress</div>
          <span className="menu-progress-mode-badge" style={getModeVars(modeVisual)}>
            {modeVisual.progressBadge}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <StatRing label="levels" value={`${gamesPlayed}/${allCount}`} percentage={levelsPct} delay={0.15} accentColor={accentColor} />
          <StatRing label="stars" value={starsValue} percentage={starsPct} delay={0.2} accentColor={accentColor} />
          <StatRing label="worlds" value={worldsValue} percentage={worldsPct} delay={0.25} accentColor={accentColor} />
          <StatRing label="mastered" value={masteredValue} percentage={allCount > 0 ? (masteredCount / allCount) * 100 : 0} delay={0.3} accentColor={accentColor} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...S.card, animation: "fadeSlideIn 0.5s ease 0.15s both" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
        <div style={{ ...S.sectionLabel, marginBottom: 0 }}>your progress</div>
        <span className="menu-progress-mode-badge" style={getModeVars(modeVisual)}>
          {modeVisual.progressBadge}
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <StatRing label="games" value={gamesPlayed} percentage={(gamesPlayed / 20) * 100} delay={0.15} accentColor={accentColor} />
        <StatRing label="accuracy" value={`${accuracyPct}%`} percentage={accuracyPct} delay={0.2} accentColor={accentColor} />
        <StatRing label="best streak" value={bestStreak} percentage={(bestStreak / 20) * 100} delay={0.25} accentColor={accentColor} />
        <StatRing label="mastered" value={masteredValue} percentage={allCount > 0 ? (masteredCount / allCount) * 100 : 0} delay={0.3} accentColor={accentColor} />
      </div>
    </div>
  );
}

function RoundSettingsSection({
  showRoundSettings,
  setShowRoundSettings,
  selectedModeLabel,
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
  onReplayTutorial = () => {},
}) {
  return (
    <div style={{ ...S.card, padding: 0, overflow: "hidden", animation: "fadeSlideIn 0.5s ease 0.2s both" }}>
      <button
        className="tap-target"
        onClick={() => setShowRoundSettings((p) => !p)}
        aria-expanded={showRoundSettings}
        aria-pressed={showRoundSettings}
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
        <span style={{ fontSize: 13, color: "var(--dim)", fontFamily: "var(--font-code)" }}>
          {selectedModeLabel} | {showRoundSettings ? "hide" : "show"}
        </span>
      </button>

      {showRoundSettings && (
        <div style={{ padding: "0 24px 22px", borderTop: "1px solid var(--border)", animation: "descReveal 0.2s ease-out" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
            {supportsDifficultyFilter && (
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={S.configLabel}>Difficulty</span>
                <div style={S.pillGroup}>
                  {["All", "Easy", "Medium", "Hard"].map((d) => (
                    <button
                      className="tap-target"
                      key={d}
                      onClick={() => setFilterDifficulty(d)}
                      aria-pressed={filterDifficulty === d}
                      style={{ ...S.pill, ...(filterDifficulty === d ? S.pillActive : {}) }}
                    >
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
                    <button
                      className="tap-target"
                      key={n}
                      onClick={() => setTotalQuestions(n)}
                      aria-pressed={totalQuestions === n}
                      style={{ ...S.pill, ...(totalQuestions === n ? S.pillActive : {}) }}
                    >
                      {n === allCount ? "all" : n}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              fontFamily: "var(--font-ui)",
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
          <div style={{ marginTop: 12 }}>
            <button className="tap-target" onClick={onReplayTutorial} style={S.browseBtn}>
              replay tutorial
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CampaignPreviewSection({ campaignPreview, onOpenDaily, onOpenWorld }) {
  const dailyChallenge = campaignPreview?.dailyChallenge || null;
  const dailyLevel = dailyChallenge?.challenge?.level || null;
  const dailyDifficulty = dailyLevel?.difficulty || "";
  const dailySubtitle = dailyLevel
    ? `${dailyLevel.title}${dailyDifficulty ? ` | ${dailyDifficulty}` : ""}`
    : "Today's challenge will appear here.";

  const worlds = Array.isArray(campaignPreview?.worlds) ? campaignPreview.worlds : [];

  return (
    <div style={{ ...S.card, padding: 0, overflow: "hidden", animation: "fadeSlideIn 0.5s ease 0.2s both" }}>
      <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)" }}>
        <span style={{ ...S.sectionLabel, marginBottom: 0 }}>campaign</span>
      </div>

      <div className="menu-campaign-panel">
        <button className="menu-campaign-daily hover-row pressable-200 tap-target" onClick={onOpenDaily}>
          <span className="menu-campaign-daily__icon" aria-hidden="true">
            D
          </span>
          <span className="menu-campaign-daily__text">
            <span className="menu-campaign-daily__title">Daily Challenge</span>
            <span className="menu-campaign-daily__subtitle">{dailySubtitle}</span>
          </span>
          <span style={S.chevron}>{">"}</span>
        </button>

        <div className="menu-campaign-world-list">
          {worlds.map((world, index) => {
            const worldId = Number(world?.worldId || world?.id || 0);
            const worldLabel = world?.label || world?.name || `World ${index + 1}`;
            const progressLabel = world?.progressLabel || "0/0";

            return (
              <button
                key={`${worldId || index}-${worldLabel}`}
                className="menu-campaign-world-row hover-row pressable-200 tap-target"
                onClick={() => onOpenWorld(worldId)}
              >
                <span className="menu-campaign-world-row__badge" aria-hidden="true">
                  {index + 1}
                </span>
                <span className="menu-campaign-world-row__name">{worldLabel}</span>
                <span className="menu-campaign-world-row__progress">{progressLabel}</span>
                <span style={S.chevron}>{">"}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TutorialSection({
  expanded,
  onToggleExpanded,
  onReplaySelectedTutorial,
  onReplayGlobalTutorial,
  onResetOnboarding,
}) {
  return (
    <div style={{ ...S.card, animation: "fadeSlideIn 0.5s ease 0.58s both" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ ...S.sectionLabel, marginBottom: 0 }}>tutorials</div>
        <button
          className="tap-target"
          onClick={onToggleExpanded}
          style={S.browseBtn}
          aria-expanded={expanded}
          aria-pressed={expanded}
          aria-label="Toggle tutorials controls"
          data-testid="tutorial-toggle"
        >
          {expanded ? "hide" : "show"}
        </button>
      </div>
      {expanded ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
          <button className="tap-target" onClick={onReplaySelectedTutorial} style={S.browseBtn}>
            replay tutorial
          </button>
          <button className="tap-target" onClick={onReplayGlobalTutorial} style={S.browseBtn}>
            replay global onboarding
          </button>
          <button className="tap-target" onClick={onResetOnboarding} style={S.browseBtn}>
            reset onboarding
          </button>
        </div>
      ) : null}
    </div>
  );
}

function StartSection({ startGame, startLabel }) {
  return (
    <div style={{ animation: "fadeSlideIn 0.5s ease 0.25s both" }}>
      <button className="tap-target" onClick={startGame} style={{ ...S.startBtn, width: "100%", animation: "pulseGlow 3s ease-in-out infinite" }}>
        <span
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, transparent, var(--shimmer-highlight), transparent)",
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

function AccuracyTrendSection({ trendPoints = [] }) {
  const points = Array.isArray(trendPoints) ? trendPoints.slice(-20) : [];
  const width = 300;
  const height = 112;
  const pad = 12;

  if (points.length === 0) {
    return (
      <div style={{ ...S.card, animation: "fadeSlideIn 0.5s ease 0.32s both" }}>
        <div style={S.sectionLabel}>accuracy trend</div>
        <div style={{ fontSize: 13, color: "var(--dim)", lineHeight: 1.5 }}>
          Play a few rounds to unlock your trend chart.
        </div>
      </div>
    );
  }

  const maxIndex = Math.max(1, points.length - 1);
  const coords = points.map((point, index) => {
    const x = pad + (index / maxIndex) * (width - pad * 2);
    const y = pad + ((100 - Number(point.pct || 0)) / 100) * (height - pad * 2);
    return {
      x: Math.max(pad, Math.min(width - pad, x)),
      y: Math.max(pad, Math.min(height - pad, y)),
      pct: Math.max(0, Math.min(100, Number(point.pct || 0))),
    };
  });

  const path = coords.map((coord, index) => `${index === 0 ? "M" : "L"} ${coord.x} ${coord.y}`).join(" ");
  const latest = coords[coords.length - 1];

  return (
    <div style={{ ...S.card, animation: "fadeSlideIn 0.5s ease 0.32s both" }}>
      <div style={{ ...S.sectionLabel, marginBottom: 10 }}>accuracy trend</div>
      <div
        style={{
          fontFamily: "var(--font-code)",
          fontSize: 13,
          color: "var(--faint)",
          marginBottom: 8,
        }}
      >
        last {points.length} rounds latest: {Math.round(latest.pct)}%
      </div>
      <svg
        data-testid="accuracy-trend-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Accuracy trend chart"
        style={{ width: "100%", display: "block" }}
      >
        <rect x="0" y="0" width={width} height={height} rx="12" fill="var(--surface-2)" stroke="var(--border)" />
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((coord, index) => (
          <circle
            key={`${coord.x}-${coord.y}-${index}`}
            cx={coord.x}
            cy={coord.y}
            r={index === coords.length - 1 ? 3.6 : 2.6}
            fill={index === coords.length - 1 ? "var(--accent)" : "var(--text)"}
          />
        ))}
      </svg>
    </div>
  );
}

function SecondaryActions({ supportsBrowse, supportsTemplates, goBrowse, goTemplates, goReview }) {
  if (!supportsBrowse && !supportsTemplates && typeof goReview !== "function") return null;

  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center", animation: "fadeSlideIn 0.5s ease 0.5s both" }}>
      {typeof goReview === "function" && (
        <button className="tap-target" onClick={goReview} style={S.browseBtn}>
          review mistakes
        </button>
      )}
      {supportsBrowse && (
        <button className="tap-target" onClick={goBrowse} style={S.browseBtn}>
          browse patterns
        </button>
      )}
      {supportsTemplates && (
        <button className="tap-target" onClick={goTemplates} style={S.browseBtn}>
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
        <button className="tap-target" onClick={() => setShowResetConfirm(true)} style={S.resetBtn}>
          reset all data
        </button>
      ) : (
        <div style={{ ...S.resetConfirm, justifyContent: "center" }}>
          <span style={{ fontSize: 13, color: "var(--danger)" }}>erase all progress?</span>
          <button className="tap-target" onClick={resetAllData} style={{ ...S.resetBtn, color: "var(--danger)" }}>
            yes, reset
          </button>
          <button className="tap-target" onClick={() => setShowResetConfirm(false)} style={S.resetBtn}>
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
  goReview = null,
  supportsBrowse = true,
  supportsTemplates = true,
  supportsDifficultyFilter = true,
  supportsQuestionCount = true,
  showResetConfirm,
  setShowResetConfirm,
  resetAllData,
  routeNotice,
  modeProgressByGameType = null,
  blueprintCampaignPreview = null,
  onOpenBlueprintDaily = () => {},
  onOpenBlueprintWorld = () => {},
  accuracyTrend = [],
  startLabel = "",
  onReplaySelectedTutorial = () => {},
  onReplayGlobalTutorial = () => {},
  onResetOnboarding = () => {},
}) {
  const [showRoundSettings, setShowRoundSettings] = useState(false);
  const [showTutorialControls, setShowTutorialControls] = useState(false);

  const fallbackAllCount = Number.isFinite(totalAvailableQuestions) ? totalAvailableQuestions : 0;
  const selectedModeProgress = modeProgressByGameType?.[gameType] || null;
  const selectedStats = selectedModeProgress?.stats || stats;
  const selectedLifetimePct = Number.isFinite(selectedModeProgress?.lifetimePct) ? selectedModeProgress.lifetimePct : lifetimePct;
  const selectedMasteredCount = Number.isFinite(selectedModeProgress?.masteredCount) ? selectedModeProgress.masteredCount : masteredCount;
  const allCount = Number.isFinite(selectedModeProgress?.allCount) ? selectedModeProgress.allCount : fallbackAllCount;

  const selectedModeOption = (gameTypeOptions || []).find((opt) => opt.value === gameType);
  const selectedModeVisual = getModeVisual(gameType, selectedModeOption?.label || "mode");
  const isBlueprintMode = gameType === GAME_TYPES.BLUEPRINT_BUILDER;

  const questionCountOptions = Array.from(new Set([10, 20, 40, allCount].filter((n) => n > 0)));

  const displayName = user?.name || user?.email || "Guest";
  const avatarLetter = (displayName || "G").trim().slice(0, 1).toUpperCase();

  const noun = roundNoun || "questions";
  const diffLabel = filterDifficulty === "All" ? "all difficulties" : `${String(filterDifficulty).toLowerCase()} ${noun}`;
  const qLabel = totalQuestions === allCount ? "all available" : totalQuestions;
  const selectedModeLabel = selectedModeVisual.title;
  const resolvedStartLabel = startLabel || (isBlueprintMode ? "Open Campaign Map" : "Start Round");

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
        <div role="status" style={{ ...S.syncBanner, animation: "fadeSlideIn 0.4s ease 0.02s both", maxWidth: 700 }}>
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

        <ModeSelectionSection gameTypeOptions={gameTypeOptions} gameType={gameType} setGameType={setGameType} />

        <ProgressSection
          stats={selectedStats}
          lifetimePct={selectedLifetimePct}
          masteredCount={selectedMasteredCount}
          allCount={allCount}
          modeVisual={selectedModeVisual}
          isBlueprintMode={isBlueprintMode}
          blueprintWorldCount={Number.isFinite(selectedModeProgress?.worldCount) ? selectedModeProgress.worldCount : 0}
        />

        {isBlueprintMode ? (
          <CampaignPreviewSection
            campaignPreview={blueprintCampaignPreview}
            onOpenDaily={onOpenBlueprintDaily}
            onOpenWorld={onOpenBlueprintWorld}
          />
        ) : (
          <RoundSettingsSection
            showRoundSettings={showRoundSettings}
            setShowRoundSettings={setShowRoundSettings}
            selectedModeLabel={selectedModeLabel}
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
            onReplayTutorial={onReplaySelectedTutorial}
          />
        )}

        <StartSection startGame={startGame} startLabel={resolvedStartLabel} />

        <NeedsWorkSection needsWork={needsWork} />
        {!isBlueprintMode && <AccuracyTrendSection trendPoints={accuracyTrend} />}

        <SecondaryActions
          supportsBrowse={supportsBrowse}
          supportsTemplates={supportsTemplates}
          goBrowse={goBrowse}
          goTemplates={goTemplates}
          goReview={isBlueprintMode ? null : goReview}
        />

        <DangerZone
          stats={selectedStats}
          showResetConfirm={showResetConfirm}
          setShowResetConfirm={setShowResetConfirm}
          resetAllData={resetAllData}
        />

        <TutorialSection
          expanded={showTutorialControls}
          onToggleExpanded={() => setShowTutorialControls((prev) => !prev)}
          onReplaySelectedTutorial={onReplaySelectedTutorial}
          onReplayGlobalTutorial={onReplayGlobalTutorial}
          onResetOnboarding={onResetOnboarding}
        />
      </div>
    </div>
  );
}

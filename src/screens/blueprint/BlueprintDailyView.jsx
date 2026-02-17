import { S } from "../../styles";
import { DIFF_COLOR, formatElapsed, getLevelStars } from "./shared";
import { getWorldAccent } from "./viewShared";

export function BlueprintDailyView({ dailyChallenge, completed, onBack, onStartChallenge }) {
  if (!dailyChallenge?.challenge?.level) {
    return (
      <div style={{ ...S.blueprintProblemCard, animation: "blueprintViewIn 0.24s ease" }}>
        <button className="pressable-200 tap-target" onClick={onBack} style={{ ...S.backBtn, minHeight: 44, width: "fit-content" }}>
          Worlds
        </button>
        <div style={S.blueprintNodeTitle}>Daily challenge is not available yet.</div>
      </div>
    );
  }

  const challenge = dailyChallenge.challenge;
  const item = challenge.level;
  const stars = getLevelStars(completed, dailyChallenge.levelId);
  const accent = getWorldAccent(dailyChallenge.worldId || 1);

  return (
    <div style={{ ...S.blueprintViewPane, animation: "blueprintViewIn 0.24s ease" }}>
      <div style={S.blueprintDetailHeader}>
        <button className="pressable-200 tap-target" onClick={onBack} style={{ ...S.backBtn, minHeight: 44, minWidth: 44 }}>
          Worlds
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0, flex: 1 }}>
          <div style={{ ...S.blueprintNodeMeta, color: "var(--warn)", fontFamily: "var(--font-code)" }}>
            Daily Challenge [{dailyChallenge.dateKey}]
          </div>
          <div style={{ ...S.blueprintLevelTitle, fontSize: 22, lineHeight: 1.2 }}>{item.title}</div>
        </div>
      </div>

      <div style={{ ...S.blueprintProblemCard, borderColor: accent.ring }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ ...S.diffBadge, color: DIFF_COLOR[item.difficulty] || "var(--dim)", borderColor: "var(--border)" }}>{item.difficulty}</span>
          <span style={S.blueprintPatternBadge}>{challenge.showPatternLabel ? item.pattern : "pattern hidden"}</span>
          <span style={S.blueprintNodeMeta}>time {formatElapsed((challenge.timeLimitSec || 0) * 1000)}</span>
        </div>

        <p style={S.blueprintLevelDesc}>{item.description}</p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {[1, 2, 3].map((value) => (
              <span
                key={value}
                style={{
                  ...S.blueprintStar,
                  color: value <= stars ? "var(--warn)" : "var(--faint)",
                }}
              >
                *
              </span>
            ))}
          </div>
          <span style={S.blueprintNodeMeta}>World {dailyChallenge.worldId}</span>
        </div>

        <button
          className="pressable-200 tap-target"
          onClick={() => onStartChallenge(challenge)}
          style={{
            ...S.blueprintDailyStartBtn,
            background: "linear-gradient(135deg, var(--warn), var(--accent-warn))",
          }}
        >
          Start Challenge
        </button>
      </div>
    </div>
  );
}

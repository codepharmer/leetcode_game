import { useEffect, useMemo, useState } from "react";

import { S } from "../../styles";
import { DIFF_COLOR, formatElapsed, getChallengeBadgeColor, getLevelStars } from "./shared";
import { getWorldAccent } from "./viewShared";

function ProblemRow({ challenge, stars, accent, canPlay, onStart }) {
  const item = challenge.level;
  const solved = stars >= 1;

  return (
    <button
      className="hover-row hover-accent pressable-200"
      disabled={!canPlay}
      onClick={() => canPlay && onStart(challenge)}
      style={{
        ...S.blueprintProblemRow,
        cursor: canPlay ? "pointer" : "default",
        opacity: canPlay ? 1 : 0.78,
        borderColor: solved ? accent.ring : "var(--border)",
        "--hover-accent": accent.soft,
        "--hover-accent-border": accent.ring,
      }}
    >
      <div style={{ ...S.blueprintNodeBadge, color: solved ? accent.base : getChallengeBadgeColor(challenge), borderColor: solved ? accent.ring : `${getChallengeBadgeColor(challenge)}55` }}>
        {solved ? "\u2713" : challenge.tierIcon}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0, flex: 1, textAlign: "left" }}>
        <div style={{ ...S.blueprintNodeTitle, fontSize: 14.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ ...S.diffBadge, color: DIFF_COLOR[item.difficulty] || "var(--dim)", borderColor: "var(--border)" }}>{item.difficulty}</span>
          <span style={S.blueprintPatternBadge}>{challenge.showPatternLabel ? item.pattern : "pattern hidden"}</span>
          <span style={S.blueprintNodeMeta}>time {formatElapsed((challenge.timeLimitSec || 0) * 1000)}</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 3, alignItems: "center", minWidth: 50, justifyContent: "flex-end" }}>
        {[1, 2, 3].map((value) => (
          <span
            key={value}
            style={{
              ...S.blueprintStar,
              fontSize: 12,
              color: value <= stars ? "var(--warn)" : "var(--faint)",
            }}
          >
            *
          </span>
        ))}
      </div>
    </button>
  );
}

export function BlueprintWorldDetailView({ world, completed, onBack, onStartChallenge }) {
  const accent = getWorldAccent(world?.id || 1);
  const [expandedByTier, setExpandedByTier] = useState({ 0: true });

  useEffect(() => {
    if (!world) {
      setExpandedByTier({ 0: true });
      return;
    }

    setExpandedByTier({
      0: true,
      [world.activeTierIndex || 0]: true,
    });
  }, [world]);

  const stage = useMemo(() => world?.activeStage || world?.stages?.[0] || null, [world]);
  const tiers = stage?.tiers || [];

  if (!world) {
    return (
      <div style={{ ...S.blueprintProblemCard, animation: "blueprintViewIn 0.24s ease" }}>
        <div style={S.blueprintNodeTitle}>Select a world from map.</div>
      </div>
    );
  }

  return (
    <div style={{ ...S.blueprintViewPane, animation: "blueprintViewIn 0.24s ease" }}>
      <div style={S.blueprintDetailHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
          <button className="pressable-200" onClick={onBack} style={{ ...S.backBtn, minHeight: 44, minWidth: 44 }}>
            back
          </button>

          <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0, flex: 1 }}>
            <span style={{ ...S.diffBadge, color: accent.base, borderColor: accent.ring, alignSelf: "flex-start" }}>World {world.id}</span>
            <div style={{ ...S.blueprintLevelTitle, fontSize: 22, lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{world.name}</div>
          </div>
        </div>

        <div style={{ ...S.blueprintNodeTitle, color: accent.base, fontSize: 24, minWidth: 64, textAlign: "right" }}>
          {world.completedCount}/{world.totalCount}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={S.progressTrack}>
          <div style={{ ...S.progressBar, width: `${world.progressPct}%`, background: accent.base }} />
        </div>
        <div style={S.blueprintNodeMeta}>
          {stage?.label || "Set 1"} | {world.family}
        </div>
      </div>

      {!world.isUnlocked ? (
        <div style={S.blueprintProblemCard}>
          <div style={{ ...S.blueprintNodeMeta, color: "var(--warn)" }}>{world.unlockRule?.label}</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tiers.map((tier) => {
            const tierLabel = `Tier ${tier.index + 1}`;
            const isLocked = tier.index > world.activeTierIndex;
            const isExpanded = !!expandedByTier[tier.index];
            const solvedCount = tier.levelIds.filter((levelId) => getLevelStars(completed, levelId) >= 1).length;
            const canPlayTier = tier.index === world.activeTierIndex;

            return (
              <div key={tier.index} style={S.blueprintTierCard}>
                <button
                  className="pressable-200"
                  disabled={isLocked}
                  onClick={() =>
                    !isLocked &&
                    setExpandedByTier((prev) => ({
                      ...prev,
                      [tier.index]: !prev[tier.index],
                    }))
                  }
                  style={{
                    ...S.blueprintTierHeader,
                    cursor: isLocked ? "default" : "pointer",
                    opacity: isLocked ? 0.85 : 1,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ ...S.diffBadge, color: accent.base, borderColor: accent.ring }}>{tierLabel}</span>
                    <span style={S.blueprintNodeMeta}>
                      {solvedCount}/{tier.levelIds.length} solved
                    </span>
                  </div>
                  <span style={{ ...S.blueprintNodeMeta, color: isLocked ? "var(--warn)" : "var(--dim)", fontSize: 12 }}>
                    {isLocked ? "[LOCK]" : isExpanded ? "v" : ">"}
                  </span>
                </button>

                {isLocked ? (
                  <div style={{ ...S.blueprintNodeMeta, color: "var(--warn)", padding: "0 14px 12px" }}>
                    [LOCK] Complete Tier {tier.index} to reveal more.
                  </div>
                ) : null}

                {!isLocked && isExpanded ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 10px 10px" }}>
                    {tier.challenges.map((challenge) => {
                      const stars = getLevelStars(completed, challenge.levelId);
                      return (
                        <ProblemRow
                          key={challenge.id}
                          challenge={challenge}
                          stars={stars}
                          accent={accent}
                          canPlay={canPlayTier}
                          onStart={onStartChallenge}
                        />
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

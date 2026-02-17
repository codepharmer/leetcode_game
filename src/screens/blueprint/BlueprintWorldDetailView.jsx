import { useEffect, useMemo, useState } from "react";

import { S } from "../../styles";
import { DIFF_COLOR, formatElapsed, getChallengeBadgeColor, getLevelStars } from "./shared";
import { getWorldAccent } from "./viewShared";

function ProblemRow({ challenge, stars, accent, canPlay, onStart }) {
  const item = challenge.level;
  const solved = stars >= 1;
  const challengeBorderColor = challenge?.isBossRush
    ? "var(--error-ring-soft)"
    : challenge?.tier === 1
      ? "var(--accent-ring-soft)"
      : challenge?.tier === 2
        ? "var(--warn-ring-soft)"
        : "var(--error-ring-soft)";

  return (
    <button
      className="hover-row hover-accent pressable-200 tap-target"
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
      <div style={{ ...S.blueprintNodeBadge, color: solved ? accent.base : getChallengeBadgeColor(challenge), borderColor: solved ? accent.ring : challengeBorderColor }}>
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
              fontSize: 13,
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

export function BlueprintWorldDetailView({ world, completed, totalStars, onBack, onStartChallenge }) {
  const accent = getWorldAccent(world?.id || 1);
  const [expandedByTier, setExpandedByTier] = useState({ 0: true });
  const worldId = world?.id ?? null;
  const activeTierIndex = world?.activeTierIndex || 0;

  useEffect(() => {
    setExpandedByTier((prev) => {
      const next = {
        0: true,
        [activeTierIndex]: true,
      };
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      const isSame =
        prevKeys.length === nextKeys.length &&
        nextKeys.every((key) => prev[key] === next[key]);
      return isSame ? prev : next;
    });
  }, [activeTierIndex, worldId]);

  const stage = useMemo(() => world?.activeStage || world?.stages?.[0] || null, [world]);
  const tiers = stage?.tiers || [];
  const stageLabel = stage?.label || "Set 1";
  const navTitle = `${world?.name || "World"} ${stageLabel}: ${world?.family || ""}`.trim();
  const safeTotalStars = Math.max(0, Number(totalStars) || 0);

  if (!world) {
    return (
      <div style={{ ...S.blueprintProblemCard, animation: "blueprintViewIn 0.24s ease" }}>
        <div style={S.blueprintNodeTitle}>Select a world from map.</div>
      </div>
    );
  }

  return (
    <div style={{ ...S.blueprintViewPane, animation: "blueprintViewIn 0.24s ease" }}>
      <div style={S.blueprintWorldNavBar}>
        <button className="pressable-200 tap-target" onClick={onBack} style={{ ...S.backBtn, minHeight: 44, width: "fit-content" }}>
          Worlds
        </button>

        <div style={S.blueprintWorldNavTitle} title={navTitle}>
          {navTitle}
        </div>

        <div style={S.blueprintWorldNavMeta}>
          <span data-testid="blueprint-world-progress" style={{ color: accent.base }}>
            {world.completedCount}/{world.totalCount}
          </span>
          <span data-testid="blueprint-world-stars">stars: {safeTotalStars}</span>
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
            const canPlayTier = tier.index <= world.activeTierIndex;

            return (
              <div key={tier.index} style={S.blueprintTierCard}>
                <button
                  className="pressable-200 tap-target"
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
                  <span style={{ ...S.blueprintNodeMeta, color: isLocked ? "var(--warn)" : "var(--dim)", fontSize: 13 }}>
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

import { S } from "../../styles";
import { DIFF_COLOR, getChallengeBadgeColor, getLevelStars } from "./shared";

export function BlueprintMenu({
  goMenu,
  campaign,
  completed,
  selectedWorld,
  setSelectedWorldId,
  startChallenge,
  totalStars,
}) {
  return (
    <div style={S.blueprintContainer}>
      <div style={S.topBar}>
        <button onClick={goMenu} style={S.backBtn}>
          {" "}back
        </button>
        <span style={S.blueprintTitle}>Blueprint Builder</span>
        <div style={S.blueprintTopMeta}>stars: {totalStars}</div>
      </div>

      <div style={S.blueprintMenuIntro}>
        Worlds are grouped by pattern family. Each stage reveals one tier at a time so you only see the next two problems.
      </div>

      {campaign.dailyChallenge ? (
        <button
          className="hover-row"
          onClick={() => startChallenge(campaign.dailyChallenge.challenge)}
          style={{
            ...S.blueprintMenuCard,
            borderColor: "rgba(245, 158, 11, 0.45)",
            background: "rgba(245, 158, 11, 0.08)",
          }}
        >
          <div style={S.blueprintMenuCardTop}>
            <span style={{ ...S.diffBadge, color: "var(--warn)", borderColor: "rgba(245, 158, 11, 0.45)" }}>Daily Problem</span>
            <span style={S.blueprintPatternBadge}>{campaign.dailyChallenge.dateKey}</span>
          </div>
          <h3 style={S.blueprintLevelTitle}>{campaign.dailyChallenge.level?.title}</h3>
          <p style={S.blueprintLevelDesc}>From World {campaign.dailyChallenge.worldId}. Keeps pattern-switching sharp.</p>
          <div style={S.blueprintStarRow}>
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                style={{
                  ...S.blueprintStar,
                  color: n <= getLevelStars(completed, campaign.dailyChallenge.levelId) ? "var(--warn)" : "var(--faint)",
                }}
              >
                *
              </span>
            ))}
          </div>
        </button>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 10 }}>
        {campaign.worlds.map((world) => {
          const isSelected = selectedWorld?.id === world.id;
          return (
            <button
              key={world.id}
              className="hover-row"
              onClick={() => world.isUnlocked && setSelectedWorldId(world.id)}
              disabled={!world.isUnlocked}
              style={{
                ...S.blueprintMenuCard,
                opacity: world.isUnlocked ? 1 : 0.55,
                cursor: world.isUnlocked ? "pointer" : "not-allowed",
                borderColor: isSelected ? "rgba(16, 185, 129, 0.45)" : "var(--border)",
                background: isSelected ? "rgba(16, 185, 129, 0.08)" : "var(--surface-1)",
              }}
            >
              <div style={S.blueprintMenuCardTop}>
                <span
                  style={{
                    ...S.diffBadge,
                    color: world.isUnlocked ? "var(--accent)" : "var(--dim)",
                    borderColor: "var(--border)",
                  }}
                >
                  {world.name}
                </span>
                <span style={S.blueprintPatternBadge}>{world.family}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--dim)", fontFamily: "'DM Mono', monospace" }}>
                problems: {world.totalCount} ({world.problemRange})
              </div>
              <div style={{ fontSize: 12, color: world.isComplete ? "var(--accent)" : "var(--faint)" }}>
                {world.completedCount}/{world.totalCount} complete
              </div>
              {!world.isUnlocked ? <div style={{ fontSize: 12, color: "var(--warn)" }}>{world.unlockRule.label}</div> : null}
            </button>
          );
        })}
      </div>

      {selectedWorld ? (
        <div style={{ ...S.blueprintProblemCard, marginTop: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div>
              <div style={S.blueprintLevelTitle}>
                {selectedWorld.name}: {selectedWorld.family}
              </div>
              <div style={{ fontSize: 12, color: "var(--dim)" }}>
                {selectedWorld.activeStage?.label || "Set 1"} | {selectedWorld.activeTier?.label || "Tier 1"}
              </div>
            </div>
            <div style={{ ...S.blueprintTopMeta, minWidth: "auto" }}>
              progress: {selectedWorld.progressPct}%
            </div>
          </div>

          {!selectedWorld.isUnlocked ? (
            <div style={S.blueprintLevelDesc}>{selectedWorld.unlockRule.label}</div>
          ) : (
            <>
              {selectedWorld.visibleChallenges.length === 0 ? (
                <div style={S.blueprintLevelDesc}>World complete. Replay daily or choose another world.</div>
              ) : (
                <div style={S.blueprintMenuList}>
                  {selectedWorld.visibleChallenges.map((challenge) => {
                    const item = challenge.level;
                    const stars = getLevelStars(completed, challenge.levelId);
                    return (
                      <button
                        key={challenge.id}
                        className="hover-row"
                        onClick={() => startChallenge(challenge)}
                        style={{
                          ...S.blueprintMenuCard,
                          borderColor: `${getChallengeBadgeColor(challenge)}55`,
                        }}
                      >
                        <div style={S.blueprintMenuCardTop}>
                          <span
                            style={{
                              ...S.diffBadge,
                              color: getChallengeBadgeColor(challenge),
                              borderColor: `${getChallengeBadgeColor(challenge)}55`,
                            }}
                          >
                            {challenge.tierIcon} {challenge.tierRole}
                          </span>
                          <span style={{ ...S.diffBadge, color: DIFF_COLOR[item.difficulty] || "var(--dim)", borderColor: "var(--border)" }}>
                            {item.difficulty}
                          </span>
                          <span style={S.blueprintPatternBadge}>{challenge.showPatternLabel ? item.pattern : "pattern hidden"}</span>
                        </div>
                        <h3 style={S.blueprintLevelTitle}>{item.title}</h3>
                        <p style={S.blueprintLevelDesc}>{item.description}</p>
                        <div style={{ ...S.blueprintTopMeta, minWidth: "auto", textAlign: "left" }}>
                          time limit: {Math.round(challenge.timeLimitSec / 60)}m
                        </div>
                        <div style={S.blueprintStarRow}>
                          {[1, 2, 3].map((n) => (
                            <span key={n} style={{ ...S.blueprintStar, color: n <= stars ? "var(--warn)" : "var(--faint)" }}>
                              *
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedWorld.lockedSilhouettes.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {selectedWorld.lockedSilhouettes.map((silhouette) => (
                    <div
                      key={silhouette.tierIndex}
                      style={{
                        ...S.blueprintMenuCard,
                        borderStyle: "dashed",
                        borderColor: "var(--border)",
                        opacity: 0.65,
                        cursor: "default",
                      }}
                    >
                      <div style={S.blueprintMenuCardTop}>
                        <span style={{ ...S.diffBadge, color: "var(--dim)", borderColor: "var(--border)" }}>{silhouette.label}</span>
                        <span style={S.blueprintPatternBadge}>locked</span>
                      </div>
                      <div style={S.blueprintLevelDesc}>Complete current tier to unlock {silhouette.count} more problems.</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

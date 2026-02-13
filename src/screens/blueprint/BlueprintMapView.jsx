import { useEffect, useMemo, useState } from "react";

import { S } from "../../styles";
import { getNextUnsolvedChallenge, getRemainingWorldUnlockCount, getWorldAccent, getWorldIcon } from "./viewShared";

const TRAIL_X = [26, 50, 74];
const MOBILE_BREAKPOINT = 640;

function ProgressRing({ progressPct, accent, icon, worldId, locked }) {
  const safePct = Math.max(0, Math.min(100, Number(progressPct) || 0));
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (safePct / 100) * circumference;

  return (
    <div style={{ position: "relative", width: 66, height: 66, flexShrink: 0 }}>
      <svg width={66} height={66} viewBox="0 0 66 66" aria-hidden="true" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="33" cy="33" r={radius} stroke="var(--surface-2)" strokeWidth="4" fill="none" />
        <circle
          cx="33"
          cy="33"
          r={radius}
          stroke={accent.ring}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 0.2s ease" }}
        />
      </svg>

      <div
        style={{
          position: "absolute",
          inset: 8,
          borderRadius: 999,
          border: "1px solid var(--border)",
          background: locked ? "var(--surface-2)" : accent.soft,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
        }}
      >
        <span style={{ fontSize: 10, color: "var(--dim)", fontFamily: "'DM Mono', monospace", textTransform: "uppercase" }}>{icon}</span>
        <span style={{ fontSize: 15, color: "var(--text-strong)", fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>{worldId}</span>
      </div>
    </div>
  );
}

function WorldNodeButton({ world, index, accent, isLocked, unlockCountLabel, onOpenWorld, style }) {
  return (
    <button
      className="hover-row hover-accent pressable-200"
      disabled={!world.isUnlocked}
      onClick={() => world.isUnlocked && onOpenWorld(world.id)}
      style={{
        ...style,
        opacity: isLocked ? 0.35 : 1,
        cursor: world.isUnlocked ? "pointer" : "not-allowed",
        borderColor: isLocked ? "var(--border)" : accent.ring,
        animation: `fadeSlideIn 0.34s ease ${index * 0.05}s both`,
        "--hover-accent": accent.soft,
        "--hover-accent-border": accent.ring,
      }}
    >
      <ProgressRing
        progressPct={world.progressPct}
        accent={accent}
        icon={getWorldIcon(world)}
        worldId={world.id}
        locked={isLocked}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0, textAlign: "left" }}>
        <div style={{ ...S.blueprintNodeTitle, fontSize: 15 }}>{world.name}</div>
        <div style={{ ...S.blueprintNodeMeta, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{world.family}</div>
        <div style={S.blueprintNodeMeta}>
          {world.completedCount}/{world.totalCount} complete | {world.problemRange} problems
        </div>
        {isLocked ? (
          <div style={{ ...S.blueprintNodeMeta, color: "var(--warn)" }}>
            [LOCK] Complete {unlockCountLabel} worlds to unlock
          </div>
        ) : null}
      </div>
    </button>
  );
}

export function BlueprintMapView({ campaign, completed, onOpenDaily, onOpenWorld, onContinue }) {
  const nextChallenge = useMemo(() => getNextUnsolvedChallenge(campaign, completed), [campaign, completed]);
  const nextAccent = getWorldAccent(nextChallenge?.world?.id || campaign?.dailyChallenge?.worldId || 1);
  const [isMobileLayout, setIsMobileLayout] = useState(() => (
    typeof window !== "undefined" ? window.innerWidth <= MOBILE_BREAKPOINT : false
  ));
  const worlds = campaign?.worlds || [];

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onResize = () => setIsMobileLayout(window.innerWidth <= MOBILE_BREAKPOINT);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div style={S.blueprintViewPane}>
      {campaign?.dailyChallenge?.challenge?.level ? (
        <button className="pressable-200 hover-row" onClick={onOpenDaily} style={S.blueprintDailyBannerRow}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
            <span style={{ ...S.blueprintNodeBadge, color: "var(--warn)", borderColor: "rgba(245, 158, 11, 0.45)" }}>D</span>
            <span style={{ ...S.diffBadge, color: "var(--warn)", borderColor: "rgba(245, 158, 11, 0.45)" }}>Daily Challenge</span>
            <span style={{ ...S.blueprintNodeMeta, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {campaign.dailyChallenge.challenge.level.title}
            </span>
          </div>
          <span style={S.chevron}>{">"}</span>
        </button>
      ) : null}

      {nextChallenge ? (
        <button
          className="pressable-200"
          onClick={() => onContinue(nextChallenge.challenge)}
          style={{ ...S.blueprintContinueBtn, background: nextAccent.gradient, borderColor: nextAccent.ring }}
        >
          <span style={{ ...S.blueprintNodeTitle, color: "#0f1117" }}>Continue</span>
          <span style={{ ...S.blueprintNodeMeta, color: "rgba(15, 17, 23, 0.82)", fontSize: 12.5 }}>
            {nextChallenge.world?.name || "World"} | {nextChallenge.challenge.level.title}
          </span>
        </button>
      ) : (
        <div style={{ ...S.blueprintProblemCard, alignItems: "stretch" }}>
          <div style={S.blueprintNodeTitle}>All current worlds complete.</div>
          <div style={S.blueprintNodeMeta}>Use Daily Challenge to keep your streak moving.</div>
        </div>
      )}

      <div style={isMobileLayout ? S.blueprintTrailWrapMobile : S.blueprintTrailWrap}>
        {worlds.map((world, index) => {
          const x = TRAIL_X[index % TRAIL_X.length];
          const nextX = TRAIL_X[(index + 1) % TRAIL_X.length];
          const nextWorld = worlds[index + 1];
          const accent = getWorldAccent(world.id);
          const remainingUnlockCount = getRemainingWorldUnlockCount(world, campaign.completedCoreWorlds);
          const unlockCountLabel = remainingUnlockCount || world.unlockRule.requiredCompletedWorlds;
          const isLocked = !world.isUnlocked;

          if (isMobileLayout) {
            return (
              <div key={world.id} style={S.blueprintTrailRowMobile}>
                {nextWorld ? (
                  <span
                    aria-hidden="true"
                    style={{
                      ...S.blueprintTrailRailMobile,
                      borderLeftColor: nextWorld.isUnlocked ? "var(--border-strong)" : "var(--faint)",
                      borderLeftStyle: nextWorld.isUnlocked ? "solid" : "dashed",
                    }}
                  />
                ) : null}
                <WorldNodeButton
                  world={world}
                  index={index}
                  accent={accent}
                  isLocked={isLocked}
                  unlockCountLabel={unlockCountLabel}
                  onOpenWorld={onOpenWorld}
                  style={S.blueprintWorldNodeMobile}
                />
              </div>
            );
          }

          return (
            <div key={world.id} style={{ ...S.blueprintTrailRow, minHeight: index === worlds.length - 1 ? 110 : 128 }}>
              {nextWorld ? (
                <svg viewBox="0 0 100 110" preserveAspectRatio="none" style={S.blueprintTrailSvg} aria-hidden="true">
                  <path
                    d={`M ${x} 28 Q 50 66 ${nextX} 102`}
                    fill="none"
                    stroke={nextWorld.isUnlocked ? "var(--border-strong)" : "var(--faint)"}
                    strokeWidth="1.5"
                    strokeDasharray={nextWorld.isUnlocked ? "" : "4 4"}
                  />
                </svg>
              ) : null}

              <WorldNodeButton
                world={world}
                index={index}
                accent={accent}
                isLocked={isLocked}
                unlockCountLabel={unlockCountLabel}
                onOpenWorld={onOpenWorld}
                style={{
                  ...S.blueprintWorldNode,
                  left: `${x}%`,
                  transform: `translateX(-50%) scale(${isLocked ? 0.9 : 1})`,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";

import { getBlueprintCampaign } from "../lib/blueprint/campaign";
import { findDivergence, getCorrectTrace, runAllTests } from "../lib/blueprint/engine";
import { getBlueprintTemplate } from "../lib/blueprint/templates";
import { shuffle } from "../lib/utils";
import { S } from "../styles";

const DIFF_COLOR = {
  Tutorial: "#10B981",
  Practice: "#F59E0B",
  Boss: "#EF4444",
  Easy: "#10B981",
  Medium: "#F59E0B",
  Hard: "#EF4444",
};

function normalizeStars(stars) {
  const out = {};
  for (const key of Object.keys(stars || {})) {
    const value = Number(stars?.[key] || 0);
    if (!Number.isFinite(value) || value <= 0) continue;
    out[String(key)] = Math.max(0, Math.min(3, Math.round(value)));
  }
  return out;
}

function getLevelStars(starsByLevel, levelId) {
  return Number(starsByLevel?.[String(levelId)] || 0);
}

function getChallengeBadgeColor(challenge) {
  if (challenge?.isBossRush) return "#EF4444";
  if (challenge?.tier === 1) return "#10B981";
  if (challenge?.tier === 2) return "#F59E0B";
  return "#EF4444";
}

export function BlueprintScreen({ goMenu, initialStars, onSaveStars }) {
  const [view, setView] = useState("menu");
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [selectedWorldId, setSelectedWorldId] = useState(1);
  const [completed, setCompleted] = useState(() => normalizeStars(initialStars));

  useEffect(() => {
    setCompleted(normalizeStars(initialStars));
  }, [initialStars]);

  const campaign = useMemo(() => getBlueprintCampaign(completed), [completed]);
  const selectedWorld = useMemo(
    () => campaign.worlds.find((world) => world.id === selectedWorldId) || campaign.worlds[0] || null,
    [campaign.worlds, selectedWorldId]
  );
  const totalStars = useMemo(
    () => Object.values(completed).reduce((sum, value) => sum + Math.max(0, Math.min(3, Number(value) || 0)), 0),
    [completed]
  );

  useEffect(() => {
    if (!selectedWorld || selectedWorld.isUnlocked) return;
    const firstUnlocked = campaign.worlds.find((world) => world.isUnlocked);
    if (firstUnlocked) setSelectedWorldId(firstUnlocked.id);
  }, [campaign.worlds, selectedWorld]);

  const startChallenge = (challenge) => {
    if (!challenge?.level) return;
    setActiveChallenge(challenge);
    setView("game");
  };

  const handleComplete = (id, stars) => {
    const safeId = String(id);
    const nextStars = Math.max(Number(completed?.[safeId] || 0), Number(stars || 0));
    setCompleted((prev) => ({ ...prev, [safeId]: nextStars }));
    onSaveStars?.(safeId, nextStars);
    setView("menu");
  };

  if (view === "game" && activeChallenge?.level) {
    return (
      <BlueprintGame
        level={activeChallenge.level}
        challenge={activeChallenge}
        onBack={() => setView("menu")}
        onComplete={handleComplete}
      />
    );
  }

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

function formatElapsed(ms) {
  const safeMs = Math.max(0, Number(ms) || 0);
  const totalSeconds = Math.round(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function sortCardsForGuided(cards, slotIds) {
  const slotOrder = new Map(slotIds.map((slotId, index) => [slotId, index]));
  return [...cards].sort((a, b) => {
    const slotA = slotOrder.get(a.correctSlot) ?? 999;
    const slotB = slotOrder.get(b.correctSlot) ?? 999;
    if (slotA !== slotB) return slotA - slotB;
    return (a.correctOrder || 0) - (b.correctOrder || 0);
  });
}

function buildHintMessage(card, hintsMode) {
  if (card?.isDistractor) return "This card may be a distractor.";
  if (hintsMode === "limited") return `Focus on the ${String(card?.hint || card?.correctSlot || "correct")} phase.`;
  return `This card belongs in ${card?.hint || card?.correctSlot || "a different slot"}.`;
}

function BlueprintGame({ level, challenge, onBack, onComplete }) {
  const slotDefs = useMemo(() => getBlueprintTemplate(level.templateId).slots, [level.templateId]);
  const slotIds = useMemo(() => slotDefs.map((slot) => slot.id), [slotDefs]);
  const solutionCards = useMemo(() => {
    const required = (level.cards || []).filter((card) => !!card.correctSlot);
    return required.length > 0 ? required : level.cards || [];
  }, [level.cards]);
  const hintsMode = challenge?.hintsMode || (level.hints ? "full" : "none");
  const guided = !!challenge?.guided;
  const hideSlotScaffolding = !!challenge?.hideSlotScaffolding;
  const showPatternLabel = challenge?.showPatternLabel !== false;
  const timeLimitSec = Number(challenge?.timeLimitSec || 180);
  const maxHints = hintsMode === "limited" ? 2 : Number.POSITIVE_INFINITY;
  const orderedSolutionCards = useMemo(() => (guided ? sortCardsForGuided(solutionCards, slotIds) : solutionCards), [guided, solutionCards, slotIds]);

  const [deck, setDeck] = useState([]);
  const [slots, setSlots] = useState({});
  const [selected, setSelected] = useState(null);
  const [draggingCardId, setDraggingCardId] = useState(null);
  const [dragOverSlotId, setDragOverSlotId] = useState(null);
  const [phase, setPhase] = useState("build");
  const [testResults, setTestResults] = useState(null);
  const [execTrace, setExecTrace] = useState([]);
  const [execStep, setExecStep] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [divergence, setDivergence] = useState(null);
  const [showHint, setShowHint] = useState(null);
  const [hintUses, setHintUses] = useState(0);
  const [usedHint, setUsedHint] = useState(false);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [runSummary, setRunSummary] = useState(null);

  useEffect(() => {
    const nextSlots = {};
    for (const slotId of slotIds) nextSlots[slotId] = [];

    setSlots(nextSlots);
    setDeck(guided ? orderedSolutionCards : shuffle(solutionCards));
    setSelected(null);
    setDraggingCardId(null);
    setDragOverSlotId(null);
    setPhase("build");
    setTestResults(null);
    setExecTrace([]);
    setExecStep(0);
    setAttempts(0);
    setDivergence(null);
    setShowHint(null);
    setHintUses(0);
    setUsedHint(false);
    setStartedAt(Date.now());
    setRunSummary(null);
  }, [guided, level.id, orderedSolutionCards, slotIds, solutionCards]);

  const selectedOrGuided = selected || (guided ? deck[0] || null : null);

  const getCardById = (cardId) => {
    if (!cardId) return null;
    const inDeck = deck.find((card) => card.id === cardId);
    if (inDeck) return inDeck;
    for (const slotId of Object.keys(slots)) {
      const inSlot = (slots[slotId] || []).find((card) => card.id === cardId);
      if (inSlot) return inSlot;
    }
    return null;
  };

  const canPlaceCardInSlot = (cardId, slotId) => {
    if (phase !== "build") return false;
    if (!getCardById(cardId)) return false;
    const current = slots[slotId] || [];
    if (current.some((card) => card.id === cardId)) return true;
    const limit = level.slotLimits?.[slotId];
    if (!limit) return true;
    return current.length < limit;
  };

  const placeCardInSlot = (cardId, slotId) => {
    if (!canPlaceCardInSlot(cardId, slotId)) return false;
    const card = getCardById(cardId);
    if (!card) return false;

    setDeck((prev) => prev.filter((item) => item.id !== cardId));
    setSlots((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        next[key] = next[key].filter((item) => item.id !== cardId);
      }
      next[slotId] = [...(next[slotId] || []), card];
      return next;
    });
    setSelected(null);
    return true;
  };

  const getDraggedCardId = (event) => {
    const fromTransfer = event?.dataTransfer?.getData("text/plain");
    return fromTransfer || draggingCardId || "";
  };

  const handleCardClick = (card) => {
    if (phase !== "build") return;
    if (selected?.id === card.id) {
      setSelected(null);
      return;
    }
    setSelected(card);
  };

  const handleSlotClick = (slotId) => {
    if (phase !== "build" || !selectedOrGuided) return;
    placeCardInSlot(selectedOrGuided.id, slotId);
  };

  const removeFromSlot = (card, slotId) => {
    if (phase !== "build") return;
    setSlots((prev) => ({ ...prev, [slotId]: prev[slotId].filter((item) => item.id !== card.id) }));
    setDeck((prev) => [...prev, card]);
    setSelected(null);
  };

  const moveInSlot = (slotId, idx, dir) => {
    if (phase !== "build") return;
    setSlots((prev) => {
      const items = [...(prev[slotId] || [])];
      const nextIdx = idx + dir;
      if (nextIdx < 0 || nextIdx >= items.length) return prev;
      [items[idx], items[nextIdx]] = [items[nextIdx], items[idx]];
      return { ...prev, [slotId]: items };
    });
  };

  const handleRun = () => {
    setAttempts((value) => value + 1);
    const results = runAllTests(level, slots);
    setTestResults(results);

    const firstTrace = results[0]?.trace || [];
    setExecTrace(firstTrace);
    setExecStep(0);
    setPhase("executing");

    const allPassed = results.every((result) => result.passed);
    const elapsedMs = Math.max(0, Date.now() - startedAt);
    const underTime = allPassed && elapsedMs <= timeLimitSec * 1000;
    const noHintBonus = allPassed && !usedHint;
    const stars = allPassed ? 1 + (underTime ? 1 : 0) + (noHintBonus ? 1 : 0) : 0;
    setRunSummary({
      allPassed,
      stars,
      elapsedMs,
      underTime,
      noHintBonus,
      usedHint,
      timeLimitSec,
    });

    if (!allPassed) {
      const correct = getCorrectTrace(level);
      setDivergence(findDivergence(firstTrace, correct.trace));
    } else {
      setDivergence(null);
    }
  };

  const handleReset = () => {
    const nextSlots = {};
    for (const slotId of slotIds) nextSlots[slotId] = [];

    setSlots(nextSlots);
    setDeck(guided ? orderedSolutionCards : shuffle(solutionCards));
    setSelected(null);
    setDraggingCardId(null);
    setDragOverSlotId(null);
    setPhase("build");
    setTestResults(null);
    setExecTrace([]);
    setExecStep(0);
    setDivergence(null);
    setShowHint(null);
    setHintUses(0);
    setUsedHint(false);
    setStartedAt(Date.now());
    setRunSummary(null);
  };

  const handleBackToBuild = () => {
    setPhase("build");
    setTestResults(null);
    setExecTrace([]);
    setExecStep(0);
    setDivergence(null);
    setRunSummary(null);
  };

  const allPassed = !!runSummary?.allPassed;
  const stars = Number(runSummary?.stars || 0);
  const totalPlaced = Object.values(slots).reduce((sum, items) => sum + items.length, 0);
  const requiredCards = solutionCards.length;
  const canRun = requiredCards > 0 && totalPlaced === requiredCards;

  return (
    <div style={S.blueprintContainer}>
      <div style={S.topBar}>
        <button onClick={onBack} style={S.backBtn}>
          {" "}worlds
        </button>
        <span style={S.blueprintTitle}>{level.title}</span>
        <div style={S.blueprintTopMeta}>attempts: {attempts}</div>
      </div>

      <div style={S.blueprintProblemCard}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={{ ...S.diffBadge, color: getChallengeBadgeColor(challenge), borderColor: `${getChallengeBadgeColor(challenge)}55` }}>
            {challenge?.tierIcon || "LVL"} {challenge?.tierRole || level.difficulty}
          </span>
          <span style={{ ...S.diffBadge, color: DIFF_COLOR[level.difficulty] || "var(--text)", borderColor: `${DIFF_COLOR[level.difficulty] || "var(--border)"}45` }}>
            {level.difficulty}
          </span>
          <span style={S.blueprintPatternBadge}>{showPatternLabel ? level.pattern : "pattern hidden"}</span>
        </div>
        {challenge?.isBossRush ? (
          <div style={{ fontSize: 12, color: "var(--warn)" }}>Boss rush mode: identify the pattern yourself.</div>
        ) : null}
        <p style={S.blueprintProblemText}>{level.description}</p>
        <pre style={S.blueprintExample}>{level.example}</pre>
        <div style={{ ...S.blueprintTopMeta, minWidth: "auto", textAlign: "left", display: "flex", gap: 14, flexWrap: "wrap" }}>
          <span>solution cards: {totalPlaced}/{requiredCards}</span>
          <span>time limit: {formatElapsed(timeLimitSec * 1000)}</span>
          {hintsMode === "limited" ? <span>hint budget: {Math.max(0, maxHints - hintUses)}</span> : null}
        </div>
      </div>

      {phase === "build" && (
        <>
          <div style={S.blueprintSlotList}>
            {slotDefs.map((meta, slotIndex) => {
              const slotId = meta.id;
              const cards = slots[slotId] || [];
              const limit = level.slotLimits?.[slotId];
              const activeCardId = selectedOrGuided?.id || draggingCardId;
              const canDropHere = !!activeCardId && canPlaceCardInSlot(activeCardId, slotId);
              const isDragOver = dragOverSlotId === slotId && canDropHere;
              const isTarget = canDropHere;
              const displayMeta = hideSlotScaffolding
                ? { ...meta, icon: String(slotIndex + 1), name: `Slot ${slotIndex + 1}`, desc: "Place a core step" }
                : meta;

              return (
                <div
                  key={slotId}
                  data-testid={`blueprint-slot-${slotId}`}
                  onClick={() => handleSlotClick(slotId)}
                  onDragOver={(event) => {
                    const cardId = getDraggedCardId(event);
                    if (!canPlaceCardInSlot(cardId, slotId)) return;
                    event.preventDefault();
                    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
                    setDragOverSlotId(slotId);
                  }}
                  onDragLeave={() => {
                    if (dragOverSlotId === slotId) setDragOverSlotId(null);
                  }}
                  onDrop={(event) => {
                    const cardId = getDraggedCardId(event);
                    if (!canPlaceCardInSlot(cardId, slotId)) return;
                    event.preventDefault();
                    placeCardInSlot(cardId, slotId);
                    setDragOverSlotId(null);
                    setDraggingCardId(null);
                  }}
                  style={{
                    ...S.blueprintSlot,
                    borderColor: isDragOver ? `${displayMeta.color}` : isTarget ? `${displayMeta.color}88` : "var(--border)",
                    background: isDragOver ? `${displayMeta.color}22` : isTarget ? `${displayMeta.color}10` : "var(--surface-1)",
                    cursor: isTarget ? "pointer" : "default",
                  }}
                >
                  <div style={S.blueprintSlotHeader}>
                    <span style={{ ...S.blueprintSlotIcon, color: displayMeta.color }}>{displayMeta.icon}</span>
                    <span style={{ ...S.blueprintSlotName, color: displayMeta.color }}>{displayMeta.name}</span>
                    <span style={S.blueprintSlotDesc}>{displayMeta.desc}</span>
                    {limit ? <span style={S.blueprintSlotLimit}>{cards.length}/{limit}</span> : null}
                  </div>

                  <div style={S.blueprintSlotCards}>
                    {cards.length === 0 ? (
                      <div style={S.blueprintSlotEmpty}>
                        {isDragOver ? "Drop card here" : isTarget ? "Click to place selected card" : "Empty"}
                      </div>
                    ) : null}

                    {cards.map((card, idx) => (
                      <div key={card.id} style={S.blueprintPlacedRow}>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            removeFromSlot(card, slotId);
                          }}
                          style={{
                            ...S.blueprintPlacedCard,
                            borderLeftColor: displayMeta.color,
                          }}
                        >
                          <pre style={S.blueprintCardCode}>{card.text}</pre>
                          <span style={S.blueprintRemove}>remove</span>
                        </button>
                        {cards.length > 1 ? (
                          <div style={S.blueprintReorderCol}>
                            {idx > 0 ? (
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  moveInSlot(slotId, idx, -1);
                                }}
                                style={S.blueprintReorderBtn}
                              >
                                up
                              </button>
                            ) : null}
                            {idx < cards.length - 1 ? (
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  moveInSlot(slotId, idx, 1);
                                }}
                                style={S.blueprintReorderBtn}
                              >
                                down
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={S.blueprintDeckArea}>
            <div style={S.sectionLabel}>
              card deck
              {hintsMode === "limited" ? ` | hints left: ${Math.max(0, maxHints - hintUses)}` : ""}
            </div>
            <div style={S.blueprintDeckRow}>
              {deck.map((card, deckIndex) => {
                const guidedSelected = guided && !selected && deckIndex === 0;
                const isSelected = selected?.id === card.id || guidedSelected;
                const canOpenHint = showHint === card.id || hintUses < maxHints;
                return (
                  <button
                    key={card.id}
                    data-testid={`blueprint-deck-card-${card.id}`}
                    draggable={phase === "build"}
                    onDragStart={(event) => {
                      if (event.dataTransfer) {
                        event.dataTransfer.setData("text/plain", card.id);
                        event.dataTransfer.effectAllowed = "move";
                      }
                      setDraggingCardId(card.id);
                    }}
                    onDragEnd={() => {
                      setDraggingCardId(null);
                      setDragOverSlotId(null);
                    }}
                    onClick={() => handleCardClick(card)}
                    style={{
                      ...S.blueprintDeckCard,
                      borderColor: isSelected ? "var(--accent)" : "var(--border)",
                      background: isSelected ? "rgba(16, 185, 129, 0.1)" : "var(--surface-1)",
                    }}
                  >
                    <pre style={S.blueprintCardCode}>{card.text}</pre>
                    {hintsMode !== "none" ? (
                      <span
                        role="button"
                        tabIndex={0}
                        style={{ ...S.blueprintHintBtn, opacity: canOpenHint ? 1 : 0.4, cursor: canOpenHint ? "pointer" : "not-allowed" }}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (showHint === card.id) {
                            setShowHint(null);
                            return;
                          }
                          if (!canOpenHint) return;
                          setShowHint(card.id);
                          setHintUses((value) => value + 1);
                          setUsedHint(true);
                        }}
                        onKeyDown={(event) => {
                          if (event.key !== "Enter" && event.key !== " ") return;
                          event.preventDefault();
                          event.stopPropagation();
                          if (showHint === card.id) {
                            setShowHint(null);
                            return;
                          }
                          if (!canOpenHint) return;
                          setShowHint(card.id);
                          setHintUses((value) => value + 1);
                          setUsedHint(true);
                        }}
                        title={canOpenHint ? "hint" : "hint limit reached"}
                      >
                        ?
                      </span>
                    ) : null}
                    {hintsMode !== "none" && showHint === card.id ? (
                      <div style={S.blueprintHintBubble}>{buildHintMessage(card, hintsMode)}</div>
                    ) : null}
                  </button>
                );
              })}
              {deck.length === 0 ? <div style={S.blueprintSlotEmpty}>All cards placed.</div> : null}
            </div>
          </div>

          <div style={S.actionBar}>
            <button onClick={handleReset} style={S.resetBtn}>
              reset
            </button>
            <button
              onClick={handleRun}
              disabled={!canRun}
              style={{
                ...S.startBtn,
                padding: "10px 20px",
                opacity: canRun ? 1 : 0.45,
                cursor: canRun ? "pointer" : "not-allowed",
              }}
            >
              Run Blueprint
            </button>
          </div>
        </>
      )}

      {phase === "executing" ? (
        <BlueprintExecution
          trace={execTrace}
          step={execStep}
          setStep={setExecStep}
          testResults={testResults}
          allPassed={!!allPassed}
          divergence={divergence}
          runSummary={runSummary}
          onBackToBuild={handleBackToBuild}
          onComplete={() => onComplete(level.id, stars)}
          onReset={handleReset}
        />
      ) : null}
    </div>
  );
}

function BlueprintExecution({
  trace,
  step,
  setStep,
  testResults,
  allPassed,
  divergence,
  runSummary,
  onBackToBuild,
  onComplete,
  onReset,
}) {
  const current = trace[step];
  const phaseColor = {
    setup: "#818CF8",
    update: "#60A5FA",
    check: "#FBBF24",
    return: "#F472B6",
    loop: "#34D399",
    error: "#EF4444",
  };

  return (
    <div style={S.blueprintExecutionWrap}>
      <div style={S.blueprintExecCard}>
        <div style={S.execHeader}>
          <span style={S.execLabel}>execution trace</span>
          <span style={S.blueprintTopMeta}>
            step {Math.min(step + 1, Math.max(trace.length, 1))}/{Math.max(trace.length, 1)}
          </span>
        </div>

        {current ? (
          <>
            <div style={S.blueprintPhaseRow}>
              <span style={{ ...S.phasePill, background: `${phaseColor[current.phase] || "#64748B"}22`, color: phaseColor[current.phase] || "var(--dim)" }}>
                {current.phase}
              </span>
              {current.iteration !== undefined ? <span style={S.blueprintTopMeta}>iteration {current.iteration}</span> : null}
            </div>

            <div style={S.execCard}>
              <pre style={S.blueprintCardCode}>{current.card}</pre>
            </div>

            {current.arr ? (
              <div style={S.blueprintArrayRow}>
                {current.arr.map((value, index) => {
                  const isLeft = current.pointers?.left === index;
                  const isRight = current.pointers?.right === index;
                  const hasWindow =
                    current.pointers?.left !== undefined &&
                    current.pointers?.right !== undefined &&
                    index >= current.pointers.left &&
                    index <= current.pointers.right;

                  return (
                    <div key={index} style={S.blueprintArrayCellWrap}>
                      <div
                        style={{
                          ...S.blueprintArrayCell,
                          background: hasWindow ? "rgba(16, 185, 129, 0.14)" : "var(--surface-1)",
                          borderColor: isLeft ? "#818CF8" : isRight ? "#F472B6" : hasWindow ? "rgba(16, 185, 129, 0.45)" : "var(--border)",
                        }}
                      >
                        {String(value)}
                      </div>
                      <span style={S.blueprintArrayMarker}>{isLeft && isRight ? "L,R" : isLeft ? "L" : isRight ? "R" : ""}</span>
                    </div>
                  );
                })}
              </div>
            ) : null}

            <div style={S.stateBox}>
              <div style={S.blueprintStateLabel}>state</div>
              <div style={S.blueprintStateVars}>
                {Object.entries(current.state || {})
                  .filter(([key, value]) => key !== "seen" || typeof value === "string")
                  .map(([key, value]) => (
                    <div key={key} style={S.stateVar}>
                      <span style={{ color: "var(--dim)" }}>{key}</span>
                      <span style={{ color: "var(--text-strong)", fontWeight: 700 }}>
                        {typeof value === "object" ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {current.result !== undefined ? (
              <div style={S.blueprintResultPill}>result: {JSON.stringify(current.result)}</div>
            ) : null}
          </>
        ) : null}

        <div style={S.stepControls}>
          <button onClick={() => setStep(0)} disabled={step === 0} style={{ ...S.stepBtn, opacity: step === 0 ? 0.4 : 1 }}>
            first
          </button>
          <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} style={{ ...S.stepBtn, opacity: step === 0 ? 0.4 : 1 }}>
            prev
          </button>
          <button
            onClick={() => setStep(Math.min(trace.length - 1, step + 1))}
            disabled={step >= trace.length - 1}
            style={{ ...S.stepBtn, opacity: step >= trace.length - 1 ? 0.4 : 1 }}
          >
            next
          </button>
          <button
            onClick={() => setStep(Math.max(trace.length - 1, 0))}
            disabled={step >= trace.length - 1}
            style={{ ...S.stepBtn, opacity: step >= trace.length - 1 ? 0.4 : 1 }}
          >
            last
          </button>
        </div>
      </div>

      <div style={S.resultsPanel}>
        <div style={S.execLabel}>test cases</div>
        {testResults?.map((result, index) => (
          <div key={index} style={{ ...S.testRow, borderLeftColor: result.passed ? "var(--accent)" : "var(--danger)" }}>
            <div style={S.blueprintTestBody}>
              <div style={S.blueprintTestLine}>input: {JSON.stringify(result.input)}</div>
              <div style={S.blueprintTestLine}>expected: {JSON.stringify(result.expected)}</div>
              {!result.passed ? <div style={{ ...S.blueprintTestLine, color: "var(--danger)" }}>got: {JSON.stringify(result.got)}</div> : null}
            </div>
          </div>
        ))}
      </div>

      {!allPassed && divergence ? (
        <div style={{ ...S.feedbackBox, borderColor: "rgba(245, 158, 11, 0.4)", background: "rgba(245, 158, 11, 0.08)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--warn)", marginBottom: 8 }}>Where it diverged</div>
          <p style={S.blueprintFeedbackText}>
            Divergence at step {divergence.step + 1} in {divergence.player?.phase || "unknown"} phase.
          </p>
          <p style={S.blueprintFeedbackText}>
            Check card order in the {divergence.player?.phase || "current"} slot.
          </p>
        </div>
      ) : null}

      {allPassed ? (
        <div style={{ ...S.feedbackBox, borderColor: "rgba(16, 185, 129, 0.45)", background: "rgba(16, 185, 129, 0.08)" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--accent)", textAlign: "center" }}>Blueprint Correct</div>
          <div style={S.blueprintStarRow}>
            {[1, 2, 3].map((n) => (
              <span key={n} style={{ ...S.blueprintStar, color: n <= Number(runSummary?.stars || 0) ? "var(--warn)" : "var(--faint)" }}>
                *
              </span>
            ))}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
            <div>1 star: complete the level</div>
            <div style={{ color: runSummary?.underTime ? "var(--accent)" : "var(--dim)" }}>
              +1 star: finish under {formatElapsed((runSummary?.timeLimitSec || 0) * 1000)} ({formatElapsed(runSummary?.elapsedMs)})
            </div>
            <div style={{ color: runSummary?.noHintBonus ? "var(--accent)" : "var(--dim)" }}>
              +1 star: no hint button usage
            </div>
          </div>
        </div>
      ) : null}

      <div style={S.actionBar}>
        {!allPassed ? (
          <>
            <button onClick={onBackToBuild} style={S.resetBtn}>
              edit blueprint
            </button>
            <button onClick={onReset} style={S.resetBtn}>
              reset all
            </button>
          </>
        ) : (
          <button onClick={onComplete} style={{ ...S.startBtn, padding: "10px 20px" }}>
            continue
          </button>
        )}
      </div>
    </div>
  );
}

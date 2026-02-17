import { useEffect, useRef, useState } from "react";

import { S } from "../../styles";
import { BlueprintExecution } from "./BlueprintExecution";
import { buildHintMessage, DIFF_COLOR, formatElapsed, getChallengeBadgeColor } from "./shared";
import { useBlueprintGameSession } from "./useBlueprintGameSession";

function getStepBadgeLabel(meta) {
  const explicit = String(meta?.icon || "").trim();
  if (/^\d+$/.test(explicit)) return explicit;

  const name = String(meta?.name || "").trim();
  const match = name.match(/[A-Za-z0-9]/);
  if (match?.[0]) return match[0].toUpperCase();
  return explicit || "#";
}

function getFeedbackTone(status) {
  if (status === "correct") return "var(--accent)";
  if (status === "misplaced") return "var(--warn)";
  if (status === "phase-error") return "var(--danger)";
  if (status === "wrong-phase") return "var(--danger)";
  return "var(--dim)";
}

function getFeedbackLabel(status) {
  if (status === "correct") return "correct";
  if (status === "misplaced") return "misplaced";
  if (status === "phase-error") return "incorrect";
  if (status === "wrong-phase") return "wrong phase";
  return "";
}

export function BlueprintGame({
  level,
  challenge,
  onBack,
  onComplete,
  onTutorialRun = () => {},
  onTutorialPass = () => {},
  onHintUsed = () => {},
}) {
  const slotFlashTimeoutRef = useRef(null);
  const popTimeoutRef = useRef(null);
  const shakeTimeoutRef = useRef(null);
  const passSignalRef = useRef(false);

  const [showProblem, setShowProblem] = useState(false);
  const [flashedSlotId, setFlashedSlotId] = useState(null);
  const [poppedCardId, setPoppedCardId] = useState("");
  const [shakingCardId, setShakingCardId] = useState("");
  const [completionOverlay, setCompletionOverlay] = useState(null);

  const {
    slotDefs,
    hintsMode,
    guided,
    hideSlotScaffolding,
    showPatternLabel,
    timeLimitSec,
    maxHints,
    solveMode,
    activePhaseSlotIds,
    phaseStatesBySlotId,
    mistakes,
    deck,
    slots,
    selected,
    requiredCardCountBySlot,
    placedSlotIdByCardId,
    phase,
    testResults,
    execTrace,
    execStep,
    attempts,
    divergence,
    showHint,
    hintUses,
    runSummary,
    cardFeedbackById,
    dependencyWarning,
    allPassed,
    stars,
    totalPlaced,
    requiredCards,
    remainingRequiredCards,
    canRun,
    canCheckActivePhase,
    checkButtonLabel,
    elapsedMs,
    timeRemainingMs,
    setExecStep,
    previewPlacementWarning,
    clearDependencyWarning,
    isSlotInteractive,
    canPlaceCardInSlot,
    placeCardInSlot,
    handleCardClick,
    removeFromSlot,
    handleCheckActivePhase,
    handleRun,
    handleReset,
    handleBackToBuild,
    toggleHint,
  } = useBlueprintGameSession({ level, challenge });

  useEffect(() => (
    () => {
      if (slotFlashTimeoutRef.current) clearTimeout(slotFlashTimeoutRef.current);
      if (popTimeoutRef.current) clearTimeout(popTimeoutRef.current);
      if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
    }
  ), []);

  useEffect(() => {
    if (!allPassed) {
      passSignalRef.current = false;
      return;
    }
    if (passSignalRef.current) return;
    passSignalRef.current = true;
    onTutorialPass(stars);
  }, [allPassed, onTutorialPass, stars]);

  useEffect(() => {
    if (!allPassed) {
      setCompletionOverlay(null);
      return;
    }
    setCompletionOverlay((prev) => {
      if (prev) return prev;
      return {
        elapsedMs: Math.max(0, Number(runSummary?.elapsedMs ?? elapsedMs ?? 0)),
        stars: Math.max(1, Number(stars || 1)),
      };
    });
  }, [allPassed, elapsedMs, runSummary?.elapsedMs, stars]);

  const triggerSlotFlash = (slotId) => {
    setFlashedSlotId(slotId);
    if (slotFlashTimeoutRef.current) clearTimeout(slotFlashTimeoutRef.current);
    slotFlashTimeoutRef.current = setTimeout(() => {
      setFlashedSlotId((prev) => (prev === slotId ? null : prev));
    }, 260);
  };

  const triggerCardPop = (cardId) => {
    setPoppedCardId(cardId);
    if (popTimeoutRef.current) clearTimeout(popTimeoutRef.current);
    popTimeoutRef.current = setTimeout(() => {
      setPoppedCardId((prev) => (prev === cardId ? "" : prev));
    }, 280);
  };

  const triggerCardShake = (cardId) => {
    if (!cardId) return;
    setShakingCardId(cardId);
    if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
    shakeTimeoutRef.current = setTimeout(() => {
      setShakingCardId((prev) => (prev === cardId ? "" : prev));
    }, 380);
  };

  const hintsRemaining = hintsMode === "limited" ? String(Math.max(0, maxHints - hintUses)) : hintsMode === "none" ? "off" : "inf";
  const timerColor = phase === "build"
    ? (timeRemainingMs <= 0 ? "var(--danger)" : timeRemainingMs <= 30000 ? "var(--warn)" : "var(--dim)")
    : "var(--dim)";
  const timerLabel = phase === "build"
    ? `left ${formatElapsed(timeRemainingMs)}`
    : `time ${formatElapsed(runSummary?.elapsedMs ?? elapsedMs)}`;
  const progressPercent = requiredCards > 0
    ? Math.max(0, Math.min(100, Math.round((totalPlaced / requiredCards) * 100)))
    : 0;

  const handleRunWithSignals = () => {
    onTutorialRun();
    handleRun();
  };

  const handleToggleHint = (cardId, canOpenHint) => {
    const willOpenHint = showHint !== cardId && canOpenHint;
    toggleHint(cardId, canOpenHint);
    if (willOpenHint) onHintUsed();
  };

  const handleSlotTap = (slotId) => {
    if (phase !== "build") return;
    if (!isSlotInteractive(slotId)) return;
    if (!selected?.id) return;

    const cardId = selected.id;
    const canPlace = canPlaceCardInSlot(cardId, slotId);

    if (!canPlace) {
      clearDependencyWarning();
      triggerCardShake(cardId);
      return;
    }

    previewPlacementWarning(cardId, slotId);
    const placed = placeCardInSlot(cardId, slotId);
    if (!placed) {
      triggerCardShake(cardId);
      return;
    }

    triggerSlotFlash(slotId);
    triggerCardPop(cardId);
  };

  const handleResetWithOverlay = () => {
    setCompletionOverlay(null);
    setShakingCardId("");
    setPoppedCardId("");
    handleReset();
  };

  const handleBackToBuildWithOverlay = () => {
    setCompletionOverlay(null);
    handleBackToBuild();
  };

  const handleContinue = () => {
    const safeStars = Math.max(1, Number(completionOverlay?.stars || stars || 1));
    onComplete(level.id, safeStars);
  };

  const handlePhaseCheck = () => {
    handleCheckActivePhase();
  };

  const showTapHintBar = phase === "build" && totalPlaced < 2;
  const hintBarText = selected
    ? "Card selected. Tap its matching blueprint section to place it."
    : "Tap a card in the tray, then tap the matching blueprint section.";

  return (
    <div style={{ ...S.blueprintContainer, paddingBottom: phase === "build" ? 24 : 24 }}>
      <div style={S.topBar}>
        <button onClick={onBack} style={S.backBtn}>
          {" "}worlds
        </button>
        <span style={{ ...S.blueprintTitle, flex: 1, textAlign: "center", margin: "0 10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {level.title}
        </span>
        <button
          onClick={() => setShowProblem((value) => !value)}
          style={{ ...S.blueprintSheetClose, width: 34, height: 34 }}
          title={showProblem ? "Hide problem" : "Show problem"}
          aria-label={showProblem ? "Hide problem" : "Show problem"}
        >
          ?
        </button>
      </div>

      {showTapHintBar ? (
        <div style={S.blueprintTapHintBar}>{hintBarText}</div>
      ) : null}

      <div style={S.blueprintStatsStrip}>
        <span data-testid="blueprint-solve-mode" style={S.blueprintStatsItem}>mode {solveMode}</span>
        <div style={S.blueprintHeaderProgressWrap}>
          <div style={S.blueprintHeaderProgressTrack}>
            <div style={{ ...S.blueprintHeaderProgressFill, width: `${progressPercent}%` }} />
          </div>
          <span data-testid="blueprint-progress-counter" style={S.blueprintHeaderProgressLabel}>{totalPlaced}/{requiredCards} cards</span>
        </div>
        <span style={S.blueprintStatsItem}>hints {hintsRemaining}</span>
        <span style={{ ...S.blueprintStatsItem, color: timerColor }}>{timerLabel}</span>
        {solveMode === "phased" ? (
          <span style={S.blueprintStatsItem}>mistakes {mistakes}</span>
        ) : (
          <span style={S.blueprintStatsItem}>attempts {attempts}</span>
        )}
      </div>

      {phase === "build" && dependencyWarning ? (
        <div data-testid="blueprint-dependency-warning" style={S.blueprintDependencyWarning}>
          {dependencyWarning}
        </div>
      ) : null}

      {showProblem ? (
        <div data-testid="blueprint-problem-card" style={S.blueprintProblemCard}>
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
        </div>
      ) : null}

      {phase === "build" ? (
        <>
          <div style={S.blueprintBuildBoard}>
            <div data-tutorial-anchor="blueprint-card-tray" data-testid="blueprint-card-tray" style={S.blueprintTrayPane}>
              <div style={S.blueprintPaneHeader}>
                <span style={S.blueprintDeckLabel}>card tray</span>
                <span style={S.blueprintTopMeta}>{remainingRequiredCards} remaining</span>
              </div>
              <div style={S.blueprintTrayList}>
                {deck.map((card, deckIndex) => {
                  const guidedSelected = solveMode === "flat" && guided && !selected && deckIndex === 0;
                  const isSelected = selected?.id === card.id || guidedSelected;
                  const canOpenHint = showHint === card.id || hintUses < maxHints;
                  const placedSlotId = placedSlotIdByCardId?.[String(card.id)] || "";
                  const isPlaced = !!placedSlotId;
                  const isShaking = shakingCardId === card.id;

                  return (
                    <button
                      key={card.id}
                      data-testid={`blueprint-deck-card-${card.id}`}
                      onClick={() => {
                        if (isPlaced) return;
                        handleCardClick(card);
                      }}
                      style={{
                        ...S.blueprintTrayCard,
                        borderColor: isSelected ? "var(--accent)" : "var(--border)",
                        background: isSelected ? "rgba(16, 185, 129, 0.11)" : "var(--surface-1)",
                        opacity: isPlaced ? 0.45 : 1,
                        cursor: isPlaced ? "default" : "pointer",
                        animation: isShaking
                          ? "blueprintWrongShake 0.34s ease"
                          : isSelected
                            ? "blueprintCardPulse 1.2s ease-in-out infinite"
                            : "none",
                      }}
                    >
                      <div style={S.blueprintTrayCardInner}>
                        <pre style={S.blueprintCardCode}>{card.text}</pre>
                        {hintsMode !== "none" && showHint === card.id ? (
                          <div style={S.blueprintHintBubble}>{buildHintMessage(card, hintsMode)}</div>
                        ) : null}
                        {isPlaced ? (
                          <span style={S.blueprintTrayPlacedBadge} aria-label="placed">
                            check
                          </span>
                        ) : null}
                        {hintsMode !== "none" && !isPlaced ? (
                          <span
                            role="button"
                            tabIndex={0}
                            data-blueprint-hint-btn="true"
                            style={{ ...S.blueprintHintBtn, opacity: canOpenHint ? 1 : 0.4, cursor: canOpenHint ? "pointer" : "not-allowed" }}
                            onClick={(event) => {
                              event.stopPropagation();
                              handleToggleHint(card.id, canOpenHint);
                            }}
                            onKeyDown={(event) => {
                              if (event.key !== "Enter" && event.key !== " ") return;
                              event.preventDefault();
                              event.stopPropagation();
                              handleToggleHint(card.id, canOpenHint);
                            }}
                            title={canOpenHint ? "hint" : "hint limit reached"}
                          >
                            ?
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={S.blueprintPaneSlots}>
              <div style={S.blueprintPaneHeader}>
                <span style={S.blueprintDeckLabel}>blueprint</span>
                <span style={S.blueprintTopMeta}>tap to place</span>
              </div>
              <div style={S.blueprintSlotList}>
                {slotDefs.map((meta, slotIndex) => {
                  const slotId = meta.id;
                  const cards = slots[slotId] || [];
                  const expectedCount = Math.max(0, Number(requiredCardCountBySlot?.[slotId] || 0));
                  const placeholders = Math.max(0, expectedCount - cards.length);
                  const slotSolveState = phaseStatesBySlotId?.[slotId] || "active";
                  const slotInteractive = isSlotInteractive(slotId);
                  const displayMeta = hideSlotScaffolding
                    ? { ...meta, icon: String(slotIndex + 1), name: `Slot ${slotIndex + 1}`, desc: "Place a core step" }
                    : meta;
                  const canPlaceSelected = !!selected?.id && canPlaceCardInSlot(selected.id, slotId);
                  const isPhaseLocked = solveMode === "phased" && slotSolveState === "locked";
                  const isSectionComplete = expectedCount > 0 && cards.length >= expectedCount;
                  const shouldFlash = flashedSlotId === slotId;
                  const hasTapAffordance = !!selected?.id && canPlaceSelected && slotInteractive;

                  return (
                    <div
                      key={slotId}
                      data-tutorial-anchor={slotIndex === 0 ? "blueprint-slot-row" : undefined}
                      data-testid={`blueprint-slot-${slotId}`}
                      data-blueprint-phase-state={slotSolveState}
                      data-blueprint-slot-id={slotId}
                      onClick={() => handleSlotTap(slotId)}
                      style={{
                        ...S.blueprintSectionCard,
                        borderColor: isSectionComplete ? displayMeta.color : shouldFlash ? `${displayMeta.color}` : "var(--border)",
                        boxShadow: isSectionComplete
                          ? `0 0 0 1px ${displayMeta.color} inset`
                          : shouldFlash
                            ? `0 0 0 1px ${displayMeta.color} inset`
                            : "none",
                        background: shouldFlash
                          ? `${displayMeta.color}24`
                          : isPhaseLocked
                            ? "rgba(100, 116, 139, 0.1)"
                            : "var(--surface-1)",
                        opacity: isPhaseLocked ? 0.56 : 1,
                        cursor: slotInteractive && selected?.id ? (canPlaceSelected ? "pointer" : "not-allowed") : "default",
                      }}
                    >
                      <div style={S.blueprintSectionHeader}>
                        <span style={{ ...S.blueprintSlotIcon, color: displayMeta.color, borderColor: `${displayMeta.color}66` }}>{getStepBadgeLabel(displayMeta)}</span>
                        <div style={S.blueprintSectionMeta}>
                          <span style={{ ...S.blueprintSlotName, color: displayMeta.color }}>{displayMeta.name}</span>
                          <span style={S.blueprintSlotDesc}>{displayMeta.desc}</span>
                        </div>
                        <span style={{ ...S.blueprintSlotLimit, color: displayMeta.color, borderColor: `${displayMeta.color}55` }}>
                          {cards.length}/{expectedCount}
                        </span>
                      </div>

                      {solveMode === "phased" ? (
                        <span
                          data-testid={`blueprint-phase-state-${slotId}`}
                          data-slot-id={slotId}
                          style={{
                            ...S.blueprintTopMeta,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            color: slotSolveState === "active" ? "var(--accent)" : slotSolveState === "completed" ? displayMeta.color : "var(--dim)",
                          }}
                        >
                          {slotSolveState}
                        </span>
                      ) : null}

                      {hasTapAffordance ? (
                        <div style={{ ...S.blueprintTopMeta, color: displayMeta.color }}>tap to place</div>
                      ) : null}

                      <div style={S.blueprintSectionSlots}>
                        {cards.map((card) => {
                          const feedback = cardFeedbackById?.[card.id] || null;
                          const feedbackTone = getFeedbackTone(feedback?.status);
                          const isPopped = poppedCardId === card.id;
                          return (
                            <div
                              key={card.id}
                              data-testid={`blueprint-placed-card-${card.id}`}
                              style={{
                                ...S.blueprintSectionPlacedCard,
                                borderColor: `${displayMeta.color}4D`,
                                animation: isPopped ? "blueprintCardPopIn 0.24s ease" : "none",
                              }}
                              onClick={(event) => event.stopPropagation()}
                            >
                              <pre style={S.blueprintCardCode}>{card.text}</pre>
                              <div style={S.blueprintPlacedActions}>
                                {feedback ? (
                                  <span
                                    data-testid={`blueprint-card-feedback-${card.id}`}
                                    style={{
                                      ...S.blueprintFeedbackBadge,
                                      color: feedbackTone,
                                      borderColor: `${feedbackTone}66`,
                                      background: `${feedbackTone}1A`,
                                    }}
                                  >
                                    {getFeedbackLabel(feedback.status)}
                                  </span>
                                ) : <span />}
                                <button
                                  data-testid={`blueprint-undo-card-${card.id}`}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    removeFromSlot(card, slotId);
                                  }}
                                  style={S.blueprintInlineUndoBtn}
                                  aria-label="Undo card placement"
                                >
                                  x
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {placeholders > 0
                          ? Array.from({ length: placeholders }).map((_, idx) => (
                            <div key={`${slotId}-placeholder-${idx}`} style={S.blueprintSectionPlaceholder} />
                          ))
                          : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={S.actionBar}>
            <button onClick={handleResetWithOverlay} style={S.resetBtn}>
              retry
            </button>
            {solveMode === "flat" ? (
              <button
                data-tutorial-anchor="blueprint-run-button"
                onClick={handleRunWithSignals}
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
            ) : canCheckActivePhase ? (
              <button
                data-testid="blueprint-check-phase-btn"
                onClick={handlePhaseCheck}
                style={{
                  ...S.startBtn,
                  padding: "10px 20px",
                  cursor: "pointer",
                }}
              >
                {checkButtonLabel}
              </button>
            ) : (
              <span style={S.blueprintTopMeta}>
                Fill {(checkButtonLabel || "").replace(/^Check\s+/i, "") || activePhaseSlotIds[0] || "phase"}
              </span>
            )}
          </div>
        </>
      ) : null}

      {phase === "executing" && solveMode === "flat" ? (
        <BlueprintExecution
          trace={execTrace}
          step={execStep}
          setStep={setExecStep}
          testResults={testResults}
          allPassed={allPassed}
          divergence={divergence}
          runSummary={runSummary}
          onBackToBuild={handleBackToBuildWithOverlay}
          onComplete={handleContinue}
          onReset={handleResetWithOverlay}
        />
      ) : null}

      {completionOverlay ? (
        <div style={S.blueprintCompletionScrim}>
          <div style={S.blueprintCompletionCard}>
            <div style={S.blueprintTitle}>Puzzle complete</div>
            <div style={S.blueprintTopMeta}>time {formatElapsed(completionOverlay.elapsedMs)}</div>
            <div style={{ ...S.blueprintTopMeta, color: "var(--warn)", marginTop: -4 }}>stars {completionOverlay.stars}</div>
            <div style={S.blueprintCompletionActions}>
              <button onClick={handleResetWithOverlay} style={S.resetBtn}>retry</button>
              <button onClick={handleContinue} style={{ ...S.startBtn, padding: "10px 18px" }}>continue</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

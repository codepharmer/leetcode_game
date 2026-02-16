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

export function BlueprintGame({ level, challenge, onBack, onComplete }) {
  const touchDragRef = useRef({
    pointerId: null,
    cardId: null,
    cardText: "",
    startX: 0,
    startY: 0,
    dragging: false,
  });
  const touchGhostRef = useRef(null);
  const suppressClickCardIdRef = useRef(null);
  const dropFlashTimeoutRef = useRef(null);
  const [touchGhost, setTouchGhost] = useState({ visible: false, text: "" });
  const [showProblem, setShowProblem] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState(null);
  const [flashedSlotId, setFlashedSlotId] = useState(null);

  const {
    slotDefs,
    hintsMode,
    guided,
    hideSlotScaffolding,
    showPatternLabel,
    timeLimitSec,
    maxHints,
    solveMode,
    activePhaseIndex,
    activePhaseSlotIds,
    phaseStatesBySlotId,
    mistakes,
    deck,
    slots,
    selected,
    selectedOrGuided,
    draggingCardId,
    dragOverSlotId,
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
    canRun,
    canCheckActivePhase,
    checkButtonLabel,
    elapsedMs,
    timeRemainingMs,
    setExecStep,
    setDraggingCardId,
    setDragOverSlotId,
    getDraggedCardId,
    clearDragState,
    previewPlacementWarning,
    clearDependencyWarning,
    isSlotInteractive,
    canPlaceCardInSlot,
    placeCardInSlot,
    handleCardClick,
    handleSlotClick,
    removeFromSlot,
    moveInSlot,
    handleCheckActivePhase,
    handleRun,
    handleReset,
    handleBackToBuild,
    toggleHint,
  } = useBlueprintGameSession({ level, challenge });

  useEffect(() => (
    () => {
      if (dropFlashTimeoutRef.current) clearTimeout(dropFlashTimeoutRef.current);
    }
  ), []);

  useEffect(() => {
    if (phase !== "build") setEditingSlotId(null);
  }, [phase]);

  useEffect(() => {
    if (!editingSlotId) return;
    if (!isSlotInteractive(editingSlotId)) {
      setEditingSlotId(null);
      return;
    }
    if ((slots[editingSlotId] || []).length > 0) return;
    setEditingSlotId(null);
  }, [editingSlotId, isSlotInteractive, slots]);

  const getSlotIdAtPoint = (x, y) => {
    if (typeof document === "undefined" || typeof document.elementFromPoint !== "function") return null;
    const target = document.elementFromPoint(x, y);
    const slotEl = target?.closest?.("[data-blueprint-slot-id]");
    return slotEl?.getAttribute("data-blueprint-slot-id") || null;
  };

  const positionTouchGhost = (x, y) => {
    const ghost = touchGhostRef.current;
    if (!ghost) return;
    ghost.style.transform = `translate3d(${Math.round(x + 14)}px, ${Math.round(y + 14)}px, 0)`;
  };

  const hideTouchGhost = () => {
    setTouchGhost({ visible: false, text: "" });
    const ghost = touchGhostRef.current;
    if (!ghost) return;
    ghost.style.transform = "translate3d(-9999px, -9999px, 0)";
  };

  const resetTouchDrag = () => {
    touchDragRef.current = {
      pointerId: null,
      cardId: null,
      cardText: "",
      startX: 0,
      startY: 0,
      dragging: false,
    };
  };

  const triggerSlotFlash = (slotId) => {
    setFlashedSlotId(slotId);
    if (dropFlashTimeoutRef.current) clearTimeout(dropFlashTimeoutRef.current);
    dropFlashTimeoutRef.current = setTimeout(() => {
      setFlashedSlotId((prev) => (prev === slotId ? null : prev));
    }, 240);
  };

  const placeCardInSlotWithFeedback = (cardId, slotId, shouldFlash = false) => {
    const placed = placeCardInSlot(cardId, slotId);
    if (placed && shouldFlash) triggerSlotFlash(slotId);
    return placed;
  };

  const handleTouchDragStart = (event, card, slotId = null) => {
    if (event.pointerType !== "touch" || phase !== "build") return;
    if (slotId && !isSlotInteractive(slotId)) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    touchDragRef.current = {
      pointerId: event.pointerId,
      cardId: card.id,
      cardText: card.text,
      startX: event.clientX,
      startY: event.clientY,
      dragging: false,
    };
    clearDependencyWarning();
    setDraggingCardId(card.id);
    setDragOverSlotId(null);
    setTouchGhost({ visible: false, text: card.text });
    positionTouchGhost(event.clientX, event.clientY);
  };

  const handleTouchDragMove = (event, cardId) => {
    if (event.pointerType !== "touch" || phase !== "build") return;
    const state = touchDragRef.current;
    if (state.pointerId !== event.pointerId || state.cardId !== cardId) return;

    const movedEnough = Math.hypot(event.clientX - state.startX, event.clientY - state.startY) >= 8;
    if (!state.dragging && !movedEnough) return;

    if (!state.dragging) {
      state.dragging = true;
      setTouchGhost({ visible: true, text: state.cardText });
    }
    event.preventDefault();
    positionTouchGhost(event.clientX, event.clientY);

    const slotId = getSlotIdAtPoint(event.clientX, event.clientY);
    if (!slotId || !canPlaceCardInSlot(cardId, slotId)) {
      setDragOverSlotId((prev) => (prev === null ? prev : null));
      clearDependencyWarning();
      return;
    }
    setDragOverSlotId((prev) => (prev === slotId ? prev : slotId));
    previewPlacementWarning(cardId, slotId);
  };

  const handleTouchDragEnd = (event, cardId) => {
    if (event.pointerType !== "touch" || phase !== "build") return;
    const state = touchDragRef.current;
    if (state.pointerId !== event.pointerId || state.cardId !== cardId) return;

    event.currentTarget.releasePointerCapture?.(event.pointerId);

    if (state.dragging) {
      event.preventDefault();
      const slotId = getSlotIdAtPoint(event.clientX, event.clientY) || dragOverSlotId;
      if (slotId && canPlaceCardInSlot(cardId, slotId)) {
        placeCardInSlotWithFeedback(cardId, slotId, true);
      }
      clearDragState();
      clearDependencyWarning();
      suppressClickCardIdRef.current = cardId;
      setTimeout(() => {
        if (suppressClickCardIdRef.current === cardId) suppressClickCardIdRef.current = null;
      }, 0);
    }

    clearDragState();
    clearDependencyWarning();
    hideTouchGhost();
    resetTouchDrag();
  };

  const handleTouchDragCancel = (event, cardId) => {
    if (event.pointerType !== "touch") return;
    const state = touchDragRef.current;
    if (state.pointerId !== event.pointerId || state.cardId !== cardId) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    clearDragState();
    clearDependencyWarning();
    hideTouchGhost();
    resetTouchDrag();
  };

  const handleDeckCardClick = (card) => {
    if (suppressClickCardIdRef.current === card.id) {
      suppressClickCardIdRef.current = null;
      return;
    }
    handleCardClick(card);
  };

  const handlePlacedCardClick = (event, cardId, slotId) => {
    event.stopPropagation();
    if (!isSlotInteractive(slotId)) return;
    if (suppressClickCardIdRef.current === cardId) {
      suppressClickCardIdRef.current = null;
      return;
    }
    setEditingSlotId(slotId);
  };

  const handleDesktopDragStart = (event, cardId, slotId = null) => {
    if (phase !== "build") return;
    if (slotId && !isSlotInteractive(slotId)) return;
    if (event.dataTransfer) {
      event.dataTransfer.setData("text/plain", cardId);
      event.dataTransfer.effectAllowed = "move";
    }
    clearDependencyWarning();
    setDraggingCardId(cardId);
  };

  const handleSlotRowClick = (slotId, hasCards) => {
    if (phase !== "build") return;
    if (!isSlotInteractive(slotId)) return;
    if (hasCards) {
      setEditingSlotId(slotId);
      return;
    }
    if (selectedOrGuided?.id) previewPlacementWarning(selectedOrGuided.id, slotId);
    handleSlotClick(slotId);
  };

  const closeSheet = () => setEditingSlotId(null);
  const editingMeta = slotDefs.find((slot) => slot.id === editingSlotId) || null;
  const editingCards = editingSlotId ? slots[editingSlotId] || [] : [];
  const hintsRemaining = hintsMode === "limited" ? String(Math.max(0, maxHints - hintUses)) : hintsMode === "none" ? "off" : "inf";
  const isDragActive = phase === "build" && !!draggingCardId;
  const showDeckTray = phase === "build" && !editingSlotId;
  const activePhaseSlotId = activePhaseSlotIds[0] || "";
  const timerColor = phase === "build"
    ? (timeRemainingMs <= 0 ? "var(--danger)" : timeRemainingMs <= 30000 ? "var(--warn)" : "var(--dim)")
    : "var(--dim)";
  const timerLabel = phase === "build"
    ? `left ${formatElapsed(timeRemainingMs)}`
    : `time ${formatElapsed(runSummary?.elapsedMs ?? elapsedMs)}`;
  const handlePhaseCheck = () => {
    const result = handleCheckActivePhase();
    if (result?.status === "completed") {
      onComplete(level.id, result.stars || 1);
    }
  };

  return (
    <div style={{ ...S.blueprintContainer, paddingBottom: phase === "build" ? 320 : 24 }}>
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

      <div style={S.blueprintStatsStrip}>
        <span data-testid="blueprint-solve-mode" style={S.blueprintStatsItem}>mode {solveMode}</span>
        <span style={S.blueprintStatsItem}>cards {totalPlaced}/{requiredCards}</span>
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

      {phase === "build" && (
        <>
          <div style={S.blueprintSlotList}>
            {slotDefs.map((meta, slotIndex) => {
              const slotId = meta.id;
              const slotSolveState = phaseStatesBySlotId?.[slotId] || "active";
              const slotInteractive = phase === "build" && isSlotInteractive(slotId);
              const cards = slots[slotId] || [];
              const hasCards = cards.length > 0;
              const activeCardId = selectedOrGuided?.id || draggingCardId;
              const canDropHere = slotInteractive && !!activeCardId && canPlaceCardInSlot(activeCardId, slotId);
              const isDragOver = dragOverSlotId === slotId && canDropHere;
              const showDropAffordance = slotInteractive && !hasCards && isDragActive && canDropHere;
              const displayMeta = hideSlotScaffolding
                ? { ...meta, icon: String(slotIndex + 1), name: `Slot ${slotIndex + 1}`, desc: "Place a core step" }
                : meta;
              const isLocked = solveMode === "phased" && slotSolveState === "locked";
              const isCompleted = solveMode === "phased" && slotSolveState === "completed";

              return (
                <div
                  key={slotId}
                  data-testid={`blueprint-slot-${slotId}`}
                  data-blueprint-phase-state={slotSolveState}
                  data-blueprint-slot-id={slotId}
                  onClick={() => handleSlotRowClick(slotId, hasCards)}
                  onDragOver={(event) => {
                    if (!slotInteractive) return;
                    const cardId = getDraggedCardId(event);
                    if (!canPlaceCardInSlot(cardId, slotId)) return;
                    event.preventDefault();
                    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
                    setDragOverSlotId(slotId);
                    previewPlacementWarning(cardId, slotId);
                  }}
                  onDragLeave={() => {
                    if (dragOverSlotId === slotId) setDragOverSlotId(null);
                    clearDependencyWarning();
                  }}
                  onDrop={(event) => {
                    if (!slotInteractive) return;
                    const cardId = getDraggedCardId(event);
                    if (!canPlaceCardInSlot(cardId, slotId)) return;
                    event.preventDefault();
                    placeCardInSlotWithFeedback(cardId, slotId, true);
                    clearDragState();
                    clearDependencyWarning();
                  }}
                  style={{
                    ...S.blueprintSlot,
                    borderColor: isDragOver ? `${displayMeta.color}` : showDropAffordance ? `${displayMeta.color}88` : "var(--border)",
                    borderStyle: isDragOver || showDropAffordance ? "dashed" : "solid",
                    background: isDragOver
                      ? `${displayMeta.color}22`
                      : flashedSlotId === slotId
                        ? `${displayMeta.color}28`
                        : isLocked
                          ? "rgba(100, 116, 139, 0.1)"
                          : isCompleted
                            ? "rgba(148, 163, 184, 0.08)"
                        : showDropAffordance
                          ? `${displayMeta.color}14`
                          : "var(--surface-1)",
                    outline: isDragOver || showDropAffordance ? `1px dashed ${displayMeta.color}` : "none",
                    outlineOffset: -1,
                    cursor: slotInteractive && (hasCards || canDropHere) ? "pointer" : "default",
                    opacity: isLocked ? 0.52 : 1,
                    position: "relative",
                  }}
                >
                  <div style={S.blueprintSlotHeader}>
                    <span style={{ ...S.blueprintSlotIcon, color: displayMeta.color, borderColor: `${displayMeta.color}66` }}>{getStepBadgeLabel(displayMeta)}</span>
                  </div>
                  {solveMode === "phased" ? (
                    <span
                      data-testid={`blueprint-phase-state-${slotId}`}
                      data-slot-id={slotId}
                      style={{
                        ...S.blueprintTopMeta,
                        position: "absolute",
                        right: 8,
                        top: 5,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: slotSolveState === "active" ? "var(--accent)" : slotSolveState === "completed" ? "var(--text)" : "var(--dim)",
                        pointerEvents: "none",
                      }}
                    >
                      {slotSolveState}
                    </span>
                  ) : null}

                  <div style={S.blueprintSlotCards}>
                    {!hasCards ? (
                      <div style={S.blueprintSlotEmpty}>
                        <span style={{ ...S.blueprintSlotName, color: displayMeta.color }}>{displayMeta.name}</span>
                        <span style={S.blueprintSlotDesc}>{displayMeta.desc}</span>
                        {showDropAffordance ? <span style={{ ...S.blueprintDropPlus, color: displayMeta.color }}>+</span> : null}
                      </div>
                    ) : null}

                    {hasCards ? (
                      <div style={S.blueprintSlotFilledRow}>
                        <div style={S.blueprintPlacedInlineMask}>
                          {cards.map((card, idx) => {
                            const feedback = cardFeedbackById?.[card.id] || null;
                            const feedbackTone = getFeedbackTone(feedback?.status);
                            return (
                              <div key={card.id} style={S.blueprintPlacedRow}>
                                {idx > 0 ? <span style={S.blueprintInlineSeparator}>||</span> : null}
                                <button
                                  data-testid={`blueprint-placed-card-${card.id}`}
                                  draggable={phase === "build" && slotInteractive}
                                  onDragStart={(event) => handleDesktopDragStart(event, card.id, slotId)}
                                  onDragEnd={clearDragState}
                                  onPointerDown={(event) => handleTouchDragStart(event, card, slotId)}
                                  onPointerMove={(event) => handleTouchDragMove(event, card.id)}
                                  onPointerUp={(event) => handleTouchDragEnd(event, card.id)}
                                  onPointerCancel={(event) => handleTouchDragCancel(event, card.id)}
                                  onClick={(event) => handlePlacedCardClick(event, card.id, slotId)}
                                  title={feedback?.reason || undefined}
                                  style={{
                                    ...S.blueprintPlacedCard,
                                    touchAction: "none",
                                    pointerEvents: slotInteractive ? "auto" : "none",
                                  }}
                                >
                                  <span style={{ ...S.blueprintCardCodeInline, color: feedback ? feedbackTone : "var(--text)" }}>{card.text}</span>
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
                                  ) : null}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                        <span style={{ ...S.blueprintSlotLimit, color: displayMeta.color, borderColor: `${displayMeta.color}55` }}>
                          {cards.length}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={S.actionBar}>
            <button onClick={handleReset} style={S.resetBtn}>
              reset
            </button>
            {solveMode === "flat" ? (
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
                Fill {activePhaseSlotId ? (checkButtonLabel || "").replace(/^Check\s+/i, "") : "phase"} to check
              </span>
            )}
          </div>

          {showDeckTray ? (
            <div data-testid="blueprint-card-tray" style={S.blueprintDeckArea}>
              <div style={S.blueprintDeckHeaderRow}>
                <span style={S.blueprintDeckLabel}>card tray</span>
                <span style={S.blueprintTopMeta}>{deck.length} remaining</span>
              </div>
              <div style={S.blueprintDeckRow}>
                {deck.map((card, deckIndex) => {
                  const guidedSelected = solveMode === "flat" && guided && !selected && deckIndex === 0;
                  const isSelected = selected?.id === card.id || guidedSelected;
                  const canOpenHint = showHint === card.id || hintUses < maxHints;
                  return (
                    <button
                      key={card.id}
                      data-testid={`blueprint-deck-card-${card.id}`}
                      draggable={phase === "build"}
                      onDragStart={(event) => handleDesktopDragStart(event, card.id)}
                      onDragEnd={clearDragState}
                      onPointerDown={(event) => handleTouchDragStart(event, card)}
                      onPointerMove={(event) => handleTouchDragMove(event, card.id)}
                      onPointerUp={(event) => handleTouchDragEnd(event, card.id)}
                      onPointerCancel={(event) => handleTouchDragCancel(event, card.id)}
                      onClick={() => handleDeckCardClick(card)}
                      style={{
                        ...S.blueprintDeckCard,
                        borderColor: isSelected ? "var(--accent)" : "var(--border)",
                        background: isSelected ? "rgba(16, 185, 129, 0.1)" : "var(--surface-1)",
                        touchAction: "none",
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
                            toggleHint(card.id, canOpenHint);
                          }}
                          onKeyDown={(event) => {
                            if (event.key !== "Enter" && event.key !== " ") return;
                            event.preventDefault();
                            event.stopPropagation();
                            toggleHint(card.id, canOpenHint);
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
          ) : null}

          {editingSlotId ? (
            <div data-testid="blueprint-slot-sheet-scrim" style={S.blueprintSheetScrim} onClick={closeSheet}>
              <div data-testid="blueprint-slot-sheet" role="dialog" aria-modal="true" style={S.blueprintSheet} onClick={(event) => event.stopPropagation()}>
                <div style={S.blueprintSheetHeader}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ ...S.blueprintSlotIcon, color: editingMeta?.color || "var(--text)", borderColor: `${editingMeta?.color || "var(--border)"}66` }}>
                      {getStepBadgeLabel(editingMeta)}
                    </span>
                    <span style={{ ...S.blueprintSlotName, color: editingMeta?.color || "var(--text)" }}>{editingMeta?.name || "Slot"}</span>
                  </div>
                  <button onClick={closeSheet} style={S.blueprintSheetClose} aria-label="Close card editor">
                    x
                  </button>
                </div>
                <div style={S.blueprintSheetList}>
                  {editingCards.map((card, idx) => {
                    const feedback = cardFeedbackById?.[card.id] || null;
                    const feedbackTone = getFeedbackTone(feedback?.status);
                    return (
                      <div key={card.id} style={S.blueprintSheetCard}>
                        <pre style={S.blueprintCardCode}>{card.text}</pre>
                        {feedback ? (
                          <div
                            data-testid={`blueprint-sheet-feedback-${card.id}`}
                            style={{
                              ...S.blueprintDependencyWarning,
                              margin: 0,
                              borderColor: `${feedbackTone}66`,
                              color: feedbackTone,
                              background: `${feedbackTone}14`,
                            }}
                          >
                            <strong style={{ marginRight: 4 }}>{getFeedbackLabel(feedback.status)}</strong>
                            <span>{feedback.reason || "Check card placement."}</span>
                          </div>
                        ) : null}
                        <div style={S.blueprintSheetActions}>
                          <button
                            onClick={() => moveInSlot(editingSlotId, idx, -1)}
                            disabled={idx === 0}
                            style={{ ...S.blueprintReorderBtn, minWidth: 36, minHeight: 36, opacity: idx === 0 ? 0.45 : 1, cursor: idx === 0 ? "not-allowed" : "pointer" }}
                            aria-label="Move card up"
                          >
                            up
                          </button>
                          <button
                            onClick={() => moveInSlot(editingSlotId, idx, 1)}
                            disabled={idx >= editingCards.length - 1}
                            style={{ ...S.blueprintReorderBtn, minWidth: 36, minHeight: 36, opacity: idx >= editingCards.length - 1 ? 0.45 : 1, cursor: idx >= editingCards.length - 1 ? "not-allowed" : "pointer" }}
                            aria-label="Move card down"
                          >
                            down
                          </button>
                          <button
                            onClick={() => removeFromSlot(card, editingSlotId)}
                            style={{ ...S.blueprintReorderBtn, minWidth: 64, minHeight: 36, color: "var(--danger)" }}
                            aria-label="Remove card"
                          >
                            remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}

      <div
        ref={touchGhostRef}
        data-testid="blueprint-touch-ghost"
        aria-hidden="true"
        style={{
          ...S.blueprintTouchGhost,
          visibility: touchGhost.visible ? "visible" : "hidden",
          opacity: touchGhost.visible ? 0.96 : 0,
        }}
      >
        <pre style={S.blueprintCardCode}>{touchGhost.text}</pre>
      </div>

      {phase === "executing" && solveMode === "flat" ? (
        <BlueprintExecution
          trace={execTrace}
          step={execStep}
          setStep={setExecStep}
          testResults={testResults}
          allPassed={allPassed}
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

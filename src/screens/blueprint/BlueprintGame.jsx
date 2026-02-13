import { useRef, useState } from "react";

import { S } from "../../styles";
import { BlueprintExecution } from "./BlueprintExecution";
import { buildHintMessage, DIFF_COLOR, formatElapsed, getChallengeBadgeColor } from "./shared";
import { useBlueprintGameSession } from "./useBlueprintGameSession";

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
  const [touchGhost, setTouchGhost] = useState({ visible: false, text: "" });

  const {
    slotDefs,
    hintsMode,
    guided,
    hideSlotScaffolding,
    showPatternLabel,
    timeLimitSec,
    maxHints,
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
    allPassed,
    stars,
    totalPlaced,
    requiredCards,
    canRun,
    setExecStep,
    setDraggingCardId,
    setDragOverSlotId,
    getDraggedCardId,
    clearDragState,
    canPlaceCardInSlot,
    placeCardInSlot,
    handleCardClick,
    handleSlotClick,
    removeFromSlot,
    moveInSlot,
    handleRun,
    handleReset,
    handleBackToBuild,
    toggleHint,
  } = useBlueprintGameSession({ level, challenge });

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

  const handleTouchDragStart = (event, card) => {
    if (event.pointerType !== "touch" || phase !== "build") return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    touchDragRef.current = {
      pointerId: event.pointerId,
      cardId: card.id,
      cardText: card.text,
      startX: event.clientX,
      startY: event.clientY,
      dragging: false,
    };
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
      return;
    }
    setDragOverSlotId((prev) => (prev === slotId ? prev : slotId));
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
        placeCardInSlot(cardId, slotId);
      }
      clearDragState();
      suppressClickCardIdRef.current = cardId;
      setTimeout(() => {
        if (suppressClickCardIdRef.current === cardId) suppressClickCardIdRef.current = null;
      }, 0);
    }

    clearDragState();
    hideTouchGhost();
    resetTouchDrag();
  };

  const handleTouchDragCancel = (event, cardId) => {
    if (event.pointerType !== "touch") return;
    const state = touchDragRef.current;
    if (state.pointerId !== event.pointerId || state.cardId !== cardId) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    clearDragState();
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

  const handlePlacedCardClick = (event, card, slotId) => {
    event.stopPropagation();
    if (suppressClickCardIdRef.current === card.id) {
      suppressClickCardIdRef.current = null;
      return;
    }
    removeFromSlot(card, slotId);
  };

  const handleDesktopDragStart = (event, cardId) => {
    if (phase !== "build") return;
    if (event.dataTransfer) {
      event.dataTransfer.setData("text/plain", cardId);
      event.dataTransfer.effectAllowed = "move";
    }
    setDraggingCardId(cardId);
  };

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
                  data-blueprint-slot-id={slotId}
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
                    clearDragState();
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
                    {limit ? <span style={S.blueprintSlotLimit}>{cards.length} (target {limit})</span> : null}
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
                          data-testid={`blueprint-placed-card-${card.id}`}
                          draggable={phase === "build"}
                          onDragStart={(event) => handleDesktopDragStart(event, card.id)}
                          onDragEnd={clearDragState}
                          onPointerDown={(event) => handleTouchDragStart(event, card)}
                          onPointerMove={(event) => handleTouchDragMove(event, card.id)}
                          onPointerUp={(event) => handleTouchDragEnd(event, card.id)}
                          onPointerCancel={(event) => handleTouchDragCancel(event, card.id)}
                          onClick={(event) => handlePlacedCardClick(event, card, slotId)}
                          style={{
                            ...S.blueprintPlacedCard,
                            borderLeftColor: displayMeta.color,
                            touchAction: "none",
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
                      touchAction: "pan-x",
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

      {phase === "executing" ? (
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

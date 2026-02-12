import { useEffect, useMemo, useState } from "react";

import { findDivergence, getCorrectTrace, runAllTests } from "../lib/blueprint/engine";
import { BLUEPRINT_LEVELS } from "../lib/blueprint/levels";
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

export function BlueprintScreen({ goMenu, initialStars, onSaveStars }) {
  const [view, setView] = useState("menu");
  const [levelId, setLevelId] = useState(null);
  const [completed, setCompleted] = useState(initialStars || {});

  useEffect(() => {
    setCompleted(initialStars || {});
  }, [initialStars]);

  const level = useMemo(() => BLUEPRINT_LEVELS.find((item) => item.id === levelId) || null, [levelId]);

  const startLevel = (id) => {
    setLevelId(id);
    setView("game");
  };

  const handleComplete = (id, stars) => {
    const nextStars = Math.max(Number(completed?.[id] || 0), Number(stars || 0));
    setCompleted((prev) => ({ ...prev, [id]: nextStars }));
    onSaveStars?.(id, nextStars);
    setView("menu");
  };

  if (view === "game" && level) {
    return (
      <BlueprintGame
        level={level}
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
        <div style={S.blueprintTopMeta}>levels: {BLUEPRINT_LEVELS.length}</div>
      </div>

      <div style={S.blueprintMenuIntro}>
        Build each algorithm from cards, run test cases, then inspect the execution trace when it fails.
      </div>

      <div style={S.blueprintMenuList}>
        {BLUEPRINT_LEVELS.map((item) => {
          const stars = Number(completed[item.id] || 0);
          return (
            <button
              key={item.id}
              className="hover-row"
              onClick={() => startLevel(item.id)}
              style={{
                ...S.blueprintMenuCard,
                borderColor: `${DIFF_COLOR[item.difficulty] || "var(--border)"}40`,
              }}
            >
              <div style={S.blueprintMenuCardTop}>
                <span
                  style={{
                    ...S.diffBadge,
                    color: DIFF_COLOR[item.difficulty] || "var(--dim)",
                    borderColor: `${DIFF_COLOR[item.difficulty] || "var(--border)"}50`,
                  }}
                >
                  {item.difficulty}
                </span>
                <span style={S.blueprintPatternBadge}>{item.pattern}</span>
              </div>
              <h3 style={S.blueprintLevelTitle}>{item.title}</h3>
              <p style={S.blueprintLevelDesc}>{item.description}</p>
              <div style={S.blueprintStarRow}>
                {[1, 2, 3].map((n) => (
                  <span
                    key={n}
                    style={{
                      ...S.blueprintStar,
                      color: n <= stars ? "var(--warn)" : "var(--faint)",
                    }}
                  >
                    *
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BlueprintGame({ level, onBack, onComplete }) {
  const slotDefs = useMemo(() => getBlueprintTemplate(level.templateId).slots, [level.templateId]);
  const slotIds = useMemo(() => slotDefs.map((slot) => slot.id), [slotDefs]);
  const solutionCards = useMemo(() => {
    const required = (level.cards || []).filter((card) => !!card.correctSlot);
    return required.length > 0 ? required : level.cards || [];
  }, [level.cards]);

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

  useEffect(() => {
    const nextSlots = {};
    for (const slotId of slotIds) nextSlots[slotId] = [];

    setSlots(nextSlots);
    setDeck(shuffle(solutionCards));
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
  }, [level.id, slotIds, solutionCards]);

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
    if (phase !== "build" || !selected) return;
    placeCardInSlot(selected.id, slotId);
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

    if (!results.every((result) => result.passed)) {
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
    setDeck(shuffle(solutionCards));
    setSelected(null);
    setDraggingCardId(null);
    setDragOverSlotId(null);
    setPhase("build");
    setTestResults(null);
    setExecTrace([]);
    setExecStep(0);
    setDivergence(null);
    setShowHint(null);
  };

  const handleBackToBuild = () => {
    setPhase("build");
    setTestResults(null);
    setExecTrace([]);
    setExecStep(0);
    setDivergence(null);
  };

  const allPassed = testResults?.every((result) => result.passed);
  const stars = allPassed ? (attempts <= 1 ? 3 : attempts <= 3 ? 2 : 1) : 0;
  const totalPlaced = Object.values(slots).reduce((sum, items) => sum + items.length, 0);
  const requiredCards = solutionCards.length;
  const canRun = requiredCards > 0 && totalPlaced === requiredCards;

  return (
    <div style={S.blueprintContainer}>
      <div style={S.topBar}>
        <button onClick={onBack} style={S.backBtn}>
          {" "}levels
        </button>
        <span style={S.blueprintTitle}>{level.title}</span>
        <div style={S.blueprintTopMeta}>attempts: {attempts}</div>
      </div>

      <div style={S.blueprintProblemCard}>
        <div style={{ ...S.diffBadge, color: DIFF_COLOR[level.difficulty] || "var(--text)", borderColor: `${DIFF_COLOR[level.difficulty] || "var(--border)"}45` }}>
          {level.pattern}
        </div>
        <p style={S.blueprintProblemText}>{level.description}</p>
        <pre style={S.blueprintExample}>{level.example}</pre>
        <div style={{ ...S.blueprintTopMeta, minWidth: "auto", textAlign: "left" }}>
          solution cards: {totalPlaced}/{requiredCards}
        </div>
      </div>

      {phase === "build" && (
        <>
          <div style={S.blueprintSlotList}>
            {slotDefs.map((meta) => {
              const slotId = meta.id;
              const cards = slots[slotId] || [];
              const limit = level.slotLimits?.[slotId];
              const activeCardId = selected?.id || draggingCardId;
              const canDropHere = !!activeCardId && canPlaceCardInSlot(activeCardId, slotId);
              const isDragOver = dragOverSlotId === slotId && canDropHere;
              const isTarget = canDropHere;

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
                    borderColor: isDragOver ? `${meta.color}` : isTarget ? `${meta.color}88` : "var(--border)",
                    background: isDragOver ? `${meta.color}22` : isTarget ? `${meta.color}10` : "var(--surface-1)",
                    cursor: isTarget ? "pointer" : "default",
                  }}
                >
                  <div style={S.blueprintSlotHeader}>
                    <span style={{ ...S.blueprintSlotIcon, color: meta.color }}>{meta.icon}</span>
                    <span style={{ ...S.blueprintSlotName, color: meta.color }}>{meta.name}</span>
                    <span style={S.blueprintSlotDesc}>{meta.desc}</span>
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
                            borderLeftColor: meta.color,
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
            <div style={S.sectionLabel}>card deck</div>
            <div style={S.blueprintDeckRow}>
              {deck.map((card) => {
                const isSelected = selected?.id === card.id;
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
                    {level.hints ? (
                      <span
                        role="button"
                        tabIndex={0}
                        style={S.blueprintHintBtn}
                        onClick={(event) => {
                          event.stopPropagation();
                          setShowHint(showHint === card.id ? null : card.id);
                        }}
                        onKeyDown={(event) => {
                          if (event.key !== "Enter" && event.key !== " ") return;
                          event.preventDefault();
                          event.stopPropagation();
                          setShowHint(showHint === card.id ? null : card.id);
                        }}
                        title="hint"
                      >
                        ?
                      </span>
                    ) : null}
                    {level.hints && showHint === card.id ? (
                      <div style={S.blueprintHintBubble}>
                        {card.isDistractor ? "This may be a distractor." : `This card belongs in ${card.hint || "a different slot"}.`}
                      </div>
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
          stars={stars}
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
  stars,
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
              <span key={n} style={{ ...S.blueprintStar, color: n <= stars ? "var(--warn)" : "var(--faint)" }}>
                *
              </span>
            ))}
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

import { useEffect, useMemo, useState } from "react";

import {
  analyzeCardDependencies,
  buildCardPlacementFeedback,
  buildDependencyWarningForCard,
  collectExternalIdentifiersFromTests,
  simulateCardPlacement,
} from "../../lib/blueprint/dependencyHints";
import { findDivergence, getCorrectTrace, runAllTests } from "../../lib/blueprint/engine";
import { getBlueprintTemplate } from "../../lib/blueprint/templates";
import { shuffle } from "../../lib/utils";
import { sortCardsForGuided } from "./shared";

function createEmptySlots(slotIds) {
  const next = {};
  for (const slotId of slotIds) next[slotId] = [];
  return next;
}

function toSortedCards(cards) {
  return [...(cards || [])].sort((a, b) => (a?.correctOrder || 0) - (b?.correctOrder || 0));
}

function buildRequiredCardsBySlot(slotIds, cards) {
  const bySlot = Object.fromEntries((slotIds || []).map((slotId) => [slotId, []]));
  for (const card of cards || []) {
    const slotId = String(card?.correctSlot || "");
    if (!slotId || !bySlot[slotId]) continue;
    bySlot[slotId].push(card);
  }
  for (const slotId of slotIds || []) {
    bySlot[slotId] = toSortedCards(bySlot[slotId]);
  }
  return bySlot;
}

function getNextRequiredPhaseIndex(slotIds, requiredCardsBySlot, startIndex) {
  for (let idx = Math.max(0, Number(startIndex) || 0); idx < (slotIds || []).length; idx += 1) {
    const slotId = slotIds[idx];
    if ((requiredCardsBySlot?.[slotId] || []).length > 0) return idx;
  }
  return (slotIds || []).length;
}

function pickRandomDecoyCount(availableCount) {
  if (availableCount <= 0) return 0;
  const desired = 1 + Math.floor(Math.random() * 2);
  return Math.min(availableCount, desired);
}

function buildPhaseTray(slotId, requiredCardsBySlot, decoyPool) {
  const correctCards = requiredCardsBySlot?.[slotId] || [];
  const correctIds = new Set(correctCards.map((card) => String(card?.id || "")).filter(Boolean));
  const decoyCandidates = (decoyPool || []).filter((card) => !correctIds.has(String(card?.id || "")));
  const decoyCount = pickRandomDecoyCount(decoyCandidates.length);
  const pickedDecoys = shuffle(decoyCandidates).slice(0, decoyCount);
  return shuffle([...correctCards, ...pickedDecoys]);
}

function buildPhaseFailureFeedback(placedCards, expectedCards) {
  const expected = toSortedCards(expectedCards);
  const expectedIds = new Set(expected.map((card) => String(card?.id || "")).filter(Boolean));
  const feedbackByCardId = {};

  let allCorrect = placedCards.length === expected.length;

  for (let index = 0; index < placedCards.length; index += 1) {
    const card = placedCards[index];
    const cardId = String(card?.id || "");
    if (!cardId) continue;

    const expectedCard = expected[index];
    const expectedId = String(expectedCard?.id || "");
    if (expectedId && cardId === expectedId) continue;

    allCorrect = false;
    const belongsToPhase = expectedIds.has(cardId);
    feedbackByCardId[cardId] = {
      status: "phase-error",
      reason: belongsToPhase ? "Right phase, wrong order." : "This card does not belong in this phase.",
    };
  }

  return { allCorrect, feedbackByCardId };
}

export function useBlueprintGameSession({ level, challenge }) {
  const slotDefs = useMemo(() => getBlueprintTemplate(level.templateId).slots, [level.templateId]);
  const slotIds = useMemo(() => slotDefs.map((slot) => slot.id), [slotDefs]);
  const slotIndexById = useMemo(
    () => Object.fromEntries(slotIds.map((slotId, index) => [slotId, index])),
    [slotIds]
  );
  const slotNameById = useMemo(
    () => Object.fromEntries(slotDefs.map((slot) => [String(slot.id), String(slot.name || slot.id)])),
    [slotDefs]
  );
  const solutionCards = useMemo(() => {
    const required = (level.cards || []).filter((card) => !!card.correctSlot);
    return required.length > 0 ? required : level.cards || [];
  }, [level.cards]);
  const externalIdentifiers = useMemo(
    () => collectExternalIdentifiersFromTests(level.testCases || []),
    [level.testCases]
  );

  const hintsMode = challenge?.hintsMode || (level.hints ? "full" : "none");
  const guided = !!challenge?.guided;
  const hideSlotScaffolding = !!challenge?.hideSlotScaffolding;
  const showPatternLabel = challenge?.showPatternLabel !== false;
  const timeLimitSec = Number(challenge?.timeLimitSec || 180);
  const maxHints = hintsMode === "limited" ? 2 : Number.POSITIVE_INFINITY;

  const requiredCardsBySlot = useMemo(
    () => buildRequiredCardsBySlot(slotIds, solutionCards),
    [slotIds, solutionCards]
  );
  const totalSlots = useMemo(
    () => slotIds.reduce((sum, slotId) => sum + (requiredCardsBySlot?.[slotId] || []).length, 0),
    [requiredCardsBySlot, slotIds]
  );
  const solveMode = totalSlots > 10 ? "phased" : "flat";
  const decoyPool = useMemo(
    () => (level.cards || []).filter((card) => !card?.correctSlot || card?.isDistractor),
    [level.cards]
  );

  const orderedSolutionCards = useMemo(
    () => (guided ? sortCardsForGuided(solutionCards, slotIds) : solutionCards),
    [guided, solutionCards, slotIds]
  );

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
  const [nowMs, setNowMs] = useState(Date.now());
  const [runSummary, setRunSummary] = useState(null);
  const [cardFeedbackById, setCardFeedbackById] = useState({});
  const [dependencyWarning, setDependencyWarning] = useState("");
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  const dependencyAnalysis = useMemo(
    () => analyzeCardDependencies({ slotIds, slots, externalIdentifiers }),
    [externalIdentifiers, slotIds, slots]
  );

  const clearPlacementFeedback = () => {
    setCardFeedbackById({});
  };

  const resetRound = () => {
    const nextNow = Date.now();
    setSlots(createEmptySlots(slotIds));
    if (solveMode === "phased") {
      const firstPhaseIndex = getNextRequiredPhaseIndex(slotIds, requiredCardsBySlot, 0);
      const firstPhaseSlotId = slotIds[firstPhaseIndex];
      setActivePhaseIndex(firstPhaseIndex);
      setDeck(firstPhaseSlotId ? buildPhaseTray(firstPhaseSlotId, requiredCardsBySlot, decoyPool) : []);
    } else {
      setActivePhaseIndex(0);
      setDeck(guided ? orderedSolutionCards : shuffle(solutionCards));
    }
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
    setStartedAt(nextNow);
    setNowMs(nextNow);
    setRunSummary(null);
    clearPlacementFeedback();
    setDependencyWarning("");
    setMistakes(0);
  };

  useEffect(() => {
    resetRound();
  }, [decoyPool, guided, level.id, orderedSolutionCards, requiredCardsBySlot, slotIds, solutionCards, solveMode]);

  useEffect(() => {
    if (phase !== "build") return undefined;
    setNowMs(Date.now());
    const intervalId = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, [phase, startedAt]);

  const selectedOrGuided = selected || (guided ? deck[0] || null : null);
  const activePhaseSlotIds = useMemo(() => {
    if (solveMode !== "phased") return slotIds;
    const slotId = slotIds[activePhaseIndex];
    return slotId ? [slotId] : [];
  }, [activePhaseIndex, slotIds, solveMode]);
  const phaseStatesBySlotId = useMemo(() => {
    const states = {};
    if (solveMode !== "phased") {
      for (const slotId of slotIds) states[slotId] = "active";
      return states;
    }

    for (let index = 0; index < slotIds.length; index += 1) {
      const slotId = slotIds[index];
      if (index < activePhaseIndex) states[slotId] = "completed";
      else if (index === activePhaseIndex) states[slotId] = "active";
      else states[slotId] = "locked";
    }

    return states;
  }, [activePhaseIndex, slotIds, solveMode]);

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

  const isSlotInteractive = (slotId) => {
    if (phase !== "build") return false;
    if (solveMode !== "phased") return true;
    return phaseStatesBySlotId?.[slotId] === "active";
  };

  const canPlaceCardInSlot = (cardId, slotId) => {
    if (!isSlotInteractive(slotId)) return false;
    if (!getCardById(cardId)) return false;
    const current = slots[slotId] || [];
    if (current.some((card) => card.id === cardId)) return true;
    return true;
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
    clearPlacementFeedback();
    setDependencyWarning("");
    return true;
  };

  const getDraggedCardId = (event) => {
    const fromTransfer = event?.dataTransfer?.getData("text/plain");
    return fromTransfer || draggingCardId || "";
  };

  const clearDragState = () => {
    setDraggingCardId(null);
    setDragOverSlotId(null);
    setDependencyWarning("");
  };

  const handleCardClick = (card) => {
    if (phase !== "build") return;
    if (selected?.id === card.id) {
      setSelected(null);
      return;
    }
    setDependencyWarning("");
    setSelected(card);
  };

  const handleSlotClick = (slotId) => {
    if (!selectedOrGuided || !isSlotInteractive(slotId)) return;
    placeCardInSlot(selectedOrGuided.id, slotId);
  };

  const removeFromSlot = (card, slotId) => {
    if (!isSlotInteractive(slotId)) return;
    setSlots((prev) => ({ ...prev, [slotId]: prev[slotId].filter((item) => item.id !== card.id) }));
    setDeck((prev) => [...prev, card]);
    setSelected(null);
    clearPlacementFeedback();
    setDependencyWarning("");
  };

  const moveInSlot = (slotId, idx, dir) => {
    if (!isSlotInteractive(slotId)) return;
    setSlots((prev) => {
      const items = [...(prev[slotId] || [])];
      const nextIdx = idx + dir;
      if (nextIdx < 0 || nextIdx >= items.length) return prev;
      [items[idx], items[nextIdx]] = [items[nextIdx], items[idx]];
      return { ...prev, [slotId]: items };
    });
    clearPlacementFeedback();
    setDependencyWarning("");
  };

  const getPlacementDependencyWarning = (cardId, slotId) => {
    if (!cardId || !slotId) return "";
    const card = getCardById(cardId);
    if (!card) return "";
    const projectedSlots = simulateCardPlacement(slots, card, slotId);
    const projectedAnalysis = analyzeCardDependencies({
      slotIds,
      slots: projectedSlots,
      externalIdentifiers,
    });
    return buildDependencyWarningForCard(cardId, projectedAnalysis, slotNameById);
  };

  const previewPlacementWarning = (cardId, slotId) => {
    const warning = getPlacementDependencyWarning(cardId, slotId);
    setDependencyWarning(warning);
    return warning;
  };

  const clearDependencyWarning = () => {
    setDependencyWarning("");
  };

  const handleCheckActivePhase = () => {
    if (solveMode !== "phased" || phase !== "build") return { status: "unavailable" };
    const activeSlotId = activePhaseSlotIds[0];
    if (!activeSlotId) return { status: "unavailable" };

    const expectedCards = requiredCardsBySlot?.[activeSlotId] || [];
    const placedCards = slots?.[activeSlotId] || [];
    if (placedCards.length < expectedCards.length) return { status: "incomplete" };

    setAttempts((value) => value + 1);
    const { allCorrect, feedbackByCardId } = buildPhaseFailureFeedback(placedCards, expectedCards);

    if (!allCorrect) {
      setCardFeedbackById(feedbackByCardId);
      setMistakes((value) => value + 1);
      return { status: "failed" };
    }

    clearPlacementFeedback();
    setDependencyWarning("");
    setSelected(null);

    const nextPhaseIndex = getNextRequiredPhaseIndex(slotIds, requiredCardsBySlot, activePhaseIndex + 1);
    if (nextPhaseIndex >= slotIds.length) {
      const elapsedMs = Math.max(0, Date.now() - startedAt);
      const underTime = elapsedMs <= timeLimitSec * 1000;
      const noHintBonus = !usedHint;
      const starCount = 1 + (underTime ? 1 : 0) + (noHintBonus ? 1 : 0);

      setRunSummary({
        allPassed: true,
        stars: starCount,
        elapsedMs,
        underTime,
        noHintBonus,
        usedHint,
        timeLimitSec,
      });
      setActivePhaseIndex(slotIds.length);
      setDeck([]);
      return { status: "completed", stars: starCount };
    }

    const nextSlotId = slotIds[nextPhaseIndex];
    setActivePhaseIndex(nextPhaseIndex);
    setDeck(nextSlotId ? buildPhaseTray(nextSlotId, requiredCardsBySlot, decoyPool) : []);
    return { status: "advanced", nextPhaseIndex };
  };

  const handleRun = () => {
    if (solveMode === "phased") return;
    setAttempts((value) => value + 1);
    const results = runAllTests(level, slots);
    setTestResults(results);

    const firstTrace = results[0]?.trace || [];
    setExecTrace(firstTrace);
    setExecStep(0);
    setPhase("executing");

    const didPass = results.every((result) => result.passed);
    const elapsedMs = Math.max(0, Date.now() - startedAt);
    const underTime = didPass && elapsedMs <= timeLimitSec * 1000;
    const noHintBonus = didPass && !usedHint;
    const starCount = didPass ? 1 + (underTime ? 1 : 0) + (noHintBonus ? 1 : 0) : 0;
    setRunSummary({
      allPassed: didPass,
      stars: starCount,
      elapsedMs,
      underTime,
      noHintBonus,
      usedHint,
      timeLimitSec,
    });

    if (!didPass) {
      const correct = getCorrectTrace(level);
      setDivergence(findDivergence(firstTrace, correct.trace));
      setCardFeedbackById(
        buildCardPlacementFeedback({
          level,
          slots,
          slotIds,
          slotNameById,
          dependencyAnalysis,
        })
      );
    } else {
      setDivergence(null);
      setCardFeedbackById({});
    }
    setDependencyWarning("");
  };

  const handleReset = () => {
    resetRound();
  };

  const handleBackToBuild = () => {
    setPhase("build");
    setTestResults(null);
    setExecTrace([]);
    setExecStep(0);
    setDivergence(null);
    setRunSummary(null);
    setDependencyWarning("");
  };

  const toggleHint = (cardId, canOpenHint) => {
    if (showHint === cardId) {
      setShowHint(null);
      return;
    }
    if (!canOpenHint) return;
    setShowHint(cardId);
    setHintUses((value) => value + 1);
    setUsedHint(true);
  };

  const allPassed = !!runSummary?.allPassed;
  const stars = Number(runSummary?.stars || 0);
  const totalPlaced = Object.values(slots).reduce((sum, items) => sum + items.length, 0);
  const requiredCards = solutionCards.length;
  const canRun = solveMode === "flat" && requiredCards > 0 && totalPlaced === requiredCards;
  const activePhaseSlotId = activePhaseSlotIds[0] || "";
  const activePhaseRequiredCount = (requiredCardsBySlot?.[activePhaseSlotId] || []).length;
  const activePhasePlacedCount = (slots?.[activePhaseSlotId] || []).length;
  const canCheckActivePhase = solveMode === "phased"
    && phase === "build"
    && !!activePhaseSlotId
    && activePhaseRequiredCount > 0
    && activePhasePlacedCount >= activePhaseRequiredCount;
  const checkButtonLabel = activePhaseSlotId
    ? `Check ${slotNameById?.[activePhaseSlotId] || activePhaseSlotId}`
    : "Check Phase";
  const elapsedMs = phase === "build"
    ? Math.max(0, nowMs - startedAt)
    : Math.max(0, Number(runSummary?.elapsedMs || 0));
  const timeRemainingMs = Math.max(0, timeLimitSec * 1000 - elapsedMs);

  return {
    slotDefs,
    slotIds,
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
    getPlacementDependencyWarning,
    handleCardClick,
    handleSlotClick,
    removeFromSlot,
    moveInSlot,
    handleCheckActivePhase,
    handleRun,
    handleReset,
    handleBackToBuild,
    toggleHint,
  };
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { MODES } from "../lib/constants";
import { shuffle } from "../lib/utils";

const EMPTY_SNAPSHOT = {
  roundItems: [],
  currentIdx: 0,
  choices: [],
  selected: null,
  score: 0,
  results: [],
  streak: 0,
  bestStreak: 0,
  showNext: false,
  showDesc: false,
  showTemplate: false,
  roundMeta: {
    isTutorial: false,
    flowKey: "",
  },
};

function toSafeNumber(value, fallback = 0) {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return next;
}

function normalizeRoundMeta(roundMeta) {
  if (!roundMeta || typeof roundMeta !== "object" || Array.isArray(roundMeta)) {
    return { isTutorial: false, flowKey: "" };
  }
  return {
    isTutorial: roundMeta.isTutorial === true,
    flowKey: typeof roundMeta.flowKey === "string" ? roundMeta.flowKey : "",
  };
}

function normalizeRoundSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return EMPTY_SNAPSHOT;

  const roundItems = Array.isArray(snapshot.roundItems) ? snapshot.roundItems.filter(Boolean) : [];
  const maxIdx = Math.max(0, roundItems.length - 1);
  const currentIdx = Math.min(maxIdx, Math.max(0, Math.floor(toSafeNumber(snapshot.currentIdx, 0))));

  const choices = Array.isArray(snapshot.choices)
    ? snapshot.choices.filter((choice) => typeof choice === "string" && choice.length > 0)
    : [];

  const selected = typeof snapshot.selected === "string" ? snapshot.selected : null;
  const results = Array.isArray(snapshot.results) ? snapshot.results.filter(Boolean) : [];

  return {
    roundItems,
    currentIdx,
    choices,
    selected,
    score: Math.max(0, Math.floor(toSafeNumber(snapshot.score, 0))),
    results,
    streak: Math.max(0, Math.floor(toSafeNumber(snapshot.streak, 0))),
    bestStreak: Math.max(0, Math.floor(toSafeNumber(snapshot.bestStreak, 0))),
    showNext: snapshot.showNext === true,
    showDesc: snapshot.showDesc === true,
    showTemplate: snapshot.showTemplate === true,
    roundMeta: normalizeRoundMeta(snapshot.roundMeta),
  };
}

function hasRecoverableRound(snapshot) {
  return Array.isArray(snapshot.roundItems) && snapshot.roundItems.length > 0;
}

export function useGameSession({
  mode,
  setMode,
  filterDifficulty,
  totalQuestions,
  itemsPool,
  buildChoices,
  stats,
  setStats,
  setHistory,
  history,
  persistModeProgress,
  buildRoundMeta,
  resetViewport,
  onRoundComplete,
  initialRoundState,
  initialRoundStateKey,
}) {
  const initialSnapshot = useMemo(() => normalizeRoundSnapshot(initialRoundState), [initialRoundState, initialRoundStateKey]);

  const [roundItems, setRoundItems] = useState(initialSnapshot.roundItems);
  const [currentIdx, setCurrentIdx] = useState(initialSnapshot.currentIdx);
  const [choices, setChoices] = useState(initialSnapshot.choices);
  const [selected, setSelected] = useState(initialSnapshot.selected);

  const [score, setScore] = useState(initialSnapshot.score);
  const [results, setResults] = useState(initialSnapshot.results);

  const [streak, setStreak] = useState(initialSnapshot.streak);
  const [bestStreak, setBestStreak] = useState(initialSnapshot.bestStreak);

  const [showNext, setShowNext] = useState(initialSnapshot.showNext);
  const [showDesc, setShowDesc] = useState(initialSnapshot.showDesc);
  const [showTemplate, setShowTemplate] = useState(initialSnapshot.showTemplate);
  const [roundMeta, setRoundMeta] = useState(initialSnapshot.roundMeta);

  const currentItem = roundItems[currentIdx];
  const historyRef = useRef(history || {});

  useEffect(() => {
    historyRef.current = history || {};
  }, [history]);

  const getChoices = useCallback(
    (pattern) => {
      if (!pattern) return [];
      return typeof buildChoices === "function" ? buildChoices(pattern) : [];
    },
    [buildChoices]
  );

  const clearRoundState = useCallback(() => {
    setRoundItems([]);
    setCurrentIdx(0);
    setChoices([]);
    setSelected(null);
    setScore(0);
    setResults([]);
    setStreak(0);
    setBestStreak(0);
    setShowNext(false);
    setShowDesc(false);
    setShowTemplate(false);
    setRoundMeta({ isTutorial: false, flowKey: "" });
  }, []);

  useEffect(() => {
    const snapshot = normalizeRoundSnapshot(initialRoundState);
    if (!hasRecoverableRound(snapshot)) {
      clearRoundState();
      return;
    }

    setRoundItems(snapshot.roundItems);
    setCurrentIdx(snapshot.currentIdx);
    setChoices(snapshot.choices);
    setSelected(snapshot.selected);
    setScore(snapshot.score);
    setResults(snapshot.results);
    setStreak(snapshot.streak);
    setBestStreak(snapshot.bestStreak);
    setShowNext(snapshot.showNext);
    setShowDesc(snapshot.showDesc);
    setShowTemplate(snapshot.showTemplate);
    setRoundMeta(snapshot.roundMeta);
  }, [clearRoundState, initialRoundState, initialRoundStateKey]);

  useEffect(() => {
    if (!currentItem) return;
    if (choices.length > 0) return;
    setChoices(getChoices(currentItem.pattern));
  }, [choices.length, currentItem, getChoices]);

  useEffect(() => {
    if (mode !== MODES.PLAY) return;
    if (currentItem?.promptKind !== "code") return;
    resetViewport();
  }, [currentItem?.id, currentItem?.promptKind, mode, resetViewport]);

  const startGame = useCallback((options = {}) => {
    const tutorialIds = Array.isArray(options?.itemIds)
      ? options.itemIds.map((id) => String(id)).filter(Boolean)
      : [];
    const nextRoundMeta = {
      isTutorial: options?.isTutorial === true,
      flowKey: typeof options?.flowKey === "string" ? options.flowKey : "",
    };

    let picked = [];
    if (tutorialIds.length > 0) {
      const itemById = new Map((itemsPool || []).map((item) => [String(item?.id || ""), item]));
      picked = tutorialIds.map((id) => itemById.get(String(id))).filter(Boolean);
    } else {
      let pool = itemsPool || [];
      if (filterDifficulty !== "All") pool = pool.filter((item) => item.difficulty === filterDifficulty);
      picked = shuffle(pool).slice(0, totalQuestions);
    }

    setRoundItems(picked);
    setCurrentIdx(0);
    setScore(0);
    setResults([]);
    setStreak(0);
    setBestStreak(0);
    setSelected(null);
    setShowNext(false);
    setShowDesc(false);
    setShowTemplate(false);
    setRoundMeta(nextRoundMeta);

    if (picked.length === 0) {
      setChoices([]);
      setRoundMeta({ isTutorial: false, flowKey: "" });
      return;
    }

    setChoices(getChoices(picked[0].pattern));

    setMode(MODES.PLAY);
    resetViewport();
  }, [filterDifficulty, getChoices, itemsPool, resetViewport, setMode, totalQuestions]);

  const handleSelect = useCallback(
    (choice) => {
      if (!currentItem) return;
      if (selected !== null) return;

      setSelected(choice);

      const correct = choice === currentItem.pattern;

      setHistory((prev) => {
        const entry = prev[currentItem.id] || { correct: 0, wrong: 0 };
        const next = {
          ...prev,
          [currentItem.id]: { correct: entry.correct + (correct ? 1 : 0), wrong: entry.wrong + (correct ? 0 : 1) },
        };
        historyRef.current = next;
        return next;
      });

      if (correct) {
        setScore((value) => value + 1);
        setStreak((value) => {
          const nextValue = value + 1;
          setBestStreak((bestValue) => Math.max(bestValue, nextValue));
          return nextValue;
        });
      } else {
        setStreak(0);
      }

      setResults((value) => [...value, { item: currentItem, chosen: choice, correct }]);
      setShowNext(true);
    },
    [currentItem, selected, setHistory]
  );

  const nextQuestion = useCallback(() => {
    if (currentIdx + 1 >= roundItems.length) {
      const finalCorrect = results.filter((result) => result.correct).length;
      if (!roundMeta.isTutorial) {
        const nextStats = {
          gamesPlayed: stats.gamesPlayed + 1,
          totalCorrect: stats.totalCorrect + finalCorrect,
          totalAnswered: stats.totalAnswered + roundItems.length,
          bestStreak: Math.max(stats.bestStreak, bestStreak),
        };

        setStats(nextStats);
        const nextMeta =
          typeof buildRoundMeta === "function"
            ? (prevMeta) => buildRoundMeta({ prevMeta, roundItems, results, finalCorrect })
            : undefined;
        void persistModeProgress(nextStats, historyRef.current, nextMeta);
      }
      setMode(MODES.RESULTS);
      onRoundComplete?.({
        isTutorial: roundMeta.isTutorial,
        flowKey: roundMeta.flowKey,
        roundLength: roundItems.length,
        finalCorrect,
      });
      resetViewport();
      return;
    }

    const nextIndex = currentIdx + 1;
    setCurrentIdx(nextIndex);
    setSelected(null);
    setShowNext(false);
    setShowDesc(false);
    setShowTemplate(false);
    setChoices(getChoices(roundItems[nextIndex].pattern));
    resetViewport();
  }, [
    bestStreak,
    buildRoundMeta,
    currentIdx,
    getChoices,
    onRoundComplete,
    persistModeProgress,
    resetViewport,
    results,
    roundMeta.flowKey,
    roundMeta.isTutorial,
    roundItems,
    setMode,
    setStats,
    stats.bestStreak,
    stats.gamesPlayed,
    stats.totalAnswered,
    stats.totalCorrect,
  ]);

  useEffect(() => {
    const handler = (event) => {
      if (mode !== MODES.PLAY) return;

      if (showNext && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        nextQuestion();
        return;
      }

      const isDescriptionHotkey =
        event.code === "KeyD" || (event.code !== "KeyD" && (event.key === "d" || event.key === "D"));

      if (isDescriptionHotkey && currentItem?.promptKind === "question") {
        setShowDesc((value) => !value);
        return;
      }

      if (event.key === "t" || event.key === "T") {
        if (showNext) setShowTemplate((value) => !value);
        return;
      }

      if (!showNext && selected === null) {
        const number = Number.parseInt(event.key, 10);
        if (number >= 1 && number <= 4 && choices[number - 1]) handleSelect(choices[number - 1]);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [choices, currentItem?.promptKind, handleSelect, mode, nextQuestion, selected, showNext]);

  return {
    roundItems,
    currentItem,
    currentIdx,
    choices,
    selected,
    score,
    results,
    streak,
    bestStreak,
    showNext,
    showDesc,
    setShowDesc,
    showTemplate,
    setShowTemplate,
    roundMeta,
    startGame,
    handleSelect,
    nextQuestion,
  };
}

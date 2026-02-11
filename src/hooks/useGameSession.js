import { useCallback, useEffect, useRef, useState } from "react";

import { MODES } from "../lib/constants";
import { shuffle } from "../lib/utils";

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
  resetViewport,
  onRoundComplete,
}) {
  const [roundItems, setRoundItems] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [choices, setChoices] = useState([]);
  const [selected, setSelected] = useState(null);

  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]);

  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const [showNext, setShowNext] = useState(false);
  const [showDesc, setShowDesc] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);

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

  const startGame = useCallback(() => {
    let pool = itemsPool || [];
    if (filterDifficulty !== "All") pool = pool.filter((item) => item.difficulty === filterDifficulty);

    const picked = shuffle(pool).slice(0, totalQuestions);

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

    if (picked.length === 0) {
      setChoices([]);
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
      const nextStats = {
        gamesPlayed: stats.gamesPlayed + 1,
        totalCorrect: stats.totalCorrect + finalCorrect,
        totalAnswered: stats.totalAnswered + roundItems.length,
        bestStreak: Math.max(stats.bestStreak, bestStreak),
      };

      setStats(nextStats);
      void persistModeProgress(nextStats, historyRef.current);
      setMode(MODES.RESULTS);
      onRoundComplete?.();
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
    currentIdx,
    getChoices,
    onRoundComplete,
    persistModeProgress,
    resetViewport,
    results,
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

      if ((event.key === "d" || event.key === "D") && currentItem?.promptKind === "question") {
        setShowDesc((value) => !value);
        return;
      }

      if (event.key === "t" || event.key === "T") {
        if (showNext) setShowTemplate((value) => !value);
        return;
      }

      if (!showNext && selected === null) {
        const number = parseInt(event.key, 10);
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
    startGame,
    handleSelect,
    nextQuestion,
  };
}

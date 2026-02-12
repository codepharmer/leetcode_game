import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { GAME_TYPES, MODES } from "./lib/constants";
import { GAME_TYPE_OPTIONS, getGameTypeConfig } from "./lib/gameContent";
import { createDefaultProgress, getModeProgress, setModeProgress } from "./lib/progressModel";
import { calcLifetimePct, calcRoundPct, getMasteredCount, getWeakSpots, groupItemsByPattern } from "./lib/selectors";
import { S } from "./styles";

import { useAuthSession } from "./hooks/useAuthSession";
import { useGameSession } from "./hooks/useGameSession";
import { useProgressSync } from "./hooks/useProgressSync";
import { BrowseScreen } from "./screens/BrowseScreen";
import { BlueprintScreen } from "./screens/BlueprintScreen";
import { MenuScreen } from "./screens/MenuScreen";
import { PlayScreen } from "./screens/PlayScreen";
import { ResultsScreen } from "./screens/ResultsScreen";
import { TemplatesScreen } from "./screens/TemplatesScreen";

export default function App() {
  const [mode, setMode] = useState(MODES.MENU);
  const [gameType, setGameType] = useState(GAME_TYPES.QUESTION_TO_PATTERN);
  const [filterDifficulty, setFilterDifficulty] = useState("All");
  const [totalQuestions, setTotalQuestions] = useState(20);

  const [browseFilter, setBrowseFilter] = useState("All");
  const [expandedBrowse, setExpandedBrowse] = useState({});
  const [expandedResult, setExpandedResult] = useState({});
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const progressSnapshotRef = useRef({ progress: createDefaultProgress() });
  const getProgressSnapshot = useCallback(() => progressSnapshotRef.current, []);

  const { user, setUser, authError, setAuthError, handleGoogleSuccess, handleGoogleError, handleSignOut } =
    useAuthSession({ getProgressSnapshot });

  const { loaded, progress, setProgress, progressRef, persistProgress } = useProgressSync({
    user,
    setUser,
    setAuthError,
  });

  progressSnapshotRef.current = { progress: progressRef.current };

  const activeGame = useMemo(() => getGameTypeConfig(gameType), [gameType]);
  const modeProgress = useMemo(() => getModeProgress(progress, gameType), [gameType, progress]);
  const stats = modeProgress.stats;
  const history = modeProgress.history;
  const modeMeta = modeProgress.meta || {};

  useEffect(() => {
    if (activeGame.supportsQuestionCount === false) return;
    const max = activeGame.items.length;
    if (max > 0 && totalQuestions > max) setTotalQuestions(max);
  }, [activeGame.items.length, activeGame.supportsQuestionCount, totalQuestions]);

  useEffect(() => {
    setExpandedBrowse({});
    setExpandedResult({});
  }, [gameType]);

  const setModeStats = useCallback(
    (nextStats) => {
      const currentProgress = progressRef.current;
      const currentModeProgress = getModeProgress(currentProgress, gameType);
      const nextProgress = setModeProgress(currentProgress, gameType, { ...currentModeProgress, stats: nextStats });
      progressRef.current = nextProgress;
      setProgress(nextProgress);
    },
    [gameType, progressRef, setProgress]
  );

  const setModeHistory = useCallback(
    (updater) => {
      const currentProgress = progressRef.current;
      const currentModeProgress = getModeProgress(currentProgress, gameType);
      const prevHistory = currentModeProgress.history || {};
      const nextHistory = typeof updater === "function" ? updater(prevHistory) : updater || {};
      const nextProgress = setModeProgress(currentProgress, gameType, { ...currentModeProgress, history: nextHistory });
      progressRef.current = nextProgress;
      setProgress(nextProgress);
      return nextHistory;
    },
    [gameType, progressRef, setProgress]
  );

  const setModeMeta = useCallback(
    (updater) => {
      const currentProgress = progressRef.current;
      const currentModeProgress = getModeProgress(currentProgress, gameType);
      const prevMeta = currentModeProgress.meta || {};
      const nextMeta = typeof updater === "function" ? updater(prevMeta) : updater || {};
      const nextProgress = setModeProgress(currentProgress, gameType, { ...currentModeProgress, meta: nextMeta });
      progressRef.current = nextProgress;
      setProgress(nextProgress);
      return nextMeta;
    },
    [gameType, progressRef, setProgress]
  );

  const persistModeProgress = useCallback(
    (nextStats, nextHistory, nextMeta) => {
      const currentProgress = progressRef.current;
      const currentModeProgress = getModeProgress(currentProgress, gameType);
      const nextProgress = setModeProgress(currentProgress, gameType, {
        ...currentModeProgress,
        stats: nextStats,
        history: nextHistory || {},
        meta: (nextMeta ?? currentModeProgress.meta) || {},
      });

      progressRef.current = nextProgress;
      setProgress(nextProgress);
      void persistProgress(nextProgress);
    },
    [gameType, persistProgress, progressRef, setProgress]
  );

  const resetViewport = useCallback(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  const handleRoundComplete = useCallback(() => {
    setExpandedResult({});
  }, []);

  const blueprintStars = useMemo(() => {
    const source = modeMeta?.levelStars;
    if (!source || typeof source !== "object") return {};
    const out = {};
    for (const key of Object.keys(source)) {
      const value = Number(source[key]);
      if (Number.isFinite(value) && value > 0) out[key] = Math.max(0, Math.min(3, Math.round(value)));
    }
    return out;
  }, [modeMeta]);

  const saveBlueprintStars = useCallback(
    (levelId, stars) => {
      const safeLevelId = String(levelId);
      const safeStars = Math.max(0, Math.min(3, Number(stars) || 0));
      const nextMeta = setModeMeta((prevMeta) => {
        const prevStars = prevMeta?.levelStars || {};
        const nextStars = Math.max(Number(prevStars[safeLevelId] || 0), safeStars);
        return { ...prevMeta, levelStars: { ...prevStars, [safeLevelId]: nextStars } };
      });
      persistModeProgress(stats, history, nextMeta);
    },
    [history, persistModeProgress, setModeMeta, stats]
  );

  const {
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
  } = useGameSession({
    mode,
    setMode,
    filterDifficulty,
    totalQuestions,
    itemsPool: activeGame.items,
    buildChoices: activeGame.buildChoices,
    stats,
    setStats: setModeStats,
    setHistory: setModeHistory,
    history,
    persistModeProgress,
    resetViewport,
    onRoundComplete: handleRoundComplete,
  });

  const startSelectedMode = useCallback(() => {
    if (gameType === GAME_TYPES.BLUEPRINT_BUILDER) {
      setMode(MODES.BLUEPRINT);
      resetViewport();
      return;
    }
    startGame();
  }, [gameType, resetViewport, setMode, startGame]);

  const resetAllData = useCallback(async () => {
    const freshProgress = createDefaultProgress();
    progressRef.current = freshProgress;
    setProgress(freshProgress);
    await persistProgress(freshProgress);
    setShowResetConfirm(false);
  }, [persistProgress, progressRef, setProgress]);

  const pct = calcRoundPct(score, roundItems.length);
  const lifetimePct = calcLifetimePct(stats);

  const weakSpots = useMemo(() => getWeakSpots(activeGame.items, history), [activeGame.items, history]);
  const masteredCount = useMemo(() => getMasteredCount(activeGame.items, history), [activeGame.items, history]);
  const groupedByPattern = useMemo(
    () => groupItemsByPattern(activeGame.items, browseFilter),
    [activeGame.items, browseFilter]
  );

  if (!loaded) {
    return (
      <div style={{ ...S.root, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <span style={{ color: "var(--dim)", animation: "pulse 1s ease-in-out infinite" }}>loading...</span>
      </div>
    );
  }

  return (
    <div style={S.root}>
      {mode === MODES.MENU && (
        <MenuScreen
          gameType={gameType}
          setGameType={setGameType}
          gameTypeOptions={GAME_TYPE_OPTIONS}
          menuSubtitle={activeGame.menuSubtitle}
          roundNoun={activeGame.roundNoun}
          stats={stats}
          lifetimePct={lifetimePct}
          masteredCount={masteredCount}
          totalAvailableQuestions={activeGame.items.length}
          weakSpots={weakSpots}
          history={history}
          user={user}
          authError={authError}
          onGoogleSuccess={handleGoogleSuccess}
          onGoogleError={handleGoogleError}
          onSignOut={handleSignOut}
          filterDifficulty={filterDifficulty}
          setFilterDifficulty={setFilterDifficulty}
          totalQuestions={totalQuestions}
          setTotalQuestions={setTotalQuestions}
          startGame={startSelectedMode}
          goBrowse={() => setMode(MODES.BROWSE)}
          goTemplates={() => setMode(MODES.TEMPLATES)}
          supportsBrowse={activeGame.supportsBrowse !== false}
          supportsTemplates={activeGame.supportsTemplates !== false}
          supportsDifficultyFilter={activeGame.supportsDifficultyFilter !== false}
          supportsQuestionCount={activeGame.supportsQuestionCount !== false}
          showResetConfirm={showResetConfirm}
          setShowResetConfirm={setShowResetConfirm}
          resetAllData={resetAllData}
        />
      )}

      {mode === MODES.PLAY && (
        <PlayScreen
          currentItem={currentItem}
          currentIdx={currentIdx}
          total={roundItems.length}
          score={score}
          streak={streak}
          choices={choices}
          selected={selected}
          showDesc={showDesc}
          setShowDesc={setShowDesc}
          showNext={showNext}
          onSelect={handleSelect}
          onNext={nextQuestion}
          onBack={() => setMode(MODES.MENU)}
          showTemplate={showTemplate}
          setShowTemplate={setShowTemplate}
          history={history}
          promptLabel={activeGame.promptLabel}
          revealTemplateAfterAnswer={activeGame.revealTemplateAfterAnswer}
        />
      )}

      {mode === MODES.RESULTS && (
        <ResultsScreen
          user={user}
          pct={pct}
          score={score}
          total={roundItems.length}
          bestStreak={bestStreak}
          stats={stats}
          lifetimePct={lifetimePct}
          results={results}
          expandedResult={expandedResult}
          setExpandedResult={setExpandedResult}
          startGame={startGame}
          goMenu={() => setMode(MODES.MENU)}
          history={history}
          gameType={gameType}
        />
      )}

      {mode === MODES.BROWSE && (
        <BrowseScreen
          browseFilter={browseFilter}
          setBrowseFilter={setBrowseFilter}
          groupedByPattern={groupedByPattern}
          expandedBrowse={expandedBrowse}
          setExpandedBrowse={setExpandedBrowse}
          goMenu={() => setMode(MODES.MENU)}
          history={history}
          browseTitle={activeGame.browseTitle}
        />
      )}

      {mode === MODES.TEMPLATES && <TemplatesScreen goMenu={() => setMode(MODES.MENU)} />}

      {mode === MODES.BLUEPRINT && (
        <BlueprintScreen
          goMenu={() => setMode(MODES.MENU)}
          initialStars={blueprintStars}
          onSaveStars={saveBlueprintStars}
        />
      )}
    </div>
  );
}

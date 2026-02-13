import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { GAME_TYPES, MODES } from "./lib/constants";
import { getBlueprintCampaign } from "./lib/blueprint/campaign";
import { GAME_TYPE_OPTIONS, getGameTypeConfig } from "./lib/gameContent";
import { createDefaultProgress, getModeProgress, setModeProgress } from "./lib/progressModel";
import { calcLifetimePct, calcRoundPct, getMasteredCount, getWeakSpots, groupItemsByPattern } from "./lib/selectors";
import {
  buildBlueprintChallengePath,
  buildBlueprintDailyPath,
  buildBlueprintWorldPath,
  buildRouteSearch,
  getModeFromPathname,
  getPathForMode,
  parseRouteSettings,
  ROUTES,
} from "./lib/routes";
import { clearRoundSession, loadRoundSessionForGameType, saveRoundSession } from "./lib/roundSession";
import { S } from "./styles";

import { useAuthSession } from "./hooks/useAuthSession";
import { useGameSession } from "./hooks/useGameSession";
import { useProgressSync } from "./hooks/useProgressSync";
import { BlueprintScreen } from "./screens/BlueprintScreen";
import { BrowseScreen } from "./screens/BrowseScreen";
import { MenuScreen } from "./screens/MenuScreen";
import { PlayScreen } from "./screens/PlayScreen";
import { ResultsScreen } from "./screens/ResultsScreen";
import { TemplatesScreen } from "./screens/TemplatesScreen";

const BLUEPRINT_MENU_PREVIEW_WORLDS = [
  { worldId: 1, label: "Fundamentals" },
  { worldId: 7, label: "Graphs" },
  { worldId: 8, label: "Dynamic Programming" },
];

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const routeSettings = useMemo(() => parseRouteSettings(location.search), [location.search]);

  const [gameType, setGameType] = useState(routeSettings.gameType);
  const [filterDifficulty, setFilterDifficulty] = useState(routeSettings.filterDifficulty);
  const [totalQuestions, setTotalQuestions] = useState(routeSettings.totalQuestions);

  const [browseFilter, setBrowseFilter] = useState(routeSettings.browseFilter);
  const [expandedBrowse, setExpandedBrowse] = useState({});
  const [expandedResult, setExpandedResult] = useState({});
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const routeStateRef = useRef({
    gameType,
    filterDifficulty,
    totalQuestions,
    browseFilter,
  });
  routeStateRef.current = {
    gameType,
    filterDifficulty,
    totalQuestions,
    browseFilter,
  };

  const progressSnapshotRef = useRef({ progress: createDefaultProgress() });
  const syncingFromLocationRef = useRef(false);
  const getProgressSnapshot = useCallback(() => progressSnapshotRef.current, []);

  useEffect(() => {
    const routeState = routeStateRef.current;
    const shouldSyncFromLocation =
      routeState.gameType !== routeSettings.gameType ||
      routeState.filterDifficulty !== routeSettings.filterDifficulty ||
      routeState.totalQuestions !== routeSettings.totalQuestions ||
      routeState.browseFilter !== routeSettings.browseFilter;

    if (!shouldSyncFromLocation) return;

    syncingFromLocationRef.current = true;
    setGameType(routeSettings.gameType);
    setFilterDifficulty(routeSettings.filterDifficulty);
    setTotalQuestions(routeSettings.totalQuestions);
    setBrowseFilter(routeSettings.browseFilter);
  }, [
    routeSettings.browseFilter,
    routeSettings.filterDifficulty,
    routeSettings.gameType,
    routeSettings.totalQuestions,
  ]);

  const mode = useMemo(() => getModeFromPathname(location.pathname), [location.pathname]);

  const {
    user,
    setUser,
    authError,
    setAuthError,
    handleGoogleSuccess,
    handleGoogleError,
    handleSignOut,
  } = useAuthSession({ getProgressSnapshot });

  const { loaded, progress, setProgress, progressRef, persistProgress } = useProgressSync({
    user,
    setUser,
    setAuthError,
  });

  progressSnapshotRef.current = { progress: progressRef.current };

  const activeGame = useMemo(() => getGameTypeConfig(gameType), [gameType]);
  const modeProgress = useMemo(() => getModeProgress(progress, gameType), [gameType, progress]);
  const blueprintModeProgress = useMemo(
    () => getModeProgress(progress, GAME_TYPES.BLUEPRINT_BUILDER),
    [progress]
  );
  const stats = modeProgress.stats;
  const history = modeProgress.history;

  useEffect(() => {
    if (activeGame.supportsQuestionCount === false) return;
    const max = activeGame.items.length;
    if (max > 0 && totalQuestions > max) setTotalQuestions(max);
  }, [activeGame.items.length, activeGame.supportsQuestionCount, totalQuestions]);

  useEffect(() => {
    setExpandedBrowse({});
    setExpandedResult({});
  }, [gameType]);

  const updateModeProgress = useCallback(
    (updater) => {
      const currentProgress = progressRef.current;
      const currentModeProgress = getModeProgress(currentProgress, gameType);
      const nextModeProgress =
        typeof updater === "function" ? updater(currentModeProgress) : updater || currentModeProgress;
      const nextProgress = setModeProgress(currentProgress, gameType, nextModeProgress);
      progressRef.current = nextProgress;
      setProgress(nextProgress);
      return { nextModeProgress, nextProgress };
    },
    [gameType, progressRef, setProgress]
  );

  const setModeStats = useCallback(
    (nextStats) => {
      updateModeProgress((currentModeProgress) => ({ ...currentModeProgress, stats: nextStats }));
    },
    [updateModeProgress]
  );

  const setModeHistory = useCallback(
    (updater) => {
      let resolvedHistory = {};
      updateModeProgress((currentModeProgress) => {
        const prevHistory = currentModeProgress.history || {};
        resolvedHistory = typeof updater === "function" ? updater(prevHistory) : updater || {};
        return { ...currentModeProgress, history: resolvedHistory };
      });
      return resolvedHistory;
    },
    [updateModeProgress]
  );

  const persistModeProgress = useCallback(
    (nextStats, nextHistory, nextMeta) => {
      const { nextProgress } = updateModeProgress((currentModeProgress) => ({
        ...currentModeProgress,
        stats: nextStats,
        history: nextHistory || {},
        meta: (nextMeta ?? currentModeProgress.meta) || {},
      }));
      void persistProgress(nextProgress);
    },
    [persistProgress, updateModeProgress]
  );

  const resetViewport = useCallback(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  const handleRoundComplete = useCallback(() => {
    setExpandedResult({});
  }, []);

  const currentSearch = useMemo(
    () =>
      buildRouteSearch({
        gameType,
        filterDifficulty,
        totalQuestions,
        browseFilter,
      }),
    [browseFilter, filterDifficulty, gameType, totalQuestions]
  );
  const normalizedLocationSearch = useMemo(
    () => buildRouteSearch(parseRouteSettings(location.search)),
    [location.search]
  );

  useEffect(() => {
    if (syncingFromLocationRef.current) {
      syncingFromLocationRef.current = false;
      return;
    }

    if (normalizedLocationSearch === currentSearch) return;
    navigate({ pathname: location.pathname, search: currentSearch }, { replace: true });
  }, [currentSearch, location.pathname, navigate, normalizedLocationSearch]);

  const navigateWithSearch = useCallback(
    (pathname, options) => {
      navigate({ pathname, search: currentSearch }, options);
    },
    [currentSearch, navigate]
  );

  const setMode = useCallback(
    (nextMode) => {
      const nextPath = getPathForMode(nextMode);
      navigateWithSearch(nextPath);
    },
    [navigateWithSearch]
  );

  const redirectToMenuWithNotice = useCallback(
    (notice) => {
      navigate(
        { pathname: ROUTES.MENU, search: currentSearch },
        {
          replace: true,
          state: { notice },
        }
      );
    },
    [currentSearch, navigate]
  );

  const initialRoundSession = useMemo(() => loadRoundSessionForGameType(gameType), [gameType]);

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
    initialRoundState: initialRoundSession.state,
    initialRoundStateKey: initialRoundSession.key,
  });

  useEffect(() => {
    if (!Array.isArray(roundItems) || roundItems.length === 0) {
      clearRoundSession();
      return;
    }

    saveRoundSession({
      gameType,
      roundItems,
      currentIdx,
      choices,
      selected,
      score,
      results,
      streak,
      bestStreak,
      showNext,
      showDesc,
      showTemplate,
    });
  }, [
    bestStreak,
    choices,
    currentIdx,
    gameType,
    results,
    roundItems,
    score,
    selected,
    showDesc,
    showNext,
    showTemplate,
    streak,
  ]);

  useEffect(() => {
    if (!loaded) return;

    if (mode === MODES.PLAY && roundItems.length === 0) {
      redirectToMenuWithNotice("Round not found. Start a new round.");
      return;
    }

    if (mode === MODES.RESULTS && results.length === 0) {
      redirectToMenuWithNotice("No results to show yet.");
    }
  }, [loaded, mode, redirectToMenuWithNotice, results.length, roundItems.length]);

  const blueprintStars = useMemo(() => {
    const source = blueprintModeProgress?.meta?.levelStars;
    if (!source || typeof source !== "object") return {};
    const out = {};
    for (const key of Object.keys(source)) {
      const value = Number(source[key]);
      if (Number.isFinite(value) && value > 0) out[key] = Math.max(0, Math.min(3, Math.round(value)));
    }
    return out;
  }, [blueprintModeProgress]);

  const blueprintCampaign = useMemo(() => getBlueprintCampaign(blueprintStars), [blueprintStars]);

  const saveBlueprintStars = useCallback(
    (levelId, stars) => {
      const safeLevelId = String(levelId);
      const safeStars = Math.max(0, Math.min(3, Number(stars) || 0));
      const currentProgress = progressRef.current;
      const currentBlueprintProgress = getModeProgress(currentProgress, GAME_TYPES.BLUEPRINT_BUILDER);
      const prevMeta = currentBlueprintProgress?.meta || {};
      const prevStars = prevMeta.levelStars || {};
      const nextStars = Math.max(Number(prevStars[safeLevelId] || 0), safeStars);

      const nextBlueprintProgress = {
        ...currentBlueprintProgress,
        meta: { ...prevMeta, levelStars: { ...prevStars, [safeLevelId]: nextStars } },
      };

      const nextProgress = setModeProgress(currentProgress, GAME_TYPES.BLUEPRINT_BUILDER, nextBlueprintProgress);
      progressRef.current = nextProgress;
      setProgress(nextProgress);
      void persistProgress(nextProgress);
    },
    [persistProgress, progressRef, setProgress]
  );

  const openBlueprintDailyPreview = useCallback(() => {
    const dailyChallengeId = blueprintCampaign?.dailyChallenge?.challenge?.id;
    if (dailyChallengeId) {
      navigateWithSearch(buildBlueprintChallengePath(dailyChallengeId));
    } else {
      navigateWithSearch(buildBlueprintDailyPath());
    }
    resetViewport();
  }, [blueprintCampaign, navigateWithSearch, resetViewport]);

  const openBlueprintWorldPreview = useCallback(
    (worldId) => {
      const safeWorldId = Number(worldId);
      if (!Number.isFinite(safeWorldId) || safeWorldId <= 0) return;
      navigateWithSearch(buildBlueprintWorldPath(safeWorldId));
      resetViewport();
    },
    [navigateWithSearch, resetViewport]
  );

  const startSelectedMode = useCallback(() => {
    if (gameType === GAME_TYPES.BLUEPRINT_BUILDER) {
      navigateWithSearch(ROUTES.BLUEPRINT);
      resetViewport();
      return;
    }
    startGame();
  }, [gameType, navigateWithSearch, resetViewport, startGame]);

  const resetAllData = useCallback(async () => {
    const freshProgress = createDefaultProgress();
    progressRef.current = freshProgress;
    setProgress(freshProgress);
    clearRoundSession();
    await persistProgress(freshProgress);
    setShowResetConfirm(false);
    navigateWithSearch(ROUTES.MENU, { replace: true });
  }, [navigateWithSearch, persistProgress, progressRef, setProgress]);

  const pct = calcRoundPct(score, roundItems.length);
  const lifetimePct = calcLifetimePct(stats);

  const modeProgressByGameType = useMemo(() => {
    const out = {};
    for (const option of GAME_TYPE_OPTIONS) {
      const type = option.value;
      const modeState = getModeProgress(progress, type);
      const modeStats = modeState.stats || {};
      const modeHistory = modeState.history || {};
      const modeGame = getGameTypeConfig(type);

      out[type] = {
        stats: modeStats,
        lifetimePct: calcLifetimePct(modeStats),
        masteredCount: getMasteredCount(modeGame.items, modeHistory),
        allCount: modeGame.items.length,
      };
    }
    return out;
  }, [progress]);

  const weakSpots = useMemo(() => getWeakSpots(activeGame.items, history), [activeGame.items, history]);
  const masteredCount = useMemo(() => getMasteredCount(activeGame.items, history), [activeGame.items, history]);
  const groupedByPattern = useMemo(
    () => groupItemsByPattern(activeGame.items, browseFilter),
    [activeGame.items, browseFilter]
  );

  const blueprintCampaignPreview = useMemo(() => {
    const worldsById = new Map((blueprintCampaign?.worlds || []).map((world) => [world.id, world]));
    const worlds = BLUEPRINT_MENU_PREVIEW_WORLDS.map((entry) => {
      const world = worldsById.get(entry.worldId);
      return {
        worldId: entry.worldId,
        label: entry.label,
        progressLabel: `${world?.completedCount || 0}/${world?.totalCount || 0}`,
      };
    });
    return { dailyChallenge: blueprintCampaign?.dailyChallenge || null, worlds };
  }, [blueprintCampaign]);

  const routeNotice = typeof location.state?.notice === "string" ? location.state.notice : "";

  const menuScreenProps = {
    gameType,
    setGameType,
    gameTypeOptions: GAME_TYPE_OPTIONS,
    menuSubtitle: activeGame.menuSubtitle,
    roundNoun: activeGame.roundNoun,
    stats,
    lifetimePct,
    masteredCount,
    totalAvailableQuestions: activeGame.items.length,
    weakSpots,
    history,
    user,
    authError,
    onGoogleSuccess: handleGoogleSuccess,
    onGoogleError: handleGoogleError,
    onSignOut: handleSignOut,
    filterDifficulty,
    setFilterDifficulty,
    totalQuestions,
    setTotalQuestions,
    startGame: startSelectedMode,
    goBrowse: () => navigateWithSearch(ROUTES.BROWSE),
    goTemplates: () => navigateWithSearch(ROUTES.TEMPLATES),
    supportsBrowse: activeGame.supportsBrowse !== false,
    supportsTemplates: activeGame.supportsTemplates !== false,
    supportsDifficultyFilter: activeGame.supportsDifficultyFilter !== false,
    supportsQuestionCount: activeGame.supportsQuestionCount !== false,
    showResetConfirm,
    setShowResetConfirm,
    resetAllData,
    routeNotice,
    modeProgressByGameType,
    blueprintCampaignPreview,
    onOpenBlueprintDaily: openBlueprintDailyPreview,
    onOpenBlueprintWorld: openBlueprintWorldPreview,
  };

  if (!loaded) {
    return (
      <div style={{ ...S.root, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <span style={{ color: "var(--dim)", animation: "pulse 1s ease-in-out infinite" }}>loading...</span>
      </div>
    );
  }

  return (
    <div style={S.root}>
      <Routes>
        <Route path={ROUTES.MENU} element={<MenuScreen {...menuScreenProps} />} />

        <Route
          path={ROUTES.PLAY}
          element={(
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
              onBack={() => navigateWithSearch(ROUTES.MENU)}
              showTemplate={showTemplate}
              setShowTemplate={setShowTemplate}
              history={history}
              promptLabel={activeGame.promptLabel}
              revealTemplateAfterAnswer={activeGame.revealTemplateAfterAnswer}
            />
          )}
        />

        <Route
          path={ROUTES.RESULTS}
          element={(
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
              goMenu={() => navigateWithSearch(ROUTES.MENU)}
              history={history}
              gameType={gameType}
            />
          )}
        />

        <Route
          path={ROUTES.BROWSE}
          element={(
            <BrowseScreen
              browseFilter={browseFilter}
              setBrowseFilter={setBrowseFilter}
              groupedByPattern={groupedByPattern}
              expandedBrowse={expandedBrowse}
              setExpandedBrowse={setExpandedBrowse}
              goMenu={() => navigateWithSearch(ROUTES.MENU)}
              history={history}
              browseTitle={activeGame.browseTitle}
            />
          )}
        />

        <Route path={ROUTES.TEMPLATES} element={<TemplatesScreen goMenu={() => navigateWithSearch(ROUTES.MENU)} />} />

        <Route
          path={`${ROUTES.BLUEPRINT}/*`}
          element={(
            <BlueprintScreen
              goMenu={() => navigateWithSearch(ROUTES.MENU)}
              initialStars={blueprintStars}
              onSaveStars={saveBlueprintStars}
            />
          )}
        />

        <Route
          path="*"
          element={
            <Navigate
              replace
              to={{ pathname: ROUTES.MENU, search: currentSearch }}
              state={{ notice: "Page not found. Redirected to menu." }}
            />
          }
        />
      </Routes>
    </div>
  );
}

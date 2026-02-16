import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { GAME_TYPES, MODES } from "./lib/constants";
import { getBlueprintCampaign } from "./lib/blueprint/campaign";
import { GAME_TYPE_OPTIONS, getGameTypeConfig } from "./lib/gameContent";
import { createDefaultProgress, getModeProgress, setModeProgress } from "./lib/progressModel";
import {
  calcLifetimePct,
  calcRoundPct,
  getMasteredCount,
  getWeakSpots,
  groupItemsByPattern,
  selectAccuracyTrend,
  selectIncorrectAttempts,
} from "./lib/selectors";
import {
  buildBlueprintChallengePath,
  buildBlueprintDailyPath,
  buildBlueprintWorldPath,
  buildRouteSearch,
  getModeFromPathname,
  ROUTES,
} from "./lib/routes";
import { clearRoundSession, loadRoundSessionForGameType, saveRoundSession } from "./lib/roundSession";
import { S } from "./styles";

import { useAuthSession } from "./hooks/useAuthSession";
import { useGameSession } from "./hooks/useGameSession";
import { useProgressSync } from "./hooks/useProgressSync";
import { useRouteSettings } from "./hooks/useRouteSettings";
import { BlueprintScreen } from "./screens/BlueprintScreen";
import { BrowseScreen } from "./screens/BrowseScreen";
import { MenuScreen } from "./screens/MenuScreen";
import { PlayScreen } from "./screens/PlayScreen";
import { ReviewScreen } from "./screens/ReviewScreen";
import { ResultsScreen } from "./screens/ResultsScreen";
import { TemplatesScreen } from "./screens/TemplatesScreen";

const BLUEPRINT_MENU_PREVIEW_WORLDS = [
  { worldId: 0, label: "Primitives" },
  { worldId: 7, label: "Graphs" },
  { worldId: 8, label: "Dynamic Programming" },
];

function findNextBlueprintChallenge(campaign, levelStars) {
  const worlds = Array.isArray(campaign?.worlds) ? campaign.worlds : [];
  for (const world of worlds) {
    if (!world?.isUnlocked || world?.isComplete) continue;
    const levelIds = Array.isArray(world?.levelIds) ? world.levelIds : [];
    for (const levelId of levelIds) {
      const stars = Number(levelStars?.[String(levelId)] || 0);
      if (stars >= 1) continue;
      const challenge = world?.challengeByLevelId?.[String(levelId)];
      if (challenge?.id && challenge?.level) {
        return { challenge, world, source: "campaign" };
      }
    }
  }

  if (campaign?.dailyChallenge?.challenge?.id && campaign?.dailyChallenge?.challenge?.level) {
    const dailyWorld = worlds.find((world) => world.id === campaign.dailyChallenge.worldId) || null;
    return { challenge: campaign.dailyChallenge.challenge, world: dailyWorld, source: "daily" };
  }

  return null;
}

function toSafeTimestamp(value, fallback) {
  const ts = Math.floor(Number(value));
  if (!Number.isFinite(ts) || ts <= 0) return fallback;
  return ts;
}

function buildRoundMetaUpdate(prevMeta, gameType, roundResults) {
  const safeResults = Array.isArray(roundResults) ? roundResults.filter(Boolean) : [];
  if (safeResults.length === 0) return prevMeta || {};

  const now = Date.now();
  const priorMeta = prevMeta && typeof prevMeta === "object" ? prevMeta : {};
  const priorAttemptEvents = Array.isArray(priorMeta.attemptEvents) ? priorMeta.attemptEvents : [];
  const priorRoundSnapshots = Array.isArray(priorMeta.roundSnapshots) ? priorMeta.roundSnapshots : [];

  const attemptEvents = safeResults.map((result, index) => {
    const item = result?.item || result?.question || {};
    const sourceLeetcodeId = Number(item.sourceLeetcodeId);
    const event = {
      ts: now + index,
      gameType,
      itemId: String(item.id || ""),
      title: String(item.title || item.name || item.id || ""),
      chosen: typeof result?.chosen === "string" ? result.chosen : "",
      pattern: typeof item.pattern === "string" ? item.pattern : "",
      correct: result?.correct === true,
    };
    if (Number.isInteger(sourceLeetcodeId) && sourceLeetcodeId > 0) {
      event.sourceLeetcodeId = sourceLeetcodeId;
    }
    return event;
  });

  const correct = safeResults.reduce((count, result) => count + (result?.correct === true ? 1 : 0), 0);
  const answered = safeResults.length;
  const pct = answered > 0 ? Math.round((correct / answered) * 100) : 0;
  const roundSnapshot = {
    ts: toSafeTimestamp(now, now),
    gameType,
    answered,
    correct,
    pct,
  };

  return {
    ...priorMeta,
    attemptEvents: [...priorAttemptEvents, ...attemptEvents],
    roundSnapshots: [...priorRoundSnapshots, roundSnapshot],
  };
}

export default function App() {
  const location = useLocation();
  const {
    settings: routeSettings,
    setMode,
    navigateWithSettings,
    setGameType,
    setFilterDifficulty,
    setTotalQuestions,
    setBrowseFilter,
  } = useRouteSettings();
  const { gameType, filterDifficulty, totalQuestions, browseFilter } = routeSettings;

  const [expandedBrowse, setExpandedBrowse] = useState({});
  const [expandedResult, setExpandedResult] = useState({});
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const progressSnapshotRef = useRef({ progress: createDefaultProgress() });
  const getProgressSnapshot = useCallback(() => progressSnapshotRef.current, []);

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
    if (max > 0 && totalQuestions > max) setTotalQuestions(max, { replace: true });
  }, [activeGame.items.length, activeGame.supportsQuestionCount, setTotalQuestions, totalQuestions]);

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
        meta:
          (typeof nextMeta === "function" ? nextMeta(currentModeProgress.meta || {}) : nextMeta) ??
          currentModeProgress.meta ??
          {},
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

  const buildRoundMeta = useCallback(
    ({ prevMeta, results: roundResults }) => buildRoundMetaUpdate(prevMeta, gameType, roundResults),
    [gameType]
  );

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
  const redirectToMenuWithNotice = useCallback(
    (notice) => {
      navigateWithSettings(ROUTES.MENU, {
        replace: true,
        state: { notice },
      });
    },
    [navigateWithSettings]
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
    buildRoundMeta,
    resetViewport,
    onRoundComplete: handleRoundComplete,
    initialRoundState: initialRoundSession.state,
    initialRoundStateKey: initialRoundSession.key,
  });

  const currentRoundSnapshot = useMemo(() => {
    if (!Array.isArray(roundItems) || roundItems.length === 0) return null;
    return {
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
    };
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

  const latestRoundSnapshotRef = useRef(null);
  useEffect(() => {
    latestRoundSnapshotRef.current = currentRoundSnapshot;
  }, [currentRoundSnapshot]);

  useEffect(() => {
    if (!currentRoundSnapshot) {
      clearRoundSession();
      return;
    }

    saveRoundSession(currentRoundSnapshot);
  }, [currentRoundSnapshot]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const flushRoundSnapshot = () => {
      const snapshot = latestRoundSnapshotRef.current;
      if (!snapshot) {
        clearRoundSession();
        return;
      }
      saveRoundSession(snapshot);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") flushRoundSnapshot();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", flushRoundSnapshot);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", flushRoundSnapshot);
    };
  }, []);

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
  const blueprintQuickStart = useMemo(
    () => findNextBlueprintChallenge(blueprintCampaign, blueprintStars),
    [blueprintCampaign, blueprintStars]
  );

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
      navigateWithSettings(buildBlueprintChallengePath(dailyChallengeId));
    } else {
      navigateWithSettings(buildBlueprintDailyPath());
    }
    resetViewport();
  }, [blueprintCampaign, navigateWithSettings, resetViewport]);

  const openBlueprintWorldPreview = useCallback(
    (worldId) => {
      const safeWorldId = Number(worldId);
      if (!Number.isFinite(safeWorldId) || safeWorldId < 0) return;
      navigateWithSettings(buildBlueprintWorldPath(safeWorldId));
      resetViewport();
    },
    [navigateWithSettings, resetViewport]
  );

  const startSelectedMode = useCallback(() => {
    if (gameType === GAME_TYPES.BLUEPRINT_BUILDER) {
      if (blueprintQuickStart?.challenge?.id) {
        navigateWithSettings(buildBlueprintChallengePath(blueprintQuickStart.challenge.id));
      } else {
        navigateWithSettings(ROUTES.BLUEPRINT);
      }
      resetViewport();
      return;
    }
    startGame();
  }, [blueprintQuickStart, gameType, navigateWithSettings, resetViewport, startGame]);

  const resetAllData = useCallback(async () => {
    const freshProgress = createDefaultProgress();
    progressRef.current = freshProgress;
    setProgress(freshProgress);
    clearRoundSession();
    await persistProgress(freshProgress);
    setShowResetConfirm(false);
    navigateWithSettings(ROUTES.MENU, { replace: true });
  }, [navigateWithSettings, persistProgress, progressRef, setProgress]);

  const pct = calcRoundPct(score, roundItems.length);
  const lifetimePct = calcLifetimePct(stats);

  const modeProgressByGameType = useMemo(() => {
    const blueprintLevelIds = new Set((getGameTypeConfig(GAME_TYPES.BLUEPRINT_BUILDER).items || []).map((item) => String(item.id)));
    let blueprintCompletedLevels = 0;
    let blueprintPerfectLevels = 0;
    let blueprintTotalStars = 0;
    for (const levelId of Object.keys(blueprintStars || {})) {
      if (!blueprintLevelIds.has(String(levelId))) continue;
      const stars = Math.max(0, Math.min(3, Number(blueprintStars[levelId]) || 0));
      if (stars >= 1) blueprintCompletedLevels += 1;
      if (stars >= 3) blueprintPerfectLevels += 1;
      blueprintTotalStars += stars;
    }
    const blueprintWorlds = Array.isArray(blueprintCampaign?.worlds) ? blueprintCampaign.worlds : [];
    const blueprintCompletedWorlds = blueprintWorlds.filter((world) => {
      const totalCount = Math.max(0, Number(world?.totalCount || 0));
      const completedCount = Math.max(0, Number(world?.completedCount || 0));
      return totalCount > 0 && completedCount >= totalCount;
    }).length;
    const blueprintWorldCount = blueprintWorlds.length;

    const out = {};
    for (const option of GAME_TYPE_OPTIONS) {
      const type = option.value;
      const modeState = getModeProgress(progress, type);
      const modeStats = modeState.stats || {};
      const modeHistory = modeState.history || {};
      const modeGame = getGameTypeConfig(type);

      if (type === GAME_TYPES.BLUEPRINT_BUILDER) {
        const totalLevels = modeGame.items.length;
        const totalStarsPossible = totalLevels * 3;
        out[type] = {
          stats: {
            gamesPlayed: blueprintCompletedLevels,
            totalCorrect: blueprintTotalStars,
            totalAnswered: totalStarsPossible,
            bestStreak: blueprintCompletedWorlds,
          },
          lifetimePct: totalStarsPossible > 0 ? Math.round((blueprintTotalStars / totalStarsPossible) * 100) : 0,
          masteredCount: blueprintPerfectLevels,
          allCount: totalLevels,
          worldCount: blueprintWorldCount,
        };
        continue;
      }

      out[type] = {
        stats: modeStats,
        lifetimePct: calcLifetimePct(modeStats),
        masteredCount: getMasteredCount(modeGame.items, modeHistory),
        allCount: modeGame.items.length,
      };
    }
    return out;
  }, [blueprintCampaign, blueprintStars, progress]);

  const incorrectAttempts = useMemo(
    () => selectIncorrectAttempts(modeProgress.meta, { gameType, limit: 100 }),
    [gameType, modeProgress.meta]
  );
  const accuracyTrend = useMemo(
    () => selectAccuracyTrend(modeProgress.meta, { gameType }),
    [gameType, modeProgress.meta]
  );
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
  const hasBlueprintProgress = Object.keys(blueprintStars).length > 0;
  const blueprintStartLabel = blueprintQuickStart
    ? (hasBlueprintProgress ? "Continue Challenge" : "Jump In")
    : "Open Campaign Map";

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
    goBrowse: () => navigateWithSettings(ROUTES.BROWSE),
    goTemplates: () => navigateWithSettings(ROUTES.TEMPLATES),
    goReview: () => navigateWithSettings(ROUTES.REVIEW),
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
    accuracyTrend,
    startLabel: gameType === GAME_TYPES.BLUEPRINT_BUILDER ? blueprintStartLabel : "Start Round",
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
              onBack={() => navigateWithSettings(ROUTES.MENU)}
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
              goMenu={() => navigateWithSettings(ROUTES.MENU)}
              history={history}
              gameType={gameType}
            />
          )}
        />

        <Route
          path={ROUTES.REVIEW}
          element={(
            <ReviewScreen
              attempts={incorrectAttempts}
              goMenu={() => navigateWithSettings(ROUTES.MENU)}
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
              goMenu={() => navigateWithSettings(ROUTES.MENU)}
              history={history}
              browseTitle={activeGame.browseTitle}
            />
          )}
        />

        <Route path={ROUTES.TEMPLATES} element={<TemplatesScreen goMenu={() => navigateWithSettings(ROUTES.MENU)} />} />

        <Route
          path={`${ROUTES.BLUEPRINT}/*`}
          element={(
            <BlueprintScreen
              goMenu={() => navigateWithSettings(ROUTES.MENU)}
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

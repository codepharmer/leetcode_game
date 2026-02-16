import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { GAME_TYPES, MODES } from "./lib/constants";
import { getBlueprintCampaign } from "./lib/blueprint/campaign";
import {
  GAME_TYPE_OPTIONS,
  TUTORIAL_QUESTION_IDS,
  TUTORIAL_TEMPLATE_IDS,
  getGameTypeConfig,
} from "./lib/gameContent";
import {
  ONBOARDING_FLOWS,
  ONBOARDING_STATUS,
  ONBOARDING_TIP_KEYS,
  createDefaultProgress,
  getModeProgress,
  getOnboardingState,
  setModeProgress,
  setOnboardingState,
} from "./lib/progressModel";
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

import { TutorialOverlay } from "./components/tutorial/TutorialOverlay";
import { useAuthSession } from "./hooks/useAuthSession";
import { useGameSession } from "./hooks/useGameSession";
import { useProgressSync } from "./hooks/useProgressSync";
import { useRouteSettings } from "./hooks/useRouteSettings";
import { useTutorialFlow } from "./hooks/useTutorialFlow";
import { trackEvent } from "./lib/analytics";
import { BlueprintScreen } from "./screens/BlueprintScreen";
import { BrowseScreen } from "./screens/BrowseScreen";
import { MenuScreen } from "./screens/MenuScreen";
import { PlayScreen } from "./screens/PlayScreen";
import { ReviewScreen } from "./screens/ReviewScreen";
import { ResultsScreen } from "./screens/ResultsScreen";
import { TemplatesScreen } from "./screens/TemplatesScreen";

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

const TUTORIAL_ROUND_CONFIG = Object.freeze({
  [GAME_TYPES.QUESTION_TO_PATTERN]: {
    flow: ONBOARDING_FLOWS.QUESTION_TO_PATTERN,
    itemIds: TUTORIAL_QUESTION_IDS,
  },
  [GAME_TYPES.TEMPLATE_TO_PATTERN]: {
    flow: ONBOARDING_FLOWS.TEMPLATE_TO_PATTERN,
    itemIds: TUTORIAL_TEMPLATE_IDS,
  },
});

const TIP_TIMEOUT_MS = 6000;

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
  const [activeTip, setActiveTip] = useState(null);
  const [dismissedTemplateExploreKey, setDismissedTemplateExploreKey] = useState("");
  const activeTipTimeoutRef = useRef(null);

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
  const onboarding = useMemo(() => getOnboardingState(progress), [progress]);
  const globalOnboardingFlow = onboarding?.[ONBOARDING_FLOWS.GLOBAL];
  const matchOnboardingFlow = onboarding?.[ONBOARDING_FLOWS.QUESTION_TO_PATTERN];
  const templateOnboardingFlow = onboarding?.[ONBOARDING_FLOWS.TEMPLATE_TO_PATTERN];

  useEffect(() => {
    if (activeGame.supportsQuestionCount === false) return;
    const max = activeGame.items.length;
    if (max > 0 && totalQuestions > max) setTotalQuestions(max, { replace: true });
  }, [activeGame.items.length, activeGame.supportsQuestionCount, setTotalQuestions, totalQuestions]);

  useEffect(() => {
    setExpandedBrowse({});
    setExpandedResult({});
  }, [gameType]);

  useEffect(() => {
    if (mode !== MODES.PLAY) return;
    setDismissedTemplateExploreKey("");
  }, [mode]);

  const updateProgress = useCallback(
    (updater) => {
      const currentProgress = progressRef.current;
      const nextProgress = typeof updater === "function" ? updater(currentProgress) : updater || currentProgress;
      progressRef.current = nextProgress;
      setProgress(nextProgress);
      return nextProgress;
    },
    [progressRef, setProgress]
  );

  const updateModeProgress = useCallback(
    (updater) => {
      let nextModeProgressSnapshot = null;
      const nextProgress = updateProgress((currentProgress) => {
        const currentModeProgress = getModeProgress(currentProgress, gameType);
        const nextModeProgress =
          typeof updater === "function" ? updater(currentModeProgress) : updater || currentModeProgress;
        nextModeProgressSnapshot = nextModeProgress;
        return setModeProgress(currentProgress, gameType, nextModeProgress);
      });
      return { nextModeProgress: nextModeProgressSnapshot, nextProgress };
    },
    [gameType, updateProgress]
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

  const updateOnboarding = useCallback(
    (updater, { persist = true } = {}) => {
      let nextProgressSnapshot = null;
      updateProgress((currentProgress) => {
        const currentOnboarding = getOnboardingState(currentProgress);
        const nextOnboarding = typeof updater === "function" ? updater(currentOnboarding) : updater || currentOnboarding;
        nextProgressSnapshot = setOnboardingState(currentProgress, nextOnboarding);
        return nextProgressSnapshot;
      });
      if (persist && nextProgressSnapshot) {
        void persistProgress(nextProgressSnapshot);
      }
      return nextProgressSnapshot;
    },
    [persistProgress, updateProgress]
  );

  const updateOnboardingFlow = useCallback(
    (flowKey, flowUpdater, options) => {
      return updateOnboarding((currentOnboarding) => {
        const currentFlow = currentOnboarding?.[flowKey] || {
          status: ONBOARDING_STATUS.NOT_STARTED,
          lastStep: -1,
        };
        const nextFlow =
          typeof flowUpdater === "function" ? flowUpdater(currentFlow) : flowUpdater || currentFlow;
        return {
          ...currentOnboarding,
          [flowKey]: nextFlow,
        };
      }, options);
    },
    [updateOnboarding]
  );

  const markOnboardingTipShown = useCallback(
    (tipKey) => {
      return updateOnboarding((currentOnboarding) => ({
        ...currentOnboarding,
        tips: {
          ...(currentOnboarding?.tips || {}),
          [tipKey]: true,
        },
      }));
    },
    [updateOnboarding]
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
    roundMeta,
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
      roundMeta,
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
    roundMeta,
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

  const startQuizModeRound = useCallback(
    (quizGameType, { forceTutorialReplay = false, forceNormal = false } = {}) => {
      const tutorialConfig = TUTORIAL_ROUND_CONFIG[quizGameType];
      const tutorialFlow = tutorialConfig?.flow;
      const tutorialState = tutorialFlow ? onboarding?.[tutorialFlow] : null;
      const tutorialEligible =
        !forceNormal &&
        tutorialConfig &&
        (forceTutorialReplay ||
          tutorialState?.status === ONBOARDING_STATUS.NOT_STARTED ||
          tutorialState?.status === ONBOARDING_STATUS.IN_PROGRESS);

      if (tutorialEligible) {
        if (forceTutorialReplay) {
          trackEvent("tutorial_replayed", { flow: tutorialFlow });
          updateOnboardingFlow(tutorialFlow, {
            status: ONBOARDING_STATUS.IN_PROGRESS,
            lastStep: -1,
          });
          trackEvent("onboarding_started", { flow: tutorialFlow });
        } else if (tutorialState?.status === ONBOARDING_STATUS.NOT_STARTED) {
          updateOnboardingFlow(tutorialFlow, {
            status: ONBOARDING_STATUS.IN_PROGRESS,
            lastStep: -1,
          });
          trackEvent("onboarding_started", { flow: tutorialFlow });
        }

        startGame({
          isTutorial: true,
          flowKey: tutorialFlow,
          itemIds: tutorialConfig.itemIds,
        });
        return;
      }

      startGame();
    },
    [onboarding, startGame, updateOnboardingFlow]
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

    startQuizModeRound(gameType);
  }, [blueprintQuickStart, gameType, navigateWithSettings, resetViewport, startQuizModeRound]);

  useEffect(() => {
    if (!loaded) return;

    if (mode === MODES.PLAY && roundItems.length === 0) {
      const tutorialConfig = TUTORIAL_ROUND_CONFIG[gameType];
      const tutorialFlow = tutorialConfig?.flow;
      const tutorialStatus = tutorialFlow ? onboarding?.[tutorialFlow]?.status : null;
      const shouldAutostartTutorial =
        tutorialConfig &&
        (tutorialStatus === ONBOARDING_STATUS.NOT_STARTED || tutorialStatus === ONBOARDING_STATUS.IN_PROGRESS);

      if (shouldAutostartTutorial) {
        startQuizModeRound(gameType);
        return;
      }

      redirectToMenuWithNotice("Round not found. Start a new round.");
      return;
    }

    if (mode === MODES.RESULTS && results.length === 0) {
      redirectToMenuWithNotice("No results to show yet.");
    }
  }, [
    gameType,
    loaded,
    mode,
    onboarding,
    redirectToMenuWithNotice,
    results.length,
    roundItems.length,
    startQuizModeRound,
  ]);

  const replaySelectedTutorial = useCallback(() => {
    if (gameType === GAME_TYPES.BLUEPRINT_BUILDER) {
      trackEvent("tutorial_replayed", { flow: ONBOARDING_FLOWS.BLUEPRINT_BUILDER });
      updateOnboardingFlow(ONBOARDING_FLOWS.BLUEPRINT_BUILDER, {
        status: ONBOARDING_STATUS.IN_PROGRESS,
        lastStep: -1,
      });
      trackEvent("onboarding_started", { flow: ONBOARDING_FLOWS.BLUEPRINT_BUILDER });
      navigateWithSettings(ROUTES.BLUEPRINT);
      resetViewport();
      return;
    }
    startQuizModeRound(gameType, { forceTutorialReplay: true });
  }, [gameType, navigateWithSettings, resetViewport, startQuizModeRound, updateOnboardingFlow]);

  const replayGlobalTutorial = useCallback(() => {
    trackEvent("tutorial_replayed", { flow: ONBOARDING_FLOWS.GLOBAL });
    updateOnboardingFlow(ONBOARDING_FLOWS.GLOBAL, {
      status: ONBOARDING_STATUS.IN_PROGRESS,
      lastStep: -1,
    });
    trackEvent("onboarding_started", { flow: ONBOARDING_FLOWS.GLOBAL });
    navigateWithSettings(ROUTES.MENU);
    resetViewport();
  }, [navigateWithSettings, resetViewport, updateOnboardingFlow]);

  const resetAllData = useCallback(async () => {
    const freshProgress = createDefaultProgress();
    progressRef.current = freshProgress;
    setProgress(freshProgress);
    clearRoundSession();
    await persistProgress(freshProgress);
    setShowResetConfirm(false);
    navigateWithSettings(ROUTES.MENU, { replace: true });
  }, [navigateWithSettings, persistProgress, progressRef, setProgress]);

  const resetOnboardingOnly = useCallback(() => {
    const freshOnboarding = createDefaultProgress().onboarding;
    const nextProgress = updateProgress((currentProgress) => setOnboardingState(currentProgress, freshOnboarding));
    void persistProgress(nextProgress);
  }, [persistProgress, updateProgress]);

  const [isNarrowViewport, setIsNarrowViewport] = useState(
    () => (typeof window !== "undefined" ? window.innerWidth <= 760 : false)
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onResize = () => setIsNarrowViewport(window.innerWidth <= 760);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const activeTipRef = useRef(null);
  useEffect(() => {
    activeTipRef.current = activeTip;
  }, [activeTip]);

  const dismissActiveTip = useCallback((method = "tap") => {
    const tip = activeTipRef.current;
    if (!tip) return;
    if (activeTipTimeoutRef.current) {
      window.clearTimeout(activeTipTimeoutRef.current);
      activeTipTimeoutRef.current = null;
    }
    trackEvent("tip_dismissed", { tipKey: tip.tipKey, method });
    setActiveTip(null);
  }, []);

  useEffect(() => (
    () => {
      if (activeTipTimeoutRef.current) {
        window.clearTimeout(activeTipTimeoutRef.current);
        activeTipTimeoutRef.current = null;
      }
    }
  ), []);

  const requestContextTip = useCallback(
    ({ tipKey, title, body, targetSelector }) => {
      if (!tipKey) return false;
      if (onboarding?.tips?.[tipKey] === true) return false;
      if (activeTipRef.current) return false;

      markOnboardingTipShown(tipKey);
      trackEvent("tip_shown", { tipKey });
      setActiveTip({
        tipKey,
        title: String(title || ""),
        body: String(body || ""),
        targetSelector: String(targetSelector || ""),
      });

      if (activeTipTimeoutRef.current) {
        window.clearTimeout(activeTipTimeoutRef.current);
      }
      activeTipTimeoutRef.current = window.setTimeout(() => {
        dismissActiveTip("timeout");
      }, TIP_TIMEOUT_MS);
      return true;
    },
    [dismissActiveTip, markOnboardingTipShown, onboarding?.tips]
  );

  useEffect(() => {
    const isQuizMode =
      gameType === GAME_TYPES.QUESTION_TO_PATTERN || gameType === GAME_TYPES.TEMPLATE_TO_PATTERN;
    const shouldShow =
      mode === MODES.PLAY &&
      isQuizMode &&
      roundMeta?.isTutorial !== true &&
      currentIdx === 0 &&
      onboarding?.tips?.[ONBOARDING_TIP_KEYS.QUIZ_SHORTCUTS] !== true;

    if (!shouldShow) return;
    requestContextTip({
      tipKey: ONBOARDING_TIP_KEYS.QUIZ_SHORTCUTS,
      title: "Keyboard Shortcuts",
      body: "Use 1-4 to answer, Enter to continue, D for description, and T for template.",
      targetSelector: '[data-tutorial-anchor="play-hotkeys"]',
    });
  }, [currentIdx, gameType, mode, onboarding?.tips, requestContextTip, roundMeta?.isTutorial]);

  const globalTutorialSteps = useMemo(
    () => [
      {
        name: "welcome",
        title: "Welcome To LeetCode Patterns",
        body: "Learn to recognize and build algorithm patterns through short interactive rounds.",
        placement: "center",
        isReady: (ctx) => ctx.isMenuRoute,
      },
      {
        name: "mode_overview",
        title: "Three Modes",
        body: "Match maps questions to patterns, Template maps code snippets to patterns, and Build assembles full blueprints.",
        targetSelector: '[data-tutorial-anchor="menu-mode-selector"]',
        placement: "bottom",
        isReady: (ctx) => ctx.isMenuRoute,
      },
      {
        name: "pick_mode",
        title: "Pick A Mode",
        body: "Choose a mode, then continue to start that mode's guided first success loop.",
        targetSelector: '[data-tutorial-anchor="menu-mode-selector"]',
        placement: "bottom",
        isReady: (ctx) => ctx.isMenuRoute,
      },
    ],
    []
  );

  const globalTutorial = useTutorialFlow({
    flowKey: ONBOARDING_FLOWS.GLOBAL,
    flowState: globalOnboardingFlow,
    steps: globalTutorialSteps,
    context: { isMenuRoute: mode === MODES.MENU },
    autoStart: mode === MODES.MENU,
    updateFlowState: updateOnboardingFlow,
    onStarted: ({ flow }) => {
      trackEvent("onboarding_started", { flow });
    },
    onStepCompleted: ({ flow, stepIndex, stepName }) => {
      trackEvent("onboarding_step_completed", { flow, stepIndex, stepName });
    },
    onCompleted: ({ flow, totalSteps, durationMs }) => {
      trackEvent("onboarding_completed", { flow, totalSteps, durationMs });
    },
    onSkipped: ({ flow, atStep }) => {
      trackEvent("onboarding_skipped", { flow, atStep });
    },
  });

  const matchTutorialSteps = useMemo(
    () => [
      {
        name: "read_question",
        title: "Read The Prompt",
        body: "Read the problem first, then identify the best algorithm pattern.",
        targetSelector: '[data-tutorial-anchor="play-question-header"]',
        placement: "bottom",
        isReady: (ctx) => ctx.isTutorialRound && ctx.currentIdx === 0 && !ctx.showNext,
      },
      {
        name: "pick_pattern",
        title: "Choose The Pattern",
        body: "Pick one answer. You can click a choice or use keys 1-4.",
        targetSelector: '[data-tutorial-anchor="play-choices"]',
        placement: "top",
        isReady: (ctx) => ctx.isTutorialRound && ctx.currentIdx === 0 && !ctx.showNext,
      },
      {
        name: "feedback",
        title: "Read Feedback",
        body: "Green means correct. After each answer, you can inspect the related template.",
        targetSelector: '[data-tutorial-anchor="play-feedback"]',
        placement: "top",
        isReady: (ctx) => ctx.isTutorialRound && ctx.currentIdx === 0 && ctx.showNext,
      },
      {
        name: "advance_keys",
        title: "Move Faster",
        body: "Use Enter for Next and D to toggle the full question description.",
        targetSelector: '[data-tutorial-anchor="play-hotkeys"]',
        placement: "top",
        isReady: (ctx) => ctx.isTutorialRound && ctx.currentIdx >= 1,
      },
      {
        name: "results",
        title: "Round Summary",
        body: "This summary tracks score and streak. Lifetime stats build across rounds.",
        targetSelector: '[data-tutorial-anchor="results-summary"]',
        placement: "bottom",
        isReady: (ctx) => ctx.isTutorialResults,
      },
    ],
    []
  );

  const matchTutorial = useTutorialFlow({
    flowKey: ONBOARDING_FLOWS.QUESTION_TO_PATTERN,
    flowState: matchOnboardingFlow,
    steps: matchTutorialSteps,
    context: {
      isTutorialRound:
        mode === MODES.PLAY &&
        roundMeta?.isTutorial === true &&
        roundMeta?.flowKey === ONBOARDING_FLOWS.QUESTION_TO_PATTERN,
      isTutorialResults:
        mode === MODES.RESULTS &&
        roundMeta?.isTutorial === true &&
        roundMeta?.flowKey === ONBOARDING_FLOWS.QUESTION_TO_PATTERN,
      currentIdx,
      showNext,
    },
    updateFlowState: updateOnboardingFlow,
    onStepCompleted: ({ flow, stepIndex, stepName }) => {
      trackEvent("onboarding_step_completed", { flow, stepIndex, stepName });
    },
    onCompleted: ({ flow, totalSteps, durationMs }) => {
      trackEvent("onboarding_completed", { flow, totalSteps, durationMs });
    },
    onSkipped: ({ flow, atStep }) => {
      trackEvent("onboarding_skipped", { flow, atStep });
    },
  });

  const templateTutorialSteps = useMemo(
    () => [
      {
        name: "read_code",
        title: "Read Structure First",
        body: "Look for loops, window variables, and map/set usage in the snippet.",
        targetSelector: '[data-tutorial-anchor="play-code-block"]',
        placement: "top",
        isReady: (ctx) => ctx.isTutorialRound && ctx.currentIdx === 0 && !ctx.showNext,
      },
      {
        name: "pick_confusion",
        title: "Choose The Strongest Match",
        body: "Distractors are plausible confusions. Choose the best primary pattern.",
        targetSelector: '[data-tutorial-anchor="play-choices"]',
        placement: "top",
        isReady: (ctx) => ctx.isTutorialRound && ctx.currentIdx === 0 && !ctx.showNext,
      },
      {
        name: "mobile_scroll",
        title: "Mobile Tip",
        body: "On small screens, horizontally scroll the code block to inspect long lines.",
        targetSelector: '[data-tutorial-anchor="play-code-block"]',
        placement: "bottom",
        isReady: (ctx) => ctx.isTutorialRound && ctx.currentIdx === 0 && ctx.showNext && ctx.isNarrowViewport,
      },
      {
        name: "results",
        title: "Where To Study Next",
        body: "Use Browse for grouped patterns or Templates for full reference snippets.",
        targetSelector: '[data-tutorial-anchor="results-summary"]',
        placement: "bottom",
        isReady: (ctx) => ctx.isTutorialResults,
      },
    ],
    []
  );

  const templateTutorial = useTutorialFlow({
    flowKey: ONBOARDING_FLOWS.TEMPLATE_TO_PATTERN,
    flowState: templateOnboardingFlow,
    steps: templateTutorialSteps,
    context: {
      isTutorialRound:
        mode === MODES.PLAY &&
        roundMeta?.isTutorial === true &&
        roundMeta?.flowKey === ONBOARDING_FLOWS.TEMPLATE_TO_PATTERN,
      isTutorialResults:
        mode === MODES.RESULTS &&
        roundMeta?.isTutorial === true &&
        roundMeta?.flowKey === ONBOARDING_FLOWS.TEMPLATE_TO_PATTERN,
      currentIdx,
      showNext,
      isNarrowViewport,
    },
    updateFlowState: updateOnboardingFlow,
    onStepCompleted: ({ flow, stepIndex, stepName }) => {
      trackEvent("onboarding_step_completed", { flow, stepIndex, stepName });
    },
    onCompleted: ({ flow, totalSteps, durationMs }) => {
      trackEvent("onboarding_completed", { flow, totalSteps, durationMs });
    },
    onSkipped: ({ flow, atStep }) => {
      trackEvent("onboarding_skipped", { flow, atStep });
    },
  });

  const handleGlobalTutorialNext = useCallback(() => {
    const isLast = globalTutorial.stepIndex >= globalTutorial.totalSteps - 1;
    globalTutorial.next();
    if (isLast) startSelectedMode();
  }, [globalTutorial, startSelectedMode]);

  const skipMatchTutorial = useCallback(
    (reason) => {
      matchTutorial.skip(reason);
      startQuizModeRound(GAME_TYPES.QUESTION_TO_PATTERN, { forceNormal: true });
    },
    [matchTutorial, startQuizModeRound]
  );

  const skipTemplateTutorial = useCallback(
    (reason) => {
      templateTutorial.skip(reason);
      startQuizModeRound(GAME_TYPES.TEMPLATE_TO_PATTERN, { forceNormal: true });
    },
    [startQuizModeRound, templateTutorial]
  );

  const templateExploreKey = useMemo(
    () =>
      roundMeta?.isTutorial === true && roundMeta?.flowKey === ONBOARDING_FLOWS.TEMPLATE_TO_PATTERN
        ? `${roundMeta.flowKey}:${roundItems.length}:${score}`
        : "",
    [roundItems.length, roundMeta?.flowKey, roundMeta?.isTutorial, score]
  );

  const showTemplateExploreActions =
    mode === MODES.RESULTS &&
    roundMeta?.isTutorial === true &&
    roundMeta?.flowKey === ONBOARDING_FLOWS.TEMPLATE_TO_PATTERN &&
    templateExploreKey !== dismissedTemplateExploreKey;

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
    const worlds = (blueprintCampaign?.worlds || [])
      .filter((world) => world?.isUnlocked)
      .map((world) => ({
        worldId: Number(world?.id || 0),
        label: String(world?.family || world?.name || "World"),
        progressLabel: `${world?.completedCount || 0}/${world?.totalCount || 0}`,
      }));
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
    onReplaySelectedTutorial: replaySelectedTutorial,
    onReplayGlobalTutorial: replayGlobalTutorial,
    onResetOnboarding: resetOnboardingOnly,
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
              showExploreActions={showTemplateExploreActions}
              onDismissExploreActions={() => setDismissedTemplateExploreKey(templateExploreKey)}
              onExploreBrowse={() => navigateWithSettings(ROUTES.BROWSE)}
              onExploreTemplates={() => navigateWithSettings(ROUTES.TEMPLATES)}
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
              onboardingFlowState={onboarding?.[ONBOARDING_FLOWS.BLUEPRINT_BUILDER]}
              onUpdateOnboardingFlow={updateOnboardingFlow}
              onRequestTip={requestContextTip}
              tipFlags={onboarding?.tips || {}}
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

      <TutorialOverlay
        open={globalTutorial.isOpen}
        title={globalTutorial.currentStep?.title || ""}
        body={globalTutorial.currentStep?.body || ""}
        stepIndex={globalTutorial.stepIndex}
        totalSteps={globalTutorial.totalSteps}
        targetSelector={globalTutorial.currentStep?.targetSelector || ""}
        placement={globalTutorial.currentStep?.placement || "bottom"}
        onNext={handleGlobalTutorialNext}
        onSkip={() => globalTutorial.skip("skip")}
        onDontShowAgain={globalTutorial.dontShowAgain}
      />

      <TutorialOverlay
        open={matchTutorial.isOpen}
        title={matchTutorial.currentStep?.title || ""}
        body={matchTutorial.currentStep?.body || ""}
        stepIndex={matchTutorial.stepIndex}
        totalSteps={matchTutorial.totalSteps}
        targetSelector={matchTutorial.currentStep?.targetSelector || ""}
        placement={matchTutorial.currentStep?.placement || "bottom"}
        onNext={matchTutorial.next}
        onSkip={() => skipMatchTutorial("skip")}
        onDontShowAgain={() => skipMatchTutorial("dont_show_again")}
      />

      <TutorialOverlay
        open={templateTutorial.isOpen}
        title={templateTutorial.currentStep?.title || ""}
        body={templateTutorial.currentStep?.body || ""}
        stepIndex={templateTutorial.stepIndex}
        totalSteps={templateTutorial.totalSteps}
        targetSelector={templateTutorial.currentStep?.targetSelector || ""}
        placement={templateTutorial.currentStep?.placement || "bottom"}
        onNext={templateTutorial.next}
        onSkip={() => skipTemplateTutorial("skip")}
        onDontShowAgain={() => skipTemplateTutorial("dont_show_again")}
      />

      <TutorialOverlay
        open={!!activeTip}
        kind="tip"
        title={activeTip?.title || ""}
        body={activeTip?.body || ""}
        targetSelector={activeTip?.targetSelector || ""}
        placement="top"
        onDismiss={dismissActiveTip}
      />
    </div>
  );
}

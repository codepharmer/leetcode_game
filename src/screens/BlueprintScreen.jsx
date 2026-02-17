import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";

import { TutorialOverlay } from "../components/tutorial/TutorialOverlay";
import { useTutorialFlow } from "../hooks/useTutorialFlow";
import { getBlueprintCampaign } from "../lib/blueprint/campaign";
import { trackEvent } from "../lib/analytics";
import {
  ONBOARDING_FLOWS,
  ONBOARDING_STATUS,
  ONBOARDING_TIP_KEYS,
} from "../lib/progressModel";
import {
  ROUTES,
  buildBlueprintChallengePath,
  buildBlueprintDailyPath,
  buildBlueprintWorldPath,
  decodeBlueprintParam,
} from "../lib/routes";
import { BlueprintGame } from "./blueprint/BlueprintGame";
import { BlueprintMenu } from "./blueprint/BlueprintMenu";
import { normalizeStars } from "./blueprint/shared";
import { getNextUnsolvedChallenge } from "./blueprint/viewShared";

function findChallengeById(campaign, challengeId) {
  const safeId = String(challengeId || "");
  if (!safeId) return null;

  for (const world of campaign?.worlds || []) {
    for (const stage of world?.stages || []) {
      for (const tier of stage?.tiers || []) {
        for (const challenge of tier?.challenges || []) {
          if (String(challenge?.id || "") === safeId) return challenge;
        }
      }
    }
  }

  const daily = campaign?.dailyChallenge?.challenge;
  if (daily && String(daily.id || "") === safeId) return daily;
  return null;
}

function findFirstWorldZeroTutorialChallenge(campaign) {
  const worldZero = (campaign?.worlds || []).find((world) => Number(world?.id) === 0);
  if (!worldZero) return null;
  for (const stage of worldZero?.stages || []) {
    for (const tier of stage?.tiers || []) {
      for (const challenge of tier?.challenges || []) {
        if (challenge?.id) return challenge;
      }
    }
  }
  return null;
}

function getChallengeIdFromPath(pathname) {
  const match = String(pathname || "").match(/\/blueprint\/challenge\/([^/?#]+)/i);
  if (!match?.[1]) return "";
  return decodeBlueprintParam(match[1]);
}

function resolveWorld(campaign, worldParam) {
  const fallback = campaign?.worlds?.find((world) => world.isUnlocked) || campaign?.worlds?.[0] || null;
  const parsed = Number.parseInt(String(decodeBlueprintParam(worldParam) || ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return campaign?.worlds?.find((world) => world.id === parsed) || fallback;
}

function BlueprintWorldRoute({
  goMenu,
  campaign,
  completed,
  startChallenge,
  totalStars,
  onOpenMap,
  onOpenDaily,
  onOpenWorld,
}) {
  const { worldId } = useParams();
  const selectedWorld = resolveWorld(campaign, worldId);

  return (
    <BlueprintMenu
      goMenu={goMenu}
      campaign={campaign}
      completed={completed}
      selectedWorld={selectedWorld}
      startChallenge={startChallenge}
      totalStars={totalStars}
      menuView="world"
      onOpenMap={onOpenMap}
      onOpenDaily={onOpenDaily}
      onOpenWorld={onOpenWorld}
    />
  );
}

function BlueprintChallengeRoute({
  campaign,
  onBackFromChallenge,
  onCompleteChallenge,
  onTutorialRun,
  onTutorialPass,
  onHintUsed,
  search,
}) {
  const { challengeId } = useParams();
  const challenge = findChallengeById(campaign, decodeBlueprintParam(challengeId));

  if (!challenge?.level) {
    return <Navigate replace to={{ pathname: ROUTES.BLUEPRINT, search }} />;
  }

  return (
    <BlueprintGame
      level={challenge.level}
      challenge={challenge}
      onBack={() => onBackFromChallenge(challenge)}
      onComplete={(id, stars) => onCompleteChallenge(challenge, id, stars)}
      onTutorialRun={onTutorialRun}
      onTutorialPass={onTutorialPass}
      onHintUsed={onHintUsed}
    />
  );
}

export function BlueprintScreen({
  goMenu,
  initialStars,
  onSaveStars,
  onboardingFlowState = { status: ONBOARDING_STATUS.COMPLETED, lastStep: 0 },
  onUpdateOnboardingFlow = () => {},
  onRequestTip = () => {},
  tipFlags = {},
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const completed = useMemo(() => normalizeStars(initialStars), [initialStars]);
  const campaign = useMemo(() => getBlueprintCampaign(completed), [completed]);
  const nextChallenge = useMemo(() => getNextUnsolvedChallenge(campaign, completed), [campaign, completed]);

  const totalStars = useMemo(
    () => Object.values(completed).reduce((sum, value) => sum + Math.max(0, Math.min(3, Number(value) || 0)), 0),
    [completed]
  );

  const challengeIdFromPath = useMemo(() => getChallengeIdFromPath(location.pathname), [location.pathname]);
  const activeChallenge = useMemo(
    () => findChallengeById(campaign, challengeIdFromPath),
    [campaign, challengeIdFromPath]
  );
  const firstTutorialChallenge = useMemo(
    () => findFirstWorldZeroTutorialChallenge(campaign),
    [campaign]
  );
  const isTutorialChallengeRoute = useMemo(() => {
    if (!activeChallenge?.id || !firstTutorialChallenge?.id) return false;
    return String(activeChallenge.id) === String(firstTutorialChallenge.id);
  }, [activeChallenge?.id, firstTutorialChallenge?.id]);

  const [tutorialSignals, setTutorialSignals] = useState({
    challengeId: "",
    hasRun: false,
    passed: false,
    stars: 0,
  });

  useEffect(() => {
    const nextChallengeId = String(activeChallenge?.id || "");
    setTutorialSignals((prev) => (
      prev.challengeId === nextChallengeId
        ? prev
        : { challengeId: nextChallengeId, hasRun: false, passed: false, stars: 0 }
    ));
  }, [activeChallenge?.id]);

  const buildTutorialSteps = useMemo(() => {
    const steps = [
      {
        name: "world_zero",
        title: "Start In World 0",
        body: "This is your starting world. It covers foundational patterns.",
        targetSelector: '[data-tutorial-anchor="blueprint-world-0"]',
        placement: "right",
        isReady: (ctx) => ctx.isMapRoute,
      },
    ];

    if (campaign?.dailyChallenge?.challenge?.level) {
      steps.push({
        name: "daily_banner",
        title: "Daily Challenge",
        body: "A new daily challenge unlocks each day from worlds you've reached.",
        targetSelector: '[data-tutorial-anchor="blueprint-daily-banner"]',
        placement: "bottom",
        isReady: (ctx) => ctx.isMapRoute,
      });
    }

    if (nextChallenge?.challenge?.id) {
      steps.push({
        name: "continue_cta",
        title: "Continue",
        body: "Tap Continue to enter your current world and open the next challenge.",
        targetSelector: '[data-tutorial-anchor="blueprint-continue-cta"]',
        placement: "bottom",
        isReady: (ctx) => ctx.isMapRoute,
      });
    }

    steps.push(
      {
        name: "card_tray",
        title: "Card Tray",
        body: "These cards are your building blocks. Each card is one algorithm step.",
        targetSelector: '[data-tutorial-anchor="blueprint-card-tray"]',
        placement: "top",
        isReady: (ctx) => ctx.isTutorialChallengeRoute,
      },
      {
        name: "slot_row",
        title: "Place Cards",
        body: "Tap a card in the tray, then tap the matching slot to place it.",
        targetSelector: '[data-tutorial-anchor="blueprint-slot-row"]',
        placement: "bottom",
        isReady: (ctx) => ctx.isTutorialChallengeRoute,
      },
      {
        name: "run_blueprint",
        title: "Run Blueprint",
        body: "Fill required slots to enable Run Blueprint. Distractors can stay in the tray.",
        targetSelector: '[data-tutorial-anchor="blueprint-run-button"]',
        placement: "top",
        isReady: (ctx) => ctx.isTutorialChallengeRoute,
      },
      {
        name: "step_navigator",
        title: "Execution Trace",
        body: "Step through execution to see how your blueprint handles each test case.",
        targetSelector: '[data-tutorial-anchor="blueprint-step-navigator"]',
        placement: "top",
        isReady: (ctx) => ctx.isTutorialChallengeRoute && ctx.hasRun,
      },
      {
        name: "stars",
        title: "Star Scoring",
        body: "1 star means correct. Extra stars reward speed and avoiding hints.",
        targetSelector: '[data-tutorial-anchor="blueprint-stars-info"]',
        placement: "top",
        isReady: (ctx) => ctx.isTutorialChallengeRoute && ctx.passed,
      }
    );

    return steps;
  }, [campaign, nextChallenge?.challenge?.id]);

  const buildTutorialContext = useMemo(
    () => ({
      isMapRoute: location.pathname === ROUTES.BLUEPRINT,
      isTutorialChallengeRoute:
        location.pathname.startsWith(`${ROUTES.BLUEPRINT}/challenge/`) && isTutorialChallengeRoute,
      hasRun: tutorialSignals.hasRun,
      passed: tutorialSignals.passed,
    }),
    [isTutorialChallengeRoute, location.pathname, tutorialSignals.hasRun, tutorialSignals.passed]
  );

  const buildTutorial = useTutorialFlow({
    flowKey: ONBOARDING_FLOWS.BLUEPRINT_BUILDER,
    flowState: onboardingFlowState,
    steps: buildTutorialSteps,
    context: buildTutorialContext,
    autoStart: location.pathname.startsWith(ROUTES.BLUEPRINT),
    updateFlowState: onUpdateOnboardingFlow,
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

  useEffect(() => {
    const isChallengeRoute = location.pathname.startsWith(`${ROUTES.BLUEPRINT}/challenge/`);
    if (!isChallengeRoute) return;
    if (!activeChallenge?.id) return;
    if (isTutorialChallengeRoute) return;
    if (tipFlags?.[ONBOARDING_TIP_KEYS.BLUEPRINT_DRAG_TAP] === true) return;

    onRequestTip({
      tipKey: ONBOARDING_TIP_KEYS.BLUEPRINT_DRAG_TAP,
      title: "Build Controls",
      body: "Tap a card in the tray, then tap the matching slot.",
      targetSelector: '[data-tutorial-anchor="blueprint-card-tray"]',
    });
  }, [
    activeChallenge?.id,
    isTutorialChallengeRoute,
    location.pathname,
    onRequestTip,
    tipFlags,
  ]);

  const navigateWithSearch = useCallback(
    (pathname, options) => navigate({ pathname, search: location.search }, options),
    [location.search, navigate]
  );

  const openMap = useCallback(() => navigateWithSearch(ROUTES.BLUEPRINT), [navigateWithSearch]);
  const openDaily = useCallback(() => navigateWithSearch(buildBlueprintDailyPath()), [navigateWithSearch]);
  const openWorld = useCallback((worldId) => navigateWithSearch(buildBlueprintWorldPath(worldId)), [navigateWithSearch]);

  const startChallenge = useCallback(
    (challenge) => {
      if (!challenge?.id) return;
      navigateWithSearch(buildBlueprintChallengePath(challenge.id));
    },
    [navigateWithSearch]
  );

  const onBackFromChallenge = useCallback(
    (challenge) => {
      if (challenge?.worldId) {
        navigateWithSearch(buildBlueprintWorldPath(challenge.worldId));
        return;
      }
      navigateWithSearch(ROUTES.BLUEPRINT);
    },
    [navigateWithSearch]
  );

  const completeBuildTutorialEarly = useCallback(() => {
    const status = onboardingFlowState?.status;
    if (status === ONBOARDING_STATUS.COMPLETED || status === ONBOARDING_STATUS.SKIPPED) return;

    onUpdateOnboardingFlow(ONBOARDING_FLOWS.BLUEPRINT_BUILDER, {
      status: ONBOARDING_STATUS.COMPLETED,
      lastStep: Math.max(0, buildTutorialSteps.length - 1),
    });
    trackEvent("onboarding_completed", {
      flow: ONBOARDING_FLOWS.BLUEPRINT_BUILDER,
      totalSteps: buildTutorialSteps.length,
      durationMs: 0,
      completedEarly: true,
    });
  }, [buildTutorialSteps.length, onUpdateOnboardingFlow, onboardingFlowState?.status]);

  const onCompleteChallenge = useCallback(
    (challenge, id, stars) => {
      const safeId = String(id);
      const nextStars = Math.max(Number(completed?.[safeId] || 0), Number(stars || 0));
      onSaveStars?.(safeId, nextStars);

      if (isTutorialChallengeRoute && nextStars >= 1) {
        completeBuildTutorialEarly();
      }

      if (challenge?.worldId) {
        navigateWithSearch(buildBlueprintWorldPath(challenge.worldId), { replace: true });
        return;
      }
      navigateWithSearch(ROUTES.BLUEPRINT, { replace: true });
    },
    [completeBuildTutorialEarly, completed, isTutorialChallengeRoute, navigateWithSearch, onSaveStars]
  );

  const handleTutorialRun = useCallback(() => {
    setTutorialSignals((prev) => ({ ...prev, hasRun: true }));
  }, []);

  const handleTutorialPass = useCallback(
    (stars) => {
      const safeStars = Math.max(1, Number(stars || 0));
      setTutorialSignals((prev) => ({ ...prev, passed: true, stars: Math.max(prev.stars, safeStars) }));
      if (isTutorialChallengeRoute && safeStars >= 1) {
        completeBuildTutorialEarly();
      }
    },
    [completeBuildTutorialEarly, isTutorialChallengeRoute]
  );

  const handleHintUsed = useCallback(() => {
    if (!activeChallenge?.id) return;
    if (isTutorialChallengeRoute) return;
    if (tipFlags?.[ONBOARDING_TIP_KEYS.BLUEPRINT_HINT_PENALTY] === true) return;

    onRequestTip({
      tipKey: ONBOARDING_TIP_KEYS.BLUEPRINT_HINT_PENALTY,
      title: "Hint Penalty",
      body: "Using hints reduces your maximum star rating for this challenge.",
      targetSelector: '[data-tutorial-anchor="blueprint-card-tray"]',
    });
  }, [activeChallenge?.id, isTutorialChallengeRoute, onRequestTip, tipFlags]);

  const defaultWorld = campaign.worlds.find((world) => world.isUnlocked) || campaign.worlds[0] || null;

  return (
    <>
      <Routes>
        <Route
          index
          element={(
            <BlueprintMenu
              goMenu={goMenu}
              campaign={campaign}
              completed={completed}
              selectedWorld={defaultWorld}
              startChallenge={startChallenge}
              totalStars={totalStars}
              menuView="map"
              onOpenMap={openMap}
              onOpenDaily={openDaily}
              onOpenWorld={openWorld}
            />
          )}
        />

        <Route
          path="daily"
          element={(
            <BlueprintMenu
              goMenu={goMenu}
              campaign={campaign}
              completed={completed}
              selectedWorld={defaultWorld}
              startChallenge={startChallenge}
              totalStars={totalStars}
              menuView="daily"
              onOpenMap={openMap}
              onOpenDaily={openDaily}
              onOpenWorld={openWorld}
            />
          )}
        />

        <Route
          path="world/:worldId"
          element={(
            <BlueprintWorldRoute
              goMenu={goMenu}
              campaign={campaign}
              completed={completed}
              startChallenge={startChallenge}
              totalStars={totalStars}
              onOpenMap={openMap}
              onOpenDaily={openDaily}
              onOpenWorld={openWorld}
            />
          )}
        />

        <Route
          path="challenge/:challengeId"
          element={(
            <BlueprintChallengeRoute
              campaign={campaign}
              onBackFromChallenge={onBackFromChallenge}
              onCompleteChallenge={onCompleteChallenge}
              onTutorialRun={handleTutorialRun}
              onTutorialPass={handleTutorialPass}
              onHintUsed={handleHintUsed}
              search={location.search}
            />
          )}
        />

        <Route path="*" element={<Navigate replace to={{ pathname: ROUTES.BLUEPRINT, search: location.search }} />} />
      </Routes>

      <TutorialOverlay
        open={buildTutorial.isOpen}
        title={buildTutorial.currentStep?.title || ""}
        body={buildTutorial.currentStep?.body || ""}
        stepIndex={buildTutorial.stepIndex}
        totalSteps={buildTutorial.totalSteps}
        targetSelector={buildTutorial.currentStep?.targetSelector || ""}
        placement={buildTutorial.currentStep?.placement || "bottom"}
        onNext={buildTutorial.next}
        onSkip={() => buildTutorial.skip("skip")}
        onDontShowAgain={buildTutorial.dontShowAgain}
      />
    </>
  );
}

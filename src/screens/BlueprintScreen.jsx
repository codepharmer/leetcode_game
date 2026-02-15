import { useMemo } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";

import {
  buildBlueprintChallengePath,
  buildBlueprintDailyPath,
  buildBlueprintWorldPath,
  decodeBlueprintParam,
  ROUTES,
} from "../lib/routes";
import { getBlueprintCampaign } from "../lib/blueprint/campaign";
import { BlueprintGame } from "./blueprint/BlueprintGame";
import { BlueprintMenu } from "./blueprint/BlueprintMenu";
import { normalizeStars } from "./blueprint/shared";

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

function BlueprintChallengeRoute({ campaign, onBackFromChallenge, onCompleteChallenge, search }) {
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
    />
  );
}

export function BlueprintScreen({ goMenu, initialStars, onSaveStars }) {
  const location = useLocation();
  const navigate = useNavigate();
  const completed = useMemo(() => normalizeStars(initialStars), [initialStars]);

  const campaign = useMemo(() => getBlueprintCampaign(completed), [completed]);

  const totalStars = useMemo(
    () => Object.values(completed).reduce((sum, value) => sum + Math.max(0, Math.min(3, Number(value) || 0)), 0),
    [completed]
  );

  const navigateWithSearch = (pathname, options) =>
    navigate({ pathname, search: location.search }, options);

  const openMap = () => navigateWithSearch(ROUTES.BLUEPRINT);
  const openDaily = () => navigateWithSearch(buildBlueprintDailyPath());
  const openWorld = (worldId) => navigateWithSearch(buildBlueprintWorldPath(worldId));

  const startChallenge = (challenge) => {
    if (!challenge?.id) return;
    navigateWithSearch(buildBlueprintChallengePath(challenge.id));
  };

  const onBackFromChallenge = (challenge) => {
    if (challenge?.worldId) {
      navigateWithSearch(buildBlueprintWorldPath(challenge.worldId));
      return;
    }
    navigateWithSearch(ROUTES.BLUEPRINT);
  };

  const onCompleteChallenge = (challenge, id, stars) => {
    const safeId = String(id);
    const nextStars = Math.max(Number(completed?.[safeId] || 0), Number(stars || 0));
    onSaveStars?.(safeId, nextStars);

    if (challenge?.worldId) {
      navigateWithSearch(buildBlueprintWorldPath(challenge.worldId), { replace: true });
      return;
    }
    navigateWithSearch(ROUTES.BLUEPRINT, { replace: true });
  };

  const defaultWorld = campaign.worlds.find((world) => world.isUnlocked) || campaign.worlds[0] || null;

  return (
    <Routes>
      <Route
        index
        element={
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
        }
      />

      <Route
        path="daily"
        element={
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
        }
      />

      <Route
        path="world/:worldId"
        element={
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
        }
      />

      <Route
        path="challenge/:challengeId"
        element={
          <BlueprintChallengeRoute
            campaign={campaign}
            onBackFromChallenge={onBackFromChallenge}
            onCompleteChallenge={onCompleteChallenge}
            search={location.search}
          />
        }
      />

      <Route path="*" element={<Navigate replace to={{ pathname: ROUTES.BLUEPRINT, search: location.search }} />} />
    </Routes>
  );
}

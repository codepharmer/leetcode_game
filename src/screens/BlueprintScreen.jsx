import { useEffect, useMemo, useState } from "react";

import { getBlueprintCampaign } from "../lib/blueprint/campaign";
import { BlueprintGame } from "./blueprint/BlueprintGame";
import { BlueprintMenu } from "./blueprint/BlueprintMenu";
import { normalizeStars } from "./blueprint/shared";

export function BlueprintScreen({ goMenu, initialStars, onSaveStars }) {
  const [view, setView] = useState("menu");
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [selectedWorldId, setSelectedWorldId] = useState(1);
  const [completed, setCompleted] = useState(() => normalizeStars(initialStars));

  useEffect(() => {
    setCompleted(normalizeStars(initialStars));
  }, [initialStars]);

  const campaign = useMemo(() => getBlueprintCampaign(completed), [completed]);
  const selectedWorld = useMemo(
    () => campaign.worlds.find((world) => world.id === selectedWorldId) || campaign.worlds[0] || null,
    [campaign.worlds, selectedWorldId]
  );

  const totalStars = useMemo(
    () => Object.values(completed).reduce((sum, value) => sum + Math.max(0, Math.min(3, Number(value) || 0)), 0),
    [completed]
  );

  useEffect(() => {
    if (!selectedWorld || selectedWorld.isUnlocked) return;
    const firstUnlocked = campaign.worlds.find((world) => world.isUnlocked);
    if (firstUnlocked) setSelectedWorldId(firstUnlocked.id);
  }, [campaign.worlds, selectedWorld]);

  const startChallenge = (challenge) => {
    if (!challenge?.level) return;
    setActiveChallenge(challenge);
    setView("game");
  };

  const handleComplete = (id, stars) => {
    const safeId = String(id);
    const nextStars = Math.max(Number(completed?.[safeId] || 0), Number(stars || 0));
    setCompleted((prev) => ({ ...prev, [safeId]: nextStars }));
    onSaveStars?.(safeId, nextStars);
    setView("menu");
  };

  if (view === "game" && activeChallenge?.level) {
    return (
      <BlueprintGame
        level={activeChallenge.level}
        challenge={activeChallenge}
        onBack={() => setView("menu")}
        onComplete={handleComplete}
      />
    );
  }

  return (
    <BlueprintMenu
      goMenu={goMenu}
      campaign={campaign}
      completed={completed}
      selectedWorld={selectedWorld}
      setSelectedWorldId={setSelectedWorldId}
      startChallenge={startChallenge}
      totalStars={totalStars}
    />
  );
}
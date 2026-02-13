import { getLevelStars } from "./shared";

const WORLD_ACCENTS = [
  {
    base: "var(--accent)",
    ring: "rgba(16, 185, 129, 0.5)",
    soft: "rgba(16, 185, 129, 0.12)",
    gradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(14, 165, 233, 0.88))",
  },
  {
    base: "var(--info)",
    ring: "rgba(59, 130, 246, 0.5)",
    soft: "rgba(59, 130, 246, 0.12)",
    gradient: "linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(16, 185, 129, 0.88))",
  },
  {
    base: "var(--warn)",
    ring: "rgba(245, 158, 11, 0.52)",
    soft: "rgba(245, 158, 11, 0.14)",
    gradient: "linear-gradient(135deg, rgba(245, 158, 11, 0.95), rgba(239, 68, 68, 0.88))",
  },
  {
    base: "var(--danger)",
    ring: "rgba(239, 68, 68, 0.52)",
    soft: "rgba(239, 68, 68, 0.13)",
    gradient: "linear-gradient(135deg, rgba(239, 68, 68, 0.94), rgba(245, 158, 11, 0.85))",
  },
];

export function getWorldAccent(worldId) {
  if (!Number.isFinite(Number(worldId))) return WORLD_ACCENTS[0];
  const idx = Math.max(0, (Number(worldId) - 1) % WORLD_ACCENTS.length);
  return WORLD_ACCENTS[idx];
}

export function getWorldIcon(world) {
  const words = String(world?.family || "")
    .split(/\s+/)
    .map((part) => part.replace(/[^A-Za-z]/g, ""))
    .filter(Boolean);
  if (words.length === 0) return "W";
  return words
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export function getRemainingWorldUnlockCount(world, completedCoreWorlds) {
  const required = Number(world?.unlockRule?.requiredCompletedWorlds || 0);
  if (required <= 0) return 0;
  return Math.max(0, required - Number(completedCoreWorlds || 0));
}

export function getNextUnsolvedChallenge(campaign, completed) {
  const worlds = Array.isArray(campaign?.worlds) ? campaign.worlds : [];

  for (const world of worlds) {
    if (!world?.isUnlocked || world?.isComplete) continue;
    const levelIds = Array.isArray(world?.levelIds) ? world.levelIds : [];

    for (const levelId of levelIds) {
      const stars = getLevelStars(completed, levelId);
      if (stars >= 1) continue;

      const challenge = world?.challengeByLevelId?.[String(levelId)];
      if (!challenge?.level) continue;

      return {
        world,
        levelId: String(levelId),
        challenge,
        stars,
      };
    }
  }

  if (campaign?.dailyChallenge?.challenge?.level) {
    const world = worlds.find((item) => item.id === campaign.dailyChallenge.worldId) || null;
    return {
      world,
      levelId: String(campaign.dailyChallenge.levelId),
      challenge: campaign.dailyChallenge.challenge,
      stars: getLevelStars(completed, campaign.dailyChallenge.levelId),
    };
  }

  return null;
}

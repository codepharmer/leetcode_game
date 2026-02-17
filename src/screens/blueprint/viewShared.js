import { getLevelStars } from "./shared";

const WORLD_ACCENTS = [
  {
    base: "var(--accent)",
    ring: "var(--accent-ring-mid)",
    soft: "var(--accent-fill-soft)",
    gradient: "linear-gradient(135deg, var(--accent), var(--accent2))",
  },
  {
    base: "var(--info)",
    ring: "var(--info-ring-soft)",
    soft: "var(--info-fill-soft)",
    gradient: "linear-gradient(135deg, var(--accent2), var(--accent))",
  },
  {
    base: "var(--warn)",
    ring: "var(--warn-ring-soft)",
    soft: "var(--warn-fill-mid)",
    gradient: "linear-gradient(135deg, var(--warn), var(--text-accent-cool))",
  },
  {
    base: "var(--danger)",
    ring: "var(--error-ring-soft)",
    soft: "var(--error-fill-soft)",
    gradient: "linear-gradient(135deg, var(--danger), var(--warn))",
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

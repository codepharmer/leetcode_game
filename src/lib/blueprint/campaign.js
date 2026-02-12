import { BLUEPRINT_LEVELS } from "./levels";

const TIER_SLOT_META = [
  {
    key: "tutorial",
    tier: 1,
    label: "Tutorial",
    icon: "TUT",
    hintsMode: "full",
    guided: true,
    showPatternLabel: true,
    hideSlotScaffolding: false,
    timeLimitSec: 300,
  },
  {
    key: "easy_1",
    tier: 1,
    label: "Easy #1",
    icon: "E1",
    hintsMode: "full",
    guided: false,
    showPatternLabel: true,
    hideSlotScaffolding: false,
    timeLimitSec: 240,
  },
  {
    key: "easy_2",
    tier: 2,
    label: "Easy #2",
    icon: "E2",
    hintsMode: "limited",
    guided: false,
    showPatternLabel: true,
    hideSlotScaffolding: false,
    timeLimitSec: 220,
  },
  {
    key: "medium_1",
    tier: 2,
    label: "Medium #1",
    icon: "M1",
    hintsMode: "none",
    guided: false,
    showPatternLabel: true,
    hideSlotScaffolding: false,
    timeLimitSec: 200,
  },
  {
    key: "medium_2",
    tier: 3,
    label: "Medium #2",
    icon: "M2",
    hintsMode: "none",
    guided: false,
    showPatternLabel: false,
    hideSlotScaffolding: false,
    timeLimitSec: 170,
  },
  {
    key: "boss",
    tier: 3,
    label: "Boss",
    icon: "BOSS",
    hintsMode: "none",
    guided: false,
    showPatternLabel: false,
    hideSlotScaffolding: true,
    timeLimitSec: 150,
  },
];

const WORLD_DEFINITIONS = [
  {
    id: 1,
    name: "World 1",
    family: "Hash Maps & Sets",
    problemRange: "8-10",
    randomUnlock: false,
    levelIds: ["q-1", "q-2", "q-3", "q-4", "q-5", "q-6", "q-7", "q-8"],
  },
  {
    id: 2,
    name: "World 2",
    family: "Sliding Window",
    problemRange: "8-10",
    randomUnlock: false,
    levelIds: [1, "q-13", "q-14", 2, "q-15", "q-16", "q-65", "q-66"],
  },
  {
    id: 3,
    name: "World 3",
    family: "Two Pointers",
    problemRange: "8-10",
    randomUnlock: false,
    levelIds: [3, "q-9", "q-27", "q-28", "q-29", "q-31", "q-10", "q-11", "q-12", "q-30"],
  },
  {
    id: 4,
    name: "World 4",
    family: "Binary Search",
    problemRange: "8-10",
    randomUnlock: false,
    levelIds: ["q-21", "q-22", "q-23", "q-24", "q-25", "q-37", "q-26", "q-71"],
  },
  {
    id: 5,
    name: "World 5",
    family: "Stacks & Queues",
    problemRange: "8-10",
    randomUnlock: false,
    levelIds: ["q-17", "q-18", "q-19", "q-32", "q-20", "q-46", "q-77", "q-78"],
  },
  {
    id: 6,
    name: "World 6",
    family: "Trees",
    problemRange: "10-12",
    randomUnlock: false,
    levelIds: ["q-33", "q-34", "q-35", "q-36", "q-38", "q-39", "q-40", "q-41", "q-44", "q-55"],
  },
  {
    id: 7,
    name: "World 7",
    family: "Graphs",
    problemRange: "10-12",
    randomUnlock: false,
    levelIds: ["q-54", "q-56", "q-57", "q-58", "q-59", "q-60", "q-61", "q-85", "q-86", "q-87"],
  },
  {
    id: 8,
    name: "World 8",
    family: "Dynamic Programming",
    problemRange: "10-12",
    randomUnlock: false,
    levelIds: ["q-62", "q-63", "q-64", "q-67", "q-68", "q-70", "q-69", "q-72", "q-74", "q-75", "q-79"],
  },
  {
    id: 9,
    name: "World 9",
    family: "Backtracking",
    problemRange: "6-8",
    randomUnlock: false,
    levelIds: ["q-47", "q-48", "q-49", "q-50", "q-51", "q-52", "q-53", "q-45"],
  },
  {
    id: 10,
    name: "World 10",
    family: "Mixed / Boss Rush",
    problemRange: "8-10",
    randomUnlock: true,
    levelIds: ["q-73", "q-76", "q-80", "q-81", "q-82", "q-83", "q-84", "q-42", "q-43"],
  },
];

const LEVEL_BY_ID = new Map(BLUEPRINT_LEVELS.map((level) => [String(level.id), level]));

function hashString(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createPrng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(items, seedText) {
  const out = [...items];
  const random = createPrng(hashString(seedText));
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function chunkBySize(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function isLevelComplete(levelStars, levelId) {
  return Number(levelStars?.[String(levelId)] || 0) >= 1;
}

function getLocalDateKey(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getUnlockRule(worldId) {
  if (worldId <= 3) return { requiredCompletedWorlds: 0, label: "Starter worlds are open." };
  if (worldId <= 6) return { requiredCompletedWorlds: 2, label: "Unlocks after completing any 2 worlds." };
  if (worldId <= 9) return { requiredCompletedWorlds: 5, label: "Unlocks after completing any 5 worlds." };
  return { requiredCompletedWorlds: 5, label: "Boss rush unlocks after completing any 5 worlds." };
}

function buildChallenge(world, stageIndex, indexWithinStage, levelId) {
  const slotMeta = TIER_SLOT_META[indexWithinStage] || TIER_SLOT_META[TIER_SLOT_META.length - 1];
  const level = LEVEL_BY_ID.get(levelId);
  if (!level) return null;

  const isBossRush = world.id === 10;
  return {
    id: `${world.id}:${stageIndex}:${indexWithinStage}:${levelId}`,
    worldId: world.id,
    stageIndex,
    slotIndex: indexWithinStage,
    tier: slotMeta.tier,
    tierRole: slotMeta.label,
    tierIcon: slotMeta.icon,
    levelId,
    level,
    hintsMode: isBossRush ? "none" : slotMeta.hintsMode,
    guided: !isBossRush && slotMeta.guided,
    showPatternLabel: isBossRush ? false : slotMeta.showPatternLabel,
    hideSlotScaffolding: isBossRush ? true : slotMeta.hideSlotScaffolding,
    timeLimitSec: isBossRush ? Math.min(130, slotMeta.timeLimitSec) : slotMeta.timeLimitSec,
    isBossRush,
  };
}

function buildWorldProgress(worldDefinition, levelStars) {
  const baseLevelIds = worldDefinition.levelIds
    .map((id) => String(id))
    .filter((levelId) => LEVEL_BY_ID.has(levelId));

  const orderedLevelIds = worldDefinition.randomUnlock
    ? seededShuffle(baseLevelIds, `world-${worldDefinition.id}-boss-rush`)
    : baseLevelIds;

  const stages = chunkBySize(orderedLevelIds, 6).map((stageLevelIds, stageIndex) => {
    const tiers = [0, 1, 2]
      .map((tierIndex) => {
        const start = tierIndex * 2;
        const tierLevelIds = stageLevelIds.slice(start, start + 2);
        if (tierLevelIds.length === 0) return null;

        const challenges = tierLevelIds
          .map((levelId, offset) => buildChallenge(worldDefinition, stageIndex, start + offset, levelId))
          .filter(Boolean);

        return {
          index: tierIndex,
          label: `Tier ${tierIndex + 1}`,
          levelIds: tierLevelIds,
          challenges,
          complete: tierLevelIds.every((levelId) => isLevelComplete(levelStars, levelId)),
        };
      })
      .filter(Boolean);

    return {
      index: stageIndex,
      label: `Set ${stageIndex + 1}`,
      levelIds: stageLevelIds,
      tiers,
      complete: stageLevelIds.every((levelId) => isLevelComplete(levelStars, levelId)),
    };
  });

  const completedCount = orderedLevelIds.filter((levelId) => isLevelComplete(levelStars, levelId)).length;
  const isComplete = orderedLevelIds.length > 0 && completedCount === orderedLevelIds.length;
  const firstIncompleteStageIndex = stages.findIndex((stage) => !stage.complete);
  const activeStageIndex = firstIncompleteStageIndex >= 0 ? firstIncompleteStageIndex : Math.max(0, stages.length - 1);
  const activeStage = stages[activeStageIndex] || null;

  const activeTierIndex = activeStage
    ? (() => {
        const firstIncompleteTier = activeStage.tiers.findIndex((tier) => !tier.complete);
        if (firstIncompleteTier >= 0) return firstIncompleteTier;
        return Math.max(0, activeStage.tiers.length - 1);
      })()
    : 0;

  const challengeByLevelId = {};
  for (const stage of stages) {
    for (const tier of stage.tiers) {
      for (const challenge of tier.challenges) {
        challengeByLevelId[challenge.levelId] = challenge;
      }
    }
  }

  return {
    id: worldDefinition.id,
    name: worldDefinition.name,
    family: worldDefinition.family,
    problemRange: worldDefinition.problemRange,
    randomUnlock: worldDefinition.randomUnlock,
    levelIds: orderedLevelIds,
    challengeByLevelId,
    stages,
    completedCount,
    totalCount: orderedLevelIds.length,
    isComplete,
    activeStageIndex,
    activeTierIndex,
  };
}

function pickDailyChallenge(worlds, now, levelStars) {
  const dateKey = getLocalDateKey(now);
  const allCandidates = worlds
    .filter((world) => world.isUnlocked)
    .flatMap((world) =>
      world.levelIds.map((levelId) => ({
        worldId: world.id,
        levelId,
        challenge: world.challengeByLevelId[levelId],
      }))
    )
    .filter((entry) => !!entry.challenge);

  if (allCandidates.length === 0) return null;

  const incomplete = allCandidates.filter((entry) => !isLevelComplete(levelStars, entry.levelId));
  const candidates = incomplete.length > 0 ? incomplete : allCandidates;
  const idx = hashString(`daily:${dateKey}`) % candidates.length;
  const chosen = candidates[idx];

  return {
    dateKey,
    worldId: chosen.worldId,
    levelId: chosen.levelId,
    challenge: chosen.challenge,
    level: chosen.challenge.level,
    completed: isLevelComplete(levelStars, chosen.levelId),
  };
}

export function getBlueprintCampaign(levelStars = {}, now = new Date()) {
  const safeStars = {};
  for (const key of Object.keys(levelStars || {})) {
    const value = Number(levelStars[key]);
    if (!Number.isFinite(value) || value <= 0) continue;
    safeStars[String(key)] = Math.max(0, Math.min(3, Math.round(value)));
  }

  const baseWorlds = WORLD_DEFINITIONS.map((world) => buildWorldProgress(world, safeStars));
  const completedCoreWorlds = baseWorlds.filter((world) => world.id <= 9 && world.isComplete).length;

  const worlds = baseWorlds.map((world) => {
    const unlockRule = getUnlockRule(world.id);
    const isUnlocked = world.isComplete || completedCoreWorlds >= unlockRule.requiredCompletedWorlds;
    const activeStage = world.stages[world.activeStageIndex] || null;
    const activeTier = activeStage?.tiers?.[world.activeTierIndex] || null;
    const lockedSilhouettes = (activeStage?.tiers || [])
      .filter((tier, index) => index > world.activeTierIndex)
      .map((tier) => ({
        tierIndex: tier.index,
        label: tier.label,
        count: tier.challenges.length,
      }));

    return {
      ...world,
      unlockRule,
      isUnlocked,
      progressPct: world.totalCount > 0 ? Math.round((world.completedCount / world.totalCount) * 100) : 0,
      activeStage,
      activeTier,
      visibleChallenges: isUnlocked ? activeTier?.challenges || [] : [],
      lockedSilhouettes: isUnlocked ? lockedSilhouettes : [],
    };
  });

  const unlockedWorldIds = worlds.filter((world) => world.isUnlocked).map((world) => world.id);
  const dailyChallenge = pickDailyChallenge(worlds, now, safeStars);

  return {
    worlds,
    unlockedWorldIds,
    completedCoreWorlds,
    dailyChallenge,
  };
}

export const BLUEPRINT_WORLD_DEFINITIONS = WORLD_DEFINITIONS.map((world) => ({
  id: world.id,
  name: world.name,
  family: world.family,
  problemRange: world.problemRange,
}));

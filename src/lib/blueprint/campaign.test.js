import { describe, expect, it } from "vitest";

import { getBlueprintCampaign } from "./campaign";

function completeLevels(levelIds) {
  const out = {};
  for (const id of levelIds) out[String(id)] = 1;
  return out;
}

describe("lib/blueprint/campaign", () => {
  it("builds ten worlds and unlocks worlds 1-3 by default", () => {
    const campaign = getBlueprintCampaign({});
    expect(campaign.worlds).toHaveLength(10);

    const unlocked = campaign.worlds.filter((world) => world.isUnlocked).map((world) => world.id);
    expect(unlocked).toEqual([1, 2, 3]);
  });

  it("unlocks worlds 4-6 after completing any two worlds", () => {
    const initial = getBlueprintCampaign({});
    const world1Ids = initial.worlds.find((world) => world.id === 1)?.levelIds || [];
    const world2Ids = initial.worlds.find((world) => world.id === 2)?.levelIds || [];
    const stars = { ...completeLevels(world1Ids), ...completeLevels(world2Ids) };

    const campaign = getBlueprintCampaign(stars);
    expect(campaign.completedCoreWorlds).toBeGreaterThanOrEqual(2);

    for (const worldId of [4, 5, 6]) {
      expect(campaign.worlds.find((world) => world.id === worldId)?.isUnlocked).toBe(true);
    }
  });

  it("keeps world 10 challenges unlabeled and hintless", () => {
    const initial = getBlueprintCampaign({});
    const worldsToComplete = initial.worlds
      .filter((world) => world.id >= 1 && world.id <= 5)
      .flatMap((world) => world.levelIds);

    const campaign = getBlueprintCampaign(completeLevels(worldsToComplete));
    const world10 = campaign.worlds.find((world) => world.id === 10);
    expect(world10?.isUnlocked).toBe(true);

    for (const challenge of world10?.visibleChallenges || []) {
      expect(challenge.showPatternLabel).toBe(false);
      expect(challenge.hintsMode).toBe("none");
    }
  });

  it("returns a deterministic daily problem from unlocked worlds", () => {
    const date = new Date("2026-02-12T10:00:00");
    const campaignA = getBlueprintCampaign({}, date);
    const campaignB = getBlueprintCampaign({}, date);

    expect(campaignA.dailyChallenge).toBeTruthy();
    expect(campaignA.dailyChallenge?.levelId).toBe(campaignB.dailyChallenge?.levelId);
    expect([1, 2, 3]).toContain(campaignA.dailyChallenge?.worldId);
  });
});

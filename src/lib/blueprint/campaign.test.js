import { describe, expect, it } from "vitest";

import { getBlueprintCampaign } from "./campaign";

function completeLevels(levelIds) {
  const out = {};
  for (const id of levelIds) out[String(id)] = 1;
  return out;
}

describe("lib/blueprint/campaign", () => {
  it("builds eleven worlds and unlocks worlds 0-3 by default", () => {
    const campaign = getBlueprintCampaign({});
    expect(campaign.worlds).toHaveLength(11);

    const unlocked = campaign.worlds.filter((world) => world.isUnlocked).map((world) => world.id);
    expect(unlocked).toEqual([0, 1, 2, 3]);
  });

  it("keeps all world 0 tiers open by default", () => {
    const campaign = getBlueprintCampaign({});
    const world0 = campaign.worlds.find((world) => world.id === 0);

    expect(world0?.stages).toHaveLength(1);
    expect(world0?.activeStage?.tiers?.length).toBeGreaterThan(1);
    expect(Object.keys(world0?.challengeByLevelId || {})).toHaveLength(world0?.totalCount || 0);
    expect(world0?.activeTierIndex).toBe((world0?.activeStage?.tiers?.length || 1) - 1);
    expect(world0?.lockedSilhouettes).toEqual([]);
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

  it("does not count world 0 completion toward core world unlock thresholds", () => {
    const initial = getBlueprintCampaign({});
    const world0Ids = initial.worlds.find((world) => world.id === 0)?.levelIds || [];
    const campaign = getBlueprintCampaign(completeLevels(world0Ids));

    expect(campaign.completedCoreWorlds).toBe(0);
    for (const worldId of [4, 5, 6]) {
      expect(campaign.worlds.find((world) => world.id === worldId)?.isUnlocked).toBe(false);
    }
  });
});

import { describe, expect, it } from "vitest";

import { QUESTIONS } from "../questions";
import {
  ARCHETYPE_DEFINITIONS,
  BLUEPRINT_PATTERN_TAXONOMY,
  WAVE_IDS,
  getQuestionBlueprintProfile,
  getWaveTemplateStrategyId,
} from "./taxonomy";

describe("lib/blueprint/taxonomy", () => {
  it("maps every question to a taxonomy profile", () => {
    for (const question of QUESTIONS) {
      const profile = getQuestionBlueprintProfile(question);
      expect(profile.wave).toBeTruthy();
      expect(profile.templateId).toBeTruthy();
      expect(profile.strategyId).toBeTruthy();
      expect(ARCHETYPE_DEFINITIONS[profile.archetypeId]).toBeTruthy();
    }
  });

  it("provides wave strategy ids for all configured waves", () => {
    for (const waveId of Object.values(WAVE_IDS)) {
      expect(getWaveTemplateStrategyId(waveId)).toBeTruthy();
    }
  });

  it("contains explicit taxonomy entries for core patterns", () => {
    expect(BLUEPRINT_PATTERN_TAXONOMY["Topological Sort"]).toBeTruthy();
    expect(BLUEPRINT_PATTERN_TAXONOMY["Backtracking"]).toBeTruthy();
    expect(BLUEPRINT_PATTERN_TAXONOMY["Matrix"]).toBeTruthy();
  });
});

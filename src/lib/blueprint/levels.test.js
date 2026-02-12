import { describe, expect, it } from "vitest";

import { QUESTIONS } from "../questions";
import { BLUEPRINT_LEVELS } from "./levels";

describe("lib/blueprint/levels", () => {
  it("includes an auto-generated blueprint level for every question", () => {
    const autoLevels = BLUEPRINT_LEVELS.filter((level) => String(level.id).startsWith("q-"));
    expect(autoLevels).toHaveLength(QUESTIONS.length);

    const byQuestionId = new Map(autoLevels.map((level) => [Number(String(level.id).slice(2)), level]));
    for (const question of QUESTIONS) {
      const level = byQuestionId.get(question.id);
      expect(level?.title).toBe(question.name);
      expect(level?.pattern).toBe(question.pattern);
    }
  });

  it("marks generated levels as buildable with canonical cards", () => {
    const autoLevels = BLUEPRINT_LEVELS.filter((level) => String(level.id).startsWith("q-"));
    for (const level of autoLevels) {
      expect(level.cards.length).toBeGreaterThan(0);
      expect(level.cards.every((card) => !!card.correctSlot)).toBe(true);
      expect(level.testCases?.length).toBeGreaterThan(0);
      expect(typeof level.testCases[0].expected).toBe("string");
    }
  });
});

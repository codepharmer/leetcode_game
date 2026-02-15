import { describe, expect, it } from "vitest";

import { GAME_TYPES } from "./constants";
import { GAME_TYPE_OPTIONS, getGameTypeConfig } from "./gameContent";

describe("lib/gameContent", () => {
  it("exposes both game type options", () => {
    expect(GAME_TYPE_OPTIONS.map((o) => o.value).sort()).toEqual(
      [GAME_TYPES.QUESTION_TO_PATTERN, GAME_TYPES.TEMPLATE_TO_PATTERN, GAME_TYPES.BLUEPRINT_BUILDER].sort()
    );
  });

  it("returns question config by default for unknown game type", () => {
    const config = getGameTypeConfig("unknown");
    expect(config.value).toBe(GAME_TYPES.QUESTION_TO_PATTERN);
    expect(config.promptLabel).toContain("pattern");
  });

  it("builds choices for question game type", () => {
    const config = getGameTypeConfig(GAME_TYPES.QUESTION_TO_PATTERN);
    const sample = config.items[0];
    const choices = config.buildChoices(sample.pattern);
    expect(choices).toContain(sample.pattern);
    expect(choices).toHaveLength(4);
    expect(sample.promptKind).toBe("question");
  });

  it("uses imported solution patterns as question-mode answer keys when available", () => {
    const config = getGameTypeConfig(GAME_TYPES.QUESTION_TO_PATTERN);
    const matched = config.items.find((item) => item.id === 1);
    const unmatched = config.items.find((item) => item.id === 12);

    expect(matched?.pattern).toBe("Hash map lookup");
    expect(matched?.templatePattern).toBe("Hash Map");

    expect(unmatched?.pattern).toBe("Two Pointers");
    expect(unmatched?.templatePattern).toBe("Two Pointers");
  });

  it("builds confusion-based choices for template game type", () => {
    const config = getGameTypeConfig(GAME_TYPES.TEMPLATE_TO_PATTERN);
    const sample = config.items.find((item) => item.pattern === "Sliding Window");
    const choices = config.buildChoices(sample.pattern);
    expect(choices).toContain(sample.pattern);
    expect(choices).toHaveLength(4);
    expect(sample.promptKind).toBe("code");
    expect(sample.title).toMatch(/^Snippet/);
  });

  it("exposes blueprint builder mode config", () => {
    const config = getGameTypeConfig(GAME_TYPES.BLUEPRINT_BUILDER);
    expect(config.value).toBe(GAME_TYPES.BLUEPRINT_BUILDER);
    expect(config.items.length).toBeGreaterThan(0);
    expect(config.supportsBrowse).toBe(false);
    expect(config.supportsDifficultyFilter).toBe(false);
  });
});

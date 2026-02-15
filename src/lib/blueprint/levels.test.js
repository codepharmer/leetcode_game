import { describe, expect, it } from "vitest";

import { QUESTIONS } from "../questions";
import { BLUEPRINT_LEVELS } from "./levels";

describe("lib/blueprint/levels", () => {
  const OUTLINE_PLACEHOLDERS = new Set([
    "initialize core state",
    "initialize best answer",
    "iterate through candidates",
    "update running state",
    "check invariant / improve answer",
    "return the best answer",
    "generate next choices",
    "prune invalid choices",
    "if complete solution: record it",
    "choose -> recurse -> unchoose",
    "return collected results",
    "handle base case / memo hit",
    "select branches / subproblems",
    "prune invalid branch",
    "recurse into next state",
    "combine child results",
  ]);

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

  it("builds generated levels from concrete code steps instead of outline placeholders", () => {
    const autoLevels = BLUEPRINT_LEVELS.filter((level) => String(level.id).startsWith("q-"));
    for (const level of autoLevels) {
      expect(level.cards.some((card) => /[=()]/.test(card.text) || /\b(for|while|if|return)\b/.test(card.text))).toBe(true);
      expect(level.cards.some((card) => OUTLINE_PLACEHOLDERS.has(card.text))).toBe(false);
    }
  });

  it("ships all generated levels as strategy output (no fallback)", () => {
    const autoLevels = BLUEPRINT_LEVELS.filter((level) => String(level.id).startsWith("q-"));
    for (const level of autoLevels) {
      expect(level.generationSource).toBe("strategy");
      expect(level.verification?.passed).toBe(true);
    }
  });

  it("uses pattern-specific slot structures across archetypes", () => {
    const autoLevels = BLUEPRINT_LEVELS.filter((level) => String(level.id).startsWith("q-"));
    expect(
      autoLevels.some(
        (level) =>
          level.slots.includes("seed") &&
          level.slots.includes("loop") &&
          level.slots.includes("probe") &&
          level.slots.includes("store")
      )
    ).toBe(true);
    expect(autoLevels.some((level) => level.slots.includes("choose") && level.slots.includes("constrain"))).toBe(true);
    expect(autoLevels.some((level) => level.slots.includes("base-case") && level.slots.includes("aggregate"))).toBe(true);
    expect(autoLevels.some((level) => level.slots.includes("base-state") && level.slots.includes("memoize"))).toBe(true);
  });

  it("maps core patterns to non-default template flows", () => {
    const autoLevels = new Map(
      BLUEPRINT_LEVELS
        .filter((level) => String(level.id).startsWith("q-"))
        .map((level) => [String(level.id), level])
    );

    expect(autoLevels.get("q-11")?.slots).toEqual(["anchors", "converge", "shift", "compare", "emit"]);
    expect(autoLevels.get("q-13")?.slots).toEqual(["bootstrap", "expand", "shrink", "window-check", "emit"]);
    expect(autoLevels.get("q-17")?.slots).toEqual(["init-structure", "iterate", "push-pop", "resolve", "emit"]);
    expect(autoLevels.get("q-21")?.slots).toEqual(["bounds", "halve", "move-bounds", "mid-check", "emit"]);
    expect(autoLevels.get("q-27")?.slots).toEqual(["anchors", "walk", "relink", "guard", "emit"]);
    expect(autoLevels.get("q-33")?.slots).toEqual(["base-case", "branch", "prune", "traverse", "aggregate"]);
    expect(autoLevels.get("q-62")?.slots).toEqual(["base-state", "subproblem", "state-guard", "transition", "memoize"]);
  });

  it("keeps array/hash generated solutions aligned to probe then store stages", () => {
    const twoSum = BLUEPRINT_LEVELS.find((level) => String(level.id) === "q-1");
    expect(twoSum?.slots).toEqual(["seed", "loop", "probe", "store", "emit"]);

    const byKey = new Map((twoSum?.cards || []).filter((card) => card.correctSlot).map((card) => [card.key, card.correctSlot]));
    expect(byKey.get("need-target")).toBe("probe");
    expect(byKey.get("found-match")).toBe("probe");
    expect(byKey.get("save-index")).toBe("store");
  });
});

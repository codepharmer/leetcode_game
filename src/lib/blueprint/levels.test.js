import { describe, expect, it } from "vitest";

import { QUESTIONS } from "../questions";
import { getBlueprintCampaign } from "./campaign";
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
      expect(typeof level.validationMode).toBe("string");
      expect(typeof level.testOutputMode).toBe("string");
    }
  });

  it("builds generated levels from concrete code steps instead of outline placeholders", () => {
    const autoLevels = BLUEPRINT_LEVELS.filter((level) => String(level.id).startsWith("q-"));
    for (const level of autoLevels) {
      expect(level.cards.some((card) => /[=()]/.test(card.text) || /\b(for|while|if|return)\b/.test(card.text))).toBe(true);
      expect(level.cards.some((card) => OUTLINE_PLACEHOLDERS.has(card.text))).toBe(false);
    }
  });

  it("does not generate standalone comment-only cards", () => {
    const autoLevels = BLUEPRINT_LEVELS.filter((level) => String(level.id).startsWith("q-"));
    for (const level of autoLevels) {
      expect(level.cards.some((card) => /^(\/\/|#)/.test(String(card.text || "").trim()))).toBe(false);
      expect(level.cards.some((card) => /^\/\*[\s\S]*\*\/$/.test(String(card.text || "").trim()))).toBe(false);
    }
  });

  it("keeps World 0 solution cards free of placeholder pseudocode and inline comment markers", () => {
    const world0 = getBlueprintCampaign({}).worlds.find((world) => world.id === 0);
    expect(world0).toBeTruthy();

    const badPatterns = [
      /(^|\s)#/,
      /\bwindow invalid\b/i,
      /\bwindow valid\b/i,
      /\bupdate best answer\b/i,
      /\breturn answer\b/i,
      /\btransformedHead\b/i,
      /\baggregatedResult\b/i,
      /\bstack\/heap\b/i,
      /\bfor\s+right\s*=\s*0\s*\.\.\s*end\b/i,
    ];

    for (const levelId of world0?.levelIds || []) {
      const level = BLUEPRINT_LEVELS.find((item) => String(item.id) === String(levelId));
      expect(level).toBeTruthy();
      for (const card of level?.cards || []) {
        expect(badPatterns.some((pattern) => pattern.test(String(card.text || "")))).toBe(false);
      }
    }
  });

  it("keeps all level solution cards free of pseudocode placeholders and inline comment markers", () => {
    const badPatterns = [
      /(^|\s)#/,
      /\bwindow invalid\b/i,
      /\bwindow valid\b/i,
      /\bupdate best answer\b/i,
      /\breturn answer\b/i,
      /\btransformedHead\b/i,
      /\baggregatedResult\b/i,
      /\bstack\/heap\b/i,
      /\bfor\s+right\s*=\s*0\s*\.\.\s*end\b/i,
      /\bappend .* until\b/i,
      /\bread digits until\b/i,
      /\bdecrement count\b/i,
      /\brecord triplet\b/i,
      /\bskip duplicates\b/i,
      /\bbased on\b/i,
      /\binvariant\b/i,
      /\bstate transitions\b/i,
      /\bprior subproblems\b/i,
      /\bbest\(dp\[subproblem\]\s*\+\s*cost\)/i,
      /\binitialize dp base cases\b/i,
      /\bfor each state\b/i,
      /\bfor each item in input\b/i,
      /\bcheck invariant\b/i,
      /\bcollect solution\b/i,
      /\bchoices\(state\)\b/i,
    ];

    for (const level of BLUEPRINT_LEVELS) {
      for (const card of level.cards || []) {
        if (!card.correctSlot) continue;
        expect(badPatterns.some((pattern) => pattern.test(String(card.text || "")))).toBe(false);
      }
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

  it("renders q1-q50 generated display cards in python-style syntax", () => {
    const targetLevelIds = new Set(Array.from({ length: 50 }, (_unused, idx) => `q-${idx + 1}`));
    const jsPatterns = [
      /\bconst\b/,
      /\blet\b/,
      /\bvar\b/,
      /\bfunction\b/,
      /=>/,
      /===/,
      /!==/,
      /&&/,
      /\|\|/,
      /\?\./,
      /\bnew\s+(?:Map|Set|Array)\b/,
      /\bMath\./,
      /\bNumber\./,
      /\bArray\./,
      /\.push\(/,
      /\.shift\(/,
      /\.unshift\(/,
      /\.splice\(/,
      /\.flatMap\(/,
      /\.localeCompare\(/,
      /\.length\b/,
      /;\s*$/,
      /^\s*for\s*\(/,
      /^\s*while\s*\(.+\)\s*\{?\s*$/,
      /^\s*if\s*\(.+\)\s*\{?\s*$/,
      /\bnull\b/,
      /\btrue\b/,
      /\bfalse\b/,
    ];

    const levels = BLUEPRINT_LEVELS.filter((level) => targetLevelIds.has(String(level.id)));
    expect(levels).toHaveLength(targetLevelIds.size);

    for (const level of levels) {
      for (const card of level.cards || []) {
        if (!card.correctSlot) continue;
        const text = String(card.text || "");
        expect(jsPatterns.some((pattern) => pattern.test(text))).toBe(false);
      }
    }
  });

  it("enables adaptive validation with contract output modes for generated levels", () => {
    const groupAnagrams = BLUEPRINT_LEVELS.find((level) => String(level.id) === "q-4");
    expect(groupAnagrams?.validationMode).toBe("adaptive");
    expect(groupAnagrams?.testOutputMode).toBe("unordered-nested-members");
    expect(Array.isArray(groupAnagrams?.testCases)).toBe(true);
    expect(groupAnagrams.testCases.length).toBeGreaterThan(0);
    expect(Array.isArray(groupAnagrams.testCases[0].expected)).toBe(true);
  });
});

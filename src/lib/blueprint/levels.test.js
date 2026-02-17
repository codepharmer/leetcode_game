import { describe, expect, it } from "vitest";

import { QUESTIONS } from "../questions";
import { getBlueprintCampaign } from "./campaign";
import { BLUEPRINT_LEVELS } from "./levels";
import {
  ARRAY_HASHING_TEMPLATE_ID,
  BACKTRACKING_TEMPLATE_ID,
  BINARY_SEARCH_TEMPLATE_ID,
  DEFAULT_BLUEPRINT_TEMPLATE_ID,
  DP_STATE_TEMPLATE_ID,
  INTERVAL_GREEDY_TEMPLATE_ID,
  LINKED_LIST_TEMPLATE_ID,
  SLIDING_WINDOW_TEMPLATE_ID,
  STACK_HEAP_TEMPLATE_ID,
  TREE_GRAPH_TEMPLATE_ID,
  TWO_POINTERS_TEMPLATE_ID,
} from "./templates";

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

  function cardsInSlot(level, slotId) {
    return (level?.cards || [])
      .filter((card) => card.correctSlot === slotId)
      .sort((a, b) => (a.correctOrder || 0) - (b.correctOrder || 0));
  }

  function slotSource(level, slotId) {
    return cardsInSlot(level, slotId)
      .map((card) => String(card.execText || card.text || ""))
      .join("\n");
  }

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

  it("enforces per-template slot invariants on generated levels", () => {
    const autoLevels = BLUEPRINT_LEVELS.filter((level) => String(level.id).startsWith("q-"));
    const hasLoop = (text) => /\b(for|while)\b/.test(String(text || ""));
    const hasConditional = (text) => /\b(if|elif|else)\b/.test(String(text || ""));
    const hasReturn = (text) => /\breturn\b/.test(String(text || ""));

    for (const level of autoLevels) {
      const templateId = String(level.templateId || "");
      const anchors = slotSource(level, "anchors");
      const loop = slotSource(level, "loop");
      const ret = slotSource(level, "return");
      const emit = slotSource(level, "emit");

      if (templateId === TWO_POINTERS_TEMPLATE_ID) {
        expect(anchors).toMatch(/\b(left|right|slow|fast|lo|hi|start|end)\b/);
        expect(new Set((anchors.match(/\b(left|right|slow|fast|lo|hi|start|end)\b/g) || [])).size).toBeGreaterThanOrEqual(2);
        expect(hasLoop(slotSource(level, "converge"))).toBe(true);
        expect(hasConditional(slotSource(level, "compare"))).toBe(true);
        expect(hasReturn(emit)).toBe(true);
        continue;
      }

      if (templateId === SLIDING_WINDOW_TEMPLATE_ID) {
        expect(hasLoop(slotSource(level, "expand"))).toBe(true);
        expect(hasReturn(emit)).toBe(true);
        continue;
      }

      if (templateId === STACK_HEAP_TEMPLATE_ID) {
        expect(
          String(slotSource(level, "iterate") || "").trim().length > 0 ||
          String(slotSource(level, "push-pop") || "").trim().length > 0
        ).toBe(true);
        expect(slotSource(level, "init-structure")).toMatch(/(=|stack|heap|queue|map|set)/i);
        expect(hasReturn(emit)).toBe(true);
        continue;
      }

      if (templateId === BINARY_SEARCH_TEMPLATE_ID) {
        expect(slotSource(level, "bounds")).toMatch(/(=|left|right|lo|hi|half|partition)/);
        expect(hasLoop(slotSource(level, "halve"))).toBe(true);
        expect(hasConditional(slotSource(level, "mid-check"))).toBe(true);
        expect(hasReturn(emit)).toBe(true);
        continue;
      }

      if (templateId === LINKED_LIST_TEMPLATE_ID) {
        expect(slotSource(level, "anchors")).toMatch(/\b(head|slow|fast|cur|prev|next|dummy|tail)\b/);
        expect(hasLoop(slotSource(level, "walk"))).toBe(true);
        expect(hasReturn(emit)).toBe(true);
        continue;
      }

      if (templateId === INTERVAL_GREEDY_TEMPLATE_ID) {
        expect(slotSource(level, "order")).toMatch(/(sort|=)/);
        expect(hasLoop(slotSource(level, "sweep"))).toBe(true);
        expect(hasReturn(emit)).toBe(true);
        continue;
      }

      if (templateId === BACKTRACKING_TEMPLATE_ID) {
        expect(hasLoop(slotSource(level, "choose"))).toBe(true);
        expect(String(slotSource(level, "constrain") || "").trim().length).toBeGreaterThan(0);
        expect(String(slotSource(level, "base") || "").trim().length).toBeGreaterThan(0);
        expect(hasReturn(ret)).toBe(true);
        continue;
      }

      if (templateId === TREE_GRAPH_TEMPLATE_ID) {
        expect(String(slotSource(level, "base-case") || "").trim().length).toBeGreaterThan(0);
        expect(hasReturn(slotSource(level, "aggregate"))).toBe(true);
        continue;
      }

      if (templateId === DP_STATE_TEMPLATE_ID) {
        expect(slotSource(level, "base-state")).toMatch(/(=|fill\()/);
        expect(hasLoop(slotSource(level, "subproblem"))).toBe(true);
        expect(hasReturn(slotSource(level, "memoize"))).toBe(true);
        continue;
      }

      if (templateId === ARRAY_HASHING_TEMPLATE_ID) {
        expect(hasLoop(loop)).toBe(true);
        expect(hasReturn(emit)).toBe(true);
        continue;
      }

      if (templateId === DEFAULT_BLUEPRINT_TEMPLATE_ID) {
        expect(hasLoop(loop)).toBe(true);
        expect(hasReturn(ret)).toBe(true);
      }
    }
  });

  it("keeps fragile two-pointer levels aligned to slot semantics (q-10, q-11, q-12)", () => {
    const q10 = BLUEPRINT_LEVELS.find((level) => String(level.id) === "q-10");
    const q11 = BLUEPRINT_LEVELS.find((level) => String(level.id) === "q-11");
    const q12 = BLUEPRINT_LEVELS.find((level) => String(level.id) === "q-12");

    expect(q10?.templateId).toBe(TWO_POINTERS_TEMPLATE_ID);
    expect(q11?.templateId).toBe(TWO_POINTERS_TEMPLATE_ID);
    expect(q12?.templateId).toBe(TWO_POINTERS_TEMPLATE_ID);

    expect(slotSource(q10, "anchors")).toMatch(/\bleft\b/);
    expect(slotSource(q10, "anchors")).toMatch(/\bright\b/);
    expect(slotSource(q10, "shift")).toMatch(/\bsum\b/);

    expect(slotSource(q11, "anchors")).toMatch(/\bleft\b/);
    expect(slotSource(q11, "anchors")).toMatch(/\bright\b/);
    expect(slotSource(q11, "converge")).toMatch(/\bwhile\b/);
    expect(slotSource(q11, "compare")).toMatch(/\bif\b/);

    expect(slotSource(q12, "anchors")).toMatch(/\bleft\b/);
    expect(slotSource(q12, "anchors")).toMatch(/\bright\b/);
    expect(slotSource(q12, "converge")).toMatch(/\bwhile\b/);
    expect(slotSource(q12, "compare")).toMatch(/height\[left\]\s*<=\s*height\[right\]/);
    expect(slotSource(q12, "emit")).toMatch(/\breturn\s+water\b/);
  });

  it("keeps movement slots free of pointer-initialization lines across two-pointer levels", () => {
    const twoPointerLevels = BLUEPRINT_LEVELS.filter((level) => level.templateId === TWO_POINTERS_TEMPLATE_ID);

    const isInitLine = (source) => {
      const normalized = String(source || "").trim().replace(/\s+/g, " ");
      if (!normalized) return false;
      if (/^(const|let|var)\s+(left|right|slow|fast|lo|hi|start|end)\b/.test(normalized)) return true;
      if (/^(left|right|slow|fast|lo|hi|start|end)\s*=\s*(0|-?1|null|head|tail)\b/.test(normalized)) return true;
      if (/^(left|right|slow|fast|lo|hi|start|end)\s*=\s*.*\b(length|len)\b/.test(normalized)) return true;
      return false;
    };

    for (const level of twoPointerLevels) {
      for (const card of cardsInSlot(level, "shift")) {
        const source = String(card.execText || card.text || "");
        expect(isInitLine(source)).toBe(false);
      }
    }
  });

  it("keeps invert binary tree solution cards self-contained", () => {
    const level = BLUEPRINT_LEVELS.find((item) => String(item.id) === "q-33");
    expect(level).toBeTruthy();

    const source = (level?.cards || [])
      .filter((card) => !!card.correctSlot)
      .map((card) => String(card.execText || card.text || ""))
      .join("\n");

    expect(source).not.toMatch(/\barrayToTree\s*\(/);
    expect(source).not.toMatch(/\btreeToArray\s*\(/);
    expect(source).toMatch(/\breturn\s+invert\s*\(\s*root\s*\)/);
  });

  it("keeps tree world-0 solution cards free of hidden tree conversion helpers", () => {
    const targetIds = new Set(["q-33", "q-34", "q-35", "q-36", "q-38", "q-39", "q-40", "q-42", "q-43"]);
    const levels = BLUEPRINT_LEVELS.filter((level) => targetIds.has(String(level.id)));
    expect(levels).toHaveLength(targetIds.size);

    for (const level of levels) {
      const source = (level.cards || [])
        .filter((card) => !!card.correctSlot)
        .map((card) => String(card.execText || card.text || ""))
        .join("\n");
      expect(source).not.toMatch(/\barrayToTree\s*\(/);
      expect(source).not.toMatch(/\btreeToArray\s*\(/);
    }
  });

  it("keeps array/hash generated solutions aligned to probe then store stages", () => {
    const twoSum = BLUEPRINT_LEVELS.find((level) => String(level.id) === "q-1");
    expect(twoSum?.slots).toEqual(["seed", "loop", "probe", "store", "emit"]);

    const byKey = new Map((twoSum?.cards || []).filter((card) => card.correctSlot).map((card) => [card.key, card.correctSlot]));
    expect(byKey.get("need-target")).toBe("probe");
    expect(byKey.get("found-match")).toBe("probe");
    expect(byKey.get("save-index")).toBe("store");
  });

  it("renders q1-q87 generated display cards in python-style syntax", () => {
    const targetLevelIds = new Set(Array.from({ length: 87 }, (_unused, idx) => `q-${idx + 1}`));
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

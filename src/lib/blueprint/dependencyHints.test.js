import { describe, expect, it } from "vitest";

import {
  analyzeCardDependencies,
  buildCardPlacementFeedback,
  buildDependencyWarningForCard,
  extractDeclaredIdentifiers,
  extractReferencedIdentifiers,
} from "./dependencyHints";

describe("lib/blueprint/dependencyHints", () => {
  it("extracts declared and referenced identifiers from card text", () => {
    const declared = extractDeclaredIdentifiers("for (const word of strs)");
    const referenced = extractReferencedIdentifiers("for (const word of strs)");

    expect(declared).toContain("word");
    expect(referenced).toContain("strs");
    expect(referenced).not.toContain("word");
  });

  it("warns when a card references an identifier declared later", () => {
    const slotIds = ["seed", "loop", "probe", "store", "emit"];
    const slots = {
      seed: [{ id: "c1", text: "const groups = new Map()", key: "init-groups" }],
      loop: [{ id: "c2", text: "for (const word of strs)", key: "for-word" }],
      probe: [
        { id: "c3", text: "if (!groups.has(signatureKey)) groups.set(signatureKey, [])", key: "create-group" },
        { id: "c4", text: "const signatureKey = word.split('').sort().join('')", key: "build-signature" },
      ],
      store: [],
      emit: [{ id: "c5", text: "return Array.from(groups.values())", key: "ret-groups" }],
    };

    const analysis = analyzeCardDependencies({
      slotIds,
      slots,
      externalIdentifiers: ["strs"],
    });
    const warning = buildDependencyWarningForCard("c3", analysis, { probe: "PROBE" });

    expect(warning).toContain("signatureKey");
    expect(warning).toContain("PROBE");
  });

  it("does not warn for runtime helper identifiers used by blueprint execution", () => {
    const slotIds = ["anchors", "converge", "shift", "compare", "emit"];
    const slots = {
      anchors: [
        { id: "c1", text: "const text = s.toLowerCase()", key: "normalize" },
        { id: "c2", text: "let left = 0", key: "init-left" },
        { id: "c3", text: "let right = text.length - 1", key: "init-right" },
      ],
      converge: [{ id: "c4", text: "while (left < right)", key: "while-lt" }],
      shift: [],
      compare: [{ id: "c5", text: "while (left < right && !isAlphaNum(text[left])) left++", key: "skip-left" }],
      emit: [{ id: "c6", text: "return true", key: "ret-true" }],
    };

    const analysis = analyzeCardDependencies({
      slotIds,
      slots,
      externalIdentifiers: ["s"],
    });
    const warning = buildDependencyWarningForCard("c5", analysis, { compare: "COMPARE" });

    expect(warning).toBe("");
  });

  it("marks card placement statuses for failed attempts", () => {
    const level = {
      cards: [
        { id: "a", correctSlot: "seed", correctOrder: 0 },
        { id: "b", correctSlot: "probe", correctOrder: 0 },
        { id: "c", correctSlot: "store", correctOrder: 0 },
      ],
    };
    const slotIds = ["seed", "probe", "store"];
    const slots = {
      seed: [{ id: "a", text: "const groups = new Map()", key: "init-groups" }],
      probe: [],
      store: [
        { id: "b", text: "const signatureKey = word", key: "build-signature" },
        { id: "c", text: "groups.get(signatureKey).push(word)", key: "push-group" },
      ],
    };

    const dependencyAnalysis = analyzeCardDependencies({
      slotIds,
      slots,
      externalIdentifiers: ["word"],
    });
    const feedback = buildCardPlacementFeedback({
      level,
      slots,
      slotIds,
      slotNameById: { seed: "SEED", probe: "PROBE", store: "STORE" },
      dependencyAnalysis,
    });

    expect(feedback.a.status).toBe("correct");
    expect(feedback.b.status).toBe("wrong-phase");
    expect(feedback.c.status).toBe("misplaced");
  });
});

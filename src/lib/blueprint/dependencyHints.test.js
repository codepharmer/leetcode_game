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

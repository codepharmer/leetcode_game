import { describe, expect, it } from "vitest";

import { QUESTIONS } from "../questions";
import { BLUEPRINT_LEVELS } from "./levels";
import { buildGeneratedSolutionForQuestion } from "./solutionPipeline";

function getLevel(levelId) {
  return BLUEPRINT_LEVELS.find((level) => String(level.id) === String(levelId));
}

describe("lib/blueprint/solutionPipeline", () => {
  it("uses semantic-verified strategy generation for all 87 questions", () => {
    for (const question of QUESTIONS) {
      const level = getLevel(`q-${question.id}`);
      expect(level).toBeTruthy();
      expect(level.generationSource).toBe("strategy");
      expect(level.generationStrategyId).toBeTruthy();
      expect(level.generationContractId).toBeTruthy();
      expect(level.verification?.status).toBe("passed-semantic-gate");
      expect(level.verification?.passed).toBe(true);
      expect(level.verification?.deterministic?.total).toBeGreaterThan(0);
      expect(level.verification?.random?.total).toBeGreaterThan(0);
      expect(level.verification?.failedCount).toBe(0);
    }
  });

  it("does not fallback by default when strategy is missing", () => {
    const generated = buildGeneratedSolutionForQuestion({
      question: { id: 999, pattern: "Unknown", difficulty: "Easy", name: "Unknown" },
      levelId: "q-999",
      fallback: () => ({
        templateId: "standard_algo_flow",
        cards: [{ id: "q-999-c1", text: "return fallback", correctSlot: "return", correctOrder: 0, key: "fallback" }],
        snippetName: "fallback template",
      }),
    });

    expect(generated.source).toBe("strategy-error");
    expect(generated.verification?.status).toBe("missing-strategy");
  });

  it("uses template fallback only when explicitly enabled", () => {
    const generated = buildGeneratedSolutionForQuestion({
      question: { id: 999, pattern: "Unknown", difficulty: "Easy", name: "Unknown" },
      levelId: "q-999",
      allowFallback: true,
      fallback: () => ({
        templateId: "standard_algo_flow",
        cards: [{ id: "q-999-c1", text: "return fallback", correctSlot: "return", correctOrder: 0, key: "fallback" }],
        snippetName: "fallback template",
      }),
    });

    expect(generated.source).toBe("template-fallback");
    expect(generated.verification?.status).toBe("missing-strategy");
  });
});

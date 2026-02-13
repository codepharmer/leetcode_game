import { describe, expect, it } from "vitest";

import { QUESTIONS } from "../questions";
import {
  QUESTION_CONTRACTS,
  getContractCoverageSummary,
  getPlaceholderContractCount,
  hasPlaceholderProbeCases,
  getQuestionContract,
  validateContractSchema,
} from "./contracts";

describe("lib/blueprint/contracts", () => {
  it("covers all question ids", () => {
    const summary = getContractCoverageSummary();
    expect(summary.totalQuestions).toBe(QUESTIONS.length);
    expect(summary.coveredQuestions).toBe(QUESTIONS.length);
    expect(summary.missingQuestionIds).toHaveLength(0);
  });

  it("contains schema-valid contracts", () => {
    for (const contract of QUESTION_CONTRACTS) {
      const result = validateContractSchema(contract);
      expect(result.valid, `contract ${contract.id} should be valid`).toBe(true);
      expect(result.errors).toHaveLength(0);
    }
  });

  it("assigns a strategy to all shipped question contracts", () => {
    for (const question of QUESTIONS) {
      const contract = getQuestionContract(question);
      expect(contract.strategyId).toBeTruthy();
      expect(contract.deterministicCases.length).toBeGreaterThan(0);
      expect(contract.randomTrials).toBeGreaterThan(0);
    }
  });

  it("contains no placeholder probe cases for production questions", () => {
    expect(getPlaceholderContractCount(QUESTION_CONTRACTS)).toBe(0);
    for (const contract of QUESTION_CONTRACTS) {
      expect(hasPlaceholderProbeCases(contract)).toBe(false);
    }
  });
});

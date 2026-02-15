import { describe, expect, it } from "vitest";

import { QUESTION_CONTRACTS } from "../blueprint/contracts";
import { QUESTIONS } from "../questions";
import { TEMPLATE_QUESTIONS } from "../templateQuestions";
import {
  getBlueprintSeedByQuestionId,
  getPatternIndex,
  getQuestionToPatternItems,
  getTemplateToPatternItems,
  validateContentRegistry,
} from "./registry";

function assertInvariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

describe("lib/content/registry", () => {
  it("contains every canonical question in the registry projection", () => {
    const questionItems = getQuestionToPatternItems();
    const registryQuestionIds = new Set(questionItems.map((question) => Number(question.id)));
    const missingQuestionIds = QUESTIONS.map((question) => Number(question.id)).filter((id) => !registryQuestionIds.has(id));

    assertInvariant(
      missingQuestionIds.length === 0,
      `Invariant[canonical-question-coverage] Missing canonical question IDs: ${missingQuestionIds.join(", ")}`
    );
    expect(questionItems).toHaveLength(QUESTIONS.length);
  });

  it("ensures every registry question has a valid pattern and difficulty", () => {
    const allowedDifficulties = new Set(["Easy", "Medium", "Hard"]);
    const { patterns } = getPatternIndex();
    const canonicalPatternSet = new Set(patterns);
    const questionItems = getQuestionToPatternItems();

    const invalidPatterns = questionItems
      .filter((question) => !canonicalPatternSet.has(question.pattern))
      .map((question) => `${question.id}:${question.pattern}`);
    const invalidDifficulties = questionItems
      .filter((question) => !allowedDifficulties.has(question.difficulty))
      .map((question) => `${question.id}:${question.difficulty}`);

    assertInvariant(
      invalidPatterns.length === 0,
      `Invariant[question-pattern-valid] Invalid question pattern mappings: ${invalidPatterns.join(", ")}`
    );
    assertInvariant(
      invalidDifficulties.length === 0,
      `Invariant[question-difficulty-valid] Invalid question difficulties: ${invalidDifficulties.join(", ")}`
    );
  });

  it("ensures template mappings reference canonical patterns", () => {
    const { patterns } = getPatternIndex();
    const canonicalPatternSet = new Set(patterns);
    const templateItems = getTemplateToPatternItems();

    const invalidTemplatePatterns = templateItems
      .filter((snippet) => !canonicalPatternSet.has(snippet.pattern))
      .map((snippet) => `${snippet.id}:${snippet.pattern}`);

    assertInvariant(
      invalidTemplatePatterns.length === 0,
      `Invariant[template-pattern-valid] Template snippet patterns not in canonical patterns: ${invalidTemplatePatterns.join(", ")}`
    );
    expect(templateItems).toHaveLength(TEMPLATE_QUESTIONS.length);
  });

  it("exposes blueprint mappings for every canonical question ID", () => {
    const missingBlueprintSeeds = [];
    const invalidBlueprintContracts = [];
    const missingBlueprintTemplates = [];

    for (const question of QUESTIONS) {
      const seed = getBlueprintSeedByQuestionId(question.id);
      if (!seed) {
        missingBlueprintSeeds.push(question.id);
        continue;
      }

      if (Number(seed?.contract?.questionId) !== Number(question.id)) {
        invalidBlueprintContracts.push(question.id);
      }
      if (!seed?.blueprintProfile?.templateId) {
        missingBlueprintTemplates.push(question.id);
      }
    }

    assertInvariant(
      missingBlueprintSeeds.length === 0,
      `Invariant[blueprint-seed-coverage] Missing blueprint seeds for question IDs: ${missingBlueprintSeeds.join(", ")}`
    );
    assertInvariant(
      invalidBlueprintContracts.length === 0,
      `Invariant[blueprint-contract-link] Invalid blueprint contracts for question IDs: ${invalidBlueprintContracts.join(", ")}`
    );
    assertInvariant(
      missingBlueprintTemplates.length === 0,
      `Invariant[blueprint-template-link] Missing blueprint template IDs for question IDs: ${missingBlueprintTemplates.join(", ")}`
    );
  });

  it("contains no orphan question IDs in template or blueprint projections", () => {
    const canonicalQuestionIds = new Set(QUESTIONS.map((question) => Number(question.id)));
    const templateIds = new Set(getTemplateToPatternItems().map((snippet) => String(snippet.id)));
    const patternIndex = getPatternIndex();

    const orphanPatternQuestionIds = [];
    for (const entry of patternIndex.entries) {
      for (const questionId of entry.questionIds) {
        if (!canonicalQuestionIds.has(Number(questionId))) {
          orphanPatternQuestionIds.push(`${entry.pattern}:${questionId}`);
        }
      }
    }

    const orphanPatternTemplateIds = [];
    for (const entry of patternIndex.entries) {
      for (const templateId of entry.templateQuestionIds) {
        if (!templateIds.has(String(templateId))) {
          orphanPatternTemplateIds.push(`${entry.pattern}:${templateId}`);
        }
      }
    }

    const orphanBlueprintQuestionIds = QUESTION_CONTRACTS.map((contract) => Number(contract.questionId)).filter(
      (questionId) => !canonicalQuestionIds.has(questionId)
    );

    assertInvariant(
      orphanPatternQuestionIds.length === 0,
      `Invariant[template-projection-orphan-question-id] Orphan question IDs in pattern projections: ${orphanPatternQuestionIds.join(", ")}`
    );
    assertInvariant(
      orphanPatternTemplateIds.length === 0,
      `Invariant[template-projection-orphan-template-id] Orphan template IDs in pattern projections: ${orphanPatternTemplateIds.join(", ")}`
    );
    assertInvariant(
      orphanBlueprintQuestionIds.length === 0,
      `Invariant[blueprint-projection-orphan-question-id] Orphan question IDs in blueprint contracts: ${orphanBlueprintQuestionIds.join(", ")}`
    );
  });

  it("passes the registry invariant validator", () => {
    const validation = validateContentRegistry();
    assertInvariant(
      validation.valid,
      `Invariant[content-registry] Validation failed: ${validation.errors.join(" | ")}`
    );
    expect(validation.errors).toEqual([]);
  });
});

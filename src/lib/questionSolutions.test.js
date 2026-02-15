import { describe, expect, it } from "vitest";

import { QUESTIONS } from "./questions";
import { getQuestionSolutionOverride } from "./questionSolutions";

describe("lib/questionSolutions", () => {
  it("exposes imported solution metadata for matched questions", () => {
    const override = getQuestionSolutionOverride(1);
    expect(override).toBeTruthy();
    expect(override?.leetcodeId).toBe(1);
    expect(override?.answerPattern).toBe("Hash map lookup");
    expect(Array.isArray(override?.codeSolution)).toBe(true);
    expect(override?.codeSolution.length).toBeGreaterThan(0);
  });

  it("returns null for questions that do not exist in the imported source", () => {
    expect(getQuestionSolutionOverride(12)).toBeNull();
  });

  it("hydrates canonical questions with imported solution fields where available", () => {
    const mappedQuestion = QUESTIONS.find((question) => question.id === 1);
    const unmappedQuestion = QUESTIONS.find((question) => question.id === 12);

    expect(mappedQuestion?.solutionPattern).toBe("Hash map lookup");
    expect(mappedQuestion?.solutionPatternSpecific).toBe("Single-pass complement map (value -> index)");
    expect(mappedQuestion?.solutionType).toBe("Arrays & Hashing");
    expect(mappedQuestion?.sourceLeetcodeId).toBe(1);
    expect(mappedQuestion?.solutionCode?.length).toBeGreaterThan(0);
    expect(mappedQuestion?.intuition).toBeTruthy();

    expect(unmappedQuestion?.solutionPattern).toBeUndefined();
    expect(unmappedQuestion?.sourceLeetcodeId).toBeUndefined();
  });
});

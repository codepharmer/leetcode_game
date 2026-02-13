import { describe, expect, it } from "vitest";

import { QUESTIONS } from "../questions";
import { getTemplateSnippetForQuestion, QUESTION_TEMPLATE_VARIANT_BY_ID } from "./templatePlan";

function getQuestion(id) {
  return QUESTIONS.find((question) => question.id === id);
}

describe("lib/blueprint/templatePlan", () => {
  it("uses explicit overrides for known mismatch questions", () => {
    expect(QUESTION_TEMPLATE_VARIANT_BY_ID[57]).toBe(2);
    expect(QUESTION_TEMPLATE_VARIANT_BY_ID[58]).toBe(2);
    expect(QUESTION_TEMPLATE_VARIANT_BY_ID[59]).toBe(3);
    expect(QUESTION_TEMPLATE_VARIANT_BY_ID[60]).toBe(3);
    expect(QUESTION_TEMPLATE_VARIANT_BY_ID[85]).toBe(1);
    expect(QUESTION_TEMPLATE_VARIANT_BY_ID[86]).toBe(0);
    expect(QUESTION_TEMPLATE_VARIANT_BY_ID[87]).toBe(2);
  });

  it("maps topological/union-find questions to intended snippet families", () => {
    expect(getTemplateSnippetForQuestion(getQuestion(57)).name).toContain("Topological Sort");
    expect(getTemplateSnippetForQuestion(getQuestion(58)).name).toContain("Topological Sort");
    expect(getTemplateSnippetForQuestion(getQuestion(59)).name).toContain("Union-Find");
    expect(getTemplateSnippetForQuestion(getQuestion(60)).name).toContain("Union-Find");
  });

  it("maps matrix and bit questions to specific variants", () => {
    expect(getTemplateSnippetForQuestion(getQuestion(85)).name).toContain("Rotate");
    expect(getTemplateSnippetForQuestion(getQuestion(86)).name).toContain("Spiral");
    expect(getTemplateSnippetForQuestion(getQuestion(87)).name).toContain("Set Matrix Zeroes");
    expect(getTemplateSnippetForQuestion(getQuestion(80)).name).toContain("Popcount");
    expect(getTemplateSnippetForQuestion(getQuestion(81)).name).toContain("DP Bits");
    expect(getTemplateSnippetForQuestion(getQuestion(82)).name).toContain("Reverse");
    expect(getTemplateSnippetForQuestion(getQuestion(83)).name).toContain("XOR");
    expect(getTemplateSnippetForQuestion(getQuestion(84)).name).toContain("Bitwise Add");
  });
});


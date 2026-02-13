import { describe, expect, it } from "vitest";

import { QUESTIONS } from "../questions";
import { BLUEPRINT_LEVELS } from "./levels";
import { buildBlueprintCoverageReport, getBlueprintFallbackCount } from "./coverageReport";

describe("lib/blueprint/coverageReport", () => {
  it("reports full question coverage", () => {
    const report = buildBlueprintCoverageReport(BLUEPRINT_LEVELS, QUESTIONS);
    expect(report.total_questions).toBe(QUESTIONS.length);
    expect(report.strategy_generated).toBe(QUESTIONS.length);
    expect(report.semantic_passed).toBe(QUESTIONS.length);
    expect(report.strategy_coverage_pct).toBe(100);
    expect(report.semantic_pass_pct).toBe(100);
  });

  it("reports no template fallback in shipped levels", () => {
    expect(getBlueprintFallbackCount(BLUEPRINT_LEVELS)).toBe(0);
  });

  it("tracks per-pattern completion", () => {
    const report = buildBlueprintCoverageReport(BLUEPRINT_LEVELS, QUESTIONS);
    expect(report.per_pattern_completion["Dynamic Programming"].total).toBe(8);
    expect(report.per_pattern_completion["Dynamic Programming"].strategy_generated).toBe(8);
    expect(report.per_pattern_completion["Bit Manipulation"].semantic_passed).toBe(5);
  });
});

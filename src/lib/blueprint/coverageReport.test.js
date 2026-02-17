import { describe, expect, it } from "vitest";

import { QUESTIONS } from "../questions";
import { BLUEPRINT_LEVELS } from "./levels";
import { buildBlueprintCoverageReport, getBlueprintFallbackCount } from "./coverageReport";

describe("lib/blueprint/coverageReport", () => {
  it("reports full question coverage", () => {
    const report = buildBlueprintCoverageReport(BLUEPRINT_LEVELS, QUESTIONS);
    expect(report.total_questions).toBe(QUESTIONS.length);
    expect(report.strategy_generated).toBe(QUESTIONS.length);
    expect(report.problemSpecificStrategyCount).toBe(QUESTIONS.length);
    expect(report.placeholderContractCount).toBe(0);
    expect(report.semanticProbeUsageCount).toBe(0);
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
    expect(report.per_pattern_completion["Dynamic Programming"].problem_specific_strategy_generated).toBe(8);
    expect(report.per_pattern_completion["Bit Manipulation"].semantic_passed).toBe(5);
  });

  it("includes IR extraction diagnostics counters", () => {
    const report = buildBlueprintCoverageReport(BLUEPRINT_LEVELS, QUESTIONS);
    expect(typeof report.ir_v2_enabled_count).toBe("number");
    expect(typeof report.ir_v2_fallback_count).toBe("number");
    expect(typeof report.ir_bad_slot_incident_count).toBe("number");
    expect(report.ir_v2_enabled_count).toBeGreaterThanOrEqual(0);
    expect(report.ir_v2_fallback_count).toBeGreaterThanOrEqual(0);
    expect(report.ir_bad_slot_incident_count).toBeGreaterThanOrEqual(0);
  });
});

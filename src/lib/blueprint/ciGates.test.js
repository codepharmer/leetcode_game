import { describe, expect, it } from "vitest";

import { QUESTIONS } from "../questions";
import { buildBlueprintCoverageReport } from "./coverageReport";
import { BLUEPRINT_LEVELS } from "./levels";

describe("lib/blueprint/ciGates", () => {
  it("keeps strategy coverage at 100%", () => {
    const report = buildBlueprintCoverageReport(BLUEPRINT_LEVELS, QUESTIONS);
    expect(report.strategy_generated).toBe(QUESTIONS.length);
    expect(report.strategy_coverage_pct).toBe(100);
  });

  it("keeps semantic pass rate at 100%", () => {
    const report = buildBlueprintCoverageReport(BLUEPRINT_LEVELS, QUESTIONS);
    expect(report.semantic_passed).toBe(QUESTIONS.length);
    expect(report.semantic_pass_pct).toBe(100);
  });

  it("enforces fallback count of zero", () => {
    const report = buildBlueprintCoverageReport(BLUEPRINT_LEVELS, QUESTIONS);
    expect(report.fallback_count).toBe(0);
    for (const wave of Object.values(report.per_wave_completion)) {
      expect(wave.fallback_count).toBe(0);
    }
  });
});

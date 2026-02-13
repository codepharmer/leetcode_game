import { QUESTIONS } from "../questions";
import { getPatternWave } from "./taxonomy";

function toPercent(part, total) {
  if (total <= 0) return 0;
  return Number(((part / total) * 100).toFixed(2));
}

function questionIdFromLevel(level) {
  const value = String(level?.id || "");
  if (!value.startsWith("q-")) return null;
  const id = Number(value.slice(2));
  return Number.isInteger(id) ? id : null;
}

function buildPatternSummary(seed = { total: 0, strategy: 0, passed: 0, fallback: 0 }) {
  return {
    total: seed.total,
    strategy_generated: seed.strategy,
    semantic_passed: seed.passed,
    fallback_count: seed.fallback,
    strategy_coverage_pct: toPercent(seed.strategy, seed.total),
    semantic_pass_pct: toPercent(seed.passed, seed.total),
  };
}

function buildWaveSummary(seed = { total: 0, strategy: 0, passed: 0, fallback: 0 }) {
  return {
    total: seed.total,
    strategy_generated: seed.strategy,
    semantic_passed: seed.passed,
    fallback_count: seed.fallback,
    strategy_coverage_pct: toPercent(seed.strategy, seed.total),
    semantic_pass_pct: toPercent(seed.passed, seed.total),
  };
}

export function buildBlueprintCoverageReport(levels, questions = QUESTIONS) {
  const autoLevels = (levels || []).filter((level) => String(level?.id || "").startsWith("q-"));
  const byQuestionId = new Map(autoLevels.map((level) => [questionIdFromLevel(level), level]));

  let strategyGenerated = 0;
  let semanticPassed = 0;
  let fallbackCount = 0;
  let lowConfidenceCount = 0;

  const perPatternSeed = new Map();
  const perWaveSeed = new Map();

  for (const question of questions || []) {
    const level = byQuestionId.get(question.id);
    const pattern = question.pattern;
    const wave = getPatternWave(pattern);

    if (!perPatternSeed.has(pattern)) perPatternSeed.set(pattern, { total: 0, strategy: 0, passed: 0, fallback: 0 });
    if (!perWaveSeed.has(wave)) perWaveSeed.set(wave, { total: 0, strategy: 0, passed: 0, fallback: 0 });

    const patternState = perPatternSeed.get(pattern);
    const waveState = perWaveSeed.get(wave);
    patternState.total += 1;
    waveState.total += 1;

    const usedStrategy = level?.generationSource === "strategy";
    const passed = level?.verification?.passed === true;
    const fallback = level?.generationSource === "template-fallback";
    const lowConfidence = level?.verification?.confidence === "low";

    if (usedStrategy) {
      strategyGenerated += 1;
      patternState.strategy += 1;
      waveState.strategy += 1;
    }
    if (passed) {
      semanticPassed += 1;
      patternState.passed += 1;
      waveState.passed += 1;
    }
    if (fallback) {
      fallbackCount += 1;
      patternState.fallback += 1;
      waveState.fallback += 1;
    }
    if (lowConfidence) lowConfidenceCount += 1;
  }

  const perPatternCompletion = {};
  for (const [pattern, seed] of [...perPatternSeed.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    perPatternCompletion[pattern] = buildPatternSummary(seed);
  }

  const perWaveCompletion = {};
  for (const [wave, seed] of [...perWaveSeed.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    perWaveCompletion[wave] = buildWaveSummary(seed);
  }

  const totalQuestions = (questions || []).length;
  return {
    total_questions: totalQuestions,
    strategy_generated: strategyGenerated,
    semantic_passed: semanticPassed,
    fallback_count: fallbackCount,
    low_confidence_count: lowConfidenceCount,
    strategy_coverage_pct: toPercent(strategyGenerated, totalQuestions),
    semantic_pass_pct: toPercent(semanticPassed, totalQuestions),
    per_pattern_completion: perPatternCompletion,
    per_wave_completion: perWaveCompletion,
  };
}

export function formatBlueprintCoverageReport(report) {
  const lines = [];
  lines.push(`Total Questions: ${report.total_questions}`);
  lines.push(`Strategy Generated: ${report.strategy_generated}`);
  lines.push(`Semantic Passed: ${report.semantic_passed}`);
  lines.push(`Strategy Coverage %: ${report.strategy_coverage_pct}`);
  lines.push(`Semantic Pass %: ${report.semantic_pass_pct}`);
  lines.push(`Fallback Count: ${report.fallback_count}`);
  lines.push(`Low Confidence Count: ${report.low_confidence_count}`);
  lines.push("Per Wave Completion:");
  for (const [wave, waveSummary] of Object.entries(report.per_wave_completion || {})) {
    lines.push(`- ${wave}: strategy ${waveSummary.strategy_generated}/${waveSummary.total}, semantic ${waveSummary.semantic_passed}/${waveSummary.total}, fallback ${waveSummary.fallback_count}`);
  }
  lines.push("Per Pattern Completion:");
  for (const [pattern, patternSummary] of Object.entries(report.per_pattern_completion || {})) {
    lines.push(`- ${pattern}: strategy ${patternSummary.strategy_generated}/${patternSummary.total}, semantic ${patternSummary.semantic_passed}/${patternSummary.total}, fallback ${patternSummary.fallback_count}`);
  }
  return lines.join("\n");
}

export function getBlueprintFallbackCount(levels) {
  return (levels || []).filter((level) => level?.generationSource === "template-fallback").length;
}

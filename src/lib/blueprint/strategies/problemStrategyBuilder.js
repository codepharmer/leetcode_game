import { compareByOutputMode } from "./comparators";
import { randInt } from "./shared";

function cloneValue(value) {
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

export function buildCasesFromSamples(solve, samples) {
  return (samples || []).map((input) => ({
    input: cloneValue(input),
    expected: solve(cloneValue(input)),
  }));
}

export function sampleInputFactory(samples) {
  const source = Array.isArray(samples) ? samples : [];
  return (random) => {
    if (!source.length) return {};
    const index = randInt(random, 0, source.length - 1);
    return cloneValue(source[index]);
  };
}

export function makeProblemSpec({
  questionId,
  questionName,
  strategyId,
  templateId,
  complexity,
  constraints,
  samples,
  randomTrials,
  solve,
  snippetName,
  randomCaseFactory,
  randomOracle,
  normalizeResult,
  assertCase,
}) {
  const deterministicCases = buildCasesFromSamples(solve, samples);
  return {
    questionId: Number(questionId),
    questionName: questionName || `Question ${questionId}`,
    strategyId,
    templateId,
    complexity: complexity || { time: "pattern-dependent", space: "pattern-dependent" },
    constraints: constraints || { outputMode: "normalized", disallowTokens: [] },
    deterministicCases,
    randomTrials: Number.isInteger(randomTrials) ? randomTrials : 40,
    solve,
    snippetName: snippetName || `${questionName || `Question ${questionId}`} | Problem-specific strategy`,
    randomCaseFactory: randomCaseFactory || sampleInputFactory(samples),
    randomOracle: randomOracle || ((input) => solve(cloneValue(input))),
    normalizeResult,
    assertCase,
    cloneInputs: true,
  };
}

export function createStrategiesFromProblemSpecs(problemSpecs) {
  return (problemSpecs || []).map((spec) => ({
    id: spec.strategyId,
    name: spec.snippetName,
    appliesTo: (contract) => contract?.strategyId === spec.strategyId,
    buildPlan: (contract) => {
      const outputMode = contract?.constraints?.outputMode;
      return {
        templateId: spec.templateId,
        snippetName: spec.snippetName,
        ir: spec.ir || [],
        solve: spec.solve,
        deterministicCases: contract.deterministicCases,
        randomTrials: contract.randomTrials,
        randomCaseFactory: spec.randomCaseFactory,
        randomOracle: spec.randomOracle,
        normalizeResult: spec.normalizeResult,
        assertCase:
          spec.assertCase ||
          (({ input, got, expected, normalizeResult }) =>
            compareByOutputMode({
              mode: outputMode,
              input,
              got,
              expected,
              normalizeResult,
            })),
        cloneInputs: spec.cloneInputs === true,
      };
    },
  }));
}

export { cloneValue };


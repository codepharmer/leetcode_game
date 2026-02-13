import { buildTemplateIrForQuestion } from "../templatePlan";
import { WAVE_IDS, WAVE_TEMPLATE_STRATEGY_IDS, getQuestionBlueprintProfile } from "../taxonomy";
import { compareByOutputMode } from "./comparators";
import { randomSemanticProbeCase, semanticProbeOracle, solveSemanticProbe } from "./shared";

function makeWaveTemplateStrategy(waveId, waveName) {
  const strategyId = WAVE_TEMPLATE_STRATEGY_IDS[waveId];

  return {
    id: strategyId,
    name: `${waveName} Template Strategy Family`,
    appliesTo: (contract) => contract?.strategyId === strategyId,
    buildPlan: (contract, question) => {
      const profile = getQuestionBlueprintProfile(question);
      const { templateId, snippetName, irNodes } = buildTemplateIrForQuestion(question, profile.templateId);
      const outputMode = contract?.constraints?.outputMode;

      return {
        templateId,
        snippetName: `${question?.pattern || "Pattern"} | ${snippetName}`,
        ir: irNodes,
        solve: solveSemanticProbe,
        deterministicCases: contract.deterministicCases,
        randomTrials: contract.randomTrials,
        randomCaseFactory: randomSemanticProbeCase,
        randomOracle: semanticProbeOracle,
        assertCase: ({ input, got, expected, normalizeResult }) => compareByOutputMode({
          mode: outputMode,
          input,
          got,
          expected,
          normalizeResult,
        }),
      };
    },
  };
}

export function createWaveTemplateStrategies() {
  return [
    makeWaveTemplateStrategy(WAVE_IDS.WAVE_1, "Wave 1"),
    makeWaveTemplateStrategy(WAVE_IDS.WAVE_2, "Wave 2"),
    makeWaveTemplateStrategy(WAVE_IDS.WAVE_3, "Wave 3"),
    makeWaveTemplateStrategy(WAVE_IDS.WAVE_4, "Wave 4"),
    makeWaveTemplateStrategy(WAVE_IDS.WAVE_5, "Wave 5"),
    makeWaveTemplateStrategy(WAVE_IDS.WAVE_6, "Wave 6"),
  ];
}

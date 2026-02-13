import { createFirstTenStrategies } from "./firstTenStrategies";
import { createVerifierRandom } from "./shared";
import { createWaveTemplateStrategies } from "./waveTemplateStrategies";

const STRATEGIES = [...createFirstTenStrategies(), ...createWaveTemplateStrategies()];

export function selectBlueprintStrategy(contract) {
  for (const strategy of STRATEGIES) {
    if (strategy.appliesTo(contract)) return strategy;
  }
  return null;
}

export { createVerifierRandom };

export const BLUEPRINT_STRATEGIES = [...STRATEGIES];

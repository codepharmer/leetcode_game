import { createFirstTenStrategies } from "./firstTenStrategies";
import { createVerifierRandom } from "./shared";
import { createWave1Strategies } from "./wave1Strategies";
import { createWave2Strategies } from "./wave2Strategies";
import { createWave3Strategies } from "./wave3Strategies";
import { createWave4Strategies } from "./wave4Strategies";
import { createWave5Strategies } from "./wave5Strategies";
import { createWave6Strategies } from "./wave6Strategies";

const STRATEGIES = [
  ...createFirstTenStrategies(),
  ...createWave1Strategies(),
  ...createWave2Strategies(),
  ...createWave3Strategies(),
  ...createWave4Strategies(),
  ...createWave5Strategies(),
  ...createWave6Strategies(),
];

export function selectBlueprintStrategy(contract) {
  for (const strategy of STRATEGIES) {
    if (strategy.appliesTo(contract)) return strategy;
  }
  return null;
}

export { createVerifierRandom };

export const BLUEPRINT_STRATEGIES = [...STRATEGIES];

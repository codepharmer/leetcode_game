import { getQuestionContract } from "./contracts";
import { buildCardsFromIr } from "./ir";
import { verifySolutionPlan } from "./semanticVerifier";
import { selectBlueprintStrategy } from "./strategyRegistry";
import { DEFAULT_BLUEPRINT_TEMPLATE_ID } from "./templates";

function normalizeFallbackResult(fallbackResult) {
  return {
    templateId: fallbackResult?.templateId,
    cards: fallbackResult?.cards || [],
    snippetName: fallbackResult?.snippetName || "template fallback",
  };
}

function allowFallbackFromEnv() {
  const envValue = import.meta?.env?.VITE_BLUEPRINT_ALLOW_FALLBACK;
  return envValue === "1" || String(envValue || "").toLowerCase() === "true";
}

function buildNoFallbackResult({ levelId, strategyId, contractId, status, verification }) {
  return {
    templateId: DEFAULT_BLUEPRINT_TEMPLATE_ID,
    cards: [
      {
        id: `${levelId}-c1`,
        text: `return unresolved(${status})`,
        correctSlot: "return",
        correctOrder: 0,
        key: `strategy-error-${status}`,
        hint: "Return",
      },
    ],
    snippetName: "strategy enforcement",
    source: "strategy-error",
    strategyId: strategyId || null,
    contractId,
    irDiagnostics: null,
    verification: {
      ...verification,
      status,
    },
  };
}

function buildFallbackOrError({
  allowFallback,
  fallback,
  levelId,
  strategyId,
  contractId,
  status,
  verification,
}) {
  if (allowFallback) {
    const fallbackResult = normalizeFallbackResult(fallback?.());
    return {
      ...fallbackResult,
      source: "template-fallback",
      strategyId: strategyId || null,
      contractId,
      irDiagnostics: null,
      verification: {
        ...verification,
        status,
      },
    };
  }

  return buildNoFallbackResult({ levelId, strategyId, contractId, status, verification });
}

export function buildGeneratedSolutionForQuestion({ question, levelId, fallback, allowFallback }) {
  const fallbackEnabled = allowFallback === true || allowFallbackFromEnv();
  const contract = getQuestionContract(question);
  const strategy = selectBlueprintStrategy(contract);

  if (!strategy) {
    return buildFallbackOrError({
      allowFallback: fallbackEnabled,
      fallback,
      levelId,
      strategyId: null,
      contractId: contract.id,
      status: "missing-strategy",
      verification: {
        passed: false,
        confidence: "low",
        total: 0,
        failedCount: 0,
        deterministic: { passed: 0, total: 0 },
        random: { passed: 0, total: 0 },
        failures: [],
      },
    });
  }

  const plan = strategy.buildPlan(contract, question);
  const verification = verifySolutionPlan({ contract, plan });
  if (!verification.passed) {
    return buildFallbackOrError({
      allowFallback: fallbackEnabled,
      fallback,
      levelId,
      strategyId: strategy.id,
      contractId: contract.id,
      status: "failed-semantic-gate",
      verification,
    });
  }

  const cards = buildCardsFromIr({
    levelId,
    templateId: plan.templateId,
    irNodes: plan.ir,
  });

  if (!cards.length) {
    return buildFallbackOrError({
      allowFallback: fallbackEnabled,
      fallback,
      levelId,
      strategyId: strategy.id,
      contractId: contract.id,
      status: "empty-ir-fallback",
      verification,
    });
  }

  return {
    templateId: plan.templateId,
    cards,
    snippetName: plan.snippetName || strategy.name,
    source: "strategy",
    strategyId: strategy.id,
    contractId: contract.id,
    irDiagnostics: plan.irDiagnostics || null,
    verification: {
      ...verification,
      status: "passed-semantic-gate",
    },
  };
}

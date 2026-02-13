import { createVerifierRandom } from "./strategyRegistry";

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function makeFailure(kind, details) {
  return { kind, ...details };
}

function includesForbiddenToken(source, token) {
  return token && source.includes(token);
}

function computeConfidence(total, failedCount) {
  if (total <= 0) return "low";
  if (failedCount > 0) return "low";
  if (total >= 120) return "high";
  if (total >= 40) return "medium";
  return "low";
}

function defaultAssertCase({ got, expected, normalizeResult }) {
  if (typeof normalizeResult === "function") {
    return deepEqual(normalizeResult(got), normalizeResult(expected));
  }
  return deepEqual(got, expected);
}

export function verifySolutionPlan({ contract, plan }) {
  const failures = [];
  const deterministicCases = Array.isArray(plan?.deterministicCases) ? plan.deterministicCases : [];
  const randomTrials = Math.max(0, Number(plan?.randomTrials || 0));
  const assertCase = typeof plan?.assertCase === "function" ? plan.assertCase : defaultAssertCase;
  const normalizeResult = typeof plan?.normalizeResult === "function" ? plan.normalizeResult : null;

  const solve = plan?.solve;
  if (typeof solve !== "function") {
    return {
      passed: false,
      confidence: "low",
      deterministic: { passed: 0, total: deterministicCases.length },
      random: { passed: 0, total: randomTrials },
      total: deterministicCases.length + randomTrials,
      failedCount: 1,
      failures: [makeFailure("invalid_plan", { message: "solve function is required" })],
    };
  }

  const forbidden = contract?.constraints?.disallowTokens || [];
  if (forbidden.length > 0) {
    const source = Function.prototype.toString.call(solve);
    for (const token of forbidden) {
      if (includesForbiddenToken(source, token)) {
        failures.push(makeFailure("constraint_violation", { token }));
      }
    }
  }

  let deterministicPassed = 0;
  for (const testCase of deterministicCases) {
    const input = testCase?.input || {};
    const expected = testCase?.expected;
    let got;
    try {
      got = solve(input);
    } catch (error) {
      failures.push(
        makeFailure("deterministic_exception", {
          input,
          message: error instanceof Error ? error.message : String(error),
        })
      );
      continue;
    }

    const passed = !!assertCase({
      mode: "deterministic",
      input,
      got,
      expected,
      normalizeResult,
    });

    if (passed) deterministicPassed += 1;
    else {
      failures.push(makeFailure("deterministic_mismatch", { input, expected, got }));
    }
  }

  let randomPassed = 0;
  if (randomTrials > 0) {
    if (typeof plan?.randomCaseFactory !== "function" || typeof plan?.randomOracle !== "function") {
      failures.push(
        makeFailure("random_config_missing", {
          hasFactory: typeof plan?.randomCaseFactory === "function",
          hasOracle: typeof plan?.randomOracle === "function",
        })
      );
    } else {
      const random = createVerifierRandom(0xdeadbeef);
      for (let i = 0; i < randomTrials; i += 1) {
        const input = plan.randomCaseFactory(random);
        let expected;
        let got;

        try {
          expected = plan.randomOracle(input);
        } catch (error) {
          failures.push(
            makeFailure("random_oracle_exception", {
              input,
              index: i,
              message: error instanceof Error ? error.message : String(error),
            })
          );
          continue;
        }

        try {
          got = solve(input);
        } catch (error) {
          failures.push(
            makeFailure("random_exception", {
              input,
              index: i,
              message: error instanceof Error ? error.message : String(error),
            })
          );
          continue;
        }

        const passed = !!assertCase({
          mode: "random",
          input,
          got,
          expected,
          normalizeResult,
        });

        if (passed) randomPassed += 1;
        else {
          failures.push(
            makeFailure("random_mismatch", {
              input,
              expected,
              got,
              index: i,
            })
          );
        }
      }
    }
  }

  const total = deterministicCases.length + randomTrials;
  const failedCount = failures.length;
  const passed = failedCount === 0 && deterministicPassed === deterministicCases.length && randomPassed === randomTrials;

  return {
    passed,
    confidence: computeConfidence(total, failedCount),
    deterministic: { passed: deterministicPassed, total: deterministicCases.length },
    random: { passed: randomPassed, total: randomTrials },
    total,
    failedCount,
    failures: failures.slice(0, 8),
  };
}

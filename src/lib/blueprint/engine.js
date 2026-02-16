import { analyzeCardDependencies, collectExternalIdentifiersFromTests } from "./dependencyHints";
import { compareByOutputMode } from "./strategies/comparators";
import { TEMPLATE_CANONICAL_SLOT_ROLE_MAP } from "./templates";

function getCardKeys(slots, slotName) {
  return (slots[slotName] || []).map((card) => card.key);
}

function executeLevel1(slots, { nums, k }) {
  const trace = [];
  const state = {};

  for (const card of slots.setup || []) {
    if (card.key === "init-left") state.left = 0;
    else if (card.key === "init-sum") state.windowSum = 0;
    else if (card.key === "init-max") state.maxSum = -Infinity;
    else if (card.key === "init-right-end") state.right = nums.length - 1;

    trace.push({
      phase: "setup",
      card: card.text,
      state: { ...state },
      arr: nums,
      pointers: { left: state.left, right: state.right },
    });
  }

  const loopCard = (slots.loop || [])[0];
  if (!loopCard || loopCard.key !== "for-right") {
    trace.push({ phase: "error", card: "Missing or wrong loop", state: { ...state }, arr: nums });
    return { result: undefined, trace, error: "No valid loop card" };
  }

  for (let right = 0; right < nums.length; right++) {
    state.right = right;

    for (const card of slots.update || []) {
      if (card.key === "add-right") state.windowSum = (state.windowSum || 0) + nums[right];
      else if (card.key === "sub-right") state.windowSum = (state.windowSum || 0) - nums[right];

      trace.push({
        phase: "update",
        card: card.text,
        state: { ...state },
        arr: nums,
        pointers: { left: state.left, right },
        iteration: right,
      });
    }

    for (const card of slots.check || []) {
      if (card.key === "shrink") {
        if (right - (state.left || 0) + 1 > k) {
          state.windowSum = (state.windowSum || 0) - nums[state.left || 0];
          state.left = (state.left || 0) + 1;
        }
      } else if (card.key === "update-max") {
        if (right - (state.left || 0) + 1 === k) {
          state.maxSum = Math.max(state.maxSum === undefined ? -Infinity : state.maxSum, state.windowSum || 0);
        }
      }

      trace.push({
        phase: "check",
        card: card.text,
        state: { ...state },
        arr: nums,
        pointers: { left: state.left, right },
        iteration: right,
      });
    }
  }

  const retCard = (slots.return || [])[0];
  let result;
  if (retCard?.key === "ret-max") result = state.maxSum;
  else if (retCard?.key === "ret-sum") result = state.windowSum;

  trace.push({ phase: "return", card: retCard?.text || "", state: { ...state }, result });
  return { result, trace };
}

function executeLevel2(slots, { s: str }) {
  const trace = [];
  const state = {};

  for (const card of slots.setup || []) {
    if (card.key === "init-left") state.left = 0;
    else if (card.key === "init-maxlen") state.maxLen = 0;
    else if (card.key === "init-maxlen-wrong") state.maxLen = -Infinity;
    else if (card.key === "init-seen") state.seen = new Set();

    trace.push({
      phase: "setup",
      card: card.text,
      state: { ...state, seen: state.seen ? `{${[...state.seen].join(",")}}` : undefined },
      arr: [...str],
    });
  }

  const loopCard = (slots.loop || [])[0];
  if (!loopCard || loopCard.key !== "for-right") {
    return { result: undefined, trace, error: "No valid loop" };
  }

  if (!state.seen) state.seen = new Set();

  for (let right = 0; right < str.length; right++) {
    state.right = right;

    for (const card of slots.update || []) {
      if (card.key === "shrink-dup") {
        let safety = 0;
        while (state.seen.has(str[right]) && safety < str.length) {
          state.seen.delete(str[state.left || 0]);
          state.left = (state.left || 0) + 1;
          safety++;
        }
      } else if (card.key === "add-seen") {
        state.seen.add(str[right]);
      } else if (card.key === "remove-right") {
        state.seen.delete(str[right]);
      }

      trace.push({
        phase: "update",
        card: card.text,
        state: { ...state, seen: `{${[...state.seen].join(",")}}` },
        arr: [...str],
        pointers: { left: state.left, right },
        iteration: right,
      });
    }

    for (const card of slots.check || []) {
      if (card.key === "update-maxlen") {
        state.maxLen = Math.max(state.maxLen || 0, right - (state.left || 0) + 1);
      } else if (card.key === "maxlen-off1") {
        state.maxLen = Math.max(state.maxLen || 0, right - (state.left || 0));
      }

      trace.push({
        phase: "check",
        card: card.text,
        state: { ...state, seen: `{${[...state.seen].join(",")}}` },
        arr: [...str],
        pointers: { left: state.left, right },
        iteration: right,
      });
    }
  }

  const retCard = (slots.return || [])[0];
  const result = retCard?.key === "ret-maxlen" ? state.maxLen : undefined;
  trace.push({ phase: "return", card: retCard?.text || "", state: { ...state, seen: `{${[...state.seen].join(",")}}` }, result });
  return { result, trace };
}

function executeLevel3(slots, { nums, target }) {
  const trace = [];
  const state = {};

  for (const card of slots.setup || []) {
    if (card.key === "init-left") state.left = 0;
    else if (card.key === "init-left-1") state.left = 1;
    else if (card.key === "init-right-end") state.right = nums.length - 1;

    trace.push({
      phase: "setup",
      card: card.text,
      state: { ...state },
      arr: nums,
      pointers: { left: state.left, right: state.right },
    });
  }

  const loopCard = (slots.loop || [])[0];
  if (!loopCard) return { result: undefined, trace, error: "No loop" };

  const condFn =
    loopCard.key === "while-lt"
      ? () => (state.left || 0) < (state.right ?? nums.length - 1)
      : loopCard.key === "while-lte"
        ? () => (state.left || 0) <= (state.right ?? nums.length - 1)
        : null;

  if (!condFn) return { result: undefined, trace, error: "Invalid loop" };

  let iterations = 0;
  while (condFn() && iterations < 500) {
    iterations++;

    for (const card of slots.update || []) {
      if (card.key === "calc-sum") {
        state.sum = nums[state.left || 0] + nums[state.right ?? nums.length - 1];
      }
      trace.push({
        phase: "update",
        card: card.text,
        state: { ...state },
        arr: nums,
        pointers: { left: state.left, right: state.right },
        iteration: iterations - 1,
      });
    }

    let earlyReturn = null;
    for (const card of slots.check || []) {
      if (card.key === "found") {
        if (state.sum === target) earlyReturn = [state.left || 0, state.right ?? 0];
      } else if (card.key === "move-left") {
        if ((state.sum || 0) < target) state.left = (state.left || 0) + 1;
      } else if (card.key === "move-right") {
        if ((state.sum || 0) > target) state.right = (state.right ?? nums.length - 1) - 1;
      } else if (card.key === "move-right-wrong") {
        if ((state.sum || 0) < target) state.right = (state.right ?? nums.length - 1) - 1;
      }

      trace.push({
        phase: "check",
        card: card.text,
        state: { ...state },
        arr: nums,
        pointers: { left: state.left, right: state.right },
        iteration: iterations - 1,
      });
    }

    if (earlyReturn) {
      trace.push({ phase: "return", card: "early return", state: { ...state }, result: earlyReturn });
      return { result: earlyReturn, trace };
    }
  }

  const retCard = (slots.return || [])[0];
  const result = retCard?.key === "ret-notfound" ? [-1, -1] : undefined;
  trace.push({ phase: "return", card: retCard?.text || "", state: { ...state }, result });
  return { result, trace };
}

const EXECUTORS = {
  1: executeLevel1,
  2: executeLevel2,
  3: executeLevel3,
};

const KNOWN_VALID_SIGNATURES = new Map();
const ADAPTIVE_VALIDATION_MODE = new Map();

function levelCacheId(level) {
  return String(level?.id || "");
}

function rememberKnownValidOrdering(levelId, signature) {
  if (!KNOWN_VALID_SIGNATURES.has(levelId)) KNOWN_VALID_SIGNATURES.set(levelId, new Set());
  KNOWN_VALID_SIGNATURES.get(levelId).add(signature);
}

function hasKnownValidOrdering(levelId, signature) {
  return KNOWN_VALID_SIGNATURES.get(levelId)?.has(signature) || false;
}

function getSignatureFromSlots(level, slots) {
  return (level.slots || [])
    .map((slotId) => {
      const keys = (slots[slotId] || []).map((card) => card.key).join(">");
      return `${slotId}:${keys}`;
    })
    .join("|");
}

function getMembershipSignatureFromSlots(level, slots) {
  return (level.slots || [])
    .map((slotId) => {
      const keys = (slots[slotId] || [])
        .map((card) => String(card?.key || ""))
        .filter(Boolean)
        .sort()
        .join(">");
      return `${slotId}:${keys}`;
    })
    .join("|");
}

function getCanonicalSlots(level) {
  const canonical = {};
  for (const slotId of level.slots || []) canonical[slotId] = [];

  const cards = (level.cards || []).filter((card) => card.correctSlot);
  for (const card of cards) {
    canonical[card.correctSlot].push(card);
  }

  for (const slotId of level.slots || []) {
    canonical[slotId].sort((a, b) => (a.correctOrder || 0) - (b.correctOrder || 0));
  }
  return canonical;
}

function executeAssemblyLevel(level, slots, { useMembershipSignature = false } = {}) {
  const trace = [];

  for (const slotId of level.slots || []) {
    for (const [idx, card] of (slots[slotId] || []).entries()) {
      trace.push({
        phase: slotId,
        card: card.text,
        state: {
          slot: slotId,
          order: idx,
          key: card.key,
        },
      });
    }
  }

  const result = useMembershipSignature
    ? getMembershipSignatureFromSlots(level, slots)
    : getSignatureFromSlots(level, slots);
  trace.push({ phase: "return", card: "assembly complete", state: {}, result });
  return { result, trace };
}

function mapToCanonicalSlots(level, slots) {
  const canonicalSlots = {};
  const roleMap = TEMPLATE_CANONICAL_SLOT_ROLE_MAP[level.templateId] || {};
  const reverseRoleMap = Object.fromEntries(Object.entries(roleMap).map(([canonical, slotId]) => [slotId, canonical]));

  for (const [slotId, cards] of Object.entries(slots || {})) {
    const canonicalSlot = reverseRoleMap[slotId] || slotId;
    if (!canonicalSlots[canonicalSlot]) canonicalSlots[canonicalSlot] = [];
    canonicalSlots[canonicalSlot].push(...cards);
  }

  return canonicalSlots;
}

function normalizeStatement(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return "";
  if (/[;{}]$/.test(trimmed)) return trimmed;
  return `${trimmed};`;
}

function renderLoopBlock(loopText, bodyStatements) {
  const loopLine = String(loopText || "").trim().replace(/;$/, "");
  if (!loopLine) return "";
  if (!/^(for|while)\b/.test(loopLine)) return normalizeStatement(loopLine);
  if (!bodyStatements.length) return `${loopLine} {}`;
  const body = bodyStatements.map((line) => `  ${line}`).join("\n");
  return `${loopLine} {\n${body}\n}`;
}

function composeStandardProgram(level, slots) {
  const canonical = mapToCanonicalSlots(level, slots);
  const hasStandardFamily =
    Array.isArray(canonical.setup) &&
    Array.isArray(canonical.loop) &&
    Array.isArray(canonical.check) &&
    Array.isArray(canonical.update) &&
    Array.isArray(canonical.return);

  if (!hasStandardFamily) {
    return {
      source: "",
      trace: [],
      error: "This template family does not support composed execution.",
    };
  }

  const setupStatements = canonical.setup.map((card) => normalizeStatement(card.text)).filter(Boolean);
  const loopStatements = canonical.loop.map((card) => String(card?.text || "").trim()).filter(Boolean);
  const bodyStatements = [...canonical.check, ...canonical.update].map((card) => normalizeStatement(card.text)).filter(Boolean);
  const returnStatements = canonical.return.map((card) => normalizeStatement(card.text)).filter(Boolean);

  const sourceLines = [...setupStatements];
  if (loopStatements.length > 0) {
    for (const loopText of loopStatements) {
      const rendered = renderLoopBlock(loopText, bodyStatements);
      if (rendered) sourceLines.push(rendered);
    }
  } else {
    sourceLines.push(...bodyStatements);
  }
  sourceLines.push(...returnStatements);

  if (!sourceLines.length) {
    return {
      source: "",
      trace: [],
      error: "No executable card statements were composed.",
    };
  }

  const trace = [];
  for (const slotId of level.slots || []) {
    for (const [idx, card] of (slots[slotId] || []).entries()) {
      trace.push({
        phase: slotId,
        card: card.text,
        state: {
          slot: slotId,
          order: idx,
          key: card.key,
        },
      });
    }
  }

  return { source: sourceLines.join("\n"), trace, error: null };
}

function executeComposedJsLevel(level, slots, input) {
  const composed = composeStandardProgram(level, slots);
  if (composed.error) return { result: undefined, trace: composed.trace, error: composed.error };

  const wrappedSource = [
    "const isAlphaNum = (ch) => /[A-Za-z0-9]/.test(String(ch || ''));",
    "const __input = input || {};",
    "with (__input) {",
    composed.source,
    "}",
  ].join("\n");

  let runner;
  try {
    runner = new Function("input", wrappedSource);
  } catch (error) {
    return {
      result: undefined,
      trace: composed.trace,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  try {
    const result = runner(input || {});
    const trace = [...composed.trace, { phase: "return", card: "composed execution", state: {}, result }];
    return { result, trace };
  } catch (error) {
    return {
      result: undefined,
      trace: composed.trace,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function runLevelExecutor(level, slots, input, mode = "default") {
  if (mode === "composed-js") {
    return executeComposedJsLevel(level, slots, input);
  }

  const executor = EXECUTORS[level.id];
  if (typeof executor === "function") {
    return executor(mapToCanonicalSlots(level, slots), input);
  }
  return executeAssemblyLevel(level, slots);
}

function compareTestOutput(level, testCase, input, got, expected) {
  const outputMode = testCase?.outputMode || level?.testOutputMode || "normalized";
  return compareByOutputMode({
    mode: outputMode,
    input,
    got,
    expected,
  });
}

function runStructuralValidation(level, slots) {
  const expectedSignature = getMembershipSignatureFromSlots(level, getCanonicalSlots(level));
  const gotSignature = getMembershipSignatureFromSlots(level, slots);
  const assembly = executeAssemblyLevel(level, slots, { useMembershipSignature: true });

  const externalIdentifiers = collectExternalIdentifiersFromTests(level.testCases || []);
  const dependencyAnalysis = analyzeCardDependencies({
    slotIds: level.slots || [],
    slots,
    externalIdentifiers,
  });
  const dependencyIssues = Object.values(dependencyAnalysis.byCardId || {})
    .filter((entry) => Array.isArray(entry?.missing) && entry.missing.length > 0)
    .map((entry) => ({
      cardId: entry.cardId,
      slotId: entry.slotId,
      missing: [...entry.missing],
    }));

  const passed = expectedSignature === gotSignature;

  return {
    input: { mode: "structural" },
    expected: { signature: expectedSignature, dependencies: [] },
    got: { signature: gotSignature, dependencies: dependencyIssues },
    passed,
    trace: assembly.trace,
    error: passed ? null : "Placement signature mismatch.",
  };
}

function resolveAdaptiveValidationMode(level) {
  const levelId = levelCacheId(level);
  if (ADAPTIVE_VALIDATION_MODE.has(levelId)) return ADAPTIVE_VALIDATION_MODE.get(levelId);

  const tests = Array.isArray(level.testCases) ? level.testCases : [];
  if (!tests.length) {
    ADAPTIVE_VALIDATION_MODE.set(levelId, "structural");
    return "structural";
  }

  const canonicalSlots = getCanonicalSlots(level);
  const canExecute = tests.every((testCase) => {
    const input = testCase?.input || {};
    const expected = testCase?.expected;
    const execution = runLevelExecutor(level, canonicalSlots, input, "composed-js");
    if (execution.error) return false;
    return compareTestOutput(level, testCase, input, execution.result, expected);
  });

  const mode = canExecute ? "composed-js" : "structural";
  ADAPTIVE_VALIDATION_MODE.set(levelId, mode);
  return mode;
}

function resolveValidationMode(level) {
  const explicitMode = String(level?.validationMode || "").toLowerCase();
  if (explicitMode === "adaptive") return resolveAdaptiveValidationMode(level);
  if (explicitMode === "composed-js") return "composed-js";
  if (explicitMode === "structural") return "structural";
  return "default";
}

export function runAllTests(level, slots) {
  const mode = resolveValidationMode(level);
  const strictSignature = getSignatureFromSlots(level, slots);
  const orderingCacheKey = `${mode}:${strictSignature}`;
  const levelId = levelCacheId(level);

  if (hasKnownValidOrdering(levelId, orderingCacheKey)) {
    if (mode === "structural") {
      const result = runStructuralValidation(level, slots);
      return [{ ...result, passed: true, got: result.expected, error: null, cached: true }];
    }

    const defaultCase = {
      input: {},
      expected: getSignatureFromSlots(level, getCanonicalSlots(level)),
    };
    const tests = Array.isArray(level.testCases) && level.testCases.length > 0 ? level.testCases : [defaultCase];
    const firstInput = tests[0]?.input || defaultCase.input;
    const firstRun = runLevelExecutor(level, slots, firstInput, mode);

    return tests.map((testCase, index) => {
      const input = testCase?.input || defaultCase.input;
      const expected = testCase?.expected === undefined ? defaultCase.expected : testCase.expected;
      return {
        input,
        expected,
        got: expected,
        passed: true,
        trace: index === 0 ? firstRun.trace : [],
        error: null,
        cached: true,
      };
    });
  }

  if (mode === "structural") {
    const result = runStructuralValidation(level, slots);
    if (result.passed) rememberKnownValidOrdering(levelId, orderingCacheKey);
    return [result];
  }

  const defaultCase = {
    input: {},
    expected: getSignatureFromSlots(level, getCanonicalSlots(level)),
  };
  const tests = Array.isArray(level.testCases) && level.testCases.length > 0 ? level.testCases : [defaultCase];

  const results = tests.map((testCase) => {
    const input = testCase?.input || defaultCase.input;
    const expected = testCase?.expected === undefined ? defaultCase.expected : testCase.expected;
    const { result, trace, error } = runLevelExecutor(level, slots, input, mode);
    const passed = compareTestOutput(level, testCase, input, result, expected);
    return { input, expected, got: result, passed, trace, error };
  });

  if (results.every((result) => result.passed)) {
    rememberKnownValidOrdering(levelId, orderingCacheKey);
  }

  return results;
}

export function getCorrectTrace(level) {
  const correctSlots = {};
  for (const slotId of level.slots) {
    correctSlots[slotId] = [];
  }

  const correctCards = level.cards
    .filter((card) => card.correctSlot)
    .sort((a, b) => (a.correctOrder || 0) - (b.correctOrder || 0));

  for (const card of correctCards) {
    correctSlots[card.correctSlot].push(card);
  }

  const firstInput = level.testCases?.[0]?.input || {};
  const mode = resolveValidationMode(level);
  if (mode === "structural") return executeAssemblyLevel(level, correctSlots, { useMembershipSignature: true });
  return runLevelExecutor(level, correctSlots, firstInput, mode);
}

export function findDivergence(playerTrace, correctTrace) {
  for (let i = 0; i < Math.min(playerTrace.length, correctTrace.length); i++) {
    const player = playerTrace[i];
    const correct = correctTrace[i];
    if (player.phase !== correct.phase || JSON.stringify(player.state) !== JSON.stringify(correct.state)) {
      return { step: i, player, correct };
    }
  }

  if (playerTrace.length !== correctTrace.length) {
    return {
      step: Math.min(playerTrace.length, correctTrace.length),
      player: playerTrace[playerTrace.length - 1],
      correct: correctTrace[correctTrace.length - 1],
    };
  }
  return null;
}

export function getCardKeysBySlot(slots, slotName) {
  return getCardKeys(slots, slotName);
}

export function clearValidationCaches() {
  KNOWN_VALID_SIGNATURES.clear();
  ADAPTIVE_VALIDATION_MODE.clear();
}

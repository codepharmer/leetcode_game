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

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function getSignatureFromSlots(level, slots) {
  return (level.slots || [])
    .map((slotId) => {
      const keys = (slots[slotId] || []).map((card) => card.key).join(">");
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

function executeAssemblyLevel(level, slots) {
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

  const result = getSignatureFromSlots(level, slots);
  trace.push({ phase: "return", card: "assembly complete", state: {}, result });
  return { result, trace };
}

function runLevelExecutor(level, slots, input) {
  const executor = EXECUTORS[level.id];
  if (typeof executor === "function") return executor(slots, input);
  return executeAssemblyLevel(level, slots);
}

export function runAllTests(level, slots) {
  const defaultCase = {
    input: {},
    expected: getSignatureFromSlots(level, getCanonicalSlots(level)),
  };
  const tests = Array.isArray(level.testCases) && level.testCases.length > 0 ? level.testCases : [defaultCase];

  return tests.map((testCase) => {
    const input = testCase?.input || defaultCase.input;
    const expected = testCase?.expected === undefined ? defaultCase.expected : testCase.expected;
    const { result, trace, error } = runLevelExecutor(level, slots, input);
    const passed = deepEqual(result, expected);
    return { input, expected, got: result, passed, trace, error };
  });
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
  return runLevelExecutor(level, correctSlots, firstInput);
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

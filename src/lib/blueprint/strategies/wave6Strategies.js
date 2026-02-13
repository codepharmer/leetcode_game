import { DP_STATE_TEMPLATE_ID, INTERVAL_GREEDY_TEMPLATE_ID } from "../templates";
import { buildProblemIr } from "./problemIr";
import { createStrategiesFromProblemSpecs, makeProblemSpec } from "./problemStrategyBuilder";

function upperBound(sorted, value) {
  let left = 0;
  let right = sorted.length;
  while (left < right) {
    const mid = (left + right) >> 1;
    if (sorted[mid] <= value) left = mid + 1;
    else right = mid;
  }
  return left;
}

function solveQ76(input) {
  const intervals = Array.isArray(input?.intervals) ? input.intervals.map((entry) => [...entry]) : [];
  if (!intervals.length) return 0;
  intervals.sort((a, b) => a[1] - b[1]);
  let end = -Infinity;
  let removed = 0;
  for (const [start, finish] of intervals) {
    if (start >= end) end = finish;
    else removed += 1;
  }
  return removed;
}

function solveQ77(input) {
  const intervals = Array.isArray(input?.intervals) ? input.intervals.map((entry) => [...entry]) : [];
  intervals.sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < intervals.length; i += 1) {
    if (intervals[i][0] < intervals[i - 1][1]) return false;
  }
  return true;
}

function solveQ78(input) {
  const intervals = Array.isArray(input?.intervals) ? input.intervals.map((entry) => [...entry]) : [];
  intervals.sort((a, b) => a[0] - b[0]);
  const ends = [];
  let best = 0;
  for (const [start, end] of intervals) {
    while (ends.length && ends[0] <= start) ends.shift();
    const idx = upperBound(ends, end);
    ends.splice(idx, 0, end);
    best = Math.max(best, ends.length);
  }
  return best;
}

function solveQ79(input) {
  const nums = Array.isArray(input?.nums) ? input.nums : [];
  if (!nums.length) return 0;
  let best = nums[0];
  let current = nums[0];
  for (let i = 1; i < nums.length; i += 1) {
    current = Math.max(nums[i], current + nums[i]);
    best = Math.max(best, current);
  }
  return best;
}

function solveQ80(input) {
  let n = Number(input?.n || 0) >>> 0;
  let count = 0;
  while (n !== 0) {
    n &= n - 1;
    count += 1;
  }
  return count;
}

function solveQ81(input) {
  const n = Number(input?.n || 0);
  const out = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i += 1) {
    out[i] = out[i >> 1] + (i & 1);
  }
  return out;
}

function solveQ82(input) {
  let n = Number(input?.n || 0) >>> 0;
  let out = 0;
  for (let i = 0; i < 32; i += 1) {
    out = (out << 1) | (n & 1);
    n >>>= 1;
  }
  return out >>> 0;
}

function solveQ83(input) {
  const nums = Array.isArray(input?.nums) ? input.nums : [];
  let missing = nums.length;
  for (let i = 0; i < nums.length; i += 1) {
    missing ^= i ^ nums[i];
  }
  return missing;
}

function solveQ84(input) {
  let a = Number(input?.a || 0);
  let b = Number(input?.b || 0);
  while (b !== 0) {
    const carry = (a & b) << 1;
    a ^= b;
    b = carry;
  }
  return a;
}

function solveQ85(input) {
  const matrix = Array.isArray(input?.matrix) ? input.matrix.map((row) => [...row]) : [];
  const n = matrix.length;
  for (let layer = 0; layer < Math.floor(n / 2); layer += 1) {
    const first = layer;
    const last = n - 1 - layer;
    for (let i = first; i < last; i += 1) {
      const offset = i - first;
      const top = matrix[first][i];
      matrix[first][i] = matrix[last - offset][first];
      matrix[last - offset][first] = matrix[last][last - offset];
      matrix[last][last - offset] = matrix[i][last];
      matrix[i][last] = top;
    }
  }
  return matrix;
}

function solveQ86(input) {
  const matrix = Array.isArray(input?.matrix) ? input.matrix : [];
  if (!matrix.length || !matrix[0]?.length) return [];
  let top = 0;
  let bottom = matrix.length - 1;
  let left = 0;
  let right = matrix[0].length - 1;
  const out = [];

  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c += 1) out.push(matrix[top][c]);
    top += 1;
    for (let r = top; r <= bottom; r += 1) out.push(matrix[r][right]);
    right -= 1;
    if (top <= bottom) {
      for (let c = right; c >= left; c -= 1) out.push(matrix[bottom][c]);
      bottom -= 1;
    }
    if (left <= right) {
      for (let r = bottom; r >= top; r -= 1) out.push(matrix[r][left]);
      left += 1;
    }
  }

  return out;
}

function solveQ87(input) {
  const matrix = Array.isArray(input?.matrix) ? input.matrix.map((row) => [...row]) : [];
  if (!matrix.length || !matrix[0]?.length) return matrix;
  const rows = matrix.length;
  const cols = matrix[0].length;
  const zeroRows = new Set();
  const zeroCols = new Set();

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (matrix[r][c] !== 0) continue;
      zeroRows.add(r);
      zeroCols.add(c);
    }
  }

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (zeroRows.has(r) || zeroCols.has(c)) matrix[r][c] = 0;
    }
  }
  return matrix;
}

export const WAVE_6_PROBLEM_SPECS = [
  makeProblemSpec({
    questionId: 76,
    questionName: "Non-overlapping Intervals",
    strategyId: "q-76-problem-specific",
    templateId: INTERVAL_GREEDY_TEMPLATE_ID,
    complexity: { time: "O(n log n)", space: "O(1)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ intervals: [[1, 2], [2, 3], [3, 4], [1, 3]] }, { intervals: [[1, 2], [1, 2], [1, 2]] }],
    randomTrials: 50,
    solve: solveQ76,
    snippetName: "Non-overlapping Intervals | End-time greedy removals",
  }),
  makeProblemSpec({
    questionId: 77,
    questionName: "Meeting Rooms",
    strategyId: "q-77-problem-specific",
    templateId: INTERVAL_GREEDY_TEMPLATE_ID,
    complexity: { time: "O(n log n)", space: "O(1)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ intervals: [[0, 30], [5, 10], [15, 20]] }, { intervals: [[7, 10], [2, 4]] }],
    randomTrials: 40,
    solve: solveQ77,
    snippetName: "Meeting Rooms | Sorted overlap check",
  }),
  makeProblemSpec({
    questionId: 78,
    questionName: "Meeting Rooms II",
    strategyId: "q-78-problem-specific",
    templateId: INTERVAL_GREEDY_TEMPLATE_ID,
    complexity: { time: "O(n log n)", space: "O(n)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ intervals: [[0, 30], [5, 10], [15, 20]] }, { intervals: [[7, 10], [2, 4]] }],
    randomTrials: 50,
    solve: solveQ78,
    snippetName: "Meeting Rooms II | Sweep starts with min-end structure",
  }),
  makeProblemSpec({
    questionId: 79,
    questionName: "Maximum Subarray",
    strategyId: "q-79-problem-specific",
    templateId: INTERVAL_GREEDY_TEMPLATE_ID,
    complexity: { time: "O(n)", space: "O(1)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ nums: [-2, 1, -3, 4, -1, 2, 1, -5, 4] }, { nums: [1] }],
    randomTrials: 50,
    solve: solveQ79,
    snippetName: "Maximum Subarray | Kadane rolling best",
  }),
  makeProblemSpec({
    questionId: 80,
    questionName: "Number of 1 Bits",
    strategyId: "q-80-problem-specific",
    templateId: DP_STATE_TEMPLATE_ID,
    complexity: { time: "O(bits)", space: "O(1)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ n: 11 }, { n: 128 }],
    randomTrials: 40,
    solve: solveQ80,
    snippetName: "Number of 1 Bits | Brian Kernighan bit-count",
  }),
  makeProblemSpec({
    questionId: 81,
    questionName: "Counting Bits",
    strategyId: "q-81-problem-specific",
    templateId: DP_STATE_TEMPLATE_ID,
    complexity: { time: "O(n)", space: "O(n)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ n: 2 }, { n: 5 }],
    randomTrials: 40,
    solve: solveQ81,
    snippetName: "Counting Bits | DP with i>>1 transition",
  }),
  makeProblemSpec({
    questionId: 82,
    questionName: "Reverse Bits",
    strategyId: "q-82-problem-specific",
    templateId: DP_STATE_TEMPLATE_ID,
    complexity: { time: "O(32)", space: "O(1)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ n: 43261596 }, { n: 0 }],
    randomTrials: 40,
    solve: solveQ82,
    snippetName: "Reverse Bits | Fixed-width bit shifts",
  }),
  makeProblemSpec({
    questionId: 83,
    questionName: "Missing Number",
    strategyId: "q-83-problem-specific",
    templateId: DP_STATE_TEMPLATE_ID,
    complexity: { time: "O(n)", space: "O(1)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ nums: [3, 0, 1] }, { nums: [0, 1] }],
    randomTrials: 40,
    solve: solveQ83,
    snippetName: "Missing Number | XOR cancellation",
  }),
  makeProblemSpec({
    questionId: 84,
    questionName: "Sum of Two Integers",
    strategyId: "q-84-problem-specific",
    templateId: DP_STATE_TEMPLATE_ID,
    complexity: { time: "O(bits)", space: "O(1)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ a: 1, b: 2 }, { a: -2, b: 3 }],
    randomTrials: 50,
    solve: solveQ84,
    snippetName: "Sum of Two Integers | Bitwise carry propagation",
  }),
  makeProblemSpec({
    questionId: 85,
    questionName: "Rotate Image",
    strategyId: "q-85-problem-specific",
    templateId: DP_STATE_TEMPLATE_ID,
    complexity: { time: "O(n^2)", space: "O(1) extra" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] }, { matrix: [[5, 1, 9, 11], [2, 4, 8, 10], [13, 3, 6, 7], [15, 14, 12, 16]] }],
    randomTrials: 50,
    solve: solveQ85,
    snippetName: "Rotate Image | Layer four-way swaps",
  }),
  makeProblemSpec({
    questionId: 86,
    questionName: "Spiral Matrix",
    strategyId: "q-86-problem-specific",
    templateId: DP_STATE_TEMPLATE_ID,
    complexity: { time: "O(m*n)", space: "O(1) extra" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] }, { matrix: [[1, 2, 3, 4]] }],
    randomTrials: 50,
    solve: solveQ86,
    snippetName: "Spiral Matrix | Boundary peel traversal",
  }),
  makeProblemSpec({
    questionId: 87,
    questionName: "Set Matrix Zeroes",
    strategyId: "q-87-problem-specific",
    templateId: DP_STATE_TEMPLATE_ID,
    complexity: { time: "O(m*n)", space: "O(m+n)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ matrix: [[1, 1, 1], [1, 0, 1], [1, 1, 1]] }, { matrix: [[0, 1, 2, 0], [3, 4, 5, 2], [1, 3, 1, 5]] }],
    randomTrials: 50,
    solve: solveQ87,
    snippetName: "Set Matrix Zeroes | Mark rows/cols then write zeros",
  }),
].map((spec) => ({
  ...spec,
  ir: buildProblemIr(spec.templateId, spec.questionName),
}));

export function createWave6Strategies() {
  return createStrategiesFromProblemSpecs(WAVE_6_PROBLEM_SPECS);
}


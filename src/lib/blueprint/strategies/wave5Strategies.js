import { DP_STATE_TEMPLATE_ID, INTERVAL_GREEDY_TEMPLATE_ID } from "../templates";
import { buildProblemIr } from "./problemIr";
import { createStrategiesFromProblemSpecs, makeProblemSpec } from "./problemStrategyBuilder";

function solveQ62(input) {
  const n = Number(input?.n || 0);
  if (n <= 2) return Math.max(1, n);
  let a = 1;
  let b = 2;
  for (let i = 3; i <= n; i += 1) {
    const next = a + b;
    a = b;
    b = next;
  }
  return b;
}

function solveQ63(input) {
  const nums = Array.isArray(input?.nums) ? input.nums : [];
  let rob1 = 0;
  let rob2 = 0;
  for (const value of nums) {
    const next = Math.max(rob2, rob1 + value);
    rob1 = rob2;
    rob2 = next;
  }
  return rob2;
}

function solveQ64(input) {
  const nums = Array.isArray(input?.nums) ? input.nums : [];
  if (nums.length <= 1) return nums[0] || 0;
  function robRange(start, end) {
    let rob1 = 0;
    let rob2 = 0;
    for (let i = start; i <= end; i += 1) {
      const next = Math.max(rob2, rob1 + nums[i]);
      rob1 = rob2;
      rob2 = next;
    }
    return rob2;
  }
  return Math.max(robRange(0, nums.length - 2), robRange(1, nums.length - 1));
}

function solveQ65(input) {
  const s = String(input?.s || "");
  if (s.length < 2) return s;
  let bestStart = 0;
  let bestLen = 1;
  function expand(left, right) {
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      left -= 1;
      right += 1;
    }
    return [left + 1, right - left - 1];
  }
  for (let i = 0; i < s.length; i += 1) {
    const [s1, len1] = expand(i, i);
    if (len1 > bestLen) {
      bestStart = s1;
      bestLen = len1;
    }
    const [s2, len2] = expand(i, i + 1);
    if (len2 > bestLen) {
      bestStart = s2;
      bestLen = len2;
    }
  }
  return s.slice(bestStart, bestStart + bestLen);
}

function solveQ66(input) {
  const s = String(input?.s || "");
  let count = 0;
  function expand(left, right) {
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      count += 1;
      left -= 1;
      right += 1;
    }
  }
  for (let i = 0; i < s.length; i += 1) {
    expand(i, i);
    expand(i, i + 1);
  }
  return count;
}

function solveQ67(input) {
  const s = String(input?.s || "");
  if (!s || s[0] === "0") return 0;
  const dp = new Array(s.length + 1).fill(0);
  dp[0] = 1;
  dp[1] = 1;
  for (let i = 2; i <= s.length; i += 1) {
    const one = Number(s.slice(i - 1, i));
    const two = Number(s.slice(i - 2, i));
    if (one >= 1) dp[i] += dp[i - 1];
    if (two >= 10 && two <= 26) dp[i] += dp[i - 2];
  }
  return dp[s.length];
}

function solveQ68(input) {
  const coins = Array.isArray(input?.coins) ? input.coins : [];
  const amount = Number(input?.amount || 0);
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let value = 1; value <= amount; value += 1) {
    for (const coin of coins) {
      if (coin <= value) {
        dp[value] = Math.min(dp[value], 1 + dp[value - coin]);
      }
    }
  }
  return Number.isFinite(dp[amount]) ? dp[amount] : -1;
}

function solveQ69(input) {
  const nums = Array.isArray(input?.nums) ? input.nums : [];
  if (!nums.length) return 0;
  let curMax = nums[0];
  let curMin = nums[0];
  let best = nums[0];
  for (let i = 1; i < nums.length; i += 1) {
    const value = nums[i];
    if (value < 0) {
      const tmp = curMax;
      curMax = curMin;
      curMin = tmp;
    }
    curMax = Math.max(value, curMax * value);
    curMin = Math.min(value, curMin * value);
    best = Math.max(best, curMax);
  }
  return best;
}

function solveQ70(input) {
  const s = String(input?.s || "");
  const wordDict = new Set(Array.isArray(input?.wordDict) ? input.wordDict : []);
  const dp = new Array(s.length + 1).fill(false);
  dp[0] = true;
  for (let i = 1; i <= s.length; i += 1) {
    for (let j = 0; j < i; j += 1) {
      if (!dp[j]) continue;
      if (!wordDict.has(s.slice(j, i))) continue;
      dp[i] = true;
      break;
    }
  }
  return dp[s.length];
}

function lowerBound(sorted, value) {
  let left = 0;
  let right = sorted.length;
  while (left < right) {
    const mid = (left + right) >> 1;
    if (sorted[mid] < value) left = mid + 1;
    else right = mid;
  }
  return left;
}

function solveQ71(input) {
  const nums = Array.isArray(input?.nums) ? input.nums : [];
  const tails = [];
  for (const value of nums) {
    const idx = lowerBound(tails, value);
    if (idx === tails.length) tails.push(value);
    else tails[idx] = value;
  }
  return tails.length;
}

function solveQ72(input) {
  const m = Number(input?.m || 0);
  const n = Number(input?.n || 0);
  if (m <= 0 || n <= 0) return 0;
  const dp = new Array(n).fill(1);
  for (let r = 1; r < m; r += 1) {
    for (let c = 1; c < n; c += 1) {
      dp[c] += dp[c - 1];
    }
  }
  return dp[n - 1];
}

function solveQ73(input) {
  const nums = Array.isArray(input?.nums) ? input.nums : [];
  let farthest = 0;
  for (let i = 0; i < nums.length; i += 1) {
    if (i > farthest) return false;
    farthest = Math.max(farthest, i + nums[i]);
  }
  return true;
}

function solveQ74(input) {
  const intervals = Array.isArray(input?.intervals) ? input.intervals.map((entry) => [...entry]) : [];
  const newInterval = Array.isArray(input?.newInterval) ? [...input.newInterval] : [0, 0];
  const out = [];
  let index = 0;
  while (index < intervals.length && intervals[index][1] < newInterval[0]) out.push(intervals[index++]);
  while (index < intervals.length && intervals[index][0] <= newInterval[1]) {
    newInterval[0] = Math.min(newInterval[0], intervals[index][0]);
    newInterval[1] = Math.max(newInterval[1], intervals[index][1]);
    index += 1;
  }
  out.push(newInterval);
  while (index < intervals.length) out.push(intervals[index++]);
  return out;
}

function solveQ75(input) {
  const intervals = Array.isArray(input?.intervals) ? input.intervals.map((entry) => [...entry]) : [];
  if (!intervals.length) return [];
  intervals.sort((a, b) => a[0] - b[0]);
  const out = [intervals[0]];
  for (let i = 1; i < intervals.length; i += 1) {
    const current = intervals[i];
    const last = out[out.length - 1];
    if (current[0] <= last[1]) last[1] = Math.max(last[1], current[1]);
    else out.push(current);
  }
  return out;
}

export const WAVE_5_PROBLEM_SPECS = [
  makeProblemSpec({
    questionId: 62,
    questionName: "Climbing Stairs",
    strategyId: "q-62-problem-specific",
    templateId: DP_STATE_TEMPLATE_ID,
    complexity: { time: "O(n)", space: "O(1)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ n: 2 }, { n: 5 }],
    randomTrials: 40,
    solve: solveQ62,
    snippetName: "Climbing Stairs | Fibonacci DP",
  }),
  makeProblemSpec({
    questionId: 63,
    questionName: "House Robber",
    strategyId: "q-63-problem-specific",
    templateId: DP_STATE_TEMPLATE_ID,
    complexity: { time: "O(n)", space: "O(1)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ nums: [1, 2, 3, 1] }, { nums: [2, 7, 9, 3, 1] }],
    randomTrials: 50,
    solve: solveQ63,
    snippetName: "House Robber | Rolling include/exclude DP",
  }),
  makeProblemSpec({
    questionId: 64,
    questionName: "House Robber II",
    strategyId: "q-64-problem-specific",
    templateId: DP_STATE_TEMPLATE_ID,
    complexity: { time: "O(n)", space: "O(1)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ nums: [2, 3, 2] }, { nums: [1, 2, 3, 1] }],
    randomTrials: 50,
    solve: solveQ64,
    snippetName: "House Robber II | Two linear robber passes",
  }),
  makeProblemSpec({
    questionId: 65,
    questionName: "Longest Palindromic Substring",
    strategyId: "q-65-problem-specific",
    templateId: DP_STATE_TEMPLATE_ID,
    complexity: { time: "O(n^2)", space: "O(1)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ s: "babad" }, { s: "cbbd" }],
    randomTrials: 50,
    solve: solveQ65,
    snippetName: "Longest Palindromic Substring | Expand around center",
  }),
  makeProblemSpec({
    questionId: 66,
    questionName: "Palindromic Substrings",
    strategyId: "q-66-problem-specific",
    templateId: DP_STATE_TEMPLATE_ID,
    complexity: { time: "O(n^2)", space: "O(1)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ s: "abc" }, { s: "aaa" }],
    randomTrials: 50,
    solve: solveQ66,
    snippetName: "Palindromic Substrings | Center expansion counting",
  }),
  makeProblemSpec({
    questionId: 67,
    questionName: "Decode Ways",
    strategyId: "q-67-problem-specific",
    templateId: DP_STATE_TEMPLATE_ID,
    complexity: { time: "O(n)", space: "O(n)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ s: "12" }, { s: "226" }, { s: "06" }],
    randomTrials: 50,
    solve: solveQ67,
    snippetName: "Decode Ways | Prefix decode-count DP",
  }),
  makeProblemSpec({
    questionId: 68,
    questionName: "Coin Change",
    strategyId: "q-68-problem-specific",
    templateId: DP_STATE_TEMPLATE_ID,
    complexity: { time: "O(amount * coins)", space: "O(amount)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ coins: [1, 2, 5], amount: 11 }, { coins: [2], amount: 3 }],
    randomTrials: 50,
    solve: solveQ68,
    snippetName: "Coin Change | Bottom-up min-coins DP",
  }),
  makeProblemSpec({
    questionId: 69,
    questionName: "Maximum Product Subarray",
    strategyId: "q-69-problem-specific",
    templateId: DP_STATE_TEMPLATE_ID,
    complexity: { time: "O(n)", space: "O(1)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ nums: [2, 3, -2, 4] }, { nums: [-2, 0, -1] }],
    randomTrials: 50,
    solve: solveQ69,
    snippetName: "Maximum Product Subarray | Track max/min rolling products",
  }),
  makeProblemSpec({
    questionId: 70,
    questionName: "Word Break",
    strategyId: "q-70-problem-specific",
    templateId: DP_STATE_TEMPLATE_ID,
    complexity: { time: "O(n^2)", space: "O(n)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ s: "leetcode", wordDict: ["leet", "code"] }, { s: "catsandog", wordDict: ["cats", "dog", "sand", "and", "cat"] }],
    randomTrials: 50,
    solve: solveQ70,
    snippetName: "Word Break | Segmentability DP",
  }),
  makeProblemSpec({
    questionId: 71,
    questionName: "Longest Increasing Subsequence",
    strategyId: "q-71-problem-specific",
    templateId: DP_STATE_TEMPLATE_ID,
    complexity: { time: "O(n log n)", space: "O(n)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ nums: [10, 9, 2, 5, 3, 7, 101, 18] }, { nums: [0, 1, 0, 3, 2, 3] }],
    randomTrials: 50,
    solve: solveQ71,
    snippetName: "Longest Increasing Subsequence | Patience tails",
  }),
  makeProblemSpec({
    questionId: 72,
    questionName: "Unique Paths",
    strategyId: "q-72-problem-specific",
    templateId: DP_STATE_TEMPLATE_ID,
    complexity: { time: "O(m*n)", space: "O(n)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ m: 3, n: 7 }, { m: 3, n: 2 }],
    randomTrials: 50,
    solve: solveQ72,
    snippetName: "Unique Paths | Grid transition DP",
  }),
  makeProblemSpec({
    questionId: 73,
    questionName: "Jump Game",
    strategyId: "q-73-problem-specific",
    templateId: INTERVAL_GREEDY_TEMPLATE_ID,
    complexity: { time: "O(n)", space: "O(1)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ nums: [2, 3, 1, 1, 4] }, { nums: [3, 2, 1, 0, 4] }],
    randomTrials: 50,
    solve: solveQ73,
    snippetName: "Jump Game | Greedy farthest reach",
  }),
  makeProblemSpec({
    questionId: 74,
    questionName: "Insert Interval",
    strategyId: "q-74-problem-specific",
    templateId: INTERVAL_GREEDY_TEMPLATE_ID,
    complexity: { time: "O(n)", space: "O(n)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ intervals: [[1, 3], [6, 9]], newInterval: [2, 5] }, { intervals: [[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], newInterval: [4, 8] }],
    randomTrials: 50,
    solve: solveQ74,
    snippetName: "Insert Interval | Sweep + merge around insertion",
  }),
  makeProblemSpec({
    questionId: 75,
    questionName: "Merge Intervals",
    strategyId: "q-75-problem-specific",
    templateId: INTERVAL_GREEDY_TEMPLATE_ID,
    complexity: { time: "O(n log n)", space: "O(n)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ intervals: [[1, 3], [2, 6], [8, 10], [15, 18]] }, { intervals: [[1, 4], [4, 5]] }],
    randomTrials: 50,
    solve: solveQ75,
    snippetName: "Merge Intervals | Sort then coalesce",
  }),
].map((spec) => ({
  ...spec,
  ir: buildProblemIr(spec.templateId, spec.questionName),
}));

export function createWave5Strategies() {
  return createStrategiesFromProblemSpecs(WAVE_5_PROBLEM_SPECS);
}


import { BINARY_SEARCH_TEMPLATE_ID, LINKED_LIST_TEMPLATE_ID, STACK_HEAP_TEMPLATE_ID } from "../templates";
import { buildProblemIr } from "./problemIr";
import { createStrategiesFromProblemSpecs, makeProblemSpec } from "./problemStrategyBuilder";
import { irStep } from "./shared";

function solveQ17(input) {
  const s = String(input?.s || "");
  const match = { ")": "(", "]": "[", "}": "{" };
  const stack = [];
  for (const ch of s) {
    if (match[ch]) {
      if (!stack.length || stack[stack.length - 1] !== match[ch]) return false;
      stack.pop();
    } else {
      stack.push(ch);
    }
  }
  return stack.length === 0;
}

function solveQ18(input) {
  const temperatures = Array.isArray(input?.temperatures) ? input.temperatures : [];
  const out = new Array(temperatures.length).fill(0);
  const stack = [];
  for (let i = 0; i < temperatures.length; i += 1) {
    while (stack.length && temperatures[i] > temperatures[stack[stack.length - 1]]) {
      const idx = stack.pop();
      out[idx] = i - idx;
    }
    stack.push(i);
  }
  return out;
}

function solveQ19(input) {
  const target = Number(input?.target || 0);
  const position = Array.isArray(input?.position) ? input.position : [];
  const speed = Array.isArray(input?.speed) ? input.speed : [];
  const cars = position.map((pos, index) => [pos, speed[index]]).sort((a, b) => b[0] - a[0]);
  let fleets = 0;
  let slowestTime = -1;
  for (const [pos, v] of cars) {
    const time = (target - pos) / v;
    if (time > slowestTime) {
      fleets += 1;
      slowestTime = time;
    }
  }
  return fleets;
}

function solveQ20(input) {
  const heights = Array.isArray(input?.heights) ? input.heights : [];
  const stack = [];
  let best = 0;
  const arr = [...heights, 0];
  for (let i = 0; i < arr.length; i += 1) {
    while (stack.length && arr[i] < arr[stack[stack.length - 1]]) {
      const top = stack.pop();
      const height = arr[top];
      const leftBoundary = stack.length ? stack[stack.length - 1] : -1;
      const width = i - leftBoundary - 1;
      best = Math.max(best, height * width);
    }
    stack.push(i);
  }
  return best;
}

function solveQ21(input) {
  const nums = Array.isArray(input?.nums) ? input.nums : [];
  const target = Number(input?.target);
  let left = 0;
  let right = nums.length - 1;
  while (left <= right) {
    const mid = (left + right) >> 1;
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

function solveQ22(input) {
  const matrix = Array.isArray(input?.matrix) ? input.matrix : [];
  if (!matrix.length || !Array.isArray(matrix[0]) || matrix[0].length === 0) return false;
  const rows = matrix.length;
  const cols = matrix[0].length;
  const target = Number(input?.target);
  let left = 0;
  let right = rows * cols - 1;
  while (left <= right) {
    const mid = (left + right) >> 1;
    const value = matrix[Math.floor(mid / cols)][mid % cols];
    if (value === target) return true;
    if (value < target) left = mid + 1;
    else right = mid - 1;
  }
  return false;
}

function solveQ23(input) {
  const piles = Array.isArray(input?.piles) ? input.piles : [];
  const h = Number(input?.h || 0);
  let left = 1;
  let right = Math.max(1, ...piles);

  function canFinish(speed) {
    let hours = 0;
    for (const pile of piles) {
      hours += Math.ceil(pile / speed);
      if (hours > h) return false;
    }
    return true;
  }

  while (left < right) {
    const mid = (left + right) >> 1;
    if (canFinish(mid)) right = mid;
    else left = mid + 1;
  }
  return left;
}

function solveQ24(input) {
  const nums = Array.isArray(input?.nums) ? input.nums : [];
  if (!nums.length) return 0;
  let left = 0;
  let right = nums.length - 1;
  let best = nums[0];
  while (left <= right) {
    if (nums[left] <= nums[right]) {
      best = Math.min(best, nums[left]);
      break;
    }
    const mid = (left + right) >> 1;
    best = Math.min(best, nums[mid]);
    if (nums[mid] >= nums[left]) left = mid + 1;
    else right = mid - 1;
  }
  return best;
}

function solveQ25(input) {
  const nums = Array.isArray(input?.nums) ? input.nums : [];
  const target = Number(input?.target);
  let left = 0;
  let right = nums.length - 1;
  while (left <= right) {
    const mid = (left + right) >> 1;
    if (nums[mid] === target) return mid;
    if (nums[left] <= nums[mid]) {
      if (nums[left] <= target && target < nums[mid]) right = mid - 1;
      else left = mid + 1;
    } else {
      if (nums[mid] < target && target <= nums[right]) left = mid + 1;
      else right = mid - 1;
    }
  }
  return -1;
}

function solveQ26(input) {
  let nums1 = Array.isArray(input?.nums1) ? input.nums1 : [];
  let nums2 = Array.isArray(input?.nums2) ? input.nums2 : [];
  if (nums1.length > nums2.length) {
    const swap = nums1;
    nums1 = nums2;
    nums2 = swap;
  }

  const total = nums1.length + nums2.length;
  const half = Math.floor(total / 2);
  let left = 0;
  let right = nums1.length;

  while (left <= right) {
    const i = (left + right) >> 1;
    const j = half - i;
    const aLeft = i > 0 ? nums1[i - 1] : -Infinity;
    const aRight = i < nums1.length ? nums1[i] : Infinity;
    const bLeft = j > 0 ? nums2[j - 1] : -Infinity;
    const bRight = j < nums2.length ? nums2[j] : Infinity;

    if (aLeft <= bRight && bLeft <= aRight) {
      if (total % 2 === 1) return Math.min(aRight, bRight);
      return (Math.max(aLeft, bLeft) + Math.min(aRight, bRight)) / 2;
    }
    if (aLeft > bRight) right = i - 1;
    else left = i + 1;
  }

  return 0;
}

function solveQ27(input) {
  const head = Array.isArray(input?.head) ? input.head : [];
  return [...head].reverse();
}

function solveQ28(input) {
  const l1 = Array.isArray(input?.l1) ? input.l1 : [];
  const l2 = Array.isArray(input?.l2) ? input.l2 : [];
  const out = [];
  let i = 0;
  let j = 0;
  while (i < l1.length || j < l2.length) {
    if (j >= l2.length || (i < l1.length && l1[i] <= l2[j])) out.push(l1[i++]);
    else out.push(l2[j++]);
  }
  return out;
}

function solveQ29(input) {
  const values = Array.isArray(input?.values) ? input.values : [];
  const pos = Number(input?.pos);
  return Number.isInteger(pos) && pos >= 0 && pos < values.length;
}

function solveQ30(input) {
  const head = Array.isArray(input?.head) ? input.head : [];
  let left = 0;
  let right = head.length - 1;
  const out = [];
  while (left <= right) {
    if (left === right) out.push(head[left]);
    else {
      out.push(head[left]);
      out.push(head[right]);
    }
    left += 1;
    right -= 1;
  }
  return out;
}

function solveQ31(input) {
  const head = Array.isArray(input?.head) ? input.head : [];
  const n = Number(input?.n || 0);
  const index = head.length - n;
  if (index < 0 || index >= head.length) return [...head];
  return [...head.slice(0, index), ...head.slice(index + 1)];
}

function solveQ32(input) {
  const lists = Array.isArray(input?.lists) ? input.lists : [];
  return lists.flatMap((item) => (Array.isArray(item) ? item : [])).sort((a, b) => a - b);
}

function linkedListConstraints() {
  return { outputMode: "linked-list-equivalent", disallowTokens: [] };
}

const WORLD0_WAVE2_IR_OVERRIDES = Object.freeze({
  17: [
    irStep("init-structure", "init-match-stack", "const match = { ')': '(', ']': '[', '}': '{' }; const stack = []", "declare"),
    irStep("iterate", "scan-string", "for (const ch of s)", "loop"),
    irStep("push-pop", "validate-closer", "if (match[ch]) { if (!stack.length || stack[stack.length - 1] !== match[ch]) return false }", "update"),
    irStep("resolve", "consume-or-push", "if (match[ch]) stack.pop(); else stack.push(ch)", "branch"),
    irStep("emit", "return-valid", "return stack.length === 0", "return"),
  ],
  21: [
    irStep("bounds", "init-bounds", "let left = 0; let right = nums.length - 1", "declare"),
    irStep("halve", "loop-binary", "while (left <= right)", "loop"),
    irStep("move-bounds", "compute-mid", "const mid = (left + right) >> 1", "update"),
    irStep(
      "mid-check",
      "mid-compare",
      "if (nums[mid] === target) return mid; if (nums[mid] < target) left = mid + 1; else right = mid - 1",
      "branch"
    ),
    irStep("emit", "return-miss", "return -1", "return"),
  ],
  27: [
    irStep("anchors", "init-prev-cur", "let prev = null; let cur = head", "declare"),
    irStep("walk", "walk-list", "while (cur)", "loop"),
    irStep("relink", "reverse-pointer", "const next = cur.next; cur.next = prev; prev = cur; cur = next", "update"),
    irStep("guard", "empty-list-check", "if (!head) return null", "branch"),
    irStep("emit", "return-reversed", "return prev", "return"),
  ],
  28: [
    irStep("anchors", "init-dummy", "const dummy = new ListNode(0); let tail = dummy", "declare"),
    irStep("walk", "walk-both-lists", "while (list1 && list2)", "loop"),
    irStep(
      "relink",
      "attach-smaller-node",
      "if (list1.val <= list2.val) { tail.next = list1; list1 = list1.next } else { tail.next = list2; list2 = list2.next }; tail = tail.next",
      "update"
    ),
    irStep("guard", "append-remainder", "tail.next = list1 || list2", "branch"),
    irStep("emit", "return-merged", "return dummy.next", "return"),
  ],
  29: [
    irStep("anchors", "init-fast-slow", "let slow = head; let fast = head", "declare"),
    irStep("walk", "advance-while-possible", "while (fast && fast.next)", "loop"),
    irStep("relink", "move-pointers", "slow = slow.next; fast = fast.next.next", "update"),
    irStep("guard", "meeting-check", "if (slow === fast) return true", "branch"),
    irStep("emit", "return-no-cycle", "return false", "return"),
  ],
  31: [
    irStep("anchors", "init-dummy-pointers", "const dummy = new ListNode(0, head); let slow = dummy; let fast = dummy", "declare"),
    irStep(
      "walk",
      "advance-gap-then-sync",
      "for (let i = 0; i < n; i++) fast = fast.next; while (fast.next) { fast = fast.next; slow = slow.next }",
      "loop"
    ),
    irStep("relink", "skip-target-node", "slow.next = slow.next.next", "update"),
    irStep("guard", "single-node-case", "if (!dummy.next) return null", "branch"),
    irStep("emit", "return-updated-head", "return dummy.next", "return"),
  ],
});

export const WAVE_2_PROBLEM_SPECS = [
  makeProblemSpec({
    questionId: 17,
    questionName: "Valid Parentheses",
    strategyId: "q-17-problem-specific",
    templateId: STACK_HEAP_TEMPLATE_ID,
    complexity: { time: "O(n)", space: "O(n)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ s: "()[]{}" }, { s: "(]" }, { s: "([{}])" }],
    randomTrials: 40,
    solve: solveQ17,
    snippetName: "Valid Parentheses | Matching stack",
  }),
  makeProblemSpec({
    questionId: 18,
    questionName: "Daily Temperatures",
    strategyId: "q-18-problem-specific",
    templateId: STACK_HEAP_TEMPLATE_ID,
    complexity: { time: "O(n)", space: "O(n)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ temperatures: [73, 74, 75, 71, 69, 72, 76, 73] }, { temperatures: [30, 40, 50, 60] }],
    randomTrials: 50,
    solve: solveQ18,
    snippetName: "Daily Temperatures | Monotonic stack",
  }),
  makeProblemSpec({
    questionId: 19,
    questionName: "Car Fleet",
    strategyId: "q-19-problem-specific",
    templateId: STACK_HEAP_TEMPLATE_ID,
    complexity: { time: "O(n log n)", space: "O(n)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ target: 12, position: [10, 8, 0, 5, 3], speed: [2, 4, 1, 1, 3] }, { target: 10, position: [3], speed: [3] }],
    randomTrials: 50,
    solve: solveQ19,
    snippetName: "Car Fleet | Sort by position and collapse fleets",
  }),
  makeProblemSpec({
    questionId: 20,
    questionName: "Largest Rectangle in Histogram",
    strategyId: "q-20-problem-specific",
    templateId: STACK_HEAP_TEMPLATE_ID,
    complexity: { time: "O(n)", space: "O(n)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ heights: [2, 1, 5, 6, 2, 3] }, { heights: [2, 4] }],
    randomTrials: 60,
    solve: solveQ20,
    snippetName: "Largest Rectangle in Histogram | Monotonic stack with sentinel",
  }),
  makeProblemSpec({
    questionId: 21,
    questionName: "Binary Search",
    strategyId: "q-21-problem-specific",
    templateId: BINARY_SEARCH_TEMPLATE_ID,
    complexity: { time: "O(log n)", space: "O(1)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ nums: [-1, 0, 3, 5, 9, 12], target: 9 }, { nums: [-1, 0, 3, 5, 9, 12], target: 2 }],
    randomTrials: 40,
    solve: solveQ21,
    snippetName: "Binary Search | Exact target search",
  }),
  makeProblemSpec({
    questionId: 22,
    questionName: "Search a 2D Matrix",
    strategyId: "q-22-problem-specific",
    templateId: BINARY_SEARCH_TEMPLATE_ID,
    complexity: { time: "O(log(m*n))", space: "O(1)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ matrix: [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], target: 3 }, { matrix: [[1]], target: 2 }],
    randomTrials: 50,
    solve: solveQ22,
    snippetName: "Search a 2D Matrix | Flattened binary search",
  }),
  makeProblemSpec({
    questionId: 23,
    questionName: "Koko Eating Bananas",
    strategyId: "q-23-problem-specific",
    templateId: BINARY_SEARCH_TEMPLATE_ID,
    complexity: { time: "O(n log maxPile)", space: "O(1)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ piles: [3, 6, 7, 11], h: 8 }, { piles: [30, 11, 23, 4, 20], h: 5 }],
    randomTrials: 50,
    solve: solveQ23,
    snippetName: "Koko Eating Bananas | Binary search on answer",
  }),
  makeProblemSpec({
    questionId: 24,
    questionName: "Find Minimum in Rotated Sorted Array",
    strategyId: "q-24-problem-specific",
    templateId: BINARY_SEARCH_TEMPLATE_ID,
    complexity: { time: "O(log n)", space: "O(1)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ nums: [3, 4, 5, 1, 2] }, { nums: [11, 13, 15, 17] }],
    randomTrials: 50,
    solve: solveQ24,
    snippetName: "Find Minimum in Rotated Sorted Array | Pivot search",
  }),
  makeProblemSpec({
    questionId: 25,
    questionName: "Search in Rotated Sorted Array",
    strategyId: "q-25-problem-specific",
    templateId: BINARY_SEARCH_TEMPLATE_ID,
    complexity: { time: "O(log n)", space: "O(1)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ nums: [4, 5, 6, 7, 0, 1, 2], target: 0 }, { nums: [4, 5, 6, 7, 0, 1, 2], target: 3 }],
    randomTrials: 50,
    solve: solveQ25,
    snippetName: "Search in Rotated Sorted Array | Sorted-half binary search",
  }),
  makeProblemSpec({
    questionId: 26,
    questionName: "Median of Two Sorted Arrays",
    strategyId: "q-26-problem-specific",
    templateId: BINARY_SEARCH_TEMPLATE_ID,
    complexity: { time: "O(log(min(m,n)))", space: "O(1)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ nums1: [1, 3], nums2: [2] }, { nums1: [1, 2], nums2: [3, 4] }],
    randomTrials: 60,
    solve: solveQ26,
    snippetName: "Median of Two Sorted Arrays | Partition binary search",
  }),
  makeProblemSpec({
    questionId: 27,
    questionName: "Reverse Linked List",
    strategyId: "q-27-problem-specific",
    templateId: LINKED_LIST_TEMPLATE_ID,
    complexity: { time: "O(n)", space: "O(1)" },
    constraints: linkedListConstraints(),
    samples: [{ head: [1, 2, 3, 4, 5] }, { head: [1, 2] }],
    randomTrials: 40,
    solve: solveQ27,
    snippetName: "Reverse Linked List | Pointer reversal",
  }),
  makeProblemSpec({
    questionId: 28,
    questionName: "Merge Two Sorted Lists",
    strategyId: "q-28-problem-specific",
    templateId: LINKED_LIST_TEMPLATE_ID,
    complexity: { time: "O(n+m)", space: "O(1)" },
    constraints: linkedListConstraints(),
    samples: [{ l1: [1, 2, 4], l2: [1, 3, 4] }, { l1: [], l2: [0] }],
    randomTrials: 40,
    solve: solveQ28,
    snippetName: "Merge Two Sorted Lists | Dummy head merge",
  }),
  makeProblemSpec({
    questionId: 29,
    questionName: "Linked List Cycle",
    strategyId: "q-29-problem-specific",
    templateId: LINKED_LIST_TEMPLATE_ID,
    complexity: { time: "O(n)", space: "O(1)" },
    constraints: { outputMode: "normalized", disallowTokens: [] },
    samples: [{ values: [3, 2, 0, -4], pos: 1 }, { values: [1, 2], pos: -1 }],
    randomTrials: 40,
    solve: solveQ29,
    snippetName: "Linked List Cycle | Fast/slow cycle detection schema",
  }),
  makeProblemSpec({
    questionId: 30,
    questionName: "Reorder List",
    strategyId: "q-30-problem-specific",
    templateId: LINKED_LIST_TEMPLATE_ID,
    complexity: { time: "O(n)", space: "O(1) extra" },
    constraints: linkedListConstraints(),
    samples: [{ head: [1, 2, 3, 4] }, { head: [1, 2, 3, 4, 5] }],
    randomTrials: 50,
    solve: solveQ30,
    snippetName: "Reorder List | Split, reverse, weave",
  }),
  makeProblemSpec({
    questionId: 31,
    questionName: "Remove Nth Node From End of List",
    strategyId: "q-31-problem-specific",
    templateId: LINKED_LIST_TEMPLATE_ID,
    complexity: { time: "O(n)", space: "O(1)" },
    constraints: linkedListConstraints(),
    samples: [{ head: [1, 2, 3, 4, 5], n: 2 }, { head: [1], n: 1 }],
    randomTrials: 50,
    solve: solveQ31,
    snippetName: "Remove Nth Node From End of List | Two pointers with gap",
  }),
  makeProblemSpec({
    questionId: 32,
    questionName: "Merge K Sorted Lists",
    strategyId: "q-32-problem-specific",
    templateId: STACK_HEAP_TEMPLATE_ID,
    complexity: { time: "O(N log k)", space: "O(k)" },
    constraints: linkedListConstraints(),
    samples: [{ lists: [[1, 4, 5], [1, 3, 4], [2, 6]] }, { lists: [] }],
    randomTrials: 60,
    solve: solveQ32,
    snippetName: "Merge K Sorted Lists | Heap-driven merge",
  }),
].map((spec) => ({
  ...spec,
  ir: WORLD0_WAVE2_IR_OVERRIDES[spec.questionId] || buildProblemIr(spec.templateId, spec.questionName, spec.solve),
}));

export function createWave2Strategies() {
  return createStrategiesFromProblemSpecs(WAVE_2_PROBLEM_SPECS);
}

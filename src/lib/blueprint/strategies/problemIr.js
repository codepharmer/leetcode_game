import {
  BACKTRACKING_TEMPLATE_ID,
  BINARY_SEARCH_TEMPLATE_ID,
  DP_STATE_TEMPLATE_ID,
  INTERVAL_GREEDY_TEMPLATE_ID,
  LINKED_LIST_TEMPLATE_ID,
  SLIDING_WINDOW_TEMPLATE_ID,
  STACK_HEAP_TEMPLATE_ID,
  TREE_GRAPH_TEMPLATE_ID,
  TWO_POINTERS_TEMPLATE_ID,
} from "../templates";
import { irStep } from "./shared";

export function buildProblemIr(templateId, label) {
  const title = String(label || "problem");

  if (templateId === TWO_POINTERS_TEMPLATE_ID) {
    return [
      irStep("anchors", "init-pointers", "let left = 0; let right = data.length - 1", "declare"),
      irStep("converge", "scan-pairs", "while (left < right)", "loop"),
      irStep("shift", "move-pointer", "update pointers based on score / invariant", "update"),
      irStep("compare", "check-candidate", "if improves(candidate, best) then update best", "branch"),
      irStep("emit", "return-answer", `return answer  # ${title}`, "return"),
    ];
  }

  if (templateId === SLIDING_WINDOW_TEMPLATE_ID) {
    return [
      irStep("bootstrap", "init-window", "let left = 0; init counts/state", "declare"),
      irStep("expand", "expand-right", "for (let right = 0; right < data.length; right++)", "loop"),
      irStep("shrink", "shrink-left", "while (window invalid) { remove left; left++; }", "update"),
      irStep("window-check", "record-best", "if window valid, update best answer", "branch"),
      irStep("emit", "return-window", `return answer  # ${title}`, "return"),
    ];
  }

  if (templateId === STACK_HEAP_TEMPLATE_ID) {
    return [
      irStep("init-structure", "init-structure", "const structure = []  # stack/heap", "declare"),
      irStep("iterate", "iterate-input", "for (const item of items)", "loop"),
      irStep("push-pop", "maintain-structure", "push/pop while invariant is violated", "update"),
      irStep("resolve", "resolve-answer", "if condition met, write answer for pending items", "branch"),
      irStep("emit", "return-structure-answer", `return answer  # ${title}`, "return"),
    ];
  }

  if (templateId === BINARY_SEARCH_TEMPLATE_ID) {
    return [
      irStep("bounds", "init-bounds", "let left = lo; let right = hi", "declare"),
      irStep("halve", "loop-halving", "while (left <= right or left < right)", "loop"),
      irStep("move-bounds", "move-bounds", "move left/right based on midpoint predicate", "update"),
      irStep("mid-check", "check-mid", "if midpoint satisfies answer condition, capture it", "branch"),
      irStep("emit", "return-search", `return answer  # ${title}`, "return"),
    ];
  }

  if (templateId === LINKED_LIST_TEMPLATE_ID) {
    return [
      irStep("anchors", "init-anchors", "let prev = null; let cur = head", "declare"),
      irStep("walk", "walk-list", "while (cur)", "loop"),
      irStep("relink", "rewrite-links", "relink next pointers safely for target transformation", "update"),
      irStep("guard", "guard-edges", "check fast/slow stop conditions and edge cases", "branch"),
      irStep("emit", "return-head", `return transformedHead  # ${title}`, "return"),
    ];
  }

  if (templateId === INTERVAL_GREEDY_TEMPLATE_ID) {
    return [
      irStep("order", "sort-intervals", "intervals.sort((a, b) => a[0] - b[0])", "declare"),
      irStep("sweep", "sweep-intervals", "for (const interval of intervals)", "loop"),
      irStep("commit", "commit-decision", "merge/accept interval into active state", "update"),
      irStep("overlap", "overlap-check", "if overlap/conflict then adjust or count removal", "branch"),
      irStep("emit", "return-interval-answer", `return answer  # ${title}`, "return"),
    ];
  }

  if (templateId === BACKTRACKING_TEMPLATE_ID) {
    return [
      irStep("choose", "enumerate-choices", "for (const choice of choices(state))", "loop"),
      irStep("constrain", "prune-branch", "if (!valid(choice, state)) continue", "branch"),
      irStep("base", "check-base", "if complete(state) collect solution", "branch"),
      irStep("explore", "recurse", "path.push(choice); dfs(nextState); path.pop()", "update"),
      irStep("return", "return-backtracking", `return allSolutions  # ${title}`, "return"),
    ];
  }

  if (templateId === TREE_GRAPH_TEMPLATE_ID) {
    return [
      irStep("base-case", "base-case", "if node/state is terminal: return base value", "branch"),
      irStep("branch", "select-neighbors", "for (const next of neighbors/state transitions)", "loop"),
      irStep("prune", "prune", "skip visited/invalid neighbors or states", "branch"),
      irStep("traverse", "traverse", "dfs/bfs recursion or queue expansion", "update"),
      irStep("aggregate", "aggregate", `return aggregatedResult  # ${title}`, "return"),
    ];
  }

  if (templateId === DP_STATE_TEMPLATE_ID) {
    return [
      irStep("base-state", "init-base-state", "initialize dp base cases", "declare"),
      irStep("subproblem", "iterate-states", "for each state, inspect prior subproblems", "loop"),
      irStep("state-guard", "guard-transition", "skip invalid transitions", "branch"),
      irStep("transition", "apply-transition", "dp[state] = best(dp[subproblem] + cost)", "update"),
      irStep("memoize", "return-dp", `return dpAnswer  # ${title}`, "return"),
    ];
  }

  return [
    irStep("setup", "init-state", "initialize state", "declare"),
    irStep("loop", "iterate", "for each item in input", "loop"),
    irStep("update", "update", "update state", "update"),
    irStep("check", "check", "check invariant", "branch"),
    irStep("return", "return", `return answer  # ${title}`, "return"),
  ];
}

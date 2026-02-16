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

function compactCodeLine(line) {
  return String(line || "").replace(/\s+/g, " ").trim();
}

function extractSolveBodyLines(solveFn) {
  if (typeof solveFn !== "function") return [];
  const source = String(solveFn);
  const open = source.indexOf("{");
  const close = source.lastIndexOf("}");
  if (open < 0 || close <= open) return [];

  return source
    .slice(open + 1, close)
    .split("\n")
    .map((line) => compactCodeLine(line))
    .filter(Boolean)
    .filter((line) => !/^\}?;?$/.test(line))
    .filter((line) => !/^(\/\/|\/\*|\*)/.test(line));
}

function pickLine(lines, used, matchers) {
  for (const matcher of matchers) {
    for (let i = 0; i < lines.length; i += 1) {
      if (used.has(i)) continue;
      const line = lines[i];
      if (!matcher(line, i, lines)) continue;
      used.add(i);
      return line;
    }
  }
  return "";
}

function pickAnyUnused(lines, used, fallbackText) {
  for (let i = 0; i < lines.length; i += 1) {
    if (used.has(i)) continue;
    used.add(i);
    return lines[i];
  }
  return fallbackText;
}

const isReturnLine = (line) => /^return\b/.test(line);
const isLoopLine = (line) => /^(for|while)\b/.test(line);
const isIfLine = (line) => /^(if|else if|else)\b/.test(line);
const isDeclarationLine = (line) => /^(const|let|var|function)\b/.test(line);
const isMutationLine = (line) =>
  /(=|\+\+|--|\.push\(|\.pop\(|\.shift\(|\.unshift\(|\.set\(|\.add\(|\.delete\(|\.splice\()/.test(line);

const mentionsPointerState = (line) => /\b(left|right|slow|fast|prev|cur|head)\b/.test(line);
const mentionsLinearStructure = (line) => /\b(stack|queue|heap|indegree|graph|out)\b/.test(line);
const mentionsDpState = (line) => /\b(dp|memo|tails|rob1|rob2|curMax|curMin|maxCount|best)\b/.test(line);
const mentionsTraversal = (line) => /\b(node|grid|dfs|bfs|neighbors|queue)\b/.test(line);
const mentionsRecursion = (line) => /\b(dfs|bfs|invert|depth|build|valid|contains|expand)\s*\(/.test(line);

function buildSolveDerivedIr(templateId, solveFn) {
  const lines = extractSolveBodyLines(solveFn);
  if (!lines.length) return null;

  const used = new Set();
  const pick = (...matchers) => pickLine(lines, used, matchers);
  const any = (fallbackText) => pickAnyUnused(lines, used, fallbackText);

  if (templateId === TWO_POINTERS_TEMPLATE_ID) {
    return [
      irStep("anchors", "init-pointers", pick((line) => isDeclarationLine(line) && mentionsPointerState(line)) || any("let left = 0; let right = data.length - 1"), "declare"),
      irStep("converge", "scan-pairs", pick((line) => isLoopLine(line) && mentionsPointerState(line), isLoopLine) || any("while (left < right)"), "loop"),
      irStep("shift", "move-pointer", pick((line) => isMutationLine(line) && mentionsPointerState(line) && !isIfLine(line), (line) => isMutationLine(line) && !isIfLine(line)) || any("const score = data[left] + data[right]"), "update"),
      irStep("compare", "check-candidate", pick(isIfLine) || any("if (score > best) best = score"), "branch"),
      irStep("emit", "return-answer", pick(isReturnLine) || any("return best"), "return"),
    ];
  }

  if (templateId === SLIDING_WINDOW_TEMPLATE_ID) {
    return [
      irStep("bootstrap", "init-window", pick(isDeclarationLine) || any("let left = 0; let best = 0"), "declare"),
      irStep("expand", "expand-right", pick(isLoopLine) || any("for (let right = 0; right < data.length; right++)"), "loop"),
      irStep("shrink", "shrink-left", pick((line) => /left/.test(line) && isMutationLine(line), isMutationLine) || any("left += 1"), "update"),
      irStep("window-check", "record-best", pick(isIfLine, (line) => /best/.test(line)) || any("best = Math.max(best, right - left + 1)"), "branch"),
      irStep("emit", "return-window", pick(isReturnLine) || any("return best"), "return"),
    ];
  }

  if (templateId === STACK_HEAP_TEMPLATE_ID) {
    return [
      irStep("init-structure", "init-structure", pick((line) => isDeclarationLine(line) && mentionsLinearStructure(line), isDeclarationLine) || any("const stack = []"), "declare"),
      irStep("iterate", "iterate-input", pick(isLoopLine) || any("for (const item of items)"), "loop"),
      irStep("push-pop", "maintain-structure", pick((line) => isMutationLine(line) && (mentionsLinearStructure(line) || /\.push\(|\.pop\(|\.shift\(/.test(line)), isMutationLine) || any("stack.push(item)"), "update"),
      irStep("resolve", "resolve-answer", pick(isIfLine) || any("if (stack.length > 0) out.push(stack[stack.length - 1])"), "branch"),
      irStep("emit", "return-structure-answer", pick(isReturnLine) || any("return out"), "return"),
    ];
  }

  if (templateId === BINARY_SEARCH_TEMPLATE_ID) {
    return [
      irStep("bounds", "init-bounds", pick((line) => isDeclarationLine(line) && /(left|right|lo|hi)/.test(line), isDeclarationLine) || any("let left = 0; let right = arr.length - 1"), "declare"),
      irStep("halve", "loop-halving", pick((line) => isLoopLine(line) && /(left|right)/.test(line), isLoopLine) || any("while (left <= right)"), "loop"),
      irStep("move-bounds", "move-bounds", pick((line) => /(mid|left|right)/.test(line) && isMutationLine(line), isMutationLine) || any("const mid = (left + right) >> 1"), "update"),
      irStep("mid-check", "check-mid", pick(isIfLine) || any("if (arr[mid] === target) return mid"), "branch"),
      irStep("emit", "return-search", pick(isReturnLine) || any("return -1"), "return"),
    ];
  }

  if (templateId === LINKED_LIST_TEMPLATE_ID) {
    return [
      irStep("anchors", "init-anchors", pick((line) => isDeclarationLine(line) && mentionsPointerState(line), isDeclarationLine) || any("let prev = null; let cur = head"), "declare"),
      irStep("walk", "walk-list", pick((line) => isLoopLine(line) && mentionsPointerState(line), isLoopLine) || any("while (cur)"), "loop"),
      irStep("relink", "rewrite-links", pick((line) => isMutationLine(line) && (/\.next/.test(line) || mentionsPointerState(line)) && !isIfLine(line), (line) => isMutationLine(line) && !isIfLine(line)) || any("const next = cur.next; cur.next = prev; prev = cur; cur = next"), "update"),
      irStep("guard", "guard-edges", pick(isIfLine) || any("if (!head) return null"), "branch"),
      irStep("emit", "return-head", pick(isReturnLine) || any("return prev"), "return"),
    ];
  }

  if (templateId === INTERVAL_GREEDY_TEMPLATE_ID) {
    return [
      irStep("order", "sort-intervals", pick((line) => /\.sort\(/.test(line), isDeclarationLine) || any("intervals.sort((a, b) => a[0] - b[0])"), "declare"),
      irStep("sweep", "sweep-intervals", pick(isLoopLine) || any("for (const interval of intervals)"), "loop"),
      irStep("commit", "commit-decision", pick((line) => isMutationLine(line) && !isIfLine(line), isMutationLine) || any("out.push(interval)"), "update"),
      irStep("overlap", "overlap-check", pick(isIfLine) || any("if (interval[0] <= out[out.length - 1][1]) out[out.length - 1][1] = Math.max(out[out.length - 1][1], interval[1])"), "branch"),
      irStep("emit", "return-interval-answer", pick(isReturnLine) || any("return out"), "return"),
    ];
  }

  if (templateId === BACKTRACKING_TEMPLATE_ID) {
    return [
      irStep("choose", "enumerate-choices", pick(isLoopLine) || any("for (let i = start; i < choices.length; i++)"), "loop"),
      irStep("constrain", "prune-branch", pick((line) => isIfLine(line) && /(continue|return false|break|!)/.test(line), isIfLine) || any("if (invalidChoice) continue"), "branch"),
      irStep("base", "check-base", pick((line) => isIfLine(line) && /return/.test(line), isIfLine) || any("if (done) return"), "branch"),
      irStep("explore", "recurse", pick((line) => mentionsRecursion(line) || /\.push\(|\.pop\(/.test(line), (line) => isMutationLine(line) && !isIfLine(line)) || any("path.push(choice); dfs(nextState); path.pop()"), "update"),
      irStep("return", "return-backtracking", pick(isReturnLine) || any("return out"), "return"),
    ];
  }

  if (templateId === TREE_GRAPH_TEMPLATE_ID) {
    return [
      irStep("base-case", "base-case", pick((line) => isIfLine(line) && /return/.test(line), isIfLine) || any("if (!node) return baseValue"), "branch"),
      irStep("branch", "select-neighbors", pick(isLoopLine) || any("for (const next of neighbors)"), "loop"),
      irStep("prune", "prune", pick((line) => isIfLine(line) && /(continue|return|visited|invalid|!)/.test(line), isIfLine) || any("if (visited.has(next)) continue"), "branch"),
      irStep("traverse", "traverse", pick((line) => mentionsRecursion(line) || (isMutationLine(line) && mentionsTraversal(line)), (line) => isMutationLine(line) && !isIfLine(line)) || any("stack.push(next)"), "update"),
      irStep("aggregate", "aggregate", pick(isReturnLine) || any("return out"), "return"),
    ];
  }

  if (templateId === DP_STATE_TEMPLATE_ID) {
    return [
      irStep("base-state", "init-base-state", pick((line) => isDeclarationLine(line) && mentionsDpState(line), isDeclarationLine) || any("const dp = new Array(n + 1).fill(0)"), "declare"),
      irStep("subproblem", "iterate-states", pick(isLoopLine) || any("for (let i = 1; i <= n; i++)"), "loop"),
      irStep("state-guard", "guard-transition", pick((line) => isIfLine(line) && /(continue|return|!|<|>)/.test(line), isIfLine) || any("if (!isValidState(i)) continue"), "branch"),
      irStep("transition", "apply-transition", pick((line) => isMutationLine(line) && (mentionsDpState(line) || !isIfLine(line)), isMutationLine) || any("dp[i] = Math.max(dp[i], dp[i - 1])"), "update"),
      irStep("memoize", "return-dp", pick(isReturnLine) || any("return dp[n]"), "return"),
    ];
  }

  return [
    irStep("setup", "init-state", pick(isDeclarationLine) || any("let answer = 0"), "declare"),
    irStep("loop", "iterate", pick(isLoopLine) || any("for (const item of input)"), "loop"),
    irStep("update", "update", pick((line) => isMutationLine(line) && !isIfLine(line), isMutationLine) || any("answer += item"), "update"),
    irStep("check", "check", pick(isIfLine) || any("if (answer > best) best = answer"), "branch"),
    irStep("return", "return", pick(isReturnLine) || any("return answer"), "return"),
  ];
}

export function buildProblemIr(templateId, label, solveFn) {
  const solveDerived = buildSolveDerivedIr(templateId, solveFn);
  if (solveDerived) return solveDerived;

  if (templateId === TWO_POINTERS_TEMPLATE_ID) {
    return [
      irStep("anchors", "init-pointers", "let left = 0; let right = data.length - 1", "declare"),
      irStep("converge", "scan-pairs", "while (left < right)", "loop"),
      irStep("shift", "move-pointer", "const score = data[left] + data[right]", "update"),
      irStep("compare", "check-candidate", "if (score > best) best = score", "branch"),
      irStep("emit", "return-answer", "return best", "return"),
    ];
  }

  if (templateId === SLIDING_WINDOW_TEMPLATE_ID) {
    return [
      irStep("bootstrap", "init-window", "let left = 0; let best = 0", "declare"),
      irStep("expand", "expand-right", "for (let right = 0; right < data.length; right++)", "loop"),
      irStep("shrink", "shrink-left", "if (shouldShrink) left += 1", "update"),
      irStep("window-check", "record-best", "best = Math.max(best, right - left + 1)", "branch"),
      irStep("emit", "return-window", "return best", "return"),
    ];
  }

  if (templateId === STACK_HEAP_TEMPLATE_ID) {
    return [
      irStep("init-structure", "init-structure", "const stack = []", "declare"),
      irStep("iterate", "iterate-input", "for (const item of items)", "loop"),
      irStep("push-pop", "maintain-structure", "stack.push(item)", "update"),
      irStep("resolve", "resolve-answer", "if (stack.length > limit) stack.pop()", "branch"),
      irStep("emit", "return-structure-answer", "return stack", "return"),
    ];
  }

  if (templateId === BINARY_SEARCH_TEMPLATE_ID) {
    return [
      irStep("bounds", "init-bounds", "let left = lo; let right = hi", "declare"),
      irStep("halve", "loop-halving", "while (left <= right)", "loop"),
      irStep("move-bounds", "move-bounds", "const mid = (left + right) >> 1", "update"),
      irStep("mid-check", "check-mid", "if (arr[mid] < target) left = mid + 1; else right = mid - 1", "branch"),
      irStep("emit", "return-search", "return -1", "return"),
    ];
  }

  if (templateId === LINKED_LIST_TEMPLATE_ID) {
    return [
      irStep("anchors", "init-anchors", "let prev = null; let cur = head", "declare"),
      irStep("walk", "walk-list", "while (cur)", "loop"),
      irStep("relink", "rewrite-links", "const next = cur.next; cur.next = prev; prev = cur; cur = next", "update"),
      irStep("guard", "guard-edges", "if (!head) return null", "branch"),
      irStep("emit", "return-head", "return prev", "return"),
    ];
  }

  if (templateId === INTERVAL_GREEDY_TEMPLATE_ID) {
    return [
      irStep("order", "sort-intervals", "intervals.sort((a, b) => a[0] - b[0])", "declare"),
      irStep("sweep", "sweep-intervals", "for (const interval of intervals)", "loop"),
      irStep("commit", "commit-decision", "out.push(interval)", "update"),
      irStep("overlap", "overlap-check", "if (interval[0] <= out[out.length - 1][1]) out[out.length - 1][1] = Math.max(out[out.length - 1][1], interval[1])", "branch"),
      irStep("emit", "return-interval-answer", "return out", "return"),
    ];
  }

  if (templateId === BACKTRACKING_TEMPLATE_ID) {
    return [
      irStep("choose", "enumerate-choices", "for (const choice of choices(state))", "loop"),
      irStep("constrain", "prune-branch", "if (!valid(choice, state)) continue", "branch"),
      irStep("base", "check-base", "if (done) return", "branch"),
      irStep("explore", "recurse", "path.push(choice); dfs(nextState); path.pop()", "update"),
      irStep("return", "return-backtracking", "return out", "return"),
    ];
  }

  if (templateId === TREE_GRAPH_TEMPLATE_ID) {
    return [
      irStep("base-case", "base-case", "if (!node) return baseValue", "branch"),
      irStep("branch", "select-neighbors", "for (const next of neighbors)", "loop"),
      irStep("prune", "prune", "if (visited.has(next)) continue", "branch"),
      irStep("traverse", "traverse", "stack.push(next)", "update"),
      irStep("aggregate", "aggregate", "return out", "return"),
    ];
  }

  if (templateId === DP_STATE_TEMPLATE_ID) {
    return [
      irStep("base-state", "init-base-state", "const dp = new Array(n + 1).fill(0)", "declare"),
      irStep("subproblem", "iterate-states", "for (let i = 1; i <= n; i++)", "loop"),
      irStep("state-guard", "guard-transition", "skip invalid transitions", "branch"),
      irStep("transition", "apply-transition", "dp[i] = Math.max(dp[i], dp[i - 1])", "update"),
      irStep("memoize", "return-dp", "return dp[n]", "return"),
    ];
  }

  return [
    irStep("setup", "init-state", "let answer = 0", "declare"),
    irStep("loop", "iterate", "for (const item of input)", "loop"),
    irStep("update", "update", "answer += item", "update"),
    irStep("check", "check", "if (answer > best) best = answer", "branch"),
    irStep("return", "return", "return answer", "return"),
  ];
}

import { PATTERN_TO_TEMPLATES, UNIVERSAL_TEMPLATE } from "../templates";
import {
  ARRAY_HASHING_TEMPLATE_ID,
  BACKTRACKING_TEMPLATE_ID,
  BINARY_SEARCH_TEMPLATE_ID,
  DEFAULT_BLUEPRINT_TEMPLATE_ID,
  DP_STATE_TEMPLATE_ID,
  INTERVAL_GREEDY_TEMPLATE_ID,
  LINKED_LIST_TEMPLATE_ID,
  RECURSIVE_TOP_DOWN_TEMPLATE_ID,
  SLIDING_WINDOW_TEMPLATE_ID,
  STACK_HEAP_TEMPLATE_ID,
  TEMPLATE_CANONICAL_SLOT_ROLE_MAP,
  TEMPLATE_CLASSIFICATION_FAMILY,
  TREE_GRAPH_TEMPLATE_ID,
  TWO_POINTERS_TEMPLATE_ID,
} from "./templates";
import { getQuestionTemplateId } from "./taxonomy";

const DIFFICULTY_TEMPLATE_INDEX = {
  Tutorial: 0,
  Easy: 0,
  Practice: 1,
  Medium: 1,
  Boss: 2,
  Hard: 2,
};

export const QUESTION_TEMPLATE_VARIANT_BY_ID = {
  57: 2,
  58: 2,
  59: 3,
  60: 3,
  80: 0,
  81: 2,
  82: 3,
  83: 1,
  84: 4,
  85: 1,
  86: 0,
  87: 2,
};

export const PATTERN_TEMPLATE_VARIANT_RULES = {
  "Topological Sort": 2,
  "Union Find / DFS": 3,
};

function clampTemplateIndex(index, total) {
  if (total <= 0) return 0;
  if (!Number.isInteger(index) || index < 0) return 0;
  return Math.min(index, total - 1);
}

function resolveTemplateVariantIndex(question, templates) {
  const total = templates.length;
  if (!total) return 0;
  const questionId = Number(question?.id);
  if (Number.isInteger(QUESTION_TEMPLATE_VARIANT_BY_ID[questionId])) {
    return clampTemplateIndex(QUESTION_TEMPLATE_VARIANT_BY_ID[questionId], total);
  }

  const patternRule = PATTERN_TEMPLATE_VARIANT_RULES[question?.pattern];
  if (Number.isInteger(patternRule)) {
    return clampTemplateIndex(patternRule, total);
  }
  if (typeof patternRule === "function") {
    return clampTemplateIndex(patternRule(question, templates), total);
  }

  return clampTemplateIndex(DIFFICULTY_TEMPLATE_INDEX[question?.difficulty] || 0, total);
}

export const FALLBACK_CODE_BY_TEMPLATE_ID = {
  [DEFAULT_BLUEPRINT_TEMPLATE_ID]: `state = init()
best = init_best()
for item in items:
    update_state(state, item)
    if improves_answer(state, best):
        best = extract_answer(state)
return best`,
  [ARRAY_HASHING_TEMPLATE_ID]: `state = init_map_or_set()
for value in values:
    if has_match(state, value):
        return build_answer(state, value)
    record(state, value)
return finalize(state)`,
  [TWO_POINTERS_TEMPLATE_ID]: `left, right = init_pointers()
while left < right:
    score = evaluate(left, right)
    if done(score):
        return emit(left, right)
    left, right = shift(left, right, score)
return fallback_answer()`,
  [SLIDING_WINDOW_TEMPLATE_ID]: `left = 0
state = init_window()
for right in range(len(data)):
    add(data[right], state)
    while invalid(state):
        remove(data[left], state)
        left += 1
    update_best(state, left, right)
return emit_best(state)`,
  [STACK_HEAP_TEMPLATE_ID]: `structure = init_structure()
for item in items:
    while should_resolve(structure, item):
        resolve(structure, item)
    push_item(structure, item)
return emit(structure)`,
  [BINARY_SEARCH_TEMPLATE_ID]: `left, right = initial_bounds()
while left <= right:
    mid = (left + right) // 2
    if is_answer(mid):
        return emit(mid)
    left, right = move_bounds(left, right, mid)
return not_found()`,
  [LINKED_LIST_TEMPLATE_ID]: `prev = init_prev()
cur = head
while cur:
    if should_relink(cur):
        relink(prev, cur)
    prev, cur = advance(prev, cur)
return emit_head()`,
  [INTERVAL_GREEDY_TEMPLATE_ID]: `ordered = sort_candidates(items)
state = init_result()
for item in ordered:
    if conflicts(state, item):
        continue
    commit(state, item)
return emit(state)`,
  [BACKTRACKING_TEMPLATE_ID]: `results = []
path = []

def backtrack(start):
    if complete(path):
        results.append(path[:])
        return
    for choice in choices(start):
        if not valid(choice):
            continue
        path.append(choice)
        backtrack(next_start(choice))
        path.pop()

backtrack(0)
return results`,
  [RECURSIVE_TOP_DOWN_TEMPLATE_ID]: `memo = {}

def solve(node):
    if base_case(node):
        return base_value
    if node in memo:
        return memo[node]
    result = init_result()
    for nxt in children(node):
        if invalid(nxt):
            continue
        result = combine(result, solve(nxt))
    memo[node] = result
    return memo[node]`,
  [TREE_GRAPH_TEMPLATE_ID]: `seen = set()

def traverse(node):
    if base_case(node):
        return base_value
    if node in seen:
        return skip_value
    seen.add(node)
    result = init_result()
    for nxt in neighbors(node):
        if invalid(nxt):
            continue
        result = aggregate(result, traverse(nxt))
    return result`,
  [DP_STATE_TEMPLATE_ID]: `memo = {}

def solve(state):
    if base_state(state):
        return base_value
    if state in memo:
        return memo[state]
    best = init_value()
    for prev in subproblems(state):
        if invalid(prev):
            continue
        best = transition(best, solve(prev))
    memo[state] = best
    return best`,
};

export function getTemplateSnippetForQuestion(question, explicitTemplateId = null) {
  const templateId = explicitTemplateId || getQuestionTemplateId(question);
  const patternEntry = PATTERN_TO_TEMPLATES[question?.pattern];
  const templates = patternEntry?.templates || [];

  if (!templates.length) {
    return {
      code: FALLBACK_CODE_BY_TEMPLATE_ID[templateId] || UNIVERSAL_TEMPLATE.code,
      name: "fallback template",
      templateId,
    };
  }

  const preferredIndex = resolveTemplateVariantIndex(question, templates);
  const selected = templates[preferredIndex] || templates[0];
  return {
    code: selected.code || FALLBACK_CODE_BY_TEMPLATE_ID[templateId] || UNIVERSAL_TEMPLATE.code,
    name: selected.name || patternEntry?.category || question?.pattern || "template",
    templateId,
  };
}

export function extractCodeLines(code) {
  return String(code || "")
    .split("\n")
    .map((line) => line.replace(/\r/g, "").replace(/\s+$/g, "").trim())
    .filter((line) => line.length > 0)
    .filter((line) => !line.startsWith("#"))
    .filter((line) => line !== "pass");
}

function isLoopLine(lower) {
  return lower.startsWith("for ") || lower.startsWith("while ");
}

function isConditionLine(lower) {
  return lower.startsWith("if ") || lower.startsWith("elif ") || lower.startsWith("else");
}

function isReturnLine(lower) {
  return lower.startsWith("return");
}

function classifyStandardLine(line, context) {
  const lower = line.toLowerCase();
  if (isReturnLine(lower)) return "return";
  if (isLoopLine(lower)) {
    context.seenLoop = true;
    return "loop";
  }
  if (isConditionLine(lower) || lower === "continue" || lower === "break") return "check";
  if (!context.seenLoop) return "setup";
  return "update";
}

function classifyBacktrackingLine(line) {
  const lower = line.toLowerCase();

  if (isReturnLine(lower)) {
    if (/\b(ans|results|res|output)\b/.test(lower)) return "return";
    return "base";
  }
  if (
    lower.startsWith("if done") ||
    lower.startsWith("if complete") ||
    lower.startsWith("if base") ||
    lower.includes("ans.append") ||
    lower.includes("results.append")
  ) {
    return "base";
  }
  if (isLoopLine(lower) || lower.includes("choices(") || lower.includes("choices_from(")) return "choose";
  if (
    lower === "continue" ||
    lower.startsWith("if not ") ||
    lower.includes("not allowed") ||
    lower.includes("invalid") ||
    lower.includes("out_of_bounds") ||
    lower.includes("bad_cell")
  ) {
    return "constrain";
  }
  return "explore";
}

function classifyRecursiveTopDownLine(line, context) {
  const lower = line.toLowerCase();

  if (isReturnLine(lower)) {
    if (
      lower.includes("combine") ||
      lower.includes("len(") ||
      lower.includes("order") ||
      lower.includes("best") ||
      lower.includes("ans") ||
      lower.includes("dp[") ||
      lower.includes("memo[") ||
      lower.includes("tails")
    ) {
      return "combine";
    }
    return "base";
  }
  if (isConditionLine(lower)) {
    if (
      lower.includes("invalid") ||
      lower.includes("out_of_bounds") ||
      lower.includes("bad_cell") ||
      lower.includes("not allowed") ||
      lower.includes("cycle")
    ) {
      return "constrain";
    }
    return "base";
  }
  if (isLoopLine(lower)) return context.seenExplore ? "explore" : "choose";
  if (lower.includes("dfs(") || lower.includes("bfs(") || lower.includes("solve(") || lower.includes("search(") || lower.includes("ok(")) {
    context.seenExplore = true;
    return "explore";
  }
  if (
    lower.includes("memo") ||
    lower.includes("dp[") ||
    lower.includes("graph") ||
    lower.includes("adj") ||
    lower.includes("queue") ||
    lower.includes("stack")
  ) {
    return "choose";
  }
  if (lower.includes("combine") || lower.includes("append") || lower.includes("max(") || lower.includes("min(")) {
    return "combine";
  }
  return context.seenExplore ? "combine" : "choose";
}

export function classifyLineForTemplate(templateId, line, context) {
  const family = TEMPLATE_CLASSIFICATION_FAMILY[templateId] || "standard";
  const slotMap = TEMPLATE_CANONICAL_SLOT_ROLE_MAP[templateId] || TEMPLATE_CANONICAL_SLOT_ROLE_MAP[DEFAULT_BLUEPRINT_TEMPLATE_ID];

  let canonicalSlot = "setup";
  if (family === "backtracking") canonicalSlot = classifyBacktrackingLine(line);
  else if (family === "recursive") canonicalSlot = classifyRecursiveTopDownLine(line, context);
  else canonicalSlot = classifyStandardLine(line, context);

  return slotMap[canonicalSlot] || canonicalSlot;
}

export function buildTemplateIrForQuestion(question, explicitTemplateId = null) {
  const templateId = explicitTemplateId || getQuestionTemplateId(question);
  const snippet = getTemplateSnippetForQuestion(question, templateId);
  const lines = extractCodeLines(snippet.code);
  const fallbackLines = lines.length ? lines : extractCodeLines(FALLBACK_CODE_BY_TEMPLATE_ID[templateId] || UNIVERSAL_TEMPLATE.code);
  const context = { seenLoop: false, seenExplore: false };

  const irNodes = fallbackLines.map((line, index) => {
    const slot = classifyLineForTemplate(templateId, line, context);
    return {
      slot,
      key: `auto-${slot}-${index + 1}`,
      text: line,
      op: "step",
    };
  });

  return {
    templateId,
    snippetName: snippet.name,
    irNodes,
  };
}

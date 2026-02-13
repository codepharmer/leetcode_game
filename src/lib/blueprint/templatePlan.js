import { PATTERN_TO_TEMPLATES, UNIVERSAL_TEMPLATE } from "../templates";
import {
  BACKTRACKING_TEMPLATE_ID,
  DEFAULT_BLUEPRINT_TEMPLATE_ID,
  RECURSIVE_TOP_DOWN_TEMPLATE_ID,
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

export const FALLBACK_CODE_BY_TEMPLATE_ID = {
  [DEFAULT_BLUEPRINT_TEMPLATE_ID]: `state = init()
best = init_best()
for item in items:
    update_state(state, item)
    if improves_answer(state, best):
        best = extract_answer(state)
return best`,
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

  const preferredIndex = DIFFICULTY_TEMPLATE_INDEX[question?.difficulty] || 0;
  const selected = templates[Math.min(preferredIndex, templates.length - 1)] || templates[0];
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
  if (templateId === BACKTRACKING_TEMPLATE_ID) return classifyBacktrackingLine(line);
  if (templateId === RECURSIVE_TOP_DOWN_TEMPLATE_ID) return classifyRecursiveTopDownLine(line, context);
  return classifyStandardLine(line, context);
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

import { GAME_TYPES } from "./constants";
import { BLUEPRINT_LEVELS } from "./blueprint/levels";
import { getPatternIndex, getQuestionToPatternItems, getTemplateToPatternItems } from "./content/registry";
import { genChoices, genChoicesWithConfusions } from "./utils";

const QUESTION_ITEMS = getQuestionToPatternItems().map((item) => {
  const canonicalPattern = item.pattern;
  const answerPattern = String(item.solutionPattern || "").trim() || canonicalPattern;

  return Object.freeze({
    ...item,
    pattern: answerPattern,
    templatePattern: canonicalPattern,
  });
});
const QUESTION_PATTERNS = Object.freeze([...new Set(QUESTION_ITEMS.map((item) => item.pattern))].sort());
const TEMPLATE_ITEMS = getTemplateToPatternItems();
const { patterns: ALL_PATTERNS, confusionMap: PATTERN_CONFUSION_MAP } = getPatternIndex();

const GAME_TYPE_CONFIG = {
  [GAME_TYPES.QUESTION_TO_PATTERN]: {
    value: GAME_TYPES.QUESTION_TO_PATTERN,
    label: "question -> pattern",
    menuSubtitle: "Map Blind 75 questions to their solution patterns",
    roundNoun: "questions",
    promptLabel: "What pattern solves this?",
    browseTitle: "All Patterns",
    items: QUESTION_ITEMS,
    allPatterns: QUESTION_PATTERNS,
    buildChoices: (correctPattern) => genChoices(correctPattern, QUESTION_PATTERNS),
    revealTemplateAfterAnswer: true,
  },
  [GAME_TYPES.TEMPLATE_TO_PATTERN]: {
    value: GAME_TYPES.TEMPLATE_TO_PATTERN,
    label: "template -> pattern",
    menuSubtitle: "Match code snippets to their strongest solution patterns",
    roundNoun: "snippets",
    promptLabel: "Which pattern is this template most connected to?",
    browseTitle: "Pattern Snippets",
    items: TEMPLATE_ITEMS,
    allPatterns: ALL_PATTERNS,
    buildChoices: (correctPattern) => genChoicesWithConfusions(correctPattern, ALL_PATTERNS, PATTERN_CONFUSION_MAP),
    revealTemplateAfterAnswer: false,
    supportsBrowse: true,
    supportsTemplates: true,
  },
  [GAME_TYPES.BLUEPRINT_BUILDER]: {
    value: GAME_TYPES.BLUEPRINT_BUILDER,
    label: "blueprint builder",
    menuSubtitle: "Build algorithm blueprints card by card and step through execution traces",
    roundNoun: "levels",
    promptLabel: "",
    browseTitle: "",
    items: BLUEPRINT_LEVELS,
    allPatterns: [],
    buildChoices: () => [],
    revealTemplateAfterAnswer: false,
    supportsBrowse: false,
    supportsTemplates: false,
    supportsDifficultyFilter: false,
    supportsQuestionCount: false,
  },
};

export const GAME_TYPE_OPTIONS = [
  GAME_TYPE_CONFIG[GAME_TYPES.QUESTION_TO_PATTERN],
  GAME_TYPE_CONFIG[GAME_TYPES.TEMPLATE_TO_PATTERN],
  GAME_TYPE_CONFIG[GAME_TYPES.BLUEPRINT_BUILDER],
];

export function getGameTypeConfig(gameType) {
  return GAME_TYPE_CONFIG[gameType] || GAME_TYPE_CONFIG[GAME_TYPES.QUESTION_TO_PATTERN];
}

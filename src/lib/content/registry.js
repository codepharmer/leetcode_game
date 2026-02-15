import { QUESTION_CONTRACTS, getQuestionContract } from "../blueprint/contracts";
import { selectBlueprintStrategy } from "../blueprint/strategyRegistry";
import { getQuestionBlueprintProfile } from "../blueprint/taxonomy";
import { ALL_PATTERNS, QUESTIONS } from "../questions";
import { PATTERN_CONFUSION_MAP, TEMPLATE_QUESTIONS } from "../templateQuestions";
import { PATTERN_TO_TEMPLATES } from "../templates";

const CANONICAL_DIFFICULTIES = new Set(["Easy", "Medium", "Hard"]);

const PATTERN_NORMALIZATION_POLICY = Object.freeze({
  key: "exact-trimmed-match",
  description: "Pattern keys are case-sensitive exact matches after trim. No aliases or fuzzy matching.",
});

function normalizePatternKey(pattern) {
  return String(pattern ?? "").trim();
}

function freezeConfusionMap(confusionMap) {
  return Object.freeze(
    Object.fromEntries(
      Object.entries(confusionMap || {}).map(([pattern, confusions]) => [pattern, Object.freeze([...(confusions || [])])])
    )
  );
}

function collectDuplicateValues(values) {
  const seen = new Set();
  const duplicates = new Set();

  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }

  return [...duplicates];
}

const QUESTION_IDS = QUESTIONS.map((question) => Number(question.id));
const DUPLICATE_QUESTION_IDS = collectDuplicateValues(QUESTION_IDS).sort((a, b) => a - b);

const TEMPLATE_ITEM_IDS = TEMPLATE_QUESTIONS.map((item) => String(item.id));
const DUPLICATE_TEMPLATE_ITEM_IDS = collectDuplicateValues(TEMPLATE_ITEM_IDS).sort();

const CANONICAL_QUESTION_IDS = new Set(QUESTION_IDS);
const CANONICAL_TEMPLATE_ITEM_IDS = new Set(TEMPLATE_ITEM_IDS);

const TEMPLATE_SNIPPETS_BY_PATTERN = new Map();
for (const snippet of TEMPLATE_QUESTIONS) {
  const pattern = normalizePatternKey(snippet.pattern);
  if (!TEMPLATE_SNIPPETS_BY_PATTERN.has(pattern)) TEMPLATE_SNIPPETS_BY_PATTERN.set(pattern, []);
  TEMPLATE_SNIPPETS_BY_PATTERN.get(pattern).push(snippet);
}

const QUESTION_IDS_BY_PATTERN = new Map();
for (const question of QUESTIONS) {
  const pattern = normalizePatternKey(question.pattern);
  if (!QUESTION_IDS_BY_PATTERN.has(pattern)) QUESTION_IDS_BY_PATTERN.set(pattern, []);
  QUESTION_IDS_BY_PATTERN.get(pattern).push(Number(question.id));
}

const QUESTIONS_BY_ID = new Map();
const BLUEPRINT_SEEDS_BY_QUESTION_ID = new Map();

for (const question of QUESTIONS) {
  const questionId = Number(question.id);
  const contract = getQuestionContract(question);
  const blueprintProfile = Object.freeze({ ...getQuestionBlueprintProfile(question) });
  const selectedStrategy = contract ? selectBlueprintStrategy(contract) : null;
  const templateSnippets = TEMPLATE_SNIPPETS_BY_PATTERN.get(normalizePatternKey(question.pattern)) || [];
  const templateLibrary = PATTERN_TO_TEMPLATES[normalizePatternKey(question.pattern)] || null;

  const registryQuestion = Object.freeze({
    ...question,
    templateMetadata: Object.freeze({
      category: templateLibrary?.category || null,
      templateCount: templateLibrary?.templates?.length || 0,
      snippetIds: Object.freeze(templateSnippets.map((snippet) => snippet.id)),
    }),
    blueprintMetadata: Object.freeze({
      wave: blueprintProfile.wave,
      archetypeId: blueprintProfile.archetypeId,
      templateId: blueprintProfile.templateId,
      strategyFamilyId: blueprintProfile.strategyId,
      contractId: contract?.id || null,
      contractStrategyId: contract?.strategyId || null,
      selectedStrategyId: selectedStrategy?.id || null,
    }),
  });

  const blueprintSeed = Object.freeze({
    questionId,
    question: registryQuestion,
    contract,
    blueprintProfile,
    selectedStrategyId: selectedStrategy?.id || null,
    templateSnippetIds: Object.freeze(templateSnippets.map((snippet) => snippet.id)),
  });

  QUESTIONS_BY_ID.set(questionId, registryQuestion);
  BLUEPRINT_SEEDS_BY_QUESTION_ID.set(questionId, blueprintSeed);
}

const PATTERN_ENTRIES = Object.freeze(
  [...ALL_PATTERNS].map((pattern) => {
    const key = normalizePatternKey(pattern);
    const templateLibrary = PATTERN_TO_TEMPLATES[key] || null;
    const templateSnippets = TEMPLATE_SNIPPETS_BY_PATTERN.get(key) || [];
    const questionIds = QUESTION_IDS_BY_PATTERN.get(key) || [];

    return Object.freeze({
      pattern: key,
      questionIds: Object.freeze([...questionIds]),
      templateQuestionIds: Object.freeze(templateSnippets.map((snippet) => snippet.id)),
      templateCategory: templateLibrary?.category || null,
      templateCount: templateLibrary?.templates?.length || 0,
      confusionPatterns: Object.freeze([...(PATTERN_CONFUSION_MAP[key] || [])]),
    });
  })
);

const PATTERN_INDEX_BY_PATTERN = Object.freeze(
  Object.fromEntries(PATTERN_ENTRIES.map((entry) => [entry.pattern, entry]))
);

const FROZEN_PATTERN_CONFUSION_MAP = freezeConfusionMap(PATTERN_CONFUSION_MAP);

const PATTERN_INDEX = Object.freeze({
  normalizationPolicy: PATTERN_NORMALIZATION_POLICY,
  patterns: Object.freeze(PATTERN_ENTRIES.map((entry) => entry.pattern)),
  entries: PATTERN_ENTRIES,
  byPattern: PATTERN_INDEX_BY_PATTERN,
  confusionMap: FROZEN_PATTERN_CONFUSION_MAP,
});

const QUESTION_TO_PATTERN_ITEMS = Object.freeze(
  QUESTIONS.map((question) =>
    Object.freeze({
      ...question,
      title: question.name,
      promptKind: "question",
    })
  )
);

const TEMPLATE_TO_PATTERN_ITEMS = Object.freeze(
  TEMPLATE_QUESTIONS.map((snippet) =>
    Object.freeze({
      ...snippet,
      promptKind: "code",
    })
  )
);

const CONTENT_REGISTRY_INVARIANTS = Object.freeze([
  "question IDs are unique positive integers",
  "template question IDs are unique",
  "question patterns use exact trimmed canonical keys",
  "question difficulties are valid",
  "template mapping patterns reference canonical question patterns",
  "blueprint seed exists for every canonical question ID",
  "blueprint contracts do not reference orphan question IDs",
  "pattern index does not project orphan question IDs",
  "pattern index does not project orphan template IDs",
]);

function validateQuestionPatterns(errors) {
  for (const question of QUESTIONS) {
    const normalized = normalizePatternKey(question.pattern);
    if (!normalized) {
      errors.push(`Invariant[question-pattern-non-empty] Question ${question.id} has an empty pattern key.`);
      continue;
    }
    if (normalized !== question.pattern) {
      errors.push(
        `Invariant[pattern-normalization] Question ${question.id} pattern "${question.pattern}" must match trimmed canonical key "${normalized}".`
      );
    }
    if (!PATTERN_INDEX_BY_PATTERN[normalized]) {
      errors.push(
        `Invariant[question-pattern-canonical] Question ${question.id} pattern "${normalized}" is missing from canonical pattern index.`
      );
    }
  }
}

function validateQuestionDifficulties(errors) {
  for (const question of QUESTIONS) {
    if (!CANONICAL_DIFFICULTIES.has(question.difficulty)) {
      errors.push(
        `Invariant[question-difficulty] Question ${question.id} has invalid difficulty "${question.difficulty}".`
      );
    }
  }
}

function validateTemplateMappings(errors) {
  for (const snippet of TEMPLATE_QUESTIONS) {
    const pattern = normalizePatternKey(snippet.pattern);
    if (!PATTERN_INDEX_BY_PATTERN[pattern]) {
      errors.push(
        `Invariant[template-pattern-canonical] Template snippet ${snippet.id} pattern "${pattern}" is not a canonical pattern.`
      );
    }
  }

  for (const pattern of Object.keys(PATTERN_TO_TEMPLATES)) {
    if (!PATTERN_INDEX_BY_PATTERN[pattern]) {
      errors.push(`Invariant[template-library-canonical] Template library pattern "${pattern}" is not canonical.`);
    }
  }
}

function validateBlueprintMappings(errors) {
  for (const question of QUESTIONS) {
    const seed = BLUEPRINT_SEEDS_BY_QUESTION_ID.get(Number(question.id));
    if (!seed) {
      errors.push(`Invariant[blueprint-seed-coverage] Missing blueprint seed for question ${question.id}.`);
      continue;
    }
    if (!seed.contract || Number(seed.contract.questionId) !== Number(question.id)) {
      errors.push(
        `Invariant[blueprint-contract-link] Missing or invalid blueprint contract link for question ${question.id}.`
      );
    }
    if (!seed.blueprintProfile || !seed.blueprintProfile.templateId) {
      errors.push(`Invariant[blueprint-profile-link] Missing blueprint profile template for question ${question.id}.`);
    }
  }

  for (const contract of QUESTION_CONTRACTS) {
    const questionId = Number(contract?.questionId);
    if (!CANONICAL_QUESTION_IDS.has(questionId)) {
      errors.push(`Invariant[blueprint-contract-orphan] Contract ${contract?.id} references orphan questionId ${questionId}.`);
    }
  }
}

function validatePatternIndexProjections(errors) {
  for (const entry of PATTERN_ENTRIES) {
    for (const questionId of entry.questionIds) {
      if (!CANONICAL_QUESTION_IDS.has(Number(questionId))) {
        errors.push(`Invariant[pattern-index-question-orphan] Pattern ${entry.pattern} references orphan questionId ${questionId}.`);
      }
    }

    for (const templateId of entry.templateQuestionIds) {
      if (!CANONICAL_TEMPLATE_ITEM_IDS.has(String(templateId))) {
        errors.push(`Invariant[pattern-index-template-orphan] Pattern ${entry.pattern} references orphan templateId ${templateId}.`);
      }
    }
  }
}

export function getQuestionToPatternItems() {
  return QUESTION_TO_PATTERN_ITEMS;
}

export function getTemplateToPatternItems() {
  return TEMPLATE_TO_PATTERN_ITEMS;
}

export function getBlueprintSeedByQuestionId(questionId) {
  const normalizedQuestionId = Number(questionId);
  if (!Number.isInteger(normalizedQuestionId) || normalizedQuestionId <= 0) return null;
  return BLUEPRINT_SEEDS_BY_QUESTION_ID.get(normalizedQuestionId) || null;
}

export function getPatternIndex() {
  return PATTERN_INDEX;
}

export function validateContentRegistry() {
  const errors = [];

  if (DUPLICATE_QUESTION_IDS.length > 0) {
    errors.push(`Invariant[question-id-unique] Duplicate question IDs found: ${DUPLICATE_QUESTION_IDS.join(", ")}.`);
  }

  if (DUPLICATE_TEMPLATE_ITEM_IDS.length > 0) {
    errors.push(
      `Invariant[template-id-unique] Duplicate template snippet IDs found: ${DUPLICATE_TEMPLATE_ITEM_IDS.join(", ")}.`
    );
  }

  if (QUESTIONS_BY_ID.size !== QUESTIONS.length) {
    errors.push(
      `Invariant[question-registry-coverage] Question registry size ${QUESTIONS_BY_ID.size} does not match canonical size ${QUESTIONS.length}.`
    );
  }

  for (const questionId of CANONICAL_QUESTION_IDS) {
    if (!QUESTIONS_BY_ID.has(questionId)) {
      errors.push(`Invariant[question-registry-coverage] Missing question registry entry for questionId ${questionId}.`);
    }
  }

  validateQuestionPatterns(errors);
  validateQuestionDifficulties(errors);
  validateTemplateMappings(errors);
  validateBlueprintMappings(errors);
  validatePatternIndexProjections(errors);

  return {
    valid: errors.length === 0,
    errors,
    invariantCount: CONTENT_REGISTRY_INVARIANTS.length,
    invariants: CONTENT_REGISTRY_INVARIANTS,
    patternNormalizationPolicy: PATTERN_NORMALIZATION_POLICY,
    fallbackBehavior: Object.freeze({
      missingTemplateLink: "question.templateMetadata defaults to category=null, templateCount=0, snippetIds=[]",
      missingBlueprintLink: "getBlueprintSeedByQuestionId(questionId) returns null for unknown IDs",
    }),
  };
}

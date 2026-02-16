const RESERVED_IDENTIFIERS = new Set([
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "export",
  "extends",
  "finally",
  "for",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "let",
  "new",
  "return",
  "switch",
  "throw",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  "yield",
  "await",
  "this",
  "super",
  "true",
  "false",
  "null",
  "undefined",
  "of",
]);

export const DEFAULT_ALLOWED_IDENTIFIERS = [
  "Array",
  "Map",
  "Set",
  "Math",
  "Number",
  "String",
  "Boolean",
  "Object",
  "JSON",
  "Date",
  "RegExp",
  "Infinity",
  "NaN",
  "parseInt",
  "parseFloat",
  "isNaN",
  "isFinite",
  "console",
];

function normalizeIdentifier(value) {
  const text = String(value || "").trim();
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(text)) return "";
  return text;
}

function isCodeLikeText(text) {
  const source = String(text || "").trim();
  if (!source) return false;

  if (/^(const|let|var|if|else|for|while|return|switch|try|catch|throw|break|continue)\b/.test(source)) {
    if (/\s#/.test(source) && !/[=()[\]{}.;]/.test(source)) return false;
    return true;
  }
  return /[=(){}\[\].<>:+\-*%]/.test(source);
}

function buildIdentifierSet(values) {
  const out = new Set();
  for (const value of values || []) {
    const normalized = normalizeIdentifier(value);
    if (!normalized) continue;
    out.add(normalized);
  }
  return out;
}

function collectPropertyIdentifiers(text) {
  const out = new Set();
  const pattern = /(?:\.|\?\.)\s*([A-Za-z_$][A-Za-z0-9_$]*)/g;
  let match = pattern.exec(text);
  while (match) {
    const name = normalizeIdentifier(match[1]);
    if (name) out.add(name);
    match = pattern.exec(text);
  }
  return out;
}

function collectIdentifierTokens(text) {
  return String(text || "").match(/[A-Za-z_$][A-Za-z0-9_$]*/g) || [];
}

export function extractDeclaredIdentifiers(text) {
  const source = String(text || "");
  if (!isCodeLikeText(source)) return [];
  const declared = new Set();
  const patterns = [
    /\b(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)/g,
    /\bfor\s*\(\s*(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)/g,
  ];

  for (const pattern of patterns) {
    let match = pattern.exec(source);
    while (match) {
      const name = normalizeIdentifier(match[1]);
      if (name) declared.add(name);
      match = pattern.exec(source);
    }
  }

  return [...declared];
}

export function extractReferencedIdentifiers(text) {
  const source = String(text || "");
  if (!isCodeLikeText(source)) return [];
  const declared = buildIdentifierSet(extractDeclaredIdentifiers(source));
  const properties = collectPropertyIdentifiers(source);
  const references = new Set();

  for (const token of collectIdentifierTokens(source)) {
    const name = normalizeIdentifier(token);
    if (!name) continue;
    if (declared.has(name)) continue;
    if (properties.has(name)) continue;
    if (RESERVED_IDENTIFIERS.has(name)) continue;
    if (DEFAULT_ALLOWED_IDENTIFIERS.includes(name)) continue;
    references.add(name);
  }

  return [...references];
}

export function collectExternalIdentifiersFromTests(testCases) {
  const out = new Set();
  for (const testCase of testCases || []) {
    const input = testCase?.input;
    if (!input || typeof input !== "object" || Array.isArray(input)) continue;
    for (const key of Object.keys(input)) {
      const name = normalizeIdentifier(key);
      if (name) out.add(name);
    }
  }
  return [...out];
}

export function buildOrderedCardEntries(slotIds, slots) {
  const ordered = [];
  for (const slotId of slotIds || []) {
    const items = Array.isArray(slots?.[slotId]) ? slots[slotId] : [];
    for (let index = 0; index < items.length; index += 1) {
      ordered.push({
        card: items[index],
        slotId,
        indexInSlot: index,
        globalIndex: ordered.length,
      });
    }
  }
  return ordered;
}

export function analyzeCardDependencies({
  slotIds,
  slots,
  externalIdentifiers = [],
  extraAllowedIdentifiers = [],
}) {
  const allowed = new Set([
    ...DEFAULT_ALLOWED_IDENTIFIERS,
    ...buildIdentifierSet(externalIdentifiers),
    ...buildIdentifierSet(extraAllowedIdentifiers),
  ]);
  const available = new Set(allowed);
  const declarationSites = {};
  const byCardId = {};
  const ordered = buildOrderedCardEntries(slotIds, slots);

  for (const entry of ordered) {
    const cardId = String(entry.card?.id || "");
    if (!cardId) continue;
    const declared = extractDeclaredIdentifiers(entry.card?.text || "");
    const referenced = extractReferencedIdentifiers(entry.card?.text || "");
    const missing = referenced.filter((name) => !available.has(name));

    byCardId[cardId] = {
      cardId,
      slotId: entry.slotId,
      indexInSlot: entry.indexInSlot,
      globalIndex: entry.globalIndex,
      declared,
      referenced,
      missing,
    };

    for (const name of declared) {
      if (!declarationSites[name]) {
        declarationSites[name] = {
          identifier: name,
          cardId,
          slotId: entry.slotId,
          indexInSlot: entry.indexInSlot,
          globalIndex: entry.globalIndex,
        };
      }
      available.add(name);
    }
  }

  return {
    ordered,
    byCardId,
    declarationSites,
    availableIdentifiers: [...available],
  };
}

function getSlotDisplayName(slotId, slotNameById) {
  const slotName = String(slotNameById?.[slotId] || slotId || "").trim();
  return slotName || "this slot";
}

export function buildMissingDependencyMessage(identifier, declarationSite, slotNameById) {
  if (!identifier) return "";
  if (declarationSite?.slotId) {
    return `\`${identifier}\` isn't defined until ${getSlotDisplayName(declarationSite.slotId, slotNameById)}.`;
  }
  return `\`${identifier}\` is not declared in this blueprint.`;
}

export function buildDependencyWarningForCard(cardId, dependencyAnalysis, slotNameById) {
  const cardKey = String(cardId || "");
  if (!cardKey) return "";
  const details = dependencyAnalysis?.byCardId?.[cardKey];
  if (!details?.missing?.length) return "";
  const identifier = details.missing[0];
  return buildMissingDependencyMessage(identifier, dependencyAnalysis?.declarationSites?.[identifier], slotNameById);
}

export function simulateCardPlacement(slots, card, targetSlotId) {
  const cardId = String(card?.id || "");
  if (!cardId || !targetSlotId) return slots || {};

  const nextSlots = {};
  for (const [slotId, items] of Object.entries(slots || {})) {
    nextSlots[slotId] = (items || []).filter((item) => String(item?.id || "") !== cardId);
  }
  nextSlots[targetSlotId] = [...(nextSlots[targetSlotId] || []), card];
  return nextSlots;
}

export function buildCardPlacementFeedback({
  level,
  slots,
  slotIds,
  slotNameById,
  dependencyAnalysis,
}) {
  const canonicalByCardId = new Map(
    (level?.cards || [])
      .filter((card) => card?.correctSlot)
      .map((card) => [
        String(card.id),
        {
          slotId: String(card.correctSlot),
          order: Number(card.correctOrder || 0),
        },
      ])
  );
  const feedbackByCardId = {};
  const ordered = buildOrderedCardEntries(slotIds, slots);

  for (const entry of ordered) {
    const cardId = String(entry.card?.id || "");
    if (!cardId || !canonicalByCardId.has(cardId)) continue;
    const expected = canonicalByCardId.get(cardId);

    let status = "correct";
    if (entry.slotId !== expected.slotId) status = "wrong-phase";
    else if (entry.indexInSlot !== expected.order) status = "misplaced";

    const dependencyMessage = buildDependencyWarningForCard(cardId, dependencyAnalysis, slotNameById);
    let reason = "";
    if (status === "wrong-phase") {
      reason = `Belongs in ${getSlotDisplayName(expected.slotId, slotNameById)}.`;
    } else if (status === "misplaced") {
      reason = "Right phase, wrong position.";
    }
    if (dependencyMessage) {
      reason = reason ? `${reason} ${dependencyMessage}` : dependencyMessage;
    }

    feedbackByCardId[cardId] = { status, reason };
  }

  return feedbackByCardId;
}

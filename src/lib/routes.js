import { GAME_TYPES, MODES } from "./constants";

export const ROUTES = {
  MENU: "/",
  PLAY: "/play",
  RESULTS: "/results",
  REVIEW: "/review",
  BROWSE: "/browse",
  TEMPLATES: "/templates",
  BLUEPRINT: "/blueprint",
};

export const BLUEPRINT_ROUTE_SEGMENTS = {
  DAILY: "daily",
  WORLD: "world",
  CHALLENGE: "challenge",
};

const VALID_GAME_TYPES = new Set(Object.values(GAME_TYPES));
const VALID_DIFFICULTIES = new Set(["All", "Easy", "Medium", "Hard"]);

export const DEFAULT_ROUTE_SETTINGS = {
  gameType: GAME_TYPES.QUESTION_TO_PATTERN,
  filterDifficulty: "All",
  totalQuestions: 20,
  browseFilter: "All",
};

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function normalizeGameType(value) {
  if (VALID_GAME_TYPES.has(value)) return value;
  return DEFAULT_ROUTE_SETTINGS.gameType;
}

function normalizeDifficulty(value, fallback) {
  if (VALID_DIFFICULTIES.has(value)) return value;
  return fallback;
}

export function parseRouteSettings(search) {
  const params = new URLSearchParams(search || "");
  const gameType = normalizeGameType(params.get("gameType"));
  const filterDifficulty = normalizeDifficulty(params.get("difficulty"), DEFAULT_ROUTE_SETTINGS.filterDifficulty);
  const totalQuestions = toPositiveInt(params.get("count"), DEFAULT_ROUTE_SETTINGS.totalQuestions);
  const browseFilter = normalizeDifficulty(params.get("browse"), DEFAULT_ROUTE_SETTINGS.browseFilter);

  return {
    gameType,
    filterDifficulty,
    totalQuestions,
    browseFilter,
  };
}

export function buildRouteSearch({ gameType, filterDifficulty, totalQuestions, browseFilter }) {
  const safeGameType = normalizeGameType(gameType);
  const safeDifficulty = normalizeDifficulty(filterDifficulty, DEFAULT_ROUTE_SETTINGS.filterDifficulty);
  const safeTotal = toPositiveInt(totalQuestions, DEFAULT_ROUTE_SETTINGS.totalQuestions);
  const safeBrowse = normalizeDifficulty(browseFilter, DEFAULT_ROUTE_SETTINGS.browseFilter);

  const params = new URLSearchParams();

  if (safeGameType !== DEFAULT_ROUTE_SETTINGS.gameType) params.set("gameType", safeGameType);
  if (safeDifficulty !== DEFAULT_ROUTE_SETTINGS.filterDifficulty) params.set("difficulty", safeDifficulty);
  if (safeTotal !== DEFAULT_ROUTE_SETTINGS.totalQuestions) params.set("count", String(safeTotal));
  if (safeBrowse !== DEFAULT_ROUTE_SETTINGS.browseFilter) params.set("browse", safeBrowse);

  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
}

export function getPathForMode(mode) {
  switch (mode) {
    case MODES.MENU:
      return ROUTES.MENU;
    case MODES.PLAY:
      return ROUTES.PLAY;
    case MODES.RESULTS:
      return ROUTES.RESULTS;
    case MODES.REVIEW:
      return ROUTES.REVIEW;
    case MODES.BROWSE:
      return ROUTES.BROWSE;
    case MODES.TEMPLATES:
      return ROUTES.TEMPLATES;
    case MODES.BLUEPRINT:
      return ROUTES.BLUEPRINT;
    default:
      return ROUTES.MENU;
  }
}

export function getModeFromPathname(pathname) {
  const path = String(pathname || "").toLowerCase();
  if (path === ROUTES.MENU) return MODES.MENU;
  if (path.startsWith(ROUTES.PLAY)) return MODES.PLAY;
  if (path.startsWith(ROUTES.RESULTS)) return MODES.RESULTS;
  if (path.startsWith(ROUTES.REVIEW)) return MODES.REVIEW;
  if (path.startsWith(ROUTES.BROWSE)) return MODES.BROWSE;
  if (path.startsWith(ROUTES.TEMPLATES)) return MODES.TEMPLATES;
  if (path.startsWith(ROUTES.BLUEPRINT)) return MODES.BLUEPRINT;
  return MODES.MENU;
}

export function buildBlueprintDailyPath() {
  return `${ROUTES.BLUEPRINT}/${BLUEPRINT_ROUTE_SEGMENTS.DAILY}`;
}

export function buildBlueprintWorldPath(worldId) {
  return `${ROUTES.BLUEPRINT}/${BLUEPRINT_ROUTE_SEGMENTS.WORLD}/${encodeURIComponent(String(worldId))}`;
}

export function buildBlueprintChallengePath(challengeId) {
  return `${ROUTES.BLUEPRINT}/${BLUEPRINT_ROUTE_SEGMENTS.CHALLENGE}/${encodeURIComponent(String(challengeId))}`;
}

export function decodeBlueprintParam(value) {
  if (value == null) return "";
  try {
    return decodeURIComponent(String(value));
  } catch (error) {
    return String(value);
  }
}

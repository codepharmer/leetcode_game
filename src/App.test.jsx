import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import { GAME_TYPES, MODES } from "./lib/constants";
import { createDefaultProgress } from "./lib/progressModel";

const useAuthSessionMock = vi.hoisted(() => vi.fn());
const useProgressSyncMock = vi.hoisted(() => vi.fn());
const useGameSessionMock = vi.hoisted(() => vi.fn());

vi.mock("./hooks/useAuthSession", () => ({
  useAuthSession: useAuthSessionMock,
}));

vi.mock("./hooks/useProgressSync", () => ({
  useProgressSync: useProgressSyncMock,
}));

vi.mock("./hooks/useGameSession", () => ({
  useGameSession: useGameSessionMock,
}));

vi.mock("./screens/MenuScreen", () => ({
  MenuScreen: (props) => (
    <div>
      <div>menu-screen</div>
      <button onClick={props.startGame}>menu-start</button>
      <button onClick={props.goBrowse}>menu-browse</button>
      <button onClick={props.goTemplates}>menu-templates</button>
      <button onClick={() => props.setGameType(GAME_TYPES.BLUEPRINT_BUILDER)}>menu-blueprint</button>
    </div>
  ),
}));

vi.mock("./screens/PlayScreen", () => ({
  PlayScreen: (props) => (
    <div>
      <div>play-screen</div>
      <button onClick={props.onNext}>play-next</button>
      <button onClick={props.onBack}>play-back</button>
    </div>
  ),
}));

vi.mock("./screens/ResultsScreen", () => ({
  ResultsScreen: (props) => (
    <div>
      <div>results-screen</div>
      <button onClick={props.goMenu}>results-menu</button>
    </div>
  ),
}));

vi.mock("./screens/BrowseScreen", () => ({
  BrowseScreen: (props) => (
    <div>
      <div>browse-screen</div>
      <button onClick={props.goMenu}>browse-menu</button>
    </div>
  ),
}));

vi.mock("./screens/TemplatesScreen", () => ({
  TemplatesScreen: (props) => (
    <div>
      <div>templates-screen</div>
      <button onClick={props.goMenu}>templates-menu</button>
    </div>
  ),
}));

vi.mock("./screens/BlueprintScreen", () => ({
  BlueprintScreen: (props) => (
    <div>
      <div>blueprint-screen</div>
      <button onClick={props.goMenu}>blueprint-menu</button>
    </div>
  ),
}));

import App from "./App";

function renderApp(initialEntries = ["/"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <App />
    </MemoryRouter>
  );
}

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useAuthSessionMock.mockReturnValue({
      user: null,
      setUser: vi.fn(),
      authError: null,
      setAuthError: vi.fn(),
      handleGoogleSuccess: vi.fn(),
      handleGoogleError: vi.fn(),
      handleSignOut: vi.fn(),
    });

    const progress = createDefaultProgress();
    useProgressSyncMock.mockReturnValue({
      loaded: true,
      progress,
      setProgress: vi.fn(),
      progressRef: { current: progress },
      persistProgress: vi.fn(async () => {}),
    });

    useGameSessionMock.mockImplementation((args) => ({
      roundItems: [{ id: "q1" }],
      currentItem: { id: "q1", title: "Two Sum", pattern: "Hash Map", difficulty: "Easy", promptKind: "question", desc: "d" },
      currentIdx: 0,
      choices: ["Hash Map", "B", "C", "D"],
      selected: null,
      score: 0,
      results: [{ item: { id: "q1", title: "Two Sum", pattern: "Hash Map", promptKind: "question", desc: "d" }, chosen: "B", correct: false }],
      streak: 0,
      bestStreak: 0,
      showNext: false,
      showDesc: false,
      setShowDesc: vi.fn(),
      showTemplate: false,
      setShowTemplate: vi.fn(),
      startGame: () => args.setMode(MODES.PLAY),
      handleSelect: vi.fn(),
      nextQuestion: () => args.setMode(MODES.RESULTS),
    }));
  });

  it("renders loading state when progress is not loaded", () => {
    const progress = createDefaultProgress();
    useProgressSyncMock.mockReturnValue({
      loaded: false,
      progress,
      setProgress: vi.fn(),
      progressRef: { current: progress },
      persistProgress: vi.fn(async () => {}),
    });

    renderApp();
    expect(screen.getByText("loading...")).toBeInTheDocument();
  });

  it("navigates across menu, play, results, browse, and templates", () => {
    renderApp();

    expect(screen.getByText("menu-screen")).toBeInTheDocument();

    fireEvent.click(screen.getByText("menu-start"));
    expect(screen.getByText("play-screen")).toBeInTheDocument();

    fireEvent.click(screen.getByText("play-next"));
    expect(screen.getByText("results-screen")).toBeInTheDocument();

    fireEvent.click(screen.getByText("results-menu"));
    expect(screen.getByText("menu-screen")).toBeInTheDocument();

    fireEvent.click(screen.getByText("menu-browse"));
    expect(screen.getByText("browse-screen")).toBeInTheDocument();

    fireEvent.click(screen.getByText("browse-menu"));
    expect(screen.getByText("menu-screen")).toBeInTheDocument();

    fireEvent.click(screen.getByText("menu-templates"));
    expect(screen.getByText("templates-screen")).toBeInTheDocument();
  });

  it("opens blueprint mode when selected", () => {
    renderApp();

    fireEvent.click(screen.getByText("menu-blueprint"));
    fireEvent.click(screen.getByText("menu-start"));
    expect(screen.getByText("blueprint-screen")).toBeInTheDocument();

    fireEvent.click(screen.getByText("blueprint-menu"));
    expect(screen.getByText("menu-screen")).toBeInTheDocument();
  });

  it("supports direct deep link routes", () => {
    renderApp(["/browse"]);
    expect(screen.getByText("browse-screen")).toBeInTheDocument();
  });

  it("passes game-type context into useGameSession", () => {
    renderApp();
    const args = useGameSessionMock.mock.calls[0]?.[0];
    expect(args.itemsPool.length).toBeGreaterThan(0);
    expect(args.filterDifficulty).toBe("All");
    expect(args.totalQuestions).toBe(20);
    expect(args.mode).toBe(MODES.MENU);
    expect(args.stats.gamesPlayed).toBe(0);
    expect(args.history).toEqual({});
    expect(args.persistModeProgress).toBeTypeOf("function");
    expect(args.setMode).toBeTypeOf("function");
    expect(GAME_TYPES.QUESTION_TO_PATTERN).toBeTruthy();
    expect(GAME_TYPES.BLUEPRINT_BUILDER).toBeTruthy();
  });
});

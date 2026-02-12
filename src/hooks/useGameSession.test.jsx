import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MODES } from "../lib/constants";

vi.mock("../lib/utils", () => ({
  shuffle: (arr) => [...arr],
}));

import { useGameSession } from "./useGameSession";

function createSessionArgs(overrides = {}) {
  let historyState = overrides.history || {};

  const args = {
    mode: MODES.MENU,
    setMode: vi.fn(),
    filterDifficulty: "All",
    totalQuestions: 2,
    itemsPool: [
      { id: "q1", pattern: "Hash Map", difficulty: "Easy", promptKind: "question" },
      { id: "q2", pattern: "DFS", difficulty: "Hard", promptKind: "question" },
    ],
    buildChoices: (pattern) => [pattern, "B", "C", "D"],
    stats: { gamesPlayed: 1, totalCorrect: 2, totalAnswered: 3, bestStreak: 1 },
    setStats: vi.fn(),
    setHistory: vi.fn((updater) => {
      historyState = typeof updater === "function" ? updater(historyState) : updater;
      return historyState;
    }),
    history: historyState,
    persistModeProgress: vi.fn(async () => {}),
    resetViewport: vi.fn(),
    onRoundComplete: vi.fn(),
    ...overrides,
  };

  return { args, getHistory: () => historyState };
}

describe("hooks/useGameSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts game and initializes round state", () => {
    const { args } = createSessionArgs();
    const { result } = renderHook(() => useGameSession(args));

    act(() => {
      result.current.startGame();
    });

    expect(args.setMode).toHaveBeenCalledWith(MODES.PLAY);
    expect(args.resetViewport).toHaveBeenCalled();
    expect(result.current.roundItems).toHaveLength(2);
    expect(result.current.currentItem.id).toBe("q1");
    expect(result.current.choices).toEqual(["Hash Map", "B", "C", "D"]);
  });

  it("handles correct answer and finalizes round stats", async () => {
    const { args, getHistory } = createSessionArgs({ totalQuestions: 1 });
    const { result } = renderHook(() => useGameSession(args));

    act(() => {
      result.current.startGame();
    });

    act(() => {
      result.current.handleSelect("Hash Map");
    });

    expect(result.current.score).toBe(1);
    expect(result.current.showNext).toBe(true);
    expect(getHistory().q1).toEqual({ correct: 1, wrong: 0 });

    await act(async () => {
      result.current.nextQuestion();
    });

    expect(args.setStats).toHaveBeenCalledWith({
      gamesPlayed: 2,
      totalCorrect: 3,
      totalAnswered: 4,
      bestStreak: 1,
    });
    expect(args.persistModeProgress).toHaveBeenCalled();
    expect(args.setMode).toHaveBeenCalledWith(MODES.RESULTS);
    expect(args.onRoundComplete).toHaveBeenCalled();
  });

  it("does not start play mode when no items are available", () => {
    const { args } = createSessionArgs({ itemsPool: [] });
    const { result } = renderHook(() => useGameSession(args));

    act(() => {
      result.current.startGame();
    });

    expect(args.setMode).not.toHaveBeenCalledWith(MODES.PLAY);
    expect(result.current.roundItems).toEqual([]);
    expect(result.current.choices).toEqual([]);
  });

  it("responds to keyboard shortcuts in play mode", async () => {
    const { args } = createSessionArgs({
      mode: MODES.PLAY,
      totalQuestions: 1,
      itemsPool: [{ id: "q1", pattern: "Hash Map", difficulty: "Easy", promptKind: "question" }],
    });
    const { result } = renderHook(() => useGameSession(args));

    act(() => {
      result.current.startGame();
    });

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "d" }));
    });
    expect(result.current.showDesc).toBe(true);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "1" }));
    });
    expect(result.current.selected).toBe("Hash Map");

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    });
    expect(args.setMode).toHaveBeenCalledWith(MODES.RESULTS);
  });

  it("ignores description hotkey for code prompts", () => {
    const { args } = createSessionArgs({
      mode: MODES.PLAY,
      itemsPool: [{ id: "tpl1", pattern: "Hash Map", difficulty: "Easy", promptKind: "code" }],
      totalQuestions: 1,
    });
    const { result } = renderHook(() => useGameSession(args));
    act(() => {
      result.current.startGame();
    });

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "d" }));
    });

    expect(result.current.showDesc).toBe(false);
  });
});

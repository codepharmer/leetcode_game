import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@react-oauth/google", () => ({
  GoogleLogin: ({ onSuccess, onError }) => (
    <div>
      <button onClick={() => onSuccess?.({ credential: "mock" })}>google-success</button>
      <button onClick={() => onError?.()}>google-error</button>
    </div>
  ),
}));

import { GAME_TYPES } from "../lib/constants";
import { MenuScreen } from "./MenuScreen";

const baseProps = {
  gameType: GAME_TYPES.QUESTION_TO_PATTERN,
  setGameType: vi.fn(),
  gameTypeOptions: [
    { value: GAME_TYPES.QUESTION_TO_PATTERN, label: "question -> pattern" },
    { value: GAME_TYPES.TEMPLATE_TO_PATTERN, label: "template -> pattern" },
  ],
  menuSubtitle: "Map questions to patterns",
  roundNoun: "questions",
  stats: { gamesPlayed: 0, totalCorrect: 0, totalAnswered: 0, bestStreak: 0 },
  lifetimePct: 0,
  masteredCount: 0,
  totalAvailableQuestions: 20,
  weakSpots: [],
  history: {},
  user: null,
  authError: null,
  onGoogleSuccess: vi.fn(),
  onGoogleError: vi.fn(),
  onSignOut: vi.fn(),
  filterDifficulty: "All",
  setFilterDifficulty: vi.fn(),
  totalQuestions: 10,
  setTotalQuestions: vi.fn(),
  startGame: vi.fn(),
  goBrowse: vi.fn(),
  goTemplates: vi.fn(),
  showResetConfirm: false,
  setShowResetConfirm: vi.fn(),
  resetAllData: vi.fn(),
};

describe("screens/MenuScreen", () => {
  it("renders guest state and round settings controls", () => {
    render(<MenuScreen {...baseProps} />);
    expect(screen.getByText("Map questions to patterns")).toBeInTheDocument();
    expect(screen.getByText("Save your results")).toBeInTheDocument();
    expect(screen.getByText(/No weak spots yet/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /round settings/i }));
    fireEvent.click(screen.getByRole("button", { name: /template -> pattern/i }));
    expect(baseProps.setGameType).toHaveBeenCalledWith(GAME_TYPES.TEMPLATE_TO_PATTERN);
    fireEvent.click(screen.getByRole("button", { name: /medium/i }));
    expect(baseProps.setFilterDifficulty).toHaveBeenCalledWith("Medium");
    fireEvent.click(screen.getByRole("button", { name: "10" }));
    expect(baseProps.setTotalQuestions).toHaveBeenCalledWith(10);
    fireEvent.click(screen.getByRole("button", { name: /Start Round/i }));
    expect(baseProps.startGame).toHaveBeenCalled();
  });

  it("renders signed-in and reset confirm state", () => {
    render(
      <MenuScreen
        {...baseProps}
        user={{ name: "User A", email: "a@a.com", picture: "" }}
        stats={{ gamesPlayed: 3, totalCorrect: 8, totalAnswered: 10, bestStreak: 5 }}
        showResetConfirm
      />
    );

    expect(screen.getByText("User A")).toBeInTheDocument();
    fireEvent.click(screen.getByText("sign out"));
    expect(baseProps.onSignOut).toHaveBeenCalled();
    fireEvent.click(screen.getByText(/yes, reset/i));
    expect(baseProps.resetAllData).toHaveBeenCalled();
    fireEvent.click(screen.getByText("cancel"));
    expect(baseProps.setShowResetConfirm).toHaveBeenCalledWith(false);
  });

  it("hides browse and difficulty controls for blueprint mode", () => {
    render(
      <MenuScreen
        {...baseProps}
        supportsBrowse={false}
        supportsTemplates={false}
        supportsDifficultyFilter={false}
        supportsQuestionCount={false}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /round settings/i }));
    expect(screen.queryByRole("button", { name: /medium/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /browse patterns/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /view templates/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open blueprint builder/i })).toBeInTheDocument();
  });
});

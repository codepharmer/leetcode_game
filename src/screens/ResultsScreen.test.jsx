import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { GAME_TYPES } from "../lib/constants";
import { ResultsScreen } from "./ResultsScreen";

const commonProps = {
  user: null,
  pct: 80,
  score: 4,
  total: 5,
  bestStreak: 3,
  stats: { gamesPlayed: 2, totalCorrect: 10, totalAnswered: 15, bestStreak: 4 },
  lifetimePct: 67,
  expandedResult: {},
  setExpandedResult: vi.fn(),
  startGame: vi.fn(),
  goMenu: vi.fn(),
  history: {},
};

describe("screens/ResultsScreen", () => {
  it("renders question results and expandable description", () => {
    render(
      <ResultsScreen
        {...commonProps}
        gameType={GAME_TYPES.QUESTION_TO_PATTERN}
        results={[
          {
            correct: false,
            chosen: "DFS",
            item: {
              id: "q1",
              title: "Two Sum",
              pattern: "Hash Map",
              promptKind: "question",
              desc: "question description",
            },
          },
        ]}
      />
    );

    expect(screen.getByText("Want to keep these results?")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/Want to keep these results\?/i);
    const resultRow = screen.getByRole("button", { name: /Two Sum/i });
    expect(resultRow).toHaveAttribute("aria-expanded", "false");
    expect(resultRow).toHaveClass("tap-target");
    fireEvent.click(resultRow);
    expect(commonProps.setExpandedResult).toHaveBeenCalled();
  });

  it("supports keyboard activation after semantic button migration", async () => {
    const user = userEvent.setup();
    render(
      <ResultsScreen
        {...commonProps}
        gameType={GAME_TYPES.QUESTION_TO_PATTERN}
        results={[
          {
            correct: false,
            chosen: "DFS",
            item: { id: "q1", title: "Two Sum", pattern: "Hash Map", promptKind: "question", desc: "question description" },
          },
        ]}
      />
    );

    const resultRow = screen.getByRole("button", { name: /Two Sum/i });
    resultRow.focus();
    expect(resultRow).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(commonProps.setExpandedResult).toHaveBeenCalled();
  });

  it("renders code snippet in expanded template mode", () => {
    render(
      <ResultsScreen
        {...commonProps}
        user={{ name: "n" }}
        gameType={GAME_TYPES.TEMPLATE_TO_PATTERN}
        expandedResult={{ 0: true }}
        results={[
          {
            correct: true,
            chosen: "Hash Map",
            item: {
              id: "tpl1",
              title: "Snippet 01",
              pattern: "Hash Map",
              promptKind: "code",
              code: "seen = set()",
              desc: "",
            },
          },
        ]}
      />
    );

    expect(screen.getByText("seen = set()")).toBeInTheDocument();
    expect(screen.queryByText(/Want to keep these results/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText(/play again/i));
    expect(commonProps.startGame).toHaveBeenCalled();
    fireEvent.click(screen.getByText("menu"));
    expect(commonProps.goMenu).toHaveBeenCalled();
  });
});

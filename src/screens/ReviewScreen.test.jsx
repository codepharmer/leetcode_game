import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ReviewScreen } from "./ReviewScreen";

describe("screens/ReviewScreen", () => {
  it("renders an empty state when no attempts exist", () => {
    render(<ReviewScreen attempts={[]} goMenu={vi.fn()} />);

    expect(screen.getByText("No mistakes saved yet.")).toBeInTheDocument();
  });

  it("renders persisted incorrect attempts and navigates back to menu", () => {
    const goMenu = vi.fn();
    render(
      <ReviewScreen
        attempts={[
          {
            ts: 1739750400000,
            itemId: "q1",
            title: "Two Sum",
            chosen: "DFS",
            pattern: "Hash Map",
            correct: false,
          },
        ]}
        goMenu={goMenu}
      />
    );

    expect(screen.getByText("Two Sum")).toBeInTheDocument();
    expect(screen.getByText(/your answer: DFS/i)).toBeInTheDocument();
    expect(screen.getByText(/correct pattern: Hash Map/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /menu/i }));
    expect(goMenu).toHaveBeenCalled();
  });
});

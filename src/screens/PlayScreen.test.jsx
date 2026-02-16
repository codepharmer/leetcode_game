import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PlayScreen } from "./PlayScreen";

const baseProps = {
  currentIdx: 0,
  total: 5,
  score: 1,
  streak: 2,
  choices: ["Hash Map", "Sliding Window", "DFS", "BFS"],
  selected: null,
  showDesc: false,
  setShowDesc: vi.fn(),
  showNext: false,
  onSelect: vi.fn(),
  onNext: vi.fn(),
  onBack: vi.fn(),
  showTemplate: false,
  setShowTemplate: vi.fn(),
  history: {},
  promptLabel: "What pattern solves this?",
  revealTemplateAfterAnswer: true,
};

describe("screens/PlayScreen", () => {
  it("renders question mode and selection callbacks", () => {
    render(
      <PlayScreen
        {...baseProps}
        currentItem={{ id: "q1", title: "Two Sum", pattern: "Hash Map", difficulty: "Easy", promptKind: "question", desc: "desc text" }}
      />
    );

    expect(screen.getByText("Two Sum")).toBeInTheDocument();
    expect(screen.getByText("What pattern solves this?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /show description/i }));
    expect(baseProps.setShowDesc).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /1/i }));
    expect(baseProps.onSelect).toHaveBeenCalledWith("Hash Map");
  });

  it("renders code prompt mode and hides template reveal when disabled", () => {
    render(
      <PlayScreen
        {...baseProps}
        showNext
        selected="DFS"
        revealTemplateAfterAnswer={false}
        currentItem={{
          id: "tpl1",
          title: "Snippet 01",
          pattern: "Hash Map",
          difficulty: "Medium",
          promptKind: "code",
          code: "seen = set()",
          desc: "ignored",
        }}
      />
    );

    expect(screen.getByText("Code Template")).toBeInTheDocument();
    expect(screen.getByText("seen = set()")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /show description/i })).not.toBeInTheDocument();
    expect(screen.getByText(/answer:/i)).toBeInTheDocument();
    expect(screen.queryByText(/view template:/i)).not.toBeInTheDocument();
  });

  it("returns null when no current item", () => {
    const { container } = render(<PlayScreen {...baseProps} currentItem={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a fallback when description is missing", () => {
    render(
      <PlayScreen
        {...baseProps}
        showDesc
        currentItem={{ id: "q2", title: "Question 2", pattern: "DFS", difficulty: "Easy", promptKind: "question", desc: "   " }}
      />
    );

    expect(screen.getByText("Description unavailable for this prompt.")).toBeInTheDocument();
  });
});

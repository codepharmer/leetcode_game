import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

function createBaseProps() {
  return {
    gameType: GAME_TYPES.QUESTION_TO_PATTERN,
    setGameType: vi.fn(),
    gameTypeOptions: [
      { value: GAME_TYPES.QUESTION_TO_PATTERN, label: "question -> pattern" },
      { value: GAME_TYPES.TEMPLATE_TO_PATTERN, label: "template -> pattern" },
      { value: GAME_TYPES.BLUEPRINT_BUILDER, label: "blueprint builder" },
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
    goReview: vi.fn(),
    showResetConfirm: false,
    setShowResetConfirm: vi.fn(),
    resetAllData: vi.fn(),
    modeProgressByGameType: {
      [GAME_TYPES.QUESTION_TO_PATTERN]: {
        stats: { gamesPlayed: 14, totalCorrect: 20, totalAnswered: 42, bestStreak: 9 },
        lifetimePct: 48,
        masteredCount: 4,
        allCount: 20,
      },
      [GAME_TYPES.TEMPLATE_TO_PATTERN]: {
        stats: { gamesPlayed: 7, totalCorrect: 15, totalAnswered: 24, bestStreak: 5 },
        lifetimePct: 62,
        masteredCount: 3,
        allCount: 15,
      },
      [GAME_TYPES.BLUEPRINT_BUILDER]: {
        stats: { gamesPlayed: 2, totalCorrect: 0, totalAnswered: 0, bestStreak: 0 },
        lifetimePct: 0,
        masteredCount: 0,
        allCount: 90,
      },
    },
    blueprintCampaignPreview: {
      dailyChallenge: {
        challenge: { level: { title: "Daily Two Sum", difficulty: "Easy" } },
      },
      worlds: [
        { worldId: 0, label: "Primitives", progressLabel: "0/17" },
        { worldId: 7, label: "Graphs", progressLabel: "0/2" },
        { worldId: 8, label: "Dynamic Programming", progressLabel: "0/2" },
      ],
    },
    onOpenBlueprintDaily: vi.fn(),
    onOpenBlueprintWorld: vi.fn(),
    accuracyTrend: [],
  };
}

describe("screens/MenuScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders guest state with segmented mode selector and round settings controls", () => {
    const props = createBaseProps();
    render(<MenuScreen {...props} />);
    expect(screen.getByText("Map questions to patterns")).toBeInTheDocument();
    expect(screen.getByText("Save your results")).toBeInTheDocument();
    expect(screen.getByText(/No weak spots yet/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Match$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Template$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Build$/i })).toBeInTheDocument();
    expect(screen.getByText(/Match questions to their solution pattern/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Template$/i }));
    expect(props.setGameType).toHaveBeenCalledWith(GAME_TYPES.TEMPLATE_TO_PATTERN);
    fireEvent.click(screen.getByRole("button", { name: /round settings/i }));
    fireEvent.click(screen.getByRole("button", { name: /medium/i }));
    expect(props.setFilterDifficulty).toHaveBeenCalledWith("Medium");
    fireEvent.click(screen.getByRole("button", { name: "10" }));
    expect(props.setTotalQuestions).toHaveBeenCalledWith(10);
    fireEvent.click(screen.getByRole("button", { name: /Start Round/i }));
    expect(props.startGame).toHaveBeenCalled();
    expect(screen.getByText(/Play a few rounds to unlock your trend chart/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /review mistakes/i }));
    expect(props.goReview).toHaveBeenCalled();
  });

  it("renders signed-in and reset confirm state", () => {
    const props = createBaseProps();
    render(
      <MenuScreen
        {...props}
        user={{ name: "User A", email: "a@a.com", picture: "" }}
        stats={{ gamesPlayed: 3, totalCorrect: 8, totalAnswered: 10, bestStreak: 5 }}
        showResetConfirm
      />
    );

    expect(screen.getByText("User A")).toBeInTheDocument();
    fireEvent.click(screen.getByText("sign out"));
    expect(props.onSignOut).toHaveBeenCalled();
    fireEvent.click(screen.getByText(/yes, reset/i));
    expect(props.resetAllData).toHaveBeenCalled();
    fireEvent.click(screen.getByText("cancel"));
    expect(props.setShowResetConfirm).toHaveBeenCalledWith(false);
  });

  it("shows campaign preview and blueprint CTA for blueprint mode", () => {
    const props = createBaseProps();
    render(
      <MenuScreen
        {...props}
        gameType={GAME_TYPES.BLUEPRINT_BUILDER}
        startLabel="Continue Challenge"
        supportsBrowse={false}
        supportsTemplates={false}
        supportsDifficultyFilter={false}
        supportsQuestionCount={false}
      />
    );

    expect(screen.queryByRole("button", { name: /round settings/i })).not.toBeInTheDocument();
    expect(screen.getAllByText(/^campaign$/i).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /daily challenge/i }));
    expect(props.onOpenBlueprintDaily).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /graphs/i }));
    expect(props.onOpenBlueprintWorld).toHaveBeenCalledWith(7);

    expect(screen.queryByRole("button", { name: /browse patterns/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /view templates/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /review mistakes/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /replay tutorial/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continue Challenge/i })).toBeInTheDocument();
    expect(screen.getByText(/^stars$/i)).toBeInTheDocument();
    expect(screen.getByText(/^worlds$/i)).toBeInTheDocument();
    expect(screen.queryByText("--")).not.toBeInTheDocument();
  });

  it("renders tutorials collapsed below the primary CTA until expanded", () => {
    const props = createBaseProps();
    render(<MenuScreen {...props} />);

    expect(screen.queryByRole("button", { name: /replay global onboarding/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /reset onboarding/i })).not.toBeInTheDocument();

    const startButton = screen.getByRole("button", { name: /Start Round/i });
    const tutorialHeading = screen.getByText(/^tutorials$/i);
    expect(startButton.compareDocumentPosition(tutorialHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const reviewButton = screen.getByRole("button", { name: /review mistakes/i });
    expect(reviewButton.compareDocumentPosition(tutorialHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    fireEvent.click(screen.getByTestId("tutorial-toggle"));
    expect(screen.getByRole("button", { name: /replay global onboarding/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reset onboarding/i })).toBeInTheDocument();
  });

  it("renders a trend chart when historical snapshots exist", () => {
    const props = createBaseProps();
    render(
      <MenuScreen
        {...props}
        accuracyTrend={[
          { ts: 1, pct: 40, answered: 10, correct: 4 },
          { ts: 2, pct: 70, answered: 10, correct: 7 },
          { ts: 3, pct: 90, answered: 10, correct: 9 },
        ]}
      />
    );

    expect(screen.getByTestId("accuracy-trend-chart")).toBeInTheDocument();
    expect(screen.getByText(/latest: 90%/i)).toBeInTheDocument();
  });
});

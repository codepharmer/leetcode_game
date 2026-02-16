import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MODES } from "../lib/constants";

const navigateMock = vi.hoisted(() => vi.fn());
const locationRef = vi.hoisted(() => ({
  current: { pathname: "/", search: "" },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useLocation: () => locationRef.current,
    useNavigate: () => navigateMock,
  };
});

import { useRouteSettings } from "./useRouteSettings";

describe("hooks/useRouteSettings", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    locationRef.current = { pathname: "/", search: "" };
  });

  it("normalizes settings from query params and canonicalizes the URL", () => {
    locationRef.current = {
      pathname: "/",
      search: "?difficulty=all&count=0&gameType=unknown&browse=Hard",
    };

    const { result } = renderHook(() => useRouteSettings());

    expect(result.current.settings).toEqual({
      gameType: "question_to_pattern",
      filterDifficulty: "All",
      totalQuestions: 20,
      browseFilter: "Hard",
    });
    expect(navigateMock).toHaveBeenCalledWith(
      { pathname: "/", search: "?browse=Hard" },
      { replace: true }
    );
  });

  it("does not navigate for no-op settings updates", () => {
    locationRef.current = {
      pathname: "/",
      search: "?difficulty=Easy&count=10",
    };

    const { result } = renderHook(() => useRouteSettings());
    navigateMock.mockClear();

    act(() => {
      result.current.setSettings({ filterDifficulty: "Easy" });
    });

    expect(navigateMock).not.toHaveBeenCalled();

    act(() => {
      result.current.setSettings((prev) => ({ totalQuestions: prev.totalQuestions }));
    });

    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("supports patch and updater writes", () => {
    const { result, rerender } = renderHook(() => useRouteSettings());
    navigateMock.mockClear();

    act(() => {
      result.current.setSettings({ filterDifficulty: "Hard", totalQuestions: 40 });
    });

    expect(navigateMock).toHaveBeenNthCalledWith(
      1,
      { pathname: "/", search: "?difficulty=Hard&count=40" },
      { replace: true }
    );

    locationRef.current = {
      pathname: "/",
      search: "?difficulty=Hard&count=40",
    };
    rerender();
    navigateMock.mockClear();

    act(() => {
      result.current.setSettings((prev) => ({
        gameType: "template_to_pattern",
        totalQuestions: prev.totalQuestions + 5,
      }));
    });

    expect(navigateMock).toHaveBeenCalledWith(
      { pathname: "/", search: "?gameType=template_to_pattern&difficulty=Hard&count=45" },
      { replace: true }
    );
  });

  it("preserves current settings across mode path changes", () => {
    locationRef.current = {
      pathname: "/blueprint",
      search: "?gameType=blueprint_builder&difficulty=Hard&count=10&browse=Medium",
    };

    const { result } = renderHook(() => useRouteSettings());
    navigateMock.mockClear();

    act(() => {
      result.current.setMode(MODES.BROWSE);
    });

    expect(navigateMock).toHaveBeenCalledWith(
      { pathname: "/browse", search: "?gameType=blueprint_builder&difficulty=Hard&count=10&browse=Medium" },
      undefined
    );
  });

  it("navigates to review route when review mode is selected", () => {
    locationRef.current = {
      pathname: "/",
      search: "?difficulty=Hard&count=10",
    };

    const { result } = renderHook(() => useRouteSettings());
    navigateMock.mockClear();

    act(() => {
      result.current.setMode(MODES.REVIEW);
    });

    expect(navigateMock).toHaveBeenCalledWith(
      { pathname: "/review", search: "?difficulty=Hard&count=10" },
      undefined
    );
  });
});

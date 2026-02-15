import { StrictMode } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { BrowserRouter, MemoryRouter } from "react-router-dom";

import App from "./App";

describe("App strict mode", () => {
  it.each([
    "/",
    "/?",
    "/?difficulty=All&count=20&browse=All",
    "/?gameType=question_to_pattern&difficulty=All&count=20&browse=All",
    "/?gameType=blueprint_builder",
    "/?count=0",
    "/?difficulty=all",
    "/?unknown=1",
  ])("does not trigger maximum update depth warning for %s", async (entry) => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <StrictMode>
        <GoogleOAuthProvider clientId="test-client-id">
          <MemoryRouter initialEntries={[entry]}>
            <App />
          </MemoryRouter>
        </GoogleOAuthProvider>
      </StrictMode>
    );

    await waitFor(() => {
      const depthWarning = errorSpy.mock.calls.find((call) =>
        String(call?.[0] || "").includes("Maximum update depth exceeded")
      );
      expect(depthWarning).toBeFalsy();
    });

    errorSpy.mockRestore();
  });

  it("does not trigger maximum update depth warning during browser history query transitions", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    window.history.replaceState({}, "", "/?gameType=blueprint_builder");

    render(
      <StrictMode>
        <GoogleOAuthProvider clientId="test-client-id">
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </GoogleOAuthProvider>
      </StrictMode>
    );

    await screen.findByText(/Build algorithm blueprints/i);

    act(() => {
      window.history.pushState({}, "", "/?gameType=template_to_pattern&difficulty=Hard&count=10");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    await waitFor(() => {
      expect(screen.getByText(/Match code snippets/i)).toBeInTheDocument();
    });

    act(() => {
      window.history.pushState({}, "", "/?gameType=question_to_pattern&difficulty=Medium&count=40");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    await waitFor(() => {
      expect(screen.getByText(/Map Blind 75 questions/i)).toBeInTheDocument();
    });

    act(() => {
      window.history.back();
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    await waitFor(() => {
      expect(screen.getByText(/Match code snippets/i)).toBeInTheDocument();
    });

    const depthWarning = errorSpy.mock.calls.find((call) =>
      String(call?.[0] || "").includes("Maximum update depth exceeded")
    );
    expect(depthWarning).toBeFalsy();

    errorSpy.mockRestore();
  });
});

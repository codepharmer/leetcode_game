import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@react-oauth/google", () => ({
  GoogleLogin: ({ onSuccess, onError }) => (
    <div>
      <button onClick={() => onSuccess?.({ credential: "cred" })}>mock-google-success</button>
      <button onClick={() => onError?.()}>mock-google-error</button>
    </div>
  ),
}));

import { AuthCard } from "./AuthCard";

describe("components/AuthCard", () => {
  it("renders signed-out state and forwards google callbacks", () => {
    const onGoogleSuccess = vi.fn();
    const onGoogleError = vi.fn();
    render(
      <AuthCard
        user={null}
        authError={null}
        onGoogleSuccess={onGoogleSuccess}
        onGoogleError={onGoogleError}
        onSignOut={vi.fn()}
      />
    );

    expect(screen.getByText("sign in to sync results")).toBeInTheDocument();
    fireEvent.click(screen.getByText("mock-google-success"));
    fireEvent.click(screen.getByText("mock-google-error"));
    expect(onGoogleSuccess).toHaveBeenCalled();
    expect(onGoogleError).toHaveBeenCalled();
  });

  it("renders signed-in state and sign out action", () => {
    const onSignOut = vi.fn();
    render(
      <AuthCard
        user={{ name: "Test User", email: "test@example.com", picture: "" }}
        authError="oops"
        onGoogleSuccess={vi.fn()}
        onGoogleError={vi.fn()}
        onSignOut={onSignOut}
      />
    );

    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("sign out")).toBeInTheDocument();
    expect(screen.getByText("oops")).toBeInTheDocument();
    fireEvent.click(screen.getByText("sign out"));
    expect(onSignOut).toHaveBeenCalled();
  });
});

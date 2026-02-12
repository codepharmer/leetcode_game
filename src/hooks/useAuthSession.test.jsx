import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const googleLogoutMock = vi.hoisted(() => vi.fn());
const decodeJwtMock = vi.hoisted(() => vi.fn());
const userFromTokenMock = vi.hoisted(() => vi.fn());
const getStorageAdapterMock = vi.hoisted(() => vi.fn());
const saveDataMock = vi.hoisted(() => vi.fn());

vi.mock("@react-oauth/google", () => ({
  googleLogout: googleLogoutMock,
}));

vi.mock("../lib/auth", () => ({
  GOOGLE_AUTH_STORAGE_KEY: "lc-google-credential",
  SESSION_AUTH_STORAGE_KEY: "lc-session-token",
  decodeJwt: decodeJwtMock,
  userFromToken: userFromTokenMock,
}));

vi.mock("../lib/storage", () => ({
  getStorageAdapter: getStorageAdapterMock,
  saveData: saveDataMock,
}));

describe("hooks/useAuthSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  async function loadHook() {
    const mod = await import("./useAuthSession");
    return mod.useAuthSession;
  }

  it("sets auth error on invalid google token", async () => {
    const useAuthSession = await loadHook();
    decodeJwtMock.mockReturnValue(null);
    userFromTokenMock.mockReturnValue(null);

    const { result } = renderHook(() => useAuthSession({ getProgressSnapshot: () => ({ progress: {} }) }));
    await act(async () => {
      await result.current.handleGoogleSuccess({ credential: "bad-token" });
    });

    expect(result.current.authError).toMatch(/invalid token/i);
  });

  it("falls back to storing google token when session exchange is unavailable", async () => {
    const useAuthSession = await loadHook();
    decodeJwtMock.mockReturnValue({ sub: "s1", email: "e@x.com", name: "Name", picture: "p" });
    userFromTokenMock.mockReturnValue(null);
    getStorageAdapterMock.mockReturnValue({ kind: "local" });
    saveDataMock.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuthSession({ getProgressSnapshot: () => ({ progress: { p: 1 } }) }));
    await act(async () => {
      await result.current.handleGoogleSuccess({ credential: "google-id-token" });
    });

    expect(saveDataMock).toHaveBeenCalled();
    expect(window.localStorage.getItem("lc-google-credential")).toBe("google-id-token");
    expect(result.current.user).toMatchObject({ kind: "google", sub: "s1", email: "e@x.com" });
    expect(result.current.authError).toBeNull();
  });

  it("stores session token when exchange succeeds", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://api.example.com");
    vi.resetModules();
    const useAuthSession = await loadHook();

    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ token: "session-token" }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    decodeJwtMock.mockReturnValue({ sub: "s1", email: "e@x.com", name: "Name", picture: "p" });
    userFromTokenMock.mockImplementation((token, opts) => {
      if (opts?.kind === "session" && token === "session-token") {
        return { kind: "session", credential: token, sub: "s1", email: "e@x.com" };
      }
      return null;
    });
    getStorageAdapterMock.mockReturnValue({ kind: "local" });
    saveDataMock.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuthSession({ getProgressSnapshot: () => ({ progress: {} }) }));
    await act(async () => {
      await result.current.handleGoogleSuccess({ credential: "google-id-token" });
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/session",
      expect.objectContaining({ method: "POST" })
    );
    expect(window.localStorage.getItem("lc-session-token")).toBe("session-token");
    expect(window.localStorage.getItem("lc-google-credential")).toBeNull();
    expect(result.current.user).toMatchObject({ kind: "session", credential: "session-token" });
  });

  it("migrates legacy google token on mount when api base is configured", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://api.example.com");
    window.localStorage.setItem("lc-google-credential", "legacy-google-token");
    vi.resetModules();
    const useAuthSession = await loadHook();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ token: "new-session-token" }),
      }))
    );

    userFromTokenMock.mockImplementation((token, opts) => {
      if (opts?.kind === "google" && token === "legacy-google-token") {
        return { kind: "google", credential: token, sub: "legacy" };
      }
      if (opts?.kind === "session" && token === "new-session-token") {
        return { kind: "session", credential: token, sub: "legacy" };
      }
      return null;
    });

    const { result } = renderHook(() => useAuthSession({ getProgressSnapshot: () => ({ progress: {} }) }));
    await waitFor(() => expect(result.current.user?.kind).toBe("session"));
    expect(window.localStorage.getItem("lc-google-credential")).toBeNull();
    expect(window.localStorage.getItem("lc-session-token")).toBe("new-session-token");
  });

  it("exposes google-error and sign-out handlers", async () => {
    const useAuthSession = await loadHook();
    const { result } = renderHook(() => useAuthSession({ getProgressSnapshot: () => ({ progress: {} }) }));

    act(() => {
      result.current.handleGoogleError();
    });
    expect(result.current.authError).toMatch(/failed/i);

    act(() => {
      result.current.handleSignOut();
    });
    expect(googleLogoutMock).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });
});

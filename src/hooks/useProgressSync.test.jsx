import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GOOGLE_AUTH_STORAGE_KEY, SESSION_AUTH_STORAGE_KEY } from "../lib/auth";
import { createDefaultProgress } from "../lib/progressModel";

vi.mock("../lib/storage", () => ({
  getStorageAdapter: vi.fn(),
  loadData: vi.fn(),
  saveData: vi.fn(),
}));

vi.mock("../lib/progressMerge", () => ({
  mergeProgressData: vi.fn(),
}));

import { getStorageAdapter, loadData, saveData } from "../lib/storage";
import { mergeProgressData } from "../lib/progressMerge";
import { useProgressSync } from "./useProgressSync";

describe("hooks/useProgressSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it("loads local progress", async () => {
    const progress = createDefaultProgress();
    getStorageAdapter.mockReturnValue({ kind: "local" });
    loadData.mockResolvedValue({ progress, found: true });

    const setUser = vi.fn();
    const setAuthError = vi.fn();
    const { result } = renderHook(() => useProgressSync({ user: null, setUser, setAuthError }));

    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(setAuthError).toHaveBeenCalledWith(null);
    expect(result.current.progress).toEqual(progress);
  });

  it("pushes local progress to first-time remote account", async () => {
    const remoteStorage = { kind: "api" };
    const localStorage = { kind: "local" };
    const localProgress = createDefaultProgress();
    localProgress.byGameType.question_to_pattern.stats.gamesPlayed = 4;

    getStorageAdapter.mockImplementation(({ credential } = {}) => (credential ? remoteStorage : localStorage));
    loadData.mockImplementation(async (storage) =>
      storage.kind === "api"
        ? { progress: createDefaultProgress(), found: false }
        : { progress: localProgress, found: true }
    );

    const setUser = vi.fn();
    const setAuthError = vi.fn();
    const { result } = renderHook(() =>
      useProgressSync({ user: { credential: "cred", sub: "u1" }, setUser, setAuthError })
    );

    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(saveData).toHaveBeenCalledWith(remoteStorage, localProgress);
    expect(result.current.progress.byGameType.question_to_pattern.stats.gamesPlayed).toBe(4);
  });

  it("merges local and remote progress and syncs local store", async () => {
    const remoteStorage = { kind: "api" };
    const localStorage = { kind: "local" };
    const mergedProgress = createDefaultProgress();
    mergedProgress.byGameType.template_to_pattern.stats.gamesPlayed = 2;

    getStorageAdapter.mockImplementation(({ credential } = {}) => (credential ? remoteStorage : localStorage));
    loadData.mockImplementation(async () => ({ progress: createDefaultProgress(), found: true }));
    mergeProgressData.mockReturnValue({ mergedProgress, shouldWriteRemote: false });

    const setUser = vi.fn();
    const setAuthError = vi.fn();
    const { result } = renderHook(() =>
      useProgressSync({ user: { credential: "cred", sub: "u1" }, setUser, setAuthError })
    );

    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(mergeProgressData).toHaveBeenCalled();
    expect(saveData).toHaveBeenCalledWith(localStorage, mergedProgress);
    expect(saveData).not.toHaveBeenCalledWith(remoteStorage, mergedProgress);
  });

  it("falls back to local on remote auth error and clears stored tokens", async () => {
    const remoteStorage = { kind: "api" };
    const localStorage = { kind: "local" };
    const localProgress = createDefaultProgress();
    localProgress.byGameType.question_to_pattern.stats.gamesPlayed = 1;

    getStorageAdapter.mockImplementation(({ credential } = {}) => (credential ? remoteStorage : localStorage));
    loadData.mockImplementation(async (storage) => {
      if (storage.kind === "api") throw { status: 401 };
      return { progress: localProgress, found: true };
    });

    window.localStorage.setItem(SESSION_AUTH_STORAGE_KEY, "token");
    window.localStorage.setItem(GOOGLE_AUTH_STORAGE_KEY, "legacy");

    const setUser = vi.fn();
    const setAuthError = vi.fn();
    const { result } = renderHook(() =>
      useProgressSync({ user: { credential: "cred", sub: "u1" }, setUser, setAuthError })
    );

    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(setUser).toHaveBeenCalledWith(null);
    expect(setAuthError).toHaveBeenCalledWith("Cloud sync unavailable (401). Using local data.");
    expect(window.localStorage.getItem(SESSION_AUTH_STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem(GOOGLE_AUTH_STORAGE_KEY)).toBeNull();
  });

  it("persists progress through storage ref", async () => {
    const storage = { kind: "local" };
    getStorageAdapter.mockReturnValue(storage);
    loadData.mockImplementation(async () => ({ progress: createDefaultProgress(), found: false }));

    const setUser = vi.fn();
    const setAuthError = vi.fn();
    const { result } = renderHook(() => useProgressSync({ user: null, setUser, setAuthError }));
    await waitFor(() => expect(result.current.loaded).toBe(true));

    const next = createDefaultProgress();
    await result.current.persistProgress(next);
    expect(saveData).toHaveBeenCalledWith(storage, next);
  });
});

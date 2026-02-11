import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { GOOGLE_AUTH_STORAGE_KEY, SESSION_AUTH_STORAGE_KEY } from "../lib/auth";
import { mergeProgressData } from "../lib/progressMerge";
import { createDefaultProgress } from "../lib/progressModel";
import { getStorageAdapter, loadData, saveData } from "../lib/storage";

export function useProgressSync({ user, setUser, setAuthError }) {
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(createDefaultProgress());
  const progressRef = useRef(progress);

  const storage = useMemo(() => getStorageAdapter({ credential: user?.credential }), [user?.credential, user?.sub]);

  const storageRef = useRef(storage);
  useEffect(() => {
    storageRef.current = storage;
  }, [storage]);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoaded(false);

      const localStorage = getStorageAdapter();
      const usingRemote = storage.kind === "api";

      setAuthError?.(null);

      let result;
      try {
        result = await loadData(storage);

        if (usingRemote) {
          const local = await loadData(localStorage);

          if (!result.found) {
            // First-time cloud user: push local progress up if it exists.
            if (local.found) {
              await saveData(storage, local.progress);
              result = local;
            }
          } else {
            // Cloud exists: merge local progress (e.g., user played signed-out) without wiping either side.
            const { mergedProgress, shouldWriteRemote } = mergeProgressData(result.progress, local.progress);
            result = { progress: mergedProgress, found: true };

            // Keep both stores in sync after any login or cloud load.
            if (shouldWriteRemote) await saveData(storage, mergedProgress);
            await saveData(localStorage, mergedProgress);
          }
        }
      } catch (error) {
        if (usingRemote) {
          const status = error?.status;
          if (status === 401 || status === 403) {
            try {
              window.localStorage.removeItem(SESSION_AUTH_STORAGE_KEY);
              window.localStorage.removeItem(GOOGLE_AUTH_STORAGE_KEY);
            } catch (storageError) {
              // ignore
            }
            setUser?.(null);
          }
          setAuthError?.(`Cloud sync unavailable${status ? ` (${status})` : ""}. Using local data.`);
        }
        result = await loadData(localStorage);
      }

      if (cancelled) return;

      setProgress(result.progress);
      progressRef.current = result.progress;
      setLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [setAuthError, setUser, storage]);

  const persistProgress = useCallback(async (nextProgress) => {
    await saveData(storageRef.current, nextProgress);
  }, []);

  return {
    loaded,
    progress,
    setProgress,
    progressRef,
    persistProgress,
  };
}

import { useCallback, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { buildRouteSearch, getPathForMode, parseRouteSettings } from "../lib/routes";

function resolvePatch(patchOrUpdater, currentSettings) {
  if (typeof patchOrUpdater === "function") {
    const patch = patchOrUpdater(currentSettings);
    return patch && typeof patch === "object" ? patch : {};
  }
  return patchOrUpdater && typeof patchOrUpdater === "object" ? patchOrUpdater : {};
}

function resolveValue(valueOrUpdater, currentValue) {
  if (typeof valueOrUpdater === "function") return valueOrUpdater(currentValue);
  return valueOrUpdater;
}

export function useRouteSettings() {
  const location = useLocation();
  const navigate = useNavigate();

  const settings = useMemo(() => parseRouteSettings(location.search), [location.search]);
  const canonicalSearch = useMemo(() => buildRouteSearch(settings), [settings]);

  useEffect(() => {
    if (location.search === canonicalSearch) return;
    navigate({ pathname: location.pathname, search: canonicalSearch }, { replace: true });
  }, [canonicalSearch, location.pathname, location.search, navigate]);

  const setSettings = useCallback(
    (patchOrUpdater, options) => {
      const currentSettings = parseRouteSettings(location.search);
      const currentSearch = buildRouteSearch(currentSettings);
      const patch = resolvePatch(patchOrUpdater, currentSettings);
      const nextSearch = buildRouteSearch({ ...currentSettings, ...patch });
      if (nextSearch === currentSearch) return;
      const navigateOptions = options ?? { replace: true };
      navigate({ pathname: location.pathname, search: nextSearch }, navigateOptions);
    },
    [location.pathname, location.search, navigate]
  );

  const navigateWithSettings = useCallback(
    (pathname, options) => {
      const safePathname = typeof pathname === "string" && pathname.length > 0 ? pathname : location.pathname;
      if (safePathname === location.pathname && canonicalSearch === location.search) return;
      navigate({ pathname: safePathname, search: canonicalSearch }, options);
    },
    [canonicalSearch, location.pathname, location.search, navigate]
  );

  const setMode = useCallback(
    (nextMode, options) => {
      const nextPath = getPathForMode(nextMode);
      navigateWithSettings(nextPath, options);
    },
    [navigateWithSettings]
  );

  const setGameType = useCallback(
    (valueOrUpdater, options) => {
      setSettings(
        (currentSettings) => ({
          gameType: resolveValue(valueOrUpdater, currentSettings.gameType),
        }),
        options
      );
    },
    [setSettings]
  );

  const setFilterDifficulty = useCallback(
    (valueOrUpdater, options) => {
      setSettings(
        (currentSettings) => ({
          filterDifficulty: resolveValue(valueOrUpdater, currentSettings.filterDifficulty),
        }),
        options
      );
    },
    [setSettings]
  );

  const setTotalQuestions = useCallback(
    (valueOrUpdater, options) => {
      setSettings(
        (currentSettings) => ({
          totalQuestions: resolveValue(valueOrUpdater, currentSettings.totalQuestions),
        }),
        options
      );
    },
    [setSettings]
  );

  const setBrowseFilter = useCallback(
    (valueOrUpdater, options) => {
      setSettings(
        (currentSettings) => ({
          browseFilter: resolveValue(valueOrUpdater, currentSettings.browseFilter),
        }),
        options
      );
    },
    [setSettings]
  );

  return {
    settings,
    setSettings,
    setMode,
    navigateWithSettings,
    setGameType,
    setFilterDifficulty,
    setTotalQuestions,
    setBrowseFilter,
  };
}

import { useCallback, useEffect, useRef, useState } from "react";

import { useMemo } from "react";
import { googleLogout } from "@react-oauth/google";

import { ALL_PATTERNS, QUESTIONS } from "./lib/questions";
import { DEFAULT_STATS, MODES } from "./lib/constants";
import { decodeJwt, GOOGLE_AUTH_STORAGE_KEY, SESSION_AUTH_STORAGE_KEY, userFromToken } from "./lib/auth";
import { getStorageAdapter, loadData, saveData } from "./lib/storage";
import { genChoices, shuffle } from "./lib/utils";
import { S } from "./styles";

import { BrowseScreen } from "./screens/BrowseScreen";
import { MenuScreen } from "./screens/MenuScreen";
import { PlayScreen } from "./screens/PlayScreen";
import { ResultsScreen } from "./screens/ResultsScreen";
import { TemplatesScreen } from "./screens/TemplatesScreen";

const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

async function exchangeGoogleIdTokenForSession(googleIdToken) {
  if (!API_BASE_URL) return null;
  if (!googleIdToken) return null;

  try {
    const r = await fetch(`${API_BASE_URL}/session`, {
      method: "POST",
      headers: { Authorization: `Bearer ${googleIdToken}` },
    });
    if (!r.ok) return null;
    const j = await r.json();
    return j?.token || null;
  } catch (e) {
    return null;
  }
}

export default function App() {
  const [mode, setMode] = useState(MODES.MENU);

  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [choices, setChoices] = useState([]);
  const [selected, setSelected] = useState(null);

  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]);

  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const [filterDifficulty, setFilterDifficulty] = useState("All");
  const [totalQuestions, setTotalQuestions] = useState(20);

  const [showNext, setShowNext] = useState(false);
  const [showDesc, setShowDesc] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);

  const [browseFilter, setBrowseFilter] = useState("All");
  const [expandedBrowse, setExpandedBrowse] = useState({});
  const [expandedResult, setExpandedResult] = useState({});

  const [loaded, setLoaded] = useState(false);
  const [stats, setStats] = useState({ ...DEFAULT_STATS });
  const [history, setHistory] = useState({});
  const historyRef = useRef(history);

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const [user, setUser] = useState(() => {
    if (typeof window === "undefined") return null;

    const sessionToken = window.localStorage.getItem(SESSION_AUTH_STORAGE_KEY);
    const sessionUser = userFromToken(sessionToken, { kind: "session" });
    if (sessionUser) return sessionUser;
    if (sessionToken) window.localStorage.removeItem(SESSION_AUTH_STORAGE_KEY);

    const legacyGoogleToken = window.localStorage.getItem(GOOGLE_AUTH_STORAGE_KEY);
    const legacyUser = userFromToken(legacyGoogleToken, { kind: "google" });
    if (legacyUser) return legacyUser;
    if (legacyGoogleToken) window.localStorage.removeItem(GOOGLE_AUTH_STORAGE_KEY);

    return null;
  });
  const [authError, setAuthError] = useState(null);

  const storage = useMemo(() => getStorageAdapter({ credential: user?.credential }), [user?.credential, user?.sub]);

  const storageRef = useRef(storage);
  useEffect(() => {
    storageRef.current = storage;
  }, [storage]);

  // Migration: if a user still has a legacy Google ID token stored, exchange it for a 30-day session token.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!API_BASE_URL) return;
    if (!user || user.kind !== "google") return;

    let cancelled = false;
    (async () => {
      const sessionToken = await exchangeGoogleIdTokenForSession(user.credential);
      const sessionUser = userFromToken(sessionToken, { kind: "session" });
      if (!sessionUser) return;

      try {
        window.localStorage.setItem(SESSION_AUTH_STORAGE_KEY, sessionToken);
        window.localStorage.removeItem(GOOGLE_AUTH_STORAGE_KEY);
      } catch (e) {
        // ignore
      }

      if (!cancelled) setUser(sessionUser);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const normalizeHistoryEntry = (e) => {
    const correct = Math.max(0, Number(e?.correct || 0));
    const wrong = Math.max(0, Number(e?.wrong || 0));
    return { correct, wrong };
  };

  const historyIsSubset = (a = {}, b = {}) => {
    const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
    for (const k of keys) {
      const av = normalizeHistoryEntry(a?.[k]);
      const bv = normalizeHistoryEntry(b?.[k]);
      if (av.correct > bv.correct || av.wrong > bv.wrong) return false;
    }
    return true;
  };

  const mergeHistoryMax = (a = {}, b = {}) => {
    const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
    const out = {};
    for (const k of keys) {
      const av = normalizeHistoryEntry(a?.[k]);
      const bv = normalizeHistoryEntry(b?.[k]);
      const correct = Math.max(av.correct, bv.correct);
      const wrong = Math.max(av.wrong, bv.wrong);
      if (correct > 0 || wrong > 0) out[k] = { correct, wrong };
    }
    return out;
  };

  const historyTotals = (history = {}) => {
    let totalCorrect = 0;
    let totalAnswered = 0;
    for (const k of Object.keys(history || {})) {
      const v = normalizeHistoryEntry(history[k]);
      totalCorrect += v.correct;
      totalAnswered += v.correct + v.wrong;
    }
    return { totalCorrect, totalAnswered };
  };

  const normalizeStats = (s) => ({
    gamesPlayed: Math.max(0, Number(s?.gamesPlayed || 0)),
    totalCorrect: Math.max(0, Number(s?.totalCorrect || 0)),
    totalAnswered: Math.max(0, Number(s?.totalAnswered || 0)),
    bestStreak: Math.max(0, Number(s?.bestStreak || 0)),
  });

  const statsEqual = (a, b) => {
    const av = normalizeStats(a);
    const bv = normalizeStats(b);
    return (
      av.gamesPlayed === bv.gamesPlayed &&
      av.totalCorrect === bv.totalCorrect &&
      av.totalAnswered === bv.totalAnswered &&
      av.bestStreak === bv.bestStreak
    );
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoaded(false);

      const localStorage = getStorageAdapter();
      const usingRemote = storage.kind === "api";

      setAuthError(null);

      let res;
      try {
        res = await loadData(storage);

        if (usingRemote) {
          const local = await loadData(localStorage);

          if (!res.found) {
            // First-time cloud user: push local progress up if it exists.
            if (local.found) {
              await saveData(storage, local.stats, local.history);
              res = local;
            }
          } else {
            // Cloud exists: merge local progress (e.g., user played signed-out) without wiping either side.
            const remoteStats = normalizeStats(res.stats);
            const localStats = normalizeStats(local.stats);

            const remoteHistory = res.history || {};
            const localHistory = local.history || {};

            const localIsSubset = historyIsSubset(localHistory, remoteHistory);
            const remoteIsSubset = historyIsSubset(remoteHistory, localHistory);

            let mergedHistory;
            if (localIsSubset) mergedHistory = remoteHistory;
            else if (remoteIsSubset) mergedHistory = localHistory;
            else mergedHistory = mergeHistoryMax(remoteHistory, localHistory);

            const totals = historyTotals(mergedHistory);
            const mergedStats = {
              gamesPlayed: Math.max(remoteStats.gamesPlayed, localStats.gamesPlayed),
              bestStreak: Math.max(remoteStats.bestStreak, localStats.bestStreak),
              totalCorrect: Math.max(totals.totalCorrect, remoteStats.totalCorrect, localStats.totalCorrect),
              totalAnswered: Math.max(totals.totalAnswered, remoteStats.totalAnswered, localStats.totalAnswered),
            };

            res = { stats: mergedStats, history: mergedHistory, found: true };

            // Keep both stores in sync after any login or cloud load.
            const shouldWriteRemote = !localIsSubset || !statsEqual(mergedStats, remoteStats);
            if (shouldWriteRemote) await saveData(storage, mergedStats, mergedHistory);
            await saveData(localStorage, mergedStats, mergedHistory);
          }
        }
      } catch (e) {
        if (usingRemote) {
          const status = e?.status;
          if (status === 401 || status === 403) {
            try {
              window.localStorage.removeItem(SESSION_AUTH_STORAGE_KEY);
              window.localStorage.removeItem(GOOGLE_AUTH_STORAGE_KEY);
            } catch (err) {
              // ignore
            }
            setUser(null);
          }
          setAuthError(`Cloud sync unavailable${status ? ` (${status})` : ""}. Using local data.`);
        }
        res = await loadData(localStorage);
      }

      if (cancelled) return;

      setStats(res.stats);
      setHistory(res.history);
      historyRef.current = res.history;
      setLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [storage]);

  const currentQ = questions[currentIdx];

  const handleGoogleSuccess = async (credentialResponse) => {
    const googleIdToken = credentialResponse?.credential;
    const googlePayload = decodeJwt(googleIdToken);
    if (!googlePayload) {
      setAuthError("Google sign-in returned an invalid token.");
      return;
    }

    const sessionToken = await exchangeGoogleIdTokenForSession(googleIdToken);
    const sessionUser = userFromToken(sessionToken, { kind: "session" });

    // If the user signs in after they've started playing, ensure in-memory progress is written to local storage
    // before swapping to the cloud adapter (so the login migration/merge can pick it up).
    try {
      const localStorage = getStorageAdapter();
      await saveData(localStorage, stats, historyRef.current);
    } catch (e) {
      // ignore
    }

    if (sessionUser) {
      try {
        window.localStorage.setItem(SESSION_AUTH_STORAGE_KEY, sessionToken);
        window.localStorage.removeItem(GOOGLE_AUTH_STORAGE_KEY);
      } catch (e) {
        // ignore
      }
      setUser(sessionUser);
    } else {
      // Fallback: store the Google token directly (short-lived). Backend still accepts it.
      try {
        window.localStorage.setItem(GOOGLE_AUTH_STORAGE_KEY, googleIdToken);
        window.localStorage.removeItem(SESSION_AUTH_STORAGE_KEY);
      } catch (e) {
        // ignore
      }

      setUser({
        kind: "google",
        credential: googleIdToken,
        sub: googlePayload.sub,
        email: googlePayload.email,
        name: googlePayload.name,
        picture: googlePayload.picture,
      });
    }

    setAuthError(null);
  };

  const handleGoogleError = () => {
    setAuthError("Google sign-in failed. Double-check your OAuth Client's authorized origins.");
  };

  const handleSignOut = () => {
    try {
      googleLogout();
    } catch (e) {
      // ignore
    }

    try {
      window.localStorage.removeItem(SESSION_AUTH_STORAGE_KEY);
      window.localStorage.removeItem(GOOGLE_AUTH_STORAGE_KEY);
    } catch (e) {
      // ignore
    }

    setUser(null);
  };

  const startGame = useCallback(() => {
    let pool = QUESTIONS;
    if (filterDifficulty !== "All") pool = pool.filter((q) => q.difficulty === filterDifficulty);

    const picked = shuffle(pool).slice(0, totalQuestions);

    setQuestions(picked);
    setCurrentIdx(0);
    setScore(0);
    setResults([]);
    setStreak(0);
    setBestStreak(0);
    setSelected(null);
    setShowNext(false);
    setShowDesc(false);
    setShowTemplate(false);

    if (picked.length > 0) setChoices(genChoices(picked[0].pattern, ALL_PATTERNS));

    setMode(MODES.PLAY);
  }, [filterDifficulty, totalQuestions]);

  const handleSelect = (choice) => {
    if (selected !== null) return;

    setSelected(choice);

    const correct = choice === currentQ.pattern;

    setHistory((prev) => {
      const e = prev[currentQ.id] || { correct: 0, wrong: 0 };
      const next = {
        ...prev,
        [currentQ.id]: { correct: e.correct + (correct ? 1 : 0), wrong: e.wrong + (correct ? 0 : 1) },
      };
      historyRef.current = next;
      return next;
    });

    if (correct) {
      setScore((s) => s + 1);
      setStreak((s) => {
        const ns = s + 1;
        setBestStreak((b) => Math.max(b, ns));
        return ns;
      });
    } else {
      setStreak(0);
    }

    setResults((r) => [...r, { question: currentQ, chosen: choice, correct }]);
    setShowNext(true);
  };

  const nextQuestion = () => {
    if (currentIdx + 1 >= questions.length) {
      const finalCorrect = results.filter((r) => r.correct).length;
      const ns = {
        gamesPlayed: stats.gamesPlayed + 1,
        totalCorrect: stats.totalCorrect + finalCorrect,
        totalAnswered: stats.totalAnswered + questions.length,
        bestStreak: Math.max(stats.bestStreak, bestStreak),
      };
      setStats(ns);
      saveData(storageRef.current, ns, historyRef.current);
      setMode(MODES.RESULTS);
      setExpandedResult({});
      return;
    }

    const ni = currentIdx + 1;
    setCurrentIdx(ni);
    setSelected(null);
    setShowNext(false);
    setShowDesc(false);
    setShowTemplate(false);
    setChoices(genChoices(questions[ni].pattern, ALL_PATTERNS));
  };

  const resetAllData = async () => {
    const f = { ...DEFAULT_STATS };
    setStats(f);
    setHistory({});
    historyRef.current = {};
    await saveData(storageRef.current, f, {});
    setShowResetConfirm(false);
  };

  useEffect(() => {
    const handler = (e) => {
      if (mode !== MODES.PLAY) return;

      if (showNext && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        nextQuestion();
        return;
      }

      if (e.key === "d" || e.key === "D") {
        setShowDesc((p) => !p);
        return;
      }

      if (e.key === "t" || e.key === "T") {
        if (showNext) setShowTemplate((p) => !p);
        return;
      }

      if (!showNext && selected === null) {
        const n = parseInt(e.key);
        if (n >= 1 && n <= 4 && choices[n - 1]) handleSelect(choices[n - 1]);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode, showNext, selected, choices, currentIdx, questions, showTemplate]);

  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const lifetimePct = stats.totalAnswered > 0 ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100) : 0;

  const weakSpots = QUESTIONS.filter((q) => {
    const h = history[q.id];
    if (!h) return false;
    const t = h.correct + h.wrong;
    return t >= 2 && h.correct / t < 0.6;
  }).sort((a, b) => {
    const ha = history[a.id],
      hb = history[b.id];
    return ha.correct / (ha.correct + ha.wrong) - hb.correct / (hb.correct + hb.wrong);
  });

  const masteredCount = QUESTIONS.filter((q) => {
    const h = history[q.id];
    if (!h) return false;
    const t = h.correct + h.wrong;
    return t >= 2 && h.correct / t >= 0.8;
  }).length;

  const groupedByPattern = {};
  const browseList = browseFilter === "All" ? QUESTIONS : QUESTIONS.filter((q) => q.difficulty === browseFilter);
  browseList.forEach((q) => {
    if (!groupedByPattern[q.pattern]) groupedByPattern[q.pattern] = [];
    groupedByPattern[q.pattern].push(q);
  });

  const GLOBAL_CSS = `
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700&family=Outfit:wght@300;400;500;600;700;800&display=swap');

        :root{
          color-scheme: dark;

          --bg-page:#0a0a12;
          --bg-app:#0a0a12;
          --surface-1:#111120;
          --surface-2:#151528;
          --border:#1a1a2a;
          --border-strong:#222238;

          --text:#f0f1f4;
          --text-strong:#f0f1f4;
          --muted:#c0c4d0;
          --dim:#8b8fa3;
          --faint:#60657b;

          --accent:#10b981;
          --accent2:#0ea5e9;
          --info:#3b82f6;
          --warn:#f59e0b;
          --danger:#ef4444;

          --shadow-soft:0 12px 32px rgba(0,0,0,0.35);
          --shadow:0 18px 60px rgba(0,0,0,0.45);
        }

        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{height:100%;}
        body{
          background:
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16,185,129,0.07), transparent),
            radial-gradient(ellipse 60% 40% at 80% 100%, rgba(59,130,246,0.05), transparent),
            var(--bg-page);
          color:var(--text);
          font-family:'DM Sans',system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
          font-size:15px;
          line-height:1.55;
          -webkit-font-smoothing:antialiased;
          text-rendering:optimizeLegibility;
        }

        button,input,textarea,select{font:inherit;color:inherit;}
        button{-webkit-tap-highlight-color:transparent;}
        :focus-visible{outline:2px solid rgba(16,185,129,0.55);outline-offset:2px;}
        ::selection{background:rgba(16,185,129,0.22);}
        a{color:inherit;}

        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeSlideIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
        @keyframes barGrow{from{width:0}}
        @keyframes descReveal{from{opacity:0;max-height:0}to{opacity:1;max-height:2000px}}
        @keyframes pulseGlow{0%,100%{box-shadow:0 0 20px rgba(16,185,129,0.15),0 0 60px rgba(16,185,129,0.05)}50%{box-shadow:0 0 25px rgba(16,185,129,0.25),0 0 80px rgba(16,185,129,0.1)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}

        .hover-row:hover{background:rgba(240,240,248,0.04)!important}
        pre::-webkit-scrollbar{height:6px}
        pre::-webkit-scrollbar-thumb{background:rgba(240,240,248,0.14);border-radius:999px}
      `;

  const globalStyles = <style>{GLOBAL_CSS}</style>;

  if (!loaded) {
    return (
      <div style={{ ...S.root, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        {globalStyles}
        <span style={{ color: "var(--dim)", animation: "pulse 1s ease-in-out infinite" }}>
          loading...
        </span>
      </div>
    );
  }

  return (
    <div style={S.root}>
      {globalStyles}

        {mode === MODES.MENU && (
          <MenuScreen
            stats={stats}
            lifetimePct={lifetimePct}
            masteredCount={masteredCount}
            totalAvailableQuestions={QUESTIONS.length}
            weakSpots={weakSpots}
            history={history}
            user={user}
            authError={authError}
          onGoogleSuccess={handleGoogleSuccess}
          onGoogleError={handleGoogleError}
          onSignOut={handleSignOut}
          filterDifficulty={filterDifficulty}
          setFilterDifficulty={setFilterDifficulty}
          totalQuestions={totalQuestions}
          setTotalQuestions={setTotalQuestions}
          startGame={startGame}
          goBrowse={() => setMode(MODES.BROWSE)}
          goTemplates={() => setMode(MODES.TEMPLATES)}
          showResetConfirm={showResetConfirm}
          setShowResetConfirm={setShowResetConfirm}
          resetAllData={resetAllData}
        />
      )}

      {mode === MODES.PLAY && (
        <PlayScreen
          currentQ={currentQ}
          currentIdx={currentIdx}
          total={questions.length}
          score={score}
          streak={streak}
          choices={choices}
          selected={selected}
          showDesc={showDesc}
          setShowDesc={setShowDesc}
          showNext={showNext}
          onSelect={handleSelect}
          onNext={nextQuestion}
          onBack={() => setMode(MODES.MENU)}
          showTemplate={showTemplate}
          setShowTemplate={setShowTemplate}
          history={history}
        />
      )}

      {mode === MODES.RESULTS && (
        <ResultsScreen
          user={user}
          pct={pct}
          score={score}
          total={questions.length}
          bestStreak={bestStreak}
          stats={stats}
          lifetimePct={lifetimePct}
          results={results}
          expandedResult={expandedResult}
          setExpandedResult={setExpandedResult}
          startGame={startGame}
          goMenu={() => setMode(MODES.MENU)}
          history={history}
        />
      )}

      {mode === MODES.BROWSE && (
        <BrowseScreen
          browseFilter={browseFilter}
          setBrowseFilter={setBrowseFilter}
          groupedByPattern={groupedByPattern}
          expandedBrowse={expandedBrowse}
          setExpandedBrowse={setExpandedBrowse}
          goMenu={() => setMode(MODES.MENU)}
          history={history}
        />
      )}

      {mode === MODES.TEMPLATES && <TemplatesScreen goMenu={() => setMode(MODES.MENU)} />}
    </div>
  );
}

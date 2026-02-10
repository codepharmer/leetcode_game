import { useCallback, useEffect, useRef, useState } from "react";

import { googleLogout } from "@react-oauth/google";

import { ALL_PATTERNS, QUESTIONS } from "./lib/questions";
import { DEFAULT_STATS, MODES } from "./lib/constants";
import { decodeGoogleCredential, GOOGLE_AUTH_STORAGE_KEY } from "./lib/auth";
import { loadData, saveData } from "./lib/storage";
import { genChoices, shuffle } from "./lib/utils";
import { S } from "./styles";

import { BrowseScreen } from "./screens/BrowseScreen";
import { MenuScreen } from "./screens/MenuScreen";
import { PlayScreen } from "./screens/PlayScreen";
import { ResultsScreen } from "./screens/ResultsScreen";
import { TemplatesScreen } from "./screens/TemplatesScreen";

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

  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const credential = window.localStorage.getItem(GOOGLE_AUTH_STORAGE_KEY);
    const payload = decodeGoogleCredential(credential);
    if (!payload) {
      if (credential) window.localStorage.removeItem(GOOGLE_AUTH_STORAGE_KEY);
      return;
    }

    setUser({
      credential,
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    });
  }, []);

  useEffect(() => {
    loadData().then(({ stats: s, history: h }) => {
      setStats(s);
      setHistory(h);
      historyRef.current = h;
      setLoaded(true);
    });
  }, []);

  const currentQ = questions[currentIdx];

  const handleGoogleSuccess = (credentialResponse) => {
    const credential = credentialResponse?.credential;
    const payload = decodeGoogleCredential(credential);
    if (!payload) {
      setAuthError("Google sign-in returned an invalid token.");
      return;
    }

    try {
      window.localStorage.setItem(GOOGLE_AUTH_STORAGE_KEY, credential);
    } catch (e) {
      // ignore
    }

    setUser({
      credential,
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    });
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
      saveData(ns, historyRef.current);
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
    await saveData(f, {});
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

  if (!loaded) {
    return (
      <div style={{ ...S.root, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <span style={{ color: "#565f89", fontFamily: "'JetBrains Mono',monospace", animation: "pulse 1s ease-in-out infinite" }}>
          loading...
        </span>
      </div>
    );
  }

  return (
    <div style={S.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}body{background:#1a1b26;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
        @keyframes barGrow{from{width:0}}
        @keyframes descReveal{from{opacity:0;max-height:0}to{opacity:1;max-height:2000px}}
        .hover-row:hover{background:#24253a!important}
        pre::-webkit-scrollbar{height:4px}pre::-webkit-scrollbar-thumb{background:#3b3d52;border-radius:2px}
      `}</style>

      {mode === MODES.MENU && (
        <MenuScreen
          stats={stats}
          lifetimePct={lifetimePct}
          masteredCount={masteredCount}
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

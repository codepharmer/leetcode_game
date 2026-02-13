import { useEffect, useState } from "react";

import { S } from "../../styles";
import { BlueprintDailyView } from "./BlueprintDailyView";
import { BlueprintMapView } from "./BlueprintMapView";
import { BlueprintWorldDetailView } from "./BlueprintWorldDetailView";

const TAB_MAP = "map";
const TAB_DAILY = "daily";

export function BlueprintMenu({
  goMenu,
  campaign,
  completed,
  selectedWorld,
  setSelectedWorldId,
  startChallenge,
  totalStars,
}) {
  const [menuView, setMenuView] = useState(TAB_MAP);

  useEffect(() => {
    if (menuView !== "world") return;
    if (selectedWorld?.isUnlocked) return;
    setMenuView(TAB_MAP);
  }, [menuView, selectedWorld]);

  const openWorldDetail = (worldId) => {
    setSelectedWorldId(worldId);
    setMenuView("world");
  };

  const activeTab = menuView === TAB_DAILY ? TAB_DAILY : TAB_MAP;

  return (
    <div style={S.blueprintMenuContainer}>
      <div style={S.topBar}>
        <button onClick={goMenu} style={{ ...S.backBtn, minHeight: 44, minWidth: 44 }}>
          back
        </button>
        <span style={S.blueprintTitle}>Blueprint Builder</span>
        <div style={S.blueprintTopMeta}>stars: {totalStars}</div>
      </div>

      {menuView === TAB_MAP ? (
        <BlueprintMapView
          campaign={campaign}
          completed={completed}
          onOpenDaily={() => setMenuView(TAB_DAILY)}
          onOpenWorld={openWorldDetail}
          onContinue={startChallenge}
        />
      ) : null}

      {menuView === "world" ? (
        <BlueprintWorldDetailView
          world={selectedWorld}
          completed={completed}
          onBack={() => setMenuView(TAB_MAP)}
          onStartChallenge={startChallenge}
        />
      ) : null}

      {menuView === TAB_DAILY ? (
        <BlueprintDailyView
          dailyChallenge={campaign.dailyChallenge}
          completed={completed}
          onBack={() => setMenuView(TAB_MAP)}
          onStartChallenge={startChallenge}
        />
      ) : null}

      <div aria-hidden="true" style={S.blueprintTabFade} />
      <div style={S.blueprintTabBar}>
        <button
          className="pressable-200"
          onClick={() => setMenuView(TAB_MAP)}
          style={{ ...S.blueprintTabBtn, ...(activeTab === TAB_MAP ? S.blueprintTabBtnActive : null) }}
        >
          Map
        </button>
        <button
          className="pressable-200"
          onClick={() => setMenuView(TAB_DAILY)}
          style={{ ...S.blueprintTabBtn, ...(activeTab === TAB_DAILY ? S.blueprintTabBtnActive : null) }}
        >
          Daily
        </button>
        <button className="pressable-200" disabled style={{ ...S.blueprintTabBtn, opacity: 0.45, cursor: "not-allowed" }}>
          Stats
        </button>
      </div>
    </div>
  );
}

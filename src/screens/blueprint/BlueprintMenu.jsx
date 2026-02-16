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
  startChallenge,
  totalStars,
  menuView = TAB_MAP,
  onOpenMap,
  onOpenDaily,
  onOpenWorld,
}) {
  const activeTab = menuView === TAB_DAILY ? TAB_DAILY : TAB_MAP;
  const isMapView = menuView === TAB_MAP;

  return (
    <div style={S.blueprintMenuContainer}>
      {isMapView ? (
        <div style={S.topBar}>
          <button onClick={goMenu} style={{ ...S.backBtn, minHeight: 44, minWidth: 44 }}>
            back
          </button>
          <span style={S.blueprintTitle}>Blueprint Builder</span>
          <div style={S.blueprintTopMeta}>stars: {totalStars}</div>
        </div>
      ) : null}

      {menuView === TAB_MAP ? (
        <BlueprintMapView
          campaign={campaign}
          completed={completed}
          onOpenDaily={onOpenDaily}
          onOpenWorld={onOpenWorld}
          onContinue={startChallenge}
        />
      ) : null}

      {menuView === "world" ? (
        <BlueprintWorldDetailView
          world={selectedWorld}
          completed={completed}
          totalStars={totalStars}
          onBack={onOpenMap}
          onStartChallenge={startChallenge}
        />
      ) : null}

      {menuView === TAB_DAILY ? (
        <BlueprintDailyView
          dailyChallenge={campaign.dailyChallenge}
          completed={completed}
          onBack={onOpenMap}
          onStartChallenge={startChallenge}
        />
      ) : null}

      <div aria-hidden="true" style={S.blueprintTabFade} />
      <div style={{ ...S.blueprintTabBar, gridTemplateColumns: "1fr 1fr" }}>
        <button
          className="pressable-200"
          onClick={onOpenMap}
          style={{ ...S.blueprintTabBtn, ...(activeTab === TAB_MAP ? S.blueprintTabBtnActive : null) }}
        >
          Map
        </button>
        <button
          className="pressable-200"
          onClick={onOpenDaily}
          style={{ ...S.blueprintTabBtn, ...(activeTab === TAB_DAILY ? S.blueprintTabBtnActive : null) }}
        >
          Daily
        </button>
      </div>
    </div>
  );
}

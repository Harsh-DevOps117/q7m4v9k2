import { useState } from "react";
import { Wind, AlertTriangle } from "lucide-react";
import type { Tab } from "./types";
import { Sidebar } from "./components/Sidebar";
import { DecisionControls } from "./components/DecisionControls";
import { DecisionPage } from "./pages/DecisionPage";
import { AccuracyPage } from "./pages/AccuracyPage";
import { MethodologyPage } from "./pages/MethodologyPage";
import { useWindData } from "./hooks/useWindData";
export default function App() {
  const [tab, setTab] = useState<Tab>("desk");
  const [decision, setDecision] = useState("2026-01-15");
  const [cutoff, setCutoff] = useState("09:00");
  const [actuals, setActuals] = useState(false);
  const { day, accuracy, meta, loading, error, reload } = useWindData(
    decision,
    cutoff,
  );
  const exportUrl = `/api/export.csv?cutoff=${cutoff}${tab === "desk" ? `&decision_date=${decision}` : ""}`;
  return (
    <div className="app-shell">
      <Sidebar tab={tab} setTab={setTab} />
      <main>
        <header className="topbar">
          <div>
            Wholesale intelligence <span>/</span>{" "}
            <strong>
              {tab === "desk"
                ? "Decision workspace"
                : tab === "accuracy"
                  ? "Forecast accuracy"
                  : "Data & methodology"}
            </strong>
          </div>
          <span className="snapshot-pill">
            <span /> Historical snapshot
          </span>
        </header>
        <div className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow green">DAY-AHEAD WIND INTELLIGENCE</div>
              <h1>
                {tab === "desk"
                  ? "Tomorrow, with perspective."
                  : tab === "accuracy"
                    ? "Know the forecast’s limits."
                    : "Confidence starts with evidence."}
              </h1>
              <p>
                {tab === "desk"
                  ? "The wind outlook available at your decision time, with historical error in view."
                  : tab === "accuracy"
                    ? "A transparent backtest of the forecasts available for January purchase decisions."
                    : "Every forecast has a timestamp. Every number has a definition."}
              </p>
            </div>
            <span className="edition">
              PILOT 01 <span>↗</span>
            </span>
          </div>
          <DecisionControls
            decision={decision}
            setDecision={setDecision}
            cutoff={cutoff}
            setCutoff={setCutoff}
            delivery={day?.delivery_date}
            loading={loading || !!error}
            exportUrl={exportUrl}
          />
          {loading ? (
            <div className="loading" role="status">
              <Wind size={32} />
              <h2>Reconstructing the decision…</h2>
              <p>Selecting forecasts published by {cutoff} London time.</p>
            </div>
          ) : error ? (
            <div className="error" role="alert">
              <AlertTriangle />
              <h2>Data unavailable</h2>
              <p>{error}</p>
              <button onClick={() => reload()}>Try again</button>
            </div>
          ) : (
            day &&
            accuracy && (
              <>
                {tab === "desk" && (
                  <DecisionPage
                    day={day}
                    decision={decision}
                    cutoff={cutoff}
                    setTab={setTab}
                    actuals={actuals}
                    setActuals={setActuals}
                  />
                )}
                {tab === "accuracy" && (
                  <AccuracyPage
                    accuracy={accuracy}
                    decision={decision}
                    cutoff={cutoff}
                    onSelectDay={(d) => {
                      setDecision(d);
                      setTab("desk");
                      setActuals(true);
                    }}
                  />
                )}
                {tab === "method" && <MethodologyPage meta={meta} />}
              </>
            )
          )}
          <footer>
            <span>
              <Wind size={15} /> WIND DESK{" "}
              <span className="footer-divider">/</span> Elexon data · January
              2026 decisions
            </span>
            <span>Built for a more informed day ahead.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

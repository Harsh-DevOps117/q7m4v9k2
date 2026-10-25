import {
  Wind,
  Activity,
  ChartNoAxesCombined,
  BookOpen,
  Database,
} from "lucide-react";
import type { Tab } from "../types";
export function Sidebar({
  tab,
  setTab,
}: {
  tab: Tab;
  setTab: (v: Tab) => void;
}) {
  return (
    <aside className="sidebar">
      <a className="brand" href="/">
        <span className="brand-icon">
          <Wind size={25} />
        </span>
        wind<span className="brand-light">desk</span>
        <span className="brand-dot">.</span>
      </a>
      <div className="workspace-label">ENERGY INTELLIGENCE</div>
      <nav aria-label="Main navigation">
        {[
          { id: "desk", icon: Activity, label: "Decision workspace" },
          {
            id: "accuracy",
            icon: ChartNoAxesCombined,
            label: "Forecast accuracy",
          },
          { id: "method", icon: BookOpen, label: "Data & methodology" },
        ].map((item) => (
          <button
            key={item.id}
            className={tab === item.id ? "nav active" : "nav"}
            onClick={() => setTab(item.id as Tab)}
          >
            <item.icon size={18} />
            {item.label}
            {tab === item.id && <span className="active-dot" />}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="pilot-badge">
          <span /> JANUARY PILOT
        </div>
        <p>A clearer view of tomorrow’s wind.</p>
        <div className="source-mini">
          <Database size={15} /> Powered by Elexon
        </div>
        <small>Great Britain · National wind</small>
      </div>
    </aside>
  );
}

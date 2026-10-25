import {
  Info,
  Wind,
  ShieldCheck,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import type { Day, Tab } from "../types";
import { number, dateLabel, timeLabel, signed } from "../lib/format";
import { Stat } from "../components/Stat";
import { useState } from "react";
export function DecisionPage({
  day,
  decision,
  cutoff,
  setTab,
  actuals,
  setActuals,
}: {
  day: Day;
  decision: string;
  cutoff: string;
  setTab: (t: Tab) => void;
  actuals: boolean;
  setActuals: (v: boolean) => void;
}) {
  const [table, setTable] = useState(false);
  const data = day?.rows.map((r) => ({
    ...r,
    forecast_gw: r.forecast_mw == null ? null : r.forecast_mw / 1000,
    actual_gw: r.actual_mw == null ? null : r.actual_mw / 1000,
    range:
      day.history.sample_days >= 5 && r.forecast_mw !== null
        ? [
            Math.max(
              0,
              (r.forecast_mw - (day.history.p90_error_mw ?? 0)) / 1000,
            ),
            Math.max(
              0,
              (r.forecast_mw - (day.history.p10_error_mw ?? 0)) / 1000,
            ),
          ]
        : null,
  }));
  return (
    <>
      <div className="notice">
        <ShieldCheck size={17} />
        <span>
          <strong>As-of selection.</strong> Only publications at or before{" "}
          {dateLabel(decision)}, {cutoff} GMT are included.
        </span>
        <span className="notice-right">
          {day.forecast_hours}/24 forecast hours
        </span>
      </div>
      <div className="stats">
        <Stat
          label="Expected wind energy"
          value={number(
            day.forecast_energy_mwh == null
              ? null
              : day.forecast_energy_mwh / 1000,
            1,
          )}
          unit="GWh"
          note="Delivery day · hourly forecast sum"
          accent
        />
        <Stat
          label="Average wind output"
          value={number(
            day.mean_forecast_mw == null ? null : day.mean_forecast_mw / 1000,
            2,
          )}
          unit="GW"
          note={`${day.forecast_hours} hourly forecasts available`}
        />
        <Stat
          label="Prior mean absolute error"
          value={number(day.history.metrics.mae_mw)}
          unit="MW"
          note={`${day.history.sample_days} earlier delivery days · ${day.history.sample_hours} hours`}
        />
        <Stat
          label="Oldest forecast age"
          value={number(day.max_forecast_age_hours, 1)}
          unit="h"
          note="Age at the selected decision cutoff"
        />
      </div>
      <div className="desk-grid">
        <section className="panel chart-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">DELIVERY PROFILE</span>
              <h2>Wind through the day</h2>
              <p>{dateLabel(day.delivery_date)} · hourly output · GW</p>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={actuals}
                onChange={(e) => setActuals(e.target.checked)}
              />
              <span /> Show actuals
            </label>
          </div>
          <div className="chart-legend">
            <span>
              <i className="line-key" /> As-of forecast
            </span>
            {day.history.sample_days >= 5 && (
              <span>
                <i className="area-key" /> Prior error scenario
              </span>
            )}
            {actuals && (
              <span>
                <i className="line-key actual" /> Actual (retrospective)
              </span>
            )}
          </div>
          <div
            className="chart"
            role="img"
            aria-label="Hourly wind forecast. Exact values are available in the interval audit table."
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={data}
                margin={{ top: 12, right: 18, left: -15, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 5"
                  vertical={false}
                  stroke="#e4eae7"
                />
                <XAxis
                  dataKey="hour"
                  interval={3}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#788780" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#788780" }}
                  domain={[0, "auto"]}
                />
                <Tooltip
                  contentStyle={{
                    border: "1px solid #dce5df",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(v, n) => [
                    Array.isArray(v)
                      ? v.map((x) => number(Number(x), 2)).join(" – ")
                      : number(v == null ? null : Number(v), 2),
                    n,
                  ]}
                />
                {day.history.sample_days >= 5 && (
                  <Area
                    type="linear"
                    dataKey="range"
                    name="Scenario range (GW)"
                    stroke="none"
                    fill="#dcece4"
                    fillOpacity={0.85}
                    isAnimationActive={false}
                  />
                )}
                <Line
                  type="linear"
                  dataKey="forecast_gw"
                  name="Forecast (GW)"
                  stroke="#267657"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
                {actuals && (
                  <Line
                    type="linear"
                    dataKey="actual_gw"
                    name="Actual (GW)"
                    stroke="#b8864c"
                    strokeWidth={2.5}
                    strokeDasharray="5 4"
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-foot">
            <Info size={14} />
            {day.history.sample_days >= 5
              ? "Shaded range applies prior P10–P90 signed errors to this forecast. It is a scenario, not a calibrated confidence interval."
              : "Not enough prior days for an error scenario. At least 5 earlier delivery days are required."}
          </div>
        </section>
        <section className="insight-card">
          <span className="insight-icon">
            <Wind size={24} />
          </span>
          <span className="eyebrow">THE PROCUREMENT PERSPECTIVE</span>
          <h2>
            Plan for the wind.
            <br />
            Account for the miss.
          </h2>
          <p>
            When forecast wind exceeds actual wind, the system has less
            renewable output than expected.
          </p>
          <div className="risk-number">
            <span>Prior P90 overforecast error</span>
            <strong>
              {signed(day.history.p90_error_mw)} <small>MW</small>
            </strong>
          </div>
          <p className="risk-detail">
            Signed forecast minus actual, across {day.history.sample_hours}{" "}
            earlier matched hours. A historical stress reference, not a purchase
            instruction.
          </p>
          <div className="scope-note">
            This is national wind intelligence. A utility purchase volume also
            needs demand, contracted supply and portfolio exposure.
          </div>
          <button onClick={() => setTab("accuracy")}>
            Explore forecast accuracy <ArrowUpRight size={17} />
          </button>
        </section>
      </div>
      {actuals && (
        <div className="retrospective">
          <Info size={16} />
          <span>
            <strong>Retrospective overlay:</strong> actuals were not available
            at the decision cutoff. This day’s MAE is{" "}
            {number(day.metrics.mae_mw)} MW across {day.metrics.matched_hours}
            /24 matched hours.
          </span>
        </div>
      )}
      <section className="panel audit">
        <button
          className="audit-button"
          aria-expanded={table}
          onClick={() => setTable(!table)}
        >
          <div>
            <span className="eyebrow">TRACE EVERY VALUE</span>
            <h2>Interval audit trail</h2>
          </div>
          <span>
            {table ? "Hide" : "Show"} 24 hours{" "}
            <ChevronRight className={table ? "rotate" : ""} size={18} />
          </span>
        </button>
        {table && (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Delivery hour</th>
                  <th>Forecast MW</th>
                  <th>Published GMT</th>
                  <th>Lead time</th>
                  {actuals && (
                    <>
                      <th>Actual MW</th>
                      <th>Error MW</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {day.rows.map((r) => (
                  <tr key={r.hour}>
                    <td>{r.hour}</td>
                    <td>{number(r.forecast_mw)}</td>
                    <td>{timeLabel(r.publish_time)}</td>
                    <td>{number(r.lead_hours, 1)} h</td>
                    {actuals && (
                      <>
                        <td>{number(r.actual_mw, 1)}</td>
                        <td
                          className={
                            (r.error_mw ?? 0) > 0 ? "positive-error" : ""
                          }
                        >
                          {signed(r.error_mw)}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

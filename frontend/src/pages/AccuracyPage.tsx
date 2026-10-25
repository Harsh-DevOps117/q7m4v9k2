import { Info } from "lucide-react";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  ReferenceLine,
  Cell,
} from "recharts";
import type { Accuracy } from "../types";
import { number, dateLabel, signed } from "../lib/format";
import { Stat } from "../components/Stat";
export function AccuracyPage({
  accuracy,
  cutoff,
  decision,
  onSelectDay,
}: {
  accuracy: Accuracy;
  cutoff: string;
  decision: string;
  onSelectDay: (d: string) => void;
}) {
  return (
    <>
      <div className="notice amber">
        <Info size={17} />
        <span>
          <strong>Retrospective backtest.</strong> 1–31 January decisions → 2
          January–1 February deliveries. Cutoff: {cutoff} GMT.
        </span>
      </div>
      <div className="stats">
        <Stat
          label="Mean absolute error"
          value={number(accuracy.metrics.mae_mw)}
          unit="MW"
          note="Average magnitude of forecast misses"
          accent
        />
        <Stat
          label="Root mean squared error"
          value={number(accuracy.metrics.rmse_mw)}
          unit="MW"
          note="Larger misses carry greater weight"
        />
        <Stat
          label="Signed bias"
          value={signed(accuracy.metrics.bias_mw)}
          unit="MW"
          note="Positive = forecast exceeds actual"
        />
        <Stat
          label="Matched data coverage"
          value={number(accuracy.metrics.coverage_pct, 1)}
          unit="%"
          note={`${accuracy.metrics.matched_hours} of ${accuracy.metrics.expected_hours} expected hours`}
        />
      </div>
      <div className="accuracy-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">DAILY PERFORMANCE</span>
              <h2>Some days are harder to call</h2>
              <p>Mean absolute error by January decision date · MW</p>
            </div>
            <span className="small-tag">Click a day to inspect</span>
          </div>
          <div
            className="chart"
            role="img"
            aria-label="Daily mean absolute error"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={accuracy.days.map((d) => ({
                  ...d,
                  date: d.decision_date.slice(-2),
                  mae: d.metrics.mae_mw,
                }))}
                margin={{ left: -12, right: 12 }}
              >
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 5"
                  stroke="#e4eae7"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                  interval={2}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(v) => [
                    number(v == null ? null : Number(v)) + " MW",
                    "MAE",
                  ]}
                  labelFormatter={(v) => `Decision: ${v} Jan`}
                />
                <Bar
                  dataKey="mae"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                  onClick={(_, index) =>
                    onSelectDay(accuracy.days[index].decision_date)
                  }
                  cursor="pointer"
                >
                  {accuracy.days.map((d) => (
                    <Cell
                      key={d.decision_date}
                      fill={
                        d.decision_date === decision ? "#b88a51" : "#73a68b"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="panel scorecard">
          <span className="eyebrow">ERROR IN CONTEXT</span>
          <h2>Beyond the average</h2>
          <div>
            <span>Weighted absolute percentage error</span>
            <strong>{number(accuracy.metrics.wape_pct, 1)}%</strong>
            <p>Absolute error divided by total actual generation.</p>
          </div>
          <div>
            <span>90th percentile absolute error</span>
            <strong>
              {number(accuracy.metrics.p90_abs_error_mw)} <small>MW</small>
            </strong>
            <p>90% of matched hourly misses were at or below this magnitude.</p>
          </div>
          <div>
            <span>Hours with overforecast wind</span>
            <strong>{number(accuracy.metrics.overforecast_pct, 1)}%</strong>
            <p>Frequency of forecast exceeding actual output.</p>
          </div>
        </section>
      </div>
      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">TIME-OF-DAY PATTERN</span>
            <h2>Where the forecast leans</h2>
            <p>
              Mean signed error by delivery hour · positive means overforecast ·
              MW
            </p>
          </div>
        </div>
        <div className="chart short">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={accuracy.by_hour} margin={{ left: -10, right: 18 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 5" />
              <XAxis
                dataKey="hour"
                interval={2}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <ReferenceLine y={0} stroke="#76857a" />
              <Tooltip
                formatter={(v) => [
                  signed(v == null ? null : Number(v)) + " MW",
                  "Bias",
                ]}
              />
              <Bar
                dataKey="bias_mw"
                radius={[3, 3, 0, 0]}
                fill="#b48a58"
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="panel audit">
        <div className="panel-header">
          <h2>Daily scorecard</h2>
          <span className="small-tag">Select a date to open its workspace</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Decision date</th>
                <th>Delivery date</th>
                <th>MAE MW</th>
                <th>RMSE MW</th>
                <th>Bias MW</th>
                <th>Coverage</th>
              </tr>
            </thead>
            <tbody>
              {accuracy.days.map((d) => (
                <tr key={d.decision_date}>
                  <td>
                    <button
                      className="table-link"
                      onClick={() => {
                        onSelectDay(d.decision_date);
                      }}
                    >
                      {dateLabel(d.decision_date)} ↗
                    </button>
                  </td>
                  <td>{dateLabel(d.delivery_date)}</td>
                  <td>{number(d.metrics.mae_mw)}</td>
                  <td>{number(d.metrics.rmse_mw)}</td>
                  <td>{signed(d.metrics.bias_mw)}</td>
                  <td>{d.metrics.matched_hours}/24</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

import {
  CalendarDays,
  Clock3,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Download,
} from "lucide-react";
import { dateLabel } from "../lib/format";
export function DecisionControls({
  decision,
  setDecision,
  cutoff,
  setCutoff,
  delivery,
  loading,
  exportUrl,
}: {
  decision: string;
  setDecision: (v: string) => void;
  cutoff: string;
  setCutoff: (v: string) => void;
  delivery?: string;
  loading: boolean;
  exportUrl: string;
}) {
  const changeDay = (n: number) => {
    const d = new Date(decision + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + n);
    const next = d.toISOString().slice(0, 10);
    if (next >= "2026-01-01" && next <= "2026-01-31") setDecision(next);
  };
  return (
    <section className="controls" aria-label="Decision settings">
      <div className="control-group">
        <CalendarDays size={19} />
        <label>
          Decision date
          <input
            aria-label="Decision date"
            type="date"
            min="2026-01-01"
            max="2026-01-31"
            value={decision}
            onChange={(e) => {
              if (
                e.target.value >= "2026-01-01" &&
                e.target.value <= "2026-01-31"
              )
                setDecision(e.target.value);
            }}
          />
        </label>
        <div className="stepper">
          <button
            aria-label="Previous day"
            disabled={decision === "2026-01-01"}
            onClick={() => changeDay(-1)}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            aria-label="Next day"
            disabled={decision === "2026-01-31"}
            onClick={() => changeDay(1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="control-group time-control">
        <Clock3 size={19} />
        <label>
          Decision cutoff · London
          <select
            aria-label="Decision cutoff"
            value={cutoff}
            onChange={(e) => setCutoff(e.target.value)}
          >
            {[
              "05:00",
              "07:00",
              "09:00",
              "09:20",
              "10:00",
              "11:00",
              "12:00",
              "16:00",
              "23:00",
            ].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="delivery-label">
        <span>DELIVERY DAY</span>
        <strong>
          {delivery && !loading ? dateLabel(delivery) : "—"}{" "}
          <ArrowRight size={15} />
        </strong>
      </div>
      <a
        className={"export-button " + (loading ? "disabled" : "")}
        aria-disabled={loading}
        href={loading ? undefined : exportUrl}
      >
        <Download size={16} /> Export CSV
      </a>
    </section>
  );
}

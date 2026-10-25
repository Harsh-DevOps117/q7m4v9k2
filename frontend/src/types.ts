export type Metrics = {
  matched_hours: number;
  expected_hours: number;
  coverage_pct: number;
  mae_mw: number | null;
  rmse_mw: number | null;
  bias_mw: number | null;
  wape_pct: number | null;
  p90_abs_error_mw: number | null;
  overforecast_pct: number | null;
};
export type Row = {
  start_time: string;
  hour: string;
  forecast_mw: number | null;
  actual_mw: number | null;
  error_mw: number | null;
  publish_time: string | null;
  forecast_age_hours: number | null;
  lead_hours: number | null;
};
export type DaySummary = {
  decision_date: string;
  delivery_date: string;
  cutoff: string;
  metrics: Metrics;
  forecast_hours: number;
  forecast_energy_mwh: number | null;
  mean_forecast_mw: number | null;
  max_forecast_age_hours: number | null;
};
export type Day = DaySummary & {
  rows: Row[];
  history: {
    sample_hours: number;
    sample_days: number;
    p10_error_mw: number | null;
    p90_error_mw: number | null;
    metrics: Metrics;
  };
};
export type Accuracy = {
  metrics: Metrics;
  days: DaySummary[];
  by_hour: (Metrics & { hour: string })[];
};

export type Tab = "desk" | "accuracy" | "method";
export type Metadata = {
  retrieved_at: string;
  records: Record<string, number>;
  sha256_uncompressed: string;
};

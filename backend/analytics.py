"""Pure as-of selection and scoring. All errors use forecast minus actual, MW."""

from collections import defaultdict
from datetime import date, datetime, timedelta
from math import isfinite, sqrt
from statistics import mean
from zoneinfo import ZoneInfo

LONDON = ZoneInfo("Europe/London")


def timestamp(value):
    dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        raise ValueError("Timezone required")
    return dt


def quantile(values, p):
    if not values:
        return None
    ordered = sorted(values)
    position = (len(ordered) - 1) * p
    low = int(position)
    return ordered[low] + (ordered[min(low + 1, len(ordered) - 1)] - ordered[low]) * (
        position - low
    )


def metrics(rows):
    pairs = [
        r for r in rows if r["forecast_mw"] is not None and r["actual_mw"] is not None
    ]
    errors = [r["forecast_mw"] - r["actual_mw"] for r in pairs]
    base = {
        "matched_hours": len(pairs),
        "expected_hours": len(rows),
        "coverage_pct": 100 * len(pairs) / len(rows) if rows else 0,
    }
    if not errors:
        return {
            **base,
            **dict.fromkeys(
                [
                    "mae_mw",
                    "rmse_mw",
                    "bias_mw",
                    "wape_pct",
                    "p90_abs_error_mw",
                    "overforecast_pct",
                ]
            ),
        }
    denominator = sum(abs(r["actual_mw"]) for r in pairs)
    return {
        **base,
        "mae_mw": mean(abs(e) for e in errors),
        "rmse_mw": sqrt(mean(e * e for e in errors)),
        "bias_mw": mean(errors),
        "wape_pct": 100 * sum(abs(e) for e in errors) / denominator
        if denominator
        else None,
        "p90_abs_error_mw": quantile([abs(e) for e in errors], 0.9),
        "overforecast_pct": 100 * sum(e > 0 for e in errors) / len(errors),
    }


class Dataset:
    def __init__(self, raw):
        self.forecasts = self._index(raw["WINDFOR"])
        self.actuals = self._index(
            [r for r in raw["FUELHH"] if r.get("fuelType") == "WIND"]
        )

    @staticmethod
    def _index(rows):
        grouped = defaultdict(dict)
        for row in rows:
            start, publication = (
                timestamp(row["startTime"]),
                timestamp(row["publishTime"]),
            )
            value = float(row["generation"])
            if not isfinite(value) or value < 0:
                raise ValueError("Invalid generation")
            if publication in grouped[start] and grouped[start][publication] != value:
                raise ValueError(
                    "Conflicting values for identical startTime and publishTime"
                )
            grouped[start][publication] = value
        return {t: sorted(v.items()) for t, v in grouped.items()}

    @staticmethod
    def latest(versions, cutoff=None):
        return next(
            ((t, v) for t, v in reversed(versions) if cutoff is None or t <= cutoff),
            None,
        )

    def day(self, decision: date, clock: str):
        cutoff = datetime.combine(
            decision, datetime.strptime(clock, "%H:%M").time(), LONDON
        )
        delivery = decision + timedelta(days=1)
        rows = []
        for hour in range(
            24
        ):  # This pilot is bounded to January decisions; all delivery days have 24 hours.
            start = datetime.combine(delivery, datetime.min.time(), LONDON) + timedelta(
                hours=hour
            )
            forecast = self.latest(self.forecasts.get(start, []), cutoff)
            actual_parts = [
                self.latest(self.actuals.get(start + timedelta(minutes=m), []))
                for m in (0, 30)
            ]
            actual = (
                mean(p[1] for p in actual_parts)
                if all(p is not None for p in actual_parts)
                else None
            )
            rows.append(
                {
                    "start_time": start.isoformat(),
                    "hour": f"{hour:02d}:00",
                    "forecast_mw": forecast[1] if forecast else None,
                    "publish_time": forecast[0].isoformat() if forecast else None,
                    "forecast_age_hours": (cutoff - forecast[0]).total_seconds() / 3600
                    if forecast
                    else None,
                    "lead_hours": (start - forecast[0]).total_seconds() / 3600
                    if forecast
                    else None,
                    "actual_mw": actual,
                    "actual_publish_time": max(p[0] for p in actual_parts).isoformat()
                    if actual is not None
                    else None,
                    "error_mw": forecast[1] - actual
                    if forecast and actual is not None
                    else None,
                }
            )
        forecasts = [r["forecast_mw"] for r in rows if r["forecast_mw"] is not None]
        return {
            "decision_date": decision.isoformat(),
            "delivery_date": delivery.isoformat(),
            "cutoff": cutoff.isoformat(),
            "rows": rows,
            "metrics": metrics(rows),
            "forecast_hours": len(forecasts),
            "forecast_energy_mwh": sum(forecasts) if len(forecasts) == 24 else None,
            "mean_forecast_mw": mean(forecasts) if forecasts else None,
            "max_forecast_age_hours": max(
                (
                    r["forecast_age_hours"]
                    for r in rows
                    if r["forecast_age_hours"] is not None
                ),
                default=None,
            ),
        }

    def month(self, clock):
        return [self.day(date(2026, 1, d), clock) for d in range(1, 32)]

    def history(self, days, decision, clock):
        """Prior complete delivery days; actual publications must also precede cutoff."""
        cutoff = datetime.combine(
            decision, datetime.strptime(clock, "%H:%M").time(), LONDON
        )
        eligible = []
        for day in days:
            if date.fromisoformat(day["delivery_date"]) >= decision:
                continue
            for row in day["rows"]:
                if row["forecast_mw"] is None:
                    continue
                start = timestamp(row["start_time"])
                parts = [
                    self.latest(
                        self.actuals.get(start + timedelta(minutes=m), []), cutoff
                    )
                    for m in (0, 30)
                ]
                if not all(part is not None for part in parts):
                    continue
                actual = mean(part[1] for part in parts)
                eligible.append(
                    {
                        **row,
                        "actual_mw": actual,
                        "error_mw": row["forecast_mw"] - actual,
                    }
                )
        errors = [r["error_mw"] for r in eligible]
        return {
            "sample_hours": len(errors),
            "sample_days": len({r["start_time"][:10] for r in eligible}),
            "p10_error_mw": quantile(errors, 0.1),
            "p90_error_mw": quantile(errors, 0.9),
            "metrics": metrics(eligible),
            "note": "Historical error range from earlier complete delivery days within this pilot. Not a calibrated prediction interval; serially correlated errors and small samples limit inference.",
        }

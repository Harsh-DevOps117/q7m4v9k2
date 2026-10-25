from datetime import date
import pytest
from backend.analytics import Dataset, metrics, quantile


def forecast(start, publish, value):
    return {"startTime": start, "publishTime": publish, "generation": value}


def actual(start, publish, value, fuel="WIND"):
    return {**forecast(start, publish, value), "fuelType": fuel}


def make_data(forecasts=None, actuals=None):
    return Dataset({"WINDFOR": forecasts or [], "FUELHH": actuals or []})


START = "2026-01-02T00:00:00Z"


def test_latest_at_cutoff_includes_exact_boundary_excludes_future():
    data = make_data(
        [
            forecast(START, "2026-01-01T08:00:00Z", 100),
            forecast(START, "2026-01-01T09:00:00Z", 110),
            forecast(START, "2026-01-01T09:00:01Z", 999),
        ]
    )
    day = data.day(date(2026, 1, 1), "09:00")
    assert day["rows"][0]["forecast_mw"] == 110
    assert day["rows"][0]["forecast_age_hours"] == 0
    assert day["rows"][0]["lead_hours"] == 15
    assert day["forecast_energy_mwh"] is None


def test_no_available_forecast_is_missing_not_zero():
    data = make_data([forecast(START, "2026-01-01T10:00:00Z", 100)])
    row = data.day(date(2026, 1, 1), "09:00")["rows"][0]
    assert row["forecast_mw"] is None
    assert row["error_mw"] is None


def test_two_half_hours_average_and_fuel_filter():
    data = make_data(
        [forecast(START, "2026-01-01T08:00:00Z", 100)],
        [
            actual(START, "2026-01-02T00:30:00Z", 60),
            actual("2026-01-02T00:30:00Z", "2026-01-02T01:00:00Z", 100),
            actual(START, "2026-01-02T00:31:00Z", 999, "CCGT"),
        ],
    )
    day = data.day(date(2026, 1, 1), "09:00")
    assert day["rows"][0]["actual_mw"] == 80
    assert day["rows"][0]["error_mw"] == 20
    assert day["metrics"]["matched_hours"] == 1


def test_missing_half_hour_does_not_get_imputed():
    data = make_data(
        [forecast(START, "2026-01-01T08:00:00Z", 100)],
        [actual(START, "2026-01-02T00:30:00Z", 60)],
    )
    day = data.day(date(2026, 1, 1), "09:00")
    assert day["rows"][0]["actual_mw"] is None
    assert day["metrics"]["mae_mw"] is None
    assert day["metrics"]["matched_hours"] == 0


def test_metrics_hand_calculated_and_zero_actual_safe():
    result = metrics(
        [
            {"forecast_mw": 120, "actual_mw": 100},
            {"forecast_mw": 80, "actual_mw": 100},
            {"forecast_mw": None, "actual_mw": 10},
        ]
    )
    assert result["mae_mw"] == 20
    assert result["rmse_mw"] == 20
    assert result["bias_mw"] == 0
    assert result["wape_pct"] == 20
    assert result["overforecast_pct"] == 50
    assert result["coverage_pct"] == pytest.approx(200 / 3)
    assert metrics([{"forecast_mw": 0, "actual_mw": 0}])["wape_pct"] is None


def test_final_january_decision_delivers_february_first():
    day = make_data().day(date(2026, 1, 31), "09:00")
    assert day["delivery_date"] == "2026-02-01"
    assert len(day["rows"]) == 24


def test_duplicate_records_are_idempotent_conflicts_rejected():
    row = forecast(START, "2026-01-01T08:00:00Z", 100)
    assert (
        len(make_data([row, row]).forecasts[next(iter(make_data([row]).forecasts))])
        == 1
    )
    with pytest.raises(ValueError, match="Conflicting"):
        make_data([row, {**row, "generation": 200}])


def test_history_excludes_same_day_and_future_actual_revisions():
    data = make_data(
        [forecast(START, "2026-01-01T08:00:00Z", 100)],
        [
            actual(START, "2026-01-02T00:30:00Z", 60),
            actual("2026-01-02T00:30:00Z", "2026-01-02T01:00:00Z", 80),
            actual(START, "2026-01-04T00:30:00Z", 500),
        ],
    )
    days = data.month("09:00")
    assert data.history(days, date(2026, 1, 2), "09:00")["sample_hours"] == 0
    history = data.history(days, date(2026, 1, 3), "09:00")
    assert history["sample_hours"] == 1
    assert (
        history["metrics"]["bias_mw"] == 30
    )  # (60 + 80) / 2; later 500 revision is invisible.


def test_full_forecast_energy_and_quantile():
    rows = [
        forecast(f"2026-01-02T{h:02d}:00:00Z", "2026-01-01T08:00:00Z", 1000)
        for h in range(24)
    ]
    assert (
        make_data(rows).day(date(2026, 1, 1), "09:00")["forecast_energy_mwh"] == 24000
    )
    assert quantile([0, 10], 0.9) == 9
    assert quantile([], 0.9) is None


@pytest.mark.parametrize("value", [float("nan"), float("inf"), -1])
def test_invalid_generation_rejected(value):
    with pytest.raises(ValueError, match="Invalid generation"):
        make_data([forecast(START, "2026-01-01T08:00:00Z", value)])

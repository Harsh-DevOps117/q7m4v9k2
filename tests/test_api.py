import csv
import io
from fastapi.testclient import TestClient
from backend.main import app
from backend.repository import load_dataset
from backend.analytics import timestamp

client = TestClient(app)


def test_snapshot_is_complete_and_hourly():
    data = load_dataset()
    assert len(data.forecasts) == 744
    assert len(data.actuals) == 1488
    assert all(t.minute == 0 for t in data.forecasts)


def test_api_day_asof_and_csv_agree():
    params = {"decision_date": "2026-01-15", "cutoff": "09:00"}
    response = client.get("/api/day", params=params)
    assert response.status_code == 200
    day = response.json()
    assert len(day["rows"]) == 24
    assert all(
        timestamp(r["publish_time"]) <= timestamp(day["cutoff"]) for r in day["rows"]
    )
    exported = client.get("/api/export.csv", params=params)
    assert "text/csv" in exported.headers["content-type"]
    rows = list(csv.DictReader(io.StringIO(exported.text)))
    assert len(rows) == 24
    for api, csv_row in zip(day["rows"], rows):
        assert api["forecast_mw"] == float(csv_row["forecast_mw"])
        assert api["publish_time"] == csv_row["publish_time"]


def test_month_metrics_and_boundaries():
    result = client.get("/api/accuracy").json()
    assert result["metrics"]["matched_hours"] == 744
    assert result["days"][-1]["delivery_date"] == "2026-02-01"
    assert result["metrics"]["mae_mw"] > 0
    assert len(result["by_hour"]) == 24
    assert (
        client.get("/api/day?decision_date=2026-01-01").json()["history"][
            "sample_hours"
        ]
        == 0
    )


def test_invalid_requests():
    for query in [
        "decision_date=2026-02-01",
        "decision_date=2025-12-31",
        "cutoff=24:00",
        "cutoff=09:99",
        "cutoff=garbage",
    ]:
        assert client.get("/api/day?" + query).status_code == 422
    assert client.get("/api/export.csv?decision_date=2026-02-01").status_code == 422


def test_routes_and_snapshot_metadata():
    assert client.get("/api/health").json()["status"] == "ok"
    assert len(client.get("/api/metadata").json()["sha256_uncompressed"]) == 64
    assert client.get("/api/docs").status_code == 200

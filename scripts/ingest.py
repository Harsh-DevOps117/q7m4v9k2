"""Fetch an auditable, bounded Elexon snapshot. No credentials or third-party data."""

from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
import gzip, hashlib, json, time, urllib.request, urllib.parse

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://data.elexon.co.uk/bmrs/api/v1/datasets"


def fetch(task):
    dataset, day = task
    params = urllib.parse.urlencode(
        {
            "publishDateTimeFrom": f"{day}T00:00:00Z",
            "publishDateTimeTo": f"{day + timedelta(days=1)}T00:00:00Z",
        }
    )
    url = f"{BASE}/{dataset}/stream?{params}"
    for attempt in range(4):
        try:
            with urllib.request.urlopen(url, timeout=60) as r:
                rows = json.load(r)
            if not isinstance(rows, list):
                raise ValueError("Expected stream array")
            kept = [
                r
                for r in rows
                if (dataset != "FUELHH" or r.get("fuelType") == "WIND")
                and "2026-01-02" <= r["startTime"][:10] <= "2026-02-01"
            ]
            print(dataset, day, len(kept), flush=True)
            return (
                dataset,
                kept,
                {"url": url, "received": len(rows), "retained": len(kept)},
            )
        except Exception:
            if attempt == 3:
                raise
            time.sleep(2**attempt)


def main():
    tasks = []
    for dataset, first, last in [
        ("WINDFOR", date(2025, 12, 30), date(2026, 1, 31)),
        ("FUELHH", date(2026, 1, 2), date(2026, 2, 3)),
    ]:
        tasks += [
            (dataset, first + timedelta(days=i)) for i in range((last - first).days + 1)
        ]
    output = {"WINDFOR": [], "FUELHH": []}
    manifest = {
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "requests": [],
        "decision_range": ["2026-01-01", "2026-01-31"],
        "delivery_range": ["2026-01-02", "2026-02-01"],
    }
    with ThreadPoolExecutor(max_workers=4) as pool:
        for dataset, rows, meta in pool.map(fetch, tasks):
            output[dataset].extend(rows)
            manifest["requests"].append(meta)
    for dataset, rows in output.items():
        # Inclusive query boundaries may return the same record twice.
        unique = {json.dumps(r, sort_keys=True): r for r in rows}
        output[dataset] = sorted(
            unique.values(), key=lambda r: (r["startTime"], r["publishTime"])
        )
    payload = json.dumps(output, separators=(",", ":")).encode()
    manifest["sha256_uncompressed"] = hashlib.sha256(payload).hexdigest()
    manifest["records"] = {k: len(v) for k, v in output.items()}
    path = ROOT / "data"
    path.mkdir(exist_ok=True)
    temp = path / "elexon.json.gz.tmp"
    temp.write_bytes(gzip.compress(payload, mtime=0))
    temp.replace(path / "elexon.json.gz")
    (path / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(manifest["records"])


if __name__ == "__main__":
    main()

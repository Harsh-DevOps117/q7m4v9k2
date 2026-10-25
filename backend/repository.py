"""Snapshot persistence boundary. Analytics has no filesystem dependency."""

from functools import lru_cache
from pathlib import Path
import gzip
import hashlib
import json
from backend.analytics import Dataset

ROOT = Path(__file__).resolve().parents[1]


@lru_cache(maxsize=1)
def load_metadata():
    return json.loads((ROOT / "data/manifest.json").read_text())


@lru_cache(maxsize=1)
def load_dataset():
    with gzip.open(ROOT / "data/elexon.json.gz", "rb") as source:
        payload = source.read()
    if hashlib.sha256(payload).hexdigest() != load_metadata()["sha256_uncompressed"]:
        raise ValueError("Snapshot integrity check failed")
    return Dataset(json.loads(payload))

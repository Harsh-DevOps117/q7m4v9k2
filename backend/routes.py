"""HTTP validation and serialization only; no forecast selection logic."""

from datetime import date
from functools import lru_cache
import csv
import io
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from backend.repository import load_dataset, load_metadata
from backend.service import WindService

router = APIRouter(prefix="/api")
Clock = Query(default="09:00", pattern=r"^([01]\d|2[0-3]):[0-5]\d$")


@lru_cache(maxsize=1)
def get_service():
    return WindService(load_dataset())


def validate_decision(day: date):
    if not date(2026, 1, 1) <= day <= date(2026, 1, 31):
        raise HTTPException(422, "Decision date must be in January 2026.")


@router.get("/health")
def health(service: WindService = Depends(get_service)):
    return {"status": "ok", "snapshot": True}


@router.get("/metadata")
def metadata():
    return load_metadata()


@router.get("/day")
def day(
    decision_date: date = date(2026, 1, 15),
    cutoff: str = Clock,
    service: WindService = Depends(get_service),
):
    validate_decision(decision_date)
    return service.day(decision_date, cutoff)


@router.get("/accuracy")
def accuracy(cutoff: str = Clock, service: WindService = Depends(get_service)):
    return service.accuracy(cutoff)


@router.get("/export.csv")
def export(
    decision_date: date | None = None,
    cutoff: str = Clock,
    service: WindService = Depends(get_service),
):
    if decision_date:
        validate_decision(decision_date)
    rows = service.export_rows(decision_date, cutoff)
    stream = io.StringIO()
    writer = csv.DictWriter(stream, fieldnames=list(rows[0]))
    writer.writeheader()
    writer.writerows(rows)
    filename = f"wind-desk-{decision_date or 'january'}-{cutoff.replace(':', '')}.csv"
    return Response(
        stream.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

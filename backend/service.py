"""Use cases shared by HTTP views and CSV export."""

from datetime import date
from functools import lru_cache
from backend.analytics import Dataset, metrics


class WindService:
    def __init__(self, dataset: Dataset):
        self.dataset = dataset

    @lru_cache(maxsize=64)
    def month(self, cutoff: str):
        return self.dataset.month(cutoff)

    def day(self, decision: date, cutoff: str):
        days = self.month(cutoff)
        return {
            **days[decision.day - 1],
            "history": self.dataset.history(days, decision, cutoff),
        }

    def accuracy(self, cutoff: str):
        days = self.month(cutoff)
        return {
            "metrics": metrics([r for day in days for r in day["rows"]]),
            "days": [{k: v for k, v in day.items() if k != "rows"} for day in days],
            "by_hour": [
                {"hour": f"{h:02d}:00", **metrics([day["rows"][h] for day in days])}
                for h in range(24)
            ],
            "scope": "Retrospective evaluation of all January decision dates; never used as the selected decision’s prior error estimate.",
        }

    def export_rows(self, decision: date | None, cutoff: str):
        days = self.month(cutoff)
        if decision:
            days = [days[decision.day - 1]]
        return [
            {"decision_date": day["decision_date"], "cutoff": day["cutoff"], **row}
            for day in days
            for row in day["rows"]
        ]

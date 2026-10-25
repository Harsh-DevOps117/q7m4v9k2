# January pilot findings

All results below use the committed snapshot, decision dates **1–31 January 2026**, next-day delivery, and **09:00 Europe/London** unless stated otherwise. Forecasts are selected strictly as of the decision cutoff. See README for the explicit hourly alignment assumption.

| Measure | Result |
|---|---:|
| Forecast vintage records retained | 17,864 |
| Half-hour WIND actuals retained | 1,488 |
| Matched hourly comparisons | 744 / 744 |
| Mean absolute error | 2,038.9 MW |
| Root mean squared error | 2,504.8 MW |
| Mean signed error | +1,747.9 MW |
| Weighted absolute percentage error | 18.07% |
| P90 absolute error | 4,097.9 MW |
| Hours in which forecast exceeded actual | 84.95% |

Positive signed error means forecast wind exceeded the actual comparison value. This matters because renewable availability was then lower than anticipated. These figures do not establish the cause of the difference and do not translate directly to a utility’s purchase shortfall.

The worst day by MAE was the **27 January decision for 28 January delivery**, with MAE 5,374.8 MW and overforecasting in every hour. The lowest daily MAE was the **18 January decision for 19 January delivery**, at 736.1 MW; its signed bias was −730.1 MW. The variation supports inspecting daily profiles rather than relying solely on a monthly average.

## Cutoff sensitivity

| Decision cutoff (GMT) | Monthly MAE (MW) | Monthly bias (MW) |
|---|---:|---:|
| 07:00 | 2,016.1 | +1,671.0 |
| 09:00 | 2,038.9 | +1,747.9 |
| 12:00 | 1,901.0 | +1,687.2 |

Later publication does not guarantee improvement at every cutoff: 09:00 performed slightly worse than 07:00 in this sample. A later cutoff may also be too late for a particular auction. Choose the client’s actual deadline first, rather than selecting whichever retrospective cutoff looks best.

## Interpretation safeguards

- Forecasts represent the operationally visible source scope, not an assumption of all wind generation across the UK.
- Period aggregation is a pilot convention requiring confirmation; the observed data have hourly forecast targets and half-hour actual targets.
- Actuals are the latest records within the snapshot’s bounded publication window. Later revisions can change retrospective scores.
- Publication timestamps are an availability proxy; ingestion/network latency is not captured.
- One month is not a robust seasonal backtest. Hourly errors are correlated. Percentiles do not establish predictive coverage.
- A scenario for a selected historical decision uses only earlier complete delivery dates and actual versions available by that cutoff. The first decisions have little or no error history; the chart suppresses its scenario until five prior days exist.
- There are no demand or price inputs. No savings, profitability, procurement volume or thermal dispatch recommendation is claimed.

## Reproduce

Start the application and request `/api/accuracy?cutoff=09:00`, or run:

```bash
.venv/bin/python - <<'PY'
from backend.repository import load_dataset
from backend.service import WindService
service = WindService(load_dataset())
print(service.accuracy('09:00')['metrics'])
PY
```

Use `/api/export.csv?cutoff=09:00` for the 744 aligned rows and source publication timestamps. The UI’s daily scorecard can drill into any day listed above.

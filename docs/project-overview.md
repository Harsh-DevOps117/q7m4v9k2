# What is Wind Desk?

Wind Desk is a web application that helps an electricity utility understand how much wind generation was forecast for the next day and how accurate those forecasts were.

Utilities buy electricity ahead of delivery to meet their customers' demand. Wind generation depends on the weather, so the amount available tomorrow is uncertain. A procurement team needs to understand both the expected wind output and the size of potential forecast misses when planning its purchases.

This project provides that wind intelligence using real Elexon data. It is a historical pilot for purchase decisions made during January 2026.

## The two questions it answers

1. **What forecast was available when we had to make our decision?** The app selects forecasts published at or before the chosen decision time, excluding later updates that the team could not have known about.
2. **How accurate were those forecasts?** The app compares the selected forecasts with actual wind generation and measures the errors.

## How someone uses the app

1. Select a decision date in January 2026 and a cutoff time in London. The default is 09:00, an editable pilot assumption.
2. View the next day's hourly wind forecast, expected daily energy and forecast publication times.
3. Review historical error context from earlier completed delivery days. Where enough history exists, a shaded scenario illustrates the effect of earlier forecast errors.
4. Enable actual generation to review what happened after the decision. This is clearly marked as retrospective information.
5. Open the accuracy view to explore monthly results, individual days and time-of-day patterns.
6. Export the figures and their timestamps as CSV for further analysis or review.

## Main features

| Feature | What it helps the user understand |
|---|---|
| Decision workspace | The wind outlook available at a specific decision cutoff |
| Forecast publication timestamps | How old each forecast was when the decision was made |
| Historical error scenarios | How earlier forecast misses might affect the current outlook |
| Actual-generation overlay | How the selected forecast compared with the eventual output |
| Accuracy dashboard | Typical error, larger misses, systematic bias and data coverage |
| Interval audit trail and CSV export | The exact values and timestamps behind the analysis |
| Data and methodology page | Data sources, assumptions, calculations and limitations |

## Where the data comes from

The project uses only two Elexon datasets:

- **WINDFOR:** wind-generation forecasts, including the target time, publication time and forecast power.
- **FUELHH:** actual half-hourly generation, filtered to records whose fuel type is `WIND`.

Decisions run from **1–31 January 2026**, so next-day delivery dates run from **2 January–1 February 2026**. The app uses a bundled, reproducible snapshot rather than a live feed. A manifest records the source requests, retrieval time and data checksum.

The observed forecasts have hourly timestamps. The pilot interprets each as an hourly forecast and compares it with the mean of the two corresponding half-hour actual readings. Both readings must exist; missing data is not replaced with zero. This period interpretation is an explicit assumption to confirm with the data owner before operational use.

## How accuracy is measured

The signed error is **forecast minus actual**. A positive error means less wind was generated than forecast.

| Metric | Meaning |
|---|---|
| MAE | Average size of a forecast miss, in MW |
| RMSE | Error measure that gives larger misses more weight |
| Bias | Whether forecasts tend to be above or below actual generation |
| WAPE | Total absolute error relative to total actual generation |
| Error percentiles | The distribution of smaller and larger misses |
| Coverage | How many expected hours have usable forecast and actual data |

At the default 09:00 cutoff, the committed snapshot contains **744 matched hours**, with an MAE of approximately **2,039 MW** and a bias of approximately **+1,748 MW**. These describe this historical sample under the stated assumptions; they do not guarantee future performance.

## How the software is built

The frontend uses **React and TypeScript**. The backend uses **Python and FastAPI**. **Docker** builds the frontend and runs the application as one container.

The code follows SOLID and DRY through focused modules and shared logic:

- Frontend pages handle the workspace, accuracy view and methodology view.
- Shared components provide controls and metric cards.
- A typed data hook handles API requests, loading, errors and cancellation.
- Backend routes validate requests and call a service layer.
- The repository loads and verifies the source snapshot.
- Analytics functions select forecasts, align actuals and calculate metrics.
- The dashboard and CSV export reuse the same selection rules and results.

Backend tests and browser tests check forecast selection, calculations, missing data, exports and user workflows. GitHub Actions runs the checks and builds the Docker image.

## What the project does not calculate

Wind Desk provides national wind intelligence for Great Britain. It does not calculate how much electricity a particular utility should buy: that would also require customer demand, existing contracts, other supply and portfolio exposure.

The historical error scenarios are not calibrated prediction intervals. The app also does not claim that the datasets cover every wind asset across the UK or explain the cause of each forecast miss.

## Run the project

From the repository root:

```bash
docker compose up --build
```

Open **http://localhost:8000**.

See the [README](../README.md) for setup and testing, [architecture notes](architecture.md) for the technical design, and [analysis](analysis.md) for detailed pilot findings.

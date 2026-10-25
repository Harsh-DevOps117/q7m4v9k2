# Customer pilot walkthrough

Wind Desk helps your day-ahead team answer two questions: “What wind forecast could we see when we made the decision?” and “How large have comparable forecast misses been?”

Start on 15 January at 09:00 London. The delivery day is 16 January. The forecast predicts 190.3 GWh across the day, averaging 7.93 GW. Every value comes from a publication available by the cutoff. Open the audit trail to see the publication timestamps, rather than relying on a forecast revised after the decision.

The shaded profile gives an empirical error scenario built from earlier complete delivery days. It deliberately does not use the rest of January to make this historical decision appear better informed. This is context for a risk conversation, not a probability guarantee or trading order.

Enable actuals to move into retrospective review. The line shows what happened and the daily error summary quantifies the miss. This toggle is clearly marked because actual output was not known when the decision was made.

Open Forecast accuracy. Across 744 matched hours at the 09:00 cutoff, average absolute error is roughly 2.04 GW and average signed error is +1.75 GW. Positive error means wind was lower than forecast. Drill into individual dates and examine hourly bias; averages alone can hide difficult days.

Export the selected evidence as CSV to support the team’s existing analysis and review process. The export carries the cutoff and publication times, so a reviewer can reconstruct the decision basis.

The pilot uses only Elexon national wind. It cannot tell you a purchase quantity without your demand, existing contracts and exposure. The next client discussion should establish the exact market cutoff, validate the forecast-period interpretation and source coverage, then connect the wind uncertainty to the client’s actual portfolio.

import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "../types";
import { number, timeLabel } from "../lib/format";
export function MethodologyPage({ meta }: { meta: Metadata | null }) {
  return (
    <div className="method-grid">
      <section className="panel prose">
        <span className="eyebrow">01 / THE DECISION CONTRACT</span>
        <h2>Reconstruct what was knowable</h2>
        <p>
          For every delivery hour, choose the latest WINDFOR record whose{" "}
          <code>publishTime ≤ decision cutoff</code>. Never choose the latest
          forecast available today. The 09:00 London default is an editable
          pilot assumption, not a universal market gate closure.
        </p>
        <p>
          Decision dates run from 1–31 January 2026. Delivery is the following
          calendar day: 2 January–1 February. All timestamps are timezone-aware;
          London is GMT during this period.
        </p>
        <span className="eyebrow">02 / ALIGNMENT & COVERAGE</span>
        <h2>Compare like with like</h2>
        <p>
          The observed WINDFOR snapshot is hourly. We treat each value as the
          forecast for its starting hour and compare it to the mean of the two
          FUELHH WIND readings at :00 and :30. This period interpretation is an
          explicit pilot assumption to validate with the data owner. Both actual
          readings must exist; gaps are never replaced with zero.
        </p>
        <p>
          Generation is power in MW. Forecast daily energy is the sum of 24
          hourly MW values × 1 hour, divided by 1,000 for GWh. Energy totals are
          withheld if any forecast hour is missing.
        </p>
        <span className="eyebrow">03 / ERROR DEFINITIONS</span>
        <h2>Make every miss interpretable</h2>
        <dl>
          <dt>Signed error = forecast − actual</dt>
          <dd>Positive values mean less wind was delivered than forecast.</dd>
          <dt>MAE = mean(|error|)</dt>
          <dd>Typical absolute miss in MW.</dd>
          <dt>RMSE = √mean(error²)</dt>
          <dd>Emphasises larger misses, in MW.</dd>
          <dt>Bias = mean(error)</dt>
          <dd>Average overforecast or underforecast.</dd>
          <dt>WAPE = Σ|error| ÷ Σ|actual| × 100</dt>
          <dd>
            Reported only if the denominator is nonzero. Avoids individual-hour
            percentage errors near zero.
          </dd>
        </dl>
        <p>
          Percentiles use linear interpolation. All scores use matched hours
          only, with a coverage count shown alongside them.
        </p>
      </section>
      <div>
        <section className="panel prose">
          <span className="eyebrow">SOURCE REGISTER</span>
          <h2>Two datasets. One clear scope.</h2>
          <a
            className="source-link"
            href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream"
            target="_blank"
            rel="noreferrer"
          >
            WINDFOR <ArrowUpRight size={17} />
          </a>
          <p>{number(meta?.records.WINDFOR)} retained forecast records</p>
          <a
            className="source-link"
            href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream"
            target="_blank"
            rel="noreferrer"
          >
            FUELHH · WIND <ArrowUpRight size={17} />
          </a>
          <p>{number(meta?.records.FUELHH)} half-hour actual records</p>
          <div className="source-details">
            Snapshot retrieved
            <br />
            <strong>{meta ? timeLabel(meta.retrieved_at) : "—"} GMT</strong>
          </div>
          <p>
            Reproducible local snapshot; no live market feed. Query URLs, record
            counts and a SHA-256 checksum are stored in the data manifest.
          </p>
          <a
            href="/api/metadata"
            target="_blank"
            rel="noreferrer"
            className="text-link"
          >
            View source manifest ↗
          </a>
        </section>
        <section className="panel prose method-caveat">
          <span className="eyebrow">INTERPRETATION LIMITS</span>
          <h2>Context, before action.</h2>
          <p>
            These Elexon series represent operationally visible wind in Great
            Britain; they should not be described as all UK wind, including
            embedded generation and Northern Ireland.
          </p>
          <p>
            Historical scenarios use earlier complete delivery days and actual
            publications available by the selected cutoff. At least five prior
            days are required to draw the P10–P90 scenario. Correlated errors
            and the small January sample prevent a calibrated probability claim.
          </p>
          <p>
            Actuals use the latest version in the bounded snapshot, which may
            differ from subsequent revisions. The snapshot starts forecast
            collection on 30 December; older available forecasts are outside
            this pilot’s search window.
          </p>
          <p>
            No demand, prices, contracts or customer exposure are included. The
            product quantifies national wind uncertainty; it cannot calculate a
            utility’s net procurement requirement.
          </p>
        </section>
      </div>
    </div>
  );
}

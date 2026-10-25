import { useEffect, useState } from "react";
import type { Day, Accuracy, Metadata } from "../types";
import { getJson } from "../lib/api";

/** Cancels obsolete requests so a slow response cannot overwrite a newer cutoff. */
export function useWindData(decision: string, cutoff: string) {
  const [day, setDay] = useState<Day | null>(null);
  const [accuracy, setAccuracy] = useState<Accuracy | null>(null);
  const [meta, setMeta] = useState<Metadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const query = new URLSearchParams({ cutoff });
    Promise.all([
      getJson<Day>(
        `/api/day?decision_date=${decision}&${query}`,
        controller.signal,
      ),
      getJson<Accuracy>(`/api/accuracy?${query}`, controller.signal),
      getJson<Metadata>("/api/metadata", controller.signal),
    ])
      .then(([d, a, m]) => {
        setDay(d);
        setAccuracy(a);
        setMeta(m);
        setLoading(false);
      })
      .catch((e: Error) => {
        if (e.name !== "AbortError") {
          setError(e.message);
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [decision, cutoff, revision]);
  return {
    day,
    accuracy,
    meta,
    loading,
    error,
    reload: () => setRevision((x) => x + 1),
  };
}

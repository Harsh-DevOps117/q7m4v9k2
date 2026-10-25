export const number = (v: number | null | undefined, decimals = 0) =>
  v == null
    ? "—"
    : v.toLocaleString("en-GB", {
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals,
      });
export const dateLabel = (v: string) =>
  new Date(v + "T12:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/London",
  });
export const timeLabel = (v: string | null) =>
  v
    ? new Date(v).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/London",
      })
    : "Unavailable";
export const signed = (v: number | null) =>
  v == null ? "—" : `${v > 0 ? "+" : ""}${number(v)}`;

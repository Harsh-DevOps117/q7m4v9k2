export function Stat({
  label,
  value,
  unit,
  note,
  accent = false,
}: {
  label: string;
  value: string;
  unit?: string;
  note: string;
  accent?: boolean;
}) {
  return (
    <div className={"stat " + (accent ? "accent" : "")}>
      <span className="eyebrow">{label}</span>
      <div className="stat-value">
        {value} <span>{unit}</span>
      </div>
      <p>{note}</p>
    </div>
  );
}

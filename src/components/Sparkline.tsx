// Single-series inline sparkline. One hue (accent), 2px stroke, no axes —
// context lives in the surrounding table cell / tooltip.
export function Sparkline({
  points,
  width = 96,
  height = 28,
  label,
}: {
  points: number[];
  width?: number;
  height?: number;
  label?: string;
}) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const pad = 2;
  const xy = points.map((p, i) => [
    pad + (i / (points.length - 1)) * (width - pad * 2),
    pad + (1 - (p - min) / span) * (height - pad * 2),
  ]);
  const d = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = xy[xy.length - 1];
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label ?? "price sparkline"}
      className="shrink-0"
    >
      <title>{label ?? "recent price"}</title>
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="1.5" />
    </svg>
  );
}

/** Horizontal single-hue bar for component breakdowns (0–100). */
export function MeterBar({ value, max = 100 }: { value: number; max?: number }) {
  const w = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface2" role="presentation">
      <div className="h-full rounded-full bg-accent" style={{ width: `${w}%` }} />
    </div>
  );
}

export function usd(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}k`;
  if (v >= 1) return `$${v.toFixed(2)}`;
  if (v === 0) return "$0";
  return `$${v.toPrecision(2)}`;
}

export function compact(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return `${Math.round(v)}`;
}

export function pct(v: number, signed = true): string {
  const s = v > 0 && signed ? "+" : "";
  return `${s}${(v * 100).toFixed(Math.abs(v) < 0.1 ? 1 : 0)}%`;
}

export function mult(v: number): string {
  return `${v.toFixed(v >= 10 ? 0 : v >= 2 ? 1 : 2)}x`;
}

export function timeAgo(isoDate: string, now = Date.now()): string {
  const s = Math.max(0, (now - new Date(isoDate).getTime()) / 1000);
  if (s < 90) return `${Math.round(s)}s ago`;
  const m = s / 60;
  if (m < 90) return `${Math.round(m)}m ago`;
  const h = m / 60;
  if (h < 36) return `${Math.round(h)}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function shortAddr(a: string): string {
  return a.length <= 12 ? a : `${a.slice(0, 6)}…${a.slice(-4)}`;
}

// Statistical helpers used by every leaderboard and scoring surface.

/** Bayesian shrinkage of an observed rate toward a population prior.
 * adj = (hits + k * prior) / (n + k). Guards small samples from dominating. */
export function bayesianRate(hits: number, n: number, prior: number, k = 10): number {
  if (n < 0 || hits < 0 || hits > n) throw new Error("invalid sample");
  return (hits + k * prior) / (n + k);
}

/** 95% Wilson score interval for a proportion. Returns [low, high]. */
export function wilsonInterval(hits: number, n: number): [number, number] {
  if (n === 0) return [0, 1];
  const z = 1.96;
  const p = hits / n;
  const denom = 1 + (z * z) / n;
  const centre = p + (z * z) / (2 * n);
  const margin = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [Math.max(0, (centre - margin) / denom), Math.min(1, (centre + margin) / denom)];
}

export function clamp(v: number, lo = 0, hi = 100): number {
  return Math.min(hi, Math.max(lo, v));
}

export function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

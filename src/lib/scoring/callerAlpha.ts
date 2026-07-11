import type { Call, CallerTier } from "../types";
import { bayesianRate, clamp, mean, median, wilsonInterval } from "./stats";

// Caller Alpha Score — transparent 0–100 score (PRD §8).
// Every component is returned for display; no mysterious totals.

export interface AlphaComponent {
  key: string;
  label: string;
  weight: number; // percentage points contributed at raw=100
  raw: number; // 0-100 before weighting
  weighted: number;
  explanation: string;
}

export interface AlphaPenalty {
  key: string;
  label: string;
  points: number; // subtracted
  evidence: string;
}

export interface CallerAlphaResult {
  score: number;
  tier: CallerTier;
  components: AlphaComponent[];
  penalties: AlphaPenalty[];
  sampleSize: number;
  ciLow: number;
  ciHigh: number;
  insufficientHistory: boolean;
}

export interface BehaviourSignals {
  deletedLosingCalls: number;
  lateCallRatio: number; // 0-1
  simultaneousCallMax: number;
  undisclosedAdProbability: number; // 0-1
  coordinationProbability: number; // 0-1
  botFollowerProbability: number; // 0-1
  rugInvolvementCount: number;
  fakeScreenshotCount: number;
  retroactiveEntryEdits: number;
}

const POPULATION_PRIOR_2X = 0.18; // observed base rate of 2x+ among measurable calls

export function tierFor(score: number, insufficientHistory: boolean): CallerTier {
  if (insufficientHistory) return score < 40 ? "high_risk" : "watchlist";
  if (score >= 90) return "S";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "watchlist";
  return "high_risk";
}

export function hitRate(calls: Call[], multiple: number): { hits: number; n: number; rate: number } {
  const measurable = calls.filter((c) => c.isMeasurable);
  const hits = measurable.filter((c) => c.realisticMultiple >= multiple).length;
  return { hits, n: measurable.length, rate: measurable.length ? hits / measurable.length : 0 };
}

export function computeCallerAlpha(calls: Call[], behaviour: BehaviourSignals): CallerAlphaResult {
  const measurable = calls.filter((c) => c.isMeasurable);
  const n = measurable.length;
  const insufficientHistory = n < 10;

  const realistic = measurable.map((c) => c.realisticMultiple);
  const headline = measurable.map((c) => c.headlineMultiple);

  // 1. Historical return quality (20%) — log-scaled median realistic multiple.
  // median 1x → 0; 2x → 60; ~3.2x → 100. A sustained 2x median on liquidity-
  // adjusted numbers is already elite among meme-coin callers.
  const medReal = median(realistic);
  const returnQuality = clamp(Math.log2(Math.max(medReal, 0.01)) * 60);

  // 2. Hit-rate consistency (15%) — Bayesian-adjusted 2x rate, variance-penalised
  // by the gap between 2x and 10x bands collapsing (one-hit wonders).
  const h2 = hitRate(measurable, 2);
  const h10 = hitRate(measurable, 10);
  const adj2x = bayesianRate(h2.hits, h2.n, POPULATION_PRIOR_2X);
  const consistency = clamp(adj2x * 250 * (0.75 + 0.25 * Math.min(1, h10.rate / Math.max(h2.rate, 0.01))));

  // 3. Early timing (15%) — average of per-call timing scores.
  const timing = clamp(mean(measurable.map((c) => c.timingScore)));

  // 4. Liquidity-adjusted performance (10%) — how much of the headline the
  // caller keeps after slippage/tradability. Honest callers score high.
  const keepRatios = measurable.map((c, i) =>
    headline[i] > 0 ? Math.min(1, realistic[i] / headline[i]) : 0,
  );
  const liquidityAdjusted = clamp(mean(keepRatios) * 100);

  // 5. Originality (10%)
  const originality = clamp(mean(measurable.map((c) => c.originalityScore)));

  // 6. Risk-adjusted performance (10%) — drawdown- and rug-adjusted.
  const rugRate = n ? measurable.filter((c) => c.outcome === "rugged").length / n : 0;
  const avgDrawdown = mean(measurable.map((c) => c.maxDrawdownAfter));
  const riskAdjusted = clamp(returnQuality * (1 - rugRate * 2) * (1 - avgDrawdown * 0.5));

  // 7. Recent performance (8%) — last-90-day realistic median, decayed.
  const cutoff = Date.now() - 90 * 24 * 3600 * 1000;
  const recent = measurable.filter((c) => new Date(c.calledAt).getTime() >= cutoff);
  const recentPerf = recent.length
    ? clamp(Math.log2(Math.max(median(recent.map((c) => c.realisticMultiple)), 0.01)) * 60)
    : returnQuality * 0.5; // inactive callers decay toward half credit

  // 8. Thesis quality (5%)
  const thesis = clamp(mean(measurable.map((c) => c.evidenceStrength)));

  // 9. Transparency & disclosure (4%)
  const disclosed = measurable.filter((c) => c.ownershipDisclosed === true).length;
  const contractGiven = measurable.filter((c) => c.contractSupplied).length;
  const transparency = n ? clamp(((disclosed + contractGiven) / (2 * n)) * 100) : 0;

  // 10. Account authenticity (3%)
  const authenticity = clamp((1 - behaviour.botFollowerProbability) * 100);

  const defs: [string, string, number, number, string][] = [
    ["return_quality", "Historical return quality", 20, returnQuality, `Median realistic multiple ${medReal.toFixed(2)}x (log-scaled)`],
    ["consistency", "Hit-rate consistency", 15, consistency, `2x hit rate ${(h2.rate * 100).toFixed(0)}% (${h2.hits}/${h2.n}), Bayesian-adjusted to ${(adj2x * 100).toFixed(0)}%`],
    ["timing", "Early timing", 15, timing, "Average per-call timing score (market-cap percentile at call)"],
    ["liquidity_adjusted", "Liquidity-adjusted performance", 10, liquidityAdjusted, `Keeps ${(mean(keepRatios) * 100).toFixed(0)}% of headline after slippage/tradability`],
    ["originality", "Originality", 10, originality, "Share of calls made before the token trended"],
    ["risk_adjusted", "Risk-adjusted performance", 10, riskAdjusted, `Rug rate ${(rugRate * 100).toFixed(0)}%, avg drawdown ${(avgDrawdown * 100).toFixed(0)}%`],
    ["recent", "Recent performance", 8, recentPerf, `${recent.length} measurable calls in the last 90 days`],
    ["thesis", "Thesis quality", 5, thesis, "Average evidence strength of call posts"],
    ["transparency", "Transparency & disclosure", 4, transparency, `${disclosed}/${n} disclosed ownership, ${contractGiven}/${n} supplied contract`],
    ["authenticity", "Account authenticity", 3, authenticity, `Bot-follower probability ${(behaviour.botFollowerProbability * 100).toFixed(0)}%`],
  ];

  const components: AlphaComponent[] = defs.map(([key, label, weight, raw, explanation]) => ({
    key,
    label,
    weight,
    raw: Math.round(raw),
    weighted: (raw * weight) / 100,
    explanation,
  }));

  const penalties: AlphaPenalty[] = [];
  const addPenalty = (key: string, label: string, points: number, evidence: string) => {
    if (points > 0) penalties.push({ key, label, points: Math.round(points * 10) / 10, evidence });
  };
  addPenalty("deleted_losers", "Deleted losing calls", behaviour.deletedLosingCalls * 4, `${behaviour.deletedLosingCalls} losing call(s) deleted after the fact`);
  addPenalty("late_calls", "Calling already-pumped tokens", behaviour.lateCallRatio > 0.4 ? (behaviour.lateCallRatio - 0.4) * 40 : 0, `${(behaviour.lateCallRatio * 100).toFixed(0)}% of calls after material price increase`);
  addPenalty("simultaneous", "Excessive simultaneous calls", behaviour.simultaneousCallMax > 5 ? (behaviour.simultaneousCallMax - 5) * 2 : 0, `Up to ${behaviour.simultaneousCallMax} open calls at once`);
  addPenalty("undisclosed_ads", "Possible undisclosed promotion", behaviour.undisclosedAdProbability * 15, `Undisclosed-promotion probability ${(behaviour.undisclosedAdProbability * 100).toFixed(0)}%`);
  addPenalty("coordination", "Possible coordinated engagement", behaviour.coordinationProbability * 12, `Coordination probability ${(behaviour.coordinationProbability * 100).toFixed(0)}%`);
  addPenalty("rugs", "Involvement in rugged tokens", behaviour.rugInvolvementCount * 6, `${behaviour.rugInvolvementCount} called token(s) rugged`);
  addPenalty("fake_screenshots", "Unverifiable claimed wins", behaviour.fakeScreenshotCount * 8, `${behaviour.fakeScreenshotCount} claim(s) without an original timestamped post`);
  addPenalty("entry_edits", "Retroactive entry-price edits", behaviour.retroactiveEntryEdits * 8, `${behaviour.retroactiveEntryEdits} entry price(s) changed after the move`);

  const weightedSum = components.reduce((a, c) => a + c.weighted, 0);
  // Penalties are capped at 75% of the weighted sum so profiles stay ordered
  // by underlying quality instead of collapsing to a uniform zero.
  const penaltySum = Math.min(
    penalties.reduce((a, p) => a + p.points, 0),
    weightedSum * 0.75,
  );
  let score = clamp(weightedSum - penaltySum);

  // Insufficient history caps at Watchlist band regardless of raw score —
  // a high return alone must not create an S-tier rating.
  if (insufficientHistory) score = Math.min(score, 54);

  const [lo, hi] = wilsonInterval(h2.hits, Math.max(h2.n, 1));

  return {
    score: Math.round(score * 10) / 10,
    tier: tierFor(score, insufficientHistory),
    components,
    penalties,
    sampleSize: n,
    ciLow: Math.round(lo * 100),
    ciHigh: Math.round(hi * 100),
    insufficientHistory,
  };
}

// Derived, computed views over the seeded dataset. Everything the UI renders
// comes through here so that swapping mock providers for real ones only
// changes the source of `seed`, not the app.

import {
  alertEvents,
  alertRules,
  callers,
  callerById,
  calls,
  feedExtras,
  investigations,
  narratives,
  NOW,
  profileSpecs,
  tokens,
  tokenById,
} from "./seed";
import { computeCallerAlpha, hitRate, type CallerAlphaResult } from "../scoring/callerAlpha";
import { computeRunnerScore, type RunnerResult } from "../scoring/runnerProbability";
import { classifyConvergence } from "../scoring/convergence";
import { median } from "../scoring/stats";
import type { Call, Caller, ConvergenceEvent, PostCategory, Token } from "../types";

export * from "./seed";

// --- caller alpha scores ------------------------------------------------------
export const alphaByCaller = new Map<string, CallerAlphaResult>();
for (const c of callers) {
  const spec = profileSpecs[c.id];
  const own = calls.filter((k) => k.callerId === c.id);
  alphaByCaller.set(
    c.id,
    computeCallerAlpha(own, {
      deletedLosingCalls: own.filter((k) => k.deleted && k.realisticMultiple < 1).length,
      lateCallRatio: spec.lateRatio,
      simultaneousCallMax: spec.simultaneousMax,
      undisclosedAdProbability: spec.sponsoredProb * (1 - spec.discloseProb),
      coordinationProbability: spec.coordProb,
      botFollowerProbability: spec.botProb,
      rugInvolvementCount: spec.rugCount,
      fakeScreenshotCount: spec.fakeScreens,
      retroactiveEntryEdits: spec.entryEdits,
    }),
  );
}

export function alphaOf(callerId: string): CallerAlphaResult {
  return alphaByCaller.get(callerId)!;
}

const PROVEN = new Set(
  callers.filter((c) => ["S", "A"].includes(alphaOf(c.id).tier)).map((c) => c.id),
);
export const isProven = (callerId: string) => PROVEN.has(callerId);

// --- runner scores --------------------------------------------------------------
function runnerInputsFor(t: Token) {
  const tokenCalls = calls.filter((k) => k.tokenId === t.id && k.isMeasurable);
  const provenOnToken = [...new Set(tokenCalls.map((k) => k.callerId))].filter(isProven);
  const avgAlpha = provenOnToken.length
    ? provenOnToken.reduce((a, id) => a + alphaOf(id).score, 0) / provenOnToken.length
    : 0;
  const ageMin = (NOW - new Date(t.launchAt).getTime()) / 60000;
  const coordinated = t.riskFlags.some((f) => /paid-post|copy cascade|coordina/i.test(f));
  return {
    social: {
      mentionGrowth5m: t.change5m > 0 ? t.socialVelocity / 60 : 0.05,
      mentionGrowth1h: t.socialVelocity / 55,
      uniqueAuthorGrowth1h: t.uniqueAuthors1h / Math.max(t.mentions1h, 1) * (t.socialVelocity / 45),
      engagementVelocity: t.socialVelocity,
      quoteVelocity: t.socialVelocity * 0.7,
      influentialPickup: provenOnToken.length >= 1,
      languageSpread: t.socialVelocity > 70 ? 4 : 2,
    },
    callers: {
      provenCallers: provenOnToken.length,
      avgAlphaScore: avgAlpha,
      independentEarlyCallers: coordinated ? 0 : provenOnToken.length,
      sameNarrativeSuccessRate: 0.4,
      coordinationProbability: coordinated ? 0.7 : 0.12,
    },
    timing: {
      mcapAtFirstCredibleMention: tokenCalls.length ? Math.min(...tokenCalls.map((k) => k.mcapAtCall)) : t.marketCapUsd,
      minutesSinceLaunch: ageMin,
      preSignalPriceMove: Math.max(0, t.change24h - 1),
      socialLeadsPrice: t.socialVelocity > 55 && (t.change1h < 0.5 || ageMin < 90),
      preFirstCandleDiscussionShare: t.socialVelocity > 70 ? 0.55 : 0.25,
    },
    narrative: {
      originality: t.narrative === "chain-mascots" ? 82 : t.narrative === "ai-agents" ? 74 : 60,
      culturalRelevance: 70,
      simplicity: 75,
      emotionalResponse: 68,
      durability: t.narrative === "animals" ? 80 : 55,
    },
    market: {
      liquidityUsd: t.liquidityUsd,
      volume24hUsd: t.volume24hUsd,
      buySellRatio: t.sells1h > 0 ? t.buys1h / t.sells1h : 2,
      uniqueBuyers1h: Math.round(t.buys1h * 0.7),
      holderGrowth24h: t.socialVelocity / 200,
      top10HolderPct: t.top10HolderPct,
      poolStability: t.liquidityUsd > 200_000 ? 80 : t.liquidityUsd > 50_000 ? 55 : 25,
    },
    risk: {
      bundledSupply: t.riskFlags.some((f) => /bundle/i.test(f)),
      devSelling: t.riskFlags.some((f) => /deployer.*(distribut|sell|remov)/i.test(f)),
      mutableControls: t.riskFlags.some((f) => /owner can|mutable/i.test(f)),
      honeypotIndicated: false,
      freezeAuthority: false,
      washTradingScore: t.id === "t-zoom" ? 55 : 10,
      botDiscussionShare: coordinated ? 0.5 : 0.15,
      paidClusterDetected: t.riskFlags.some((f) => /paid-post/i.test(f)),
      impersonation: false,
      knownScamDeployer: t.riskFlags.some((f) => /prior abandoned/i.test(f)),
    },
    freshnessMinutes: 1,
    missing: ageMin < 120 ? ["holder analysis", "honeypot simulation", "deployer history"] : [],
  };
}

export const runnerByToken = new Map<string, RunnerResult>();
for (const t of tokens) runnerByToken.set(t.id, computeRunnerScore(runnerInputsFor(t)));
export const runnerOf = (tokenId: string) => runnerByToken.get(tokenId)!;

// --- convergence events ------------------------------------------------------------
function makeConvergence(
  id: string,
  tokenId: string,
  callerIds: string[],
  opts: {
    detectedAgoH: number;
    firstCallAgoH: number;
    independence: number;
    similarity: number;
    spacingMin: number[];
    sharedGroups: boolean;
    sharedWallets: boolean;
    copied: boolean;
    paidMarkers: boolean;
    confirmedSponsored: boolean;
    mcapFirst: number;
    liq: number;
    preMove: number;
  },
): ConvergenceEvent {
  const avgAlpha = callerIds.reduce((a, c) => a + alphaOf(c).score, 0) / callerIds.length;
  const r = classifyConvergence({
    callerCount: callerIds.length,
    avgAlphaScore: avgAlpha,
    independenceScore: opts.independence,
    wordingSimilarity: opts.similarity,
    timeSpacingMinutes: opts.spacingMin,
    sharedGroups: opts.sharedGroups,
    sharedWallets: opts.sharedWallets,
    copiedPosts: opts.copied,
    paidPromoMarkers: opts.paidMarkers,
    confirmedSponsorship: opts.confirmedSponsored,
  });
  return {
    id,
    tokenId,
    detectedAt: new Date(NOW - opts.detectedAgoH * 3600_000).toISOString(),
    firstCallAt: new Date(NOW - opts.firstCallAgoH * 3600_000).toISOString(),
    callerIds,
    avgAlphaScore: Math.round(avgAlpha),
    independenceScore: opts.independence,
    wordingSimilarity: opts.similarity,
    mcapAtFirstCall: opts.mcapFirst,
    liquidityAtConvergence: opts.liq,
    preConvergenceMove: opts.preMove,
    classification: r.classification,
    evidence: r.evidence,
  };
}

export const convergenceEvents: ConvergenceEvent[] = [
  makeConvergence("cv-1", "t-capy", ["c-solwhisper", "c-quietquant", "c-basehound"], {
    detectedAgoH: 6.8, firstCallAgoH: 8.4, independence: 0.81, similarity: 0.12,
    spacingMin: [48, 42], sharedGroups: false, sharedWallets: false, copied: false,
    paidMarkers: false, confirmedSponsored: false, mcapFirst: 180_000, liq: 150_000, preMove: 0.35,
  }),
  makeConvergence("cv-2", "t-wagmi", ["c-copycat1", "c-copycat2", "c-memelord"], {
    detectedAgoH: 30, firstCallAgoH: 31, independence: 0.15, similarity: 0.88,
    spacingMin: [3, 4], sharedGroups: true, sharedWallets: false, copied: true,
    paidMarkers: false, confirmedSponsored: false, mcapFirst: 720_000, liq: 120_000, preMove: 0.9,
  }),
  makeConvergence("cv-3", "t-moone", ["c-pumpherald", "c-copycat1", "c-copycat2"], {
    detectedAgoH: 22, firstCallAgoH: 23, independence: 0.2, similarity: 0.91,
    spacingMin: [4, 3], sharedGroups: true, sharedWallets: true, copied: false,
    paidMarkers: true, confirmedSponsored: false, mcapFirst: 1_600_000, liq: 210_000, preMove: 0.6,
  }),
  makeConvergence("cv-4", "t-siren", ["c-solwhisper", "c-newbie"], {
    detectedAgoH: 0.4, firstCallAgoH: 0.55, independence: 0.6, similarity: 0.3,
    spacingMin: [9], sharedGroups: false, sharedWallets: false, copied: false,
    paidMarkers: false, confirmedSponsored: false, mcapFirst: 61_000, liq: 21_000, preMove: 0.4,
  }),
];

// --- live feed -----------------------------------------------------------------------
export interface FeedItem {
  id: string;
  callerId: string;
  tokenId: string | null;
  postedAt: string;
  text: string;
  category: PostCategory;
  riskFlags: string[];
  aiExplanation: string;
  call: Call | null;
}

const CALL_TEXT: Record<string, string> = {
  "t-capy": "Atlas is the capybara the timeline deserves. Accumulated at $180k, contract in bio thread. Holder curve is textbook organic. NFA.",
  "t-siren": "New Pump.fun launch $SIREN — chain-mascot meta, 40 minutes old, author growth outpacing mentions. Small starter, contract attached.",
  "t-brain": "GigaBrain quietly shipping while the timeline sleeps. $BRAIN thesis: agent meta round two, this time with revenue. Accumulating.",
  "t-moone": "MOONE is the next 50x. Gaming season is HERE. Don't say I didn't tell you.",
  "t-wagmi": "WAGW — Wagmi Warriors. The people's coin. Still early. Do not fade.",
};

export const feed: FeedItem[] = [
  ...calls
    .filter((c) => new Date(c.calledAt).getTime() > NOW - 36 * 3600_000)
    .map((c) => ({
      id: `feed-${c.id}`,
      callerId: c.callerId,
      tokenId: c.tokenId,
      postedAt: c.calledAt,
      text:
        CALL_TEXT[c.tokenId] ??
        `$${tokenById.get(c.tokenId)!.ticker} — ${c.category === "explicit_bullish_call" ? "position opened, thesis in thread." : "on the watchlist, waiting for confirmation."} ${c.contractSupplied ? "Contract attached." : ""}`,
      category: c.category,
      riskFlags: c.appearsSponsored ? ["possible_undisclosed_promotion"] : [],
      aiExplanation: c.aiExplanation,
      call: c,
    })),
  ...feedExtras.map((f) => ({ ...f, call: null })),
].sort((a, b) => +new Date(b.postedAt) - +new Date(a.postedAt));

// --- leaderboards ---------------------------------------------------------------------
export interface BoardRow {
  callerId: string;
  value: number;
  display: string;
  sampleSize: number;
  note?: string;
}
export interface Board {
  key: string;
  title: string;
  description: string;
  minCalls: number;
  rows: BoardRow[];
}

function measurable(callerId: string, sinceDays?: number): Call[] {
  const cutoff = sinceDays ? NOW - sinceDays * 86_400_000 : 0;
  return calls.filter(
    (c) => c.callerId === callerId && c.isMeasurable && +new Date(c.calledAt) >= cutoff,
  );
}

function board(
  key: string,
  title: string,
  description: string,
  minCalls: number,
  metric: (c: Caller) => { value: number; display: string; sampleSize: number; note?: string } | null,
  dir: "desc" | "asc" = "desc",
): Board {
  const rows = callers
    .map((c) => {
      const m = metric(c);
      return m && m.sampleSize >= minCalls ? { callerId: c.id, ...m } : null;
    })
    .filter((r): r is BoardRow => r !== null)
    .sort((a, b) => (dir === "desc" ? b.value - a.value : a.value - b.value))
    .slice(0, 10);
  return { key, title, description, minCalls, rows };
}

const alphaMetric = (sinceDays?: number) => (c: Caller) => {
  const m = measurable(c.id, sinceDays);
  if (!m.length) return null;
  const a = alphaOf(c.id);
  return { value: a.score, display: a.score.toFixed(1), sampleSize: m.length };
};

const hitBoard = (mult: number) => (c: Caller) => {
  const m = measurable(c.id);
  if (!m.length) return null;
  const h = hitRate(m, mult);
  return {
    value: h.rate * Math.min(1, m.length / 15), // shrink tiny samples
    display: `${(h.rate * 100).toFixed(0)}% (${h.hits}/${h.n})`,
    sampleSize: m.length,
  };
};

const chainBoard = (chain: string) => (c: Caller) => {
  const m = measurable(c.id).filter((k) => tokenById.get(k.tokenId)!.chain === chain);
  if (m.length < 3) return null;
  return { value: median(m.map((k) => k.realisticMultiple)), display: `${median(m.map((k) => k.realisticMultiple)).toFixed(2)}x med`, sampleSize: m.length };
};

export const boards: Board[] = [
  board("all_time", "Best all-time callers", "Caller Alpha Score across full history.", 10, alphaMetric()),
  board("week", "Best callers this week", "Alpha-ranked among callers active in the last 7 days.", 1, alphaMetric(7)),
  board("month", "Best callers this month", "Alpha-ranked among callers active in the last 30 days.", 3, alphaMetric(30)),
  board("early", "Best early-stage callers", "Average timing score (market-cap percentile at call).", 8, (c) => {
    const m = measurable(c.id);
    if (!m.length) return null;
    const t = m.reduce((a, k) => a + k.timingScore, 0) / m.length;
    return { value: t, display: t.toFixed(0), sampleSize: m.length };
  }),
  board("hit10x", "Best 10x callers", "Realistic-multiple 10x hit rate, small samples shrunk.", 8, hitBoard(10)),
  board("hit100x", "Best 100x callers", "Realistic-multiple 100x hit rate, small samples shrunk.", 10, hitBoard(100)),
  board("hit1000x", "Best 1,000x callers", "Realistic 1,000x calls. Nobody qualifies yet — sample honesty over vanity.", 10, hitBoard(1000)),
  board("solana", "Best Solana callers", "Median realistic multiple on Solana calls.", 3, chainBoard("solana")),
  board("ethereum", "Best Ethereum callers", "Median realistic multiple on Ethereum calls.", 3, chainBoard("ethereum")),
  board("base", "Best Base callers", "Median realistic multiple on Base calls.", 3, chainBoard("base")),
  board("robinhood", "Best Robinhood Chain callers", "Chain not yet enabled — awaiting reliable indexer and market data.", 3, chainBoard("robinhood")),
  board("consistent", "Most consistent callers", "Bayesian-adjusted 2x rate × inverse variance.", 10, (c) => {
    const a = alphaOf(c.id);
    const comp = a.components.find((x) => x.key === "consistency")!;
    return { value: comp.raw, display: comp.raw.toFixed(0), sampleSize: a.sampleSize };
  }),
  board("realistic", "Highest realistic return", "Median liquidity-adjusted multiple.", 8, (c) => {
    const m = measurable(c.id);
    if (!m.length) return null;
    const v = median(m.map((k) => k.realisticMultiple));
    return { value: v, display: `${v.toFixed(2)}x`, sampleSize: m.length };
  }),
  board("lowcap", "Best low-market-cap callers", "Median realistic multiple on calls under $500k mcap.", 5, (c) => {
    const m = measurable(c.id).filter((k) => k.mcapAtCall < 500_000);
    if (m.length < 5) return null;
    const v = median(m.map((k) => k.realisticMultiple));
    return { value: v, display: `${v.toFixed(2)}x`, sampleSize: m.length };
  }),
  board("narrative", "Best narrative identifiers", "Originality × timing among narrative-tagged callers.", 8, (c) => {
    const m = measurable(c.id);
    if (!m.length) return null;
    const v = (m.reduce((a, k) => a + k.originalityScore, 0) / m.length) * 0.6 + (m.reduce((a, k) => a + k.timingScore, 0) / m.length) * 0.4;
    return { value: v, display: v.toFixed(0), sampleSize: m.length };
  }),
  board("improved", "Most improved callers", "90-day realistic median vs. all-time.", 8, (c) => {
    const all = measurable(c.id);
    const recent = measurable(c.id, 90);
    if (all.length < 8 || recent.length < 3) return null;
    const v = median(recent.map((k) => k.realisticMultiple)) - median(all.map((k) => k.realisticMultiple));
    return { value: v, display: `${v >= 0 ? "+" : ""}${v.toFixed(2)}x`, sampleSize: recent.length };
  }),
  board("transparent", "Most transparent callers", "Disclosure + contract-supplied rates.", 8, (c) => {
    const a = alphaOf(c.id);
    const comp = a.components.find((x) => x.key === "transparency")!;
    return { value: comp.raw, display: `${comp.raw.toFixed(0)}/100`, sampleSize: a.sampleSize };
  }),
  board("risk_promoters", "Highest-risk promoters", "Sponsorship probability × coordination indicators. Calibrated language — indicators, not verdicts.", 8, (c) => {
    const m = measurable(c.id);
    if (!m.length) return null;
    const spec = profileSpecs[c.id];
    const v = (spec.sponsoredProb * (1 - spec.discloseProb) * 0.6 + spec.coordProb * 0.4) * 100;
    return { value: v, display: `${v.toFixed(0)} risk idx`, sampleSize: m.length, note: "Elevated indicators — requires manual review" };
  }),
  board("deleters", "Most deleted losing posts", "Losing calls deleted after the fact.", 5, (c) => {
    const m = measurable(c.id);
    if (!m.length) return null;
    const d = m.filter((k) => k.deleted && k.realisticMultiple < 1).length;
    return { value: d, display: `${d} deleted`, sampleSize: m.length };
  }),
  board("late", "Most frequently late callers", "Share of calls after material price increase.", 8, (c) => {
    const m = measurable(c.id);
    if (!m.length) return null;
    const v = profileSpecs[c.id].lateRatio * 100;
    return { value: v, display: `${v.toFixed(0)}% late`, sampleSize: m.length };
  }),
];

// --- command centre pulse ------------------------------------------------------------
export const marketPulse = {
  totalMentions24h: narratives.reduce((a, n) => a + n.mentions24h, 0),
  mentionVelocity: "+38% vs prior 24h",
  fastestChain: "Solana",
  fastestNarrative: "Chain mascots (+140%)",
  strongSignals: tokens.filter((t) => runnerOf(t.id).score >= 70).length,
  highRiskLaunches: tokens.filter((t) => t.riskScore >= 60).length,
  convergenceCount: convergenceEvents.length,
};

export { alertRules, alertEvents, investigations };

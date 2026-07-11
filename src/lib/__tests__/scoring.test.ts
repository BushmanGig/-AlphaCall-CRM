import { describe, expect, it } from "vitest";
import { computeCallerAlpha, tierFor, type BehaviourSignals } from "../scoring/callerAlpha";
import { bandFor, computeRunnerScore, type RunnerInputs } from "../scoring/runnerProbability";
import { classifyConvergence } from "../scoring/convergence";
import { bayesianRate, median, wilsonInterval } from "../scoring/stats";
import type { Call } from "../types";

const cleanBehaviour: BehaviourSignals = {
  deletedLosingCalls: 0,
  lateCallRatio: 0.1,
  simultaneousCallMax: 2,
  undisclosedAdProbability: 0,
  coordinationProbability: 0.05,
  botFollowerProbability: 0.05,
  rugInvolvementCount: 0,
  fakeScreenshotCount: 0,
  retroactiveEntryEdits: 0,
};

function makeCall(overrides: Partial<Call> = {}): Call {
  return {
    id: "c1",
    postId: "p1",
    callerId: "x",
    tokenId: "t",
    calledAt: new Date().toISOString(),
    category: "explicit_bullish_call",
    isMeasurable: true,
    convictionScore: 80,
    originalityScore: 80,
    timingScore: 80,
    evidenceStrength: 80,
    contractSupplied: true,
    entrySupplied: true,
    edited: false,
    deleted: false,
    appearsSponsored: false,
    ownershipDisclosed: true,
    sponsorshipProbability: 0.02,
    aiExplanation: "",
    confidence: 0.9,
    priceAtCall: 0.001,
    mcapAtCall: 200_000,
    liquidityAtCall: 100_000,
    headlineMultiple: 4,
    realisticMultiple: 3.5,
    currentMultiple: 3,
    maxDrawdownAfter: 0.3,
    timeToPeakMinutes: 300,
    tradableInOut: true,
    outcome: "profitable",
    ...overrides,
  };
}

describe("stats", () => {
  it("bayesian shrinkage pulls small samples toward the prior", () => {
    // 2/2 raw = 100%, but with k=10 and prior 0.18 it should be far lower
    expect(bayesianRate(2, 2, 0.18)).toBeLessThan(0.35);
    // large samples dominate the prior
    expect(bayesianRate(900, 1000, 0.18)).toBeGreaterThan(0.85);
  });

  it("wilson interval is wide for tiny samples and inside [0,1]", () => {
    const [lo, hi] = wilsonInterval(1, 2);
    expect(hi - lo).toBeGreaterThan(0.5);
    expect(lo).toBeGreaterThanOrEqual(0);
    expect(hi).toBeLessThanOrEqual(1);
  });

  it("median handles even and odd lengths", () => {
    expect(median([1, 3, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
});

describe("Caller Alpha Score", () => {
  it("is bounded 0–100 and exposes all ten components", () => {
    const calls = Array.from({ length: 20 }, () => makeCall());
    const r = computeCallerAlpha(calls, cleanBehaviour);
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
    expect(r.components).toHaveLength(10);
    expect(r.components.reduce((a, c) => a + c.weight, 0)).toBe(100);
  });

  it("caps insufficient-history callers at Watchlist even with perfect results", () => {
    // A single 100x call must NOT produce an S tier.
    const calls = [makeCall({ headlineMultiple: 100, realisticMultiple: 90, currentMultiple: 80 })];
    const r = computeCallerAlpha(calls, cleanBehaviour);
    expect(r.insufficientHistory).toBe(true);
    expect(r.score).toBeLessThanOrEqual(54);
    expect(["watchlist", "high_risk"]).toContain(r.tier);
  });

  it("penalises deleted losing calls and rug involvement", () => {
    const calls = Array.from({ length: 20 }, () => makeCall());
    const clean = computeCallerAlpha(calls, cleanBehaviour);
    const dirty = computeCallerAlpha(calls, {
      ...cleanBehaviour,
      deletedLosingCalls: 5,
      rugInvolvementCount: 3,
      undisclosedAdProbability: 0.6,
    });
    expect(dirty.score).toBeLessThan(clean.score);
    expect(dirty.penalties.length).toBeGreaterThanOrEqual(3);
  });

  it("rewards honest liquidity-adjusted performance over headline spikes", () => {
    const honest = Array.from({ length: 15 }, () => makeCall({ headlineMultiple: 4, realisticMultiple: 3.8 }));
    const spiky = Array.from({ length: 15 }, () => makeCall({ headlineMultiple: 40, realisticMultiple: 1.6 }));
    const h = computeCallerAlpha(honest, cleanBehaviour);
    const s = computeCallerAlpha(spiky, cleanBehaviour);
    const hLiq = h.components.find((c) => c.key === "liquidity_adjusted")!.raw;
    const sLiq = s.components.find((c) => c.key === "liquidity_adjusted")!.raw;
    expect(hLiq).toBeGreaterThan(sLiq);
  });

  it("tier bands match the spec", () => {
    expect(tierFor(95, false)).toBe("S");
    expect(tierFor(85, false)).toBe("A");
    expect(tierFor(75, false)).toBe("B");
    expect(tierFor(60, false)).toBe("C");
    expect(tierFor(45, false)).toBe("watchlist");
    expect(tierFor(20, false)).toBe("high_risk");
  });
});

describe("Runner Probability Score", () => {
  const strong: RunnerInputs = {
    social: { mentionGrowth5m: 1, mentionGrowth1h: 2, uniqueAuthorGrowth1h: 1.5, engagementVelocity: 90, quoteVelocity: 80, influentialPickup: true, languageSpread: 4 },
    callers: { provenCallers: 3, avgAlphaScore: 85, independentEarlyCallers: 3, sameNarrativeSuccessRate: 0.5, coordinationProbability: 0.1 },
    timing: { mcapAtFirstCredibleMention: 90_000, minutesSinceLaunch: 240, preSignalPriceMove: 0.3, socialLeadsPrice: true, preFirstCandleDiscussionShare: 0.6 },
    narrative: { originality: 80, culturalRelevance: 80, simplicity: 80, emotionalResponse: 75, durability: 75 },
    market: { liquidityUsd: 400_000, volume24hUsd: 2_000_000, buySellRatio: 1.8, uniqueBuyers1h: 500, holderGrowth24h: 0.5, top10HolderPct: 18, poolStability: 80 },
    risk: { bundledSupply: false, devSelling: false, mutableControls: false, honeypotIndicated: false, freezeAuthority: false, washTradingScore: 5, botDiscussionShare: 0.1, paidClusterDetected: false, impersonation: false, knownScamDeployer: false },
    freshnessMinutes: 1,
    missing: [],
  };

  it("bounded 0–100 with full explanation object", () => {
    const r = computeRunnerScore(strong);
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
    expect(r.explanation.positives.length).toBeGreaterThan(0);
    expect(r.explanation.confidence).toBeGreaterThan(0);
    expect(r.components).toHaveLength(5);
  });

  it("risk deductions materially reduce the score", () => {
    const risky = computeRunnerScore({
      ...strong,
      risk: { ...strong.risk, honeypotIndicated: true, knownScamDeployer: true },
    });
    const clean = computeRunnerScore(strong);
    expect(clean.score - risky.score).toBeGreaterThanOrEqual(50);
    expect(risky.riskDeductions.length).toBeGreaterThanOrEqual(2);
  });

  it("missing data lowers confidence, not just the score", () => {
    const sparse = computeRunnerScore({ ...strong, missing: ["holder analysis", "honeypot simulation", "deployer history"] });
    const full = computeRunnerScore(strong);
    expect(sparse.explanation.confidence).toBeLessThan(full.explanation.confidence);
  });

  it("bands match the spec", () => {
    expect(bandFor(90)).toBe("exceptional");
    expect(bandFor(75)).toBe("strong_watch");
    expect(bandFor(60)).toBe("developing");
    expect(bandFor(45)).toBe("speculative");
    expect(bandFor(20)).toBe("weak_or_high_risk");
  });
});

describe("Convergence classification", () => {
  const base = {
    callerCount: 3,
    avgAlphaScore: 84,
    independenceScore: 0.8,
    wordingSimilarity: 0.15,
    timeSpacingMinutes: [48, 42],
    sharedGroups: false,
    sharedWallets: false,
    copiedPosts: false,
    paidPromoMarkers: false,
    confirmedSponsorship: false,
  };

  it("classifies independent dissimilar calls as organic", () => {
    expect(classifyConvergence(base).classification).toBe("organic");
  });

  it("classifies copied posts as a copy-trading cascade", () => {
    expect(classifyConvergence({ ...base, copiedPosts: true, wordingSimilarity: 0.9 }).classification).toBe("copy_trading_cascade");
  });

  it("three independent calls outrank ten coordinated posts", () => {
    const organic = classifyConvergence(base);
    const coordinated = classifyConvergence({
      ...base,
      callerCount: 10,
      independenceScore: 0.1,
      wordingSimilarity: 0.9,
      copiedPosts: true,
      timeSpacingMinutes: [2, 1, 3, 2, 1, 2, 3, 1, 2],
      sharedGroups: true,
    });
    expect(organic.strength).toBeGreaterThan(coordinated.strength);
  });

  it("confirmed sponsorship dominates other signals", () => {
    expect(classifyConvergence({ ...base, confirmedSponsorship: true }).classification).toBe("confirmed_sponsored_campaign");
  });
});

import { clamp } from "./stats";

// Runner Probability Score — a 0–100 research ranking for emerging tokens
// (PRD §9). It is NOT a prediction of guaranteed return, and every score
// carries a full explanation object.

export interface RunnerInputs {
  social: {
    mentionGrowth5m: number; // fraction, e.g. 0.8 = +80%
    mentionGrowth1h: number;
    uniqueAuthorGrowth1h: number;
    engagementVelocity: number; // 0-100 normalised
    quoteVelocity: number; // 0-100
    influentialPickup: boolean; // small accounts -> influential accounts
    languageSpread: number; // distinct languages
  };
  callers: {
    provenCallers: number;
    avgAlphaScore: number; // 0-100
    independentEarlyCallers: number;
    sameNarrativeSuccessRate: number; // 0-1
    coordinationProbability: number; // 0-1
  };
  timing: {
    mcapAtFirstCredibleMention: number; // USD
    minutesSinceLaunch: number;
    preSignalPriceMove: number; // fraction gained before signal
    socialLeadsPrice: boolean;
    preFirstCandleDiscussionShare: number; // 0-1
  };
  narrative: {
    originality: number; // 0-100
    culturalRelevance: number;
    simplicity: number;
    emotionalResponse: number;
    durability: number;
  };
  market: {
    liquidityUsd: number;
    volume24hUsd: number;
    buySellRatio: number; // buys / sells
    uniqueBuyers1h: number;
    holderGrowth24h: number; // fraction
    top10HolderPct: number; // 0-100
    poolStability: number; // 0-100
  };
  risk: {
    bundledSupply: boolean;
    devSelling: boolean;
    mutableControls: boolean;
    honeypotIndicated: boolean;
    freezeAuthority: boolean;
    washTradingScore: number; // 0-100
    botDiscussionShare: number; // 0-1
    paidClusterDetected: boolean;
    impersonation: boolean;
    knownScamDeployer: boolean;
  };
  freshnessMinutes: number; // age of newest market snapshot
  missing: string[]; // data we could not obtain
}

export interface RunnerComponent {
  key: string;
  label: string;
  weight: number;
  raw: number; // 0-100
  weighted: number;
  notes: string[];
}

export interface RunnerExplanation {
  why: string;
  positives: string[];
  negatives: string[];
  missing: string[];
  confidence: number; // 0-1
  dataFreshness: string;
  monitoring: string[];
}

export interface RunnerResult {
  score: number;
  band: "exceptional" | "strong_watch" | "developing" | "speculative" | "weak_or_high_risk";
  components: RunnerComponent[];
  riskDeductions: { label: string; points: number }[];
  explanation: RunnerExplanation;
}

export function bandFor(score: number): RunnerResult["band"] {
  if (score >= 85) return "exceptional";
  if (score >= 70) return "strong_watch";
  if (score >= 55) return "developing";
  if (score >= 40) return "speculative";
  return "weak_or_high_risk";
}

export const BAND_LABELS: Record<RunnerResult["band"], string> = {
  exceptional: "Exceptional emerging signal",
  strong_watch: "Strong watch",
  developing: "Developing",
  speculative: "Speculative",
  weak_or_high_risk: "Weak or high risk",
};

export function computeRunnerScore(x: RunnerInputs): RunnerResult {
  const positives: string[] = [];
  const negatives: string[] = [];

  // Social acceleration (25%)
  const socialRaw = clamp(
    clamp(x.social.mentionGrowth1h * 40) * 0.3 +
      clamp(x.social.uniqueAuthorGrowth1h * 60) * 0.25 +
      x.social.engagementVelocity * 0.2 +
      x.social.quoteVelocity * 0.1 +
      (x.social.influentialPickup ? 100 : 20) * 0.1 +
      clamp(x.social.languageSpread * 20) * 0.05,
  );
  if (x.social.uniqueAuthorGrowth1h > 0.5) positives.push(`Unique authors up ${(x.social.uniqueAuthorGrowth1h * 100).toFixed(0)}% in the last hour`);
  if (x.social.influentialPickup) positives.push("Discussion migrating from small accounts to influential accounts");
  if (x.social.mentionGrowth1h < 0.05) negatives.push("Mention growth is flat");

  // Caller quality (20%)
  const callerRaw = clamp(
    clamp(x.callers.provenCallers * 35) * 0.35 +
      x.callers.avgAlphaScore * 0.25 +
      clamp(x.callers.independentEarlyCallers * 40) * 0.2 +
      x.callers.sameNarrativeSuccessRate * 100 * 0.1 +
      (1 - x.callers.coordinationProbability) * 100 * 0.1,
  );
  if (x.callers.independentEarlyCallers >= 2) positives.push(`${x.callers.independentEarlyCallers} independent early callers`);
  if (x.callers.coordinationProbability > 0.5) negatives.push("Possible coordination among callers");
  if (x.callers.provenCallers === 0) negatives.push("No proven callers discussing the token yet");

  // Timing (15%) — lower mcap and less pre-signal pump = better.
  const mcapScore = x.timing.mcapAtFirstCredibleMention <= 100_000 ? 100
    : x.timing.mcapAtFirstCredibleMention <= 500_000 ? 80
    : x.timing.mcapAtFirstCredibleMention <= 2_000_000 ? 55
    : x.timing.mcapAtFirstCredibleMention <= 10_000_000 ? 30 : 10;
  // Pre-pump penalty is discounted by how much of the discussion preceded the
  // first major candle — being "after the move" matters less when the social
  // signal demonstrably led it.
  const prePumpPenalty =
    clamp(x.timing.preSignalPriceMove * 30, 0, 45) * (1 - x.timing.preFirstCandleDiscussionShare);
  const timingRaw = clamp(
    mcapScore * 0.4 +
      (x.timing.socialLeadsPrice ? 100 : 25) * 0.3 +
      x.timing.preFirstCandleDiscussionShare * 100 * 0.3 -
      prePumpPenalty,
  );
  if (x.timing.socialLeadsPrice) positives.push("Social growth is leading price, not following it");
  if (x.timing.preSignalPriceMove > 1) negatives.push(`Price already up ${(x.timing.preSignalPriceMove * 100).toFixed(0)}% before this signal`);

  // Narrative strength (15%)
  const narrativeRaw = clamp(
    x.narrative.originality * 0.25 +
      x.narrative.culturalRelevance * 0.25 +
      x.narrative.simplicity * 0.15 +
      x.narrative.emotionalResponse * 0.15 +
      x.narrative.durability * 0.2,
  );

  // Market quality (15%)
  const liqScore = x.market.liquidityUsd >= 500_000 ? 100 : x.market.liquidityUsd >= 100_000 ? 70 : x.market.liquidityUsd >= 25_000 ? 40 : 10;
  const marketRaw = clamp(
    liqScore * 0.3 +
      clamp((x.market.buySellRatio - 1) * 60 + 50) * 0.2 +
      clamp(x.market.holderGrowth24h * 200) * 0.2 +
      clamp(100 - x.market.top10HolderPct * 1.5) * 0.15 +
      x.market.poolStability * 0.15,
  );
  if (x.market.liquidityUsd < 25_000) negatives.push("Very thin liquidity — realistic entry/exit size is small");
  if (x.market.top10HolderPct > 40) negatives.push(`Top-10 holders control ${x.market.top10HolderPct.toFixed(0)}% of supply`);
  if (x.market.holderGrowth24h > 0.3) positives.push(`Holder count up ${(x.market.holderGrowth24h * 100).toFixed(0)}% in 24h`);

  const components: RunnerComponent[] = [
    { key: "social", label: "Social acceleration", weight: 25, raw: Math.round(socialRaw), weighted: (socialRaw * 25) / 100, notes: [] },
    { key: "callers", label: "Caller quality", weight: 20, raw: Math.round(callerRaw), weighted: (callerRaw * 20) / 100, notes: [] },
    { key: "timing", label: "Timing", weight: 15, raw: Math.round(timingRaw), weighted: (timingRaw * 15) / 100, notes: [] },
    { key: "narrative", label: "Narrative strength", weight: 15, raw: Math.round(narrativeRaw), weighted: (narrativeRaw * 15) / 100, notes: [] },
    { key: "market", label: "Market quality", weight: 15, raw: Math.round(marketRaw), weighted: (marketRaw * 15) / 100, notes: [] },
  ];

  // Risk deductions
  const riskDeductions: { label: string; points: number }[] = [];
  const ded = (cond: boolean | number, label: string, points: number) => {
    const active = typeof cond === "number" ? cond > 0 : cond;
    if (active) {
      riskDeductions.push({ label, points });
      negatives.push(label);
    }
  };
  ded(x.risk.honeypotIndicated, "Honeypot indicators present", 40);
  ded(x.risk.knownScamDeployer, "Deployer wallet linked to prior abandoned/rugged launches", 35);
  ded(x.risk.freezeAuthority, "Freeze authority not revoked", 15);
  ded(x.risk.mutableControls, "Token controls are mutable", 12);
  ded(x.risk.bundledSupply, "Bundled supply detected at launch", 15);
  ded(x.risk.devSelling, "Developer wallet distribution detected", 15);
  ded(x.market.top10HolderPct > 50, "Extreme holder concentration", 12);
  if (x.risk.washTradingScore > 40) ded(true, "Elevated wash-trading indicators", Math.round(x.risk.washTradingScore / 5));
  if (x.risk.botDiscussionShare > 0.4) ded(true, "Bot-heavy discussion", Math.round(x.risk.botDiscussionShare * 25));
  ded(x.risk.paidClusterDetected, "Potential paid-post cluster", 15);
  ded(x.risk.impersonation, "Impersonation indicators", 10);

  const base = components.reduce((a, c) => a + c.weighted, 0);
  // Weighted sum of 5 components maxes at 90; small bonus keeps genuinely
  // exceptional multi-strength signals able to reach the top band.
  const synergy = components.every((c) => c.raw >= 70) ? 10 : components.every((c) => c.raw >= 55) ? 5 : 0;
  const deduction = riskDeductions.reduce((a, d) => a + d.points, 0);
  const score = clamp(base + synergy - deduction);

  const confidence = clamp(
    0.9 - x.missing.length * 0.12 - (x.freshnessMinutes > 15 ? 0.15 : 0) - (x.callers.provenCallers === 0 ? 0.1 : 0),
    0.1,
    0.98,
  );

  const band = bandFor(score);
  return {
    score: Math.round(score * 10) / 10,
    band,
    components,
    riskDeductions,
    explanation: {
      why:
        score >= 70
          ? `Score driven by ${[...components].sort((a, b) => b.raw - a.raw)[0].label.toLowerCase()} with ${riskDeductions.length} active risk deduction(s). This is a research ranking, not a prediction of return.`
          : `Score held back by ${[...components].sort((a, b) => a.raw - b.raw)[0].label.toLowerCase()} and ${riskDeductions.length} active risk deduction(s).`,
      positives,
      negatives,
      missing: x.missing,
      confidence: Math.round(confidence * 100) / 100,
      dataFreshness: x.freshnessMinutes <= 2 ? "live (<2 min)" : `${x.freshnessMinutes} min old`,
      monitoring: [
        "Watch unique-author growth vs. raw mention growth (bot check)",
        "Re-evaluate if liquidity drops 30% or top-10 concentration rises",
        "Confirm whether proven callers hold or exit within 24h",
      ],
    },
  };
}

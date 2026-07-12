import type { ConvergenceClass } from "../types";

// Convergence classification (PRD §10). Strength weights independence over
// raw count: three genuinely independent calls beat ten coordinated posts.

export interface ConvergenceInputs {
  callerCount: number;
  avgAlphaScore: number; // 0-100
  independenceScore: number; // 0-1 (from co-posting matrix, shared groups/wallets)
  wordingSimilarity: number; // 0-1 shingled Jaccard across the posts
  timeSpacingMinutes: number[]; // gaps between consecutive calls
  sharedGroups: boolean;
  sharedWallets: boolean;
  copiedPosts: boolean;
  paidPromoMarkers: boolean;
  confirmedSponsorship: boolean;
}

export interface ConvergenceResult {
  classification: ConvergenceClass;
  strength: number; // 0-100
  evidence: string[];
}

export function classifyConvergence(x: ConvergenceInputs): ConvergenceResult {
  const evidence: string[] = [];
  let classification: ConvergenceClass;

  const tightSpacing = x.timeSpacingMinutes.length > 0 && x.timeSpacingMinutes.every((m) => m < 5);

  if (x.confirmedSponsorship) {
    classification = "confirmed_sponsored_campaign";
    evidence.push("Sponsorship confirmed via disclosure or verified promoter records");
  } else if (x.copiedPosts || x.wordingSimilarity > 0.8) {
    classification = "copy_trading_cascade";
    evidence.push(`Wording similarity ${(x.wordingSimilarity * 100).toFixed(0)}% — posts appear copied`);
  } else if (
    x.paidPromoMarkers ||
    x.sharedWallets ||
    (x.sharedGroups && tightSpacing) ||
    (x.wordingSimilarity > 0.55 && x.independenceScore < 0.4)
  ) {
    classification = "possible_coordinated_campaign";
    if (x.paidPromoMarkers) evidence.push("Potential paid promotion markers detected");
    if (x.sharedWallets) evidence.push("Callers share wallet relationships");
    if (x.sharedGroups && tightSpacing) evidence.push("Shared communities and near-simultaneous posting");
  } else if (x.independenceScore >= 0.65 && x.wordingSimilarity < 0.4) {
    classification = "organic";
    evidence.push(
      `Independence ${(x.independenceScore * 100).toFixed(0)}%, wording dissimilar (${(x.wordingSimilarity * 100).toFixed(0)}%)`,
    );
    if (!x.sharedGroups) evidence.push("No shared Telegram/Discord communities detected");
  } else {
    classification = "uncertain";
    evidence.push("Insufficient evidence to classify — requires manual review");
  }

  // Strength = quality × independence, not raw count. Count saturates fast.
  const countFactor = Math.min(1, Math.log2(1 + x.callerCount) / Math.log2(6)); // saturates ~5 callers
  const qualityFactor = x.avgAlphaScore / 100;
  const independenceFactor =
    classification === "organic" ? x.independenceScore
    : classification === "uncertain" ? x.independenceScore * 0.5
    : 0.15; // coordinated/copied/sponsored convergence carries little signal
  const strength = Math.round(100 * countFactor * qualityFactor * independenceFactor);

  return { classification, strength, evidence };
}

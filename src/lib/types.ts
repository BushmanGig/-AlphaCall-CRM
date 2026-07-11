// Core domain types for AlphaCall CRM.
// Token identity is always (chain, contractAddress) — never ticker alone.

export type ChainId = "solana" | "ethereum" | "base" | "robinhood";

export const CHAINS: Record<ChainId, { name: string; enabled: boolean; explorer: string | null }> = {
  solana: { name: "Solana", enabled: true, explorer: "https://solscan.io" },
  ethereum: { name: "Ethereum", enabled: true, explorer: "https://etherscan.io" },
  base: { name: "Base", enabled: true, explorer: "https://basescan.org" },
  robinhood: { name: "Robinhood Chain", enabled: false, explorer: null },
};

export type PostCategory =
  | "explicit_bullish_call"
  | "implied_bullish_call"
  | "watchlist_mention"
  | "neutral_discussion"
  | "news_reporting"
  | "technical_analysis"
  | "narrative_commentary"
  | "bearish_warning"
  | "scam_warning"
  | "paid_promotion"
  | "giveaway_engagement_farming"
  | "joke_sarcasm"
  | "repost_no_conviction"
  | "exit_profit_taking"
  | "unclear";

export const CATEGORY_LABELS: Record<PostCategory, string> = {
  explicit_bullish_call: "Explicit bullish call",
  implied_bullish_call: "Implied bullish call",
  watchlist_mention: "Watchlist mention",
  neutral_discussion: "Neutral discussion",
  news_reporting: "News reporting",
  technical_analysis: "Technical analysis",
  narrative_commentary: "Narrative commentary",
  bearish_warning: "Bearish warning",
  scam_warning: "Scam warning",
  paid_promotion: "Paid promotion",
  giveaway_engagement_farming: "Giveaway / engagement farming",
  joke_sarcasm: "Joke / sarcasm",
  repost_no_conviction: "Repost without conviction",
  exit_profit_taking: "Exit / profit taking",
  unclear: "Unclear",
};

export type CallOutcome =
  | "open"
  | "profitable"
  | "failed"
  | "rugged"
  | "halted"
  | "migrated"
  | "abandoned"
  | "unresolved";

export type CallerTier = "S" | "A" | "B" | "C" | "watchlist" | "high_risk";

export const TIER_LABELS: Record<CallerTier, string> = {
  S: "S Tier",
  A: "A Tier",
  B: "B Tier",
  C: "C Tier",
  watchlist: "Watchlist",
  high_risk: "High Risk",
};

export type CallerStatus =
  | "new_discovery"
  | "under_review"
  | "proven_caller"
  | "high_priority"
  | "narrative_specialist"
  | "possible_promoter"
  | "coordinated_group"
  | "high_risk"
  | "ignored"
  | "archived";

export const STATUS_LABELS: Record<CallerStatus, string> = {
  new_discovery: "New discovery",
  under_review: "Under review",
  proven_caller: "Proven caller",
  high_priority: "High-priority caller",
  narrative_specialist: "Narrative specialist",
  possible_promoter: "Possible promoter",
  coordinated_group: "Coordinated group",
  high_risk: "High risk",
  ignored: "Ignored",
  archived: "Archived",
};

export type NarrativeLifecycle =
  | "dormant"
  | "emerging"
  | "accelerating"
  | "mainstream"
  | "saturated"
  | "declining"
  | "reviving";

export type ConvergenceClass =
  | "organic"
  | "possible_coordinated_campaign"
  | "confirmed_sponsored_campaign"
  | "copy_trading_cascade"
  | "uncertain";

export const CONVERGENCE_LABELS: Record<ConvergenceClass, string> = {
  organic: "Organic convergence",
  possible_coordinated_campaign: "Possible coordinated campaign",
  confirmed_sponsored_campaign: "Confirmed sponsored campaign",
  copy_trading_cascade: "Copy-trading cascade",
  uncertain: "Uncertain",
};

export interface Token {
  id: string;
  chain: ChainId;
  contractAddress: string;
  name: string;
  ticker: string;
  launchAt: string; // ISO
  pairCreatedAt: string;
  deployerWallet: string | null;
  primaryPool: string | null;
  website: string | null;
  narrative: string; // narrative slug
  // current market state
  priceUsd: number;
  marketCapUsd: number;
  fdvUsd: number;
  liquidityUsd: number;
  volume24hUsd: number;
  holderCount: number;
  change5m: number; // fraction, e.g. 0.042
  change1h: number;
  change24h: number;
  buys1h: number;
  sells1h: number;
  top10HolderPct: number;
  riskScore: number; // 0-100, higher = riskier
  riskFlags: string[];
  firstDetectedAt: string;
  socialVelocity: number; // mentions/hour normalised 0-100
  mentions1h: number;
  uniqueAuthors1h: number;
  sparkline: number[]; // recent price points, normalised
}

export interface Caller {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  accountCreatedAt: string;
  followers: number;
  following: number;
  verified: boolean;
  chains: ChainId[];
  narratives: string[];
  knownAliases: string[];
  communities: string[];
  disclosedWallets: string[];
  // CRM (team-scoped)
  status: CallerStatus;
  tags: string[];
  assignedTo: string | null;
  notes: CrmNote[];
}

export interface CrmNote {
  id: string;
  author: string;
  body: string;
  createdAt: string;
  isPrivate: boolean;
}

export interface Call {
  id: string;
  postId: string;
  callerId: string;
  tokenId: string;
  calledAt: string;
  category: PostCategory;
  isMeasurable: boolean;
  convictionScore: number;
  originalityScore: number;
  timingScore: number;
  evidenceStrength: number;
  contractSupplied: boolean;
  entrySupplied: boolean;
  edited: boolean;
  deleted: boolean;
  appearsSponsored: boolean;
  ownershipDisclosed: boolean | null;
  sponsorshipProbability: number;
  aiExplanation: string;
  confidence: number;
  // attribution
  priceAtCall: number;
  mcapAtCall: number;
  liquidityAtCall: number;
  headlineMultiple: number; // peak / at-call
  realisticMultiple: number; // liquidity-adjusted
  currentMultiple: number;
  maxDrawdownAfter: number; // fraction
  timeToPeakMinutes: number;
  tradableInOut: boolean;
  outcome: CallOutcome;
}

export interface Post {
  id: string;
  authorId: string;
  text: string;
  postedAt: string;
  url: string;
  kind: "original" | "reply" | "quote" | "repost";
  replies: number;
  reposts: number;
  quotes: number;
  likes: number;
  views: number;
  tokenId: string | null;
  resolutionMethod:
    | "contract"
    | "dex_link"
    | "name_chain"
    | "cashtag_context"
    | "image"
    | "narrative"
    | "unresolved";
  resolutionConfidence: number;
  category: PostCategory;
  riskFlags: string[];
  aiExplanation: string;
  deleted: boolean;
}

export interface Narrative {
  slug: string;
  name: string;
  firstDetectedAt: string;
  lifecycle: NarrativeLifecycle;
  mentions24h: number;
  growth24h: number; // fraction
  topTokenIds: string[];
  topCallerIds: string[];
  relatedTerms: string[];
  organicScore: number; // 0-100, organic vs coordinated
  regions: string[];
}

export interface ConvergenceEvent {
  id: string;
  tokenId: string;
  detectedAt: string;
  firstCallAt: string;
  callerIds: string[];
  avgAlphaScore: number;
  independenceScore: number; // 0-1
  wordingSimilarity: number; // 0-1
  mcapAtFirstCall: number;
  liquidityAtConvergence: number;
  preConvergenceMove: number; // fraction
  classification: ConvergenceClass;
  evidence: string[];
}

export interface AlertRule {
  id: string;
  name: string;
  triggerType: string;
  conditionSummary: string;
  destinations: string[];
  enabled: boolean;
}

export interface AlertEvent {
  id: string;
  ruleId: string;
  firedAt: string;
  what: string;
  why: string;
  supporting: string[];
  risks: string;
  confidence: number;
  tokenId: string | null;
  callerIds: string[];
}

export interface Investigation {
  id: string;
  title: string;
  status: "open" | "active" | "resolved" | "archived";
  subjects: { kind: "caller" | "token" | "wallet"; id: string; label: string }[];
  findings: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

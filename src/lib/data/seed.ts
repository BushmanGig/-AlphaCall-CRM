// Deterministic seeded dataset powering the app when no provider credentials
// are configured. Every UI state is exercised: organic vs coordinated
// convergence, rugs, untradeable candle spikes, sponsored campaigns, deleted
// posts, low-confidence resolutions and insufficient-history callers.
// Replacing MockMarketProvider / MockXProvider with real adapters requires no
// UI changes.

import type {
  AlertEvent,
  AlertRule,
  Call,
  Caller,
  ChainId,
  ConvergenceEvent,
  Investigation,
  Narrative,
  PostCategory,
  Token,
} from "../types";

// --- deterministic PRNG -----------------------------------------------------
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(1337);
const pick = <T,>(xs: T[]): T => xs[Math.floor(rand() * xs.length)];
const between = (lo: number, hi: number) => lo + rand() * (hi - lo);

export const NOW = Date.now();
const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const iso = (msAgo: number) => new Date(NOW - msAgo).toISOString();

function spark(n: number, drift: number, vol: number): number[] {
  let v = 100;
  const out = [v];
  for (let i = 0; i < n - 1; i++) {
    v = Math.max(5, v * (1 + drift + (rand() - 0.5) * vol));
    out.push(Math.round(v * 100) / 100);
  }
  return out;
}

// --- tokens ------------------------------------------------------------------
export const tokens: Token[] = [
  {
    id: "t-capy", chain: "solana", contractAddress: "CapyA71sVn3mQx9dTz4hUuJ2kR8pWfE6yLbN5cD1aGh4",
    name: "Atlas the Capybara", ticker: "CAPY", narrative: "animals",
    launchAt: iso(9 * HOUR), pairCreatedAt: iso(8.8 * HOUR),
    deployerWallet: "9wzD…k2Fq", primaryPool: "Raydium CAPY/SOL", website: "https://example.invalid/capy",
    priceUsd: 0.00147, marketCapUsd: 1_470_000, fdvUsd: 1_470_000, liquidityUsd: 312_000,
    volume24hUsd: 4_820_000, holderCount: 3120, change5m: 0.031, change1h: 0.22, change24h: 6.9,
    buys1h: 1240, sells1h: 610, top10HolderPct: 18.4, riskScore: 22,
    riskFlags: ["Deployer holds 3.1% (vested claim unverified)"],
    firstDetectedAt: iso(8.5 * HOUR), socialVelocity: 91, mentions1h: 418, uniqueAuthors1h: 236,
    sparkline: spark(48, 0.045, 0.10),
  },
  {
    id: "t-brain", chain: "base", contractAddress: "0x8a3fC2b71e94D5aa30C9f14E6bD27C14A0f9E7b2",
    name: "GigaBrain Agent", ticker: "BRAIN", narrative: "ai-agents",
    launchAt: iso(2.2 * DAY), pairCreatedAt: iso(2.2 * DAY),
    deployerWallet: "0x41c9…7dE0", primaryPool: "Aerodrome BRAIN/WETH", website: "https://example.invalid/brain",
    priceUsd: 0.0087, marketCapUsd: 8_700_000, fdvUsd: 9_400_000, liquidityUsd: 940_000,
    volume24hUsd: 6_100_000, holderCount: 8420, change5m: 0.006, change1h: 0.041, change24h: 0.62,
    buys1h: 720, sells1h: 540, top10HolderPct: 24.1, riskScore: 31,
    riskFlags: ["Contract owner can adjust fee (≤2%)"],
    firstDetectedAt: iso(2.1 * DAY), socialVelocity: 74, mentions1h: 205, uniqueAuthors1h: 141,
    sparkline: spark(48, 0.018, 0.08),
  },
  {
    id: "t-pixl", chain: "ethereum", contractAddress: "0xF13eB9a04D5C22071aE68d90cCd6a4B27E31F5c8",
    name: "Pixel Toad", ticker: "PIXL", narrative: "nostalgia",
    launchAt: iso(5 * DAY), pairCreatedAt: iso(5 * DAY),
    deployerWallet: "0x99aa…31Bc", primaryPool: "Uniswap v3 PIXL/WETH", website: null,
    priceUsd: 0.000031, marketCapUsd: 3_100_000, fdvUsd: 3_100_000, liquidityUsd: 520_000,
    volume24hUsd: 890_000, holderCount: 5210, change5m: -0.004, change1h: 0.012, change24h: 0.18,
    buys1h: 130, sells1h: 118, top10HolderPct: 21.7, riskScore: 28, riskFlags: [],
    firstDetectedAt: iso(4.8 * DAY), socialVelocity: 48, mentions1h: 64, uniqueAuthors1h: 51,
    sparkline: spark(48, 0.006, 0.06),
  },
  {
    id: "t-vote", chain: "solana", contractAddress: "Vote55hJq8LmN3rPwXs2CdK9fTgY7uB4eA6iZoQ1xW9v",
    name: "Ballot Box", ticker: "VOTE", narrative: "politics",
    launchAt: iso(12 * DAY), pairCreatedAt: iso(12 * DAY),
    deployerWallet: "3fRt…z8Kk", primaryPool: "Raydium VOTE/SOL", website: null,
    priceUsd: 0.00042, marketCapUsd: 420_000, fdvUsd: 420_000, liquidityUsd: 88_000,
    volume24hUsd: 140_000, holderCount: 1870, change5m: 0.001, change1h: -0.02, change24h: -0.11,
    buys1h: 42, sells1h: 55, top10HolderPct: 33.0, riskScore: 44,
    riskFlags: ["Volume decaying", "Top-10 concentration rising"],
    firstDetectedAt: iso(11.6 * DAY), socialVelocity: 22, mentions1h: 18, uniqueAuthors1h: 14,
    sparkline: spark(48, -0.008, 0.07),
  },
  {
    id: "t-fluff", chain: "solana", contractAddress: "FLuF9dKe2mQvR7sT4xWn8ZbC1yHj6gU3aPoL5iEwN0qM",
    name: "Fluffy Inu", ticker: "FLUFF", narrative: "animals",
    launchAt: iso(3 * DAY), pairCreatedAt: iso(3 * DAY),
    deployerWallet: "7hQw…p4Vd", primaryPool: "Raydium FLUFF/SOL (drained)", website: null,
    priceUsd: 0.0000004, marketCapUsd: 4_000, fdvUsd: 4_000, liquidityUsd: 900,
    volume24hUsd: 2_100, holderCount: 2210, change5m: 0, change1h: 0, change24h: -0.97,
    buys1h: 2, sells1h: 30, top10HolderPct: 61.0, riskScore: 96,
    riskFlags: ["Liquidity removed by deployer (rug event 26h ago)", "Deployer linked to 2 prior abandoned launches"],
    firstDetectedAt: iso(2.9 * DAY), socialVelocity: 9, mentions1h: 11, uniqueAuthors1h: 7,
    sparkline: [100, 180, 320, 540, 610, 580, 12, 8, 6, 5, 5, 4],
  },
  {
    id: "t-zoom", chain: "solana", contractAddress: "Zoom4kTt7yEr2wQa9XcV5nB8mJ1uHd6fSgL3oPiZ0xCr",
    name: "ZoomCat", ticker: "ZOOM", narrative: "animals",
    launchAt: iso(1.5 * DAY), pairCreatedAt: iso(1.5 * DAY),
    deployerWallet: "Bq2e…n7Ws", primaryPool: "Raydium ZOOM/SOL", website: null,
    priceUsd: 0.000018, marketCapUsd: 180_000, fdvUsd: 180_000, liquidityUsd: 14_500,
    volume24hUsd: 96_000, holderCount: 940, change5m: 0.002, change1h: -0.03, change24h: 0.4,
    buys1h: 25, sells1h: 21, top10HolderPct: 47.2, riskScore: 71,
    riskFlags: ["Peak price occurred on a single thin candle — headline multiples untradeable", "Very thin liquidity"],
    firstDetectedAt: iso(1.45 * DAY), socialVelocity: 31, mentions1h: 29, uniqueAuthors1h: 16,
    sparkline: [100, 110, 105, 4200, 130, 125, 140, 138, 150, 148, 155, 152],
  },
  {
    id: "t-moone", chain: "base", contractAddress: "0x5D18aE47bF0C39Ee12dA9c5F8B6a24D07C3eF9A1",
    name: "MoonEngine", ticker: "MOONE", narrative: "gaming",
    launchAt: iso(1.1 * DAY), pairCreatedAt: iso(1.1 * DAY),
    deployerWallet: "0x7bC1…f44A", primaryPool: "Aerodrome MOONE/WETH", website: "https://example.invalid/moone",
    priceUsd: 0.0021, marketCapUsd: 2_100_000, fdvUsd: 4_200_000, liquidityUsd: 260_000,
    volume24hUsd: 1_900_000, holderCount: 2650, change5m: 0.008, change1h: 0.06, change24h: 1.4,
    buys1h: 310, sells1h: 260, top10HolderPct: 38.9, riskScore: 63,
    riskFlags: ["Potential paid-post cluster (9 near-identical posts in 22 min)", "FDV is 2x market cap — large unlock overhang"],
    firstDetectedAt: iso(1.05 * DAY), socialVelocity: 66, mentions1h: 168, uniqueAuthors1h: 62,
    sparkline: spark(48, 0.02, 0.12),
  },
  {
    id: "t-wagmi", chain: "ethereum", contractAddress: "0xA402cD91E7f8B35a66E09d1fBc27a94D85C10E3f",
    name: "Wagmi Warriors", ticker: "WAGW", narrative: "internet-culture",
    launchAt: iso(2 * DAY), pairCreatedAt: iso(2 * DAY),
    deployerWallet: "0x2eF0…9cD3", primaryPool: "Uniswap v2 WAGW/WETH", website: null,
    priceUsd: 0.00009, marketCapUsd: 900_000, fdvUsd: 900_000, liquidityUsd: 130_000,
    volume24hUsd: 610_000, holderCount: 1980, change5m: -0.002, change1h: 0.01, change24h: 0.35,
    buys1h: 95, sells1h: 88, top10HolderPct: 29.5, riskScore: 52,
    riskFlags: ["Discussion dominated by near-identical posts — possible copy cascade"],
    firstDetectedAt: iso(1.9 * DAY), socialVelocity: 44, mentions1h: 96, uniqueAuthors1h: 34,
    sparkline: spark(48, 0.01, 0.09),
  },
  {
    id: "t-siren", chain: "solana", contractAddress: "SiRn8vWq3zXe5tYu1oPa7dFg9hJk2lMn4bCx6rEsQ0iK",
    name: "Solana Siren", ticker: "SIREN", narrative: "chain-mascots",
    launchAt: iso(42 * MIN), pairCreatedAt: iso(40 * MIN),
    deployerWallet: "Fj9s…w2Lp", primaryPool: "Pump.fun bonding curve", website: null,
    priceUsd: 0.000009, marketCapUsd: 92_000, fdvUsd: 92_000, liquidityUsd: 21_000,
    volume24hUsd: 84_000, holderCount: 412, change5m: 0.09, change1h: 1.8, change24h: 1.8,
    buys1h: 260, sells1h: 90, top10HolderPct: 26.3, riskScore: 49,
    riskFlags: ["Token is 42 minutes old — most risk data not yet available"],
    firstDetectedAt: iso(31 * MIN), socialVelocity: 83, mentions1h: 154, uniqueAuthors1h: 98,
    sparkline: [100, 115, 140, 160, 210, 260, 240, 280],
  },
  {
    id: "t-blub", chain: "base", contractAddress: "0xEe61B20a9dC4f7318A5b0cD92E6f13B8a74D5C29",
    name: "Blub the Whale", ticker: "BLUB", narrative: "animals",
    launchAt: iso(34 * DAY), pairCreatedAt: iso(34 * DAY),
    deployerWallet: "0x11dD…a0F7", primaryPool: "Aerodrome BLUB/WETH", website: "https://example.invalid/blub",
    priceUsd: 0.031, marketCapUsd: 31_000_000, fdvUsd: 31_000_000, liquidityUsd: 3_400_000,
    volume24hUsd: 5_200_000, holderCount: 24_800, change5m: 0.001, change1h: 0.008, change24h: 0.05,
    buys1h: 410, sells1h: 395, top10HolderPct: 15.2, riskScore: 18, riskFlags: [],
    firstDetectedAt: iso(33.5 * DAY), socialVelocity: 39, mentions1h: 88, uniqueAuthors1h: 71,
    sparkline: spark(48, 0.003, 0.04),
  },
  {
    id: "t-tstock", chain: "ethereum", contractAddress: "0x3C77aD10E5b9F4620Bc8A1d6E92C05f7D48B1eA6",
    name: "Not Financial Advice", ticker: "NFA", narrative: "tokenised-stocks",
    launchAt: iso(8 * DAY), pairCreatedAt: iso(8 * DAY),
    deployerWallet: "0x8bA2…4c19", primaryPool: "Uniswap v3 NFA/WETH", website: null,
    priceUsd: 0.0006, marketCapUsd: 600_000, fdvUsd: 600_000, liquidityUsd: 95_000,
    volume24hUsd: 120_000, holderCount: 1420, change5m: 0.0, change1h: 0.02, change24h: 0.09,
    buys1h: 35, sells1h: 30, top10HolderPct: 27.8, riskScore: 41, riskFlags: [],
    firstDetectedAt: iso(7.7 * DAY), socialVelocity: 26, mentions1h: 22, uniqueAuthors1h: 18,
    sparkline: spark(48, 0.004, 0.05),
  },
  {
    id: "t-noodle", chain: "solana", contractAddress: "NooD2eLq6wRt8yUi0oPk3jHg5fDs7aZx9cVb1nMe4SkA",
    name: "Noodle Dragon", ticker: "NOODLE", narrative: "animals",
    launchAt: iso(60 * DAY), pairCreatedAt: iso(60 * DAY),
    deployerWallet: "Kd4r…m9Tt", primaryPool: "Raydium NOODLE/SOL", website: null,
    priceUsd: 0.00011, marketCapUsd: 1_100_000, fdvUsd: 1_100_000, liquidityUsd: 210_000,
    volume24hUsd: 380_000, holderCount: 6300, change5m: 0.004, change1h: 0.07, change24h: 0.31,
    buys1h: 150, sells1h: 90, top10HolderPct: 19.9, riskScore: 26,
    riskFlags: [],
    firstDetectedAt: iso(59 * DAY), socialVelocity: 57, mentions1h: 102, uniqueAuthors1h: 77,
    sparkline: spark(48, 0.012, 0.06),
  },
];

export const tokenById = new Map(tokens.map((t) => [t.id, t]));

// --- narratives ----------------------------------------------------------------
export const narratives: Narrative[] = [
  { slug: "animals", name: "Animal memes", firstDetectedAt: iso(400 * DAY), lifecycle: "mainstream", mentions24h: 12_400, growth24h: 0.21, topTokenIds: ["t-capy", "t-blub", "t-noodle"], topCallerIds: ["c-solwhisper", "c-quietquant"], relatedTerms: ["capybara", "inu", "cat szn", "zoo meta"], organicScore: 78, regions: ["US", "EU", "SEA"] },
  { slug: "ai-agents", name: "AI agents", firstDetectedAt: iso(120 * DAY), lifecycle: "accelerating", mentions24h: 8_900, growth24h: 0.64, topTokenIds: ["t-brain"], topCallerIds: ["c-basehound", "c-narrator"], relatedTerms: ["agent", "gigabrain", "onchain ai"], organicScore: 71, regions: ["US", "EU"] },
  { slug: "chain-mascots", name: "Chain mascots", firstDetectedAt: iso(30 * DAY), lifecycle: "emerging", mentions24h: 2_100, growth24h: 1.4, topTokenIds: ["t-siren"], topCallerIds: ["c-solwhisper"], relatedTerms: ["siren", "mascot", "sol summer"], organicScore: 82, regions: ["US"] },
  { slug: "politics", name: "Political memes", firstDetectedAt: iso(200 * DAY), lifecycle: "declining", mentions24h: 1_800, growth24h: -0.18, topTokenIds: ["t-vote"], topCallerIds: ["c-memelord"], relatedTerms: ["election", "ballot"], organicScore: 55, regions: ["US"] },
  { slug: "nostalgia", name: "Nostalgia", firstDetectedAt: iso(90 * DAY), lifecycle: "reviving", mentions24h: 1_600, growth24h: 0.33, topTokenIds: ["t-pixl"], topCallerIds: ["c-ethog"], relatedTerms: ["pixel", "retro", "2013 vibes"], organicScore: 74, regions: ["US", "EU"] },
  { slug: "gaming", name: "Gaming", firstDetectedAt: iso(150 * DAY), lifecycle: "emerging", mentions24h: 2_600, growth24h: 0.4, topTokenIds: ["t-moone"], topCallerIds: ["c-pumpherald"], relatedTerms: ["p2e", "engine"], organicScore: 38, regions: ["SEA", "US"] },
  { slug: "internet-culture", name: "Internet culture", firstDetectedAt: iso(300 * DAY), lifecycle: "saturated", mentions24h: 5_400, growth24h: 0.05, topTokenIds: ["t-wagmi"], topCallerIds: ["c-copycat1"], relatedTerms: ["wagmi", "gm"], organicScore: 41, regions: ["Global"] },
  { slug: "tokenised-stocks", name: "Tokenised-stock culture", firstDetectedAt: iso(45 * DAY), lifecycle: "emerging", mentions24h: 900, growth24h: 0.5, topTokenIds: ["t-tstock"], topCallerIds: ["c-fadecheck"], relatedTerms: ["nfa", "stonks", "robinhood chain"], organicScore: 69, regions: ["US"] },
];

// --- callers ---------------------------------------------------------------------
interface CallerProfileSpec {
  nCalls: number;
  winSkew: number; // 0-1 — higher = better multiples
  timingBase: number; // 0-100
  originalityBase: number; // 0-100
  sponsoredProb: number;
  discloseProb: number;
  contractProb: number;
  deletedLosers: number;
  lateRatio: number;
  botProb: number;
  coordProb: number;
  rugCount: number;
  fakeScreens: number;
  entryEdits: number;
  simultaneousMax: number;
  favouriteTokens: string[];
}

export const callers: Caller[] = [
  { id: "c-solwhisper", username: "solwhisperer", displayName: "Sol Whisperer", bio: "Finding Solana runners before the crowd. Research only, never advice.", accountCreatedAt: iso(1200 * DAY), followers: 184_000, following: 412, verified: true, chains: ["solana"], narratives: ["animals", "chain-mascots"], knownAliases: [], communities: ["TG: SolWhisper Lounge"], disclosedWallets: ["9wzD…k2Fq"], status: "high_priority", tags: ["Solana", "New launches", "Narrative caller"], assignedTo: "you", notes: [{ id: "n1", author: "you", body: "Consistently early on animal meta. Watch for size limits — calls move thin books.", createdAt: iso(6 * DAY), isPrivate: false }] },
  { id: "c-quietquant", username: "quietquant", displayName: "Quiet Quant", bio: "Low frequency. High conviction. Data over vibes.", accountCreatedAt: iso(900 * DAY), followers: 42_000, following: 180, verified: false, chains: ["solana", "ethereum"], narratives: ["animals", "ai-agents"], knownAliases: [], communities: [], disclosedWallets: [], status: "proven_caller", tags: ["Technical analyst", "Micro-cap"], assignedTo: null, notes: [] },
  { id: "c-basehound", username: "BaseHound", displayName: "Base Hound", bio: "Sniffing Base launches. DYOR.", accountCreatedAt: iso(700 * DAY), followers: 96_000, following: 890, verified: true, chains: ["base"], narratives: ["ai-agents", "animals"], knownAliases: [], communities: ["TG: Hound Pack"], disclosedWallets: ["0x41c9…7dE0"], status: "proven_caller", tags: ["Base", "New launches"], assignedTo: null, notes: [] },
  { id: "c-ethog", username: "etherOG", displayName: "Ether OG", bio: "ETH memes since 2017. Slow and steady.", accountCreatedAt: iso(2900 * DAY), followers: 128_000, following: 1_240, verified: true, chains: ["ethereum"], narratives: ["nostalgia", "internet-culture"], knownAliases: ["ethOG_backup"], communities: [], disclosedWallets: [], status: "proven_caller", tags: ["Ethereum", "Narrative caller"], assignedTo: null, notes: [] },
  { id: "c-fadecheck", username: "fadecheck", displayName: "Fade Check", bio: "I chart memes so you don't have to.", accountCreatedAt: iso(500 * DAY), followers: 31_000, following: 610, verified: false, chains: ["ethereum", "base"], narratives: ["tokenised-stocks"], knownAliases: [], communities: [], disclosedWallets: [], status: "under_review", tags: ["Technical analyst"], assignedTo: "sam", notes: [] },
  { id: "c-narrator", username: "narrativenina", displayName: "Narrative Nina", bio: "Meta first, ticker second.", accountCreatedAt: iso(800 * DAY), followers: 58_000, following: 720, verified: false, chains: ["solana", "base"], narratives: ["ai-agents", "chain-mascots"], knownAliases: [], communities: ["Discord: Meta Watchers"], disclosedWallets: [], status: "narrative_specialist", tags: ["Narrative caller", "AI memes"], assignedTo: null, notes: [] },
  { id: "c-memelord", username: "memelordmax", displayName: "Memelord Max", bio: "1000 calls a week. One of them will hit.", accountCreatedAt: iso(400 * DAY), followers: 210_000, following: 4_900, verified: true, chains: ["solana", "ethereum", "base"], narratives: ["politics", "internet-culture"], knownAliases: [], communities: ["TG: Max Signals (paid)"], disclosedWallets: [], status: "under_review", tags: ["High volume"], assignedTo: null, notes: [{ id: "n2", author: "sam", body: "Volume shooter — hit rate collapses once you weight by liquidity. Late-call ratio is the tell.", createdAt: iso(10 * DAY), isPrivate: true }] },
  { id: "c-pumpherald", username: "pump_herald", displayName: "Pump Herald", bio: "Your favourite caller's favourite caller.", accountCreatedAt: iso(150 * DAY), followers: 88_000, following: 302, verified: false, chains: ["base", "solana"], narratives: ["gaming"], knownAliases: ["herald_backup1"], communities: ["TG: Herald VIP (paid)"], disclosedWallets: [], status: "possible_promoter", tags: ["Paid promoter?"], assignedTo: "you", notes: [{ id: "n3", author: "you", body: "Elevated risk indicators: 6 deleted losing calls, sponsorship-pattern language, MOONE cluster. Not confirmed — keep gathering evidence.", createdAt: iso(2 * DAY), isPrivate: false }] },
  { id: "c-copycat1", username: "alphaechoes", displayName: "Alpha Echoes", bio: "Relaying the best alpha on the TL.", accountCreatedAt: iso(90 * DAY), followers: 12_000, following: 2_100, verified: false, chains: ["ethereum"], narratives: ["internet-culture"], knownAliases: [], communities: ["TG: Echo Chamber"], disclosedWallets: [], status: "coordinated_group", tags: ["Insider risk"], assignedTo: null, notes: [] },
  { id: "c-copycat2", username: "gemrelayer", displayName: "Gem Relayer", bio: "Gems. Relayed.", accountCreatedAt: iso(85 * DAY), followers: 9_400, following: 1_900, verified: false, chains: ["ethereum"], narratives: ["internet-culture"], knownAliases: [], communities: ["TG: Echo Chamber"], disclosedWallets: [], status: "coordinated_group", tags: ["Insider risk"], assignedTo: null, notes: [] },
  { id: "c-rugmagnet", username: "moonshot_mikey", displayName: "Moonshot Mikey", bio: "Only moonshots. No brakes.", accountCreatedAt: iso(200 * DAY), followers: 45_000, following: 3_800, verified: false, chains: ["solana"], narratives: ["animals"], knownAliases: [], communities: [], disclosedWallets: [], status: "high_risk", tags: ["Micro-cap"], assignedTo: null, notes: [] },
  { id: "c-newbie", username: "chainscout_", displayName: "Chain Scout", bio: "New here. Posting what I find.", accountCreatedAt: iso(40 * DAY), followers: 1_800, following: 350, verified: false, chains: ["solana"], narratives: ["chain-mascots"], knownAliases: [], communities: [], disclosedWallets: [], status: "new_discovery", tags: ["New launches"], assignedTo: null, notes: [] },
];

export const callerById = new Map(callers.map((c) => [c.id, c]));

export const profileSpecs: Record<string, CallerProfileSpec> = {
  "c-solwhisper": { nCalls: 46, winSkew: 0.85, timingBase: 86, originalityBase: 88, sponsoredProb: 0.02, discloseProb: 0.9, contractProb: 0.95, deletedLosers: 0, lateRatio: 0.08, botProb: 0.04, coordProb: 0.05, rugCount: 0, fakeScreens: 0, entryEdits: 0, simultaneousMax: 3, favouriteTokens: ["t-capy", "t-siren", "t-noodle", "t-blub"] },
  "c-quietquant": { nCalls: 18, winSkew: 0.82, timingBase: 80, originalityBase: 82, sponsoredProb: 0.0, discloseProb: 0.7, contractProb: 1.0, deletedLosers: 0, lateRatio: 0.05, botProb: 0.02, coordProb: 0.03, rugCount: 0, fakeScreens: 0, entryEdits: 0, simultaneousMax: 2, favouriteTokens: ["t-capy", "t-brain", "t-noodle"] },
  "c-basehound": { nCalls: 38, winSkew: 0.87, timingBase: 84, originalityBase: 80, sponsoredProb: 0.02, discloseProb: 0.9, contractProb: 0.95, deletedLosers: 0, lateRatio: 0.08, botProb: 0.04, coordProb: 0.05, rugCount: 0, fakeScreens: 0, entryEdits: 0, simultaneousMax: 3, favouriteTokens: ["t-brain", "t-blub", "t-capy"] },
  "c-ethog": { nCalls: 28, winSkew: 0.68, timingBase: 62, originalityBase: 75, sponsoredProb: 0.03, discloseProb: 0.8, contractProb: 0.7, deletedLosers: 0, lateRatio: 0.2, botProb: 0.05, coordProb: 0.04, rugCount: 0, fakeScreens: 0, entryEdits: 0, simultaneousMax: 3, favouriteTokens: ["t-pixl", "t-wagmi", "t-tstock"] },
  "c-fadecheck": { nCalls: 22, winSkew: 0.55, timingBase: 55, originalityBase: 64, sponsoredProb: 0.05, discloseProb: 0.5, contractProb: 0.6, deletedLosers: 1, lateRatio: 0.3, botProb: 0.1, coordProb: 0.08, rugCount: 1, fakeScreens: 0, entryEdits: 0, simultaneousMax: 5, favouriteTokens: ["t-tstock", "t-pixl", "t-wagmi"] },
  "c-narrator": { nCalls: 20, winSkew: 0.66, timingBase: 76, originalityBase: 88, sponsoredProb: 0.02, discloseProb: 0.6, contractProb: 0.5, deletedLosers: 0, lateRatio: 0.1, botProb: 0.06, coordProb: 0.05, rugCount: 0, fakeScreens: 0, entryEdits: 0, simultaneousMax: 3, favouriteTokens: ["t-brain", "t-siren", "t-capy"] },
  "c-memelord": { nCalls: 88, winSkew: 0.38, timingBase: 34, originalityBase: 28, sponsoredProb: 0.2, discloseProb: 0.2, contractProb: 0.4, deletedLosers: 4, lateRatio: 0.62, botProb: 0.3, coordProb: 0.25, rugCount: 3, fakeScreens: 1, entryEdits: 1, simultaneousMax: 14, favouriteTokens: ["t-vote", "t-wagmi", "t-zoom", "t-capy", "t-moone"] },
  "c-pumpherald": { nCalls: 40, winSkew: 0.3, timingBase: 30, originalityBase: 35, sponsoredProb: 0.6, discloseProb: 0.05, contractProb: 0.9, deletedLosers: 6, lateRatio: 0.55, botProb: 0.45, coordProb: 0.6, rugCount: 4, fakeScreens: 2, entryEdits: 2, simultaneousMax: 9, favouriteTokens: ["t-moone", "t-zoom", "t-fluff"] },
  "c-copycat1": { nCalls: 25, winSkew: 0.35, timingBase: 25, originalityBase: 12, sponsoredProb: 0.3, discloseProb: 0.1, contractProb: 0.8, deletedLosers: 2, lateRatio: 0.7, botProb: 0.5, coordProb: 0.85, rugCount: 2, fakeScreens: 1, entryEdits: 0, simultaneousMax: 8, favouriteTokens: ["t-wagmi", "t-moone"] },
  "c-copycat2": { nCalls: 23, winSkew: 0.33, timingBase: 22, originalityBase: 10, sponsoredProb: 0.3, discloseProb: 0.1, contractProb: 0.8, deletedLosers: 2, lateRatio: 0.72, botProb: 0.55, coordProb: 0.88, rugCount: 2, fakeScreens: 0, entryEdits: 0, simultaneousMax: 8, favouriteTokens: ["t-wagmi", "t-moone"] },
  "c-rugmagnet": { nCalls: 31, winSkew: 0.28, timingBase: 45, originalityBase: 50, sponsoredProb: 0.15, discloseProb: 0.3, contractProb: 0.7, deletedLosers: 3, lateRatio: 0.35, botProb: 0.2, coordProb: 0.15, rugCount: 5, fakeScreens: 1, entryEdits: 1, simultaneousMax: 7, favouriteTokens: ["t-fluff", "t-zoom", "t-vote"] },
  "c-newbie": { nCalls: 4, winSkew: 0.75, timingBase: 78, originalityBase: 80, sponsoredProb: 0.0, discloseProb: 0.5, contractProb: 1.0, deletedLosers: 0, lateRatio: 0.0, botProb: 0.05, coordProb: 0.05, rugCount: 0, fakeScreens: 0, entryEdits: 0, simultaneousMax: 1, favouriteTokens: ["t-siren", "t-capy"] },
};

// --- generated calls -----------------------------------------------------------
function drawMultiple(winSkew: number): number {
  // Log-normal-ish: losers cluster < 1x, winners fat tail.
  const u = rand();
  if (u > winSkew) return Math.round(between(0.15, 0.95) * 100) / 100; // loser
  const tail = rand();
  if (tail > 0.97) return Math.round(between(80, 240) * 10) / 10;
  if (tail > 0.9) return Math.round(between(20, 80) * 10) / 10;
  if (tail > 0.7) return Math.round(between(5, 20) * 10) / 10;
  return Math.round(between(1.5, 6) * 100) / 100;
}

const CALL_TEXTS = [
  "Accumulating $%T here. Thesis in thread — community is the strongest I've seen this month. NFA.",
  "$%T still early imo. Contract: %C. Watching the holder curve closely.",
  "This could run. $%T volume profile looks organic and the meme writes itself.",
  "My next conviction play is $%T. Do not fade the %N meta.",
  "Sending soon — $%T. Small bag, tight invalidation.",
  "Watch this: $%T just crossed the author-growth threshold on my scanner.",
];

export const calls: Call[] = [];
let callSeq = 0;

function addCall(partial: Partial<Call> & { callerId: string; tokenId: string; calledAt: string }): Call {
  const token = tokenById.get(partial.tokenId)!;
  const headline = partial.headlineMultiple ?? 1;
  const c: Call = {
    id: `call-${++callSeq}`,
    postId: `post-${callSeq}`,
    category: "explicit_bullish_call",
    isMeasurable: true,
    convictionScore: 70,
    originalityScore: 60,
    timingScore: 60,
    evidenceStrength: 60,
    contractSupplied: true,
    entrySupplied: false,
    edited: false,
    deleted: false,
    appearsSponsored: false,
    ownershipDisclosed: null,
    sponsorshipProbability: 0.05,
    aiExplanation: "Identifiable positive thesis with expectation of appreciation.",
    confidence: 0.85,
    priceAtCall: token.priceUsd / Math.max(headline * 0.6, 0.2),
    mcapAtCall: Math.round(token.marketCapUsd / Math.max(headline * 0.7, 0.2)),
    liquidityAtCall: Math.round(token.liquidityUsd * between(0.4, 1)),
    headlineMultiple: headline,
    realisticMultiple: partial.realisticMultiple ?? headline,
    currentMultiple: partial.currentMultiple ?? Math.max(0.05, headline * between(0.4, 0.9)),
    maxDrawdownAfter: between(0.1, 0.6),
    timeToPeakMinutes: Math.round(between(30, 4000)),
    tradableInOut: true,
    outcome: "open",
    ...partial,
  };
  calls.push(c);
  return c;
}

for (const caller of callers) {
  const spec = profileSpecs[caller.id];
  for (let i = 0; i < spec.nCalls; i++) {
    const tokenId = rand() < 0.6 ? pick(spec.favouriteTokens) : pick(tokens).id;
    const token = tokenById.get(tokenId)!;
    const headline = drawMultiple(spec.winSkew);
    const thin = token.liquidityUsd < 30_000;
    const keep = thin ? between(0.05, 0.35) : between(0.65, 0.98);
    const realistic = Math.round(Math.max(headline <= 1 ? headline : 1, headline * keep) * 100) / 100;
    const isRug = token.id === "t-fluff";
    const isLoser = realistic < 1;
    const deleted = isLoser && calls.filter((c) => c.callerId === caller.id && c.deleted).length < spec.deletedLosers;
    const late = rand() < spec.lateRatio;
    // A call can never predate the token's launch.
    const tokenAgeDays = (NOW - new Date(token.launchAt).getTime()) / DAY;
    const daysAgo = between(0.02, Math.min(180, tokenAgeDays * 0.95));
    addCall({
      callerId: caller.id,
      tokenId,
      calledAt: iso(daysAgo * DAY),
      category: rand() < 0.7 ? "explicit_bullish_call" : "implied_bullish_call",
      convictionScore: Math.round(between(50, 95)),
      originalityScore: Math.round(Math.min(100, Math.max(0, spec.originalityBase + between(-15, 15)))),
      timingScore: Math.round(Math.min(100, Math.max(0, (late ? spec.timingBase - 35 : spec.timingBase) + between(-10, 10)))),
      evidenceStrength: Math.round(between(spec.originalityBase * 0.5, Math.min(95, spec.originalityBase + 20))),
      contractSupplied: rand() < spec.contractProb,
      entrySupplied: rand() < 0.3,
      appearsSponsored: rand() < spec.sponsoredProb,
      ownershipDisclosed: rand() < spec.discloseProb ? true : rand() < 0.5 ? false : null,
      sponsorshipProbability: Math.round(Math.min(0.95, spec.sponsoredProb + between(0, 0.2)) * 100) / 100,
      deleted,
      edited: rand() < 0.05,
      headlineMultiple: headline,
      realisticMultiple: isRug ? Math.min(realistic, 0.1) : realistic,
      currentMultiple: isRug ? 0.01 : Math.round(Math.max(0.03, realistic * between(0.5, 1.05)) * 100) / 100,
      tradableInOut: !thin,
      outcome: isRug ? "rugged" : daysAgo < 7 ? "open" : realistic >= 1.5 ? "profitable" : "failed",
      aiExplanation: pick(CALL_TEXTS).includes("Watch") ? "Watch-style call with identifiable expectation." : "Identifiable positive thesis with expectation of appreciation.",
    });
  }
}

// Pinned story calls — the CAPY organic convergence (used by the UI verbatim).
export const capyConvergenceCalls = [
  addCall({ callerId: "c-solwhisper", tokenId: "t-capy", calledAt: iso(8.4 * HOUR), timingScore: 94, originalityScore: 95, convictionScore: 88, evidenceStrength: 90, headlineMultiple: 8.2, realisticMultiple: 7.4, currentMultiple: 7.9, mcapAtCall: 180_000, liquidityAtCall: 95_000, contractSupplied: true, ownershipDisclosed: true, outcome: "open", aiExplanation: "Original thesis at $180k mcap with contract supplied; author disclosed a position." }),
  addCall({ callerId: "c-quietquant", tokenId: "t-capy", calledAt: iso(7.6 * HOUR), timingScore: 88, originalityScore: 84, convictionScore: 82, evidenceStrength: 92, headlineMultiple: 5.9, realisticMultiple: 5.3, currentMultiple: 5.6, mcapAtCall: 250_000, liquidityAtCall: 120_000, contractSupplied: true, ownershipDisclosed: true, outcome: "open", aiExplanation: "Independent quantitative thesis citing holder-growth data; wording dissimilar to prior calls." }),
  addCall({ callerId: "c-basehound", tokenId: "t-capy", calledAt: iso(6.9 * HOUR), timingScore: 79, originalityScore: 71, convictionScore: 75, evidenceStrength: 74, headlineMultiple: 4.1, realisticMultiple: 3.8, currentMultiple: 4.0, mcapAtCall: 360_000, liquidityAtCall: 150_000, contractSupplied: true, ownershipDisclosed: false, outcome: "open", aiExplanation: "Cross-chain caller entering independently ~90 min after first call." }),
];

// --- alert rules & events -----------------------------------------------------
export const alertRules: AlertRule[] = [
  { id: "a-1", name: "Proven-caller convergence (3+)", triggerType: "convergence", conditionSummary: "≥3 callers with Alpha ≥ 75 on the same token within 4h, independence ≥ 0.6", destinations: ["in_app", "telegram"], enabled: true },
  { id: "a-2", name: "Runner score threshold", triggerType: "runner_score", conditionSummary: "Runner Probability Score crosses 80 with confidence ≥ 0.6", destinations: ["in_app", "push"], enabled: true },
  { id: "a-3", name: "Top caller posts new token", triggerType: "caller_post", conditionSummary: "Any S/A-tier caller posts a measurable call on a token < 24h old", destinations: ["in_app", "discord"], enabled: true },
  { id: "a-4", name: "Liquidity drain guard", triggerType: "liquidity", conditionSummary: "Liquidity drops >30% in 1h on any watchlist token", destinations: ["in_app", "email", "webhook"], enabled: true },
  { id: "a-5", name: "Paid-promotion cluster", triggerType: "paid_cluster", conditionSummary: "≥5 near-identical bullish posts within 30 min (similarity ≥ 0.8)", destinations: ["in_app"], enabled: true },
  { id: "a-6", name: "Deleted caller post", triggerType: "deleted_post", conditionSummary: "A tracked caller deletes a measurable call", destinations: ["in_app"], enabled: false },
];

export const alertEvents: AlertEvent[] = [
  { id: "ae-1", ruleId: "a-1", firedAt: iso(6.8 * HOUR), what: "3 proven callers converged on CAPY (Atlas the Capybara, Solana)", why: "solwhisperer, quietquant and BaseHound — avg Alpha 86 — posted independent bullish calls within 95 minutes. First call at $180k market cap. Classified organic: wording dissimilar (12%), no shared communities detected.", supporting: ["Independence score 0.81", "Wording similarity 0.12", "Mcap at first call $180k", "Liquidity at convergence $150k"], risks: "Deployer holds 3.1% with unverified vesting claim; convergence can still precede distribution.", confidence: 0.86, tokenId: "t-capy", callerIds: ["c-solwhisper", "c-quietquant", "c-basehound"] },
  { id: "ae-2", ruleId: "a-2", firedAt: iso(5.9 * HOUR), what: "CAPY Runner Probability Score crossed 85", why: "Social acceleration 91/100 with unique-author growth leading raw mentions (bot check passed); market quality improving as liquidity doubled.", supporting: ["Mentions +240% in 1h", "Unique authors +180%", "Liquidity $150k → $312k"], risks: "Score is a research ranking, not a return prediction.", confidence: 0.82, tokenId: "t-capy", callerIds: [] },
  { id: "ae-3", ruleId: "a-5", firedAt: iso(22 * HOUR), what: "Potential paid-post cluster on MOONE (MoonEngine, Base)", why: "9 near-identical bullish posts published within 22 minutes by accounts sharing the 'Herald VIP' community. Sponsorship probability elevated; no disclosures found.", supporting: ["Similarity 0.91 across 9 posts", "8/9 authors joined X < 6 months ago", "pump_herald posted first"], risks: "Possible coordination — requires manual review before any conclusion about individual accounts.", confidence: 0.74, tokenId: "t-moone", callerIds: ["c-pumpherald", "c-copycat1", "c-copycat2"] },
  { id: "ae-4", ruleId: "a-4", firedAt: iso(26 * HOUR), what: "FLUFF liquidity removed (−98% in 12 minutes)", why: "Deployer wallet withdrew the Raydium pool. Token flagged as rug event; all open calls marked rugged and realistic multiples resolved to exit value.", supporting: ["Pool $118k → $900", "Deployer linked to 2 prior abandoned launches"], risks: "Recovery is unlikely; treat any bounce as exit liquidity.", confidence: 0.97, tokenId: "t-fluff", callerIds: ["c-rugmagnet", "c-pumpherald"] },
  { id: "ae-5", ruleId: "a-3", firedAt: iso(28 * MIN), what: "solwhisperer posted a measurable call on SIREN (42 min old)", why: "S-tier caller, original thesis, contract supplied, token below $100k market cap at post time. Insufficient market history — most risk checks pending.", supporting: ["Mcap at call $61k", "Timing score 96", "Bonding curve 68% complete"], risks: "Token is 42 minutes old — honeypot/holder analysis incomplete. Elevated uncertainty.", confidence: 0.66, tokenId: "t-siren", callerIds: ["c-solwhisper"] },
  { id: "ae-6", ruleId: "a-6", firedAt: iso(30 * HOUR), what: "pump_herald deleted a losing MOONE call", why: "The deleted post recommended entry at $4.9M FDV; price is −38% since. This is the 6th deleted losing call on this profile — deleted-loser penalty applied to Caller Alpha Score.", supporting: ["Snapshot archived before deletion", "Deleted-loser count: 6"], risks: "Pattern consistent with performance curation. Requires manual review.", confidence: 0.9, tokenId: "t-moone", callerIds: ["c-pumpherald"] },
];

// --- investigations -------------------------------------------------------------
export const investigations: Investigation[] = [
  {
    id: "inv-1", title: "MOONE paid-promotion cluster", status: "active",
    subjects: [
      { kind: "token", id: "t-moone", label: "MOONE" },
      { kind: "caller", id: "c-pumpherald", label: "@pump_herald" },
      { kind: "caller", id: "c-copycat1", label: "@alphaechoes" },
      { kind: "caller", id: "c-copycat2", label: "@gemrelayer" },
    ],
    findings: "9 near-identical posts in 22 minutes; shared 'Echo Chamber' / 'Herald VIP' communities; no sponsorship disclosures. Classification: possible coordinated campaign — insufficient evidence for confirmed sponsorship. Next: wallet-funding trace once Phase-3 wallet graph lands.",
    createdBy: "you", createdAt: iso(20 * HOUR), updatedAt: iso(3 * HOUR),
  },
  {
    id: "inv-2", title: "FLUFF rug post-mortem", status: "resolved",
    subjects: [
      { kind: "token", id: "t-fluff", label: "FLUFF" },
      { kind: "caller", id: "c-rugmagnet", label: "@moonshot_mikey" },
      { kind: "wallet", id: "7hQw…p4Vd", label: "Deployer 7hQw…p4Vd" },
    ],
    findings: "Deployer drained pool 26h ago. moonshot_mikey called FLUFF 3 times including 40 min pre-drain; no evidence of insider link found (posting pattern consistent with his usual late momentum entries). Elevated risk indicators recorded on profile; no scammer designation — evidence insufficient.",
    createdBy: "sam", createdAt: iso(25 * HOUR), updatedAt: iso(18 * HOUR),
  },
  {
    id: "inv-3", title: "ZOOM untradeable-spike audit", status: "open",
    subjects: [{ kind: "token", id: "t-zoom", label: "ZOOM" }],
    findings: "Single 1-second candle printed a 42x headline peak on $14.5k liquidity. Realistic multiple capped at 2.8x after slippage model. Verify no caller is claiming the 42x as a win.",
    createdBy: "you", createdAt: iso(10 * HOUR), updatedAt: iso(10 * HOUR),
  },
];

// --- misc feed posts (non-call categories, for the live feed) --------------------
export interface FeedExtra {
  id: string;
  callerId: string;
  tokenId: string | null;
  postedAt: string;
  text: string;
  category: PostCategory;
  riskFlags: string[];
  aiExplanation: string;
}

export const feedExtras: FeedExtra[] = [
  { id: "fx-1", callerId: "c-quietquant", tokenId: "t-zoom", postedAt: iso(3.2 * HOUR), text: "PSA: that ZOOM 'peak' was one candle on $14k liquidity. If a caller screenshots a 42x on this, ask for the fill.", category: "scam_warning", riskFlags: ["untradeable_peak_reference"], aiExplanation: "Warning about untradeable candle spike — not a call." },
  { id: "fx-2", callerId: "c-narrator", tokenId: null, postedAt: iso(2.1 * HOUR), text: "Chain-mascot meta is doing what AI agents did in week one: author growth before price. Watching three tickers, will post when conviction is real.", category: "narrative_commentary", riskFlags: [], aiExplanation: "Narrative commentary without an identifiable token thesis — not measurable." },
  { id: "fx-3", callerId: "c-memelord", tokenId: "t-capy", postedAt: iso(40 * MIN), text: "$CAPY IS THE ONE. 100x LOADING. RT AND FOLLOW FOR THE NEXT GEM 🚀🚀🚀", category: "giveaway_engagement_farming", riskFlags: ["late_call", "engagement_farming_language"], aiExplanation: "Token already up 6.9x in 24h before this post; language pattern matches engagement farming. Not counted as an original call." },
  { id: "fx-4", callerId: "c-ethog", tokenId: "t-pixl", postedAt: iso(5 * HOUR), text: "PIXL holding the range. Volume declining but holder base still growing — classic accumulation or slow bleed, next 48h decides.", category: "technical_analysis", riskFlags: [], aiExplanation: "Chart commentary without directional recommendation — not a measurable call." },
  { id: "fx-5", callerId: "c-pumpherald", tokenId: "t-moone", postedAt: iso(23 * HOUR), text: "MOONE is the next 50x. Gaming season is HERE. Contract: 0x5D18…F9A1. Don't say I didn't tell you.", category: "paid_promotion", riskFlags: ["possible_undisclosed_promotion", "paid_cluster_member"], aiExplanation: "Potential paid promotion: posted 4 minutes before 8 near-identical posts from linked accounts. No disclosure found. Requires manual review." },
  { id: "fx-6", callerId: "c-solwhisper", tokenId: "t-capy", postedAt: iso(1.5 * HOUR), text: "Taking 30% off the CAPY position into strength. Thesis intact, risk management is the edge. Full log in pinned.", category: "exit_profit_taking", riskFlags: [], aiExplanation: "Exit/profit-taking post — recorded against the original call's audit trail." },
];

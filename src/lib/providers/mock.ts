import type { ChainId, Token } from "../types";
import { tokens, feed, NOW } from "../data";
import type {
  Candle,
  MarketDataProvider,
  ProviderHealth,
  RawPost,
  SocialProvider,
  SocialQuery,
  TokenQuery,
} from "./types";

// Mock adapters serving the seeded dataset. Real adapters (DexScreener,
// Birdeye, GeckoTerminal, CoinGecko, X API, ...) implement the same
// interfaces and are selected via configuration — no UI changes required.

export const mockMarketProvider: MarketDataProvider = {
  id: "mock_market",
  supports: (chain: ChainId) => chain !== "robinhood",
  async getTokenByContract(chain, address) {
    return (
      tokens.find(
        (t) => t.chain === chain && t.contractAddress.toLowerCase() === address.toLowerCase(),
      ) ?? null
    );
  },
  async searchTokens(q: TokenQuery): Promise<Token[]> {
    return tokens.filter(
      (t) =>
        (!q.chain || t.chain === q.chain) &&
        (!q.ticker || t.ticker.toLowerCase().includes(q.ticker.toLowerCase())) &&
        (!q.name || t.name.toLowerCase().includes(q.name.toLowerCase())) &&
        (!q.contractAddress || t.contractAddress.toLowerCase() === q.contractAddress.toLowerCase()),
    );
  },
  async getPriceSeries(tokenId, points): Promise<Candle[]> {
    const t = tokens.find((x) => x.id === tokenId);
    if (!t) return [];
    const step = 3_600_000;
    return t.sparkline.slice(-points).map((c, i, arr) => ({
      t: NOW - (arr.length - i) * step,
      o: c * 0.99,
      h: c * 1.02,
      l: c * 0.97,
      c,
      v: t.volume24hUsd / arr.length,
    }));
  },
};

export const mockXProvider: SocialProvider = {
  id: "mock_x",
  async fetchPosts(q: SocialQuery): Promise<RawPost[]> {
    const items =
      q.kind === "account"
        ? feed.filter((f) => f.callerId === q.value)
        : feed.filter((f) => f.text.toLowerCase().includes(q.value.toLowerCase()));
    return items.map((f) => ({
      id: f.id,
      authorId: f.callerId,
      text: f.text,
      postedAt: f.postedAt,
      url: `https://x.com/i/status/${f.id}`,
      kind: "original" as const,
      metrics: { replies: 12, reposts: 30, quotes: 6, likes: 210, views: 18_000 },
      raw: f,
    }));
  },
};

export const providerHealth: ProviderHealth[] = [
  { id: "mock_x", status: "ok", lastSyncAt: new Date(NOW).toISOString(), note: "Seeded mock — replace with X API adapter when credentials are configured" },
  { id: "mock_market", status: "ok", lastSyncAt: new Date(NOW).toISOString(), note: "Seeded mock — replace with DexScreener/Birdeye adapters" },
  { id: "x_api", status: "not_configured", lastSyncAt: null, note: "Set X_API_BEARER_TOKEN to enable" },
  { id: "dexscreener", status: "not_configured", lastSyncAt: null, note: "No key required — enable in Settings → Providers" },
  { id: "birdeye", status: "not_configured", lastSyncAt: null, note: "Set BIRDEYE_API_KEY to enable" },
  { id: "geckoterminal", status: "not_configured", lastSyncAt: null, note: "Set GECKOTERMINAL_API_KEY to enable" },
  { id: "coingecko", status: "not_configured", lastSyncAt: null, note: "Set COINGECKO_API_KEY to enable" },
];

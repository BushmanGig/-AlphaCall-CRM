import type { ChainId, Token } from "../types";

// Provider abstraction (PRD §2). The application depends only on these
// interfaces; adapters (DexScreener, Birdeye, GeckoTerminal, CoinGecko, GMGN,
// chain RPC, explorers) and the mock implementations are interchangeable.

export type ProviderId =
  | "dexscreener"
  | "birdeye"
  | "geckoterminal"
  | "coingecko"
  | "gmgn"
  | "chain_rpc"
  | "explorer"
  | "mock_market"
  | "x_api"
  | "mock_x";

export interface Candle {
  t: number; // unix ms
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface TokenQuery {
  chain?: ChainId;
  ticker?: string;
  name?: string;
  contractAddress?: string;
}

export interface MarketDataProvider {
  id: ProviderId;
  supports(chain: ChainId): boolean;
  getTokenByContract(chain: ChainId, address: string): Promise<Token | null>;
  searchTokens(q: TokenQuery): Promise<Token[]>;
  getPriceSeries(tokenId: string, points: number): Promise<Candle[]>;
}

export interface RawPost {
  id: string;
  authorId: string;
  text: string;
  postedAt: string;
  url: string;
  kind: "original" | "reply" | "quote" | "repost";
  metrics: { replies: number; reposts: number; quotes: number; likes: number; views: number };
  raw: unknown;
}

export interface SocialQuery {
  kind: "account" | "cashtag" | "keyword" | "contract" | "list";
  value: string;
  sinceId?: string;
}

export interface SocialProvider {
  id: ProviderId;
  fetchPosts(q: SocialQuery): Promise<RawPost[]>;
}

export interface ProviderHealth {
  id: ProviderId;
  status: "ok" | "rate_limited" | "error" | "circuit_open" | "not_configured";
  lastSyncAt: string | null;
  note: string;
}

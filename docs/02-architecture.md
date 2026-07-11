# AlphaCall CRM — System & API Architecture

## 1. High-level architecture

```
                ┌────────────────────────── Ingestion plane ──────────────────────────┐
 X API ────────►│ Social connectors (X now; Telegram/Discord/Reddit/Farcaster later)  │
 DexScreener ──►│ Market connectors (DexScreener, Birdeye, GeckoTerminal, CoinGecko,  │
 Birdeye ──────►│  GMGN*, chain RPC, explorers, holder/liquidity providers)           │
                └───────────────┬─────────────────────────────────────────────────────┘
                                │ idempotent writes (dedupe on provider ids)
                ┌───────────────▼───────────────┐
                │ Queue (BullMQ/Redis or SQS)   │  retry + dead-letter queues
                └───────────────┬───────────────┘
                ┌───────────────▼──────────────────────────────────────────────┐
                │ Processing plane                                             │
                │  1. Fast extraction (deterministic parser + small model)     │
                │  2. Token entity resolution (market APIs + rules)            │
                │  3. Call classification                                      │
                │  4. Risk & coordination analysis                             │
                │  5. Deep analysis (capable reasoning model, gated)           │
                │  6. Structured output → zod/JSON-schema validation           │
                │  7. Human review queue                                       │
                └───────────────┬──────────────────────────────────────────────┘
                ┌───────────────▼───────────────┐   ┌───────────────────────────┐
                │ PostgreSQL (+ Timescale/      │   │ Scoring workers           │
                │ pg_partman partitioning)      │◄──┤ Caller Alpha, Runner      │
                │ RLS per team                  │   │ Probability, Convergence  │
                └───────────────┬───────────────┘   └───────────────────────────┘
                ┌───────────────▼───────────────┐
                │ API layer (Next.js route      │  REST + SSE for live feed
                │ handlers / tRPC)              │  webhooks out for alerts
                └───────────────┬───────────────┘
                ┌───────────────▼───────────────┐
                │ Web app (Next.js App Router)  │  dark-first terminal UI
                └───────────────────────────────┘
```
\* GMGN only where its terms permit.

## 2. Provider abstraction

Every external dependency sits behind a typed interface with at least one real
adapter and one mock adapter. The application depends **only** on the
interface. Selection is config-driven per environment.

```ts
interface MarketDataProvider {
  id: ProviderId;
  supports(chain: ChainId): boolean;
  getTokenByContract(chain: ChainId, address: string): Promise<TokenSnapshot | null>;
  searchTokens(q: TokenQuery): Promise<TokenSearchResult[]>;
  getPriceSeries(tokenId: string, window: Window): Promise<Candle[]>;
  getPairs(tokenId: string): Promise<PairInfo[]>;
  getHolders?(tokenId: string): Promise<HolderStats>;   // optional capability
}

interface SocialProvider {
  id: ProviderId;
  streamRules(): Promise<StreamRule[]>;
  fetchPosts(q: SocialQuery, cursor?: string): Promise<Page<RawPost>>;
  fetchAccount(id: string): Promise<RawAccount>;
}
```

**Failover:** providers are registered with priority per capability per chain.
A circuit breaker demotes a provider after N consecutive failures; the sync
log (`provider_sync_logs`) records every attempt for observability.

**Mock mode (this repository’s default):** with no credentials configured, the
`MockXProvider` and `MockMarketProvider` serve a deterministic, seeded dataset
that exercises every UI state (organic vs. coordinated convergence, rugs,
untradeable spikes, deleted posts, low-confidence resolutions). Swapping in
real adapters requires zero UI changes.

## 3. Ingestion engine (X)

Monitored surfaces: token names, cashtags, contract addresses, launch-platform
and DexScreener/Pump.fun links, emerging meme phrases, chain slang, watched
caller accounts, replies to prominent meme accounts, quote-post networks, and
discussion-velocity anomalies. Image OCR for tickers is a gated capability
(only where legally and technically permitted).

Rules of the pipeline:

- **Idempotency:** post primary key = X post id; upserts are no-ops on replay.
- **Raw vs. normalised:** `x_posts.raw` (JSONB, immutable) is stored separately
  from analysis rows (`token_mentions`, `calls`); posts are never discarded.
- **Snapshots over mutation:** engagement metrics are appended to
  `post_metrics_snapshots`; author stats to `x_account_snapshots` — enabling
  historical reconstruction (e.g. follower count *at posting time*).
- **Deletion tracking:** periodic existence checks mark `deleted_at` without
  removing our analysis (compliant with X display rules: deleted content is
  no longer displayed, but the fact of deletion feeds behaviour metrics).

## 4. API surface (internal)

| Route | Method | Purpose |
|---|---|---|
| `/api/feed` | GET (SSE) | Live intelligence feed with filter params |
| `/api/tokens` `/api/tokens/[chain]/[address]` | GET | Explorer + token intelligence |
| `/api/callers` `/api/callers/[id]` | GET | CRM list + profile |
| `/api/callers/[id]/notes|tags|status` | POST/PATCH | CRM mutations (audited) |
| `/api/leaderboards/[board]` | GET | Board with thresholds + CIs |
| `/api/convergence` | GET | Convergence events |
| `/api/narratives` | GET | Clusters + lifecycle |
| `/api/alerts` | GET/POST/PATCH | Rules + event log |
| `/api/search` | GET | Command-bar search + NL→filter compilation |
| `/api/admin/reviews` | GET/POST | Manual review queue + corrections |

All mutations write `audit_logs`. Team scoping enforced by Postgres RLS using
`current_setting('app.team_id')`.

## 5. Security & reliability

- Auth: session-based (Auth.js) with optional SSO later; API keys hashed+encrypted (KMS envelope) in `users`/`teams` settings.
- RLS on every team-scoped table; service role only for ingestion workers.
- Rate limits respected per provider; token-bucket client with jitter; 429 → backoff, not retry storm.
- Queues: at-least-once with idempotent consumers; DLQ with replay tooling.
- Backups: PITR (WAL archiving) + nightly logical dumps; restore runbook tested quarterly.
- Monitoring: OpenTelemetry traces, per-provider sync dashboards, alerting on ingestion lag and score staleness.
- Data retention: configurable per data class; X content honoured per API terms (compliance job removes display copies of deleted/withheld content).

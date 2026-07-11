# AlphaCall CRM — Implementation Plan, Testing, Risk Register, Costs

## 1. Milestones (this repository)

| M | Deliverable | Acceptance criteria |
|---|---|---|
| M1 | Docs + PostgreSQL schema | All 15 required build outputs present; schema covers all 32 required tables with FKs, indexes, RLS, partitioning |
| M2 | Domain layer | Typed provider interfaces + mock adapters; seeded dataset; Caller Alpha, Runner Probability, convergence engines; zod AI schema; unit tests pass |
| M3 | UI shell + Command Centre + Live Feed | Dark-first layout, 12-section nav, ⌘K command bar, market pulse, runners table, feed with filters |
| M4 | CRM + profiles + leaderboards + token pages | Caller list/profile with decomposed score, call history; 20 leaderboards with sample sizes; token intelligence page |
| M5 | Convergence, narratives, alerts, investigations, reports, settings | Every nav destination functional on mock data; no fake buttons (unbuilt = explicitly badged) |
| M6 | Build green + tests + push | `npm run build`, `npm test`, `tsc --noEmit` all pass |

## 2. Phase roadmap (product)

- **Phase 1 (MVP):** auth, X account monitoring, post ingestion, token extraction, contract resolution, DexScreener integration, basic caller CRM, call timestamping, historical price tracking, leaderboards, live feed, basic alerts.
- **Phase 2:** Runner Probability Score, Caller Alpha Score, convergence detection, narrative clustering, token intelligence page, advanced filters, Telegram/Discord alerts.
- **Phase 3:** wallet analysis, coordination graphs, liquidity-adjusted returns, deleted-post monitoring, advanced risk engine, team collaboration, natural-language search.
- **Phase 4:** additional social platforms, mobile app, custom scoring models, public API, backtesting, enterprise workspaces.

## 3. Testing strategy

- **Unit:** scoring engines (property-based: score monotonicity, 0–100 bounds, penalty floors), AI schema validation (valid/invalid fixtures), token resolver priority order, Bayesian shrinkage maths.
- **Integration:** provider adapters against recorded fixtures (VCR-style); ingestion idempotency (replay a batch twice ⇒ identical DB state); RLS (team A cannot read team B).
- **E2E (Playwright):** command-bar search, feed filtering, CRM mutations, alert creation, profile rendering.
- **Data quality:** golden set of 500 hand-labelled posts; classification precision/recall tracked per model version; resolver accuracy on contract-explicit vs. inferred posts.
- **Honesty checks:** CI test that every score component sums to the displayed total; every leaderboard row renders a sample size.

## 4. Risk register

| Risk | L | I | Mitigation |
|---|---|---|---|
| X API pricing/policy changes | H | H | Provider abstraction; budget alerts; degrade to watched-accounts-only mode |
| Market-data gaps for new launches | H | M | Multi-provider failover; abstain + backfill rather than fabricate |
| Misclassification harms a real account | M | H | Calibrated language, no AI-only scam labels, human review, audit trail, appeal path |
| Untradeable-spike credit inflates scores | M | H | Realistic multiple mandatory; headline never used alone in rankings |
| Small-sample leaderboard gaming | H | M | Minimum thresholds + Bayesian shrinkage + visible CIs |
| Coordinated actors gaming convergence | M | H | Independence weighting; sponsored-campaign classification; wallet/link graphs |
| LLM cost blowout | M | M | Staged pipeline; deep model gated to <5% of posts; per-stage cost metering |
| Legal: storing deleted X content | M | H | Compliance job; store deletion fact + our analysis, stop displaying content |
| DB growth (posts, snapshots) | H | M | Time-series partitioning, tiered storage, retention controls |

## 5. Cost estimates (steady-state MVP, monthly, USD)

| Item | Est. |
|---|---|
| X API (Pro tier) | $5,000 |
| Market data (Birdeye/CoinGecko paid tiers) | $500–1,500 |
| LLM inference (staged; ~2M posts/mo, deep on ~4%) | $800–2,500 |
| Postgres (managed, partitioned, ~1TB) | $400–900 |
| Redis + queue workers + web hosting | $300–700 |
| Monitoring/logging | $150 |
| **Total** | **≈ $7k–11k / month** |

Dev-mode (this repo, mock providers): $0 external spend.

## 6. MVP vs later separation

Everything in this repository is Phase-1/2 scope on mock providers: the full
UI, scoring engines, schema, and CRM. Real X/DexScreener adapters, queues,
auth hardening, Telegram/Discord delivery, wallet graphs and backtesting are
Phase 2–4 and slot in behind the existing interfaces without UI changes.

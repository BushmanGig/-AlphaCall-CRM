# AlphaCall CRM

AI-powered X/Twitter intelligence, meme-coin discovery and caller-performance
platform. It scans public X posts for emerging meme-coin discussion, resolves
tokens to verified contract addresses, classifies which posts are measurable
*calls*, attributes performance from the exact call timestamp (headline **and**
liquidity-adjusted multiples), and maintains a permanent CRM-style record of
the accounts making those calls.

> **Research and analytics only.** Nothing in this product promises returns or
> describes any token as guaranteed to rise, and no account is labelled a
> scammer on AI inference alone.

## The five questions it answers

1. Which meme coins are beginning to gain credible attention?
2. Which posts may be early high-upside signals rather than late engagement farming?
3. Which X accounts repeatedly identified coins before 10x–200x+ moves?
4. Are multiple historically successful callers converging on the same token?
5. What risks, manipulation indicators or contradictory signals are present?

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # scoring + AI-schema unit tests (vitest)
npm run build      # production build
```

No credentials are required: with no provider keys configured the app serves a
deterministic seeded dataset through the same typed provider interfaces the
real adapters implement (`src/lib/providers/`). Every UI state is exercised —
organic vs coordinated convergence, rugs, untradeable candle spikes, sponsored
campaigns, deleted posts and insufficient-history callers. Swapping in real
X / DexScreener / Birdeye adapters requires no UI changes.

## What's here

| Area | Location |
|---|---|
| Product requirements, personas, journeys, IA | `docs/01-product-requirements.md` |
| System & API architecture, provider abstraction | `docs/02-architecture.md` |
| Scoring methodology (Caller Alpha, Runner Probability, convergence) | `docs/03-scoring-methodology.md` |
| AI pipeline (7 stages, strict JSON schema, human review) | `docs/04-ai-pipeline.md` |
| Design system & wireframes | `docs/05-design-system-wireframes.md` |
| Implementation plan, testing strategy, risk register, costs | `docs/06-implementation-plan.md` |
| PostgreSQL schema (32+ tables, RLS, partitioning) | `db/schema.sql` |
| Scoring engines (pure, unit-tested) | `src/lib/scoring/` |
| Required AI output schema (zod-validated) | `src/lib/ai/schema.ts` |
| Provider interfaces + mock adapters | `src/lib/providers/` |
| Seeded dataset + derived views | `src/lib/data/` |
| UI — 12 sections + caller/token detail pages | `src/app/` |

## Product surface

Command Centre · Live Feed · Emerging Tokens · Convergence · Caller CRM (+
profile with full score decomposition and audit trail) · Leaderboards (20
boards, Bayesian-adjusted, sample sizes always shown) · Narratives · Token
Explorer (+ token intelligence page) · Alerts (every alert states *why*) ·
Investigations · Reports · Settings. Global ⌘K command bar with
natural-language queries that compile to transparent filters.

## Honesty principles baked in

- Token identity is `(chain, contract address)` — never ticker alone.
- No score is displayed without its components and sample size.
- Headline multiples are never used alone: the liquidity-adjusted *realistic
  multiple* discounts slippage, honeypots, transfer taxes and one-candle spikes.
- Small samples are Bayesian-shrunk; profiles under 10 calls are capped at
  Watchlist tier with visible confidence intervals.
- Convergence strength weights caller independence — three independent calls
  outrank ten coordinated posts.
- Risk language is calibrated: "elevated risk indicators", "possible
  coordination", "requires manual review".
- Unbuilt surfaces are explicitly badged ("Ships in Phase 3"), never faked.

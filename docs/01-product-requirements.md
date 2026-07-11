# AlphaCall CRM — Product Requirements Document

**Version:** 0.1 (MVP) · **Status:** Approved for build · **Last updated:** 2026-07-11

## 1. Product summary

AlphaCall CRM is an AI-powered X/Twitter intelligence, meme-coin discovery and
caller-performance platform. It continuously scans relevant public X posts for
emerging meme-coin discussion, resolves tokens to verified contract addresses,
classifies whether a post is a measurable *call*, attributes performance to the
exact call timestamp, and maintains a permanent CRM-style record of the
accounts making those calls.

It is **not** a social-listening dashboard and does not simply count mentions.

### The five core questions the product answers

1. Which meme coins are beginning to gain credible attention?
2. Which posts may represent an early high-upside signal rather than late engagement farming?
3. Which X accounts have repeatedly identified coins before 10x, 20x, 100x, 200x or larger moves?
4. Are multiple historically successful callers converging on the same token?
5. What risks, manipulation indicators or contradictory signals are present?

### Compliance stance

The product provides **research and analytics only**. It never promises
returns, never describes a token as guaranteed to rise, and never labels an
account a scammer based solely on AI inference — it uses calibrated language
("elevated risk indicators", "possible coordination", "requires manual
review"). All ingestion respects X API display and storage rules; no scraping
of protected data.

## 2. Target networks

| Chain | Status | Notes |
|---|---|---|
| Solana | MVP | Primary meme-coin venue; Pump.fun launches |
| Ethereum | MVP | Larger caps, deeper liquidity |
| Base | MVP | Fast-growing retail venue |
| Robinhood Chain | Deferred | Enabled when a reliable indexer + market data exist |

Chains are configuration rows, not code branches: every token is identified by
`(chain, contract_address)` — **never by ticker alone** — so adding an EVM or
non-EVM chain is a registry entry plus a provider adapter.

## 3. User personas

### P1 — "Independent Alpha Hunter" (primary)
Solo trader, 2–6 hours/day on X, currently keeps caller notes in spreadsheets
and Telegram saved messages. Wants: to know *which* callers are actually good
(not just loud), to be alerted when proven callers converge, and to avoid
paid-promotion traps. Success = one avoided rug or one early entry per month.

### P2 — "Quant Desk Analyst"
Works at a small crypto fund. Needs auditable data: exact call timestamps,
liquidity-adjusted multiples (not candle-spike headlines), exportable cohorts,
and confidence intervals on small samples. Success = defensible research memos.

### P3 — "Community Intelligence Lead"
Runs a paid research group. Manages a roster of watched callers as CRM
contacts: statuses, tags, notes, assignments to moderators, reminders. Success
= faster triage of new callers and documented investigations.

### P4 — "Platform Administrator" (internal)
Corrects token resolution, call classification and sponsorship labels; manages
provider keys, retention, and audit logs. Success = correction loop feeding
back into classifier quality.

## 4. User journeys

### J1 — Morning triage (P1)
1. Opens **Command Centre** → market pulse shows mention velocity, fastest-growing chain/narrative, convergence count.
2. Scans **Emerging Runners** table ranked by Runner Probability Score; hovers score → tooltip explains components.
3. Clicks a token → **Token Intelligence** page: caller posts overlaid on price, AI thesis, contradictory evidence, risk analysis.
4. Creates an alert: "notify if 3+ proven callers converge or liquidity drops 30%".

### J2 — Vetting a new caller (P3)
1. Sees an unfamiliar account in **Live Feed** with a bullish call.
2. Opens **Caller Profile**: tier, Caller Alpha Score with every component displayed, hit rates by multiple band, deleted-post ratio, sponsorship probability.
3. Sample size is 4 calls → score shows wide confidence interval and "Watchlist — insufficient history" framing.
4. Adds caller to CRM with status "Under review", tag "Solana / new launches", assigns to a moderator, sets a 14-day reminder.

### J3 — Convergence event (P1/P2)
1. Alert fires: "3 independent A-tier callers mentioned $TOKEN within 40 minutes; market cap at first call $180k; classified **Organic convergence** (wording dissimilar, no shared groups, no paid markers)."
2. User opens **Convergence** page → timeline of the three posts, independence evidence, market state at each call.
3. User opens token page → checks risk deductions (holder concentration, freeze authority) before acting.

### J4 — Investigating a suspected promoter (P2/P4)
1. Leaderboard "Highest-risk promoters" surfaces an account with 78% late-call ratio and 31% deleted losing posts.
2. Analyst opens an **Investigation**, attaches posts, wallet links, and copy-paste cluster evidence.
3. Admin reviews → sets caller status "Possible promoter" with audit-log entry. Language stays calibrated: "elevated risk indicators".

### J5 — Admin correction loop (P4)
1. Manual review queue shows a low-confidence token resolution (cashtag collision across two chains).
2. Admin picks the correct contract; correction is stored in `manual_reviews` and used as labelled data for the resolver.

## 5. Information architecture

```
AlphaCall CRM
├── 1. Command Centre        — market pulse, emerging runners, proven-caller activity, narrative heat map, alert timeline
├── 2. Live Feed             — real-time filterable post intelligence feed
├── 3. Emerging Tokens       — ranked discovery table (Runner Probability Score)
├── 4. Convergence           — convergence events + classification evidence
├── 5. Caller CRM            — contact list, statuses, tags, notes, lists, cohorts
│   └── Caller Profile       — scorecard, call history, audit trail
├── 6. Leaderboards          — 20 boards, Bayesian-adjusted, sample sizes shown
├── 7. Narratives            — clusters, lifecycle stages, heat map
├── 8. Token Explorer        — search/browse all resolved tokens
│   └── Token Intelligence   — price+social charts, AI thesis, risk, caller breakdown
├── 9. Alerts                — rules, destinations, event log with "why"
├── 10. Investigations       — case files linking callers, tokens, posts, wallets
├── 11. Reports              — exports, cohort comparisons, weekly digests
└── 12. Settings             — profile, team, API keys, providers, retention, appearance
```

A global **command bar** (⌘K) searches usernames, tickers, contracts, wallets,
narratives, chains, lists and notes, and accepts natural-language queries that
compile to transparent, inspectable filters.

## 6. Functional requirements (condensed)

| ID | Requirement | Phase |
|---|---|---|
| FR-1 | Ingest X posts from watched accounts, keywords, cashtags, contract searches; store raw + normalised separately; never discard posts | 1 |
| FR-2 | Resolve tokens to (chain, contract) with confidence levels; refuse low-confidence matches; admin correction | 1 |
| FR-3 | Classify posts into 15 call categories; only measurable calls feed performance | 1 |
| FR-4 | Attribute performance from exact post timestamp across 5m→30d windows; headline vs realistic (liquidity-adjusted) multiple | 1 |
| FR-5 | Permanent caller profiles: identity, performance, behaviour metrics | 1 |
| FR-6 | Caller Alpha Score 0–100, fully decomposed, tiered S→High Risk | 2 |
| FR-7 | Runner Probability Score 0–100 with component breakdown + explanation | 2 |
| FR-8 | Convergence detection with independence analysis and 5-way classification | 2 |
| FR-9 | Narrative detection incl. novel narratives; 7-stage lifecycle | 2 |
| FR-10 | Alert rules (15 trigger types) with 6 destinations; every alert states why | 1 (in-app) / 2 (external) |
| FR-11 | CRM: follow, lists, notes, tags, assignment, status, reminders, export, cohorts | 1 |
| FR-12 | Leaderboards with minimum-call thresholds and Bayesian shrinkage | 1 |
| FR-13 | Anti-manipulation detection (copy-paste clusters, bot swarms, wash trading, deleted losing calls, untradeable peaks) | 2–3 |
| FR-14 | Strict-JSON AI outputs validated against schema before persistence | 1 |
| FR-15 | Audit logs, RLS, team permissions, provider failover, idempotent ingestion | 1–3 |

## 7. Non-functional requirements

- **Latency:** feed post visible < 10 s after ingestion; score recompute < 60 s after new market snapshot.
- **Durability:** raw posts immutable and retained (subject to X API retention rules and user deletion compliance).
- **Explainability:** no score is ever shown without its components and sample size.
- **Extensibility:** provider abstraction — any market-data or social source replaceable without app changes.
- **Honesty in UI:** no fake buttons; unimplemented surfaces are explicitly badged (e.g. "Mock data", "Coming in Phase 3").

## 8. Out of scope (MVP)

Trading execution, portfolio tracking, financial advice, private/protected
data, automated buying, non-X social sources (Phase 4), mobile app (Phase 4).

## 9. Success metrics

- Precision of "measurable call" classification ≥ 90% on the human-reviewed sample.
- Token resolution accuracy ≥ 97% where a contract address is explicit; ≥ 85% overall with abstention allowed.
- Median alert lead time vs. token's first 5x candle: positive (alert precedes move) for ≥ 40% of 70+ scored tokens.
- ≤ 2% of scored tokens later flagged "untradeable peak credited" in audits.

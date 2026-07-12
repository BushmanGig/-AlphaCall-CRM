# AlphaCall CRM — Design System & Wireframes

## Design principles

Dark-first, optional light mode. High information density without clutter.
Large readable numbers, clear hierarchy, keyboard-fast (⌘K everywhere),
mobile-responsive, accessible contrast (WCAG AA on all text), minimal
decorative animation, skeleton loading, real-time status dots, tooltips on
every proprietary metric.

## Colour semantics

Strong colour is reserved for *meaningful status change* — not every positive
number is green, not every negative red.

| Token | Dark value | Meaning |
|---|---|---|
| `--bg` | `#0B0E14` | app background |
| `--surface` | `#11151F` | cards |
| `--surface-2` | `#171C29` | raised / hover |
| `--border` | `#232A3B` | hairlines |
| `--text` | `#E6EAF2` | primary text |
| `--text-dim` | `#8A93A6` | secondary text |
| `--accent` | `#5B8CFF` | interactive, links, selection |
| `--signal` | `#3DDC97` | *state change to positive* (new strong signal, confirmed) |
| `--warn` | `#F5B944` | caution, developing risk |
| `--danger` | `#F4585D` | *state change to negative* (rug, halt, high risk) |
| `--neutral-up` | `#B9C4DA` | routine positive deltas (price up) — not green |
| `--neutral-down` | `#7E8AA3` | routine negative deltas |

Tier colours: S `#C9A227` (gold) · A `#5B8CFF` · B `#3DAEDC` · C `#8A93A6` ·
Watchlist `#F5B944` · High Risk `#F4585D`.

Typography: Inter (UI), JetBrains Mono (numerals, contracts, tables). Numeric
tables use tabular figures.

## Component inventory

ScoreBadge (value + breakdown tooltip) · TierChip · RiskFlagPill (calibrated
language) · SparkLine · DeltaCell (neutral colours) · SampleSizeTag ·
ConfidenceBar · StatusDot (live/stale) · PostCard · DataTable (sortable,
keyboard nav) · CommandBar · SkeletonRow · EmptyState · MockDataBanner.

## Wireframes (core screens)

### 1. Command Centre
```
┌ Sidebar ┬──────────────────────────────────────────────────────────────┐
│ 12 nav  │ MARKET PULSE  [mentions] [velocity] [top chain] [top narr.]  │
│ items   │               [strong signals] [high-risk launches] [conv.]  │
│         ├──────────────────────────────────────────────────────────────┤
│         │ EMERGING RUNNERS (ranked table)                              │
│         │ token│chain│price│mcap│liq│Δ5m│Δ1h│Δ24h│soc.vel│callers│RPS│risk│first seen │
│         ├───────────────────────────────┬──────────────────────────────┤
│         │ PROVEN CALLER ACTIVITY (live) │ NARRATIVE HEAT MAP           │
│         ├───────────────────────────────┴──────────────────────────────┤
│         │ ALERT TIMELINE — each entry states WHY it fired              │
└─────────┴──────────────────────────────────────────────────────────────┘
```

### 2. Live Feed
Left rail: 17 filters (chain, token, caller tier, call category, mcap band,
liquidity, RPS, risk, language, narrative, original-only, contract-included,
proven-only, organic convergence, sponsored probability, account age,
follower range). Main: PostCard stream — author + Caller Alpha, original
text, resolved token, price/mcap at post time, performance since, max
performance, classification, AI explanation, risk flags, actions
(Add to CRM · Investigate · Create alert · Open on X).

### 3. Caller Profile
Header: avatar, @handle, TierChip, Alpha Score with component popover,
followers, account age, chains, narratives, risk status, Follow, Add-to-list.
Performance area: return chart, cumulative hypothetical curve, hit-rate
chart, calls by mcap band / chain / narrative / month, entry-timing
distribution, drawdown distribution, liquidity-adjusted results.
Call history table: date, token, chain, original post, mcap@call, liq@call,
max multiple, realistic multiple, current, time to peak, classification,
deleted?, sponsored prob, risk outcome. Full audit trail below.

### 4. Token Intelligence
Header: name/ticker/contract (copy), chain, verified links, price, mcap, FDV,
liquidity, volume, holders, age, Risk score, RPS. Charts: price+volume,
social-mentions-vs-price overlay, caller posts pinned on price chart, holder
growth, liquidity, buys/sells, top-holder concentration, caller-quality
timeline. Sections: AI thesis, bullish evidence, contradictory evidence, risk
analysis, caller breakdown, narrative origin, social graph, related tokens,
contract security, developer history, wallet activity, deleted promo posts.

### 5. Convergence
Event cards: classification badge (organic / possible coordinated / confirmed
sponsored / copy cascade / uncertain), caller timeline with spacing,
independence evidence, wording-similarity meter, market state at first call.

### 6. Leaderboards
Board switcher (20 boards) → table with rank, caller, score, CI, sample size
(always), qualifying threshold note.

### 7–12
Narratives (lifecycle stage board + heat map) · Token Explorer (filterable
table) · Alerts (rules builder + event log with why/evidence/confidence) ·
Investigations (case files) · Reports (exports, cohort compare, digests) ·
Settings (profile, team, providers & API keys, retention, appearance).

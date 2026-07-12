# AlphaCall CRM — Scoring Methodology

Every score in the product is decomposed, sampled-sized, and explained. No
mysterious numbers.

## 1. Call detection

A post is a **measurable call** only when the author demonstrates an
identifiable positive thesis, expectation or recommendation. Categories:

`explicit_bullish_call · implied_bullish_call · watchlist_mention ·
neutral_discussion · news_reporting · technical_analysis ·
narrative_commentary · bearish_warning · scam_warning · paid_promotion ·
giveaway_engagement_farming · joke_sarcasm · repost_no_conviction ·
exit_profit_taking · unclear`

Only the first two are measurable calls. A post repeating an already-trending
token is not an *original* call — it may still be measurable but receives a
low originality and timing score.

Stored per call: call type, conviction, originality, timing, evidence
strength, contract supplied?, entry price/mcap supplied?, edited/deleted?,
sponsored appearance, ownership disclosure, AI explanation, confidence.

## 2. Performance attribution

Measured from the **exact post timestamp**. Windows: 5m, 15m, 1h, 6h, 24h,
3d, 7d, 30d, plus max-after-call, max-drawdown, time-to-peak. Evaluation
snapshots: 24h / 7d / 30d / all-time.

**Headline multiple** = peak price after call ÷ price at call.

**Realistic multiple** = liquidity-adjusted estimate:

```
realistic = headline
          × liquidity_factor(pool_depth, assumed_trade_size)   // slippage in+out
          × tradability_factor(honeypot, transfer_tax, halts)  // 0 if unsellable
          × persistence_factor(time_above_level, volume_at_peak) // discounts 1-candle spikes
```

A caller is **never** credited the full value of an untradeable candle spike.
Rugged / halted / migrated-away tokens resolve to their realistic exit value
(usually ≈ 0 for rugs after the event).

## 3. Caller Alpha Score (0–100)

| Component | Weight |
|---|---|
| Historical return quality (realistic, log-scaled) | 20% |
| Hit-rate consistency (2x/5x/10x bands, variance-penalised) | 15% |
| Early timing (mcap percentile at call, pre-pump share) | 15% |
| Liquidity-adjusted performance (realistic ÷ headline honesty) | 10% |
| Originality (original-call ratio) | 10% |
| Risk-adjusted performance (drawdown- and rug-adjusted) | 10% |
| Recent performance (90-day, decayed) | 8% |
| Thesis quality (evidence strength avg) | 5% |
| Transparency & disclosure | 4% |
| Account authenticity (bot/purchased-follower inverse) | 3% |

**Penalties** (subtracted after the weighted sum, floored at 0): deleted
losing calls, calling already-pumped tokens, excessive simultaneous calls,
undisclosed ads, contract ambiguity, coordinated engagement, suspicious wallet
relationships, rug involvement, low-liquidity manipulation, fake screenshots,
retroactive entry-price edits, unverifiable claimed wins.

**Small samples:** components computed on rates use Bayesian shrinkage toward
the population prior: `adj = (hits + k·prior) / (n + k)` with k = 10.
Profiles under 10 measurable calls are capped at Watchlist tier and display
"insufficient history" with a 95% Wilson interval.

**Tiers:** S 90–100 · A 80–89 · B 70–79 · C 55–69 · Watchlist 40–54 ·
High Risk < 40. A single high return cannot produce S tier — consistency,
liquidity, timing and transparency gate it.

## 4. Runner Probability Score (0–100)

A research ranking, not a prediction. Components:

| Group | Weight | Inputs |
|---|---|---|
| Social acceleration | 25% | mention growth 5/15/30/60m, unique authors, engagement & quote velocity, reply-network growth, language spread, small→influential migration |
| Caller quality | 20% | # proven callers, avg Caller Alpha, independent early callers, same-narrative history, coordination inverse |
| Timing | 15% | mcap at first credible mention, time since launch, pre-signal price move, social-leads-price, pre-first-candle discussion share |
| Narrative strength | 15% | originality, cultural/current-event/chain relevance, visual potential, simplicity, emotional response, durability |
| Market quality | 15% | liquidity, volume, buy/sell ratio, unique buyers, holder growth, concentration, smart wallets, pool stability |
| Risk deductions | −up to 100 | concentration, bundled supply, dev selling, mutable controls, honeypot, freeze authority, wash trading, sybil/bot discussion, paid clusters, impersonation, contract changes, scam deployer |

Bands: 85–100 exceptional emerging signal · 70–84 strong watch · 55–69
developing · 40–54 speculative · <40 weak or high risk.

Every score ships with: why high/low, positive signals, negative signals,
missing information, confidence, data freshness, suggested monitoring
conditions.

## 5. Convergence classification

Inputs: caller count, avg Caller Alpha, historical independence (co-posting
matrix), time spacing, wording similarity (shingled Jaccard), shared TG/DC
groups, shared wallets, copied-post detection, paid-promo markers, mcap at
first call, pre-convergence price move, liquidity.

Classes: `organic · possible_coordinated_campaign ·
confirmed_sponsored_campaign · copy_trading_cascade · uncertain`.

Weighting rule: **3 genuinely independent A-tier calls > 10 coordinated
posts.** Convergence strength = Σ(caller alpha × independence weight), not
raw count.

## 6. Leaderboards

20 boards (all-time, weekly, monthly, early-stage, 10x/100x/1000x, per-chain,
consistency, realistic return, low-mcap, narrative identifiers, most improved,
most transparent, highest-risk promoters, most deleted losing posts, most
frequently late). All boards enforce minimum-call thresholds, use the
Bayesian-adjusted rates from §3, and display sample size beside every score.

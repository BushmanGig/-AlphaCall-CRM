# AlphaCall CRM — AI Analysis Pipeline

## Stages

| # | Stage | Model / mechanism | Gate |
|---|---|---|---|
| 1 | Fast extraction | Deterministic parsers (regex/grammar for contracts, cashtags, URLs, launch links) + a fast, inexpensive model (e.g. claude-haiku-4-5) for call language, sentiment, narrative terms | every post |
| 2 | Entity resolution | Rules + market-data APIs (no LLM authority over contracts) | posts with token candidates |
| 3 | Classification | Fast model, strict JSON, few-shot from human corrections | posts with resolved or plausible tokens |
| 4 | Risk & coordination | Deterministic features (shingled similarity, posting-time clusters, shared links/wallets) + model synthesis | measurable calls + flagged posts |
| 5 | Deep analysis | Capable reasoning model (e.g. claude-sonnet-5) | only high-value or ambiguous signals: proven-caller posts, convergence candidates, conflicting classifications, confidence < 0.6 |
| 6 | Structured output | zod validation of the required schema; invalid ⇒ retry once with error feedback, then human review queue. Never persist important decisions as free-form text only | every AI result |
| 7 | Human review | Admin UI corrects token resolution, call class, sponsorship, scam class, relationships, score components. Corrections stored in `manual_reviews` and exported as labelled data for prompt/few-shot updates | sampled + flagged |

## Resolution priority (stage 2)

1. Explicit contract address
2. Direct launch / DEX link
3. Token name + chain
4. Cashtag + account context (caller’s historical chains/narratives)
5. Image-derived token information (gated capability)
6. Narrative-only inference (lowest, usually abstains)

The resolver compares post timestamp with token launch/pair-creation
timestamps, detects migrations and copycat contracts, stores a confidence per
match, and **refuses to assign** below the confidence floor (0.55) — abstention
routes to human review rather than guessing.

## Required output schema (persisted, validated)

```json
{
  "post_id": "",
  "author_id": "",
  "token_candidates": [
    { "chain": "", "contract_address": "", "ticker": "", "token_name": "", "resolution_confidence": 0 }
  ],
  "post_category": "",
  "is_measurable_call": false,
  "call_direction": "bullish|bearish|neutral|unclear",
  "conviction_score": 0,
  "originality_score": 0,
  "timing_score": 0,
  "sponsorship_probability": 0,
  "coordination_probability": 0,
  "bot_probability": 0,
  "narratives": [],
  "risk_flags": [],
  "key_claims": [],
  "reasoning_summary": "",
  "confidence_score": 0,
  "requires_human_review": false
}
```

Implemented as a zod schema in `src/lib/ai/schema.ts`; every output is parsed
before saving. Validation failures are counted per model version.

## Anti-manipulation detectors (stage 4 features)

copy-paste campaigns (shingled Jaccard > 0.8 across ≥3 authors) · engagement
rings (reciprocal-engagement graph density) · bot swarms (account age +
posting cadence + follower authenticity) · paid influencers (disclosure
markers, historical sponsored ratio) · artificial trending · wash trading
(self-crossing wallets) · deployer-linked promo accounts · coordinated wallet
funding · fake contract addresses · impersonation (display-name collision +
account age) · purchased followers · deleted losing calls · cherry-picked
winners · reposted historical calls · post-move claims · screenshot-only
claims · untradeable peak prices.

**Language policy:** model outputs about misconduct must use calibrated
phrases — "elevated risk indicators", "possible coordination", "potential paid
promotion", "insufficient evidence", "requires manual review". The UI never
renders an AI-only "scammer" label.

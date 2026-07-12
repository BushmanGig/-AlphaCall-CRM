import { describe, expect, it } from "vitest";
import { validatePostAnalysis } from "../ai/schema";

const valid = {
  post_id: "190001",
  author_id: "u1",
  token_candidates: [
    { chain: "solana", contract_address: "Capy…Gh4", ticker: "CAPY", token_name: "Atlas the Capybara", resolution_confidence: 0.92 },
  ],
  post_category: "explicit_bullish_call",
  is_measurable_call: true,
  call_direction: "bullish",
  conviction_score: 88,
  originality_score: 95,
  timing_score: 94,
  sponsorship_probability: 0.03,
  coordination_probability: 0.05,
  bot_probability: 0.02,
  narratives: ["animals"],
  risk_flags: [],
  key_claims: ["accumulating", "community strength"],
  reasoning_summary: "Original thesis with contract supplied at low market cap.",
  confidence_score: 0.9,
  requires_human_review: false,
};

describe("AI output schema validation", () => {
  it("accepts a valid analysis", () => {
    const r = validatePostAnalysis(valid);
    expect(r.ok).toBe(true);
    expect(r.data?.post_id).toBe("190001");
  });

  it("rejects out-of-range scores", () => {
    const r = validatePostAnalysis({ ...valid, conviction_score: 140 });
    expect(r.ok).toBe(false);
    expect(r.errors?.some((e) => e.includes("conviction_score"))).toBe(true);
  });

  it("rejects a measurable call without a bullish direction", () => {
    const r = validatePostAnalysis({ ...valid, call_direction: "neutral" });
    expect(r.ok).toBe(false);
    expect(r.errors?.some((e) => e.includes("call_direction"))).toBe(true);
  });

  it("rejects a measurable call whose token resolution is below the confidence floor", () => {
    const r = validatePostAnalysis({
      ...valid,
      token_candidates: [{ ...valid.token_candidates[0], resolution_confidence: 0.3 }],
    });
    expect(r.ok).toBe(false);
    expect(r.errors?.some((e) => e.includes("token_candidates"))).toBe(true);
  });

  it("rejects unknown categories and extra keys (strict schema)", () => {
    expect(validatePostAnalysis({ ...valid, post_category: "moon_call" }).ok).toBe(false);
    expect(validatePostAnalysis({ ...valid, extra_field: 1 }).ok).toBe(false);
  });

  it("rejects a non-call cleanly (unclear + not measurable is fine)", () => {
    const r = validatePostAnalysis({
      ...valid,
      post_category: "joke_sarcasm",
      is_measurable_call: false,
      call_direction: "unclear",
      token_candidates: [],
    });
    expect(r.ok).toBe(true);
  });
});

import { z } from "zod";

// Required AI output schema (PRD §20). Every analysed post must validate
// against this before persistence — important AI decisions are never stored
// solely as free-form text.

export const TokenCandidateSchema = z.object({
  chain: z.string(),
  contract_address: z.string(),
  ticker: z.string(),
  token_name: z.string(),
  resolution_confidence: z.number().min(0).max(1),
});

export const PostCategorySchema = z.enum([
  "explicit_bullish_call",
  "implied_bullish_call",
  "watchlist_mention",
  "neutral_discussion",
  "news_reporting",
  "technical_analysis",
  "narrative_commentary",
  "bearish_warning",
  "scam_warning",
  "paid_promotion",
  "giveaway_engagement_farming",
  "joke_sarcasm",
  "repost_no_conviction",
  "exit_profit_taking",
  "unclear",
]);

export const PostAnalysisSchema = z
  .object({
    post_id: z.string().min(1),
    author_id: z.string().min(1),
    token_candidates: z.array(TokenCandidateSchema),
    post_category: PostCategorySchema,
    is_measurable_call: z.boolean(),
    call_direction: z.enum(["bullish", "bearish", "neutral", "unclear"]),
    conviction_score: z.number().min(0).max(100),
    originality_score: z.number().min(0).max(100),
    timing_score: z.number().min(0).max(100),
    sponsorship_probability: z.number().min(0).max(1),
    coordination_probability: z.number().min(0).max(1),
    bot_probability: z.number().min(0).max(1),
    narratives: z.array(z.string()),
    risk_flags: z.array(z.string()),
    key_claims: z.array(z.string()),
    reasoning_summary: z.string(),
    confidence_score: z.number().min(0).max(1),
    requires_human_review: z.boolean(),
  })
  .strict()
  .superRefine((v, ctx) => {
    // A measurable call requires a bullish direction and at least one token
    // candidate above the resolution floor.
    if (v.is_measurable_call) {
      if (v.call_direction !== "bullish") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "is_measurable_call requires call_direction 'bullish'",
          path: ["call_direction"],
        });
      }
      if (!v.token_candidates.some((t) => t.resolution_confidence >= 0.55)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "is_measurable_call requires a token candidate with resolution_confidence >= 0.55",
          path: ["token_candidates"],
        });
      }
    }
  });

export type PostAnalysis = z.infer<typeof PostAnalysisSchema>;

export interface ValidationResult {
  ok: boolean;
  data?: PostAnalysis;
  errors?: string[];
}

/** Validate a raw AI output before saving. Invalid outputs are routed to the
 * manual review queue instead of being persisted. */
export function validatePostAnalysis(raw: unknown): ValidationResult {
  const parsed = PostAnalysisSchema.safeParse(raw);
  if (parsed.success) return { ok: true, data: parsed.data };
  return {
    ok: false,
    errors: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
  };
}

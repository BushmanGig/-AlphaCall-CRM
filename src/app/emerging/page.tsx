import Link from "next/link";
import { calls, isProven, runnerOf, tokens } from "@/lib/data";
import { timeAgo, usd } from "@/lib/format";
import { BAND_LABELS } from "@/lib/scoring/runnerProbability";
import { Card, ChainBadge, DeltaCell, RiskPill, ScoreBadge, SectionTitle } from "@/components/ui";
import { MeterBar, Sparkline } from "@/components/Sparkline";

export default async function EmergingTokens({
  searchParams,
}: {
  searchParams: Promise<{ chain?: string }>;
}) {
  const { chain } = await searchParams;
  const ranked = tokens
    .filter((t) => !chain || t.chain === chain)
    .map((t) => ({ t, r: runnerOf(t.id) }))
    .sort((a, b) => b.r.score - a.r.score);

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle
          right={
            <div className="flex gap-1.5">
              {["solana", "ethereum", "base"].map((c) => (
                <Link
                  key={c}
                  href={chain === c ? "/emerging" : `/emerging?chain=${c}`}
                  className={`rounded border px-2 py-0.5 text-[11px] ${chain === c ? "border-accent bg-accent/15 text-ink" : "border-line text-dim hover:text-ink"}`}
                >
                  {c}
                </Link>
              ))}
            </div>
          }
        >
          Emerging tokens — ranked by Runner Probability Score
        </SectionTitle>
        <p className="border-b border-line px-4 py-2 text-[11px] text-dim">
          The Runner Probability Score is a research ranking of emerging attention and market quality.
          It is not a prediction of returns and no token is guaranteed to rise. Every score below expands
          into its full component breakdown.
        </p>
        <ul className="divide-y divide-line/60">
          {ranked.map(({ t, r }) => {
            const proven = [...new Set(calls.filter((c) => c.tokenId === t.id && c.isMeasurable).map((c) => c.callerId))].filter(isProven).length;
            return (
              <li key={t.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/token/${t.id}`} className="text-[14px] font-bold hover:text-accent">${t.ticker}</Link>
                  <span className="text-xs text-dim">{t.name}</span>
                  <ChainBadge chain={t.chain} />
                  <span className="rounded border border-line bg-surface2 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-dim">{BAND_LABELS[r.band]}</span>
                  <span className="ml-auto"><ScoreBadge value={r.score} title="Runner Probability Score" /></span>
                </div>
                <div className="num mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-dim">
                  <span>mcap {usd(t.marketCapUsd)}</span>
                  <span>liq {usd(t.liquidityUsd)}</span>
                  <span>vol {usd(t.volume24hUsd)}</span>
                  <span>24h <DeltaCell v={t.change24h} /></span>
                  <span>{proven} proven caller{proven === 1 ? "" : "s"}</span>
                  <span>first seen {timeAgo(t.firstDetectedAt)}</span>
                  <Sparkline points={t.sparkline} width={80} height={20} label={`$${t.ticker} trend`} />
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-[11px] text-accent hover:underline">
                    Why {Math.round(r.score)}? Component breakdown, risks &amp; missing data
                  </summary>
                  <div className="mt-2 grid gap-3 rounded-md border border-line bg-surface2 p-3 lg:grid-cols-2">
                    <div className="space-y-1.5">
                      {r.components.map((c) => (
                        <div key={c.key} className="grid grid-cols-[130px_1fr_40px] items-center gap-2 text-[11px]">
                          <span className="text-dim">{c.label} ({c.weight}%)</span>
                          <MeterBar value={c.raw} />
                          <span className="num text-right">{c.raw}</span>
                        </div>
                      ))}
                      {r.riskDeductions.length > 0 && (
                        <div className="pt-1">
                          {r.riskDeductions.map((d) => (
                            <p key={d.label} className="num text-[11px] text-danger">−{d.points} {d.label}</p>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5 text-[11px]">
                      <p className="text-dim">{r.explanation.why}</p>
                      {r.explanation.positives.slice(0, 3).map((p) => (
                        <p key={p} className="text-ink">＋ {p}</p>
                      ))}
                      {r.explanation.negatives.slice(0, 3).map((p) => (
                        <p key={p} className="text-dim">－ {p}</p>
                      ))}
                      {r.explanation.missing.length > 0 && (
                        <p className="text-warn">Missing: {r.explanation.missing.join(", ")}</p>
                      )}
                      <p className="text-dim">
                        Confidence {Math.round(r.explanation.confidence * 100)}% · data {r.explanation.dataFreshness}
                      </p>
                    </div>
                  </div>
                </details>
                {t.riskFlags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {t.riskFlags.map((f) => (
                      <RiskPill key={f} tone={t.riskScore >= 60 ? "danger" : "warn"}>{f}</RiskPill>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

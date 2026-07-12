import Link from "next/link";
import { notFound } from "next/navigation";
import {
  alphaOf,
  callerById,
  calls,
  convergenceEvents,
  isProven,
  narratives,
  runnerOf,
  tokenById,
  tokens,
} from "@/lib/data";
import { mult, shortAddr, timeAgo, usd } from "@/lib/format";
import { BAND_LABELS } from "@/lib/scoring/runnerProbability";
import { MeterBar, Sparkline } from "@/components/Sparkline";
import { Card, ChainBadge, ConvergenceBadge, RiskPill, ScoreBadge, SectionTitle, TierChip, Tooltip } from "@/components/ui";

export function generateStaticParams() {
  return tokens.map((t) => ({ id: t.id }));
}

function Stat({ label, value, tooltip }: { label: string; value: string; tooltip?: string }) {
  return (
    <div className="rounded border border-line bg-surface2 px-2.5 py-1.5">
      <p className="text-[10px] text-dim">{tooltip ? <Tooltip label={tooltip}>{label}</Tooltip> : label}</p>
      <p className="num text-[13px] font-bold">{value}</p>
    </div>
  );
}

export default async function TokenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = tokenById.get(id);
  if (!token) notFound();

  const r = runnerOf(id);
  const tokenCalls = calls
    .filter((c) => c.tokenId === id && c.isMeasurable)
    .sort((a, b) => +new Date(a.calledAt) - +new Date(b.calledAt));
  const provenCallers = [...new Set(tokenCalls.map((c) => c.callerId))].filter(isProven);
  const conv = convergenceEvents.filter((e) => e.tokenId === id);
  const narrative = narratives.find((n) => n.slug === token.narrative);
  const deletedPromos = tokenCalls.filter((c) => c.deleted || c.appearsSponsored);

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4">
        <div className="flex flex-wrap items-start gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold">${token.ticker}</h1>
              <span className="text-sm text-dim">{token.name}</span>
              <ChainBadge chain={token.chain} />
              <span className="num rounded border border-line bg-surface2 px-1.5 py-0.5 text-[10px] text-dim" title={token.contractAddress}>
                {shortAddr(token.contractAddress)}
              </span>
              {token.website && (
                <a className="text-[11px] text-accent hover:underline" href={token.website} target="_blank" rel="noreferrer">website ↗</a>
              )}
            </div>
            <p className="mt-1 text-[11px] text-dim">
              launched {timeAgo(token.launchAt)} · pair created {timeAgo(token.pairCreatedAt)} · deployer{" "}
              <span className="num">{token.deployerWallet ?? "unknown"}</span> · pool {token.primaryPool ?? "—"} ·
              narrative <Link href="/narratives" className="text-accent hover:underline">{narrative?.name ?? token.narrative}</Link>
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-8">
              <Stat label="price" value={usd(token.priceUsd)} />
              <Stat label="mcap" value={usd(token.marketCapUsd)} />
              <Stat label="FDV" value={usd(token.fdvUsd)} />
              <Stat label="liquidity" value={usd(token.liquidityUsd)} />
              <Stat label="vol 24h" value={usd(token.volume24hUsd)} />
              <Stat label="holders" value={token.holderCount.toLocaleString()} />
              <Stat label="top-10 %" value={`${token.top10HolderPct.toFixed(1)}%`} tooltip="Share of supply held by the top 10 wallets" />
              <Stat label="buys/sells 1h" value={`${token.buys1h}/${token.sells1h}`} />
            </div>
          </div>
          <div className="flex gap-6 text-right">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-dim"><Tooltip label="Research ranking 0–100, fully decomposed below — not a return prediction">Runner Score</Tooltip></p>
              <p className="num text-3xl font-black">{Math.round(r.score)}</p>
              <p className="text-[10px] text-dim">{BAND_LABELS[r.band]}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-dim">Risk score</p>
              <p className={`num text-3xl font-black ${token.riskScore >= 60 ? "text-danger" : token.riskScore >= 40 ? "text-warn" : ""}`}>{token.riskScore}</p>
              <p className="text-[10px] text-dim">higher = riskier</p>
            </div>
          </div>
        </div>
        {token.riskFlags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {token.riskFlags.map((f) => (
              <RiskPill key={f} tone={token.riskScore >= 60 ? "danger" : "warn"}>{f}</RiskPill>
            ))}
          </div>
        )}
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* Price with caller pins */}
        <Card>
          <SectionTitle>Price trend · caller entries pinned</SectionTitle>
          <div className="p-4">
            <Sparkline points={token.sparkline} width={560} height={120} label={`$${token.ticker} price trend`} />
            <div className="mt-2 space-y-1">
              {tokenCalls.slice(0, 5).map((c) => {
                const caller = callerById.get(c.callerId)!;
                return (
                  <p key={c.id} className="text-[11px] text-dim">
                    <span className="num">{timeAgo(c.calledAt)}</span> —{" "}
                    <Link href={`/crm/${caller.id}`} className="text-ink hover:text-accent">@{caller.username}</Link>{" "}
                    called at {usd(c.mcapAtCall)} mcap → realistic {mult(c.realisticMultiple)} since
                    {c.deleted && <span className="text-danger"> · post later deleted</span>}
                  </p>
                );
              })}
              {tokenCalls.length === 0 && <p className="text-[11px] text-dim">No measurable calls recorded yet.</p>}
            </div>
          </div>
        </Card>

        {/* Runner decomposition */}
        <Card>
          <SectionTitle>Runner Score decomposition</SectionTitle>
          <div className="space-y-2 p-4">
            {r.components.map((c) => (
              <div key={c.key} className="grid grid-cols-[160px_1fr_40px] items-center gap-2 text-[11px]">
                <span className="text-dim">{c.label} ({c.weight}%)</span>
                <MeterBar value={c.raw} />
                <span className="num text-right">{c.raw}</span>
              </div>
            ))}
            {r.riskDeductions.map((d) => (
              <p key={d.label} className="num text-[11px] text-danger">−{d.points} {d.label}</p>
            ))}
            <p className="border-t border-line pt-2 text-[11px] text-dim">
              Confidence {Math.round(r.explanation.confidence * 100)}% · {r.explanation.dataFreshness}
              {r.explanation.missing.length > 0 && <> · missing: {r.explanation.missing.join(", ")}</>}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {/* AI thesis */}
        <Card>
          <SectionTitle>AI thesis summary</SectionTitle>
          <div className="space-y-2 p-4 text-[12px] leading-relaxed">
            <p className="text-ink">{r.explanation.why}</p>
            <p className="text-[10px] uppercase tracking-wide text-dim">Bullish evidence</p>
            {r.explanation.positives.length ? r.explanation.positives.map((p) => <p key={p} className="text-ink">＋ {p}</p>) : <p className="text-dim">None recorded.</p>}
            <p className="pt-1 text-[10px] uppercase tracking-wide text-dim">Contradictory evidence</p>
            {r.explanation.negatives.length ? r.explanation.negatives.map((p) => <p key={p} className="text-dim">－ {p}</p>) : <p className="text-dim">None recorded.</p>}
            <p className="pt-1 text-[10px] uppercase tracking-wide text-dim">Suggested monitoring</p>
            {r.explanation.monitoring.map((m) => (
              <p key={m} className="text-dim">• {m}</p>
            ))}
          </div>
        </Card>

        {/* Caller breakdown */}
        <Card>
          <SectionTitle>Caller breakdown — {provenCallers.length} proven of {new Set(tokenCalls.map((c) => c.callerId)).size}</SectionTitle>
          <ul className="divide-y divide-line/60">
            {[...new Set(tokenCalls.map((c) => c.callerId))].slice(0, 8).map((cid) => {
              const caller = callerById.get(cid)!;
              const first = tokenCalls.find((c) => c.callerId === cid)!;
              return (
                <li key={cid} className="flex items-center gap-2 px-4 py-2">
                  <Link href={`/crm/${cid}`} className="text-[12px] font-semibold hover:text-accent">@{caller.username}</Link>
                  <TierChip tier={alphaOf(cid).tier} />
                  <span className="num ml-auto text-[11px] text-dim">
                    first call {timeAgo(first.calledAt)} at {usd(first.mcapAtCall)}
                  </span>
                </li>
              );
            })}
            {tokenCalls.length === 0 && <li className="px-4 py-3 text-[11px] text-dim">No callers yet.</li>}
          </ul>
        </Card>

        {/* Convergence + audit */}
        <Card>
          <SectionTitle>Convergence &amp; audit</SectionTitle>
          <div className="space-y-3 p-4">
            {conv.length ? (
              conv.map((e) => (
                <div key={e.id} className="rounded border border-line bg-surface2 p-2.5">
                  <ConvergenceBadge c={e.classification} />
                  <p className="num mt-1.5 text-[11px] text-dim">
                    {e.callerIds.length} callers · avg α {e.avgAlphaScore} · independence {Math.round(e.independenceScore * 100)}%
                  </p>
                  <Link href="/convergence" className="text-[11px] text-accent hover:underline">full evidence →</Link>
                </div>
              ))
            ) : (
              <p className="text-[11px] text-dim">No convergence events for this token.</p>
            )}
            <div>
              <p className="text-[10px] uppercase tracking-wide text-dim">Deleted or promotion-flagged posts</p>
              {deletedPromos.length ? (
                deletedPromos.slice(0, 4).map((c) => (
                  <p key={c.id} className="mt-1 text-[11px] text-dim">
                    @{callerById.get(c.callerId)!.username} — {c.deleted ? "deleted after posting" : "sponsorship-pattern language"}; snapshot retained in the audit trail.
                  </p>
                ))
              ) : (
                <p className="mt-1 text-[11px] text-dim">None recorded.</p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

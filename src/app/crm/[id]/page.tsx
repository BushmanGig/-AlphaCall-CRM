import Link from "next/link";
import { notFound } from "next/navigation";
import { alphaOf, callerById, callers, calls, tokenById } from "@/lib/data";
import { compact, mult, timeAgo, usd } from "@/lib/format";
import { hitRate } from "@/lib/scoring/callerAlpha";
import { median } from "@/lib/scoring/stats";
import { CATEGORY_LABELS, STATUS_LABELS } from "@/lib/types";
import { MeterBar } from "@/components/Sparkline";
import { Card, ChainBadge, RiskPill, SectionTitle, TierChip, Tooltip } from "@/components/ui";

export function generateStaticParams() {
  return callers.map((c) => ({ id: c.id }));
}

export default async function CallerProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caller = callerById.get(id);
  if (!caller) notFound();
  const a = alphaOf(id);
  const own = calls
    .filter((c) => c.callerId === id && c.isMeasurable)
    .sort((x, y) => +new Date(y.calledAt) - +new Date(x.calledAt));

  const bands = [2, 5, 10, 20, 50, 100];
  const mcapBands: [string, (m: number) => boolean][] = [
    ["<$100k", (m) => m < 100_000],
    ["$100k–500k", (m) => m >= 100_000 && m < 500_000],
    ["$500k–2M", (m) => m >= 500_000 && m < 2_000_000],
    [">$2M", (m) => m >= 2_000_000],
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-line bg-surface2 text-lg font-black text-accent">
            {caller.displayName.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold">{caller.displayName}</h1>
              <span className="text-sm text-dim">@{caller.username}</span>
              <TierChip tier={a.tier} />
              {caller.verified && <span className="text-[10px] text-accent">verified</span>}
            </div>
            <p className="mt-1 max-w-2xl text-xs text-dim">{caller.bio}</p>
            <div className="num mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-dim">
              <span>{compact(caller.followers)} followers</span>
              <span>account {timeAgo(caller.accountCreatedAt).replace(" ago", " old")}</span>
              <span>chains: {caller.chains.join(", ")}</span>
              <span>narratives: {caller.narratives.join(", ")}</span>
              <span>status: {STATUS_LABELS[caller.status]}</span>
            </div>
            {(caller.status === "possible_promoter" || caller.status === "high_risk" || caller.status === "coordinated_group") && (
              <div className="mt-2"><RiskPill tone="danger">Elevated risk indicators — see behaviour panel; requires manual review before conclusions</RiskPill></div>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wide text-dim">Caller Alpha Score</p>
            <p className="num text-3xl font-black">{a.score}</p>
            <p className="num text-[10px] text-dim">
              n={a.sampleSize} · 2x-rate CI {a.ciLow}–{a.ciHigh}%
            </p>
            {a.insufficientHistory && (
              <p className="mt-1 text-[10px] text-warn">Insufficient history (&lt;10 calls) — capped at Watchlist</p>
            )}
            <div className="mt-2 flex justify-end gap-2">
              <button className="rounded border border-accent/60 bg-accent/15 px-2.5 py-1 text-[11px] text-ink">Follow</button>
              <button className="rounded border border-line px-2.5 py-1 text-[11px] text-dim">Add to list</button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* Score decomposition — every component displayed, plus penalties */}
        <Card>
          <SectionTitle>Score decomposition — nothing hidden</SectionTitle>
          <div className="space-y-2 p-4">
            {a.components.map((c) => (
              <div key={c.key} className="grid grid-cols-[190px_1fr_44px] items-center gap-2 text-[11px]">
                <span className="text-dim" title={c.explanation}>{c.label} <span className="text-[9px]">({c.weight}%)</span></span>
                <MeterBar value={c.raw} />
                <span className="num text-right">{c.raw}</span>
              </div>
            ))}
            {a.penalties.length > 0 && (
              <div className="mt-3 border-t border-line pt-2">
                <p className="mb-1 text-[10px] uppercase tracking-wide text-dim">Penalties applied</p>
                {a.penalties.map((p) => (
                  <p key={p.key} className="num text-[11px] text-danger" title={p.evidence}>
                    −{p.points} <span className="text-dim">{p.label} — {p.evidence}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Hit rates + distribution */}
        <Card>
          <SectionTitle>Hit rates &amp; distribution</SectionTitle>
          <div className="p-4">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {bands.map((b) => {
                const h = hitRate(own, b);
                return (
                  <div key={b} className="rounded border border-line bg-surface2 px-2 py-1.5 text-center">
                    <p className="text-[10px] text-dim">≥{b}x</p>
                    <p className="num text-sm font-bold">{(h.rate * 100).toFixed(0)}%</p>
                    <p className="num text-[9px] text-dim">{h.hits}/{h.n}</p>
                  </div>
                );
              })}
            </div>
            <div className="num mt-3 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
              <div className="rounded border border-line bg-surface2 p-2"><p className="text-dim">median realistic</p><p className="text-sm font-bold">{mult(median(own.map((c) => c.realisticMultiple)))}</p></div>
              <div className="rounded border border-line bg-surface2 p-2"><p className="text-dim">median mcap at call</p><p className="text-sm font-bold">{usd(median(own.map((c) => c.mcapAtCall)))}</p></div>
              <div className="rounded border border-line bg-surface2 p-2"><p className="text-dim">median time to peak</p><p className="text-sm font-bold">{Math.round(median(own.map((c) => c.timeToPeakMinutes)) / 60)}h</p></div>
              <div className="rounded border border-line bg-surface2 p-2"><p className="text-dim">deleted posts</p><p className="text-sm font-bold">{own.filter((c) => c.deleted).length}</p></div>
            </div>
            <div className="mt-3">
              <p className="mb-1 text-[10px] uppercase tracking-wide text-dim">Calls by market-cap band at call</p>
              {mcapBands.map(([label, fn]) => {
                const n = own.filter((c) => fn(c.mcapAtCall)).length;
                return (
                  <div key={label} className="grid grid-cols-[90px_1fr_30px] items-center gap-2 text-[11px]">
                    <span className="text-dim">{label}</span>
                    <MeterBar value={n} max={Math.max(own.length, 1)} />
                    <span className="num text-right">{n}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* CRM notes */}
      <Card>
        <SectionTitle right={<span className="text-[11px] text-dim">tags: {caller.tags.join(" · ") || "none"}</span>}>
          CRM — notes &amp; workflow
        </SectionTitle>
        <div className="p-4">
          {caller.notes.length === 0 ? (
            <p className="text-xs text-dim">No notes yet. Notes are team-scoped; private notes are visible only to their author.</p>
          ) : (
            caller.notes.map((n) => (
              <div key={n.id} className="mb-2 rounded border border-line bg-surface2 p-2.5 text-xs">
                <p className="text-ink">{n.body}</p>
                <p className="mt-1 text-[10px] text-dim">{n.author} · {timeAgo(n.createdAt)}{n.isPrivate ? " · private" : ""}</p>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Call history — the audit trail */}
      <Card>
        <SectionTitle>Call history &amp; audit trail — {own.length} measurable calls</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-line text-[10px] uppercase tracking-wide text-dim">
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-2 py-2 font-medium">Token</th>
                <th className="num px-2 py-2 font-medium">Mcap at call</th>
                <th className="num px-2 py-2 font-medium">Liq at call</th>
                <th className="num px-2 py-2 font-medium"><Tooltip label="Peak ÷ price at call — before liquidity adjustment">Headline</Tooltip></th>
                <th className="num px-2 py-2 font-medium"><Tooltip label="Liquidity-adjusted: slippage, tradability, spike persistence">Realistic</Tooltip></th>
                <th className="num px-2 py-2 font-medium">Now</th>
                <th className="px-2 py-2 font-medium">Class</th>
                <th className="px-2 py-2 font-medium">Outcome</th>
                <th className="px-4 py-2 font-medium">Flags</th>
              </tr>
            </thead>
            <tbody>
              {own.slice(0, 25).map((c) => {
                const t = tokenById.get(c.tokenId)!;
                return (
                  <tr key={c.id} className="border-b border-line/60 hover:bg-surface2">
                    <td className="px-4 py-2 text-dim">{timeAgo(c.calledAt)}</td>
                    <td className="px-2 py-2">
                      <Link href={`/token/${t.id}`} className="font-semibold hover:text-accent">${t.ticker}</Link>{" "}
                      <ChainBadge chain={t.chain} />
                    </td>
                    <td className="num px-2 py-2">{usd(c.mcapAtCall)}</td>
                    <td className="num px-2 py-2">{usd(c.liquidityAtCall)}</td>
                    <td className="num px-2 py-2">{mult(c.headlineMultiple)}</td>
                    <td className="num px-2 py-2 font-semibold">{mult(c.realisticMultiple)}</td>
                    <td className="num px-2 py-2">{mult(c.currentMultiple)}</td>
                    <td className="px-2 py-2 text-dim">{CATEGORY_LABELS[c.category]}</td>
                    <td className="px-2 py-2">
                      <span className={c.outcome === "rugged" ? "text-danger" : c.outcome === "profitable" ? "text-signal" : "text-dim"}>{c.outcome}</span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        {c.deleted && <RiskPill tone="danger">deleted</RiskPill>}
                        {c.appearsSponsored && <RiskPill>sponsored?</RiskPill>}
                        {!c.tradableInOut && <RiskPill>thin book</RiskPill>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

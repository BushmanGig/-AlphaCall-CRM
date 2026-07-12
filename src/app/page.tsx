import Link from "next/link";
import {
  alertEvents,
  callerById,
  feed,
  isProven,
  marketPulse,
  narratives,
  runnerOf,
  tokens,
  calls,
} from "@/lib/data";
import { compact, mult, timeAgo, usd } from "@/lib/format";
import { Sparkline } from "@/components/Sparkline";
import { Card, ChainBadge, DeltaCell, ScoreBadge, SectionTitle, TierChip, Tooltip } from "@/components/ui";
import { alphaOf } from "@/lib/data";

function PulseTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-dim">{label}</p>
      <p className="num mt-1 text-xl font-bold leading-none text-ink">{value}</p>
      {sub && <p className="mt-1 text-[11px] text-dim">{sub}</p>}
    </Card>
  );
}

export default function CommandCentre() {
  const ranked = [...tokens]
    .map((t) => ({ t, r: runnerOf(t.id) }))
    .sort((a, b) => b.r.score - a.r.score);

  const provenFeed = feed.filter((f) => isProven(f.callerId)).slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Market pulse */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <PulseTile label="Meme mentions 24h" value={compact(marketPulse.totalMentions24h)} sub={marketPulse.mentionVelocity} />
        <PulseTile label="Mention velocity" value="+38%" sub="vs prior 24h" />
        <PulseTile label="Fastest chain" value={marketPulse.fastestChain} sub="by mention growth" />
        <PulseTile label="Fastest narrative" value="Chain mascots" sub="+140% / 24h" />
        <PulseTile label="Strong signals" value={String(marketPulse.strongSignals)} sub="Runner Score ≥ 70" />
        <PulseTile label="High-risk launches" value={String(marketPulse.highRiskLaunches)} sub="risk score ≥ 60" />
        <PulseTile label="Convergences" value={String(marketPulse.convergenceCount)} sub="last 36h" />
      </section>

      {/* Emerging runners */}
      <Card>
        <SectionTitle right={<Link href="/emerging" className="text-[11px] text-accent hover:underline">open Emerging Tokens →</Link>}>
          Emerging runners
        </SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-line text-[10px] uppercase tracking-wide text-dim">
                <th className="px-4 py-2 font-medium">Token</th>
                <th className="px-2 py-2 font-medium">Chain</th>
                <th className="num px-2 py-2 font-medium">Price</th>
                <th className="num px-2 py-2 font-medium">Mcap</th>
                <th className="num px-2 py-2 font-medium">Liq</th>
                <th className="num px-2 py-2 font-medium">5m</th>
                <th className="num px-2 py-2 font-medium">1h</th>
                <th className="num px-2 py-2 font-medium">24h</th>
                <th className="num px-2 py-2 font-medium"><Tooltip label="Normalised social mention velocity, 0–100">Soc vel</Tooltip></th>
                <th className="num px-2 py-2 font-medium"><Tooltip label="Unique callers / of which proven (S or A tier)">Callers</Tooltip></th>
                <th className="num px-2 py-2 font-medium"><Tooltip label="Runner Probability Score — a 0–100 research ranking, not a prediction. Click the token for the full breakdown.">RPS</Tooltip></th>
                <th className="num px-2 py-2 font-medium"><Tooltip label="Composite risk 0–100; higher = riskier">Risk</Tooltip></th>
                <th className="px-2 py-2 font-medium">Trend</th>
                <th className="px-4 py-2 font-medium">First seen</th>
              </tr>
            </thead>
            <tbody>
              {ranked.slice(0, 8).map(({ t, r }) => {
                const tokenCalls = calls.filter((c) => c.tokenId === t.id && c.isMeasurable);
                const unique = new Set(tokenCalls.map((c) => c.callerId));
                const proven = [...unique].filter(isProven).length;
                return (
                  <tr key={t.id} className="border-b border-line/60 hover:bg-surface2">
                    <td className="px-4 py-2">
                      <Link href={`/token/${t.id}`} className="font-semibold text-ink hover:text-accent">
                        ${t.ticker}
                      </Link>
                      <span className="ml-1.5 text-dim">{t.name}</span>
                    </td>
                    <td className="px-2 py-2"><ChainBadge chain={t.chain} /></td>
                    <td className="num px-2 py-2">{usd(t.priceUsd)}</td>
                    <td className="num px-2 py-2">{usd(t.marketCapUsd)}</td>
                    <td className="num px-2 py-2">{usd(t.liquidityUsd)}</td>
                    <td className="px-2 py-2"><DeltaCell v={t.change5m} /></td>
                    <td className="px-2 py-2"><DeltaCell v={t.change1h} /></td>
                    <td className="px-2 py-2"><DeltaCell v={t.change24h} /></td>
                    <td className="num px-2 py-2">{t.socialVelocity}</td>
                    <td className="num px-2 py-2">{unique.size} <span className="text-dim">/ {proven}★</span></td>
                    <td className="px-2 py-2"><ScoreBadge value={r.score} title={r.explanation.why} /></td>
                    <td className={`num px-2 py-2 ${t.riskScore >= 60 ? "text-danger" : t.riskScore >= 40 ? "text-warn" : "text-dim"}`}>{t.riskScore}</td>
                    <td className="px-2 py-2"><Sparkline points={t.sparkline} label={`$${t.ticker} recent price`} /></td>
                    <td className="px-4 py-2 text-dim">{timeAgo(t.firstDetectedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* Proven caller activity */}
        <Card>
          <SectionTitle right={<Link href="/feed" className="text-[11px] text-accent hover:underline">live feed →</Link>}>
            Proven caller activity
          </SectionTitle>
          <ul className="divide-y divide-line/60">
            {provenFeed.map((f) => {
              const c = callerById.get(f.callerId)!;
              return (
                <li key={f.id} className="px-4 py-2.5">
                  <div className="flex items-center gap-2 text-[12px]">
                    <Link href={`/crm/${c.id}`} className="font-semibold hover:text-accent">@{c.username}</Link>
                    <TierChip tier={alphaOf(c.id).tier} />
                    <span className="ml-auto text-[10px] text-dim">{timeAgo(f.postedAt)}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[12px] text-dim">{f.text}</p>
                  {f.call?.isMeasurable && (
                    <p className="num mt-1 text-[11px] text-dim">
                      mcap at call {usd(f.call.mcapAtCall)} · since {mult(f.call.currentMultiple)}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Narrative heat map — lifecycle carries a text label, never colour alone */}
        <Card>
          <SectionTitle right={<Link href="/narratives" className="text-[11px] text-accent hover:underline">narratives →</Link>}>
            Narrative heat map
          </SectionTitle>
          <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">
            {narratives.map((n) => {
              const heat = Math.min(1, Math.max(0.08, n.growth24h));
              return (
                <Link
                  key={n.slug}
                  href="/narratives"
                  className="rounded-md border border-line p-2.5 hover:border-accent/60"
                  style={{ background: `color-mix(in oklab, var(--accent) ${Math.round(heat * 26)}%, var(--surface2))` }}
                >
                  <p className="truncate text-[12px] font-semibold">{n.name}</p>
                  <p className="num text-[11px] text-dim">{compact(n.mentions24h)} mentions · {n.growth24h >= 0 ? "+" : ""}{Math.round(n.growth24h * 100)}%</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-dim">{n.lifecycle}</p>
                </Link>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Alert timeline — every alert states why it fired */}
      <Card>
        <SectionTitle right={<Link href="/alerts" className="text-[11px] text-accent hover:underline">alert rules →</Link>}>
          Alert timeline
        </SectionTitle>
        <ul className="divide-y divide-line/60">
          {alertEvents.slice(0, 5).map((e) => (
            <li key={e.id} className="px-4 py-3">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-[12.5px] font-semibold text-ink">{e.what}</span>
                <span className="num ml-auto shrink-0 text-[10px] text-dim">{timeAgo(e.firedAt)} · conf {Math.round(e.confidence * 100)}%</span>
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-dim">
                <span className="font-semibold text-ink/80">Why: </span>{e.why}
              </p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

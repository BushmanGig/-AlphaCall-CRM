import Link from "next/link";
import type { FeedItem } from "@/lib/data";
import { alphaOf, callerById, tokenById } from "@/lib/data";
import { timeAgo, usd, mult } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/types";
import { ChainBadge, RiskPill, ScoreBadge, TierChip } from "./ui";

export function PostCard({ item }: { item: FeedItem }) {
  const caller = callerById.get(item.callerId)!;
  const alpha = alphaOf(item.callerId);
  const token = item.tokenId ? tokenById.get(item.tokenId) : null;
  const call = item.call;
  const isMeasurable = call?.isMeasurable ?? false;

  return (
    <article className="rounded-lg border border-line bg-surface p-3.5">
      <header className="flex flex-wrap items-center gap-2">
        <Link href={`/crm/${caller.id}`} className="text-[13px] font-semibold text-ink hover:text-accent">
          {caller.displayName}
        </Link>
        <span className="text-xs text-dim">@{caller.username}</span>
        <TierChip tier={alpha.tier} />
        <ScoreBadge value={alpha.score} sampleSize={alpha.sampleSize} title="Caller Alpha Score — click through to the profile for the full component breakdown" />
        <span className="ml-auto text-[11px] text-dim">{timeAgo(item.postedAt)}</span>
      </header>

      <p className="mt-2 text-[13px] leading-relaxed text-ink">{item.text}</p>

      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="rounded border border-line bg-surface2 px-1.5 py-0.5 text-dim">
          {CATEGORY_LABELS[item.category]}
        </span>
        {token && (
          <Link href={`/token/${token.id}`} className="inline-flex items-center gap-1.5 rounded border border-line bg-surface2 px-1.5 py-0.5 text-ink hover:border-accent/60">
            <ChainBadge chain={token.chain} />
            <span className="font-semibold">${token.ticker}</span>
            <span className="text-dim">{token.name}</span>
          </Link>
        )}
        {item.riskFlags.map((f) => (
          <RiskPill key={f}>{f.replaceAll("_", " ")}</RiskPill>
        ))}
      </div>

      {isMeasurable && call && (
        <div className="num mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1 rounded-md border border-line bg-surface2 px-3 py-2 text-[11px] sm:grid-cols-4">
          <div>
            <p className="text-dim">mcap at call</p>
            <p className="text-ink">{usd(call.mcapAtCall)}</p>
          </div>
          <div>
            <p className="text-dim">since call</p>
            <p className="text-ink">{mult(call.currentMultiple)}</p>
          </div>
          <div>
            <p className="text-dim" title="Peak divided by price at call — before liquidity adjustment">headline max</p>
            <p className="text-ink">{mult(call.headlineMultiple)}</p>
          </div>
          <div>
            <p className="text-dim" title="Liquidity-adjusted: slippage, tradability and spike persistence applied">realistic max</p>
            <p className="text-ink">{mult(call.realisticMultiple)}</p>
          </div>
        </div>
      )}

      <p className="mt-2 text-[11px] leading-relaxed text-dim">
        <span className="font-semibold uppercase tracking-wide">AI:</span> {item.aiExplanation}
      </p>

      <footer className="mt-2.5 flex flex-wrap gap-2 text-[11px]">
        <Link href={`/crm/${caller.id}`} className="rounded border border-line px-2 py-1 text-dim hover:border-accent/60 hover:text-ink">Add to CRM</Link>
        <Link href="/investigations" className="rounded border border-line px-2 py-1 text-dim hover:border-accent/60 hover:text-ink">Investigate</Link>
        <Link href="/alerts" className="rounded border border-line px-2 py-1 text-dim hover:border-accent/60 hover:text-ink">Create alert</Link>
        <a href={`https://x.com/${caller.username}`} target="_blank" rel="noreferrer" className="rounded border border-line px-2 py-1 text-dim hover:border-accent/60 hover:text-ink">Open on X ↗</a>
      </footer>
    </article>
  );
}

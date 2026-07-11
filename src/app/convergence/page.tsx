import Link from "next/link";
import { alphaOf, callerById, convergenceEvents, tokenById } from "@/lib/data";
import { pct, timeAgo, usd } from "@/lib/format";
import { Card, ChainBadge, ConvergenceBadge, SectionTitle, TierChip, Tooltip } from "@/components/ui";

export default function ConvergencePage() {
  const events = [...convergenceEvents].sort((a, b) => +new Date(b.detectedAt) - +new Date(a.detectedAt));
  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle>Convergence signals</SectionTitle>
        <p className="border-b border-line px-4 py-2 text-[11px] text-dim">
          Fired when multiple historically successful callers identify the same token. Strength weights
          independence over raw count — three genuinely independent calls outrank ten coordinated posts.
        </p>
        <ul className="divide-y divide-line/60">
          {events.map((e) => {
            const token = tokenById.get(e.tokenId)!;
            return (
              <li key={e.id} className="px-4 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/token/${token.id}`} className="text-[14px] font-bold hover:text-accent">${token.ticker}</Link>
                  <span className="text-xs text-dim">{token.name}</span>
                  <ChainBadge chain={token.chain} />
                  <ConvergenceBadge c={e.classification} />
                  <span className="ml-auto text-[11px] text-dim">detected {timeAgo(e.detectedAt)}</span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {e.callerIds.map((id) => {
                    const c = callerById.get(id)!;
                    return (
                      <Link key={id} href={`/crm/${id}`} className="flex items-center gap-2 rounded-md border border-line bg-surface2 px-2.5 py-1.5 hover:border-accent/60">
                        <span className="text-[12px] font-semibold">@{c.username}</span>
                        <TierChip tier={alphaOf(id).tier} />
                        <span className="num text-[11px] text-dim">α {Math.round(alphaOf(id).score)}</span>
                      </Link>
                    );
                  })}
                </div>

                <div className="num mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11px] sm:grid-cols-3 lg:grid-cols-6">
                  <div><p className="text-dim">avg Alpha</p><p>{e.avgAlphaScore}</p></div>
                  <div><p className="text-dim"><Tooltip label="1 − co-posting/shared-community overlap between these callers historically">independence</Tooltip></p><p className={e.independenceScore >= 0.65 ? "text-signal" : e.independenceScore <= 0.3 ? "text-danger" : ""}>{Math.round(e.independenceScore * 100)}%</p></div>
                  <div><p className="text-dim"><Tooltip label="Shingled text similarity across the converging posts — high similarity suggests copying">wording similarity</Tooltip></p><p className={e.wordingSimilarity >= 0.7 ? "text-danger" : ""}>{Math.round(e.wordingSimilarity * 100)}%</p></div>
                  <div><p className="text-dim">mcap at first call</p><p>{usd(e.mcapAtFirstCall)}</p></div>
                  <div><p className="text-dim">liq at convergence</p><p>{usd(e.liquidityAtConvergence)}</p></div>
                  <div><p className="text-dim">pre-convergence move</p><p>{pct(e.preConvergenceMove)}</p></div>
                </div>

                <div className="mt-2.5 space-y-1">
                  {e.evidence.map((ev) => (
                    <p key={ev} className="text-[11.5px] text-dim">• {ev}</p>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

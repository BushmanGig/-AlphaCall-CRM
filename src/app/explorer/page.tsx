import Link from "next/link";
import { runnerOf, tokens } from "@/lib/data";
import { shortAddr, timeAgo, usd } from "@/lib/format";
import { Sparkline } from "@/components/Sparkline";
import { Card, ChainBadge, DeltaCell, ScoreBadge, SectionTitle } from "@/components/ui";

export default function TokenExplorer() {
  const rows = [...tokens].sort((a, b) => b.volume24hUsd - a.volume24hUsd);
  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle right={<span className="text-[11px] text-dim">identity = chain + contract, never ticker alone</span>}>
          Token explorer — {rows.length} resolved tokens
        </SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-line text-[10px] uppercase tracking-wide text-dim">
                <th className="px-4 py-2 font-medium">Token</th>
                <th className="px-2 py-2 font-medium">Chain</th>
                <th className="px-2 py-2 font-medium">Contract</th>
                <th className="num px-2 py-2 font-medium">Price</th>
                <th className="num px-2 py-2 font-medium">Mcap</th>
                <th className="num px-2 py-2 font-medium">Liquidity</th>
                <th className="num px-2 py-2 font-medium">Vol 24h</th>
                <th className="num px-2 py-2 font-medium">Holders</th>
                <th className="num px-2 py-2 font-medium">24h</th>
                <th className="num px-2 py-2 font-medium">RPS</th>
                <th className="num px-2 py-2 font-medium">Risk</th>
                <th className="px-2 py-2 font-medium">Trend</th>
                <th className="px-4 py-2 font-medium">Age</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-b border-line/60 hover:bg-surface2">
                  <td className="px-4 py-2">
                    <Link href={`/token/${t.id}`} className="font-semibold hover:text-accent">${t.ticker}</Link>
                    <span className="ml-1.5 text-dim">{t.name}</span>
                  </td>
                  <td className="px-2 py-2"><ChainBadge chain={t.chain} /></td>
                  <td className="num px-2 py-2 text-dim" title={t.contractAddress}>{shortAddr(t.contractAddress)}</td>
                  <td className="num px-2 py-2">{usd(t.priceUsd)}</td>
                  <td className="num px-2 py-2">{usd(t.marketCapUsd)}</td>
                  <td className="num px-2 py-2">{usd(t.liquidityUsd)}</td>
                  <td className="num px-2 py-2">{usd(t.volume24hUsd)}</td>
                  <td className="num px-2 py-2">{t.holderCount.toLocaleString()}</td>
                  <td className="px-2 py-2"><DeltaCell v={t.change24h} /></td>
                  <td className="px-2 py-2"><ScoreBadge value={runnerOf(t.id).score} /></td>
                  <td className={`num px-2 py-2 ${t.riskScore >= 60 ? "text-danger" : t.riskScore >= 40 ? "text-warn" : "text-dim"}`}>{t.riskScore}</td>
                  <td className="px-2 py-2"><Sparkline points={t.sparkline} width={72} height={20} label={`$${t.ticker} trend`} /></td>
                  <td className="px-4 py-2 text-dim">{timeAgo(t.launchAt).replace(" ago", "")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

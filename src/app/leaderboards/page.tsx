import Link from "next/link";
import { alphaOf, boards, callerById } from "@/lib/data";
import { Card, EmptyState, SectionTitle, TierChip } from "@/components/ui";

export default async function Leaderboards({
  searchParams,
}: {
  searchParams: Promise<{ board?: string }>;
}) {
  const { board: boardKey } = await searchParams;
  const active = boards.find((b) => b.key === boardKey) ?? boards[0];

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle>Leaderboards — sample sizes always shown, small samples Bayesian-shrunk</SectionTitle>
        <div className="flex flex-wrap gap-1.5 p-3">
          {boards.map((b) => (
            <Link
              key={b.key}
              href={`/leaderboards?board=${b.key}`}
              className={`rounded border px-2 py-1 text-[11px] ${
                active.key === b.key ? "border-accent bg-accent/15 text-ink" : "border-line text-dim hover:border-accent/50 hover:text-ink"
              }`}
            >
              {b.title}
            </Link>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle right={<span className="text-[11px] text-dim">minimum {active.minCalls} measurable calls to qualify</span>}>
          {active.title}
        </SectionTitle>
        <p className="border-b border-line px-4 py-2 text-[11px] text-dim">{active.description}</p>
        {active.rows.length === 0 ? (
          <EmptyState
            title="No caller qualifies yet"
            body={`This board requires at least ${active.minCalls} measurable calls${active.key === "robinhood" ? " — Robinhood Chain is not yet enabled (awaiting a reliable indexer and market data)" : ""}. We show empty boards rather than padding them with unqualified samples.`}
          />
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-line text-[10px] uppercase tracking-wide text-dim">
                <th className="px-4 py-2 font-medium">#</th>
                <th className="px-2 py-2 font-medium">Caller</th>
                <th className="px-2 py-2 font-medium">Tier</th>
                <th className="num px-2 py-2 font-medium">Value</th>
                <th className="num px-2 py-2 font-medium">Sample</th>
                <th className="px-4 py-2 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {active.rows.map((r, i) => {
                const c = callerById.get(r.callerId)!;
                return (
                  <tr key={r.callerId} className="border-b border-line/60 hover:bg-surface2">
                    <td className="num px-4 py-2.5 text-dim">{i + 1}</td>
                    <td className="px-2 py-2.5">
                      <Link href={`/crm/${c.id}`} className="font-semibold hover:text-accent">{c.displayName}</Link>
                      <span className="ml-1.5 text-dim">@{c.username}</span>
                    </td>
                    <td className="px-2 py-2.5"><TierChip tier={alphaOf(c.id).tier} /></td>
                    <td className="num px-2 py-2.5 font-semibold">{r.display}</td>
                    <td className="num px-2 py-2.5 text-dim">n={r.sampleSize}</td>
                    <td className="px-4 py-2.5 text-[11px] text-dim">{r.note ?? ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

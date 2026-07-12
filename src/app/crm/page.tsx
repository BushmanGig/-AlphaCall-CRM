import Link from "next/link";
import { alphaOf, callers, calls } from "@/lib/data";
import { compact, mult } from "@/lib/format";
import { median } from "@/lib/scoring/stats";
import { STATUS_LABELS } from "@/lib/types";
import { Card, SectionTitle, ScoreBadge, TierChip, Tooltip } from "@/components/ui";

export default function CallerCrm() {
  const rows = [...callers].sort((a, b) => alphaOf(b.id).score - alphaOf(a.id).score);
  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle right={<span className="text-[11px] text-dim">{rows.length} contacts · statuses and tags are team-scoped</span>}>
          Caller CRM — every caller is a contact with a permanent scorecard
        </SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-line text-[10px] uppercase tracking-wide text-dim">
                <th className="px-4 py-2 font-medium">Caller</th>
                <th className="px-2 py-2 font-medium">Tier</th>
                <th className="num px-2 py-2 font-medium"><Tooltip label="Caller Alpha Score with sample size — open the profile for the full component breakdown">Alpha</Tooltip></th>
                <th className="num px-2 py-2 font-medium">Calls</th>
                <th className="num px-2 py-2 font-medium"><Tooltip label="Median liquidity-adjusted multiple across measurable calls">Med realistic</Tooltip></th>
                <th className="num px-2 py-2 font-medium">Followers</th>
                <th className="px-2 py-2 font-medium">Chains</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 font-medium">Tags</th>
                <th className="px-4 py-2 font-medium">Assigned</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const a = alphaOf(c.id);
                const m = calls.filter((k) => k.callerId === c.id && k.isMeasurable);
                const med = median(m.map((k) => k.realisticMultiple));
                return (
                  <tr key={c.id} className="border-b border-line/60 hover:bg-surface2">
                    <td className="px-4 py-2.5">
                      <Link href={`/crm/${c.id}`} className="font-semibold text-ink hover:text-accent">{c.displayName}</Link>
                      <span className="ml-1.5 text-dim">@{c.username}</span>
                    </td>
                    <td className="px-2 py-2.5"><TierChip tier={a.tier} /></td>
                    <td className="px-2 py-2.5"><ScoreBadge value={a.score} sampleSize={a.sampleSize} /></td>
                    <td className="num px-2 py-2.5">{m.length}</td>
                    <td className="num px-2 py-2.5">{mult(med)}</td>
                    <td className="num px-2 py-2.5">{compact(c.followers)}</td>
                    <td className="px-2 py-2.5 text-dim">{c.chains.join(", ")}</td>
                    <td className="px-2 py-2.5">
                      <span className={`rounded border px-1.5 py-0.5 text-[10px] ${
                        ["high_risk", "possible_promoter", "coordinated_group"].includes(c.status)
                          ? "border-danger/50 text-danger"
                          : ["proven_caller", "high_priority"].includes(c.status)
                            ? "border-signal/50 text-signal"
                            : "border-line text-dim"
                      }`}>
                        {STATUS_LABELS[c.status]}
                      </span>
                    </td>
                    <td className="px-2 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {c.tags.slice(0, 3).map((t) => (
                          <span key={t} className="rounded border border-line bg-surface2 px-1 py-0.5 text-[10px] text-dim">{t}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-dim">{c.assignedTo ?? "—"}</td>
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

import Link from "next/link";
import { investigations } from "@/lib/data";
import { timeAgo } from "@/lib/format";
import { Card, SectionTitle } from "@/components/ui";

export default function InvestigationsPage() {
  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle right={<span className="text-[11px] text-dim">case files linking callers, tokens, posts and wallets</span>}>
          Investigations
        </SectionTitle>
        <p className="border-b border-line px-4 py-2 text-[11px] text-dim">
          Language policy: findings use calibrated phrases — “elevated risk indicators”, “possible
          coordination”, “insufficient evidence”. No account is labelled a scammer on AI inference alone.
        </p>
        <ul className="divide-y divide-line/60">
          {investigations.map((inv) => (
            <li key={inv.id} className="px-4 py-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[13px] font-semibold">{inv.title}</p>
                <span className={`rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${
                  inv.status === "active" ? "border-warn/50 text-warn" : inv.status === "resolved" ? "border-signal/50 text-signal" : "border-line text-dim"
                }`}>
                  {inv.status}
                </span>
                <span className="ml-auto text-[10px] text-dim">
                  opened by {inv.createdBy} {timeAgo(inv.createdAt)} · updated {timeAgo(inv.updatedAt)}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {inv.subjects.map((s) => (
                  <Link
                    key={s.id}
                    href={s.kind === "caller" ? `/crm/${s.id}` : s.kind === "token" ? `/token/${s.id}` : "#"}
                    className="rounded border border-line bg-surface2 px-2 py-0.5 text-[11px] text-dim hover:border-accent/60 hover:text-ink"
                  >
                    {s.kind}: {s.label}
                  </Link>
                ))}
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-dim">{inv.findings}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

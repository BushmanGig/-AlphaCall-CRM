import Link from "next/link";
import { alertEvents, alertRules, callerById, tokenById } from "@/lib/data";
import { timeAgo } from "@/lib/format";
import { Card, SectionTitle, StatusDot } from "@/components/ui";

export default function AlertsPage() {
  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle right={<span className="text-[11px] text-dim">destinations: in-app · Telegram · Discord · email · push · webhook</span>}>
          Alert rules
        </SectionTitle>
        <ul className="divide-y divide-line/60">
          {alertRules.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
              <StatusDot live={r.enabled} label={r.enabled ? "active" : "paused"} />
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-semibold">{r.name}</p>
                <p className="text-[11px] text-dim">{r.conditionSummary}</p>
              </div>
              <div className="flex gap-1">
                {r.destinations.map((d) => (
                  <span key={d} className="rounded border border-line bg-surface2 px-1.5 py-0.5 text-[10px] text-dim">
                    {d.replace("_", "-")}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
        <p className="border-t border-line px-4 py-2 text-[11px] text-dim">
          Telegram/Discord/email/push/webhook delivery ships in Phase 2 — rules fire in-app today; external
          destinations are stored and queued but not yet delivered.
        </p>
      </Card>

      <Card>
        <SectionTitle>Alert log — every alert states what, why, evidence, risks and confidence</SectionTitle>
        <ul className="divide-y divide-line/60">
          {alertEvents.map((e) => {
            const token = e.tokenId ? tokenById.get(e.tokenId) : null;
            return (
              <li key={e.id} className="px-4 py-3.5">
                <div className="flex flex-wrap items-baseline gap-2">
                  <p className="text-[13px] font-semibold">{e.what}</p>
                  <span className="num ml-auto text-[10px] text-dim">{timeAgo(e.firedAt)} · confidence {Math.round(e.confidence * 100)}%</span>
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-dim"><span className="font-semibold text-ink/80">Why it matters: </span>{e.why}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {e.supporting.map((s) => (
                    <span key={s} className="num rounded border border-line bg-surface2 px-1.5 py-0.5 text-[10px] text-dim">{s}</span>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-warn">Risks: {e.risks}</p>
                <div className="mt-1.5 flex flex-wrap gap-3 text-[11px]">
                  {token && <Link className="text-accent hover:underline" href={`/token/${token.id}`}>${token.ticker} →</Link>}
                  {e.callerIds.map((c) => (
                    <Link key={c} className="text-accent hover:underline" href={`/crm/${c}`}>@{callerById.get(c)!.username} →</Link>
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

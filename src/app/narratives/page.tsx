import Link from "next/link";
import { callerById, narratives, tokenById } from "@/lib/data";
import { compact, timeAgo } from "@/lib/format";
import { Card, SectionTitle, Tooltip } from "@/components/ui";

const LIFECYCLE_ORDER = ["emerging", "accelerating", "mainstream", "saturated", "declining", "reviving", "dormant"] as const;

export default function NarrativesPage() {
  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle>Narrative intelligence — clusters are detected, not hand-listed</SectionTitle>
        <p className="border-b border-line px-4 py-2 text-[11px] text-dim">
          Narratives are clustered from post language and can include newly emerging themes outside any
          predefined list. Lifecycle: dormant → emerging → accelerating → mainstream → saturated → declining → reviving.
        </p>
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          {[...narratives]
            .sort((a, b) => LIFECYCLE_ORDER.indexOf(a.lifecycle) - LIFECYCLE_ORDER.indexOf(b.lifecycle))
            .map((n) => (
              <div key={n.slug} className="rounded-lg border border-line bg-surface2 p-3.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-[13px] font-bold">{n.name}</h3>
                  <span className={`rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                    n.lifecycle === "accelerating" || n.lifecycle === "emerging" ? "border-signal/50 text-signal"
                    : n.lifecycle === "declining" ? "border-warn/50 text-warn" : "border-line text-dim"
                  }`}>
                    {n.lifecycle}
                  </span>
                  <span className="num ml-auto text-[11px] text-dim">
                    {n.growth24h >= 0 ? "+" : ""}{Math.round(n.growth24h * 100)}% / 24h
                  </span>
                </div>
                <p className="num mt-1.5 text-[11px] text-dim">
                  {compact(n.mentions24h)} mentions · first detected {timeAgo(n.firstDetectedAt)} · regions {n.regions.join(", ")}
                </p>
                <p className="mt-1.5 text-[11px] text-dim">
                  <Tooltip label="Share of discussion judged organic vs coordinated (copy-paste clusters, bot swarms)">organic score</Tooltip>{" "}
                  <span className={`num ${n.organicScore < 50 ? "text-warn" : "text-ink"}`}>{n.organicScore}/100</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {n.relatedTerms.map((t) => (
                    <span key={t} className="rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] text-dim">{t}</span>
                  ))}
                </div>
                <div className="mt-2.5 border-t border-line pt-2 text-[11px]">
                  <p className="text-dim">
                    Top tokens:{" "}
                    {n.topTokenIds.map((id, i) => {
                      const t = tokenById.get(id)!;
                      return (
                        <span key={id}>
                          {i > 0 && ", "}
                          <Link href={`/token/${id}`} className="text-ink hover:text-accent">${t.ticker}</Link>
                        </span>
                      );
                    })}
                  </p>
                  <p className="mt-0.5 text-dim">
                    Top callers:{" "}
                    {n.topCallerIds.map((id, i) => (
                      <span key={id}>
                        {i > 0 && ", "}
                        <Link href={`/crm/${id}`} className="text-ink hover:text-accent">@{callerById.get(id)!.username}</Link>
                      </span>
                    ))}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}

import Link from "next/link";
import { alphaOf, callers, calls, convergenceEvents, tokens } from "@/lib/data";
import { mult } from "@/lib/format";
import { median } from "@/lib/scoring/stats";
import { Card, PhaseTag, SectionTitle } from "@/components/ui";

export default function ReportsPage() {
  const provenCount = callers.filter((c) => ["S", "A"].includes(alphaOf(c.id).tier)).length;
  const measurable = calls.filter((c) => c.isMeasurable);

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle>Weekly intelligence digest — generated from live dataset</SectionTitle>
        <div className="space-y-2 p-4 text-[12.5px] leading-relaxed">
          <p>
            Coverage: <span className="num">{callers.length}</span> tracked callers ({provenCount} proven),{" "}
            <span className="num">{tokens.length}</span> resolved tokens, <span className="num">{measurable.length}</span>{" "}
            measurable calls, <span className="num">{convergenceEvents.length}</span> convergence events.
          </p>
          <p>
            Median realistic multiple across all measurable calls:{" "}
            <span className="num font-semibold">{mult(median(measurable.map((c) => c.realisticMultiple)))}</span> — a
            reminder that most calls do not pay; caller selection and timing carry the edge.
          </p>
          <p className="text-dim">
            Notable this period: organic 3-caller convergence on <Link href="/token/t-capy" className="text-accent hover:underline">$CAPY</Link> at
            $180k market cap; FLUFF rug resolved with realistic multiples zeroed;
            possible coordinated campaign on <Link href="/token/t-moone" className="text-accent hover:underline">$MOONE</Link> under
            investigation — evidence remains insufficient for a sponsorship confirmation.
          </p>
        </div>
      </Card>

      <Card>
        <SectionTitle>Exports &amp; cohort comparisons</SectionTitle>
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Caller performance CSV", desc: "Every measurable call with attribution windows and both multiples." },
            { title: "Cohort compare", desc: "Compare saved caller lists on hit rates, timing and transparency." },
            { title: "Token post-mortems", desc: "Full timeline reconstruction for any resolved token." },
            { title: "Audit-trail export", desc: "Score changes, corrections and deletion events, signed and timestamped." },
          ].map((x) => (
            <div key={x.title} className="rounded-lg border border-line bg-surface2 p-3">
              <p className="text-[12.5px] font-semibold">{x.title}</p>
              <p className="mt-1 text-[11px] text-dim">{x.desc}</p>
              <div className="mt-2"><PhaseTag phase={3} /></div>
            </div>
          ))}
        </div>
        <p className="border-t border-line px-4 py-2 text-[11px] text-dim">
          Export endpoints are specified in the API architecture and ship with team collaboration in Phase 3 —
          shown here so the surface is honest about what exists today.
        </p>
      </Card>
    </div>
  );
}

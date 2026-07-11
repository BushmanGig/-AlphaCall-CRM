import Link from "next/link";
import { feed, alphaOf, isProven, tokenById } from "@/lib/data";
import { PostCard } from "@/components/PostCard";
import { Card, EmptyState, SectionTitle } from "@/components/ui";

// Server-rendered filters via query params: every filter is a transparent,
// shareable URL — the same mechanism the NL command bar compiles into.
const FILTERS: { key: string; label: string; options: { v: string; label: string }[] }[] = [
  { key: "chain", label: "Chain", options: [{ v: "solana", label: "Solana" }, { v: "ethereum", label: "Ethereum" }, { v: "base", label: "Base" }] },
  { key: "tier", label: "Caller tier", options: [{ v: "proven", label: "Proven (S/A)" }, { v: "watch", label: "Watchlist+" }, { v: "risk", label: "High risk" }] },
  { key: "cat", label: "Category", options: [{ v: "calls", label: "Measurable calls" }, { v: "warnings", label: "Warnings" }, { v: "promo", label: "Promotion-flagged" }] },
  { key: "extra", label: "More", options: [{ v: "contract", label: "Contract included" }, { v: "original", label: "Original only" }, { v: "lowcap", label: "Mcap < $500k at call" }] },
];

export default async function LiveFeed({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;

  const items = feed.filter((f) => {
    const token = f.tokenId ? tokenById.get(f.tokenId) : null;
    if (sp.chain && token?.chain !== sp.chain) return false;
    if (sp.tier === "proven" && !isProven(f.callerId)) return false;
    if (sp.tier === "watch" && !["watchlist", "C", "B", "A", "S"].includes(alphaOf(f.callerId).tier)) return false;
    if (sp.tier === "risk" && alphaOf(f.callerId).tier !== "high_risk") return false;
    if (sp.cat === "calls" && !f.call?.isMeasurable) return false;
    if (sp.cat === "warnings" && !["bearish_warning", "scam_warning"].includes(f.category)) return false;
    if (sp.cat === "promo" && !f.riskFlags.some((r) => /promotion|paid/.test(r))) return false;
    if (sp.extra === "contract" && !f.call?.contractSupplied) return false;
    if (sp.extra === "original" && !(f.call && f.call.originalityScore >= 60)) return false;
    if (sp.extra === "lowcap" && !(f.call && f.call.mcapAtCall < 500_000)) return false;
    return true;
  });

  const qs = (key: string, v: string) => {
    const next = new URLSearchParams();
    for (const [k, val] of Object.entries(sp)) if (val && k !== key) next.set(k, val);
    if (sp[key] !== v) next.set(key, v);
    const s = next.toString();
    return s ? `/feed?${s}` : "/feed";
  };

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle
          right={
            Object.values(sp).some(Boolean) ? (
              <Link href="/feed" className="text-[11px] text-accent hover:underline">clear filters</Link>
            ) : undefined
          }
        >
          Live intelligence feed — {items.length} posts
        </SectionTitle>
        <div className="flex flex-wrap gap-x-6 gap-y-2 px-4 py-3">
          {FILTERS.map((f) => (
            <div key={f.key} className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wide text-dim">{f.label}</span>
              {f.options.map((o) => (
                <Link
                  key={o.v}
                  href={qs(f.key, o.v)}
                  className={`rounded border px-2 py-0.5 text-[11px] ${
                    sp[f.key] === o.v
                      ? "border-accent bg-accent/15 text-ink"
                      : "border-line text-dim hover:border-accent/50 hover:text-ink"
                  }`}
                >
                  {o.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-3">
        {items.length === 0 ? (
          <Card>
            <EmptyState title="No posts match these filters" body="Loosen a filter, or wait for the next ingestion cycle — the mock stream refreshes on rebuild." />
          </Card>
        ) : (
          items.slice(0, 30).map((f) => <PostCard key={f.id} item={f} />)
        )}
      </div>
    </div>
  );
}

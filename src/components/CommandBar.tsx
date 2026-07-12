"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export interface CommandItem {
  kind: "caller" | "token" | "narrative" | "page" | "nl";
  label: string;
  sub: string;
  href: string;
  keywords: string;
}

// Natural-language requests compile to transparent, inspectable filters —
// the `sub` line shows exactly which filters will be applied.
const NL_QUERIES: CommandItem[] = [
  {
    kind: "nl",
    label: "Show Solana callers with at least five 20x calls in the past 90 days",
    sub: "→ filters: chain=solana · hits(20x)≥5 · window=90d",
    href: "/leaderboards?board=solana",
    keywords: "solana 20x callers 90 days",
  },
  {
    kind: "nl",
    label: "Find Base tokens mentioned by two A-tier callers before $500k market cap",
    sub: "→ filters: chain=base · callers(tier≥A)≥2 · mcap_at_call<500k",
    href: "/emerging?chain=base",
    keywords: "base tokens a-tier 500k",
  },
  {
    kind: "nl",
    label: "Show callers who delete more than 20% of losing posts",
    sub: "→ filters: deleted_losing_ratio>0.2 — leaderboard: most deleted losing posts",
    href: "/leaderboards?board=deleters",
    keywords: "deleted losing posts callers",
  },
  {
    kind: "nl",
    label: "Which animal narratives are accelerating today?",
    sub: "→ filters: narrative_group=animals · lifecycle=accelerating · window=24h",
    href: "/narratives",
    keywords: "animal narratives accelerating",
  },
  {
    kind: "nl",
    label: "Show tokens where social activity rose before price",
    sub: "→ filters: social_leads_price=true — timing component of Runner Score",
    href: "/emerging",
    keywords: "social before price tokens",
  },
];

export function CommandBar({ items }: { items: CommandItem[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const all = useMemo(() => [...items, ...NL_QUERIES], [items]);
  const results = useMemo(() => {
    if (!q.trim()) return all.slice(0, 9);
    const terms = q.toLowerCase().split(/\s+/);
    return all
      .filter((i) => terms.every((t) => (i.label + " " + i.keywords + " " + i.sub).toLowerCase().includes(t)))
      .slice(0, 9);
  }, [q, all]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setQ("");
        setSel(0);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const go = useCallback(
    (item: CommandItem) => {
      setOpen(false);
      router.push(item.href);
    },
    [router],
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full max-w-md items-center gap-2 rounded-md border border-line bg-surface2 px-3 py-1.5 text-left text-xs text-dim hover:border-accent/50"
      >
        <Search size={13} />
        <span className="flex-1">Search callers, tokens, contracts, narratives… or ask in plain English</span>
        <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 text-[10px]">⌘K</kbd>
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[12vh]"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-lg border border-line bg-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-line px-3">
              <Search size={14} className="text-dim" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setSel(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") setSel((s) => Math.min(s + 1, results.length - 1));
                  if (e.key === "ArrowUp") setSel((s) => Math.max(s - 1, 0));
                  if (e.key === "Enter" && results[sel]) go(results[sel]);
                }}
                placeholder="@username, $TICKER, contract, narrative, or a question…"
                className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-dim"
              />
            </div>
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.length === 0 && (
                <li className="px-4 py-6 text-center text-xs text-dim">No matches.</li>
              )}
              {results.map((r, i) => (
                <li key={r.kind + r.label}>
                  <button
                    onMouseEnter={() => setSel(i)}
                    onClick={() => go(r)}
                    className={`flex w-full items-start gap-3 px-4 py-2 text-left ${i === sel ? "bg-accent/15" : ""}`}
                  >
                    <span className="mt-0.5 w-16 shrink-0 rounded border border-line bg-surface2 px-1 py-0.5 text-center text-[9px] uppercase tracking-wide text-dim">
                      {r.kind === "nl" ? "ask" : r.kind}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] text-ink">{r.label}</span>
                      <span className="block truncate text-[11px] text-dim">{r.sub}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { CommandBar, type CommandItem } from "@/components/CommandBar";
import { MockBanner, StatusDot } from "@/components/ui";
import { callers, narratives, tokens } from "@/lib/data";
import { shortAddr } from "@/lib/format";

export const metadata: Metadata = {
  title: "AlphaCall CRM",
  description:
    "AI-powered X/Twitter intelligence, meme-coin discovery and caller-performance platform. Research and analytics only.",
};

function searchIndex(): CommandItem[] {
  return [
    ...callers.map((c) => ({
      kind: "caller" as const,
      label: `@${c.username}`,
      sub: `${c.displayName} — ${c.chains.join(", ")}`,
      href: `/crm/${c.id}`,
      keywords: `${c.displayName} ${c.narratives.join(" ")}`,
    })),
    ...tokens.map((t) => ({
      kind: "token" as const,
      label: `$${t.ticker} — ${t.name}`,
      sub: `${t.chain} · ${shortAddr(t.contractAddress)}`,
      href: `/token/${t.id}`,
      keywords: `${t.contractAddress} ${t.narrative}`,
    })),
    ...narratives.map((n) => ({
      kind: "narrative" as const,
      label: n.name,
      sub: `narrative · ${n.lifecycle}`,
      href: "/narratives",
      keywords: n.relatedTerms.join(" "),
    })),
  ];
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex h-dvh overflow-hidden bg-bg text-ink antialiased">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-4 border-b border-line bg-surface px-4 py-2.5">
            <CommandBar items={searchIndex()} />
            <div className="ml-auto flex items-center gap-4">
              <StatusDot live label="ingestion: mock stream" />
              <StatusDot live label="scores: fresh" />
            </div>
          </header>
          <main className="min-w-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[1400px] space-y-4 p-4">
              <MockBanner />
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}

import type { ReactNode } from "react";
import type { CallerTier, ConvergenceClass } from "@/lib/types";
import { CONVERGENCE_LABELS, TIER_LABELS } from "@/lib/types";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-line bg-surface ${className}`}>{children}</div>
  );
}

export function SectionTitle({
  children,
  right,
}: {
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-dim">{children}</h2>
      {right}
    </div>
  );
}

const TIER_STYLE: Record<CallerTier, string> = {
  S: "text-gold border-gold/50",
  A: "text-accent border-accent/50",
  B: "text-up border-up/50",
  C: "text-dim border-line",
  watchlist: "text-warn border-warn/50",
  high_risk: "text-danger border-danger/50",
};

export function TierChip({ tier }: { tier: CallerTier }) {
  return (
    <span
      className={`inline-flex items-center rounded border bg-surface2 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${TIER_STYLE[tier]}`}
      title={`${TIER_LABELS[tier]} — tiers combine consistency, liquidity-adjusted returns, timing and transparency; a single high return cannot reach S tier.`}
    >
      {TIER_LABELS[tier]}
    </span>
  );
}

/** Score with an always-visible sample size — no score without context. */
export function ScoreBadge({
  value,
  sampleSize,
  title,
}: {
  value: number;
  sampleSize?: number;
  title?: string;
}) {
  const tone =
    value >= 85 ? "text-signal" : value >= 70 ? "text-accent" : value >= 55 ? "text-ink" : value >= 40 ? "text-warn" : "text-danger";
  return (
    <span className="num inline-flex items-baseline gap-1" title={title}>
      <span className={`text-sm font-bold ${tone}`}>{Math.round(value)}</span>
      {sampleSize !== undefined && <span className="text-[10px] text-dim">n={sampleSize}</span>}
    </span>
  );
}

/** Routine price deltas use neutral inks — strong colour is reserved for
 * meaningful status changes. */
export function DeltaCell({ v }: { v: number }) {
  return (
    <span className={`num ${v >= 0 ? "text-up" : "text-down"}`}>
      {v >= 0 ? "+" : ""}
      {(v * 100).toFixed(Math.abs(v) < 0.1 ? 1 : 0)}%
    </span>
  );
}

export function RiskPill({ children, tone = "warn" }: { children: ReactNode; tone?: "warn" | "danger" | "dim" }) {
  const c = tone === "danger" ? "border-danger/50 text-danger" : tone === "warn" ? "border-warn/50 text-warn" : "border-line text-dim";
  return (
    <span className={`inline-flex items-center gap-1 rounded border bg-surface2 px-1.5 py-0.5 text-[10px] ${c}`}>
      <span aria-hidden>⚠</span>
      {children}
    </span>
  );
}

export function StatusDot({ live, label }: { live: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-dim">
      <span
        className={`h-1.5 w-1.5 rounded-full ${live ? "bg-signal" : "bg-warn"}`}
        aria-hidden
      />
      {label}
    </span>
  );
}

export function ChainBadge({ chain }: { chain: string }) {
  const label = chain === "solana" ? "SOL" : chain === "ethereum" ? "ETH" : chain === "base" ? "BASE" : "RHC";
  return (
    <span className="inline-flex rounded border border-line bg-surface2 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-dim">
      {label}
    </span>
  );
}

export function ConvergenceBadge({ c }: { c: ConvergenceClass }) {
  const tone =
    c === "organic" ? "border-signal/50 text-signal" : c === "uncertain" ? "border-line text-dim" : c === "copy_trading_cascade" ? "border-warn/50 text-warn" : "border-danger/50 text-danger";
  return (
    <span className={`inline-flex rounded border bg-surface2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone}`}>
      {CONVERGENCE_LABELS[c]}
    </span>
  );
}

export function MockBanner() {
  return (
    <div className="flex items-center gap-2 rounded-md border border-warn/40 bg-warn/10 px-3 py-1.5 text-[11px] text-warn">
      <span className="font-semibold uppercase tracking-wide">Mock data</span>
      <span className="text-dim">
        No provider credentials configured — serving the seeded dataset through the typed provider
        interfaces. Connect X / DexScreener keys in Settings → Providers to go live.
      </span>
    </div>
  );
}

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span title={label} className="cursor-help border-b border-dotted border-dim/60">
      {children}
    </span>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-6 py-10 text-center">
      <p className="text-sm font-medium text-ink">{title}</p>
      <p className="max-w-sm text-xs text-dim">{body}</p>
    </div>
  );
}

export function PhaseTag({ phase }: { phase: number }) {
  return (
    <span className="inline-flex rounded border border-line bg-surface2 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-dim">
      Ships in Phase {phase}
    </span>
  );
}

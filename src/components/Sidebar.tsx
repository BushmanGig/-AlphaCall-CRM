"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  FileText,
  Gauge,
  GitMerge,
  Radar,
  Search,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Command Centre", icon: Gauge },
  { href: "/feed", label: "Live Feed", icon: Activity },
  { href: "/emerging", label: "Emerging Tokens", icon: Radar },
  { href: "/convergence", label: "Convergence", icon: GitMerge },
  { href: "/crm", label: "Caller CRM", icon: Users },
  { href: "/leaderboards", label: "Leaderboards", icon: BarChart3 },
  { href: "/narratives", label: "Narratives", icon: Sparkles },
  { href: "/explorer", label: "Token Explorer", icon: Search },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/investigations", label: "Investigations", icon: AlertTriangle },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="flex w-52 shrink-0 flex-col border-r border-line bg-surface max-md:hidden">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3.5">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-accent text-[11px] font-black text-white">
          α
        </div>
        <div>
          <p className="text-[13px] font-bold leading-none tracking-tight">AlphaCall CRM</p>
          <p className="mt-0.5 text-[10px] text-dim">research &amp; analytics only</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`mx-2 flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[12.5px] ${
                active
                  ? "bg-accent/15 font-semibold text-ink"
                  : "text-dim hover:bg-surface2 hover:text-ink"
              }`}
            >
              <Icon size={14} className={active ? "text-accent" : ""} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-line px-4 py-3 text-[10px] leading-relaxed text-dim">
        Research platform. Nothing here is financial advice; no token is guaranteed to rise.
      </div>
    </aside>
  );
}

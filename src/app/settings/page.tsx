import { providerHealth } from "@/lib/providers/mock";
import { CHAINS } from "@/lib/types";
import { Card, PhaseTag, SectionTitle, StatusDot } from "@/components/ui";

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle>Providers — swap adapters without touching the UI</SectionTitle>
        <ul className="divide-y divide-line/60">
          {providerHealth.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
              <StatusDot live={p.status === "ok"} label={p.status.replaceAll("_", " ")} />
              <span className="w-36 text-[12.5px] font-semibold">{p.id}</span>
              <span className="flex-1 text-[11px] text-dim">{p.note}</span>
              {p.lastSyncAt && <span className="num text-[10px] text-dim">last sync ok</span>}
            </li>
          ))}
        </ul>
        <p className="border-t border-line px-4 py-2 text-[11px] text-dim">
          API keys are stored encrypted (envelope encryption) and never rendered back. Rate limits are
          respected per provider with token-bucket clients, retry queues and dead-letter queues; failover
          order is configurable per capability per chain.
        </p>
      </Card>

      <Card>
        <SectionTitle>Chains</SectionTitle>
        <ul className="divide-y divide-line/60">
          {Object.entries(CHAINS).map(([id, c]) => (
            <li key={id} className="flex items-center gap-3 px-4 py-2.5">
              <StatusDot live={c.enabled} label={c.enabled ? "enabled" : "pending"} />
              <span className="w-40 text-[12.5px] font-semibold">{c.name}</span>
              <span className="text-[11px] text-dim">
                {c.enabled
                  ? `explorer: ${c.explorer}`
                  : "Enabled when a reliable indexer and market-data provider are available. Tokens are keyed by (chain, contract) so activation is a registry change."}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle>Team &amp; permissions</SectionTitle>
          <div className="space-y-2 p-4 text-[12px]">
            <p className="text-dim">Workspace: <span className="text-ink">Research Desk (solo)</span></p>
            <p className="text-dim">Row-level security scopes CRM notes, tags, lists, statuses and investigations per team.</p>
            <div className="pt-1"><PhaseTag phase={3} /> <span className="ml-2 text-[11px] text-dim">multi-seat roles, assignment queues, SSO</span></div>
          </div>
        </Card>
        <Card>
          <SectionTitle>Data retention &amp; compliance</SectionTitle>
          <div className="space-y-2 p-4 text-[12px] text-dim">
            <p>Raw posts are retained for historical reconstruction, subject to X API display and storage rules — deleted X content stops being displayed while the fact of deletion feeds behaviour metrics.</p>
            <p>No protected data is scraped; no platform restrictions are bypassed. All CRM mutations are audit-logged.</p>
            <p>Appearance: dark-first; light mode follows your OS preference.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

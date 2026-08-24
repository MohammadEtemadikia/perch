import type { EnvVar } from "@/lib/types";
import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";

export function EnvironmentTab({ envVars }: { envVars: EnvVar[] }) {
  if (envVars.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-10 text-center text-[12.5px]" style={{ borderColor: "var(--border-strong)", color: "var(--text-faint)" }}>
        No environment variables detected. Run a scan from the header to check again.
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-[11.5px]" style={{ color: "var(--text-faint)" }}>
        Names only — actual values are never read, stored, or shown here.
      </p>
      <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--border)" }}>
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="border-b text-left" style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}>
              <th className="px-3 py-2 font-medium">Variable</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Scope</th>
            </tr>
          </thead>
          <tbody>
            {envVars.map((v) => (
              <tr key={v.id} className="border-b last:border-b-0" style={{ borderColor: "var(--border)" }}>
                <td className="px-3 py-2 font-mono">{v.name}</td>
                <td className="px-3 py-2">
                  <StatusCell status={v.status} />
                </td>
                <td className="px-3 py-2" style={{ color: "var(--text-faint)" }}>
                  {v.is_public ? "Public (client-exposed)" : "Server-only"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusCell({ status }: { status: EnvVar["status"] }) {
  if (status === "configured") return <Cell icon={CheckCircle2} color="var(--success)" label="Configured" />;
  if (status === "missing") return <Cell icon={XCircle} color="var(--danger)" label="Missing" />;
  return <Cell icon={HelpCircle} color="var(--text-faint)" label="Unknown" />;
}

function Cell({ icon: Icon, color, label }: { icon: React.ComponentType<{ size?: number }>; color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5" style={{ color }}>
      <Icon size={13} /> {label}
    </span>
  );
}

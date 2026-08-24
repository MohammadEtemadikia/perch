import type { BugSeverity, Health, Priority, ProjectStatus, TaskStatus } from "@/lib/types";
import type { Locale } from "@/lib/i18n/dictionaries";
import { healthLabel, priorityLabel, severityLabel, statusLabel, taskStatusLabel } from "@/lib/i18n/labels";

const HEALTH_DOT: Record<Health, string> = {
  healthy: "var(--health-healthy)",
  needs_attention: "var(--health-attention)",
  broken: "var(--health-broken)",
  archived: "var(--health-archived)",
  unknown: "var(--health-unknown)",
};

export function healthColor(health: Health): string {
  return HEALTH_DOT[health] ?? HEALTH_DOT.unknown;
}

export function HealthBadge({ health, locale = "en" }: { health: Health; locale?: Locale }) {
  const dot = HEALTH_DOT[health] ?? HEALTH_DOT.unknown;
  return (
    <span className="inline-flex items-center gap-2 text-[12.5px] font-medium" style={{ color: "var(--text)" }}>
      <span className="h-[10px] w-[10px] shrink-0 rounded-full" style={{ background: dot, boxShadow: `0 0 0 3px color-mix(in srgb, ${dot} 25%, transparent)` }} />
      {healthLabel(health, locale)}
    </span>
  );
}

function pill(bg: string, fg: string, text: string, key: string) {
  return (
    <span
      key={key}
      className="inline-flex items-center rounded-full px-2 py-[2px] text-[11px] font-medium capitalize"
      style={{ background: bg, color: fg }}
    >
      {text}
    </span>
  );
}

const STATUS_COLOR: Record<ProjectStatus, string> = {
  idea: "var(--text-faint)",
  prototype: "var(--accent)",
  development: "var(--accent)",
  active: "var(--success)",
  production: "var(--success)",
  paused: "var(--warning)",
  completed: "var(--success)",
  archived: "var(--text-faint)",
};

export function StatusBadge({ status, locale = "en" }: { status: ProjectStatus; locale?: Locale }) {
  const color = STATUS_COLOR[status] ?? "var(--text-muted)";
  return pill(`color-mix(in srgb, ${color} 16%, transparent)`, color, statusLabel(status, locale), status);
}

export function TaskStatusBadge({ status, locale = "en" }: { status: TaskStatus; locale?: Locale }) {
  return pill("var(--bg-inset)", "var(--text-muted)", taskStatusLabel(status, locale), status);
}

const PRIORITY_COLOR: Record<Priority, string> = {
  low: "var(--text-faint)",
  medium: "var(--text-muted)",
  high: "var(--warning)",
  critical: "var(--danger)",
};

export function PriorityBadge({ priority, locale = "en" }: { priority: Priority; locale?: Locale }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11.5px] font-medium" style={{ color: PRIORITY_COLOR[priority] }}>
      {priorityLabel(priority, locale)}
    </span>
  );
}

const SEVERITY_COLOR: Record<BugSeverity, string> = {
  low: "var(--text-faint)",
  medium: "var(--text-muted)",
  high: "var(--warning)",
  critical: "var(--danger)",
};

export function SeverityBadge({ severity, locale = "en" }: { severity: BugSeverity; locale?: Locale }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-[2px] text-[11px] font-semibold"
      style={{ background: `color-mix(in srgb, ${SEVERITY_COLOR[severity]} 18%, transparent)`, color: SEVERITY_COLOR[severity] }}
    >
      {severityLabel(severity, locale)}
    </span>
  );
}

export function Tag({ label }: { label: string }) {
  return pill("var(--bg-inset)", "var(--text-muted)", label, label);
}

export function parseLabels(labels: string | null): string[] {
  if (!labels) return [];
  try {
    const parsed = JSON.parse(labels);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

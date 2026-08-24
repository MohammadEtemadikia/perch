"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen } from "lucide-react";
import { Modal } from "./Modal";
import { useToast } from "./Toast";
import { useElectron } from "./ActionButtons";
import type { Health, Priority, Project, ProjectStatus, ProjectType } from "@/lib/types";

const TYPES: ProjectType[] = ["web_app", "website", "saas", "automation", "ai_tool", "mobile_app", "desktop_app", "api", "experiment", "internal_tool", "other"];
const STATUSES: ProjectStatus[] = ["idea", "prototype", "development", "active", "production", "paused", "completed", "archived"];
const PRIORITIES: Priority[] = ["low", "medium", "high", "critical"];
const HEALTHS: Health[] = ["healthy", "needs_attention", "broken", "archived", "unknown"];

const inputStyle = { background: "var(--bg-inset)", borderColor: "var(--border)" };

export function EditProjectModal({ project, tags, onClose }: { project: Project; tags: string[]; onClose: () => void }) {
  const [form, setForm] = useState({
    name: project.name,
    description: project.description ?? "",
    purpose: project.purpose ?? "",
    type: project.type,
    status: project.status,
    priority: project.priority,
    health: project.health,
    owner: project.owner ?? "",
    version: project.version ?? "",
    local_path: project.local_path ?? "",
    git_remote_url: project.git_remote_url ?? "",
    production_url: project.production_url ?? "",
    staging_url: project.staging_url ?? "",
    completion_percentage: project.completion_percentage ?? "",
    notes: project.notes ?? "",
  });
  const [tagsInput, setTagsInput] = useState(tags.join(", "));
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const isElectron = useElectron();

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function browseForFolder() {
    const result = await window.perch!.pickFolder(form.local_path || undefined);
    if (result.ok && result.path) set("local_path", result.path);
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          completion_percentage: form.completion_percentage === "" ? null : Number(form.completion_percentage),
          health_is_manual: 1,
          tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error();
      toast.push("Saved.", "success");
      router.refresh();
      onClose();
    } catch {
      toast.push("Could not save changes.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Edit ${project.name}`} onClose={onClose} width={640}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name" full>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} className="w-full rounded-md border px-2.5 py-1.5 text-[13px]" style={inputStyle} />
        </Field>
        <Field label="Description" full>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} className="w-full rounded-md border px-2.5 py-1.5 text-[13px]" style={inputStyle} />
        </Field>
        <Field label="Purpose" full>
          <textarea value={form.purpose} onChange={(e) => set("purpose", e.target.value)} rows={2} className="w-full rounded-md border px-2.5 py-1.5 text-[13px]" style={inputStyle} />
        </Field>
        <Field label="Type">
          <select value={form.type} onChange={(e) => set("type", e.target.value as ProjectType)} className="w-full rounded-md border px-2.5 py-1.5 text-[13px] capitalize" style={inputStyle}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace("_", " ")}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={(e) => set("status", e.target.value as ProjectStatus)} className="w-full rounded-md border px-2.5 py-1.5 text-[13px] capitalize" style={inputStyle}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Priority">
          <select value={form.priority} onChange={(e) => set("priority", e.target.value as Priority)} className="w-full rounded-md border px-2.5 py-1.5 text-[13px] capitalize" style={inputStyle}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Health (manual override)">
          <select value={form.health} onChange={(e) => set("health", e.target.value as Health)} className="w-full rounded-md border px-2.5 py-1.5 text-[13px] capitalize" style={inputStyle}>
            {HEALTHS.map((h) => (
              <option key={h} value={h}>
                {h.replace("_", " ")}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Owner">
          <input value={form.owner} onChange={(e) => set("owner", e.target.value)} className="w-full rounded-md border px-2.5 py-1.5 text-[13px]" style={inputStyle} />
        </Field>
        <Field label="Version">
          <input value={form.version} onChange={(e) => set("version", e.target.value)} className="w-full rounded-md border px-2.5 py-1.5 text-[13px]" style={inputStyle} />
        </Field>
        <Field label="Completion %">
          <input type="number" min={0} max={100} value={form.completion_percentage} onChange={(e) => set("completion_percentage", e.target.value)} className="w-full rounded-md border px-2.5 py-1.5 text-[13px]" style={inputStyle} />
        </Field>
        <Field label="Local path" full>
          <div className="flex gap-1.5">
            <input value={form.local_path} onChange={(e) => set("local_path", e.target.value)} className="w-full rounded-md border px-2.5 py-1.5 text-[13px]" style={inputStyle} />
            {isElectron && (
              <button
                type="button"
                onClick={browseForFolder}
                title="Choose a folder"
                className="flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12.5px] font-medium"
                style={{ borderColor: "var(--border-strong)" }}
              >
                <FolderOpen size={13} /> Browse…
              </button>
            )}
          </div>
        </Field>
        <Field label="Git remote URL">
          <input value={form.git_remote_url} onChange={(e) => set("git_remote_url", e.target.value)} className="w-full rounded-md border px-2.5 py-1.5 text-[13px]" style={inputStyle} />
        </Field>
        <Field label="Production URL">
          <input value={form.production_url} onChange={(e) => set("production_url", e.target.value)} className="w-full rounded-md border px-2.5 py-1.5 text-[13px]" style={inputStyle} />
        </Field>
        <Field label="Staging URL">
          <input value={form.staging_url} onChange={(e) => set("staging_url", e.target.value)} className="w-full rounded-md border px-2.5 py-1.5 text-[13px]" style={inputStyle} />
        </Field>
        <Field label="Tags (comma separated)">
          <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className="w-full rounded-md border px-2.5 py-1.5 text-[13px]" style={inputStyle} />
        </Field>
        <Field label="Notes" full>
          <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className="w-full rounded-md border px-2.5 py-1.5 text-[13px]" style={inputStyle} />
        </Field>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-md border px-3 py-1.5 text-[12.5px]" style={{ borderColor: "var(--border)" }}>
          Cancel
        </button>
        <button onClick={save} disabled={saving} className="rounded-md px-3 py-1.5 text-[12.5px] font-medium disabled:opacity-50" style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </Modal>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={full ? "col-span-2 block" : "block"}>
      <div className="mb-1 text-[11.5px] font-medium" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      {children}
    </label>
  );
}

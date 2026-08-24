"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "./Modal";
import { useToast } from "./Toast";
import type { ProjectStatus, ProjectType } from "@/lib/types";

const TYPES: ProjectType[] = ["web_app", "website", "saas", "automation", "ai_tool", "mobile_app", "desktop_app", "api", "experiment", "internal_tool", "other"];
const STATUSES: ProjectStatus[] = ["idea", "prototype", "development", "active", "production", "paused", "completed", "archived"];

const inputStyle = { background: "var(--bg-inset)", borderColor: "var(--border)" };

export function NewProjectModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ProjectType>("other");
  const [status, setStatus] = useState<ProjectStatus>("idea");
  const [localPath, setLocalPath] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const toast = useToast();

  async function submit() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, type, status, local_path: localPath || null }),
      });
      if (!res.ok) throw new Error(await res.text());
      const project = await res.json();
      toast.push(`Created "${project.name}"`, "success");
      router.push(`/projects/${project.slug}`);
      router.refresh();
    } catch {
      toast.push("Could not create project.", "error");
    } finally {
      setSaving(false);
      onClose();
    }
  }

  return (
    <Modal title="Create Project" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border px-2.5 py-1.5 text-[13px]" style={inputStyle} autoFocus />
        </Field>
        <Field label="Description">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded-md border px-2.5 py-1.5 text-[13px]" style={inputStyle} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <select value={type} onChange={(e) => setType(e.target.value as ProjectType)} className="w-full rounded-md border px-2.5 py-1.5 text-[13px] capitalize" style={inputStyle}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace("_", " ")}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)} className="w-full rounded-md border px-2.5 py-1.5 text-[13px] capitalize" style={inputStyle}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Local path (optional)">
          <input value={localPath} onChange={(e) => setLocalPath(e.target.value)} placeholder="/Users/you/Projects/my-app" className="w-full rounded-md border px-2.5 py-1.5 text-[13px]" style={inputStyle} />
        </Field>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-md border px-3 py-1.5 text-[12.5px]" style={{ borderColor: "var(--border)" }}>
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={!name.trim() || saving}
          className="rounded-md px-3 py-1.5 text-[12.5px] font-medium disabled:opacity-50"
          style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
        >
          {saving ? "Creating…" : "Create project"}
        </button>
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-[11.5px] font-medium" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      {children}
    </label>
  );
}
